"""
Auto-Dreaming Engine — analyzes session history to generate proactive suggestions.
Based on Jack Roberts' "auto-dreaming" feature: reads chat history across models,
generates dynamic suggestions that appear as dismissible cards with checkboxes.
"""
import os
import json
import sqlite3
import hashlib
from datetime import datetime, timedelta
from pathlib import Path
from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse

router = APIRouter(prefix="/api/dreams", tags=["dreams"])

STATE_DB = os.path.expanduser("~/.hermes/state.db")
DREAMS_STORE = os.path.expanduser("~/.hermes/dreams.json")

# Dream categories matching Jack's system
DREAM_TEMPLATES = [
    {
        "category": "memory_gap",
        "icon": "🧠",
        "prompt_template": "You've been talking about {topic} — should I save this to memory?"
    },
    {
        "category": "skill_suggestion",
        "icon": "🛠️",
        "prompt_template": "I notice you do {pattern} often. Want me to create a reusable skill for this?"
    },
    {
        "category": "cron_idea",
        "icon": "⏰",
        "prompt_template": "You check {target} regularly. Should I set up a cron job to monitor this?"
    },
    {
        "category": "goal_tracking",
        "icon": "🎯",
        "prompt_template": "Based on recent sessions, it looks like you're working toward {goal_hint}. Want to track this as a goal?"
    },
    {
        "category": "optimization",
        "icon": "⚡",
        "prompt_template": "You used {expensive_model} for a simple task. Try switching to {cheaper_model} to save ~{savings_pct}% on costs."
    }
]


def _get_db():
    """Get read-only connection to state.db."""
    if not os.path.exists(STATE_DB):
        raise HTTPException(status_code=503, detail="state.db not found")
    conn = sqlite3.connect(f"file:{STATE_DB}?mode=ro", uri=True)
    conn.row_factory = sqlite3.Row
    return conn


def _analyze_recent_sessions(conn, days: int = 7) -> dict:
    """Analyze recent sessions for patterns."""
    cursor = conn.cursor()
    
    # Recent sessions
    cutoff = (datetime.now() - timedelta(days=days)).timestamp()
    cursor.execute(
        "SELECT COUNT(*) as count, COUNT(DISTINCT model) as models, "
        "SUM(input_tokens + output_tokens) as total_tokens, "
        "SUM(estimated_cost_usd) as total_cost "
        "FROM sessions WHERE started_at >= ?",
        (cutoff,)
    )
    row = cursor.fetchone()
    stats = {"count": row[0], "models": row[1], "total_tokens": row[2], "total_cost": row[3]}
    
    # Most used model
    cursor.execute(
        "SELECT model, COUNT(*) as count, SUM(estimated_cost_usd) as cost "
        "FROM sessions WHERE started_at >= ? "
        "GROUP BY model ORDER BY count DESC LIMIT 5",
        (cutoff,)
    )
    models = [dict(row) for row in cursor.fetchall()]
    
    # Session sources
    cursor.execute(
        "SELECT source, COUNT(*) as count "
        "FROM sessions WHERE started_at >= ? "
        "GROUP BY source ORDER BY count DESC",
        (cutoff,)
    )
    sources = [dict(row) for row in cursor.fetchall()]
    
    # Recent message content for topic extraction
    cursor.execute(
        "SELECT m.content, m.role, s.title "
        "FROM messages m JOIN sessions s ON m.session_id = s.id "
        "WHERE s.started_at >= ? AND m.role = 'user' "
        "ORDER BY m.timestamp DESC LIMIT 30",
        (cutoff,)
    )
    recent_messages = [dict(row) for row in cursor.fetchall()]
    
    return {
        "days": days,
        "session_count": stats.get("count", 0),
        "unique_models": stats.get("models", 0),
        "total_tokens": stats.get("total_tokens", 0),
        "total_cost": stats.get("total_cost", 0),
        "models": models,
        "sources": sources,
        "recent_messages": recent_messages[:10]  # Top 10 for dream generation
    }


