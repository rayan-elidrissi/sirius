use serde::{Deserialize, Serialize};

/// Request body for POST /analyze-dataset.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AnalyzeDatasetRequest {
    #[serde(rename = "datasetId")]
    pub dataset_id: String,
    #[serde(rename = "datasetMerkleRoot")]
    pub dataset_merkle_root: String,
    #[serde(rename = "encryptedDataBlobId")]
    pub encrypted_data_blob_id: String,
    #[serde(rename = "policyVersion")]
    pub policy_version: String,
    #[serde(rename = "modelVersion")]
    pub model_version: String,
}

/// Represents a single compliance / PII finding within the dataset.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ComplianceFinding {
    #[serde(rename = "type")]
    pub finding_type: String,
    #[serde(rename = "path")]
    pub path: String,
    #[serde(rename = "detail")]
    pub detail: String,
}

/// High-level compliance report derived from PII scanning.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ComplianceReport {
    #[serde(rename = "datasetId")]
    pub dataset_id: String,
    #[serde(rename = "datasetMerkleRoot")]
    pub dataset_merkle_root: String,
    #[serde(rename = "encryptedDataBlobId")]
    pub encrypted_data_blob_id: String,
    #[serde(rename = "policyVersion")]
    pub policy_version: String,
    #[serde(rename = "modelVersion")]
    pub model_version: String,
    #[serde(rename = "verdict")]
    pub verdict: String,
    #[serde(rename = "score")]
    pub score: i32,
    #[serde(rename = "findings")]
    pub findings: Vec<ComplianceFinding>,
}

/// Payload that is signed by the enclave keypair.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TeePayload {
    #[serde(rename = "datasetMerkleRoot")]
    pub dataset_merkle_root: String,
    #[serde(rename = "encryptedDataBlobId")]
    pub encrypted_data_blob_id: String,
    #[serde(rename = "policyVersion")]
    pub policy_version: String,
    #[serde(rename = "reportHash")]
    pub report_hash: String,
    #[serde(rename = "modelVersion")]
    pub model_version: String,
    #[serde(rename = "teeNonce")]
    pub tee_nonce: String,
}

/// Substitute attestation returned alongside the signed payload.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Attestation {
    #[serde(rename = "teeMeasurement")]
    pub tee_measurement: String,
    #[serde(rename = "teeNonce")]
    pub tee_nonce: String,
    #[serde(rename = "enclavePubKey")]
    pub enclave_pub_key: String,
    #[serde(rename = "provider")]
    pub provider: String,
}

/// Full response returned by POST /analyze-dataset.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AnalyzeDatasetResponse {
    #[serde(rename = "attestation")]
    pub attestation: Attestation,
    #[serde(rename = "payload")]
    pub payload: TeePayload,
    #[serde(rename = "signature")]
    pub signature: String,
    #[serde(rename = "report")]
    pub report: ComplianceReport,
}


