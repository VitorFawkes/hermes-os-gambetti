from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException

from db import query, query_one

router = APIRouter(prefix="/api/sessions", tags=["sessions"])

COLUMNS = (
    "id, model, source, started_at, message_count, "
    "input_tokens, output_tokens, estimated_cost_usd, title"
)


def _iso_started_at(row):
    """started_at is stored as Unix seconds; emit ISO 8601 so the frontend parses it correctly."""
    ts = row.get("started_at")
    if ts is not None:
        row["started_at"] = datetime.fromtimestamp(ts, tz=timezone.utc).isoformat()
    return row


@router.get("")
def list_sessions():
    rows = query(
        f"SELECT {COLUMNS} FROM sessions ORDER BY started_at DESC LIMIT 20"
    )
    return [_iso_started_at(row) for row in rows]


# Declared before "/{session_id}" so the literal path wins over the param route.
@router.get("/stats")
def session_stats():
    row = query_one(
        "SELECT COUNT(*) AS total_sessions, "
        "COALESCE(SUM(message_count), 0) AS total_messages, "
        "COALESCE(SUM(input_tokens), 0) AS total_input_tokens, "
        "COALESCE(SUM(output_tokens), 0) AS total_output_tokens, "
        "COALESCE(SUM(estimated_cost_usd), 0) AS total_cost_usd "
        "FROM sessions"
    )
    return row or {
        "total_sessions": 0,
        "total_messages": 0,
        "total_input_tokens": 0,
        "total_output_tokens": 0,
        "total_cost_usd": 0,
    }


@router.get("/{session_id}")
def get_session(session_id: str):
    row = query_one(
        f"SELECT {COLUMNS} FROM sessions WHERE id = ?", (session_id,)
    )
    if row is None:
        raise HTTPException(status_code=404, detail="Session not found")
    return _iso_started_at(row)
