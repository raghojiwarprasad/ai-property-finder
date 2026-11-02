"""Physical AI training-data MVP — Streamlit UI.

Import → Inspect → Validate → Review → Export for one LeRobot v3 dataset at a time.
Run: streamlit run app.py
"""
from __future__ import annotations

import json
import traceback
from pathlib import Path

import numpy as np
import pandas as pd
import streamlit as st

from pai import config, dataset as dsmod, export as exmod, importer, state as stmod, validate as valmod

st.set_page_config(page_title="Physical AI data MVP", page_icon="🤖", layout="wide")
config.ensure_dirs()

STAGES = ["1 · Import", "2 · Inspect", "3 · Validate", "4 · Review", "5 · Export"]


def fmt_bytes(n: int | None) -> str:
    if n is None:
        return "–"
    for unit in ("B", "KB", "MB", "GB"):
        if n < 1024:
            return f"{n:.1f} {unit}" if unit != "B" else f"{n} B"
        n /= 1024
    return f"{n:.1f} TB"


def show_exception(e: Exception, context: str) -> None:
    st.error(f"{context}: {type(e).__name__}: {e}")
    with st.expander("Traceback"):
        st.code(traceback.format_exc())


@st.cache_resource(show_spinner=False)
def cached_open(dataset_root: str):
    return dsmod.open_dataset(Path(dataset_root))


# ------------------------------------------------------------------------------------------ sidebar
datasets = importer.list_datasets()
with st.sidebar:
    st.title("🤖 Physical AI data MVP")
    st.caption("LeRobot v3 · import → inspect → validate → review → export")
    if "dataset_id" not in st.session_state and datasets:
        st.session_state.dataset_id = datasets[-1]
    current = st.selectbox("Dataset", options=["(none)"] + datasets, index=(datasets.index(st.session_state.dataset_id) + 1) if st.session_state.get("dataset_id") in datasets else 0)
    st.session_state.dataset_id = None if current == "(none)" else current
    st.session_state.setdefault("stage", STAGES[0])
    stage = st.radio("Stage", STAGES, key="stage")
    if st.session_state.dataset_id:
        s = stmod.status(st.session_state.dataset_id)
        st.divider()
        st.markdown(f"**Status:** {s['label']}")
        st.write(
            {
                "imported": s["imported"],
                "processed": s["processed"],
                "validated": s["validated"],
                "validation passed": s["validation_passed"],
                "decision": s["decision"] or ("stale" if s["decision_stale"] else None),
                "export verified": s["export_verified"],
            }
        )
    st.divider()
    st.caption(f"Storage: `{config.STORAGE_ROOT}`")


def flash(msg: str, kind: str = "success") -> None:
    st.session_state.flash = (kind, msg)
    st.rerun()


def show_flash() -> None:
    f = st.session_state.pop("flash", None)
    if f:
        getattr(st, f[0])(f[1])


def need_dataset():
    if not st.session_state.get("dataset_id"):
        st.info("Import a dataset first (stage 1).")
        st.stop()
    return importer.ImportRecord.load(st.session_state.dataset_id)


