"""Stage E — export the accepted dataset as a LeRobot v3 ZIP and verify it reloads with the official loader.

ZIP layout:
  <dataset_id>/dataset/        byte-identical copy of the original dataset tree (meta/, data/, videos/, …)
  <dataset_id>/validation_report.json
  <dataset_id>/dataset_summary.json
  <dataset_id>/export_manifest.json   sha256 of every exported dataset file
"""
from __future__ import annotations

import hashlib
import json
import random
import shutil
import tempfile
import zipfile
from datetime import datetime, timezone
from pathlib import Path

import numpy as np

from . import config
from .dataset import DatasetError, feature_groups, load_processed_episodes, open_dataset, read_info
from .importer import ImportRecord
from .state import status
from .validate import load_report


class ExportBlocked(Exception):
    pass


def sha256(path: Path) -> str:
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


def dataset_summary(record: ImportRecord) -> dict:
    root = Path(record.dataset_root)
    info = read_info(root)
    groups = feature_groups(info)
    eps = load_processed_episodes(record.dataset_id)
    return {
        "dataset_id": record.dataset_id,
        "source": {"type": record.source_type, "value": record.source, "imported_at": record.imported_at},
        "repo_id": info.get("repo_id"),
        "robot_type": info.get("robot_type"),
        "codebase_version": info.get("codebase_version"),
        "fps": info.get("fps"),
        "total_episodes": info.get("total_episodes"),
        "total_frames": info.get("total_frames"),
        "duration_s": (info.get("total_frames") or 0) / info["fps"] if info.get("fps") else None,
        "cameras": {k: info["features"][k] for k in groups["cameras"]},
        "observations": {k: info["features"][k] for k in groups["observations"]},
        "actions": {k: info["features"][k] for k in groups["actions"]},
        "other_features": {k: info["features"][k] for k in groups["other"]},
        "size_bytes": record.size_bytes,
        "file_count": record.file_count,
        "episodes": [
            {"episode_index": e["episode_index"], "length": e.get("rows_in_parquet"), "duration_s": e.get("duration_s"), "tasks": e.get("tasks")}
            for e in eps
        ],
    }


def export_dataset(record: ImportRecord, progress=None) -> dict:
    """Build the ZIP. Raises ExportBlocked unless validation passed and the reviewer accepted."""
    st = status(record.dataset_id)
    if not st["validation_passed"]:
        raise ExportBlocked("Export blocked: validation has not passed (errors present or validation not run).")
    if st["decision"] != "accepted":
        raise ExportBlocked("Export blocked: the dataset has not been accepted by the reviewer" + (" (decision is stale: re-validate and decide again)." if st["decision_stale"] else "."))

    root = Path(record.dataset_root)
    out_dir = config.export_dir(record.dataset_id)
    if out_dir.exists():
        shutil.rmtree(out_dir)
    out_dir.mkdir(parents=True)
    stage = out_dir / "stage" / record.dataset_id
    ds_dst = stage / "dataset"
    if progress:
        progress(0.05, "Copying original dataset files…")
    shutil.copytree(root, ds_dst)

    if progress:
        progress(0.4, "Hashing files and writing reports…")
    manifest = {"files": {}, "created_at": datetime.now(timezone.utc).isoformat(timespec="seconds")}
    for p in sorted(ds_dst.rglob("*")):
        if p.is_file():
            manifest["files"][str(p.relative_to(ds_dst))] = {"sha256": sha256(p), "bytes": p.stat().st_size}
    (stage / "validation_report.json").write_text(json.dumps(load_report(record.dataset_id), indent=2))
    (stage / "dataset_summary.json").write_text(json.dumps(dataset_summary(record), indent=2))
    (stage / "export_manifest.json").write_text(json.dumps(manifest, indent=2))

    if progress:
        progress(0.6, "Writing ZIP…")
    zip_path = out_dir / f"{record.dataset_id}-lerobot-v3.zip"
    with zipfile.ZipFile(zip_path, "w", compression=zipfile.ZIP_STORED) as zf:  # MP4/parquet are already compressed
        for p in sorted(stage.rglob("*")):
            if p.is_file():
                zf.write(p, p.relative_to(out_dir / "stage"))
    shutil.rmtree(out_dir / "stage")

    if progress:
        progress(0.7, "Reloading the ZIP with lerobot.LeRobotDataset…")
    verification = verify_export(record, zip_path)
    verification["zip_path"] = str(zip_path)
    verification["zip_bytes"] = zip_path.stat().st_size
    (out_dir / "export_verification.json").write_text(json.dumps(verification, indent=2))
    if progress:
        progress(1.0, "Done")
    return verification


