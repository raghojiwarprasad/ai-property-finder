"""Stage A — import a LeRobot v3 dataset from a ZIP file or a Hugging Face dataset repo.

The imported files are written once to original/<dataset_id>/ and never modified afterwards.
"""
from __future__ import annotations

import json
import re
import shutil
import zipfile
from dataclasses import dataclass, asdict
from datetime import datetime, timezone
from pathlib import Path
from typing import BinaryIO

from . import config


class ImportError_(Exception):
    """Raised when an import cannot produce a usable LeRobot v3 dataset. Message is user-facing."""


@dataclass
class ImportRecord:
    dataset_id: str
    source_type: str  # "zip" | "huggingface"
    source: str  # original file name or repo id
    imported_at: str
    dataset_root: str  # absolute path to the directory that contains meta/info.json
    size_bytes: int
    file_count: int
    codebase_version: str | None

    def save(self) -> None:
        wd = config.working_dir(self.dataset_id)
        wd.mkdir(parents=True, exist_ok=True)
        (wd / "import.json").write_text(json.dumps(asdict(self), indent=2))

    @staticmethod
    def load(dataset_id: str) -> "ImportRecord":
        p = config.working_dir(dataset_id) / "import.json"
        if not p.exists():
            raise FileNotFoundError(f"No import record for dataset '{dataset_id}' ({p})")
        return ImportRecord(**json.loads(p.read_text()))


def list_datasets() -> list[str]:
    config.ensure_dirs()
    return sorted(p.name for p in config.WORKING_DIR.iterdir() if (p / "import.json").exists())


def _unique_dataset_id(base: str) -> str:
    config.ensure_dirs()
    slug = config.slugify(base)
    candidate = slug
    n = 2
    while config.original_dir(candidate).exists() or config.working_dir(candidate).exists():
        candidate = f"{slug}-{n}"
        n += 1
    return candidate


def find_dataset_root(directory: Path) -> Path:
    """Locate the directory containing meta/info.json (the ZIP may contain a top-level folder)."""
    candidates = sorted(directory.rglob("meta/info.json"), key=lambda p: len(p.parts))
    if not candidates:
        raise ImportError_(
            "No `meta/info.json` found anywhere in the import. A LeRobot v3 dataset must contain "
            "meta/info.json, meta/tasks.parquet, meta/episodes/, data/ and (for video datasets) videos/."
        )
    return candidates[0].parent.parent


def _dir_stats(root: Path) -> tuple[int, int]:
    size = count = 0
    for p in root.rglob("*"):
        if p.is_file():
            size += p.stat().st_size
            count += 1
    return size, count


def _read_version(dataset_root: Path) -> str | None:
    try:
        info = json.loads((dataset_root / "meta" / "info.json").read_text())
    except json.JSONDecodeError as e:
        raise ImportError_(f"meta/info.json is not valid JSON: {e}") from e
    return info.get("codebase_version")


def _check_version(dataset_root: Path) -> str | None:
    version = _read_version(dataset_root)
    if version != config.SUPPORTED_CODEBASE_VERSION:
        raise ImportError_(
            f"Unsupported LeRobot dataset codebase_version {version!r}. This MVP supports "
            f"{config.SUPPORTED_CODEBASE_VERSION} only. Datasets in v2.1 can be converted with "
            "`python -m lerobot.datasets.v30.convert_dataset_v21_to_v30 --repo-id=<id>` from the lerobot package."
        )
    return version


def import_zip(fileobj: BinaryIO, filename: str) -> ImportRecord:
    config.ensure_dirs()
    dataset_id = _unique_dataset_id(Path(filename).stem)
    dest = config.original_dir(dataset_id)
    dest.mkdir(parents=True)
    try:
        try:
            zf = zipfile.ZipFile(fileobj)
        except zipfile.BadZipFile as e:
            raise ImportError_(f"'{filename}' is not a valid ZIP archive: {e}") from e
        with zf:
            dest_resolved = dest.resolve()
            for member in zf.infolist():
                target = (dest / member.filename).resolve()
                if dest_resolved not in target.parents and target != dest_resolved:
                    raise ImportError_(f"ZIP entry '{member.filename}' escapes the extraction directory; refusing to import.")
            zf.extractall(dest)
        dataset_root = find_dataset_root(dest)
        version = _check_version(dataset_root)
    except Exception:
        shutil.rmtree(dest, ignore_errors=True)
        raise
    size, count = _dir_stats(dataset_root)
    record = ImportRecord(
        dataset_id=dataset_id,
        source_type="zip",
        source=filename,
        imported_at=datetime.now(timezone.utc).isoformat(timespec="seconds"),
        dataset_root=str(dataset_root),
        size_bytes=size,
        file_count=count,
        codebase_version=version,
    )
    record.save()
    return record


