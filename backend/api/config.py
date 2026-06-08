from fastapi import APIRouter

from config_reader import read_config

router = APIRouter(prefix="/api/config", tags=["config"])


@router.get("")
def get_config():
    cfg = read_config()
    model = cfg.get("model", {}) or {}
    gateway = cfg.get("gateway", {}) or {}
    return {
        "model": model.get("default"),
        "provider": model.get("provider"),
        "platforms": gateway.get("platforms", []),
        "toolsets": gateway.get("toolsets", []),
    }
