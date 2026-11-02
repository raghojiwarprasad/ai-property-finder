"""Storage layout. Everything lives on the local filesystem under STORAGE_ROOT.

original/<dataset_id>/   untouched import (ZIP contents or Hugging Face snapshot)
working/<dataset_id>/    derived artefacts: episode index, thumbnails, preview clips, reports, decision
export/<dataset_id>/     export ZIP + reload-verification result
"""
from __future__ import annotations

import os
import re
from pathlib import Path

APP_DIR = Path(__file__).resolve().parent.parent
STORAGE_ROOT = Path(os.environ.get("PAI_STORAGE", APP_DIR / "storage")).resolve()
ORIGINAL_DIR = STORAGE_ROOT / "original"
WORKING_DIR = STORAGE_ROOT / "working"
EXPORT_DIR = STORAGE_ROOT / "export"

SUPPORTED_CODEBASE_VERSION = "v3.0"


def ensure_dirs() -> None:
    for d in (ORIGINAL_DIR, WORKING_DIR, EXPORT_DIR):
        d.mkdir(parents=True, exist_ok=True)


def slugify(name: str) -> str:
    slug = re.sub(r"[^A-Za-z0-9._-]+", "-", name).strip("-.")
    return slug[:80] or "dataset"


def original_dir(dataset_id: str) -> Path:
    return ORIGINAL_DIR / dataset_id


def working_dir(dataset_id: str) -> Path:
    return WORKING_DIR / dataset_id


def export_dir(dataset_id: str) -> Path:
    return EXPORT_DIR / dataset_id
