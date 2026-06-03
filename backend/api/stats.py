from fastapi import APIRouter

from db import query

router = APIRouter(prefix="/api/stats", tags=["stats"])


@router.get("/usage")
def usage_over_time():
    return query(
        "SELECT date(started_at) AS date, "
        "COALESCE(SUM(input_tokens), 0) AS input_tokens, "
        "COALESCE(SUM(output_tokens), 0) AS output_tokens, "
        "COUNT(*) AS sessions "
        "FROM sessions GROUP BY date(started_at) ORDER BY date(started_at)"
    )


@router.get("/models")
def usage_by_model():
    return query(
        "SELECT model, COUNT(*) AS sessions, "
        "COALESCE(SUM(input_tokens + output_tokens), 0) AS tokens, "
        "COALESCE(SUM(estimated_cost_usd), 0) AS cost_usd "
        "FROM sessions GROUP BY model ORDER BY cost_usd DESC"
    )


@router.get("/costs")
def cost_over_time():
    return query(
        "SELECT date(started_at) AS date, "
        "COALESCE(SUM(estimated_cost_usd), 0) AS cost_usd "
        "FROM sessions GROUP BY date(started_at) ORDER BY date(started_at)"
    )
