# AI Parking Intelligence Module

This directory contains the AI & Machine Learning models for **Smart Parking Finder**:

1. **Occupancy Predictor (`ai/models/occupancy_predictor.py`)**
   - Trained on historical facility occupancy, hour of day, day of week, weather conditions, and proximity to smart city events.
   - Outputs predicted available spots and a statistical confidence score (Low, Medium, High).

2. **Recommendation Engine (`ai/models/recommendation_engine.py`)**
   - Ranks parking facilities based on a composite score:
     - Distance from user destination
     - Hourly parking tariff
     - Predicted occupancy rate
     - Facility amenities (EV charging, covered roof, accessibility)

Models will be fully integrated with FastAPI endpoints in **Phase 4**.
