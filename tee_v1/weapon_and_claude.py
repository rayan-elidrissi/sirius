"""
Extra analysis for the TEE substitute:

* Randomly sample files from the dataset folder.
* If the sampled file is an image (.png / .jpg / .jpeg), run the local
  YOLOv8 gun detection model and set `weapon_flag=True` when the probability
  is greater than 0.5.
* Always call the Claude API with a specific prompt and ask it to return a
  Nautilus-like JSON report, extended with a `weapon_flag` field.
"""

from __future__ import annotations

import json
import os
import random
from pathlib import Path
from typing import Any, Dict, List, Optional, Sequence

import httpx
from anthropic import Anthropic
from ultralytics import YOLO

IMAGE_EXTENSIONS = {".png", ".jpg", ".jpeg"}


def _iter_files(root: Path) -> List[Path]:
    return [p for p in root.rglob("*") if p.is_file()]


def sample_files(dataset_root: Path, sample_size: int = 1) -> List[Path]:
    """
    Randomly sample up to `sample_size` files from the dataset directory.
    """
    files = _iter_files(dataset_root)
    if not files:
        return []
    if len(files) <= sample_size:
        return files
    return random.sample(files, sample_size)


def _load_yolo_model() -> Optional[YOLO]:
    """
    Load the YOLOv8 gun detection model if available.

    The model path can be overridden with GUN_MODEL_PATH. Otherwise we fall
    back to a best-effort default inside the Guns-Detection-YOLOv8-main repo.
    """
    model_path = os.getenv("GUN_MODEL_PATH")
    base = Path(__file__).resolve().parent / "Guns-Detection-YOLOv8-main"

    if not model_path:
        # Prefer a trained weights file if it exists, otherwise yolov8n.pt.
        candidate_paths: Sequence[Path] = [
            base
            / "runs"
            / "detect"
            / "train18"
            / "weights"
            / "best.pt",
            base / "yolov8n.pt",
        ]
        for p in candidate_paths:
            if p.exists():
                model_path = str(p)
                break

    if not model_path:
        return None

    try:
        return YOLO(model_path)
    except Exception:
        # In dev mode we don't hard-fail if the model can't be loaded.
        return None


_YOLO_MODEL: Optional[YOLO] = _load_yolo_model()


def run_gun_detection(image_path: Path) -> float:
    """
    Run the YOLOv8 gun detection model on an image and return a probability
    estimate in [0, 1]. If detection is unavailable, returns 0.0.
    """
    if _YOLO_MODEL is None:
        return 0.0

    try:
        results = _YOLO_MODEL.predict(
            source=str(image_path),
            imgsz=640,
            verbose=False,
        )
    except Exception:
        return 0.0

    max_conf = 0.0
    for r in results:
        # Best-effort: prefer explicit probabilities, otherwise box confidence.
        if getattr(r, "probs", None) is not None and r.probs is not None:
            try:
                conf = float(r.probs.top1conf)
                max_conf = max(max_conf, conf)
                continue
            except Exception:
                pass
        if getattr(r, "boxes", None) is not None and r.boxes is not None:
            try:
                for b in r.boxes:
                    if getattr(b, "conf", None) is not None:
                        max_conf = max(max_conf, float(b.conf))
            except Exception:
                pass

    return max_conf


def compute_weapon_flag_from_samples(sampled_files: Sequence[Path]) -> bool:
    """
    Given a list of sampled files, run gun detection on image files and
    return True if any image yields a probability > 0.5.
    """
    for path in sampled_files:
        if path.suffix.lower() in IMAGE_EXTENSIONS:
            prob = run_gun_detection(path)
            if prob > 0.5:
                return True
    return False


def _build_claude_client() -> Anthropic:
    api_key = os.getenv("ANTHROPIC_API_KEY")
    if not api_key:
        raise RuntimeError("ANTHROPIC_API_KEY environment variable is not set")
    # Use httpx client to play nicer inside FastAPI.
    client = httpx.Client(timeout=60)
    return Anthropic(api_key=api_key, http_client=client)


def call_claude_report(
    dataset_id: str,
    dataset_path: Path,
    weapon_flag: bool,
) -> Dict[str, Any]:
    """
    Call Claude with a fixed prompt asking for a Nautilus-like report JSON,
    extended with a `weapon_flag` boolean field.
    """
    client = _build_claude_client()

    # Simple dataset stats to give Claude a bit of context.
    all_files = _iter_files(dataset_path)
    file_count = len(all_files)
    file_types: Dict[str, int] = {}
    total_size = 0
    for f in all_files:
        ext = f.suffix.lower().lstrip(".") or "unknown"
        file_types[ext] = file_types.get(ext, 0) + 1
        try:
            total_size += f.stat().st_size
        except OSError:
            pass

    prompt = f"""
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
- Produce a JSON object with the same structure and field names as the example.
- Values should be plausible but synthetic (you are not connected to any chain).
- You MUST add a top-level field "weapon_flag": true or false.
- Set "weapon_flag" to {str(weapon_flag).lower()} given the analysis.
- Base your high-level narrative on the following dataset info:
  - dataset_id = "{dataset_id}"
  - file_count = {file_count}
  - total_size_bytes ≈ {total_size}
  - file_types_distribution = {json.dumps(file_types)}

Output ONLY valid JSON, no markdown, no comments.
"""

    response = client.messages.create(
        model="claude-3-5-sonnet-latest",
        max_tokens=1500,
        temperature=0.1,
        messages=[
            {
                "role": "user",
                "content": prompt,
            }
        ],
    )

    # Extract text content from Claude response.
    text_chunks = []
    for block in response.content:
        if block.type == "text":
            text_chunks.append(block.text)
    raw = "".join(text_chunks).strip()

    # Best-effort: strip markdown fences if present.
    if raw.startswith("```"):
        raw = raw.strip("`")
        # Remove potential json tag.
        if raw.lower().startswith("json"):
            raw = raw[4:]

    return json.loads(raw)


