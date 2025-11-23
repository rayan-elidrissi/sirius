use std::env;
use std::path::{Path, PathBuf};

/// Default folder name for dev datasets when no env override is provided.
const DEFAULT_DEV_DATASETS_DIR: &str = "dev_datasets";

/// Return the base path where development datasets are stored.
///
/// The value can be overridden with the `DEV_DATASET_BASE_PATH` environment
/// variable. If not set, it falls back to `<current_working_dir>/dev_datasets`.
pub fn dataset_base_path() -> PathBuf {
    if let Ok(override_path) = env::var("DEV_DATASET_BASE_PATH") {
        PathBuf::from(override_path)
    } else {
        env::current_dir()
            .unwrap_or_else(|_| PathBuf::from("."))
            .join(DEFAULT_DEV_DATASETS_DIR)
    }
}

/// Map an `encryptedDataBlobId` string to a local dataset directory.
///
/// In the real system this would reference a Walrus blob. For local
/// development, we treat it as a folder path relative to the base dataset
/// directory.
pub fn resolve_dataset_path(encrypted_data_blob_id: &str) -> PathBuf {
    let base = dataset_base_path();
    let joined = base.join(encrypted_data_blob_id);

    // Basic safety against path traversal: ensure final path is inside base.
    match (joined.canonicalize(), base.canonicalize()) {
        (Ok(path), Ok(base_real)) if path.starts_with(&base_real) => path,
        (Ok(_), Ok(base_real)) => base_real, // Fallback; handler will likely 404.
        _ => joined,
    }
}

/// Utility to check if a path exists and is a directory.
pub fn ensure_existing_dir(path: &Path) -> bool {
    path.exists() && path.is_dir()
}


