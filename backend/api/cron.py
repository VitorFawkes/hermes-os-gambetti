import os
from datetime import datetime, timezone

from fastapi import APIRouter

from paths import cron_output_dir

router = APIRouter(prefix="/api/cron", tags=["cron"])


@router.get("/")
def list_cron_outputs():
    root = cron_output_dir()
    if not os.path.isdir(root):
        return []
    outputs = []
    for name in sorted(os.listdir(root), reverse=True):
        path = os.path.join(root, name)
        if not os.path.isfile(path):
            continue
        stat = os.stat(path)
        preview = ""
        try:
            with open(path, "r", encoding="utf-8", errors="replace") as f:
                preview = f.read(280)
        except OSError:
            preview = ""
        outputs.append(
            {
                "name": name,
                "size": stat.st_size,
                "modified_at": datetime.fromtimestamp(
                    stat.st_mtime, tz=timezone.utc
                ).isoformat(),
                "preview": preview,
            }
        )
    return outputs
