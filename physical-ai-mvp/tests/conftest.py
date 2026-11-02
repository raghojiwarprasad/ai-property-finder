import os
import shutil
import sys
from pathlib import Path

import pytest

APP_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(APP_DIR))

# Each test session gets its own storage root so nothing touches the user's storage/.
_STORAGE = Path(os.environ.get("PAI_TEST_STORAGE", APP_DIR / ".pytest-storage"))
os.environ["PAI_STORAGE"] = str(_STORAGE)
os.environ.setdefault("HF_HUB_OFFLINE", "1")

SAMPLE = APP_DIR / "sample_data" / "so101_lift_3ep"


@pytest.fixture(scope="session", autouse=True)
def clean_storage():
    if _STORAGE.exists():
        shutil.rmtree(_STORAGE)
    _STORAGE.mkdir(parents=True)
    yield
    # keep artefacts for inspection after the run


@pytest.fixture(scope="session")
def sample_root() -> Path:
    assert (SAMPLE / "meta" / "info.json").exists(), f"sample dataset missing at {SAMPLE}"
    return SAMPLE


@pytest.fixture(scope="session")
def real_dataset_root() -> Path | None:
    """Optional larger real dataset, e.g. the full 50-episode tactino/so101-grasp-cube lift set."""
    p = os.environ.get("PAI_TEST_DATASET")
    if not p:
        return None
    p = Path(p)
    if not (p / "meta" / "info.json").exists():
        pytest.skip(f"PAI_TEST_DATASET={p} has no meta/info.json")
    return p
