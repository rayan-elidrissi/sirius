use std::fs;
use std::path::{Path, PathBuf};

use regex::Regex;
use walkdir::WalkDir;

use crate::models::ComplianceFinding;

// Simple regex patterns for demo purposes.
lazy_static::lazy_static! {
    static ref EMAIL_REGEX: Regex = Regex::new(r"[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+").unwrap();
    static ref PHONE_REGEX: Regex = Regex::new(r"\+?\d[\d\s\-().]{7,}\d").unwrap();
    static ref IBAN_REGEX: Regex = Regex::new(r"\b[A-Z]{2}\d{2}[A-Z0-9]{11,30}\b").unwrap();
}

fn read_text_file(path: &Path) -> String {
    match fs::read(path) {
        Ok(bytes) => String::from_utf8_lossy(&bytes).into_owned(),
        Err(_) => String::new(),
    }
}

fn iter_files(root: &Path) -> Vec<PathBuf> {
    WalkDir::new(root)
        .into_iter()
        .filter_map(Result::ok)
        .filter(|e| e.file_type().is_file())
        .map(|e| e.into_path())
        .collect()
}

/// Recursively scan all files under `dataset_root` for simple PII patterns.
pub fn scan_dataset_for_pii(dataset_root: &Path) -> Vec<ComplianceFinding> {
    let mut findings = Vec::new();

    for file_path in iter_files(dataset_root) {
        let contents = read_text_file(&file_path);
        if contents.is_empty() {
            continue;
        }

        let relative = match file_path.strip_prefix(dataset_root) {
            Ok(p) => p.to_string_lossy().to_string(),
            Err(_) => file_path.to_string_lossy().to_string(),
        };

        for mat in EMAIL_REGEX.find_iter(&contents) {
            findings.push(ComplianceFinding {
                finding_type: "EMAIL".to_string(),
                path: relative.clone(),
                detail: mat.as_str().to_string(),
            });
        }

        for mat in PHONE_REGEX.find_iter(&contents) {
            findings.push(ComplianceFinding {
                finding_type: "PHONE".to_string(),
                path: relative.clone(),
                detail: mat.as_str().to_string(),
            });
        }

        for mat in IBAN_REGEX.find_iter(&contents) {
            findings.push(ComplianceFinding {
                finding_type: "IBAN".to_string(),
                path: relative.clone(),
                detail: mat.as_str().to_string(),
            });
        }
    }

    findings
}

/// Compute verdict and score based on the number of findings.
///
/// Rules:
/// - 0 findings  -> "ALLOW", 100
/// - <3 findings -> "WARN",  70
/// - >=3         -> "BLOCK", 20
pub fn compute_verdict_and_score(findings: &[ComplianceFinding]) -> (String, i32) {
    let count = findings.len();
    if count == 0 {
        ("ALLOW".to_string(), 100)
    } else if count < 3 {
        ("WARN".to_string(), 70)
    } else {
        ("BLOCK".to_string(), 20)
    }
}