def _generate_dreams(analysis: dict) -> list:
    """Generate dream suggestions from session analysis."""
    dreams = []
    
    # Only generate if there's activity
    if analysis["session_count"] == 0:
        return [{
            "id": "no_activity",
            "category": "welcome",
            "icon": "👋",
            "message": "Start chatting with Hermes to get personalized suggestions!",
            "done": False,
            "created_at": datetime.now().isoformat()
        }]
    
    # Memory gap: if recent sessions exist but memory files are small
    memory_path = os.path.expanduser("~/.hermes/memories/MEMORY.md")
    try:
        memory_size = os.path.getsize(memory_path)
    except:
        memory_size = 0
    if memory_size < 500 and analysis["session_count"] > 3:
        dreams.append({
            "id": f"memory_gap_{hashlib.md5(b'memory').hexdigest()[:8]}",
            "category": "memory_gap",
            "icon": "🧠",
            "message": f"After {analysis['session_count']} sessions, your memory is still sparse. Let me help build your context.",
            "done": False,
            "created_at": datetime.now().isoformat()
        })
    
    # Skill suggestion: if similar patterns detected (same source + many sessions)
    for source in analysis.get("sources", []):
        if source["count"] > 5:
            dreams.append({
                "id": f"skill_{hashlib.md5(source['source'].encode()).hexdigest()[:8]}",
                "category": "skill_suggestion",
                "icon": "🛠️",
                "message": f"You've done {source['count']} sessions via {source['source']}. Want a reusable skill for this workflow?",
                "done": False,
                "created_at": datetime.now().isoformat()
            })
    
    # Cost optimization: if using expensive model for many sessions  
    for model in analysis.get("models", []):
        if model["cost"] and model["cost"] > 1.0 and model["count"] > 3:
            dreams.append({
                "id": f"cost_{hashlib.md5(model['model'].encode()).hexdigest()[:8]}",
                "category": "optimization",
                "icon": "⚡",
                "message": f"${model['cost']:.2f} spent on {model['model']} in {analysis['days']}d. Try DeepSeek for routine tasks.",
                "done": False,
                "created_at": datetime.now().isoformat()
            })
    
    # Goal tracking: if sessions are task-heavy
    if analysis["session_count"] > 10:
        dreams.append({
            "id": f"goal_{hashlib.md5(b'goals').hexdigest()[:8]}",
            "category": "goal_tracking",
            "icon": "🎯",
            "message": f"10+ sessions in {analysis['days']} days. Want to track your top goals in the dashboard?",
            "done": False,
            "created_at": datetime.now().isoformat()
        })
    
    # Cron idea: if there are scheduled patterns
    if analysis["session_count"] > 5:
        dreams.append({
            "id": f"cron_{hashlib.md5(b'cron').hexdigest()[:8]}",
            "category": "cron_idea",
            "icon": "⏰",
            "message": "I can automate recurring tasks. Want me to set up background cron jobs?",
            "done": False,
            "created_at": datetime.now().isoformat()
        })
    
    return dreams if dreams else [{
        "id": "all_clear",
        "category": "status",
        "icon": "✅",
        "message": "All caught up! No new suggestions right now.",
        "done": True,
        "created_at": datetime.now().isoformat()
    }]


def _load_dreams_state() -> dict:
    """Load persisted dream completion state."""
    try:
        if os.path.exists(DREAMS_STORE):
            return json.loads(Path(DREAMS_STORE).read_text())
    except:
        pass
    return {"completed_ids": []}


def _save_dreams_state(state: dict):
    """Persist dream completion state."""
    os.makedirs(os.path.dirname(DREAMS_STORE), exist_ok=True)
    Path(DREAMS_STORE).write_text(json.dumps(state, indent=2))


@router.get("")
async def get_dreams():
    """
    Get auto-generated dream suggestions.
    Analyzes recent sessions and generates proactive recommendations.
    """
    try:
        conn = _get_db()
        analysis = _analyze_recent_sessions(conn)
        conn.close()
    except HTTPException:
        analysis = {"session_count": 0, "models": [], "sources": [], "days": 7}
    
    dreams = _generate_dreams(analysis)
    state = _load_dreams_state()
    
    # Mark completed dreams
    completed = set(state.get("completed_ids", []))
    for dream in dreams:
        if dream["id"] in completed:
            dream["done"] = True
    
    return {
        "dreams": dreams,
        "analysis_summary": {
            "sessions_7d": analysis.get("session_count", 0),
            "unique_models": analysis.get("unique_models", 0),
            "total_tokens": analysis.get("total_tokens", 0),
            "total_cost": analysis.get("total_cost", 0)
        },
        "generated_at": datetime.now().isoformat()
    }


@router.post("/{dream_id}/complete")
async def complete_dream(dream_id: str):
    """Mark a dream as done (checkbox)."""
    state = _load_dreams_state()
    completed = set(state.get("completed_ids", []))
    completed.add(dream_id)
    state["completed_ids"] = list(completed)
    _save_dreams_state(state)
    
    return {"status": "ok", "dream_id": dream_id, "done": True}


@router.post("/{dream_id}/dismiss")
async def dismiss_dream(dream_id: str):
    """Permanently dismiss a dream."""
    state = _load_dreams_state()
    dismissed = set(state.get("dismissed_ids", []))
    dismissed.add(dream_id)
    state["dismissed_ids"] = list(dismissed)
    _save_dreams_state(state)
    
    return {"status": "ok", "dream_id": dream_id, "dismissed": True}