# ------------------------------------------------------------------------------------ 1 · Import
def page_import():
    st.header("1 · Import a LeRobot v3 dataset")
    show_flash()
    st.write("Upload a ZIP of a LeRobot **v3.0** dataset, or import one from the Hugging Face Hub. Files are stored untouched under `storage/original/`.")
    col1, col2 = st.columns(2)
    with col1:
        st.subheader("Upload ZIP")
        up = st.file_uploader("ZIP containing meta/, data/, videos/", type=["zip"], key="zip")
        if st.button("Import ZIP", disabled=up is None, type="primary"):
            try:
                with st.spinner("Extracting and checking the archive…"):
                    rec = importer.import_zip(up, up.name)
                st.session_state.dataset_id = rec.dataset_id
                st.success(f"Imported `{rec.dataset_id}` ({fmt_bytes(rec.size_bytes)}, {rec.file_count} files).")
                st.session_state.stage = STAGES[1]
                st.rerun()
            except importer.ImportError_ as e:
                st.error(str(e))
            except Exception as e:
                show_exception(e, "Import failed")
    with col2:
        st.subheader("Hugging Face Hub")
        repo = st.text_input("Dataset repo id or URL", placeholder="owner/name or https://huggingface.co/datasets/owner/name")
        rev = st.text_input("Revision (optional)", placeholder="main")
        if st.button("Download from Hub", disabled=not repo.strip()):
            try:
                with st.spinner(f"Downloading {repo} with huggingface_hub.snapshot_download…"):
                    rec = importer.import_huggingface(repo, revision=rev.strip() or None)
                st.session_state.dataset_id = rec.dataset_id
                st.success(f"Imported `{rec.dataset_id}` ({fmt_bytes(rec.size_bytes)}, {rec.file_count} files).")
                st.session_state.stage = STAGES[1]
                st.rerun()
            except importer.ImportError_ as e:
                st.error(str(e))
            except Exception as e:
                show_exception(e, "Hub import failed")
    st.divider()
    st.subheader("Local directory (for datasets already on this machine)")
    local = st.text_input("Path to a dataset directory containing meta/info.json", value=str(config.APP_DIR / "sample_data" / "so101_lift_3ep"))
    if st.button("Import directory"):
        try:
            with st.spinner("Copying…"):
                rec = importer.import_local_directory(Path(local))
            st.session_state.dataset_id = rec.dataset_id
            st.success(f"Imported `{rec.dataset_id}`.")
            st.session_state.stage = STAGES[1]
            st.rerun()
        except (importer.ImportError_, FileNotFoundError) as e:
            st.error(str(e))
        except Exception as e:
            show_exception(e, "Import failed")


# ----------------------------------------------------------------------------------- 2 · Inspect
def page_inspect():
    rec = need_dataset()
    st.header(f"2 · Inspect `{rec.dataset_id}`")
    show_flash()
    root = Path(rec.dataset_root)
    try:
        info = dsmod.read_info(root)
    except dsmod.DatasetError as e:
        st.error(str(e))
        st.stop()
    groups = dsmod.feature_groups(info)
    fps = info.get("fps")
    c = st.columns(6)
    c[0].metric("Source", rec.source_type)
    c[1].metric("Size", fmt_bytes(rec.size_bytes))
    c[2].metric("Episodes", info.get("total_episodes"))
    c[3].metric("Frames", info.get("total_frames"))
    c[4].metric("FPS", fps)
    c[5].metric("Duration", f"{info.get('total_frames', 0) / fps / 60:.1f} min" if fps else "–")
    st.write(
        {
            "name / repo_id": info.get("repo_id"),
            "source": rec.source,
            "robot_type": info.get("robot_type") or "not declared in info.json",
            "codebase_version": info.get("codebase_version"),
            "files": rec.file_count,
            "data_path template": info.get("data_path"),
            "video_path template": info.get("video_path"),
            "tasks": int(info.get("total_tasks", 0)),
        }
    )
    st.subheader("Schema")
    rows = []
    for key, f in info["features"].items():
        kind = "camera" if key in groups["cameras"] else "observation" if key in groups["observations"] else "action" if key in groups["actions"] else "index" if key in groups["index"] else "other"
        rows.append({"feature": key, "kind": kind, "dtype": f.get("dtype"), "shape": str(f.get("shape")), "names": ", ".join(f["names"]) if isinstance(f.get("names"), list) else str(f.get("names")), "video": json.dumps(f.get("info")) if f.get("info") else ""})
    st.dataframe(pd.DataFrame(rows), use_container_width=True, hide_index=True)
    st.caption(f"Cameras: {groups['cameras'] or 'none'} · Observations: {groups['observations'] or 'none'} · Actions: {groups['actions'] or 'none'}")

    st.subheader("Process episodes")
    st.write("Indexes every episode from `meta/episodes/*.parquet`, reads its rows from the shared parquet files, summarises states/actions and decodes first/middle/last camera frames with the official `lerobot` decoder. Originals are untouched.")
    processed = dsmod.load_processed_episodes(rec.dataset_id)
    if st.button("Process dataset" if not processed else "Re-process dataset", type="primary"):
        bar = st.progress(0.0, "Starting…")
        try:
            res = dsmod.process_dataset(rec, progress=lambda f, l: bar.progress(f, l))
            bar.progress(1.0, "Done")
            if res.errors:
                flash("Processing finished with errors:\n\n" + "\n".join(f"- {e}" for e in res.errors), "error")
            flash(f"Processed {len(res.episodes)} episodes.")
        except Exception as e:
            show_exception(e, "Processing failed")
    if processed:
        tbl = pd.DataFrame(
            [
                {
                    "episode": e["episode_index"],
                    "task": "; ".join(e.get("tasks") or []),
                    "declared length": e["declared_length"],
                    "rows read": e.get("rows_in_parquet"),
                    "duration s": round(e["duration_s"], 3) if e.get("duration_s") is not None else None,
                    "t first": e.get("timestamp_first"),
                    "t last": e.get("timestamp_last"),
                    "data file": e["data_file"],
                    "errors": "; ".join(e.get("errors") or []),
                }
                for e in processed
            ]
        )
        st.dataframe(tbl, use_container_width=True, hide_index=True)
        ep_pick = st.selectbox("Episode preview", [e["episode_index"] for e in processed], key="inspect_ep")
        e = next(x for x in processed if x["episode_index"] == ep_pick)
        for cam, thumbs in (e.get("thumbnails") or {}).items():
            st.caption(f"{cam} — {e['videos'][cam]['file']} [{e['videos'][cam]['from_timestamp']:.3f}s → {e['videos'][cam]['to_timestamp']:.3f}s]")
            cols = st.columns(3)
            for col, name in zip(cols, ("first", "mid", "last")):
                if name in thumbs and Path(thumbs[name]).exists():
                    col.image(thumbs[name], caption=name, use_container_width=True)
        if e.get("errors"):
            st.error("\n".join(e["errors"]))
        for label, key in (("Actions", "actions"), ("Observations", "observations")):
            if e.get(key):
                st.markdown(f"**{label} (episode {ep_pick})**")
                st.dataframe(_summary_table(e[key]), use_container_width=True, hide_index=True)


