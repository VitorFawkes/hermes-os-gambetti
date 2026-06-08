"""
Pantheon API — persona creation, sync to Hermes skills, and Triad system builder.
Based on Jack Roberts' "Pantheon" system: visual agent builder with model dropdowns,
3-part triad prompts (Conductor → Worker → Critic), and one-click sync to skills/.
"""
import os
import json
import yaml
from pathlib import Path
from datetime import datetime
from typing import Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter(prefix="/api/pantheon", tags=["pantheon"])

SKILLS_DIR = os.path.expanduser("~/.hermes/skills")
PANTHEON_STORE = os.path.expanduser("~/.hermes/pantheon.json")

# Available models for dropdowns (drawn from config or defaults)
DEFAULT_MODELS = [
    {"id": "anthropic/claude-opus-4-7", "name": "Claude Opus 4.7", "role": "conductor", "cost_per_1m": 75.0},
    {"id": "deepseek/deepseek-v4-pro", "name": "DeepSeek V4 Pro", "role": "worker", "cost_per_1m": 0.87},
    {"id": "openai/gpt-5.5", "name": "GPT-5.5", "role": "critic", "cost_per_1m": 15.0},
    {"id": "google/gemini-3-pro", "name": "Gemini 3 Pro", "role": "critic", "cost_per_1m": 10.0},
    {"id": "anthropic/claude-sonnet-4-6", "name": "Claude Sonnet 4.6", "role": "conductor", "cost_per_1m": 15.0},
    {"id": "meta-llama/llama-4-maverick", "name": "Llama 4 Maverick", "role": "worker", "cost_per_1m": 0.50},
]


class PersonaCreate(BaseModel):
    name: str
    job_description: str
    model: str = "anthropic/claude-opus-4-7"
    system_prompt: str = ""
    triad_config: Optional[dict] = None  # {"conductor": "...", "worker": "...", "critic": "..."}


def _load_pantheon() -> list:
    """Load saved personas."""
    try:
        if os.path.exists(PANTHEON_STORE):
            return json.loads(Path(PANTHEON_STORE).read_text())
    except:
        pass
    return []


def _save_pantheon(personas: list):
    """Persist personas."""
    os.makedirs(os.path.dirname(PANTHEON_STORE), exist_ok=True)
    Path(PANTHEON_STORE).write_text(json.dumps(personas, indent=2, default=str))


def _load_config_models() -> list:
    """Try to load models from config.yaml, fall back to defaults."""
    try:
        config_path = os.path.expanduser("~/.hermes/config.yaml")
        if os.path.exists(config_path):
            with open(config_path) as f:
                config = yaml.safe_load(f) or {}
            model_config = config.get("model", {})
            provider = model_config.get("provider", "openrouter")
            default_model = model_config.get("default", "deepseek/deepseek-v4-pro")
            # If OpenRouter, we can access all models
            if provider == "openrouter":
                return DEFAULT_MODELS
    except:
        pass
    return DEFAULT_MODELS


def _persona_to_skill_md(persona: dict) -> str:
    """Convert a persona to a SKILL.md file content."""
    lines = [
        "---",
        f"name: {persona['name'].lower().replace(' ', '-')}",
        f"description: {persona.get('job_description', 'AI persona')}",
        "---",
        "",
        f"# {persona['name']}",
        "",
        f"**Job:** {persona.get('job_description', '')}",
        f"**Model:** {persona.get('model', 'auto')}",
        "",
    ]
    
    # Triad prompts
    triad = persona.get("triad_config", {})
    if triad:
        lines.append("## Conductor (Planner)")
        lines.append("")
        lines.append(triad.get("conductor", "_No conductor prompt set._"))
        lines.append("")
        lines.append("## Worker (Executor)")
        lines.append("")
        lines.append(triad.get("worker", "_No worker prompt set._"))
        lines.append("")
        lines.append("## Critic (Reviewer)")
        lines.append("")
        lines.append(triad.get("critic", "_No critic prompt set._"))
        lines.append("")
    
    # System prompt
    if persona.get("system_prompt"):
        lines.append("## System Prompt")
        lines.append("")
        lines.append(persona["system_prompt"])
        lines.append("")
    
    lines.append(f"*Synced from Hermes OS Pantheon on {datetime.now().isoformat()}*")
    return "\n".join(lines)


@router.get("/personas")
async def list_personas():
    """List all saved personas."""
    return {"personas": _load_pantheon()}


