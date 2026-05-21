"""
test_deploy_config.py — verify Railway-specific config behaves correctly.
"""

import os

import pytest
from fastapi.testclient import TestClient


def test_normalise_db_url_rewrites_plain_postgres():
    from asteroid_atlas.db.session import _normalise_db_url

    result = _normalise_db_url("postgresql://user:pass@host:5432/db")
    assert result == "postgresql+psycopg://user:pass@host:5432/db"


def test_normalise_db_url_leaves_psycopg_url_unchanged():
    from asteroid_atlas.db.session import _normalise_db_url

    url = "postgresql+psycopg://user:pass@host:5432/db"
    assert _normalise_db_url(url) == url


def test_normalise_db_url_leaves_other_schemes_unchanged():
    from asteroid_atlas.db.session import _normalise_db_url

    url = "sqlite:///test.db"
    assert _normalise_db_url(url) == url


def test_cors_uses_allowed_origins_env_var(monkeypatch):
    monkeypatch.setenv("ALLOWED_ORIGINS", "https://myapp.up.railway.app,https://staging.myapp.com")
    import importlib

    import asteroid_atlas.api.main as main_module
    importlib.reload(main_module)

    client = TestClient(main_module.app)
    response = client.get(
        "/ping",
        headers={"Origin": "https://myapp.up.railway.app"},
    )
    assert response.status_code == 200
    assert "access-control-allow-origin" in response.headers


def test_cors_defaults_to_localhost_when_env_not_set(monkeypatch):
    monkeypatch.delenv("ALLOWED_ORIGINS", raising=False)
    import importlib

    import asteroid_atlas.api.main as main_module
    importlib.reload(main_module)

    client = TestClient(main_module.app)
    response = client.get(
        "/ping",
        headers={"Origin": "http://localhost:5173"},
    )
    assert response.status_code == 200
