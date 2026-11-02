"""Stage B — parse and process a LeRobot v3 dataset with the official `lerobot` loader.

Facts about the v3 layout that this module relies on (https://huggingface.co/docs/lerobot/lerobot-dataset-v3):
- meta/info.json declares fps, features (shape/dtype/names) and the data/video path templates.
- meta/episodes/chunk-XXX/file-XXX.parquet is the episode index: for every episode it stores the data
  file (chunk_index/file_index) and the global row range [dataset_from_index, dataset_to_index), plus
  for every camera the video file and the [from_timestamp, to_timestamp) segment inside that file.
- Several episodes share one parquet file and one MP4 per camera; frames of an episode are located by
  row range (tabular) and by timestamp segment (video), never by "one file per episode".
"""
from __future__ import annotations

import json
import os
import subprocess
from dataclasses import dataclass
from pathlib import Path
from typing import Any

import numpy as np
import pandas as pd
import pyarrow.parquet as pq

from . import config
from .importer import ImportRecord

# Reading a dataset that is fully present on disk never needs the Hub. Setting offline mode avoids
# accidental network calls (and long time-outs) when a file is missing; missing files are reported
# by our own checks instead.
os.environ.setdefault("HF_HUB_OFFLINE", "1")

INDEX_COLUMNS = ("timestamp", "frame_index", "episode_index", "index", "task_index")
REQUIRED_META = ("meta/info.json", "meta/tasks.parquet")


class DatasetError(Exception):
    """User-facing error raised when a dataset cannot be read."""


def read_info(dataset_root: Path) -> dict:
    p = Path(dataset_root) / "meta" / "info.json"
    try:
        return json.loads(p.read_text())
    except FileNotFoundError as e:
        raise DatasetError(f"Missing {p}") from e
    except json.JSONDecodeError as e:
        raise DatasetError(f"{p} is not valid JSON: {e}") from e


def feature_groups(info: dict) -> dict[str, list[str]]:
    """Split declared features into cameras / observations / actions / index columns / other."""
    groups: dict[str, list[str]] = {"cameras": [], "observations": [], "actions": [], "index": [], "other": []}
    for key, feat in info.get("features", {}).items():
        if feat.get("dtype") in ("video", "image"):
            groups["cameras"].append(key)
        elif key in INDEX_COLUMNS:
            groups["index"].append(key)
        elif key.startswith("observation."):
            groups["observations"].append(key)
        elif key.startswith("action"):
            groups["actions"].append(key)
        else:
            groups["other"].append(key)
    return groups


def open_dataset(dataset_root: Path, repo_id: str | None = None):
    """Open with the official loader. Raises DatasetError with the loader's own message on failure."""
    from lerobot.datasets.lerobot_dataset import LeRobotDataset

    dataset_root = Path(dataset_root)
    for rel in REQUIRED_META:
        if not (dataset_root / rel).exists():
            raise DatasetError(f"Required file missing: {rel}")
    if not any((dataset_root / "meta" / "episodes").rglob("*.parquet")):
        raise DatasetError("Required episode index missing: meta/episodes/*/*.parquet")
    info = read_info(dataset_root)
    repo_id = repo_id or info.get("repo_id") or f"local/{dataset_root.name}"
    try:
        return LeRobotDataset(repo_id, root=dataset_root)
    except Exception as e:  # the loader raises many different exception types; show the real message
        raise DatasetError(f"lerobot.LeRobotDataset could not open the dataset: {type(e).__name__}: {e}") from e


def load_episode_index(dataset_root: Path) -> pd.DataFrame:
    """Read meta/episodes/*.parquet directly (no per-feature stats columns)."""
    files = sorted((Path(dataset_root) / "meta" / "episodes").rglob("*.parquet"))
    if not files:
        raise DatasetError("No episode metadata parquet files under meta/episodes/")
    frames = []
    for f in files:
        try:
            table = pq.read_table(f)
        except Exception as e:
            raise DatasetError(f"Cannot read episode metadata {f.relative_to(dataset_root)}: {e}") from e
        cols = [c for c in table.column_names if not c.startswith("stats/")]
        frames.append(table.select(cols).to_pandas())
    df = pd.concat(frames, ignore_index=True)
    return df.sort_values("episode_index").reset_index(drop=True)


def data_file_for(info: dict, chunk_index: int, file_index: int) -> str:
    return info["data_path"].format(chunk_index=chunk_index, file_index=file_index, episode_chunk=chunk_index, episode_file=file_index)


def video_file_for(info: dict, video_key: str, chunk_index: int, file_index: int) -> str:
    return info["video_path"].format(video_key=video_key, chunk_index=chunk_index, file_index=file_index, episode_chunk=chunk_index, episode_file=file_index)


