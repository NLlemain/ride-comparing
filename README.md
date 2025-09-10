# Ride Comparing Demo

A fully functional web application demo to compare ride prices from various services like Uber, Lyft, and Bolt. Features a user-friendly interface with interactive route visualization and realistic price simulation.

**🎉 Now Working - Complete Demo Implementation!**

## Features

- **Location Autocomplete:** Smart search with suggestions from 30+ major cities worldwide
- **Route Visualization:** Visual A→B route representation with distance and time estimates
- **Realistic Price Simulation:** Dynamic pricing based on distance with company-specific variations
- **Surge Pricing Simulation:** Time-based surge pricing during peak hours (7-9 AM, 5-7 PM)
- **Responsive Design:** Works seamlessly on desktop and mobile devices
- **Real-time Distance Calculation:** Uses Haversine formula for accurate distance measurements

## Demo Data

This demo uses simulated data for demonstration purposes, including:
- Pre-loaded major cities (US and international)
- Realistic pricing algorithms 
- Distance-based fare calculation
- Time-of-day surge pricing
- Company-specific price variations

## How to Run

1. Clone the repository:
   ```bash
   git clone https://github.com/NLlemain/ride-comparing.git
   cd ride-comparing
   ```

2. Open `index.html` in your browser or serve it via a local server:
   ```bash
   python -m http.server 8000
   # Then visit http://localhost:8000
   ```

3. Or visit the live GitHub Pages site (if configured)

## Usage

1. **Start typing** in the "Enter start location" field - autocomplete suggestions will appear
2. **Select a starting location** from the dropdown suggestions
3. **Enter your destination** in the "Enter drop-off location" field
4. **Select your destination** from the suggestions
5. **Click "Compare Rides"** to see:
   - Route information with distance and estimated travel time
   - Price estimates from Uber, Lyft, and Bolt
   - Visual route representation

## Technical Implementation

- **No External Dependencies:** Self-contained demo without external API dependencies
- **Pure JavaScript:** Modern ES6+ JavaScript for all functionality
- **CSS Grid/Flexbox:** Responsive layout using modern CSS
- **Distance Calculation:** Haversine formula for accurate geographic distance
- **Price Algorithm:** Realistic fare calculation based on distance and time factors

## Simulation Features

- **30+ Sample Cities:** Major cities from US and Europe
- **Dynamic Pricing:** Each company has different pricing strategies
- **Surge Simulation:** Automatic surge pricing detection during peak hours
- **Loading States:** Realistic API simulation with loading indicators
- **Error Handling:** Graceful handling of invalid inputs

Perfect for demonstrations, prototyping, or as a starting point for real ride-sharing applications!
