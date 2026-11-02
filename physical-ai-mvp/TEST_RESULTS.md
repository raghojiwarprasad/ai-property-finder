# Recorded test results

Environment: Linux x86_64, Python 3.13.18, FFmpeg 6.1.1, lerobot 0.6.1, torch 2.11.0 (CPU), torchcodec 0.11.1,
av 15.1.0, streamlit 1.66.1. Date: 2026-11-02.

## Automated suite — bundled 3-episode real sample

`python -m pytest tests -q`

```
13 passed, 1 skipped in 8.09s
SKIPPED tests/test_pipeline.py:248: set PAI_TEST_DATASET=<path to a LeRobot v3 dataset> to run
```

## Automated suite — full real dataset (tactino/so101-grasp-cube, real_data/lift, 50 episodes / 8 934 frames)

`PAI_TEST_DATASET=<clone>/real_data/lift python -m pytest tests -v`

```
tests/test_pipeline.py::test_import_zip_reports_real_metadata PASSED
tests/test_pipeline.py::test_import_rejects_non_v3 PASSED
tests/test_pipeline.py::test_hf_repo_id_parsing PASSED
tests/test_pipeline.py::test_process_reads_every_episode PASSED
tests/test_pipeline.py::test_validation_passes_on_real_dataset PASSED
tests/test_pipeline.py::test_decision_and_export_roundtrip PASSED
tests/test_pipeline.py::test_exported_zip_reloads_with_official_loader PASSED
tests/test_pipeline.py::test_integrity_nothing_lost_or_altered PASSED
tests/test_pipeline.py::test_missing_video_file_fails PASSED
tests/test_pipeline.py::test_corrupt_info_json_fails PASSED
tests/test_pipeline.py::test_nan_in_actions_and_bad_timestamps_fail PASSED
tests/test_pipeline.py::test_truncated_parquet_fails PASSED
tests/test_pipeline.py::test_video_tabular_desync_fails PASSED
tests/test_pipeline.py::test_full_real_dataset PASSED
14 passed in 21.96s
```

Full dataset, measured: process 50 episodes = 15 s (incl. 300 thumbnails via the official decoder); validation
C1–C8 = 0.7 s; result `errors=0 warnings=0 episodes_passed=50/50`.

## Browser run of the Streamlit app (Playwright, headless Chromium)

Valid dataset (`so101_lift_3ep.zip` uploaded through the file uploader):

| step | observed |
|---|---|
| Import ZIP | dataset appears in sidebar, metadata page shows 3 episodes / 569 frames / 30 fps / so101_follower / 2 cameras |
| Process dataset | "Processed 3 episodes.", per-episode table + first/mid/last thumbnails for both cameras |
| Run validation | "Validation passed: 0 errors, 0 warning(s) · 3/3 episodes pass", C1–C8 all `pass` |
| Review → Load preview clip | `<video>` element rendered (H.264 clip of the episode segment), action/state charts and frame slider shown |
| Reject dataset | status "Rejected by reviewer"; Export page: "Export is blocked: the reviewer rejected this dataset", button disabled |
| Accept dataset | status "Accepted — export pending" |
| Build export ZIP and verify reload | "Export verified with lerobot.LeRobotDataset: all 13 checks passed"; status "Training-ready: validated, accepted, export verified" |
| Download ZIP | 6 456 471-byte file received by the browser; reloaded outside the app with `LeRobotDataset` → 3 episodes, 569 frames |

Invalid dataset (copy of the sample with `videos/observation.images.wrist/chunk-000/file-000.mp4` deleted,
imported via "Local directory"):

| step | observed |
|---|---|
| Process | "Processing finished with errors" (loader could not open the dataset; wrist thumbnails impossible) |
| Validate | "Validation FAILED: 4 error(s) … 0/3 episodes pass, 3 fail, 1 dataset-level error(s)"; C1 `fail` (Video file missing: videos/observation.images.wrist/chunk-000/file-000.mp4), C8 `fail` for episodes 0, 1, 2 |
| Review | status "NOT training-ready (validation not passed)", **Accept** button disabled |
| Export | "Export is blocked: validation has not passed", button disabled |

## Not verified here

- Hugging Face Hub download: `huggingface.co` is blocked by the build environment's network policy. The UI showed the
  real error (`Download of 'lerobot/svla_so101_pickplace' failed: ProxyError: 403 Forbidden`); a successful Hub import
  has **not** been observed. Verify on a machine with Hub access.
- Datasets other than SO-101 AV1-video datasets (e.g. image/PNG datasets, depth cameras, multi-chunk layouts) were not
  tested with real data.
