"""Goals API — persisted, user-editable goals tracked with Hermes.

Backed by ``~/.hermes/goals.json`` (same pattern as pantheon.json). Real data
only — no scaffold/mock. Starts empty until the user adds goals.
"""
import json
import os
from datetime import datetime, timezone
from pathlib import Path

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter(prefix="/api/goals", tags=["goals"])

GOALS_STORE = os.path.expanduser("~/.hermes/goals.json")

VALID_STATUS = {"backlog", "in_progress", "blocked", "done"}
VALID_PRIORITY = {"low", "medium", "high"}


class GoalIn(BaseModel):
    title: str
    description: str = ""
    status: str = "backlog"
    priority: str = "medium"
    progress: int = 0
    owner: str = "hermes"


def _load() -> list:
    try:
        if os.path.exists(GOALS_STORE):
            return json.loads(Path(GOALS_STORE).read_text())
    except Exception:
        pass
    return []


def _save(goals: list) -> None:
    os.makedirs(os.path.dirname(GOALS_STORE), exist_ok=True)
    Path(GOALS_STORE).write_text(json.dumps(goals, indent=2, default=str))


def _normalize(g: "GoalIn") -> dict:
    return {
        "title": g.title.strip(),
        "description": g.description.strip(),
        "status": g.status if g.status in VALID_STATUS else "backlog",
        "priority": g.priority if g.priority in VALID_PRIORITY else "medium",
        "progress": max(0, min(100, g.progress)),
        "owner": (g.owner or "hermes").strip() or "hermes",
    }


@router.get("")
def list_goals():
    return _load()


@router.post("")
def create_goal(goal: GoalIn):
    goals = _load()
    item = _normalize(goal)
    item["id"] = f"goal_{int(datetime.now(tz=timezone.utc).timestamp())}_{len(goals) + 1}"
    item["created_at"] = datetime.now(tz=timezone.utc).isoformat()
    goals.append(item)
    _save(goals)
    return item


@router.put("/{goal_id}")
def update_goal(goal_id: str, goal: GoalIn):
    goals = _load()
    for i, g in enumerate(goals):
        if g.get("id") == goal_id:
            updated = _normalize(goal)
            updated["id"] = goal_id
            updated["created_at"] = g.get("created_at")
            updated["updated_at"] = datetime.now(tz=timezone.utc).isoformat()
            goals[i] = updated
            _save(goals)
            return updated
    raise HTTPException(status_code=404, detail="Goal not found")


@router.delete("/{goal_id}")
def delete_goal(goal_id: str):
    goals = _load()
    remaining = [g for g in goals if g.get("id") != goal_id]
    if len(remaining) == len(goals):
        raise HTTPException(status_code=404, detail="Goal not found")
    _save(remaining)
    return {"status": "ok", "deleted": True}
