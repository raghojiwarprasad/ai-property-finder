"""Workflow state derived from files on disk (no database). Decision = accept/reject by the reviewer."""
from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path

from . import config
from .validate import load_report


def decision_path(dataset_id: str) -> Path:
    return config.working_dir(dataset_id) / "decision.json"


def load_decision(dataset_id: str) -> dict | None:
    p = decision_path(dataset_id)
    return json.loads(p.read_text()) if p.exists() else None


def record_decision(dataset_id: str, decision: str, note: str = "") -> dict:
    if decision not in ("accepted", "rejected"):
        raise ValueError("decision must be 'accepted' or 'rejected'")
    report = load_report(dataset_id)
    if report is None:
        raise ValueError("Run validation before accepting or rejecting the dataset.")
    if decision == "accepted" and not report["passed"]:
        raise ValueError(f"Cannot accept: validation reported {report['summary']['errors']} error(s). Fix the dataset and re-validate.")
    d = {
        "decision": decision,
        "note": note,
        "decided_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "validation_generated_at": report["generated_at"],
    }
    decision_path(dataset_id).write_text(json.dumps(d, indent=2))
    return d


def clear_decision(dataset_id: str) -> None:
    p = decision_path(dataset_id)
    if p.exists():
        p.unlink()


def status(dataset_id: str) -> dict:
    """Stage flags used by the UI and by export gating."""
    wd = config.working_dir(dataset_id)
    report = load_report(dataset_id)
    decision = load_decision(dataset_id)
    # A decision is only valid for the validation run it was taken on.
    decision_current = bool(decision and report and decision.get("validation_generated_at") == report.get("generated_at"))
    verification_p = config.export_dir(dataset_id) / "export_verification.json"
    verification = json.loads(verification_p.read_text()) if verification_p.exists() else None
    validated_ok = bool(report and report["passed"])
    accepted = decision_current and decision["decision"] == "accepted"
    return {
        "imported": (wd / "import.json").exists(),
        "processed": (wd / "process.json").exists(),
        "validated": report is not None,
        "validation_passed": validated_ok,
        "decision": decision["decision"] if decision_current else None,
        "decision_stale": bool(decision) and not decision_current,
        "accepted": accepted,
        "export_ready": validated_ok and accepted,
        "exported": verification is not None,
        "export_verified": bool(verification and verification.get("passed")),
        "label": _label(validated_ok, decision_current and decision["decision"] if decision_current else None, verification),
    }


def _label(validated_ok: bool, decision: str | None, verification: dict | None) -> str:
    if not validated_ok:
        return "NOT training-ready (validation not passed)"
    if decision == "rejected":
        return "Rejected by reviewer"
    if decision != "accepted":
        return "Validated — awaiting reviewer decision"
    if verification and verification.get("passed"):
        return "Training-ready: validated, accepted, export verified"
    return "Accepted — export pending"
