"""Read Hermes' ``config.yaml`` (model, provider, gateway platforms/toolsets)."""

import os

import yaml

from paths import config_path


def read_config() -> dict:
    path = config_path()
    if not os.path.exists(path):
        return {}
    with open(path, "r", encoding="utf-8") as f:
        data = yaml.safe_load(f)
    return data or {}
