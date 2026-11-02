"""Stage C — quality validation of a LeRobot v3 dataset.

Every finding carries the actual measurement that produced it. Nothing is repaired and no score is
computed: a dataset "passes" only when there are zero error-severity findings.

Checks (ids used in the report):
  C1 files        required metadata and every data/video file referenced by the episode index exist
  C2 parquet      every data parquet reads; declared non-video features are present as columns
  C3 video        every referenced MP4 opens and its first frame decodes (PyAV); stream size matches schema
  C4 boundaries   episode row ranges are contiguous, match parquet rows, `index`/`frame_index` are consistent
  C5 timestamps   per-episode timestamps start at 0, are strictly increasing, spaced at 1/fps
  C6 shapes       action/observation values have the declared shape and dtype
  C7 finite       no NaN/Inf in numeric observations/actions
  C8 sync         video segment vs tabular rows: frame count in segment, segment duration, and decode of
                  first/last frame with the official decoder at the loader's default tolerance
Tolerances are explained in `TOLERANCES` and repeated in the report.
"""
from __future__ import annotations

import json
import math
from dataclasses import dataclass, field, asdict
from datetime import datetime, timezone
from fractions import Fraction
from pathlib import Path
from typing import Any

import numpy as np
import pandas as pd
import pyarrow.parquet as pq

from . import config
from .dataset import (
    DatasetError, data_file_for, feature_groups, load_episode_index, read_info, video_segments, REQUIRED_META,
)
from .importer import ImportRecord

NUMPY_DTYPES = {"float32": np.float32, "float64": np.float64, "int64": np.int64, "int32": np.int32, "bool": np.bool_, "int16": np.int16, "uint8": np.uint8}


def tolerances(fps: float) -> dict[str, Any]:
    frame = 1.0 / fps
    return {
        "frame_period_s": frame,
        "timestamp_spacing_error_s": frame / 2,
        "timestamp_spacing_warn_s": 1e-4,
        "loader_tolerance_s": 1e-4,
        "segment_duration_tolerance_s": frame,
        "segment_frame_count_tolerance": 1,
        "explanation": (
            f"fps={fps:g}, so one frame lasts {frame:.6f}s. Timestamp spacing deviating by more than half a "
            "frame period indicates a dropped/duplicated frame (error); smaller deviations above the loader's "
            "default tolerance_s=1e-4 are warnings. A video segment must hold the episode's frame count "
            "(±1 frame, 1 frame = warning, more = error) and last the episode duration within one frame "
            "period. The first and last frame of every segment must be decodable by "
            "lerobot.datasets.video_utils.decode_video_frames at tolerance_s=1e-4, i.e. exactly what "
            "LeRobotDataset.__getitem__ requires during training."
        ),
    }


@dataclass
class Finding:
    check: str
    severity: str  # "error" | "warning"
    scope: str  # "dataset" | "episode"
    episode_index: int | None
    message: str
    measurements: dict = field(default_factory=dict)


@dataclass
class Report:
    dataset_id: str
    dataset_root: str
    generated_at: str
    fps: float | None
    tolerances: dict
    checks: list[dict]
    findings: list[Finding]
    episodes: list[dict]
    summary: dict

    @property
    def passed(self) -> bool:
        return self.summary["errors"] == 0

    def to_dict(self) -> dict:
        d = asdict(self)
        d["passed"] = self.passed
        return d


CHECKS = [
    ("C1", "Required files exist"),
    ("C2", "Parquet data readable, declared columns present"),
    ("C3", "Videos open and decode; stream size matches schema"),
    ("C4", "Episode lengths and boundaries consistent"),
    ("C5", "Timestamps valid and ordered"),
    ("C6", "Action/observation shapes match schema"),
    ("C7", "No NaN/Inf in numeric features"),
    ("C8", "Video ↔ tabular synchronisation"),
]


class _Collector:
    def __init__(self):
        self.findings: list[Finding] = []

    def error(self, check, msg, ep=None, **m):
        self.findings.append(Finding(check, "error", "episode" if ep is not None else "dataset", ep, msg, _safe(m)))

    def warn(self, check, msg, ep=None, **m):
        self.findings.append(Finding(check, "warning", "episode" if ep is not None else "dataset", ep, msg, _safe(m)))


