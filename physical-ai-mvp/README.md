# Physical AI training-data MVP (LeRobot v3)

One end-to-end workflow, locally runnable, no accounts/payments/marketplace:

**Import → Inspect → Validate → Review → Export** for a single [LeRobot dataset v3](https://huggingface.co/docs/lerobot/lerobot-dataset-v3).

- Import a dataset ZIP, a Hugging Face dataset repo id/URL, or a local directory.
- Read it with the official `lerobot.datasets.lerobot_dataset.LeRobotDataset` loader; index every episode from
  `meta/episodes/*.parquet` (episodes share parquet/MP4 files — frames are located by row range and timestamp segment).
- Run 8 real quality checks per file and per episode; findings carry the measured values. No scores are invented.
- Review as a buyer: play an episode's camera clip, plot/inspect actions and states frame by frame, read the report,
  accept or reject.
- Export the accepted dataset as a LeRobot v3 ZIP (+ `validation_report.json`, `dataset_summary.json`,
  `export_manifest.json`) and verify that the ZIP reloads with `LeRobotDataset` with identical frame counts, episodes,
  schema and sampled values.

Rejecting, or any validation error, blocks the "training-ready" status and the export.

## Stack

Python ≥ 3.12 (lerobot 0.6.1 requires it) · Streamlit · `lerobot[dataset]==0.6.1` (official loader, decoder and writer)
· NumPy / Pandas / PyArrow · PyAV + FFmpeg (video probing, demuxing, preview clips) · `huggingface_hub` (Hub download)
· pytest. Storage is the local filesystem under `storage/` (`original/`, `working/`, `export/`). No database.

## Quickest start

```bash
cd physical-ai-mvp && ./run.sh        # creates .venv, installs, starts the app at http://localhost:8501
```

`./run.sh test` runs the test suite. Manual steps:

## Install and run

```bash
cd physical-ai-mvp
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt       # torch CPU build is fine; ~2 GB download
```

FFmpeg must be on `PATH` (`ffmpeg -version`). It is used for the browser preview clips only.

```bash
streamlit run app.py
```

Open http://localhost:8501. Walk the stages in the sidebar:

1. **Import** – upload a ZIP, paste a Hub repo id, or import the bundled sample directory (`sample_data/so101_lift_3ep`).
2. **Inspect** – name, source, robot type, episodes, frames, fps, duration, cameras, schema. Press **Process dataset**.
3. **Validate** – press **Run validation**; see per-check and per-episode results, tolerances and every finding.
4. **Review** – pick an episode, load its clip, inspect actions/states and frame values, see what is/isn't included,
   **Accept** (only enabled when validation passed) or **Reject**.
5. **Export** – build the ZIP, see the reload-verification table, download.

Set `PAI_STORAGE=/some/dir` to move the storage root.

## Test datasets (real, public)

| dataset | where | what | used for |
|---|---|---|---|
| `tactino/so101-grasp-cube`, folder `real_data/lift` (MIT) | GitHub: https://github.com/tactino/so101-grasp-cube | 50 real SO-101 follower episodes, 8 934 frames @ 30 fps, 2 AV1 cameras (front, wrist), 6-D state/action, ~100 MB | full run of all 5 stages (`PAI_TEST_DATASET`) |
| `sample_data/so101_lift_3ep` | bundled in this repo (6 MB) | episodes 0–2 of the dataset above, re-packaged with the official `LeRobotDataset.create()/add_frame()/save_episode()` writer (real data, real videos) | default test-suite dataset and in-app sample |

Suggested small Hub dataset for the **Hugging Face import** path: `lerobot/svla_so101_pickplace` (SO-101, v3.0).
The Hub import code path (`huggingface_hub.snapshot_download`) could **not** be exercised from the build
environment because `huggingface.co` was blocked by its network policy — the failure was surfaced in the UI as
`Download of 'lerobot/svla_so101_pickplace' failed: ProxyError: 403 Forbidden`. Please verify it on your machine.

To get the full 50-episode dataset:

```bash
git clone --depth 1 https://github.com/tactino/so101-grasp-cube.git
# then in the app: Import → "Local directory" → <clone>/real_data/lift
```

## Tests

```bash
cd physical-ai-mvp
source .venv/bin/activate
python -m pytest tests -q                                     # bundled 3-episode sample, ~10 s
PAI_TEST_DATASET=/path/to/so101-grasp-cube/real_data/lift python -m pytest tests -q   # + full 50-episode dataset
```

What the suite does (see `TEST_RESULTS.md` for the recorded run):

- **Test 1 – valid real dataset**: ZIP import → metadata → process (every episode, thumbnails via the official decoder)
  → validation passes all 8 checks → reject blocks export → accept → export → ZIP reloads with `LeRobotDataset`.
- **Test 2 – invalid datasets** (controlled broken copies): missing video file, corrupted `info.json`
  (wrong `total_frames`, wrong action shape), NaN in actions + non-monotonic timestamps, truncated parquet, and a
  video/tabular desync in the episode index. Each is detected with the real reason, episodes are marked failed, accept
  raises, export is blocked.
- **Test 3 – data integrity**: exported parquet/MP4 bytes are identical to the original, per-episode row counts match
  the parquet, sampled rows and decoded camera frames are bit-identical through the official loader.

## Validation checks

| id | check | tolerance / rule |
|---|---|---|
| C1 | required files: `meta/info.json`, `meta/tasks.parquet`, `meta/episodes/*.parquet`, every data/video file referenced by the episode index; `stats.json` missing = warning | – |
| C2 | every data parquet reads; declared non-video features are columns | – |
| C3 | every MP4 opens and its first frame decodes (PyAV); stream H×W = schema; stream fps ≈ dataset fps (warning) | – |
| C4 | `info.total_episodes/total_frames` match the index; `to-from == length`; ranges contiguous; rows per episode == length; `index`/`frame_index` are the expected ranges | – |
| C5 | timestamps finite, first ≈ 0, strictly increasing, spaced 1/fps | deviation > ½ frame = error (dropped/duplicated frame); > 1e-4 s (loader `tolerance_s`) = warning |
| C6 | each action/observation row has `prod(shape)` values; stored dtype vs declared (warning) | – |
| C7 | no NaN/Inf in numeric features | – |
| C8 | per camera & episode: packets in `[from_ts, to_ts)` == rows (±1 = warning, more = error); segment duration == length/fps (±1 frame); first and last frame decode with `lerobot.datasets.video_utils.decode_video_frames` at `tolerance_s=1e-4` (exactly what `LeRobotDataset.__getitem__` needs); frames per file ≥ sum of episode lengths | fps-based, stated in the report |

## Layout

```
app.py                 Streamlit UI (5 stages)
pai/config.py          storage layout
pai/importer.py        ZIP / Hugging Face / local-directory import (originals preserved)
pai/dataset.py         official-loader access, episode indexing, summaries, thumbnails, preview clips
pai/validate.py        checks C1–C8 → working/<id>/validation_report.json
pai/state.py           accept/reject decision and status derivation (export gating)
pai/export.py          ZIP builder + reload verification with LeRobotDataset
tests/                 pytest suite
sample_data/           3-episode real sample dataset (LeRobot v3)
storage/               created at runtime: original/, working/, export/   (git-ignored)
```

## What works / what is not implemented

Works (tested): ZIP and local-directory import, v3.0 version gate (v2.1 is rejected with the conversion hint),
processing, all eight checks, episode review with video + plots + frame values, accept/reject gating, export, reload
verification, download. Preview clips are H.264 re-encodes of the original segment *for playback only*; the export
contains the untouched originals.

Not implemented / not verified: Hub download not network-tested here (code present); only `v3.0` datasets; image
(PNG) datasets and depth cameras are not validated specially; export is all-or-nothing (no per-episode filtering of
failed episodes — failed datasets are simply not exportable); no ROS/MCAP/HDF5, no other export formats, no accounts.
