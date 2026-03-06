"""
test_jpl_fetch.py
"""

from unittest.mock import Mock, patch

from asteroid_atlas.ingest.jpl_asteroids import fetch_jpl_asteroid


def test_fetch_jpl_asteroid_returns_json_payload():
    """
    Ensure the JPL fetcher returns parsed JSON from the API response.
    """

    mock_response = Mock()
    mock_response.json.return_value = {
        "object": {
            "fullname": "433 Eros",
            "spkid": "2000433",
        }
    }
    mock_response.raise_for_status.return_value = None

    with patch("asteroid_atlas.ingest.jpl_asteroids.requests.get", return_value=mock_response) as mock_get:
        result = fetch_jpl_asteroid("2000433")

    mock_get.assert_called_once()
    assert result["object"]["fullname"] == "433 Eros"
    assert result["object"]["spkid"] == "2000433"