def _safe(m):
    out = {}
    for k, v in m.items():
        if isinstance(v, (np.integer,)):
            v = int(v)
        elif isinstance(v, (np.floating,)):
            v = float(v)
        elif isinstance(v, np.ndarray):
            v = v.tolist()
        elif isinstance(v, Path):
            v = str(v)
        if isinstance(v, float) and not math.isfinite(v):
            v = str(v)
        out[k] = v
    return out


# ------------------------------------------------------------------------------------ video probing

def probe_video(path: Path) -> dict:
    """Open with PyAV, report stream properties, decode the first frame. Raises on failure."""
    import av

    with av.open(str(path)) as container:
        if not container.streams.video:
            raise DatasetError("file has no video stream")
        s = container.streams.video[0]
        info = {
            "codec": s.codec_context.name,
            "width": s.width,
            "height": s.height,
            "pix_fmt": s.pix_fmt,
            "average_rate": float(s.average_rate) if s.average_rate else None,
            "duration_s": float(s.duration * s.time_base) if s.duration is not None else None,
            "nb_frames": s.frames or None,
        }
        decoded = False
        for frame in container.decode(s):
            arr = frame.to_ndarray(format="rgb24")
            info["first_frame_shape"] = list(arr.shape)
            decoded = True
            break
        if not decoded:
            raise DatasetError("no frame could be decoded")
    return info


def packet_timestamps(path: Path) -> np.ndarray:
    """Presentation timestamps (s) of every video packet, without decoding. Sorted ascending."""
    import av

    pts = []
    with av.open(str(path)) as container:
        s = container.streams.video[0]
        tb = Fraction(s.time_base)
        for packet in container.demux(s):
            if packet.pts is None:
                continue
            pts.append(float(packet.pts * tb))
    return np.sort(np.array(pts, dtype=np.float64))


# ----------------------------------------------------------------------------------------- the run

