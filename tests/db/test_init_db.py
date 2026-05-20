"""
test_init_db.py
"""

from unittest.mock import patch

from asteroid_atlas.db import init_db


def test_init_db_main_calls_create_all():
    """Ensure main() calls Base.metadata.create_all with the engine."""

    with patch("asteroid_atlas.db.init_db.Base") as mock_base:
        init_db.main()

    mock_base.metadata.create_all.assert_called_once()