def _summary_table(summary: dict) -> pd.DataFrame:
    rows = []
    for feat, s in summary.items():
        if not s.get("present"):
            rows.append({"feature": feat, "dimension": "–", "min": "missing", "max": "", "mean": ""})
            continue
        if not s.get("numeric"):
            rows.append({"feature": feat, "dimension": "–", "min": "non-numeric", "max": "", "mean": ""})
            continue
        names = s.get("names") or [str(i) for i in range(s["dims"])]
        for i in range(s["dims"]):
            rows.append({"feature": feat, "dimension": names[i] if i < len(names) else str(i), "min": s["min"][i], "max": s["max"][i], "mean": s["mean"][i], "NaN": s["nan_count"], "Inf": s["inf_count"]})
    return pd.DataFrame(rows)


# ---------------------------------------------------------------------------------- 3 · Validate
def page_validate():
    rec = need_dataset()
    st.header(f"3 · Validate `{rec.dataset_id}`")
    show_flash()
    st.write("Runs eight real checks over every file and episode. Findings carry the measured values; no score is computed.")
    report = valmod.load_report(rec.dataset_id)
    if st.button("Run validation" if report is None else "Re-run validation", type="primary"):
        bar = st.progress(0.0, "Starting…")
        try:
            rep = valmod.validate_dataset(rec, progress=lambda f, l: bar.progress(f, l))
            bar.progress(1.0, "Done")
            stmod.clear_decision(rec.dataset_id)  # a new validation run invalidates earlier decisions
            flash(f"Validation finished: {rep.summary['errors']} error(s), {rep.summary['warnings']} warning(s).", "success" if rep.passed else "error")
        except Exception as e:
            show_exception(e, "Validation crashed")
    if report:
        render_report(report)


