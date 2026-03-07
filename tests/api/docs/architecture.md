# System Architecture

The Asteroid Prospecting Atlas follows a layered architecture.

```
Ingestion Layer
↓
Database Layer
↓
Analytics Layer
↓
API Layer
```

## Ingestion Layer

Responsible for retrieving and normalizing asteroid data.

Source:
NASA JPL Small Body Database API

Key module:

```
asteroid_atlas.ingest.jpl_asteroids
```

Functions include:

• fetching asteroid records
• normalizing orbital data
• inserting records into the database

---

## Database Layer

PostgreSQL is used to store asteroid and orbital information.

Tables:

```
asteroids
asteroid_orbits
```

---

## Analytics Layer

The analytics layer calculates derived orbital properties.

Examples:

• perihelion distance
• aphelion distance
• Earth-orbit crossing classification
• accessibility scoring

---

## API Layer

FastAPI exposes the analytics results via HTTP endpoints.

Current endpoints:

```
GET /ping
GET /asteroids/accessible
```

The API returns ranked asteroid candidates based on accessibility metrics.