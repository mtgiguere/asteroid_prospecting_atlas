"""
test_load_seed_asteroids.py
"""

from unittest.mock import MagicMock, patch

from asteroid_atlas.ingest.load_seed_asteroids import load_seed_asteroids


def test_load_seed_asteroids_delegates_to_bulk_ingest():
    session = MagicMock()
    mock_results = [MagicMock(), MagicMock(), MagicMock()]

    with patch(
        "asteroid_atlas.ingest.load_seed_asteroids.ingest_bulk_asteroids",
        return_value=mock_results,
    ) as mock_ingest:
        results = load_seed_asteroids(session, limit=100)

    mock_ingest.assert_called_once_with(session, 100)
    assert len(results) == 3


def test_load_seed_asteroids_default_limit_is_500():
    session = MagicMock()

    with patch(
        "asteroid_atlas.ingest.load_seed_asteroids.ingest_bulk_asteroids",
        return_value=[],
    ) as mock_ingest:
        load_seed_asteroids(session)

    _, called_limit = mock_ingest.call_args[0]
    assert called_limit == 500
