"""
Configuration for the substitute enclave service.

In development, datasets are loaded from a local folder instead of a Walrus
encrypted blob. The base path can be overridden with the `DEV_DATASET_BASE_PATH`
environment variable.
"""

from __future__ import annotations

import os
from pathlib import Path

# Resolve the repository root as the parent of this package.
_REPO_ROOT = Path(__file__).resolve().parent.parent

# Default base path for datasets, e.g. `<repo_root>/dev_datasets/<datasetId>/`
_DEFAULT_DATASET_BASE_PATH = _REPO_ROOT / "dev_datasets"


def get_dataset_base_path() -> Path:
    """
    Return the base path where development datasets are stored.

    The value can be overridden with the `DEV_DATASET_BASE_PATH` environment
    variable. If not set, it falls back to `<repo_root>/dev_datasets`.
    """
    override = os.getenv("DEV_DATASET_BASE_PATH")
    if override:
        return Path(override).expanduser().resolve()
    return _DEFAULT_DATASET_BASE_PATH


def resolve_dataset_path(encrypted_data_blob_id: str) -> Path:
    """
    Map an `encryptedDataBlobId` string to a local dataset directory.

    In the real system this would perform Walrus blob decryption. For local
    development, we simply treat the blob ID as a folder path relative to the
    configured base dataset directory.
    """
    base = get_dataset_base_path()
    dataset_path = (base / encrypted_data_blob_id).resolve()

    # Basic safety: ensure we do not escape the base directory via "..".
    try:
        dataset_path.relative_to(base.resolve())
    except ValueError as exc:  # pragma: no cover - defensive guard
        raise ValueError(
            f"Resolved dataset path {dataset_path} escapes base directory {base}"
        ) from exc

    return dataset_path