@router.get("/models")
async def list_models():
    """List real available models (live from OpenRouter) for persona configuration."""
    config_path = os.path.expanduser("~/.hermes/config.yaml")
    active_model = "auto"
    active_provider = "openrouter"
    try:
        if os.path.exists(config_path):
            with open(config_path) as f:
                config = yaml.safe_load(f) or {}
            active_model = config.get("model", {}).get("default", "auto")
            active_provider = config.get("model", {}).get("provider", "openrouter")
    except Exception:
        pass

    # Real models — live from OpenRouter (same source as the Spend page),
    # mapped to the picker shape {id, name, cost_per_1m}.
    from api.openrouter import list_models as _openrouter_list_models

    models = []
    source = "default"
    try:
        or_resp = await _openrouter_list_models()
        source = or_resp.get("source", "default")
        for m in or_resp.get("models", []):
            pricing = m.get("pricing", {}) or {}
            cost = round(
                float(pricing.get("per_1m_input", 0) or 0)
                + float(pricing.get("per_1m_output", 0) or 0),
                2,
            )
            models.append({
                "id": m.get("id"),
                "name": m.get("name") or m.get("id"),
                "role": "",
                "cost_per_1m": cost,
            })
    except Exception:
        models = []
    if not models:
        models = _load_config_models()
        source = "default"

    return {
        "models": models,
        "source": source,
        "active_model": active_model,
        "active_provider": active_provider,
        "roles": {
            "conductor": "Strategic planner, task decomposition, brief writing",
            "worker": "Heavy lifting, deep research, overnight execution",
            "critic": "Brutal critique, quality gate, final review"
        }
    }


@router.post("/personas")
async def create_persona(persona: PersonaCreate):
    """Create a new persona."""
    personas = _load_pantheon()
    
    new_persona = {
        "id": f"persona_{len(personas) + 1}_{int(datetime.now().timestamp())}",
        "name": persona.name,
        "job_description": persona.job_description,
        "model": persona.model,
        "system_prompt": persona.system_prompt,
        "triad_config": persona.triad_config or {},
        "created_at": datetime.now().isoformat(),
        "synced": False,
        "sync_path": None
    }
    
    personas.append(new_persona)
    _save_pantheon(personas)
    
    return {"status": "ok", "persona": new_persona}


@router.put("/personas/{persona_id}")
async def update_persona(persona_id: str, persona: PersonaCreate):
    """Update an existing persona."""
    personas = _load_pantheon()
    
    for i, p in enumerate(personas):
        if p["id"] == persona_id:
            personas[i].update({
                "name": persona.name,
                "job_description": persona.job_description,
                "model": persona.model,
                "system_prompt": persona.system_prompt,
                "triad_config": persona.triad_config or {},
                "updated_at": datetime.now().isoformat()
            })
            _save_pantheon(personas)
            return {"status": "ok", "persona": personas[i]}
    
    raise HTTPException(status_code=404, detail="Persona not found")


@router.delete("/personas/{persona_id}")
async def delete_persona(persona_id: str):
    """Delete a persona."""
    personas = _load_pantheon()
    personas = [p for p in personas if p["id"] != persona_id]
    _save_pantheon(personas)
    return {"status": "ok", "deleted": True}


@router.post("/personas/{persona_id}/sync")
async def sync_persona(persona_id: str):
    """
    Sync a persona to Hermes skills/ directory.
    Creates a SKILL.md file so Hermes can use it as a real skill.
    """
    personas = _load_pantheon()
    
    for persona in personas:
        if persona["id"] == persona_id:
            skill_name = persona["name"].lower().replace(" ", "-")
            skill_dir = os.path.join(SKILLS_DIR, "pantheon")
            os.makedirs(skill_dir, exist_ok=True)
            
            skill_content = _persona_to_skill_md(persona)
            skill_path = os.path.join(skill_dir, f"{skill_name}.md")
            
            with open(skill_path, "w", encoding="utf-8") as f:
                f.write(skill_content)
            
            persona["synced"] = True
            persona["sync_path"] = skill_path
            persona["synced_at"] = datetime.now().isoformat()
            _save_pantheon(personas)
            
            return {
                "status": "ok",
                "persona": persona["name"],
                "skill_path": skill_path,
                "synced": True
            }
    
    raise HTTPException(status_code=404, detail="Persona not found")


