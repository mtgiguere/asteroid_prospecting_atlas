"""
seed_db.py — populate the database with real NEA data from NASA JPL.

Usage:
    python scripts/seed_db.py
    python scripts/seed_db.py --limit 200
"""

import argparse
import logging

from asteroid_atlas.db.session import SessionLocal
from asteroid_atlas.ingest.load_seed_asteroids import load_seed_asteroids

logging.basicConfig(level=logging.INFO, format="%(levelname)s %(message)s")


def main():
    parser = argparse.ArgumentParser(description="Seed the database with NEA data from NASA JPL.")
    parser.add_argument(
        "--limit",
        type=int,
        default=500,
        help="Number of near-Earth asteroids to ingest (default: 500)",
    )
    args = parser.parse_args()

    session = SessionLocal()
    try:
        results = load_seed_asteroids(session, limit=args.limit)
        print(f"Done. {len(results)} asteroids processed.")
    finally:
        session.close()


if __name__ == "__main__":
    main()
