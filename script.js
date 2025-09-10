// Global variables
let userLocation = null;
let dropoffLocation = null;
let currentRequestController = null;

// Sample locations for demonstration
const sampleLocations = [
    { display_name: "New York, NY, USA", lat: 40.7128, lon: -74.0060 },
    { display_name: "Los Angeles, CA, USA", lat: 34.0522, lon: -118.2437 },
    { display_name: "Chicago, IL, USA", lat: 41.8781, lon: -87.6298 },
    { display_name: "Houston, TX, USA", lat: 29.7604, lon: -95.3698 },
    { display_name: "Philadelphia, PA, USA", lat: 39.9526, lon: -75.1652 },
    { display_name: "Phoenix, AZ, USA", lat: 33.4484, lon: -112.0740 },
    { display_name: "San Antonio, TX, USA", lat: 29.4241, lon: -98.4936 },
    { display_name: "San Diego, CA, USA", lat: 32.7157, lon: -117.1611 },
    { display_name: "Dallas, TX, USA", lat: 32.7767, lon: -96.7970 },
    { display_name: "San Jose, CA, USA", lat: 37.3382, lon: -121.8863 },
    { display_name: "Austin, TX, USA", lat: 30.2672, lon: -97.7431 },
    { display_name: "Jacksonville, FL, USA", lat: 30.3322, lon: -81.6557 },
    { display_name: "Fort Worth, TX, USA", lat: 32.7555, lon: -97.3308 },
    { display_name: "Columbus, OH, USA", lat: 39.9612, lon: -82.9988 },
    { display_name: "San Francisco, CA, USA", lat: 37.7749, lon: -122.4194 },
    { display_name: "Charlotte, NC, USA", lat: 35.2271, lon: -80.8431 },
    { display_name: "Indianapolis, IN, USA", lat: 39.7684, lon: -86.1581 },
    { display_name: "Seattle, WA, USA", lat: 47.6062, lon: -122.3321 },
    { display_name: "Denver, CO, USA", lat: 39.7392, lon: -104.9903 },
    { display_name: "Washington, DC, USA", lat: 38.9072, lon: -77.0369 },
    { display_name: "Boston, MA, USA", lat: 42.3601, lon: -71.0589 },
    { display_name: "El Paso, TX, USA", lat: 31.7619, lon: -106.4850 },
    { display_name: "Detroit, MI, USA", lat: 42.3314, lon: -83.0458 },
    { display_name: "Nashville, TN, USA", lat: 36.1627, lon: -86.7816 },
    { display_name: "Portland, OR, USA", lat: 45.5152, lon: -122.6784 },
    { display_name: "Amsterdam, Netherlands", lat: 52.3676, lon: 4.9041 },
    { display_name: "London, UK", lat: 51.5074, lon: -0.1278 },
    { display_name: "Paris, France", lat: 48.8566, lon: 2.3522 },
    { display_name: "Berlin, Germany", lat: 52.5200, lon: 13.4050 },
    { display_name: "Madrid, Spain", lat: 40.4168, lon: -3.7038 }
];

function initApp() {
    console.log("Ride Comparing Demo initialized");
    resetPrices();
    
    // Try to get user's current location
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                userLocation = {
                    lat: position.coords.latitude,
                    lon: position.coords.longitude,
                    display_name: `Your Location (${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)})`
                };
                document.getElementById("start").placeholder = "Current location detected - or type to search";
                console.log("User location detected:", userLocation);
            },
            (error) => {
                console.log("Geolocation not available or denied:", error.message);
                // Set a default location (New York)
                userLocation = sampleLocations[0];
                document.getElementById("start").value = userLocation.display_name;
            }
        );
    } else {
        // Set a default location (New York)
        userLocation = sampleLocations[0];
        document.getElementById("start").value = userLocation.display_name;
    }
}

async function fetchStartSuggestions() {
    const startLocation = document.getElementById("start").value;
    const startSuggestionsDiv = document.getElementById("start-suggestions");

    if (startLocation.length < 2) {
        startSuggestionsDiv.style.display = 'none';
        return;
    }

    // Filter sample locations based on input
    const filteredLocations = sampleLocations.filter(location =>
        location.display_name.toLowerCase().includes(startLocation.toLowerCase())
    );

    startSuggestionsDiv.innerHTML = '';
    filteredLocations.slice(0, 5).forEach(location => {
        const div = document.createElement('div');
        div.className = 'suggestion-item';
        div.textContent = location.display_name;
        div.onclick = () => selectStartSuggestion(location);
        startSuggestionsDiv.appendChild(div);
    });

    startSuggestionsDiv.style.display = filteredLocations.length ? 'block' : 'none';
}

