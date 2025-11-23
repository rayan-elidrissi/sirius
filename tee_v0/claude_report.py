"""
Simple helper script to ask Claude whether an image contains a weapon and why.

It returns:
- `weapon` (bool): True if a firearm / weapon appears clearly dangerous.
- `description` (str): Short description of what is on the picture and why it
  is or is not considered dangerous.
- `decision` (bool): Overall safety decision (True = acceptable, False = unsafe).

Usage (from repo root, after installing requirements):

    # 1) Install deps
    pip install -r tee_v0/requirements.txt

    # 2) Set your Claude API key
    $env:ANTHROPIC_API_KEY="sk-ant-..."   # PowerShell
    # or
    export ANTHROPIC_API_KEY="sk-ant-..." # bash

    # 3) Run the script (uses tee_v0/bad_gun.jpg by default)
    python tee_v0/claude_report.py
"""

from __future__ import annotations

import base64
import json
import os
from pathlib import Path
from typing import Tuple

from anthropic import Anthropic


def load_image_base64(path: Path) -> Tuple[str, str]:
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
    Prompt asking Claude for a minimal structured judgment about the image.
    """
    return """
You are a safety classifier running inside a TEE.

You will receive a single image. Your job is to:
- Decide if the image clearly contains a firearm or other dangerous weapon.
- Briefly describe what is on the picture and why it is or isn't dangerous.

You MUST answer with a single JSON object of the form:

{
  "weapon": true or false,
  "description": "short explanation here",
  "decision": true or false
}

Semantics:
- `weapon` = true if a firearm or clearly dangerous weapon is visible.
- `decision` = false if the content is unsafe or the weapon is prominent;
  true if the image is acceptable (e.g. clearly toy / training / non-threatening).

Requirements:
- `weapon` MUST be a JSON boolean, not a string.
- `description` MUST be a short, human-readable English sentence.
- `decision` MUST be a JSON boolean, not a string.
- Output ONLY the JSON object, with no markdown, no code fences, no extra text.
"""


def clean_markdown_fences(raw: str) -> str:
    """
    Remove optional ```json ... ``` fences if Claude adds them by mistake.
    """
    text = raw.strip()
    if not text.startswith("```"):
        return text

    lines = text.splitlines()
    # drop first and last fence lines if present
    if lines and lines[0].startswith("```"):
        lines = lines[1:]
    if lines and lines[-1].startswith("```"):
        lines = lines[:-1]
    cleaned = "\n".join(lines).strip()
    if cleaned.lower().startswith("json"):
        cleaned = cleaned[4:].lstrip()
    return cleaned


def main() -> None:
    import sys
    
    api_key = os.getenv("ANTHROPIC_API_KEY")
    if not api_key:
        raise SystemExit("ANTHROPIC_API_KEY environment variable is not set")

    # Accept file path as command line argument, or use default
    if len(sys.argv) > 1:
        image_path = Path(sys.argv[1])
    else:
        image_path = Path(__file__).parent / "bad_gun.jpg"
    
    if not image_path.exists():
        raise SystemExit(f"Image not found: {image_path}")

    media_type, img_b64 = load_image_base64(image_path)

    client = Anthropic(api_key=api_key)
    prompt = build_prompt()

    response = client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=300,
        temperature=0.0,
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

    text_chunks = []
    for block in response.content:
        if block.type == "text":
            text_chunks.append(block.text)
    raw = "".join(text_chunks).strip()

    cleaned = clean_markdown_fences(raw)

    try:
        parsed = json.loads(cleaned)
    except json.JSONDecodeError:
        print("Raw Claude output (failed to parse as JSON):")
        print(raw)
        raise

    # Ensure we return exactly the expected fields.
    weapon = bool(parsed.get("weapon", False))
    description = str(parsed.get("description", "")).strip()
    decision = bool(parsed.get("decision", not weapon))

    result = {"weapon": weapon, "description": description, "decision": decision}

    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()


