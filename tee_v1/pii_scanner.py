"""
Simple PII-like scanning utilities for local dataset analysis.

This module recursively walks a dataset directory and applies regex-based
detectors for:
* Email addresses
* Phone numbers
* IBANs

It returns a list of `ComplianceFinding` instances plus helper functions to
derive a verdict and score.
"""

from __future__ import annotations

import re
from pathlib import Path
from typing import Iterable, List, Tuple

from .models import ComplianceFinding

# Very lightweight regex patterns for demo purposes.
EMAIL_REGEX = re.compile(r"[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+")
PHONE_REGEX = re.compile(r"\+?\d[\d\s\-().]{7,}\d")
IBAN_REGEX = re.compile(r"\b[A-Z]{2}\d{2}[A-Z0-9]{11,30}\b")


def _read_text_file(path: Path) -> str:
    """
    Read a file as text, falling back to ignoring errors for non-UTF-8 content.
    """
    try:
        return path.read_text(encoding="utf-8", errors="ignore")
    except OSError:
        return ""


def _iter_files(root: Path) -> Iterable[Path]:
    """
    Yield all files under the given root directory recursively.
    """
    for path in root.rglob("*"):
        if path.is_file():
            yield path


def scan_dataset_for_pii(dataset_root: Path) -> List[ComplianceFinding]:
    """
    Recursively scan all files under `dataset_root` for simple PII patterns.
    """
    findings: List[ComplianceFinding] = []

    for file_path in _iter_files(dataset_root):
        contents = _read_text_file(file_path)
        if not contents:
            continue

        relative_path = str(file_path.relative_to(dataset_root))

        for match in EMAIL_REGEX.finditer(contents):
            findings.append(
                ComplianceFinding(
                    type="EMAIL",
                    path=relative_path,
                    detail=match.group(0),
                )
            )

        for match in PHONE_REGEX.finditer(contents):
            findings.append(
                ComplianceFinding(
                    type="PHONE",
                    path=relative_path,
                    detail=match.group(0),
                )
            )

        for match in IBAN_REGEX.finditer(contents):
            findings.append(
                ComplianceFinding(
                    type="IBAN",
                    path=relative_path,
                    detail=match.group(0),
                )
            )

    return findings


def compute_verdict_and_score(
    findings: Iterable[ComplianceFinding],
) -> Tuple[str, int]:
    """
    Compute a coarse verdict and score based on the number of findings.

    Rules:
    - 0 findings  -> verdict="ALLOW", score=100
    - <3 findings -> verdict="WARN",  score=70
    - >=3         -> verdict="BLOCK", score=20
    """
    findings_list = list(findings)
    count = len(findings_list)

    if count == 0:
        return "ALLOW", 100
    if count < 3:
        return "WARN", 70
    return "BLOCK", 20


