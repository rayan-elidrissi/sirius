## TEE Substitute – Rust Implementation

This crate implements the local **TEE substitute** microservice in Rust. It
exposes an HTTP API compatible with the expected Nautilus TEE contract so that
SIRIUS Core and the Move smart contracts can be wired against it without later
changes (only the endpoint URL needs to change when switching to a real TEE).

### Features

- **POST `/analyze-dataset`** – accepts the Nautilus-like request payload.
- **Local datasets** – reads files from a folder instead of decrypting a Walrus blob.
- **PII-like scanning** – regex-based detection of emails, phone numbers, and IBANs.
- **Compliance report** – builds a `ComplianceReport` with verdict and score.
- **Deterministic `reportHash`** – SHA‑256 over canonical JSON of the report.
- **Substitute attestation** – generates a local Ed25519 keypair and signs the payload.
- **Provider marker** – attestation is clearly marked with `provider: "LOCAL_DEV_SUBSTITUTE"`.

### Dataset layout

By default, the service expects datasets to live under:

```text
<repo_root>/dev_datasets/<encryptedDataBlobId>/
```

You can override the base dataset path via:

```bash
export DEV_DATASET_BASE_PATH=/absolute/path/to/dev_datasets
```

In development, `encryptedDataBlobId` in the request is treated as a folder path
relative to this base.

### Building and running

From the repo root:

```bash
cargo run -p tee_substitute
```

This will start the service on `0.0.0.0:8001`.

You can then call:

```bash
curl -X POST http://localhost:8001/analyze-dataset \
  -H "Content-Type: application/json" \
  -d '{
    "datasetId": "example-dataset",
    "datasetMerkleRoot": "0xdeadbeef",
    "encryptedDataBlobId": "example-dataset",
    "policyVersion": "v1",
    "modelVersion": "pii-scanner-0.1"
  }'
```

The response will have the shape:

```json
{
  "attestation": { "...": "..." },
  "payload": { "...": "..." },
  "signature": "0x...",
  "report": { "...": "..." }
}
```

## Substitute Enclave – Local Nautilus Dev Service

This folder contains a small FastAPI microservice that mimics the Nautilus TEE
API used by SIRIUS. It runs entirely on the developer machine in the clear and
is intended **only for local development**.

### Features

- **POST `/analyze-dataset`**: accepts a Nautilus-like request payload.
- **Local datasets**: loads files from a folder instead of decrypting a Walrus blob.
- **PII-like scanning**: simple regex detection of emails, phone numbers and IBANs.
- **Compliance report**: builds a `ComplianceReport` structure with verdict/score.
- **Deterministic `reportHash`**: SHA-256 over canonical JSON of the report.
- **Substitute attestation**: generates a local Ed25519 keypair and signs the payload.

The response shape matches what SIRIUS Core will later send to the on-chain
Move function, so swapping in the real TEE should only require changing the
endpoint URL.

### Installation

From the repo root:

```bash
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\\Scripts\\activate
pip install -r substitute_enclave/requirements.txt
```

### Dataset layout

By default, the service expects datasets to live under:

```text
<repo_root>/dev_datasets/<encryptedDataBlobId>/
```

You can override the base dataset path via:

```bash
export DEV_DATASET_BASE_PATH=/absolute/path/to/dev_datasets
```

In development, `encryptedDataBlobId` in the request is treated as a folder path
relative to this base.

### Running the service

From the repo root (with the virtualenv activated):

```bash
uvicorn substitute_enclave.main:app --reload --host 0.0.0.0 --port 8001
```

Then POST to:

```text
http://localhost:8001/analyze-dataset
```

with a body like:

```json
{
  "datasetId": "example-dataset",
  "datasetMerkleRoot": "0xdeadbeef",
  "encryptedDataBlobId": "example-dataset",
  "policyVersion": "v1",
  "modelVersion": "pii-scanner-0.1"
}
```