def render_report(report: dict, compact: bool = False):
    s = report["summary"]
    if report["passed"]:
        st.success(f"Validation passed: 0 errors, {s['warnings']} warning(s) · {s['episodes_passed']}/{s['episodes_checked']} episodes pass · {report['generated_at']}")
    else:
        st.error(f"Validation FAILED: {s['errors']} error(s), {s['warnings']} warning(s) · {s['episodes_passed']}/{s['episodes_checked']} episodes pass, {s['episodes_failed']} fail, {s['dataset_level_errors']} dataset-level error(s) · {report['generated_at']}")
    st.dataframe(pd.DataFrame(report["checks"])[["id", "title", "status", "errors", "warnings"]], use_container_width=True, hide_index=True)
    if report.get("tolerances"):
        with st.expander("Tolerances used"):
            st.write(report["tolerances"])
    if report["findings"]:
        st.markdown("**Findings**")
        st.dataframe(pd.DataFrame([{"severity": f["severity"], "check": f["check"], "episode": f["episode_index"], "message": f["message"], "measurements": json.dumps(f["measurements"])} for f in report["findings"]]), use_container_width=True, hide_index=True)
    else:
        st.write("No findings.")
    if not compact and report["episodes"]:
        st.markdown("**Per-episode results**")
        rows = []
        for e in report["episodes"]:
            m = e["measurements"]
            cams = m.get("cameras", {})
            rows.append({"episode": e["episode_index"], "status": e["status"], "errors": e["errors"], "warnings": e["warnings"], "rows": m.get("rows"), "declared": m.get("declared_length"), "t_last": m.get("timestamp_last"), "max Δt dev (s)": m.get("max_spacing_deviation_s"), **{f"{c} frames": v.get("frames_in_segment") for c, v in cams.items()}, **{f"{c} decoder": v.get("official_decoder", "–") for c, v in cams.items()}})
        st.dataframe(pd.DataFrame(rows), use_container_width=True, hide_index=True)
    st.download_button("Download validation_report.json", json.dumps(report, indent=2), file_name="validation_report.json", mime="application/json")


