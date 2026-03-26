"""
Streamlit dashboard for Asteroid Prospecting Atlas.
Displays asteroids ranked by prospecting potential with 3D orbit visualization.
"""

import math
import requests
import streamlit as st
import plotly.graph_objects as go
import pandas as pd

st.set_page_config(page_title="Asteroid Prospecting Atlas", layout="wide")
st.title("🚀 Asteroid Prospecting Atlas")

# Sidebar controls
with st.sidebar:
    st.header("Filters")
    limit = st.slider("Number of asteroids to display", 1, 50, 10)
    earth_crossing_only = st.checkbox("Earth-crossing only")

BASE_URL = "http://localhost:8000"

@st.cache_data
def fetch_asteroids(limit, earth_crossing_only):
    """Fetch asteroids from FastAPI backend."""
    try:
        response = requests.get(
            f"{BASE_URL}/asteroids/prospectable",
            params={"limit": limit, "earth_crossing_only": earth_crossing_only},
            timeout=5
        )
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        st.error(f"API Error: {e}")
        return []

def orbit_points(semi_major_axis_au, eccentricity, inclination_deg, num_points=200):
    """Generate 3D orbital points from orbital elements."""
    inclination_rad = math.radians(inclination_deg)
    points = []
    
    for i in range(num_points):
        true_anomaly = 2 * math.pi * i / num_points
        
        # Semi-latus rectum formula
        r = semi_major_axis_au * (1 - eccentricity**2) / (1 + eccentricity * math.cos(true_anomaly))
        
        x = r * math.cos(true_anomaly)
        y = r * math.sin(true_anomaly)
        z = y * math.sin(inclination_rad)
        
        points.append((x, y, z))
    
    return points

try:
    # Fetch data
    asteroids = fetch_asteroids(limit, earth_crossing_only)
    
    if not asteroids:
        st.warning("No asteroids found. Check your filters or ensure FastAPI is running.")
    else:
        # Display table
        st.subheader(f"Top {len(asteroids)} Asteroids by Prospecting Potential")
        
        table_data = []
        for asteroid in asteroids:
            table_data.append({
                "Name": asteroid["name"],
                "Prospecting Score": f"{asteroid['prospecting_score']:.4f}",
                "Accessibility Score": f"{asteroid['accessibility_score']:.4f}",
                "Diameter (km)": f"{asteroid['estimated_diameter_km']:.2f}",
                "Semi-major Axis (AU)": f"{asteroid['semi_major_axis_au']:.4f}"
            })
        
        df = pd.DataFrame(table_data)
        st.dataframe(df, use_container_width=True)
        
        # Asteroid selector
        asteroid_names = [a["name"] for a in asteroids]
        selected_name = st.selectbox("Select asteroid to highlight", asteroid_names)
        
        # Build 3D visualization
        fig = go.Figure()
        
        # Earth's orbit (blue)
        earth_pts = orbit_points(1.0, 0.0167, 0.0, 200)
        earth_x = [p[0] for p in earth_pts]
        earth_y = [p[1] for p in earth_pts]
        earth_z = [p[2] for p in earth_pts]
        fig.add_trace(go.Scatter3d(
            x=earth_x, y=earth_y, z=earth_z,
            mode="lines",
            name="Earth",
            line=dict(color="blue", width=3)
        ))
        
        # Asteroid orbits
        for asteroid in asteroids:
            pts = orbit_points(
                asteroid["semi_major_axis_au"],
                asteroid["eccentricity"],
                asteroid["inclination_deg"]
            )
            
            x_coords = [p[0] for p in pts]
            y_coords = [p[1] for p in pts]
            z_coords = [p[2] for p in pts]
            
            # Highlight selected asteroid
            is_selected = asteroid["name"] == selected_name
            color = "red" if is_selected else "orange"
            width = 3 if is_selected else 1.5
            
            fig.add_trace(go.Scatter3d(
                x=x_coords, y=y_coords, z=z_coords,
                mode="lines",
                name=asteroid["name"],
                line=dict(color=color, width=width)
            ))
        
        # Sun at origin
        fig.add_trace(go.Scatter3d(
            x=[0], y=[0], z=[0],
            mode="markers",
            name="Sun",
            marker=dict(size=10, color="yellow")
        ))
        
        fig.update_layout(
            title="3D Orbital Visualization",
            scene=dict(
                xaxis_title="X (AU)",
                yaxis_title="Y (AU)",
                zaxis_title="Z (AU)",
                aspectmode="data"
            ),
            height=700,
            showlegend=True
        )
        
        st.plotly_chart(fig, use_container_width=True)
        
        # Details panel
        selected_asteroid = next((a for a in asteroids if a["name"] == selected_name), None)
        if selected_asteroid:
            st.subheader(f"📊 Details: {selected_asteroid['name']}")
            
            col1, col2, col3 = st.columns(3)
            
            with col1:
                st.metric(
                    "Prospecting Score",
                    f"{selected_asteroid['prospecting_score']:.4f}",
                    delta="(lower is better)"
                )
                st.metric(
                    "Accessibility Score",
                    f"{selected_asteroid['accessibility_score']:.4f}",
                    delta="(lower is better)"
                )
            
            with col2:
                st.metric(
                    "Diameter (km)",
                    f"{selected_asteroid['estimated_diameter_km']:.2f}"
                )
                st.metric(
                    "Absolute Magnitude",
                    f"{selected_asteroid['absolute_magnitude_h']:.2f}"
                )
            
            with col3:
                st.metric(
                    "Semi-major Axis (AU)",
                    f"{selected_asteroid['semi_major_axis_au']:.4f}"
                )
                st.metric(
                    "Eccentricity",
                    f"{selected_asteroid['eccentricity']:.4f}"
                )

except requests.exceptions.ConnectionError:
    st.error(
        "❌ Could not connect to FastAPI backend at http://localhost:8000\n\n"
        "Make sure FastAPI is running: `python -m asteroid_atlas.api.main`"
    )
except Exception as e:
    st.error(f"Error: {e}")
