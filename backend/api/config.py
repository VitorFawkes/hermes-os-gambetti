from fastapi import APIRouter

from config_reader import read_config
from db import query

router = APIRouter(prefix="/api/config", tags=["config"])


@router.get("")
def get_config():
    cfg = read_config()
    model = cfg.get("model", {}) or {}
    gateway = cfg.get("gateway", {}) or {}
    # Platforms: reflect reality — the sources that actually produced sessions.
    platforms = gateway.get("platforms") or []
    if not platforms:
        rows = query(
            "SELECT source, COUNT(*) AS n FROM sessions "
            "WHERE source IS NOT NULL AND source != '' "
            "GROUP BY source ORDER BY n DESC"
        )
        platforms = [{"name": r["source"], "status": "connected"} for r in rows]
    return {
        "model": model.get("default"),
        "provider": model.get("provider"),
        "platforms": platforms,
        "toolsets": cfg.get("toolsets") or gateway.get("toolsets") or [],
    }
