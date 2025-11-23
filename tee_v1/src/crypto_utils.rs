use std::collections::BTreeMap;
use std::fs;
use std::path::Path;

use ed25519_dalek::{Signer, SigningKey, VerifyingKey};
use once_cell::sync::Lazy;
use rand_core::{OsRng, RngCore};
use serde::Serialize;
use serde_json::{self, Value};
use sha2::{Digest, Sha256};
use walkdir::WalkDir;

/// Constant measurement string for the local substitute TEE.
pub const ENCLAVE_MEASUREMENT: &str = "substitute-local-dev-nautilus-v1";

/// Global Ed25519 signing key generated once per process.
static SIGNING_KEY: Lazy<SigningKey> = Lazy::new(|| {
    let mut rng = OsRng;
    SigningKey::generate(&mut rng)
});

/// Corresponding public key.
static VERIFYING_KEY: Lazy<VerifyingKey> = Lazy::new(|| SIGNING_KEY.verifying_key());

/// Return the enclave public key as a 0x-prefixed hex string.
pub fn enclave_public_key_hex() -> String {
    let bytes = VERIFYING_KEY.to_bytes();
    format!("0x{}", hex::encode(bytes))
}

/// Recursively sort JSON objects by key to obtain a canonical representation.
fn sort_json_value(value: &mut Value) {
    match value {
        Value::Object(map) => {
            let mut sorted = BTreeMap::new();
            for (k, mut v) in std::mem::take(map) {
                sort_json_value(&mut v);
                sorted.insert(k, v);
            }
            *map = sorted.into_iter().collect();
        }
        Value::Array(arr) => {
            for v in arr.iter_mut() {
                sort_json_value(v);
            }
        }
        _ => {}
    }
}

/// Serialize a value to canonical JSON bytes:
/// * keys sorted lexicographically
/// * compact representation (no extra spaces)
pub fn canonical_json_bytes<T: Serialize>(value: &T) -> Result<Vec<u8>, serde_json::Error> {
    let mut json_value = serde_json::to_value(value)?;
    sort_json_value(&mut json_value);
    let s = serde_json::to_string(&json_value)?; // compact by default
    Ok(s.into_bytes())
}

/// Compute a SHA-256 hash and return it as a 0x-prefixed hex string.
pub fn sha256_hex_prefixed(data: &[u8]) -> String {
    let mut hasher = Sha256::new();
    hasher.update(data);
    let digest = hasher.finalize();
    format!("0x{}", hex::encode(digest))
}

/// Compute a deterministic report hash from a report-like value.
pub fn compute_report_hash<T: Serialize>(report: &T) -> Result<String, serde_json::Error> {
    let canonical = canonical_json_bytes(report)?;
    Ok(sha256_hex_prefixed(&canonical))
}

/// Generate a random nonce to bind attestations and payloads.
pub fn generate_tee_nonce() -> String {
    let mut nonce = [0u8; 32];
    OsRng.fill_bytes(&mut nonce);
    format!("0x{}", hex::encode(nonce))
}

/// Sign the canonical JSON of the payload with the enclave private key.
///
/// Returns a 0x-prefixed hex string representing the Ed25519 signature.
pub fn sign_payload<T: Serialize>(payload: &T) -> Result<String, serde_json::Error> {
    let canonical = canonical_json_bytes(payload)?;
    let signature = SIGNING_KEY.sign(&canonical);
    Ok(format!("0x{}", hex::encode(signature.to_bytes())))
}

/// Simulate "encrypting" a blob by hashing the dataset contents plus an execution id.
///
/// This returns a deterministic-looking walrus-style blob identifier, e.g.
/// `walrus://0x...`, without performing any real encryption.
pub fn simulate_encrypt_blob_id(dataset_root: &Path, execution_id: &str) -> String {
    let mut hasher = Sha256::new();
    hasher.update(execution_id.as_bytes());

    for entry in WalkDir::new(dataset_root).into_iter().filter_map(Result::ok) {
        if !entry.file_type().is_file() {
            continue;
        }
        let path = entry.path();
        hasher.update(path.to_string_lossy().as_bytes());
        if let Ok(bytes) = fs::read(path) {
            hasher.update(&bytes);
        }
    }

    let digest = hasher.finalize();
    format!("walrus://0x{}", hex::encode(digest))
}


