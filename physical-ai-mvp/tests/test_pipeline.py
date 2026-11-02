"""End-to-end tests. Test data = `sample_data/so101_lift_3ep`, three real SO-101 episodes (tactino/so101-grasp-cube)."""
import io
import json
import shutil
import zipfile
from pathlib import Path

import numpy as np
import pyarrow as pa
import pyarrow.parquet as pq
import pytest

from pai import config, dataset as dsmod, export as exmod, importer, state as stmod, validate as valmod


def zip_dir(root: Path) -> io.BytesIO:
    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w") as zf:
        for p in sorted(root.rglob("*")):
            if p.is_file():
                zf.write(p, Path("so101_lift_3ep") / p.relative_to(root))
    buf.seek(0)
    return buf


# ----------------------------------------------------------------------------- Test 1: valid dataset

@pytest.fixture(scope="module")
def imported(sample_root):
    return importer.import_zip(zip_dir(sample_root), "so101_lift_3ep.zip")


def test_import_zip_reports_real_metadata(imported, sample_root):
    assert imported.codebase_version == "v3.0"
    assert imported.source_type == "zip"
    root = Path(imported.dataset_root)
    assert (root / "meta" / "info.json").exists()
    info = dsmod.read_info(root)
    assert info["total_episodes"] == 3 and info["fps"] == 30 and info["robot_type"] == "so101_follower"
    groups = dsmod.feature_groups(info)
    assert groups["cameras"] == ["observation.images.front", "observation.images.wrist"]
    assert groups["actions"] == ["action"] and groups["observations"] == ["observation.state"]
    # the import is byte-identical to the source
    for p in sample_root.rglob("*"):
        if p.is_file():
            assert exmod.sha256(p) == exmod.sha256(root / p.relative_to(sample_root))


def test_import_rejects_non_v3(tmp_path):
    bad = tmp_path / "ds" / "meta"
    bad.mkdir(parents=True)
    (bad / "info.json").write_text(json.dumps({"codebase_version": "v2.1"}))
    with pytest.raises(importer.ImportError_, match="v2.1"):
        importer.import_zip(zip_dir(tmp_path / "ds"), "old.zip")
    with pytest.raises(importer.ImportError_, match="not a valid ZIP"):
        importer.import_zip(io.BytesIO(b"nope"), "garbage.zip")


def test_hf_repo_id_parsing():
    assert importer.parse_hf_repo_id("lerobot/svla_so101_pickplace") == "lerobot/svla_so101_pickplace"
    assert importer.parse_hf_repo_id("https://huggingface.co/datasets/lerobot/svla_so101_pickplace/tree/main") == "lerobot/svla_so101_pickplace"
    with pytest.raises(importer.ImportError_):
        importer.parse_hf_repo_id("not a repo")


def test_process_reads_every_episode(imported):
    res = dsmod.process_dataset(imported)
    assert res.errors == []
    assert [e["episode_index"] for e in res.episodes] == [0, 1, 2]
    info = dsmod.read_info(Path(imported.dataset_root))
    assert sum(e["rows_in_parquet"] for e in res.episodes) == info["total_frames"]
    for e in res.episodes:
        assert e["rows_in_parquet"] == e["declared_length"]
        assert e["errors"] == []
        assert e["timestamp_first"] == 0.0
        assert e["actions"]["action"]["dims"] == 6 and e["actions"]["action"]["nan_count"] == 0
        assert e["observations"]["observation.state"]["dims"] == 6
        for cam in ("observation.images.front", "observation.images.wrist"):
            assert e["videos"][cam]["file"].endswith("chunk-000/file-000.mp4")  # episodes share one file
            for name in ("first", "mid", "last"):
                assert Path(e["thumbnails"][cam][name]).stat().st_size > 0


def test_validation_passes_on_real_dataset(imported):
    rep = valmod.validate_dataset(imported)
    assert rep.passed, [f.message for f in rep.findings]
    assert rep.summary["episodes_checked"] == 3 and rep.summary["episodes_failed"] == 0
    assert {c["id"]: c["status"] for c in rep.to_dict()["checks"]} == {f"C{i}": "pass" for i in range(1, 9)}
    m = rep.episodes[0]["measurements"]
    assert m["rows"] == m["declared_length"] == 191
    assert m["cameras"]["observation.images.front"]["frames_in_segment"] == 191
    assert m["cameras"]["observation.images.front"]["official_decoder"].startswith("ok")
    assert m["max_spacing_deviation_s"] < 1e-4