def verify_export(record: ImportRecord, zip_path: Path, n_samples: int = 20, seed: int = 0) -> dict:
    """Unzip to a temp dir, open with the official loader and compare with the original."""
    checks: list[dict] = []

    def add(name, ok, detail):
        checks.append({"check": name, "passed": bool(ok), "detail": detail})

    with tempfile.TemporaryDirectory(prefix="pai-verify-") as tmp:
        tmp = Path(tmp)
        with zipfile.ZipFile(zip_path) as zf:
            zf.extractall(tmp)
        extracted = tmp / record.dataset_id / "dataset"
        for rel in ("validation_report.json", "dataset_summary.json", "export_manifest.json"):
            add(f"{rel} present in ZIP", (tmp / record.dataset_id / rel).exists(), rel)

        manifest = json.loads((tmp / record.dataset_id / "export_manifest.json").read_text())
        mismatched = [rel for rel, m in manifest["files"].items() if not (extracted / rel).exists() or sha256(extracted / rel) != m["sha256"]]
        add("every exported file matches its sha256 in the manifest", not mismatched, f"{len(manifest['files'])} files, {len(mismatched)} mismatched" + (f": {mismatched[:5]}" if mismatched else ""))

        orig_root = Path(record.dataset_root)
        try:
            orig = open_dataset(orig_root)
            new = open_dataset(extracted)
        except DatasetError as e:
            add("LeRobotDataset opens the exported dataset", False, str(e))
            return {"passed": False, "checks": checks, "verified_at": datetime.now(timezone.utc).isoformat(timespec="seconds")}
        add("LeRobotDataset opens the exported dataset", True, f"{new.meta.repo_id}: {new.num_episodes} episodes, {new.num_frames} frames")
        add("frame count matches original", new.num_frames == orig.num_frames, f"exported={new.num_frames} original={orig.num_frames}")
        add("episode count matches original", new.num_episodes == orig.num_episodes, f"exported={new.num_episodes} original={orig.num_episodes}")
        add("feature schema (info.json features) identical", new.meta.features == orig.meta.features, f"{len(new.meta.features)} features")
        add("fps identical", new.meta.fps == orig.meta.fps, f"{new.meta.fps}")
        add("camera keys identical", list(new.meta.camera_keys) == list(orig.meta.camera_keys), str(list(new.meta.camera_keys)))

        o_len = [int(orig.meta.episodes[i]["length"]) for i in range(orig.num_episodes)]
        n_len = [int(new.meta.episodes[i]["length"]) for i in range(new.num_episodes)]
        add("per-episode lengths identical", o_len == n_len, f"{len(o_len)} episodes" if o_len == n_len else f"first difference at episode {next(i for i, (a, b) in enumerate(zip(o_len, n_len)) if a != b)}")

        # Sampled tabular values (no video decoding) must be bit-identical.
        rng = random.Random(seed)
        n = min(n_samples, orig.num_frames)
        sample = sorted(rng.sample(range(orig.num_frames), n)) if n else []
        keys = [k for k in orig.meta.features if k not in orig.meta.camera_keys]
        o_tab = orig.hf_dataset.with_format(None).select(sample) if sample else []
        n_tab = new.hf_dataset.with_format(None).select(sample) if sample else []
        diffs = []
        for i, (a, b) in enumerate(zip(o_tab, n_tab)):
            for k in keys:
                if not np.array_equal(np.asarray(a[k]), np.asarray(b[k])):
                    diffs.append((sample[i], k))
        add(f"{n} sampled frames: actions/states/timestamps bit-identical", not diffs, f"indices {sample[:5]}… compared on {keys}" if not diffs else f"differences at {diffs[:5]}")

        # One decoded frame per camera through the official loader must be identical too.
        if sample and orig.meta.camera_keys:
            idx = sample[0]
            try:
                a, b = orig[idx], new[idx]
                bad = [cam for cam in orig.meta.camera_keys if not np.array_equal(a[cam].numpy(), b[cam].numpy())]
                add(f"decoded camera frames at index {idx} identical", not bad, f"cameras {list(orig.meta.camera_keys)}, shapes {[list(a[c].shape) for c in orig.meta.camera_keys]}" if not bad else f"differ: {bad}")
            except Exception as e:
                add("decoded camera frames identical", False, f"{type(e).__name__}: {e}")

    return {"passed": all(c["passed"] for c in checks), "checks": checks, "verified_at": datetime.now(timezone.utc).isoformat(timespec="seconds"), "sampled_indices": sample}


def load_verification(dataset_id: str) -> dict | None:
    p = config.export_dir(dataset_id) / "export_verification.json"
    return json.loads(p.read_text()) if p.exists() else None