_HF_URL_RE = re.compile(r"^(?:https?://)?huggingface\.co/datasets/([^/\s]+/[^/\s?#]+)")


def parse_hf_repo_id(text: str) -> str:
    text = text.strip()
    m = _HF_URL_RE.match(text)
    if m:
        return m.group(1).removesuffix(".git")
    if re.fullmatch(r"[\w.-]+/[\w.-]+", text):
        return text
    raise ImportError_(
        f"'{text}' is not a Hugging Face dataset repo id (expected `owner/name`) or dataset URL "
        "(expected `https://huggingface.co/datasets/owner/name`)."
    )


def import_huggingface(repo_id_or_url: str, revision: str | None = None, progress=None) -> ImportRecord:
    """Download a dataset repo with huggingface_hub.snapshot_download into original/<id>/.

    Network errors are surfaced verbatim; nothing is written to working/ unless the download succeeds
    and the result is a LeRobot v3 dataset.
    """
    from huggingface_hub import snapshot_download
    from huggingface_hub.errors import HfHubHTTPError, RepositoryNotFoundError, RevisionNotFoundError

    config.ensure_dirs()
    repo_id = parse_hf_repo_id(repo_id_or_url)
    dataset_id = _unique_dataset_id(repo_id.replace("/", "__"))
    dest = config.original_dir(dataset_id)
    dest.mkdir(parents=True)
    try:
        if progress:
            progress(f"Downloading {repo_id} from the Hugging Face Hub…")
        try:
            snapshot_download(repo_id=repo_id, repo_type="dataset", revision=revision, local_dir=str(dest))
        except RepositoryNotFoundError as e:
            raise ImportError_(f"Dataset repo '{repo_id}' was not found on the Hugging Face Hub (or is private): {e}") from e
        except RevisionNotFoundError as e:
            raise ImportError_(f"Revision {revision!r} does not exist for '{repo_id}': {e}") from e
        except HfHubHTTPError as e:
            raise ImportError_(f"Hugging Face Hub request failed for '{repo_id}': {e}") from e
        except OSError as e:
            raise ImportError_(f"Network/filesystem error while downloading '{repo_id}': {e}") from e
        except Exception as e:  # e.g. httpx.ProxyError / ConnectError behind a restrictive network
            raise ImportError_(f"Download of '{repo_id}' failed: {type(e).__name__}: {e}") from e
        dataset_root = find_dataset_root(dest)
        version = _check_version(dataset_root)
    except Exception:
        shutil.rmtree(dest, ignore_errors=True)
        raise
    size, count = _dir_stats(dataset_root)
    record = ImportRecord(
        dataset_id=dataset_id,
        source_type="huggingface",
        source=repo_id if revision is None else f"{repo_id}@{revision}",
        imported_at=datetime.now(timezone.utc).isoformat(timespec="seconds"),
        dataset_root=str(dataset_root),
        size_bytes=size,
        file_count=count,
        codebase_version=version,
    )
    record.save()
    return record


def import_local_directory(path: Path, name: str | None = None, copy: bool = True) -> ImportRecord:
    """Import a dataset directory already on disk (used by tests and the CLI)."""
    config.ensure_dirs()
    path = Path(path)
    dataset_root_src = find_dataset_root(path)
    dataset_id = _unique_dataset_id(name or path.name)
    dest = config.original_dir(dataset_id)
    if copy:
        shutil.copytree(dataset_root_src, dest)
        dataset_root = dest
    else:
        dest.mkdir(parents=True)
        dataset_root = dataset_root_src
    try:
        version = _check_version(dataset_root)
    except Exception:
        shutil.rmtree(dest, ignore_errors=True)
        raise
    size, count = _dir_stats(dataset_root)
    record = ImportRecord(
        dataset_id=dataset_id,
        source_type="local",
        source=str(path),
        imported_at=datetime.now(timezone.utc).isoformat(timespec="seconds"),
        dataset_root=str(dataset_root),
        size_bytes=size,
        file_count=count,
        codebase_version=version,
    )
    record.save()
    return record