# ------------------------------------------------------------------------------------ 4 · Review
def page_review():
    rec = need_dataset()
    st.header(f"4 · Review `{rec.dataset_id}` as a buyer")
    show_flash()
    root = Path(rec.dataset_root)
    info = dsmod.read_info(root)
    groups = dsmod.feature_groups(info)
    report = valmod.load_report(rec.dataset_id)
    processed = dsmod.load_processed_episodes(rec.dataset_id)
    if not processed:
        st.warning("Dataset not processed yet — go to stage 2 and press “Process dataset”.")
    if report is None:
        st.warning("Dataset not validated yet — go to stage 3 and press “Run validation”.")

    st.subheader("What you get")
    fps = info["fps"]
    c = st.columns(5)
    c[0].metric("Episodes", info["total_episodes"])
    c[1].metric("Frames", info["total_frames"])
    c[2].metric("Minutes", f"{info['total_frames'] / fps / 60:.1f}")
    c[3].metric("Cameras", len(groups["cameras"]))
    c[4].metric("Robot", info.get("robot_type") or "unknown")
    avail, missing = [], []
    for label, keys in (("camera streams", groups["cameras"]), ("robot state observations", groups["observations"]), ("robot actions", groups["actions"])):
        (avail if keys else missing).append(f"{label}: {', '.join(keys) if keys else 'none declared'}")
    if not info.get("robot_type"):
        missing.append("robot_type (not declared in info.json)")
    if not (root / "meta" / "stats.json").exists():
        missing.append("meta/stats.json (normalisation statistics)")
    tasks = {t for e in processed for t in (e.get("tasks") or [])}
    avail.append(f"language task labels: {len(tasks)} distinct" if tasks else "language task labels: none")
    depth = [k for k in groups["cameras"] if info["features"][k].get("info", {}).get("video.is_depth_map")]
    missing.append("depth streams (none)") if not depth else avail.append(f"depth streams: {depth}")
    missing.append("force/torque or tactile sensing (no feature declared)") if not any("force" in k or "torque" in k or "tactile" in k for k in info["features"]) else None
    col1, col2 = st.columns(2)
    col1.markdown("**Available**\n\n" + "\n".join(f"- ✅ {a}" for a in avail))
    col2.markdown("**Not included**\n\n" + "\n".join(f"- ⛔ {m}" for m in missing))
    if tasks:
        st.caption("Tasks: " + " · ".join(sorted(tasks)))

    if report:
        st.subheader("Quality report")
        render_report(report, compact=True)

    st.subheader("Episode inspector")
    if processed:
        ep_ids = [e["episode_index"] for e in processed]
        statuses = {e["episode_index"]: e["status"] for e in report["episodes"]} if report else {}
        ep = st.selectbox("Episode", ep_ids, format_func=lambda i: f"episode {i} — {statuses.get(i, 'not validated')}")
        e = next(x for x in processed if x["episode_index"] == ep)
        st.write({"task": e.get("tasks"), "frames": e.get("rows_in_parquet"), "duration s": e.get("duration_s"), "global index range": [e["dataset_from_index"], e["dataset_to_index"]], "data file": e["data_file"]})
        if report:
            ep_findings = [f for f in report["findings"] if f["episode_index"] == ep]
            if ep_findings:
                for f in ep_findings:
                    (st.error if f["severity"] == "error" else st.warning)(f"[{f['check']}] {f['message']}")
            else:
                st.success("No findings for this episode.")
        cams = [k for k, v in e["videos"].items() if v["file"]]
        if cams:
            cam = st.selectbox("Camera", cams)
            seg = e["videos"][cam]
            st.caption(f"Original: `{seg['file']}` segment {seg['from_timestamp']:.3f}s → {seg['to_timestamp']:.3f}s. The player shows an H.264 preview clip cut from that segment; the export contains the original video.")
            if st.button("Load preview clip", key=f"clip-{ep}-{cam}") or (config.working_dir(rec.dataset_id) / "previews" / f"{ep:06d}" / f"{cam}.mp4").exists():
                try:
                    with st.spinner("Cutting preview clip with ffmpeg…"):
                        clip = dsmod.preview_clip(rec.dataset_id, root, cam, seg, ep)
                    st.video(str(clip))
                except dsmod.DatasetError as ex:
                    st.error(str(ex))
        try:
            rowdf = dsmod.read_episode_frames(root, info, _episode_row(root, ep))
        except dsmod.DatasetError as ex:
            st.error(str(ex))
            rowdf = None
        if rowdf is not None and len(rowdf):
            st.markdown("**Robot actions and states over time**")
            for key in groups["actions"] + groups["observations"]:
                if key not in rowdf:
                    continue
                try:
                    mat = np.stack([np.asarray(v, dtype=np.float64).ravel() for v in rowdf[key]])
                except Exception:
                    continue
                names = info["features"][key].get("names") or [f"{key}[{i}]" for i in range(mat.shape[1])]
                names = [str(n) for n in names][: mat.shape[1]]
                st.line_chart(pd.DataFrame(mat, columns=names, index=rowdf["timestamp"].to_numpy()), height=220, x_label="timestamp (s)", y_label=key)
            st.markdown("**Frame-level values**")
            frame_i = st.slider("Frame", 0, len(rowdf) - 1, 0)
            r = rowdf.iloc[frame_i]
            vals = {"frame_index": int(r["frame_index"]), "timestamp": float(r["timestamp"]), "global index": int(r["index"])}
            for key in groups["actions"] + groups["observations"]:
                if key in rowdf:
                    names = info["features"][key].get("names")
                    arr = np.asarray(r[key]).ravel().tolist()
                    vals[key] = dict(zip([str(n) for n in names], arr)) if isinstance(names, list) and len(names) == len(arr) else arr
            st.json(vals, expanded=True)
            with st.expander("All rows of this episode"):
                flat = rowdf.copy()
                for key in groups["actions"] + groups["observations"]:
                    if key in flat:
                        flat[key] = flat[key].apply(lambda v: np.round(np.asarray(v, dtype=np.float64).ravel(), 4).tolist())
                st.dataframe(flat, use_container_width=True, hide_index=True)

    st.subheader("Decision")
    s = stmod.status(rec.dataset_id)
    st.markdown(f"Current status: **{s['label']}**")
    if s["decision_stale"]:
        st.warning("A previous decision was taken on an older validation run and has been discarded. Decide again.")
    note = st.text_input("Reviewer note (optional)")
    b1, b2, _ = st.columns([1, 1, 4])
    if b1.button("✅ Accept dataset", type="primary", disabled=not s["validation_passed"], help=None if s["validation_passed"] else "Validation must pass (0 errors) before the dataset can be accepted."):
        try:
            stmod.record_decision(rec.dataset_id, "accepted", note)
            flash("Dataset accepted. Go to stage 5 to export.")
        except ValueError as ex:
            st.error(str(ex))
    if b2.button("⛔ Reject dataset", disabled=report is None):
        try:
            stmod.record_decision(rec.dataset_id, "rejected", note)
            flash("Dataset rejected. Export is blocked.", "warning")
        except ValueError as ex:
            st.error(str(ex))
    if report is not None and not s["validation_passed"]:
        st.info("Accept is disabled because validation reported errors. The dataset cannot be labelled training-ready.")