def read_episode_frames(dataset_root: Path, info: dict, episode_row: pd.Series) -> pd.DataFrame:
    """Tabular rows (states, actions, timestamps…) of one episode, read from its parquet file."""
    rel = data_file_for(info, int(episode_row["data/chunk_index"]), int(episode_row["data/file_index"]))
    path = Path(dataset_root) / rel
    try:
        table = pq.read_table(path)
    except Exception as e:
        raise DatasetError(f"Cannot read {rel}: {e}") from e
    df = table.to_pandas()
    ep = int(episode_row["episode_index"])
    return df[df["episode_index"] == ep].reset_index(drop=True)


def video_segments(info: dict, episode_row: pd.Series) -> dict[str, dict[str, Any]]:
    """For each camera: the video file and [from_timestamp, to_timestamp) segment of this episode."""
    out = {}
    for key in feature_groups(info)["cameras"]:
        if info["features"][key]["dtype"] != "video":
            continue
        ci, fi = episode_row.get(f"videos/{key}/chunk_index"), episode_row.get(f"videos/{key}/file_index")
        if ci is None or fi is None or pd.isna(ci) or pd.isna(fi):
            out[key] = {"file": None, "from_timestamp": None, "to_timestamp": None}
            continue
        out[key] = {
            "file": video_file_for(info, key, int(ci), int(fi)),
            "from_timestamp": float(episode_row[f"videos/{key}/from_timestamp"]),
            "to_timestamp": float(episode_row[f"videos/{key}/to_timestamp"]),
        }
    return out


# --------------------------------------------------------------------------------------- summaries

def _to_matrix(series: pd.Series) -> np.ndarray | None:
    try:
        return np.stack([np.asarray(v, dtype=np.float64).ravel() for v in series.to_numpy()])
    except Exception:
        return None


def numeric_summary(df: pd.DataFrame, keys: list[str], names: dict[str, list[str] | None]) -> dict[str, Any]:
    out: dict[str, Any] = {}
    for key in keys:
        if key not in df.columns:
            out[key] = {"present": False}
            continue
        m = _to_matrix(df[key])
        if m is None:
            out[key] = {"present": True, "numeric": False}
            continue
        finite = np.isfinite(m)
        with np.errstate(all="ignore"):
            out[key] = {
                "present": True,
                "numeric": True,
                "dims": int(m.shape[1]),
                "names": names.get(key),
                "min": np.where(finite.any(axis=0), np.nanmin(np.where(finite, m, np.nan), axis=0), np.nan).tolist(),
                "max": np.where(finite.any(axis=0), np.nanmax(np.where(finite, m, np.nan), axis=0), np.nan).tolist(),
                "mean": np.where(finite.any(axis=0), np.nanmean(np.where(finite, m, np.nan), axis=0), np.nan).tolist(),
                "nan_count": int(np.isnan(m).sum()),
                "inf_count": int(np.isinf(m).sum()),
            }
    return out


def _json_safe(o):
    if isinstance(o, dict):
        return {k: _json_safe(v) for k, v in o.items()}
    if isinstance(o, (list, tuple)):
        return [_json_safe(v) for v in o]
    if isinstance(o, (np.integer,)):
        return int(o)
    if isinstance(o, (np.floating, float)):
        return None if not np.isfinite(o) else float(o)
    if isinstance(o, np.ndarray):
        return _json_safe(o.tolist())
    return o


@dataclass
class ProcessResult:
    dataset_id: str
    episodes: list[dict]
    errors: list[str]


