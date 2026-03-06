"""
test_jpl_fetch_retry.py
"""

from unittest.mock import Mock, patch

import requests

from asteroid_atlas.ingest.jpl_asteroids import fetch_jpl_asteroid


def test_fetch_jpl_asteroid_retries_once_then_succeeds():
    """
    Ensure fetch retries when the first request fails.
    """

    mock_response = Mock()
    mock_response.json.return_value = {
        "object": {"fullname": "Retry Asteroid", "spkid": "123"}
    }
    mock_response.raise_for_status.return_value = None

    call_sequence = [
        requests.exceptions.RequestException(),
        mock_response,
    ]

    with patch(
        "asteroid_atlas.ingest.jpl_asteroids.requests.get",
        side_effect=call_sequence,
    ):
        result = fetch_jpl_asteroid("123")

    assert result["object"]["fullname"] == "Retry Asteroid"