def validate_dataset(record: ImportRecord, progress=None) -> Report:
    root = Path(record.dataset_root)
    c = _Collector()
    now = datetime.now(timezone.utc).isoformat(timespec="seconds")

    # ---- C1 metadata files
    for rel in REQUIRED_META:
        if not (root / rel).exists():
            c.error("C1", f"Required file missing: {rel}", path=rel)
    if not (root / "meta" / "stats.json").exists():
        c.warn("C1", "meta/stats.json missing (needed for policy normalisation; optional for loading)", path="meta/stats.json")
    if not any((root / "meta" / "episodes").rglob("*.parquet")) if (root / "meta" / "episodes").exists() else True:
        c.error("C1", "Episode index missing: no parquet under meta/episodes/", path="meta/episodes")

    try:
        info = read_info(root)
    except DatasetError as e:
        c.error("C1", str(e), path="meta/info.json")
        return _finish(record, c, None, [], [], now)

    fps = info.get("fps")
    if not isinstance(fps, (int, float)) or fps <= 0:
        c.error("C1", f"info.json fps must be a positive number, got {fps!r}", fps=fps)
        return _finish(record, c, None, [], [], now)
    fps = float(fps)
    if info.get("codebase_version") != config.SUPPORTED_CODEBASE_VERSION:
        c.error("C1", f"codebase_version is {info.get('codebase_version')!r}, expected {config.SUPPORTED_CODEBASE_VERSION!r}", codebase_version=info.get("codebase_version"))
    features = info.get("features") or {}
    if not features:
        c.error("C1", "info.json declares no features")
        return _finish(record, c, fps, [], [], now)
    groups = feature_groups(info)
    for required in ("timestamp", "frame_index", "episode_index", "index"):
        if required not in features:
            c.error("C1", f"info.json features lack the mandatory '{required}' column", feature=required)
    if not groups["actions"]:
        c.warn("C1", "No action feature declared (dataset has no robot actions)")
    if not groups["observations"]:
        c.warn("C1", "No non-image observation feature declared (no robot state)")

    try:
        episodes = load_episode_index(root)
    except DatasetError as e:
        c.error("C1", str(e))
        return _finish(record, c, fps, [], [], now)

    if int(info.get("total_episodes", -1)) != len(episodes):
        c.error("C4", f"info.json total_episodes={info.get('total_episodes')} but the episode index has {len(episodes)} rows", declared=info.get("total_episodes"), indexed=len(episodes))
    if "length" in episodes and int(info.get("total_frames", -1)) != int(episodes["length"].sum()):
        c.error("C4", f"info.json total_frames={info.get('total_frames')} but episode lengths sum to {int(episodes['length'].sum())}", declared=info.get("total_frames"), indexed=int(episodes["length"].sum()))

    # ---- referenced files (C1) and per-file checks (C2, C3)
    data_files: dict[str, list[int]] = {}
    video_files: dict[tuple[str, str], list[int]] = {}
    for _, row in episodes.iterrows():
        ep = int(row["episode_index"])
        data_files.setdefault(data_file_for(info, int(row["data/chunk_index"]), int(row["data/file_index"])), []).append(ep)
        for cam, seg in video_segments(info, row).items():
            if seg["file"] is None:
                c.error("C1", f"Episode index has no video location for camera '{cam}'", ep, camera=cam)
            else:
                video_files.setdefault((cam, seg["file"]), []).append(ep)

    tabular_features = [k for k in features if k not in groups["cameras"]]
    parquet_cache: dict[str, pd.DataFrame | None] = {}
    n_steps = len(data_files) + len(video_files) + len(episodes)
    step = 0

    def tick(label):
        nonlocal step
        step += 1
        if progress:
            progress(min(step / max(n_steps, 1), 1.0), label)

    for rel, eps in data_files.items():
        tick(f"Reading {rel}")
        path = root / rel
        if not path.exists():
            c.error("C1", f"Data file missing: {rel} (episodes {eps[0]}…{eps[-1]})", path=rel, episodes=eps)
            for ep in eps:
                c.error("C2", f"Episode rows unavailable: data file {rel} is missing", ep, path=rel)
            parquet_cache[rel] = None
            continue
        try:
            df = pq.read_table(path).to_pandas()
        except Exception as e:
            c.error("C2", f"Parquet unreadable: {rel}: {type(e).__name__}: {e}", path=rel, episodes=eps)
            for ep in eps:
                c.error("C2", f"Episode rows unavailable: data file {rel} is unreadable", ep, path=rel)
            parquet_cache[rel] = None
            continue
        missing = [k for k in tabular_features if k not in df.columns]
        if missing:
            c.error("C2", f"{rel} lacks declared columns {missing}", path=rel, missing=missing, columns=list(df.columns))
        parquet_cache[rel] = df

    video_probe: dict[tuple[str, str], dict | None] = {}
    video_pts: dict[tuple[str, str], np.ndarray] = {}
    for (cam, rel), eps in video_files.items():
        tick(f"Probing {rel}")
        path = root / rel
        if not path.exists():
            c.error("C1", f"Video file missing: {rel} (camera {cam}, episodes {eps[0]}…{eps[-1]})", path=rel, camera=cam, episodes=eps)
            video_probe[(cam, rel)] = None
            continue
        try:
            pr = probe_video(path)
        except Exception as e:
            c.error("C3", f"Video unreadable: {rel}: {type(e).__name__}: {e}", path=rel, camera=cam, episodes=eps)
            video_probe[(cam, rel)] = None
            continue
        video_probe[(cam, rel)] = pr
        shape = features[cam].get("shape") or []
        if len(shape) == 3 and (pr["height"], pr["width"]) != (shape[0], shape[1]):
            c.error("C3", f"{rel}: stream is {pr['height']}x{pr['width']} but schema declares {shape[0]}x{shape[1]}", path=rel, camera=cam, stream=[pr["height"], pr["width"]], declared=shape)
        if pr["average_rate"] is not None and abs(pr["average_rate"] - fps) > 0.01:
            c.warn("C3", f"{rel}: stream frame rate {pr['average_rate']:g} differs from dataset fps {fps:g}", path=rel, camera=cam, stream_fps=pr["average_rate"], fps=fps)
        try:
            pts = packet_timestamps(path)
        except Exception as e:
            c.error("C3", f"Could not demux packets of {rel}: {type(e).__name__}: {e}", path=rel, camera=cam)
            pts = np.array([])
        video_pts[(cam, rel)] = pts
        expected = int(sum(int(episodes.loc[episodes["episode_index"] == e, "length"].iloc[0]) for e in eps))
        if len(pts) and len(pts) < expected:
            c.error("C8", f"{rel} holds {len(pts)} frames but its episodes declare {expected}", path=rel, camera=cam, frames_in_file=len(pts), expected=expected, episodes=eps)
        elif len(pts) and len(pts) > expected:
            c.warn("C8", f"{rel} holds {len(pts)} frames, more than the {expected} its episodes declare", path=rel, camera=cam, frames_in_file=len(pts), expected=expected, episodes=eps)

    # ---- per-episode checks C4..C8
    tol = tolerances(fps)
    try:
        from lerobot.datasets.video_utils import decode_video_frames, get_safe_default_video_backend
        backend = get_safe_default_video_backend()
    except Exception as e:  # pragma: no cover
        decode_video_frames = None
        backend = None
        c.warn("C8", f"lerobot video decoder unavailable, skipping official-decoder check: {e}")

    episode_results = []
    prev_to = 0
    for _, row in episodes.sort_values("episode_index").iterrows():
        ep = int(row["episode_index"])
        tick(f"Validating episode {ep}")
        length = int(row["length"])
        frm, to = int(row["dataset_from_index"]), int(row["dataset_to_index"])
        measurements: dict[str, Any] = {"declared_length": length, "from": frm, "to": to}

        # C4 boundaries
        if to - frm != length:
            c.error("C4", f"length={length} but dataset_to_index-dataset_from_index={to - frm}", ep, length=length, range_len=to - frm)
        if frm != prev_to:
            c.error("C4", f"dataset_from_index={frm} does not continue the previous episode (expected {prev_to})", ep, expected_from=prev_to, from_index=frm)
        prev_to = to
        if length <= 0:
            c.error("C4", f"Episode declares length {length}", ep, length=length)

        rel = data_file_for(info, int(row["data/chunk_index"]), int(row["data/file_index"]))
        df_all = parquet_cache.get(rel)
        df = None
        if df_all is not None and "episode_index" in df_all:
            df = df_all[df_all["episode_index"] == ep]
            measurements["rows"] = int(len(df))
            if len(df) != length:
                c.error("C4", f"{len(df)} rows in {rel} for this episode, but length={length}", ep, rows=len(df), length=length)
            if "index" in df and len(df):
                idx = df["index"].to_numpy()
                if not np.array_equal(idx, np.arange(frm, frm + len(df))):
                    c.error("C4", f"`index` column is not the contiguous range {frm}..{frm + len(df) - 1}", ep, first=int(idx[0]), last=int(idx[-1]))
            if "frame_index" in df and len(df):
                fi = df["frame_index"].to_numpy()
                if not np.array_equal(fi, np.arange(len(df))):
                    c.error("C4", "`frame_index` is not 0..length-1", ep, first=int(fi[0]), last=int(fi[-1]))

            # C5 timestamps
            if "timestamp" in df and len(df):
                ts = df["timestamp"].to_numpy(dtype=np.float64)
                diffs = np.diff(ts)
                measurements["timestamp_first"] = float(ts[0])
                measurements["timestamp_last"] = float(ts[-1])
                if len(diffs):
                    dev = np.abs(diffs - tol["frame_period_s"])
                    measurements["max_spacing_deviation_s"] = float(dev.max())
                if not np.all(np.isfinite(ts)):
                    c.error("C5", "timestamps contain NaN/Inf", ep, non_finite=int((~np.isfinite(ts)).sum()))
                else:
                    if abs(ts[0]) > tol["loader_tolerance_s"]:
                        c.warn("C5", f"first timestamp is {ts[0]:.6f}s, expected 0", ep, first=float(ts[0]))
                    if len(diffs) and np.any(diffs <= 0):
                        bad = int(np.argmax(diffs <= 0))
                        c.error("C5", f"timestamps not strictly increasing at frame {bad + 1} ({ts[bad]:.6f} → {ts[bad + 1]:.6f})", ep, frame=bad + 1, previous=float(ts[bad]), current=float(ts[bad + 1]))
                    if len(diffs):
                        if dev.max() > tol["timestamp_spacing_error_s"]:
                            k = int(dev.argmax())
                            c.error("C5", f"timestamp gap of {diffs[k]:.6f}s at frame {k + 1} (expected {tol['frame_period_s']:.6f}s, tolerance ±{tol['timestamp_spacing_error_s']:.6f}s)", ep, frame=k + 1, gap=float(diffs[k]), expected=tol["frame_period_s"])
                        elif dev.max() > tol["timestamp_spacing_warn_s"]:
                            k = int(dev.argmax())
                            c.warn("C5", f"timestamp spacing deviates by {dev.max():.6f}s at frame {k + 1} (loader tolerance 1e-4s)", ep, frame=k + 1, deviation=float(dev.max()))

            # C6 shapes/dtypes and C7 finiteness
            for key in groups["actions"] + groups["observations"] + groups["other"]:
                if key not in df.columns or not len(df):
                    continue
                feat = features[key]
                expected_n = int(np.prod(feat.get("shape") or [1]))
                vals = df[key].to_numpy()
                try:
                    mat = np.stack([np.asarray(v).ravel() for v in vals])
                except Exception as e:
                    c.error("C6", f"{key}: values are ragged or non-array ({e})", ep, feature=key)
                    continue
                if mat.shape[1] != expected_n:
                    c.error("C6", f"{key}: each row has {mat.shape[1]} values but schema shape {feat.get('shape')} needs {expected_n}", ep, feature=key, got=mat.shape[1], expected=expected_n)
                want = NUMPY_DTYPES.get(feat.get("dtype"))
                if want is not None and mat.dtype != want:
                    c.warn("C6", f"{key}: stored dtype {mat.dtype} differs from declared {feat.get('dtype')}", ep, feature=key, stored=str(mat.dtype), declared=feat.get("dtype"))
                if np.issubdtype(mat.dtype, np.number):
                    nan, inf = int(np.isnan(mat.astype(np.float64)).sum()), int(np.isinf(mat.astype(np.float64)).sum())
                    if nan or inf:
                        c.error("C7", f"{key}: {nan} NaN and {inf} Inf values", ep, feature=key, nan=nan, inf=inf)
                    else:
                        measurements.setdefault("finite_ok", []).append(key)

        # C8 sync per camera
        measurements["cameras"] = {}
        for cam, seg in video_segments(info, row).items():
            if seg["file"] is None:
                continue
            key = (cam, seg["file"])
            cm: dict[str, Any] = {"file": seg["file"], "from": seg["from_timestamp"], "to": seg["to_timestamp"]}
            measurements["cameras"][cam] = cm
            if video_probe.get(key) is None:
                c.error("C8", f"{cam}: video {seg['file']} unavailable (see C1/C3)", ep, camera=cam, path=seg["file"])
                continue
            seg_dur = seg["to_timestamp"] - seg["from_timestamp"]
            cm["segment_duration_s"] = seg_dur
            expected_dur = length / fps
            if abs(seg_dur - expected_dur) > tol["segment_duration_tolerance_s"]:
                c.error("C8", f"{cam}: video segment lasts {seg_dur:.4f}s but {length} frames at {fps:g}fps need {expected_dur:.4f}s", ep, camera=cam, segment_duration=seg_dur, expected=expected_dur)
            pts = video_pts.get(key)
            if pts is not None and len(pts):
                in_seg = int(np.count_nonzero((pts >= seg["from_timestamp"] - tol["loader_tolerance_s"]) & (pts < seg["to_timestamp"] - tol["loader_tolerance_s"])))
                cm["frames_in_segment"] = in_seg
                if abs(in_seg - length) > tol["segment_frame_count_tolerance"]:
                    c.error("C8", f"{cam}: {in_seg} video frames in segment [{seg['from_timestamp']:.3f}, {seg['to_timestamp']:.3f}) but {length} tabular rows", ep, camera=cam, frames=in_seg, rows=length)
                elif in_seg != length:
                    c.warn("C8", f"{cam}: {in_seg} video frames in segment vs {length} tabular rows (within ±1 frame)", ep, camera=cam, frames=in_seg, rows=length)
            if decode_video_frames is not None and length > 0:
                q = [seg["from_timestamp"], seg["from_timestamp"] + (length - 1) / fps]
                try:
                    frames = decode_video_frames(root / seg["file"], q, tolerance_s=tol["loader_tolerance_s"], backend=backend, return_uint8=True)
                    cm["official_decoder"] = f"ok ({list(frames.shape)})"
                except Exception as e:
                    c.error("C8", f"{cam}: official decoder cannot return frames at {q[0]:.4f}s/{q[1]:.4f}s with tolerance 1e-4: {type(e).__name__}: {str(e)[:300]}", ep, camera=cam, query=q)

        episode_results.append({"episode_index": ep, "measurements": _safe_nested(measurements)})

    return _finish(record, c, fps, episode_results, list(CHECKS), now)


