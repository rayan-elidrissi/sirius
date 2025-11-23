"""
Cryptographic helpers for the substitute enclave.

This module is responsible for:
* Generating a local Ed25519 keypair on startup.
* Computing canonical JSON encodings.
* Hashing reports to obtain a deterministic `reportHash`.
* Signing payloads and exposing the enclave public key.
"""

from __future__ import annotations

import hashlib
import json
import secrets
from typing import Any, Mapping

from cryptography.hazmat.primitives.asymmetric import ed25519
from cryptography.hazmat.primitives.serialization import Encoding, PublicFormat

# Constant measurement string for the local substitute TEE.
ENCLAVE_MEASUREMENT = "substitute-local-dev-nautilus-v1"


def _generate_keypair() -> ed25519.Ed25519PrivateKey:
    """
    Generate a fresh Ed25519 private key for this process.

    For local development we do not persist the key. Each process start gets a
    new keypair. In a real TEE deployment this would be managed by the enclave
    platform.
    """
    return ed25519.Ed25519PrivateKey.generate()


_PRIVATE_KEY = _generate_keypair()
_PUBLIC_KEY = _PRIVATE_KEY.public_key()


def get_enclave_public_key_hex() -> str:
    """
    Return the enclave public key as a 0x-prefixed hex string.
    """
    raw = _PUBLIC_KEY.public_bytes(Encoding.Raw, PublicFormat.Raw)
    return "0x" + raw.hex()


def canonical_json_bytes(obj: Any) -> bytes:
    """
    Serialize an object to canonical JSON bytes.

    The object can be:
    * A plain mapping / dict.
    * A Pydantic model (anything with a `.dict()` method).
    """
    if hasattr(obj, "dict"):
        obj = obj.dict()  # type: ignore[assignment]
    if not isinstance(obj, Mapping):
        raise TypeError(
            "canonical_json_bytes expects a mapping or Pydantic model with .dict()"
        )

    return json.dumps(obj, sort_keys=True, separators=(",", ":")).encode("utf-8")


def sha256_hex_prefixed(data: bytes) -> str:
    """
    Compute a SHA-256 hash and return it as a 0x-prefixed hex string.
    """
    digest = hashlib.sha256(data).hexdigest()
    return "0x" + digest


def compute_report_hash(report: Any) -> str:
    """
    Compute a deterministic report hash from a `ComplianceReport`-like object.

    The report is first turned into canonical JSON and then hashed with
    SHA-256. The return value is a 0x-prefixed hex string.
    """
    canonical = canonical_json_bytes(report)
    return sha256_hex_prefixed(canonical)


def generate_tee_nonce() -> str:
    """
    Generate a random nonce to bind attestations and payloads.

    Represented as a 0x-prefixed hex string.
    """
    nonce = secrets.token_bytes(32)
    return "0x" + nonce.hex()


def sign_payload(payload: Any) -> str:
    """
    Sign the canonical JSON of the payload with the enclave private key.

    Returns a 0x-prefixed hex string representing the Ed25519 signature.
    """
    canonical = canonical_json_bytes(payload)
    signature = _PRIVATE_KEY.sign(canonical)
    return "0x" + signature.hex()


