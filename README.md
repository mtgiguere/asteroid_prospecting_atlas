# Asteroid Prospecting Atlas

Asteroid Prospecting Atlas is a Python-based platform for ingesting, normalizing, scoring, and exposing asteroid prospecting data through a documented API.

The goal is to build a scientifically grounded prospecting system that ranks asteroids by mining potential using a combination of:

* resource potential
* orbital accessibility
* physical characteristics
* future mission feasibility

---

## Project Principles

This project follows strict engineering discipline:

* Documentation-first development
* Test-Driven Development (TDD)
* CI/CD pipeline for vulnerability scanning, linting, unit testing, and end-to-end testing
* Modular architecture designed for scientific transparency and extensibility

---

## Planned MVP

The first version will:

* ingest a small asteroid dataset
* normalize and persist it in PostgreSQL
* compute a prospecting score
* expose search and ranking endpoints via FastAPI
* maintain high test coverage

Future phases may add:

* launch trajectory estimation
* orbital visualization
* mission planning tools
* asteroid resource simulation

---

## Technology Stack

Backend

* Python
* FastAPI
* PostgreSQL
* SQLAlchemy
* Docker

Data Processing

* Pandas
* NumPy
* Astropy

Testing & Quality

* pytest
* Ruff (linting and formatting)
* pip-audit (vulnerability scanning)

Infrastructure

* Docker Compose
* GitHub Actions CI/CD

---

## Local Development

### 1. Start PostgreSQL

docker compose up -d db

### 2. Create and activate a virtual environment

Linux / Mac:

python -m venv .venv
source .venv/bin/activate

Windows PowerShell:

python -m venv .venv
.venv\Scripts\Activate.ps1

### 3. Install dependencies

pip install -e .[dev]

### 4. Run the API

uvicorn asteroid_atlas.api.main:app --reload --app-dir src

### 5. Run tests

pytest

---

## API Documentation

Once the server is running, interactive API documentation is available at:

http://localhost:8000/docs

---

## Project Structure

asteroid_prospecting_atlas/

.github/workflows/ — CI/CD pipeline configuration
docs/ — architecture, data sources, scoring design
src/asteroid_atlas/ — main application source code
tests/ — unit and end-to-end tests
docker-compose.yml — PostgreSQL container setup
pyproject.toml — project configuration and dependencies

---

## Documentation

Additional documentation can be found in the docs directory:

docs/architecture.md — system architecture
docs/data_sources.md — asteroid dataset sources
docs/development.md — development workflow and tooling
docs/scoring.md — prospecting scoring methodology

---

## Vision

Asteroid Prospecting Atlas is designed to evolve into a platform that combines:

* planetary science
* orbital mechanics
* resource estimation
* mission accessibility analysis

The long-term goal is to provide an open, transparent framework for evaluating asteroid resource potential and mission feasibility.
