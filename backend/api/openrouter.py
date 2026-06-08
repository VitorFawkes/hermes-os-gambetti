"""
OpenRouter API integration — real costs, model catalog, BYOK manager.
Pulls live pricing from OpenRouter and merges with local session data
for accurate spend dashboards.
"""
import os
import httpx
from datetime import datetime, timedelta
from fastapi import APIRouter, HTTPException

router = APIRouter(prefix="/api/openrouter", tags=["openrouter"])

OPENROUTER_API = "https://openrouter.ai/api/v1"


def _get_openrouter_key() -> str:
    """Get OpenRouter API key from environment."""
    key = os.environ.get("OPENROUTER_API_KEY", "")
    if not key:
        # Try reading from .env
        env_path = os.path.expanduser("~/.hermes/.env")
        if os.path.exists(env_path):
            with open(env_path) as f:
                for line in f:
                    if line.startswith("OPENROUTER_API_KEY=") and (not line.startswith("#")):
                        raw = line.split("=", 1)[1].strip()
                        key = raw.strip('"').strip("'")
                        break
    return key


@router.get("/models")
async def list_models():
    """
    List available OpenRouter models with pricing.
    Falls back to cached defaults if API is unreachable.
    """
    key = _get_openrouter_key()
    if key:
        try:
            async with httpx.AsyncClient(timeout=10) as client:
                resp = await client.get(
                    f"{OPENROUTER_API}/models",
                    headers={"Authorization": f"Bearer {key}"}
                )
                if resp.status_code == 200:
                    data = resp.json()
                    models = []
                    for m in data.get("data", []):
                        pricing = m.get("pricing", {})
                        models.append({
                            "id": m.get("id"),
                            "name": m.get("name"),
                            "context_length": m.get("context_length"),
                            "pricing": {
                                "prompt": float(pricing.get("prompt", "0")),
                                "completion": float(pricing.get("completion", "0")),
                                "per_1m_input": float(pricing.get("prompt", "0")) * 1_000_000,
                                "per_1m_output": float(pricing.get("completion", "0")) * 1_000_000,
                            },
                            "top_provider": m.get("top_provider", {}).get("name", "unknown"),
                        })
                    
                    # Sort by prompt price ascending
                    models.sort(key=lambda x: x["pricing"]["prompt"])
                    return {"models": models, "total": len(models), "source": "live"}
        except Exception:
            pass
    
    # Fallback to default model list
    return {
        "models": [
            {"id": "deepseek/deepseek-v4-pro", "name": "DeepSeek V4 Pro", "pricing": {"per_1m_input": 0.27, "per_1m_output": 0.60}, "context_length": 131072},
            {"id": "deepseek/deepseek-r1", "name": "DeepSeek R1", "pricing": {"per_1m_input": 0.55, "per_1m_output": 2.19}, "context_length": 163840},
            {"id": "anthropic/claude-opus-4-7", "name": "Claude Opus 4.7", "pricing": {"per_1m_input": 15.0, "per_1m_output": 60.0}, "context_length": 200000},
            {"id": "anthropic/claude-sonnet-4-6", "name": "Claude Sonnet 4.6", "pricing": {"per_1m_input": 3.0, "per_1m_output": 15.0}, "context_length": 200000},
            {"id": "openai/gpt-5.5", "name": "GPT-5.5", "pricing": {"per_1m_input": 3.75, "per_1m_output": 15.0}, "context_length": 128000},
            {"id": "google/gemini-3-pro", "name": "Gemini 3 Pro", "pricing": {"per_1m_input": 10.0, "per_1m_output": 40.0}, "context_length": 1048576},
            {"id": "meta-llama/llama-4-maverick", "name": "Llama 4 Maverick", "pricing": {"per_1m_input": 0.20, "per_1m_output": 0.30}, "context_length": 131072},
        ],
        "total": 7,
        "source": "cached"
    }