@router.post("/personas/{persona_id}/sync-all")
async def sync_all_personas():
    """Sync ALL personas to Hermes skills/."""
    personas = _load_pantheon()
    synced = []
    
    for persona in personas:
        skill_name = persona["name"].lower().replace(" ", "-")
        skill_dir = os.path.join(SKILLS_DIR, "pantheon")
        os.makedirs(skill_dir, exist_ok=True)
        
        skill_content = _persona_to_skill_md(persona)
        skill_path = os.path.join(skill_dir, f"{skill_name}.md")
        
        with open(skill_path, "w", encoding="utf-8") as f:
            f.write(skill_content)
        
        persona["synced"] = True
        persona["sync_path"] = skill_path
        persona["synced_at"] = datetime.now().isoformat()
        synced.append({"name": persona["name"], "path": skill_path})
    
    _save_pantheon(personas)
    
    # Also create the pantheon catalog skill that lists all personas
    catalog = _build_pantheon_catalog(personas)
    catalog_path = os.path.join(SKILLS_DIR, "pantheon", "PANTHEON.md")
    os.makedirs(os.path.dirname(catalog_path), exist_ok=True)
    with open(catalog_path, "w", encoding="utf-8") as f:
        f.write(catalog)
    
    return {"status": "ok", "synced_count": len(synced), "synced": synced}


def _build_pantheon_catalog(personas: list) -> str:
    """Build a catalog SKILL.md that lists all personas."""
    lines = [
        "---",
        "name: pantheon-catalog",
        "description: Master catalog of all Pantheon personas — summon any agent by name.",
        "---",
        "",
        "# Pantheon — Agent Catalog",
        "",
        f"*{len(personas)} personas synced from Hermes OS*",
        "",
        "Available personas:",
        ""
    ]
    
    for p in personas:
        triad_info = ""
        if p.get("triad_config"):
            triad_roles = []
            if p["triad_config"].get("conductor"):
                triad_roles.append("🎯 Conductor")
            if p["triad_config"].get("worker"):
                triad_roles.append("🔧 Worker")
            if p["triad_config"].get("critic"):
                triad_roles.append("🔍 Critic")
            if triad_roles:
                triad_info = f" ({', '.join(triad_roles)})"
        
        lines.append(f"- **{p['name']}** — {p.get('job_description', '')}{triad_info}")
        lines.append(f"  Model: `{p.get('model', 'auto')}`")
        lines.append("")
    
    return "\n".join(lines)


@router.get("/triad-template")
async def get_triad_template():
    """
    Get the default Triad template (Conductor → Worker → Critic).
    Based on Jack Roberts' Orpheus template from the video.
    """
    return {
        "name": "Triad System Template",
        "description": "Three-model pipeline: Planner → Executor → Critic",
        "conductor": {
            "role": "Planner / Conductor",
            "recommended_models": ["anthropic/claude-opus-4-7"],
            "template": """You are the CONDUCTOR of the Hermes Triad.
Your job: Plan and decompose the task.

1. Read the user's request carefully
2. Break it down into 3-7 specific angles/approaches
3. Write a ONE-PAGE brief covering:
   - Goal definition
   - Success criteria
   - Approach angles (each with rationale)
   - Known constraints
   - Output format specification
4. Pass this brief to the Worker for execution

Do NOT do the actual work. Your job is to plan, not execute."""
        },
        "worker": {
            "role": "Worker / Executor",
            "recommended_models": ["deepseek/deepseek-v4-pro"],
            "template": """You are the WORKER of the Hermes Triad.
Your job: Execute the plan deeply and thoroughly.

1. Read the Conductor's brief
2. For each angle in the brief:
   - Research deeply
   - Generate detailed output
   - Note uncertainties or assumptions
3. Cover edge cases
4. Deliver structured, comprehensive results

Work for as long as needed. Depth over speed."""
        },
        "critic": {
            "role": "Critic / Reviewer",
            "recommended_models": ["openai/gpt-5.5", "google/gemini-3-pro"],
            "template": """You are the CRITIC of the Hermes Triad.
Your job: Brutally critique the Worker's output.

1. Read the Conductor's brief AND the Worker's output
2. Identify:
   - Logical gaps and contradictions
   - Unexplored angles from the brief
   - Weak assumptions
   - Missing edge cases
   - Anything that wouldn't ship
3. Be BRUTAL — this is your job
4. Rate each finding: CRITICAL, IMPORTANT, NICE-TO-HAVE
5. Suggest concrete fixes

The goal is quality. Tear it apart so it can be rebuilt better."""
        },
        "flow_diagram": """
Conductor (Plans) → Worker (Executes) → Critic (Reviews)
                                              ↓
                                    Conductor (Refines)
                                              ↓
                                    Final Output ✓
"""
    }