def _safe_nested(o):
    if isinstance(o, dict):
        return {k: _safe_nested(v) for k, v in o.items()}
    if isinstance(o, list):
        return [_safe_nested(v) for v in o]
    if isinstance(o, np.integer):
        return int(o)
    if isinstance(o, np.floating):
        return float(o)
    return o


def _finish(record: ImportRecord, c: _Collector, fps, episode_results, checks, now) -> Report:
    # Episode status is derived from *all* findings scoped to the episode, including those raised by
    # file-level checks (missing/unreadable parquet or video) before the per-episode loop.
    for e in episode_results:
        ep_findings = [f for f in c.findings if f.episode_index == e["episode_index"]]
        e["errors"] = sum(1 for f in ep_findings if f.severity == "error")
        e["warnings"] = len(ep_findings) - e["errors"]
        e["status"] = "fail" if e["errors"] else "pass"
    errors = sum(1 for f in c.findings if f.severity == "error")
    warnings = sum(1 for f in c.findings if f.severity == "warning")
    dataset_level_errors = sum(1 for f in c.findings if f.severity == "error" and f.scope == "dataset")
    checks_out = []
    for cid, title in CHECKS:
        ce = sum(1 for f in c.findings if f.check == cid and f.severity == "error")
        cw = sum(1 for f in c.findings if f.check == cid and f.severity == "warning")
        checks_out.append({"id": cid, "title": title, "errors": ce, "warnings": cw, "status": "fail" if ce else ("warn" if cw else "pass"), "ran": bool(checks) or cid == "C1"})
    report = Report(
        dataset_id=record.dataset_id,
        dataset_root=record.dataset_root,
        generated_at=now,
        fps=fps,
        tolerances=tolerances(fps) if fps else {},
        checks=checks_out,
        findings=c.findings,
        episodes=episode_results,
        summary={
            "errors": errors,
            "warnings": warnings,
            "dataset_level_errors": dataset_level_errors,
            "episodes_checked": len(episode_results),
            "episodes_passed": sum(1 for e in episode_results if e["status"] == "pass"),
            "episodes_failed": sum(1 for e in episode_results if e["status"] == "fail"),
            "note": "An episode fails when any error-severity finding is scoped to it. Dataset-level errors (missing files, bad metadata) block the whole dataset even when individual episodes pass.",
        },
    )
    out = config.working_dir(record.dataset_id) / "validation_report.json"
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(report.to_dict(), indent=2))
    return report


def load_report(dataset_id: str) -> dict | None:
    p = config.working_dir(dataset_id) / "validation_report.json"
    return json.loads(p.read_text()) if p.exists() else None