function selectStartSuggestion(location) {
    document.getElementById("start").value = location.display_name;
    document.getElementById("start-suggestions").style.display = 'none';
    userLocation = location;
    resetDisplay();
    console.log("Start location selected:", location);
}

async function fetchSuggestions() {
    const endLocation = document.getElementById("end").value;
    const suggestionsDiv = document.getElementById("suggestions");

    if (endLocation.length < 2) {
        suggestionsDiv.style.display = 'none';
        return;
    }

    // Filter sample locations based on input
    const filteredLocations = sampleLocations.filter(location =>
        location.display_name.toLowerCase().includes(endLocation.toLowerCase())
    );

    suggestionsDiv.innerHTML = '';
    filteredLocations.slice(0, 5).forEach(location => {
        const div = document.createElement('div');
        div.className = 'suggestion-item';
        div.textContent = location.display_name;
        div.onclick = () => selectEndSuggestion(location);
        suggestionsDiv.appendChild(div);
    });

    suggestionsDiv.style.display = filteredLocations.length ? 'block' : 'none';
}

function selectEndSuggestion(location) {
    document.getElementById("end").value = location.display_name;
    document.getElementById("suggestions").style.display = 'none';
    dropoffLocation = location;
    resetDisplay();
    console.log("End location selected:", location);
}

function resetDisplay() {
    document.getElementById("route-info").style.display = 'none';
    document.getElementById("route-display").innerHTML = '<p>Enter start and end locations to see route visualization</p>';
    resetPrices();
}

function resetPrices() {
    document.getElementById("uber-price").textContent = "-";
    document.getElementById("lyft-price").textContent = "-";
    document.getElementById("bolt-price").textContent = "-";
    
    document.getElementById("uber-price").className = "price";
    document.getElementById("lyft-price").className = "price";
    document.getElementById("bolt-price").className = "price";
}

async function fetchRides() {
    const startInput = document.getElementById("start").value;
    const endInput = document.getElementById("end").value;

    if (!startInput || !endInput) {
        alert("Please enter both start and end locations.");
        return;
    }

    // If locations haven't been selected from suggestions, try to match them
    if (!userLocation) {
        userLocation = findLocationByName(startInput) || sampleLocations[0];
    }
    
    if (!dropoffLocation) {
        dropoffLocation = findLocationByName(endInput);
        if (!dropoffLocation) {
            alert("Please select a destination from the suggestions or enter a valid location.");
            return;
        }
    }

    // Show loading state
    showLoadingPrices();
    
    // Calculate route information
    const routeInfo = calculateRouteInfo(userLocation, dropoffLocation);
    displayRouteInfo(routeInfo);
    
    // Simulate API delay and fetch ride estimates
    setTimeout(() => {
        const estimates = generateRideEstimates(routeInfo);
        displayRideEstimates(estimates);
    }, 1500);
}

function findLocationByName(name) {
    return sampleLocations.find(loc => 
        loc.display_name.toLowerCase().includes(name.toLowerCase()) ||
        name.toLowerCase().includes(loc.display_name.toLowerCase())
    );
}

function showLoadingPrices() {
    document.getElementById("uber-price").textContent = "Loading...";
    document.getElementById("lyft-price").textContent = "Loading...";
    document.getElementById("bolt-price").textContent = "Loading...";
    
    document.getElementById("uber-price").className = "price loading";
    document.getElementById("lyft-price").className = "price loading";
    document.getElementById("bolt-price").className = "price loading";
}

