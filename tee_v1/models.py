"""
Pydantic models for the substitute enclave API.

These mirror the shapes expected from the real Nautilus TEE so that SIRIUS Core
and Move smart contracts can be wired against this service without later
changes, aside from the endpoint URL.
"""

from __future__ import annotations

from typing import List, Literal

from pydantic import BaseModel, Field


class AnalyzeDatasetRequest(BaseModel):
    """
    Request body for POST /analyze-dataset.

    In production, `encryptedDataBlobId` will reference a Walrus blob. In local
    development it is treated as a dataset folder path relative to the base
    dataset directory (see `config.get_dataset_base_path`).
    """

    datasetId: str = Field(..., description="Logical identifier of the dataset")
    datasetMerkleRoot: str = Field(
        ...,
        description="Hex-encoded Merkle root (0x-prefixed) that commits to the dataset contents",
    )
    encryptedDataBlobId: str = Field(
        ...,
        description="In dev: folder path relative to base dataset path; in prod: Walrus blob id",
    )
    policyVersion: str = Field(..., description="Compliance policy version applied")
    modelVersion: str = Field(..., description="Version of the PII analysis model")


class ComplianceFinding(BaseModel):
    """
    Represents a single compliance / PII finding within the dataset.
    """

    type: str = Field(..., description="Type of finding, e.g. EMAIL, PHONE, IBAN")
    path: str = Field(..., description="File path within the dataset where it was found")
    detail: str = Field(
        ..., description="Short detail describing the finding (e.g. matched value)"
    )


class ComplianceReport(BaseModel):
    """
    High-level compliance report for a dataset, derived from PII scanning.
    """

    datasetId: str
    datasetMerkleRoot: str
    encryptedDataBlobId: str
    policyVersion: str
    modelVersion: str

    verdict: Literal["ALLOW", "WARN", "BLOCK"]
    score: int = Field(..., ge=0, le=100)

    findings: List[ComplianceFinding] = Field(
        default_factory=list, description="List of PII / compliance findings"
    )


class TeePayload(BaseModel):
    """
    Payload that is signed by the enclave keypair.

    This structure is what gets hashed and verified on-chain later.
    """

    datasetMerkleRoot: str
    encryptedDataBlobId: str
    policyVersion: str
    reportHash: str
    modelVersion: str
    teeNonce: str


class Attestation(BaseModel):
    """
    Substitute attestation returned alongside the signed payload.

    This is deliberately marked as LOCAL_DEV_SUBSTITUTE so it cannot be
    confused with a real TEE attestation.
    """

    teeMeasurement: str
    teeNonce: str
    enclavePubKey: str
    provider: Literal["LOCAL_DEV_SUBSTITUTE"]


class AnalyzeDatasetResponse(BaseModel):
    """
    Full response returned by POST /analyze-dataset.
    """

    attestation: Attestation
    payload: TeePayload
    signature: str
    report: ComplianceReport


