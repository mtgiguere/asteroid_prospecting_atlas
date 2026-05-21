"""
test_jpl_bulk_fetch.py
"""

from unittest.mock import MagicMock, patch

import pytest
import requests as req

from asteroid_atlas.ingest.jpl_bulk import fetch_jpl_neo_bulk

MOCK_RESPONSE = {
    "fields": [
        "spkid",
        "full_name",
        "H",
        "diameter",
        "albedo",
        "e",
        "a",
        "i",
        "om",
        "w",
        "ma",
        "per",
        "epoch",
    ],
    "data": [
        [
            "2000433",
            "433 Eros (1898 DQ)",
            "10.31",
            "16.84",
            "0.25",
            "0.2228",
            "1.4580",
            "10.827",
            "304.299",
            "178.641",
            "358.1",
            "642.997",
            "60200.5",
        ]
    ],
    "count": 1,
}


def _mock_get_success():
    m = MagicMock()
    m.json.return_value = MOCK_RESPONSE
    m.raise_for_status.return_value = None
    return m


def test_fetch_jpl_neo_bulk_returns_fields_and_data():
    with patch("asteroid_atlas.ingest.jpl_bulk.requests.get", return_value=_mock_get_success()):
        result = fetch_jpl_neo_bulk(limit=1)

    assert "fields" in result
    assert "data" in result
    assert len(result["data"]) == 1


def test_fetch_jpl_neo_bulk_passes_neo_group_and_asteroid_kind():
    with patch(
        "asteroid_atlas.ingest.jpl_bulk.requests.get", return_value=_mock_get_success()
    ) as mock_get:
        fetch_jpl_neo_bulk(limit=100)

    params = mock_get.call_args[1]["params"]
    assert params["sb-group"] == "neo"
    assert params["sb-kind"] == "a"
    assert params["limit"] == 100


def test_fetch_jpl_neo_bulk_retries_on_transient_failure():
    success = _mock_get_success()
    with patch("asteroid_atlas.ingest.jpl_bulk.requests.get") as mock_get:
        with patch("asteroid_atlas.ingest.jpl_bulk.time.sleep"):
            mock_get.side_effect = [req.exceptions.RequestException("timeout"), success]
            result = fetch_jpl_neo_bulk(limit=1)

    assert "data" in result
    assert mock_get.call_count == 2


def test_fetch_jpl_neo_bulk_raises_after_max_retries():
    with patch("asteroid_atlas.ingest.jpl_bulk.requests.get") as mock_get:
        with patch("asteroid_atlas.ingest.jpl_bulk.time.sleep"):
            mock_get.side_effect = req.exceptions.RequestException("timeout")
            with pytest.raises(req.exceptions.RequestException):
                fetch_jpl_neo_bulk(limit=1)

    assert mock_get.call_count == 3