def test_decision_and_export_roundtrip(imported):
    st = stmod.status(imported.dataset_id)
    assert st["validation_passed"] and st["decision"] is None and not st["export_ready"]
    with pytest.raises(exmod.ExportBlocked):
        exmod.export_dataset(imported)
    stmod.record_decision(imported.dataset_id, "rejected", "testing reject")
    assert stmod.status(imported.dataset_id)["label"] == "Rejected by reviewer"
    with pytest.raises(exmod.ExportBlocked, match="not been accepted"):
        exmod.export_dataset(imported)
    stmod.record_decision(imported.dataset_id, "accepted", "ok")
    ver = exmod.export_dataset(imported)
    assert ver["passed"], ver["checks"]
    zp = Path(ver["zip_path"])
    assert zp.exists()
    with zipfile.ZipFile(zp) as zf:
        names = zf.namelist()
    did = imported.dataset_id
    assert f"{did}/validation_report.json" in names and f"{did}/dataset_summary.json" in names and f"{did}/export_manifest.json" in names
    assert f"{did}/dataset/meta/info.json" in names
    assert stmod.status(did)["label"].startswith("Training-ready")


def test_exported_zip_reloads_with_official_loader(imported, tmp_path):
    from lerobot.datasets.lerobot_dataset import LeRobotDataset

    ver = exmod.load_verification(imported.dataset_id)
    with zipfile.ZipFile(ver["zip_path"]) as zf:
        zf.extractall(tmp_path)
    ds = LeRobotDataset("reload/test", root=tmp_path / imported.dataset_id / "dataset")
    assert ds.num_episodes == 3 and ds.num_frames == 569  # from meta/info.json total_frames
    item = ds[100]
    assert item["observation.images.front"].shape == (3, 480, 640)
    assert item["action"].shape == (6,)


# ----------------------------------------------------------------------------- Test 3: data integrity

def test_integrity_nothing_lost_or_altered(imported, sample_root):
    """Original → import → export: parquet/video bytes identical; every row of every episode identical."""
    ver = exmod.load_verification(imported.dataset_id)
    manifest_check = next(c for c in ver["checks"] if "sha256" in c["check"])
    assert manifest_check["passed"]
    assert next(c for c in ver["checks"] if "bit-identical" in c["check"])["passed"]
    assert next(c for c in ver["checks"] if "decoded camera frames" in c["check"])["passed"]
    with zipfile.ZipFile(ver["zip_path"]) as zf:
        for p in sample_root.rglob("*"):
            if p.is_file():
                rel = p.relative_to(sample_root)
                assert zf.read(f"{imported.dataset_id}/dataset/{rel.as_posix()}") == p.read_bytes(), rel
    # processed rows == parquet rows per episode
    orig = pq.read_table(sample_root / "data/chunk-000/file-000.parquet").to_pandas()
    for e in dsmod.load_processed_episodes(imported.dataset_id):
        assert e["rows_in_parquet"] == int((orig["episode_index"] == e["episode_index"]).sum())


# ----------------------------------------------------------------------------- Test 2: invalid datasets

def _broken_copy(sample_root: Path, tmp_path: Path, name: str) -> Path:
    dst = tmp_path / name
    shutil.copytree(sample_root, dst)
    return dst


def _run(path: Path, name: str):
    rec = importer.import_local_directory(path, name=name)
    dsmod.process_dataset(rec)
    rep = valmod.validate_dataset(rec)
    return rec, rep


def test_missing_video_file_fails(sample_root, tmp_path):
    bad = _broken_copy(sample_root, tmp_path, "missing_video")
    (bad / "videos/observation.images.wrist/chunk-000/file-000.mp4").unlink()
    rec, rep = _run(bad, "missing_video")
    assert not rep.passed
    msgs = [f.message for f in rep.findings if f.severity == "error"]
    assert any("Video file missing" in m and "observation.images.wrist" in m for m in msgs)
    assert rep.summary["episodes_failed"] == 3  # every episode used that file
    assert stmod.status(rec.dataset_id)["label"].startswith("NOT training-ready")
    with pytest.raises(ValueError, match="Cannot accept"):
        stmod.record_decision(rec.dataset_id, "accepted")
    with pytest.raises(exmod.ExportBlocked):
        exmod.export_dataset(rec)


