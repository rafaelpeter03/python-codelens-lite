"""Playground file to validate import CodeLens classification.

Covers every import scope:
- stdlib imports (targets.imports.stdlib)
- project imports (targets.imports.project) -> sample.py
- venv / global imports (targets.imports.venv / targets.imports.global)
  -> third-party packages; install one in a venv (e.g. `pip install requests`)
     to see the venv scope, leave it uninstalled to test the global fallback.

Also exercises import syntax variations: plain, from-import, alias,
multi-name and unused imports (references.filterImports).
"""

# --- Stdlib imports (targets.imports.stdlib) --------------------------------

import json
import os
import sys as system
from collections import defaultdict
from datetime import datetime, timedelta
from pathlib import Path

# --- Third-party imports (targets.imports.venv / targets.imports.global) ----

import requests
import numpy as np
from dotenv import load_dotenv

# --- Project imports (targets.imports.project) ------------------------------

from sample import (
    DEFAULT_TIMEOUT,
    MemoryRepository,
    Status,
    User,
    UserService,
    create_service,
)

# --- Unused imports: should show 0 references --------------------------------

import unittest
from functools import lru_cache


# --- Usage: each used import gains references --------------------------------

def load_config(path: str) -> dict:
    """Uses stdlib imports: json, os, Path."""
    config_file = Path(path)
    if not config_file.exists():
        return {"home": os.environ.get("HOME", "")}
    return json.loads(config_file.read_text())


def fetch_remote_users(url: str) -> list[dict]:
    """Uses third-party imports: requests, load_dotenv."""
    load_dotenv()
    response = requests.get(url, timeout=DEFAULT_TIMEOUT)
    return response.json()


def compute_statistics(values: list[float]) -> dict:
    """Uses third-party import: numpy."""
    data = np.array(values)
    return {"mean": float(data.mean()), "std": float(data.std())}


def group_users_by_status(users: list[User]) -> dict[Status, list[User]]:
    """Uses project imports: User, Status; stdlib: defaultdict."""
    groups: dict[Status, list[User]] = defaultdict(list)
    for user in users:
        groups[user.status].append(user)
    return dict(groups)


def build_service() -> UserService:
    """Uses project imports: UserService, MemoryRepository, create_service."""
    if datetime.now().hour < 12:
        return create_service()
    return UserService(MemoryRepository())


def report_uptime(started_at: datetime) -> str:
    """Uses stdlib imports: datetime, timedelta, sys alias."""
    uptime = datetime.now() - started_at
    if uptime > timedelta(hours=1):
        system.stdout.write("long running session\n")
    return str(uptime)


if __name__ == "__main__":
    print(load_config("config.json"))
    service = build_service()
    alice = service.register("Alice")
    print(group_users_by_status([alice]))
    print(report_uptime(datetime.now()))
