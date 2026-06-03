import os

from fastapi import APIRouter

from paths import skills_dir

router = APIRouter(prefix="/api/skills", tags=["skills"])


@router.get("/")
def list_skills():
    root = skills_dir()
    if not os.path.isdir(root):
        return []
    skills = []
    for name in sorted(os.listdir(root)):
        path = os.path.join(root, name)
        if not os.path.isdir(path):
            continue
        description = ""
        skill_md = os.path.join(path, "SKILL.md")
        if os.path.exists(skill_md):
            with open(skill_md, "r", encoding="utf-8", errors="replace") as f:
                description = f.readline().strip().lstrip("#").strip()
        skills.append(
            {
                "name": name,
                "description": description,
                "files": len(os.listdir(path)),
            }
        )
    return skills
