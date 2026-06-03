"""Read-only access to the Hermes SQLite state database.

Every connection is opened in ``mode=ro`` so the dashboard can never mutate
Hermes' state. Missing database or tables degrade gracefully to empty results
so the API stays up even before Hermes has written anything.
"""

import os
import sqlite3
from typing import Any

from paths import db_path


def _connect() -> sqlite3.Connection | None:
    path = db_path()
    if not os.path.exists(path):
        return None
    conn = sqlite3.connect(f"file:{path}?mode=ro", uri=True)
    conn.row_factory = sqlite3.Row
    return conn


def query(sql: str, params: tuple = ()) -> list[dict[str, Any]]:
    conn = _connect()
    if conn is None:
        return []
    try:
        rows = conn.execute(sql, params).fetchall()
        return [dict(row) for row in rows]
    except sqlite3.OperationalError:
        return []
    finally:
        conn.close()


def query_one(sql: str, params: tuple = ()) -> dict[str, Any] | None:
    rows = query(sql, params)
    return rows[0] if rows else None
