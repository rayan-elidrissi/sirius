"""
FastAPI application exposing the substitute enclave API.

Endpoint:
    POST /analyze-dataset

This endpoint:
1. Accepts a Nautilus-like request payload.
2. Loads dataset files from a local folder (no decryption).
3. Runs simple PII detection.
4. Builds a `ComplianceReport`.
5. Computes a deterministic `reportHash` (SHA-256 of canonical JSON).
6. Generates a substitute attestation + Ed25519 signature.
7. Returns `{ attestation, payload, signature, report }`.
"""

from __future__ import annotations

from pathlib import Path
from typing import Any, Dict

from fastapi import FastAPI, HTTPException

from .config import resolve_dataset_path
from .crypto_utils import (
    ENCLAVE_MEASUREMENT,
    compute_report_hash,
    generate_tee_nonce,
    get_enclave_public_key_hex,
    sign_payload,
)
from .models import (
    AnalyzeDatasetRequest,
    AnalyzeDatasetResponse,
    Attestation,
    ComplianceReport,
    TeePayload,
)
from .pii_scanner import compute_verdict_and_score, scan_dataset_for_pii
from .weapon_and_claude import (
    call_claude_report,
    compute_weapon_flag_from_samples,
    sample_files,
)

app = FastAPI(
    title="SIRIUS Substitute Enclave",
    description="Local development substitute for Nautilus TEE attestation service.",
    version="0.1.0",
)


@app.get("/health", tags=["meta"])
async def health() -> dict:
    """
    Lightweight health check endpoint.
    """
    return {"status": "ok"}


@app.post("/analyze-dataset", response_model=AnalyzeDatasetResponse, tags=["analysis"])
async def analyze_dataset(request: AnalyzeDatasetRequest) -> AnalyzeDatasetResponse:
    """
    Analyze a dataset stored on the local filesystem and return a compliance
    report plus a signed payload that mimics the Nautilus TEE output shape.
    """
    dataset_path: Path = resolve_dataset_path(request.encryptedDataBlobId)

    if not dataset_path.exists() or not dataset_path.is_dir():
        raise HTTPException(
            status_code=404,
            detail=f"Dataset directory not found: {dataset_path}",
        )

    # 1–3. PII scanning
    findings = scan_dataset_for_pii(dataset_path)
    verdict, score = compute_verdict_and_score(findings)

    # Extra step: random sampling + gun detection (weapon_flag).
    sampled_files = sample_files(dataset_path, sample_size=1)
    weapon_flag = compute_weapon_flag_from_samples(sampled_files)

    # Optional: call Claude to generate a Nautilus-like JSON report which
    # includes the weapon_flag. This is side-effectful (external API) and may
    # fail; we keep the core compliance report independent.
    claude_report: Dict[str, Any] | None = None
    try:
        claude_report = call_claude_report(
            dataset_id=request.datasetId,
            dataset_path=dataset_path,
            weapon_flag=weapon_flag,
        )
    except Exception:
        claude_report = None

    # 4. Build ComplianceReport
    report = ComplianceReport(
        datasetId=request.datasetId,
        datasetMerkleRoot=request.datasetMerkleRoot,
        encryptedDataBlobId=request.encryptedDataBlobId,
        policyVersion=request.policyVersion,
        modelVersion=request.modelVersion,
        verdict=verdict,
        score=score,
        findings=findings,
    )

    # Attach extra insights as attributes on the report object so that they
    # are included in the canonical JSON and reportHash while keeping the
    # core schema stable for callers that ignore them.
    # Pydantic will serialise them under extra keys.
    setattr(report, "weapon_flag", weapon_flag)
    if claude_report is not None:
        setattr(report, "nautilus_like_report", claude_report)

    # 5. Deterministic reportHash
    report_hash = compute_report_hash(report)

    # 6. Build payload + signature
    tee_nonce = generate_tee_nonce()
    payload = TeePayload(
        datasetMerkleRoot=request.datasetMerkleRoot,
        encryptedDataBlobId=request.encryptedDataBlobId,
        policyVersion=request.policyVersion,
        reportHash=report_hash,
        modelVersion=request.modelVersion,
        teeNonce=tee_nonce,
    )

    signature = sign_payload(payload)

    # Substitute attestation
    attestation = Attestation(
        teeMeasurement=ENCLAVE_MEASUREMENT,
        teeNonce=tee_nonce,
        enclavePubKey=get_enclave_public_key_hex(),
        provider="LOCAL_DEV_SUBSTITUTE",
    )

    return AnalyzeDatasetResponse(
        attestation=attestation,
        payload=payload,
        signature=signature,
        report=report,
    )


