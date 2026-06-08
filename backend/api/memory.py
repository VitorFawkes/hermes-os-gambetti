import os

from fastapi import APIRouter

from paths import memories_dir

router = APIRouter(prefix="/api/memory", tags=["memory"])


def _read(name: str) -> str:
    path = os.path.join(memories_dir(), name)
    if not os.path.exists(path):
        return ""
    with open(path, "r", encoding="utf-8", errors="replace") as f:
        return f.read()


@router.get("")
def get_memory():
    return {
        "memory_md": _read("MEMORY.md"),
        "user_md": _read("USER.md"),
    }
