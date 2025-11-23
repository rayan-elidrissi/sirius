use std::collections::HashMap;
use std::env;
use std::path::Path;

use reqwest::Client;
use serde::Deserialize;
use serde_json::{json, Value};
use walkdir::WalkDir;

/// Lightweight view of Anthropic messages.create response.
#[derive(Debug, Deserialize)]
struct AnthMessageResponse {
    content: Vec<AnthContentBlock>,
}

#[derive(Debug, Deserialize)]
#[serde(tag = "type", rename_all = "lowercase")]
enum AnthContentBlock {
    Text { text: String },
    #[serde(other)]
    Other,
}

fn collect_dataset_stats(root: &Path) -> (usize, u64, HashMap<String, usize>) {
    let mut file_count = 0usize;
    let mut total_size = 0u64;
    let mut file_types: HashMap<String, usize> = HashMap::new();

    for entry in WalkDir::new(root).into_iter().filter_map(Result::ok) {
        if !entry.file_type().is_file() {
            continue;
        }
        file_count += 1;
        let path = entry.path();
        let ext = path
            .extension()
            .and_then(|s| s.to_str())
            .unwrap_or("unknown")
            .to_lowercase();
        *file_types.entry(ext).or_insert(0) += 1;

        if let Ok(meta) = path.metadata() {
            total_size = total_size.saturating_add(meta.len());
        }
    }

    (file_count, total_size, file_types)
}

fn build_prompt(
    dataset_id: &str,
    root: &Path,
    execution_id: &str,
    weapon_flag: bool,
    encrypted_blob_id: &str,
) -> String {
    let (file_count, total_size, file_types) = collect_dataset_stats(root);

    let file_types_json = serde_json::to_string(&file_types).unwrap_or_else(|_| "{}".into());

    format!(
        r#"
You are a compliance engine running inside a TEE.

You receive information about a dataset and must output a JSON report in a
very strict format, similar to this example (do NOT reuse the example values):

<example>
{{
  "report_version": "1.0.3",
  "timestamp_utc": "2025-11-23T02:54:11Z",
  "execution_id": "exec-...",
  "nautilus_node_id": "naut-node-...",
  "enclave_type": "sgx-dcap",
  "enclave_runtime_version": "2.7.1",
  "attestation": {{ "...": "..." }},
  "input_validation": {{ "...": "..." }},
  "dataset_insights": {{ "...": "..." }},
  "crypto_firewall": {{ "...": "..." }},
  "processing_steps": [ {{ "step": "...", "hash": "0x..." }} ],
  "encrypted_output": {{ "...": "..." }},
  "onchain": {{ "...": "..." }},
  "signature": {{ "...": "..." }},
  "output_artifact": {{ "...": "..." }}
}}
</example>

Your task:
- Produce a JSON object with the SAME structure and field names as the example.
- Values should be plausible but synthetic (you are not connected to any chain).
- You MUST add a top-level boolean field "weapon_flag" and set it to {weapon_flag}.
- You MUST set "execution_id" exactly to "{execution_id}".
- You MUST set "output_artifact.encrypted_blob_id" exactly to "{encrypted_blob_id}".
- Do NOT wrap your answer in Markdown or code fences.
- Output ONLY valid JSON, no comments, no extra text.

Base your high-level narrative on the following dataset info:
- dataset_id = "{dataset_id}"
- file_count = {file_count}
- total_size_bytes ≈ {total_size}
- file_types_distribution = {file_types_json}
"#
    )
}

/// Call Claude's messages API to obtain a Nautilus-like JSON report for this dataset.
pub async fn generate_nautilus_like_report(
    dataset_id: &str,
    dataset_root: &Path,
    execution_id: &str,
    weapon_flag: bool,
    encrypted_blob_id: &str,
) -> Result<Value, String> {
    let api_key = env::var("ANTHROPIC_API_KEY")
        .map_err(|_| "ANTHROPIC_API_KEY environment variable is not set".to_string())?;

    let client = Client::builder()
        .user_agent("tee-substitute-rust/0.1.0")
        .build()
        .map_err(|e| format!("Failed to build HTTP client: {e}"))?;

    let prompt = build_prompt(dataset_id, dataset_root, execution_id, weapon_flag, encrypted_blob_id);

    let body = json!({
        "model": "claude-3-5-sonnet-20241022",
        "max_tokens": 2000,
        "temperature": 0.1,
        "messages": [
            {
                "role": "user",
                "content": prompt
            }
        ]
    });

    let resp = client
        .post("https://api.anthropic.com/v1/messages")
        .header("x-api-key", api_key)
        .header("anthropic-version", "2023-06-01")
        .json(&body)
        .send()
        .await
        .map_err(|e| format!("HTTP error calling Claude: {e}"))?;

    if !resp.status().is_success() {
        let status = resp.status();
        let text = resp.text().await.unwrap_or_default();
        return Err(format!(
            "Claude API returned non-success status {status}: {text}"
        ));
    }

    let parsed: AnthMessageResponse = resp
        .json()
        .await
        .map_err(|e| format!("Failed to parse Claude response JSON: {e}"))?;

    let mut combined = String::new();
    for block in parsed.content {
        if let AnthContentBlock::Text { text } = block {
            combined.push_str(&text);
        }
    }

    let trimmed = combined.trim();

    // Best-effort removal of Markdown code fences if present.
    let cleaned = if trimmed.starts_with("```") {
        let without_fences = trimmed.trim_matches('`');
        // Might start with 'json\n'.
        match without_fences.strip_prefix("json") {
            Some(rest) => rest.trim_start(),
            None => without_fences,
        }
        .to_string()
    } else {
        trimmed.to_string()
    };

    serde_json::from_str::<Value>(&cleaned)
        .map_err(|e| format!("Failed to parse Claude text as JSON: {e}"))
}