def _episode_row(root: Path, ep: int) -> pd.Series:
    idx = dsmod.load_episode_index(root)
    return idx[idx["episode_index"] == ep].iloc[0]


# ------------------------------------------------------------------------------------ 5 · Export
def page_export():
    rec = need_dataset()
    st.header(f"5 · Export `{rec.dataset_id}`")
    show_flash()
    s = stmod.status(rec.dataset_id)
    st.markdown(f"Status: **{s['label']}**")
    if not s["export_ready"]:
        if not s["validation_passed"]:
            st.error("Export is blocked: validation has not passed. Only datasets with zero validation errors can be exported.")
        elif s["decision"] == "rejected":
            st.error("Export is blocked: the reviewer rejected this dataset.")
        else:
            st.warning("Export is blocked until the reviewer accepts the dataset in stage 4.")
    ver = exmod.load_verification(rec.dataset_id)
    if st.button("Build export ZIP and verify reload", type="primary", disabled=not s["export_ready"]):
        bar = st.progress(0.0, "Starting…")
        try:
            ver = exmod.export_dataset(rec, progress=lambda f, l: bar.progress(f, l))
            flash("Export built and verified." if ver["passed"] else "Export built but verification FAILED.", "success" if ver["passed"] else "error")
        except exmod.ExportBlocked as e:
            st.error(str(e))
        except Exception as e:
            show_exception(e, "Export failed")
    if ver:
        if ver["passed"]:
            st.success(f"Export verified with `lerobot.LeRobotDataset`: all {len(ver['checks'])} checks passed · {ver['verified_at']}")
        else:
            st.error("Export verification FAILED — do not distribute this ZIP.")
        st.dataframe(pd.DataFrame(ver["checks"]), use_container_width=True, hide_index=True)
        zp = Path(ver.get("zip_path", ""))
        if zp.exists():
            st.write(f"`{zp.name}` — {fmt_bytes(zp.stat().st_size)}. Contents: `{rec.dataset_id}/dataset/` (original LeRobot v3 tree), `validation_report.json`, `dataset_summary.json`, `export_manifest.json`.")
            with open(zp, "rb") as f:
                st.download_button("⬇️ Download ZIP", f, file_name=zp.name, mime="application/zip", type="primary")
            st.code(
                f"from lerobot.datasets.lerobot_dataset import LeRobotDataset\n"
                f"# after unzipping:\n"
                f"ds = LeRobotDataset('{rec.dataset_id}', root='{rec.dataset_id}/dataset')\n"
                f"print(ds.num_episodes, ds.num_frames); print(ds[0].keys())",
                language="python",
            )
        else:
            st.warning("The ZIP referenced by the last verification no longer exists; export again.")


PAGES = {STAGES[0]: page_import, STAGES[1]: page_inspect, STAGES[2]: page_validate, STAGES[3]: page_review, STAGES[4]: page_export}
PAGES[stage]()
