"""Single source of truth for where Hermes keeps its state on disk.

On the VPS the app runs as root, so ``~`` expands to ``/root`` and
``HERMES_HOME`` defaults to ``/root/.hermes`` with no configuration. For local
development point ``HERMES_HOME`` at any directory (e.g. the bundled
``sample-data/``).
"""

import os

HERMES_HOME = os.environ.get("HERMES_HOME") or os.path.expanduser("~/.hermes")


def db_path() -> str:
    return os.path.join(HERMES_HOME, "state.db")


def config_path() -> str:
    return os.path.join(HERMES_HOME, "config.yaml")


def skills_dir() -> str:
    return os.path.join(HERMES_HOME, "skills")


def cron_output_dir() -> str:
    return os.path.join(HERMES_HOME, "cron", "output")


def memories_dir() -> str:
    return os.path.join(HERMES_HOME, "memories")