def process_dataset(record: ImportRecord, progress=None) -> ProcessResult:
    """Index every episode from the real metadata, read its rows, summarise, and save thumbnails.

    Writes working/<id>/episodes/episode_XXXXXX.json and thumbnails/<ep>/<camera>_{first,mid,last}.png.
    Originals are never touched.
    """
    root = Path(record.dataset_root)
    wd = config.working_dir(record.dataset_id)
    ep_dir = wd / "episodes"
    th_dir = wd / "thumbnails"
    ep_dir.mkdir(parents=True, exist_ok=True)
    th_dir.mkdir(parents=True, exist_ok=True)

    info = read_info(root)
    groups = feature_groups(info)
    names = {k: v.get("names") for k, v in info["features"].items()}
    fps = float(info["fps"])
    index = load_episode_index(root)
    errors: list[str] = []
    episodes: list[dict] = []

    # Official loader instance, used for frame decoding (same code path as training).
    ds = None
    try:
        ds = open_dataset(root)
    except DatasetError as e:
        errors.append(str(e))

    total = len(index)
    for i, row in index.iterrows():
        ep = int(row["episode_index"])
        if progress:
            progress((i + 1) / total, f"Episode {ep} ({i + 1}/{total})")
        summary: dict[str, Any] = {
            "episode_index": ep,
            "tasks": list(row.get("tasks", []) or []),
            "declared_length": int(row["length"]),
            "dataset_from_index": int(row["dataset_from_index"]),
            "dataset_to_index": int(row["dataset_to_index"]),
            "data_file": data_file_for(info, int(row["data/chunk_index"]), int(row["data/file_index"])),
            "videos": video_segments(info, row),
            "errors": [],
        }
        try:
            df = read_episode_frames(root, info, row)
            ts = df["timestamp"].to_numpy(dtype=np.float64) if "timestamp" in df else np.array([])
            summary.update(
                {
                    "rows_in_parquet": int(len(df)),
                    "duration_s": float(len(df) / fps) if fps else None,
                    "timestamp_first": float(ts[0]) if len(ts) else None,
                    "timestamp_last": float(ts[-1]) if len(ts) else None,
                    "observations": numeric_summary(df, groups["observations"], names),
                    "actions": numeric_summary(df, groups["actions"], names),
                    "other": numeric_summary(df, groups["other"], names),
                }
            )
        except DatasetError as e:
            summary["errors"].append(str(e))

        # Thumbnails via the official decoder: first, middle and last frame of each camera segment.
        summary["thumbnails"] = {}
        if ds is not None:
            for cam, seg in summary["videos"].items():
                if not seg["file"]:
                    continue
                thumbs = _save_thumbnails(ds, root, th_dir / f"{ep:06d}", cam, seg, summary.get("rows_in_parquet", 0), fps)
                if isinstance(thumbs, str):
                    summary["errors"].append(f"{cam}: {thumbs}")
                else:
                    summary["thumbnails"][cam] = thumbs
        summary = _json_safe(summary)
        (ep_dir / f"episode_{ep:06d}.json").write_text(json.dumps(summary, indent=2))
        episodes.append(summary)

    (wd / "process.json").write_text(
        json.dumps({"dataset_id": record.dataset_id, "episodes": len(episodes), "errors": errors, "loader_opened": ds is not None}, indent=2)
    )
    return ProcessResult(record.dataset_id, episodes, errors)


def _save_thumbnails(ds, root: Path, out_dir: Path, cam: str, seg: dict, n_rows: int, fps: float):
    """Decode 3 frames with lerobot.datasets.video_utils.decode_video_frames. Returns paths or an error string."""
    from PIL import Image
    from lerobot.datasets.video_utils import decode_video_frames

    out_dir.mkdir(parents=True, exist_ok=True)
    if n_rows <= 0:
        return "no rows to decode"
    rel = {"first": 0, "mid": (n_rows - 1) // 2, "last": n_rows - 1}
    query = [seg["from_timestamp"] + k / fps for k in rel.values()]
    try:
        frames = decode_video_frames(root / seg["file"], query, tolerance_s=1.0 / fps / 2, backend=getattr(ds, "_video_backend", None), return_uint8=True)
    except Exception as e:
        return f"decode failed at {query}: {type(e).__name__}: {e}"
    paths = {}
    for (name, _), fr in zip(rel.items(), frames):
        arr = fr.permute(1, 2, 0).numpy() if fr.ndim == 3 else fr.numpy()
        p = out_dir / f"{cam}_{name}.png"
        Image.fromarray(np.ascontiguousarray(arr)).save(p)
        paths[name] = str(p)
    return paths


def load_processed_episodes(dataset_id: str) -> list[dict]:
    ep_dir = config.working_dir(dataset_id) / "episodes"
    if not ep_dir.exists():
        return []
    return [json.loads(p.read_text()) for p in sorted(ep_dir.glob("episode_*.json"))]


def preview_clip(dataset_id: str, dataset_root: Path, cam: str, seg: dict, episode_index: int) -> Path:
    """Cut the episode's segment out of the shared MP4 into a browser-playable H.264 clip (cached).

    This is a *derived preview* for playback only; the exported dataset carries the original video.
    """
    out = config.working_dir(dataset_id) / "previews" / f"{episode_index:06d}" / f"{cam}.mp4"
    if out.exists():
        return out
    out.parent.mkdir(parents=True, exist_ok=True)
    src = Path(dataset_root) / seg["file"]
    duration = max(seg["to_timestamp"] - seg["from_timestamp"], 0.0)
    cmd = [
        "ffmpeg", "-hide_banner", "-loglevel", "error", "-y",
        "-ss", f"{seg['from_timestamp']:.6f}", "-t", f"{duration:.6f}", "-i", str(src),
        "-an", "-c:v", "libx264", "-preset", "veryfast", "-crf", "23", "-pix_fmt", "yuv420p", "-movflags", "+faststart",
        str(out),
    ]
    try:
        subprocess.run(cmd, check=True, capture_output=True, text=True, timeout=600)
    except FileNotFoundError as e:
        raise DatasetError("ffmpeg is not installed or not on PATH; it is required to cut preview clips.") from e
    except subprocess.CalledProcessError as e:
        raise DatasetError(f"ffmpeg failed to cut {seg['file']} [{seg['from_timestamp']:.3f}s, +{duration:.3f}s]: {e.stderr.strip()}") from e
    return out