def test_corrupt_info_json_fails(sample_root, tmp_path):
    bad = _broken_copy(sample_root, tmp_path, "corrupt_info")
    info = json.loads((bad / "meta/info.json").read_text())
    info["total_frames"] = 9999
    info["features"]["action"]["shape"] = [7]
    (bad / "meta/info.json").write_text(json.dumps(info))
    rec, rep = _run(bad, "corrupt_info")
    assert not rep.passed
    msgs = [f.message for f in rep.findings if f.severity == "error"]
    assert any("total_frames=9999" in m for m in msgs)
    assert any("action: each row has 6 values but schema shape [7] needs 7" in m for m in msgs)
    assert rep.summary["episodes_failed"] == 3


def test_nan_in_actions_and_bad_timestamps_fail(sample_root, tmp_path):
    bad = _broken_copy(sample_root, tmp_path, "nan_actions")
    p = bad / "data/chunk-000/file-000.parquet"
    table = pq.read_table(p)
    df = table.to_pandas()
    # episode 1: inject NaN into one action row; episode 2: break timestamp order
    i1 = df.index[df["episode_index"] == 1][5]
    a = np.array(df.at[i1, "action"], dtype=np.float32)
    a[2] = np.nan
    df.at[i1, "action"] = a
    i2 = df.index[df["episode_index"] == 2][10]
    df.at[i2, "timestamp"] = np.float32(df.at[i2 - 1, "timestamp"] - 0.5)
    pq.write_table(pa.Table.from_pandas(df, schema=table.schema, preserve_index=False), p)
    rec, rep = _run(bad, "nan_actions")
    assert not rep.passed
    by_ep = {e["episode_index"]: e["status"] for e in rep.episodes}
    assert by_ep == {0: "pass", 1: "fail", 2: "fail"}
    msgs = [(f.episode_index, f.check, f.message) for f in rep.findings if f.severity == "error"]
    assert any(ep == 1 and c == "C7" and "1 NaN" in m for ep, c, m in msgs)
    assert any(ep == 2 and c == "C5" and "not strictly increasing" in m for ep, c, m in msgs)


def test_truncated_parquet_fails(sample_root, tmp_path):
    bad = _broken_copy(sample_root, tmp_path, "truncated_parquet")
    p = bad / "data/chunk-000/file-000.parquet"
    data = p.read_bytes()
    p.write_bytes(data[: len(data) // 2])
    rec, rep = _run(bad, "truncated_parquet")
    assert not rep.passed
    assert any(f.check == "C2" and "Parquet unreadable" in f.message for f in rep.findings)
    assert rep.summary["episodes_failed"] == 3


def test_video_tabular_desync_fails(sample_root, tmp_path):
    """Shorten the video segment of episode 0 in the episode index → C8 must flag it."""
    bad = _broken_copy(sample_root, tmp_path, "desync")
    p = bad / "meta/episodes/chunk-000/file-000.parquet"
    table = pq.read_table(p)
    df = table.to_pandas()
    df.loc[df["episode_index"] == 0, "videos/observation.images.front/to_timestamp"] -= 1.0  # 30 frames shorter
    pq.write_table(pa.Table.from_pandas(df, schema=table.schema, preserve_index=False), p)
    rec, rep = _run(bad, "desync")
    assert not rep.passed
    errs = [f for f in rep.findings if f.severity == "error" and f.episode_index == 0 and f.check == "C8"]
    assert any("segment lasts" in f.message for f in errs)
    assert any("video frames in segment" in f.message for f in errs)
    assert {e["episode_index"]: e["status"] for e in rep.episodes} == {0: "fail", 1: "pass", 2: "pass"}


# ----------------------------------------------------------------------------- optional: full real dataset

def test_full_real_dataset(real_dataset_root):
    if real_dataset_root is None:
        pytest.skip("set PAI_TEST_DATASET=<path to a LeRobot v3 dataset> to run")
    rec = importer.import_local_directory(real_dataset_root, name="real_full", copy=False)
    res = dsmod.process_dataset(rec)
    assert res.errors == []
    rep = valmod.validate_dataset(rec)
    assert rep.passed, [f.message for f in rep.findings if f.severity == "error"][:10]
