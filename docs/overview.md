# Asteroid Prospecting Atlas

The Asteroid Prospecting Atlas is a data platform designed to analyze asteroids and estimate their potential accessibility for future exploration or mining missions.

The system ingests astronomical data from NASA's Jet Propulsion Laboratory (JPL) Small Body Database and transforms it into a structured dataset that can be analyzed and ranked.

## What the Atlas Does

The system currently supports:

• Fetching asteroid data from NASA  
• Normalizing orbital data  
• Storing asteroid records in PostgreSQL  
• Calculating orbital characteristics  
• Identifying Earth-crossing asteroids  
• Ranking asteroids by accessibility and prospecting score  
• Visualizing asteroid orbits in an interactive 3D solar system  

## Why This Project Exists

There are hundreds of thousands of known asteroids in our solar system.

Some of them are easier to reach than others.

The goal of this project is to build tools that help answer questions such as:

• Which asteroids are easiest to reach from Earth?  
• Which asteroids cross Earth's orbit?  
• Which objects might be good candidates for future exploration missions?

## Current Capabilities

The Atlas can currently:

1. Ingest real asteroid data from NASA
2. Calculate orbital metrics
3. Classify asteroid orbits
4. Rank asteroids by accessibility and prospecting score
5. Provide an API for querying results
6. Render asteroid orbits in a 3D interactive solar system (CesiumJS frontend)

Future versions will include more detailed orbital analysis and mission cost estimates.