@router.get("/costs")
async def get_costs():
    """
    Calculate real costs from session data + live model pricing.
    Merges state.db actual usage with OpenRouter pricing.
    """
    import sqlite3
    
    state_db = os.path.expanduser("~/.hermes/state.db")
    if not os.path.exists(state_db):
        return {"costs": [], "total_cost": 0, "source": "no_data"}
    
    # Get model pricing
    models_resp = await list_models()
    model_pricing = {m["id"]: m["pricing"] for m in models_resp["models"]}
    
    # Get session data
    conn = sqlite3.connect(f"file:{state_db}?mode=ro", uri=True)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    # Total costs from state.db
    cursor.execute("SELECT SUM(estimated_cost_usd) as total FROM sessions")
    db_total = cursor.fetchone()["total"] or 0
    
    # Per-model breakdown
    cursor.execute("""
        SELECT model, COUNT(*) as sessions, 
               SUM(input_tokens) as input_tok, 
               SUM(output_tokens) as output_tok,
               SUM(estimated_cost_usd) as cost
        FROM sessions 
        GROUP BY model 
        ORDER BY cost DESC
        LIMIT 20
    """)
    model_breakdown = []
    for row in cursor.fetchall():
        d = dict(row)
        # Calculate real cost using live pricing
        pricing = model_pricing.get(d["model"], {})
        if pricing and d["input_tok"] and d["output_tok"]:
            real_cost = (
                (d["input_tok"] / 1_000_000) * pricing.get("per_1m_input", 0) +
                (d["output_tok"] / 1_000_000) * pricing.get("per_1m_output", 0)
            )
            d["calculated_cost"] = round(real_cost, 6)
        model_breakdown.append(d)
    
    # Daily costs (last 30 days)
    cursor.execute("""
        SELECT datetime(started_at, 'unixepoch') as date,
               COUNT(*) as sessions,
               SUM(estimated_cost_usd) as cost,
               SUM(input_tokens + output_tokens) as tokens
        FROM sessions
        WHERE started_at >= date('now', '-30 days')
        GROUP BY datetime(started_at, 'unixepoch')
        ORDER BY date DESC
    """)
    daily_costs = [dict(row) for row in cursor.fetchall()]
    
    conn.close()
    
    # Cost comparison: Opus vs DeepSeek
    opus_pricing = model_pricing.get("anthropic/claude-opus-4-7", {})
    ds_pricing = model_pricing.get("deepseek/deepseek-v4-pro", {})
    comparison = None
    if opus_pricing and ds_pricing:
        opus_1m = opus_pricing.get("per_1m_input", 15) + opus_pricing.get("per_1m_output", 60)
        ds_1m = ds_pricing.get("per_1m_input", 0.27) + ds_pricing.get("per_1m_output", 0.60)
        comparison = {
            "opus_cost_per_1m_total": opus_1m,
            "deepseek_cost_per_1m_total": ds_1m,
            "savings_pct": round((1 - ds_1m / opus_1m) * 100, 1),
            "savings_x": f"{round(opus_1m / ds_1m)}x cheaper"
        }
    
    return {
        "total_cost_db": db_total,
        "total_cost": db_total,
        "model_breakdown": model_breakdown,
        "daily_costs": daily_costs,
        "cost_comparison": comparison,
        "pricing_source": models_resp["source"]
    }


@router.get("/routing")
async def get_routing_modes():
    """
    Get OpenRouter routing mode documentation.
    Covers :nitro, :orsato, :auto, and BYOK.
    """
    return {
        "routing_modes": [
            {
                "suffix": ":nitro",
                "name": "Nitro",
                "description": "Auto-routes to the fastest provider at this moment",
                "example": "anthropic/claude-opus-4-7:nitro",
                "best_for": "Speed-critical tasks"
            },
            {
                "suffix": ":orsato",
                "name": "Orsato",
                "description": "Only providers rigorously certified for tool calling accuracy",
                "example": "anthropic/claude-opus-4-7:orsato",
                "best_for": "Agentic tasks requiring accurate tool calling"
            },
            {
                "suffix": ":auto",
                "name": "Auto Router",
                "description": "OpenRouter picks the best model for your prompt automatically",
                "example": "openrouter/auto",
                "best_for": "General tasks, cost optimization"
            },
            {
                "suffix": "BYOK",
                "name": "Bring Your Own Key",
                "description": "Use your own provider API key to bypass rate limits",
                "providers": ["deepseek", "openai", "google", "meta"],
                "setup": "Add key in OpenRouter dashboard → Settings → Bring Your Own Keys"
            }
        ],
        "fallback_info": {
            "description": "If tokens run out or model is unavailable, fallback to specified model",
            "config": "fallback_model in config.yaml"
        }
    }


@router.get("/status")
async def get_status():
    """Check OpenRouter connection status."""
    key = _get_openrouter_key()
    has_key = bool(key)
    
    status = {
        "configured": has_key,
        "key_masked": f"{key[:8]}...{key[-4:]}" if has_key else None,
    }
    
    if has_key:
        try:
            async with httpx.AsyncClient(timeout=5) as client:
                resp = await client.get(
                    f"{OPENROUTER_API}/auth/key",
                    headers={"Authorization": f"Bearer {key}"}
                )
                if resp.status_code == 200:
                    data = resp.json()
                    status["connected"] = True
                    status["credits_remaining"] = data.get("data", {}).get("credits", "unknown")
                    status["usage_label"] = data.get("data", {}).get("label", "unknown")
                else:
                    status["connected"] = False
                    status["error"] = f"HTTP {resp.status_code}"
        except Exception as e:
            status["connected"] = False
            status["error"] = str(e)
    else:
        status["connected"] = False
        status["error"] = "No API key configured"
    
    return status