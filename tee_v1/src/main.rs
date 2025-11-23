mod claude_client;
mod config;
mod crypto_utils;
mod models;
mod pii_scanner;
mod weapon_detector;

use std::fs;
use std::net::SocketAddr;
use std::path::{Path, PathBuf};

use axum::{
    http::StatusCode,
    routing::{get, post},
    Json, Router,
};
use serde_json::Value;
use uuid::Uuid;
use walkdir::WalkDir;

use crate::claude_client::generate_nautilus_like_report;
use crate::config::{ensure_existing_dir, resolve_dataset_path};
use crate::crypto_utils::simulate_encrypt_blob_id;
use crate::models::AnalyzeDatasetRequest;
use crate::weapon_detector::{GunDetector, ONNX_MODEL_ENV_VAR};

#[tokio::main]
async fn main() {
    let app = Router::new()
        .route("/health", get(health))
        .route("/analyze-dataset", post(analyze_dataset));

    let addr = SocketAddr::from(([0, 0, 0, 0], 8001));
    println!("TEE substitute listening on {}", addr);

    if let Err(err) = axum::Server::bind(&addr)
        .serve(app.into_make_service())
        .await
    {
        eprintln!("server error: {err}");
    }
}

async fn health() -> Json<serde_json::Value> {
    Json(serde_json::json!({ "status": "ok" }))
}

async fn analyze_dataset(
    Json(req): Json<AnalyzeDatasetRequest>,
) -> Result<Json<Value>, (StatusCode, String)> {
    // STEP 1: "Decipher" the blob content -> resolve the plaintext dataset folder.
    let dataset_path = resolve_dataset_path(&req.encrypted_data_blob_id);

    if !ensure_existing_dir(&dataset_path) {
        return Err((
            StatusCode::NOT_FOUND,
            format!("Dataset directory not found: {}", dataset_path.display()),
        ));
    }

    // STEP 2: Create a fresh execution id and cache the original folder.
    let execution_id = Uuid::new_v4().to_string();
    let cache_dir = cache_original_folder(&dataset_path, &execution_id).map_err(|e| {
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            format!("Failed to cache dataset folder: {e}"),
        )
    })?;

    // STEP 3a: Run the weapon detector on a sampled image from the cached folder.
    let weapon_flag = detect_weapon_flag(&cache_dir).unwrap_or(false);

    // STEP 4: "Encrypt" the blob id by hashing the cached dataset contents.
    let encrypted_blob_id = simulate_encrypt_blob_id(&cache_dir, &execution_id);

    // STEP 3b: Generate a Nautilus-style report using Claude, informed by the
    // cached folder stats, execution id, weapon_flag and encrypted_blob_id.
    let report =
        generate_nautilus_like_report(&req.dataset_id, &cache_dir, &execution_id, weapon_flag, &encrypted_blob_id)
            .await
            .map_err(|e| {
                (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    format!("Failed to generate Claude report: {e}"),
                )
            })?;

    Ok(Json(report))
}

/// Copy the entire dataset folder into a cache directory specific to this execution.
fn cache_original_folder(dataset_path: &Path, execution_id: &str) -> Result<PathBuf, String> {
    let cwd = std::env::current_dir().map_err(|e| format!("Failed to read current dir: {e}"))?;
    let cache_root = cwd.join(".tee_cache");
    let target = cache_root.join(execution_id);

    fs::create_dir_all(&target)
        .map_err(|e| format!("Failed to create cache directory {}: {e}", target.display()))?;

    for entry in WalkDir::new(dataset_path).into_iter().filter_map(Result::ok) {
        if !entry.file_type().is_file() {
            continue;
        }
        let src_path = entry.path();
        let rel = src_path
            .strip_prefix(dataset_path)
            .unwrap_or(src_path)
            .to_path_buf();
        let dest_path = target.join(rel);

        if let Some(parent) = dest_path.parent() {
            fs::create_dir_all(parent).map_err(|e| {
                format!("Failed to create cache subdirectory {}: {e}", parent.display())
            })?;
        }

        fs::copy(src_path, &dest_path).map_err(|e| {
            format!(
                "Failed to copy {} to cache {}: {e}",
                src_path.display(),
                dest_path.display()
            )
        })?;
    }

    Ok(target)
}

/// Find the first image file under `root` with extension jpg/jpeg/png.
fn find_first_image(root: &Path) -> Option<PathBuf> {
    for entry in WalkDir::new(root).into_iter().filter_map(Result::ok) {
        if !entry.file_type().is_file() {
            continue;
        }
        let path = entry.path();
        let ext = path
            .extension()
            .and_then(|s| s.to_str())
            .unwrap_or("")
            .to_lowercase();
        if ext == "jpg" || ext == "jpeg" || ext == "png" {
            return Some(path.to_path_buf());
        }
    }
    None
}

/// Run the ONNX weapon detector on a sampled image and return true if any
/// detection has confidence > 0.5.
fn detect_weapon_flag(root: &Path) -> Result<bool, String> {
    let image_path = match find_first_image(root) {
        Some(p) => p,
        None => return Ok(false),
    };

    let model_path = std::env::var(ONNX_MODEL_ENV_VAR)
        .ok()
        .map(PathBuf::from);

    let detector = GunDetector::new(model_path)
        .map_err(|e| format!("Failed to initialise gun detector: {e}"))?;

    let detections = detector
        .run_on_image(&image_path)
        .map_err(|e| format!("Gun detection inference failed: {e}"))?;

    let flagged = detections.iter().any(|d| d.confidence > 0.5);
    Ok(flagged)
}

