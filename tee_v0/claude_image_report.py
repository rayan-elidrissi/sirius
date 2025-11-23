"""
One-off script to call Claude with an image and ask for a Nautilus-style JSON report.

Usage (from repo root, after installing requirements):

    # 1) Install deps
    pip install -r tee_v0/requirements.txt

    # 2) Set your Claude API key
    $env:ANTHROPIC_API_KEY="sk-ant-..."   # PowerShell
    # or
    export ANTHROPIC_API_KEY="sk-ant-..." # bash

    # 3) Run the script
    python tee_v0/claude_image_report.py
"""

from __future__ import annotations

import base64
import json
import os
from pathlib import Path

from anthropic import Anthropic


def load_image_base64(path: Path) -> tuple[str, str]:
    """
    Load an image and return (media_type, base64_data).
    """
    suffix = path.suffix.lower()
    if suffix in {".jpg", ".jpeg"}:
        media_type = "image/jpeg"
    elif suffix == ".png":
        media_type = "image/png"
    else:
        raise ValueError(f"Unsupported image extension for {path}")

    data = path.read_bytes()
    return media_type, base64.b64encode(data).decode("utf-8")


def build_prompt() -> str:
    """
    Build the text prompt asking Claude for a Nautilus-like JSON report.
    """
    return """
You are a compliance engine running inside a TEE.

You receive an input dataset that in this case is just a single image.
You must output a JSON report in a very strict format, similar to this example
(do NOT reuse the exact example values):

<example>
{
  "report_version": "1.0.3",
  "timestamp_utc": "2025-11-23T02:54:11Z",
  "execution_id": "exec-8f92c1b7-3aa1-4ef0-aa19-988021d3a7ee",
  "nautilus_node_id": "naut-node-eu-west-2-004",
  "enclave_type": "sgx-dcap",
  "enclave_runtime_version": "2.7.1",
  "attestation": {
    "actual_mrenclave": "0x...",
    "expected_mrenclave": "0x...",
    "code_match": true,
    "certificate_chain": ["intel-root-cert-0x55aa"],
    "attestation_signature": "0x...",
    "debug_mode": false,
    "anti_replay_nonce": {
      "nonce_client": "0x...",
      "nonce_backend": "0x...",
      "combined_nonce_hash": "0x..."
    }
  },
  "input_validation": { "...": "..." },
  "dataset_insights": { "...": "..." },
  "crypto_firewall": { "...": "..." },
  "weapon_detection": "False"
  "processing_steps": [ { "step": "validate_manifest", "hash": "0x..." } ],
  "encrypted_output": { "...": "..." },
  "onchain": { "...": "..." },
  "signature": { "...": "..." },
  "output_artifact": { "...": "..." }
}
</example>

Your task:
- Produce a JSON object with the SAME structure and field names as the example.
- Values should be plausible but synthetic (you are not connected to any chain).
- You MUST add a top-level boolean field "weapon_flag" and set it to true if the image
  likely contains a firearm, false otherwise.
- Base your assessment of weapon_flag on the image you will receive.
- Do NOT wrap your answer in Markdown or code fences.
- Output ONLY valid JSON, no comments, no extra text.
"""


def main() -> None:
    api_key = os.getenv("ANTHROPIC_API_KEY")
    if not api_key:
        raise SystemExit("ANTHROPIC_API_KEY environment variable is not set")

    image_path = Path(__file__).parent / "bad_gun.jpg"
    if not image_path.exists():
        raise SystemExit(f"Image not found: {image_path}")

    media_type, img_b64 = load_image_base64(image_path)

    client = Anthropic(api_key=api_key)

    prompt = build_prompt()

    response = client.messages.create(
        # Use Claude Sonnet 4.5 (newer generation) as per current API docs.
        model="claude-haiku-4-5-20251001",
        max_tokens=1500,
        temperature=0.1,
        messages=[
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": prompt},
                    {
                        "type": "image",
                        "source": {
                            "type": "base64",
                            "media_type": media_type,
                            "data": img_b64,
                        },
                    },
                ],
            }
        ],
    )

    # Concatenate text blocks and parse as JSON.
    text_chunks = []
    for block in response.content:
        if block.type == "text":
            text_chunks.append(block.text)
    raw = "".join(text_chunks).strip()

    # Some models may wrap the JSON in Markdown code fences (```json ... ```).
    # Strip these fences before attempting to parse.
    cleaned = raw
    if cleaned.startswith("```"):
        lines = cleaned.splitlines()
        if lines and lines[0].startswith("```"):
            lines = lines[1:]
        if lines and lines[-1].startswith("```"):
            lines = lines[:-1]
        cleaned = "\n".join(lines).strip()
        # Also handle a leading 'json' tag line if present.
        if cleaned.lower().startswith("json"):
            cleaned = cleaned[4:].lstrip()

    try:
        parsed = json.loads(cleaned)
    except json.JSONDecodeError:
        print("Raw Claude output (failed to parse as JSON):")
        print(raw)
        raise

    print(json.dumps(parsed, indent=2))


if __name__ == "__main__":
    main()


