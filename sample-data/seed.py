#!/usr/bin/env python3
"""Seed a small sample state.db so Hermes OS renders locally without the VPS.

Run:   python3 sample-data/seed.py
Serve: from backend/, HERMES_HOME=../sample-data .venv/bin/python main.py
"""

import os
import random
import sqlite3
from datetime import datetime, timedelta

HERE = os.path.dirname(os.path.abspath(__file__))
DB = os.path.join(HERE, "state.db")

# (model, input $/token, output $/token)
MODELS = [
    ("claude-opus-4-8", 15.0 / 1_000_000, 75.0 / 1_000_000),
    ("claude-sonnet-4-6", 3.0 / 1_000_000, 15.0 / 1_000_000),
    ("claude-haiku-4-5", 0.8 / 1_000_000, 4.0 / 1_000_000),
]
SOURCES = ["cli", "cron", "api", "web"]
TITLES = [
    "Refactor gateway router",
    "Morning brief",
    "Research competitor pricing",
    "Fix failing migration",
    "Summarize inbox",
    "Plan Q3 roadmap",
    "Review PR #482",
    "Update memory index",
    "Draft launch copy",
    "Nightly cost report",
]


def main() -> None:
    if os.path.exists(DB):
        os.remove(DB)

    conn = sqlite3.connect(DB)
    conn.execute(
        """
        CREATE TABLE sessions (
            id TEXT PRIMARY KEY,
            model TEXT NOT NULL,
            source TEXT NOT NULL,
            started_at TEXT NOT NULL,
            message_count INTEGER NOT NULL,
            input_tokens INTEGER NOT NULL,
            output_tokens INTEGER NOT NULL,
            estimated_cost_usd REAL NOT NULL,
            title TEXT
        )
        """
    )

    rng = random.Random(42)
    now = datetime(2026, 6, 2, 9, 0, 0)
    rows = []
    for i in range(48):
        model, in_rate, out_rate = rng.choice(MODELS)
        started = now - timedelta(
            days=rng.randint(0, 13),
            hours=rng.randint(0, 23),
            minutes=rng.randint(0, 59),
        )
        in_tok = rng.randint(2_000, 120_000)
        out_tok = rng.randint(500, 40_000)
        cost = round(in_tok * in_rate + out_tok * out_rate, 4)
        rows.append(
            (
                f"sess_{i:04d}",
                model,
                rng.choice(SOURCES),
                started.isoformat(),
                rng.randint(2, 60),
                in_tok,
                out_tok,
                cost,
                rng.choice(TITLES),
            )
        )

    conn.executemany(
        "INSERT INTO sessions VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)", rows
    )
    conn.commit()
    conn.close()
    print(f"Seeded {len(rows)} sessions -> {DB}")


if __name__ == "__main__":
    main()
