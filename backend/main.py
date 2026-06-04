"""Hermes OS API — read-only FastAPI service over Hermes' on-disk state."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api.config import router as config_router
from api.cron import router as cron_router
from api.memory import router as memory_router
from api.sessions import router as sessions_router
from api.skills import router as skills_router
from api.stats import router as stats_router
from api.soul import router as soul_router
from api.dreams import router as dreams_router
from api.pantheon import router as pantheon_router
from api.openrouter import router as openrouter_router

app = FastAPI(title="Hermes OS API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://hermes-os-gambetti.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(sessions_router)
app.include_router(config_router)
app.include_router(skills_router)
app.include_router(cron_router)
app.include_router(memory_router)
app.include_router(stats_router)
app.include_router(soul_router)
app.include_router(dreams_router)
app.include_router(pantheon_router)
app.include_router(openrouter_router)


@app.get("/api/health")
def health():
    return {"status": "ok"}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