function calculateRouteInfo(start, end) {
    // Calculate distance using Haversine formula
    const R = 6371; // Earth's radius in kilometers
    const dLat = (end.lat - start.lat) * Math.PI / 180;
    const dLon = (end.lon - start.lon) * Math.PI / 180;
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(start.lat * Math.PI / 180) * Math.cos(end.lat * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c; // Distance in kilometers
    
    // Estimate duration (assuming average speed of 40 km/h in city)
    const duration = (distance / 40) * 60; // Duration in minutes
    
    return {
        distance: distance,
        duration: duration,
        start: start,
        end: end
    };
}

function displayRouteInfo(routeInfo) {
    const routeInfoDiv = document.getElementById("route-info");
    const distanceDurationDiv = document.getElementById("distance-duration");
    const routeDisplayDiv = document.getElementById("route-display");
    
    // Format distance and duration
    const distanceStr = routeInfo.distance < 1 
        ? `${(routeInfo.distance * 1000).toFixed(0)} m`
        : `${routeInfo.distance.toFixed(2)} km`;
    
    const durationStr = routeInfo.duration < 60
        ? `${Math.round(routeInfo.duration)} min`
        : `${Math.floor(routeInfo.duration / 60)}h ${Math.round(routeInfo.duration % 60)}m`;
    
    distanceDurationDiv.innerHTML = `
        <strong>Distance:</strong> ${distanceStr} | 
        <strong>Estimated Time:</strong> ${durationStr}
    `;
    
    // Create visual route representation
    routeDisplayDiv.innerHTML = `
        <div class="route-visualization">
            <div class="route-step start">
                <div class="icon">A</div>
                <div>${routeInfo.start.display_name}</div>
            </div>
            <div class="route-step path">
                <div class="icon">→</div>
                <div>${distanceStr} via city roads</div>
            </div>
            <div class="route-step end">
                <div class="icon">B</div>
                <div>${routeInfo.end.display_name}</div>
            </div>
        </div>
    `;
    
    routeInfoDiv.style.display = 'block';
}

function generateRideEstimates(routeInfo) {
    const basePrice = Math.max(5, routeInfo.distance * 2.5); // Base price calculation
    
    // Add some randomization and company-specific pricing
    const uberMultiplier = 0.9 + (Math.random() * 0.3); // 0.9 to 1.2
    const lyftMultiplier = 0.85 + (Math.random() * 0.4); // 0.85 to 1.25
    const boltMultiplier = 0.8 + (Math.random() * 0.3); // 0.8 to 1.1
    
    // Add surge pricing simulation
    const surgeHour = new Date().getHours();
    const surgeFactor = (surgeHour >= 7 && surgeHour <= 9) || (surgeHour >= 17 && surgeHour <= 19) ? 1.3 : 1.0;
    
    return {
        uber: (basePrice * uberMultiplier * surgeFactor).toFixed(2),
        lyft: (basePrice * lyftMultiplier * surgeFactor).toFixed(2),
        bolt: (basePrice * boltMultiplier * surgeFactor).toFixed(2),
        surgeFactor: surgeFactor
    };
}

function displayRideEstimates(estimates) {
    document.getElementById("uber-price").textContent = `$${estimates.uber}`;
    document.getElementById("lyft-price").textContent = `$${estimates.lyft}`;
    document.getElementById("bolt-price").textContent = `$${estimates.bolt}`;
    
    // Add success styling
    document.getElementById("uber-price").className = "price success";
    document.getElementById("lyft-price").className = "price success";
    document.getElementById("bolt-price").className = "price success";
    
    // Show surge pricing notification if applicable
    if (estimates.surgeFactor > 1) {
        const notification = document.createElement('div');
        notification.style.cssText = `
            background: #fff3cd;
            color: #856404;
            padding: 10px;
            border-radius: 5px;
            margin-top: 10px;
            border-left: 4px solid #ffc107;
        `;
        notification.innerHTML = `⚠️ Surge pricing active (${estimates.surgeFactor}x) - Rush hour detected`;
        document.querySelector('.price-estimates').appendChild(notification);
        
        // Remove notification after 5 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 5000);
    }
    
    console.log("Ride estimates generated:", estimates);
}

// Hide suggestions when clicking outside
document.addEventListener('click', function(event) {
    if (!event.target.matches('#start') && !event.target.matches('.suggestion-item')) {
        document.getElementById('start-suggestions').style.display = 'none';
    }
    if (!event.target.matches('#end') && !event.target.matches('.suggestion-item')) {
        document.getElementById('suggestions').style.display = 'none';
    }
});

// Initialize app when page loads
window.onload = initApp;
