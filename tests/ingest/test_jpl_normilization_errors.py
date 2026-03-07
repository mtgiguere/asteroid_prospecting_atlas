"""
test_jpl_normalization_errors.py
"""

import pytest

from asteroid_atlas.ingest.jpl_asteroids import normalize_jpl_asteroid


def test_normalize_jpl_asteroid_raises_for_missing_object():
    """
    Ensure normalization fails clearly when the JPL payload has no object section.
    """

    with pytest.raises(ValueError, match="Missing 'object' in JPL payload"):
        normalize_jpl_asteroid({})


def test_normalize_jpl_asteroid_raises_for_missing_fullname():
    """
    Ensure normalization fails clearly when fullname is missing.
    """

    jpl_json = {
        "object": {
            "spkid": "2000433",
        }
    }

    with pytest.raises(ValueError, match="Missing required field 'fullname'"):
        normalize_jpl_asteroid(jpl_json)


def test_normalize_jpl_asteroid_raises_for_missing_spkid():
    """
    Ensure normalization fails clearly when spkid is missing.
    """

    jpl_json = {
        "object": {
            "fullname": "433 Eros",
        }
    }

    with pytest.raises(ValueError, match="Missing required field 'spkid'"):
        normalize_jpl_asteroid(jpl_json)
