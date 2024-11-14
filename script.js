let map;
let userMarker;
let userLocation;
let dropoffMarker;
let routesLayerGroup;
let currentRequestController = null;
let currentActiveRoute = null;

function initMap() {
    map = L.map('map').setView([52.3676, 4.9041], 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
    }).addTo(map);

    // Request user location
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                userLocation = [position.coords.latitude, position.coords.longitude];
                map.setView(userLocation, 15);
                userMarker = L.marker(userLocation).addTo(map).bindPopup('You are here').openPopup();
            },
            (error) => {
                console.error('Error getting location: ', error);
            }
        );
    }

    map.on('click', async (e) => {
        const latlng = e.latlng;
        const address = await getAddress(latlng.lat, latlng.lng);
        if (address) {
            document.getElementById("end").value = address;
            resetMap();
            addDropoffMarker({ lat: latlng.lat, lon: latlng.lng });
        }
    });

    map.touchZoom.enable();
    map.scrollWheelZoom.enable();
    map.doubleClickZoom.enable();
}

async function fetchStartSuggestions() {
    const startLocation = document.getElementById("start").value;
    const startSuggestionsDiv = document.getElementById("start-suggestions");

    if (startLocation.length < 3) {
        startSuggestionsDiv.style.display = 'none';
        return;
    }

    if (currentRequestController) {
        currentRequestController.abort();
    }

    currentRequestController = new AbortController();

    try {
        const response = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(startLocation)}&format=json&addressdetails=1&limit=5`, {
            signal: currentRequestController.signal
        });
        const data = await response.json();

        if (currentRequestController.signal.aborted) return;

        startSuggestionsDiv.innerHTML = '';
        data.forEach(feature => {
            const div = document.createElement('div');
            div.className = 'suggestion-item';
            div.textContent = feature.display_name;
            div.onclick = () => selectStartSuggestion(feature);
            startSuggestionsDiv.appendChild(div);
        });

        startSuggestionsDiv.style.display = data.length ? 'block' : 'none';
    } catch (error) {
        if (error.name !== 'AbortError') {
            console.error('Fetch error:', error);
        }
    } finally {
        currentRequestController = null;
    }
}

function selectStartSuggestion(feature) {
    document.getElementById("start").value = feature.display_name;
    document.getElementById("start-suggestions").style.display = 'none';
    resetMap();
    userLocation = [feature.lat, feature.lon];
    if (userMarker) {
        map.removeLayer(userMarker);
    }
    userMarker = L.marker(userLocation).addTo(map).bindPopup('You are here').openPopup();
    map.setView(userLocation, 15);
}

async function fetchSuggestions() {
    const endLocation = document.getElementById("end").value;
    const suggestionsDiv = document.getElementById("suggestions");

    if (endLocation.length < 3) {
        suggestionsDiv.style.display = 'none';
        return;
    }

    if (currentRequestController) {
        currentRequestController.abort();
    }

    currentRequestController = new AbortController();

    try {
        const response = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(endLocation)}&format=json&addressdetails=1&limit=5`, {
            signal: currentRequestController.signal
        });
        const data = await response.json();

        if (currentRequestController.signal.aborted) return;

        suggestionsDiv.innerHTML = '';
        data.forEach(feature => {
            const div = document.createElement('div');
            div.className = 'suggestion-item';
            div.textContent = feature.display_name;
            div.onclick = () => selectEndSuggestion(feature);
            suggestionsDiv.appendChild(div);
        });

        suggestionsDiv.style.display = data.length ? 'block' : 'none';
    } catch (error) {
        if (error.name !== 'AbortError') {
            console.error('Fetch error:', error);
        }
    } finally {
        currentRequestController = null;
    }
}

function selectEndSuggestion(feature) {
    document.getElementById("end").value = feature.display_name;
    document.getElementById("suggestions").style.display = 'none';
    resetMap();
    addDropoffMarker({ lat: feature.lat, lon: feature.lon });
}

async function getAddress(lat, lon) {
    try {
        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`);
        const data = await response.json();
        return data.display_name || null;
    } catch (error) {
        console.error('Fetch error:', error);
        return null;
    }
}

function resetMap() {
    if (dropoffMarker) {
        map.removeLayer(dropoffMarker);
    }
    if (routesLayerGroup) {
        map.removeLayer(routesLayerGroup);
    }
    document.getElementById("uber-price").textContent = "";
    document.getElementById("lyft-price").textContent = "";
    document.getElementById("bolt-price").textContent = "";
    currentActiveRoute = null;
}

function addDropoffMarker(location) {
    dropoffMarker = L.marker([location.lat, location.lon]).addTo(map);
    fetchRoutes(location);
}

async function fetchRoutes(location) {
    const url = `https://router.project-osrm.org/route/v1/driving/${userLocation[1]},${userLocation[0]};${location.lon},${location.lat}?geometries=geojson&overview=full&alternatives=true`;

    try {
        const response = await fetch(url);
        const data = await response.json();
        if (data.routes.length) {
            displayRoutes(data.routes);
            const route = data.routes[0];
            const distanceMeters = route.distance;
            const distanceKilometers = (distanceMeters / 1000).toFixed(2);
            const duration = route.duration;
            const hours = Math.floor(duration / 3600);
            const minutes = Math.floor((duration % 3600) / 60);
            const seconds = Math.round(duration % 60);

            const distanceDisplay = distanceMeters > 1000 
                ? `${distanceKilometers} km (${distanceMeters} m)`
                : `${distanceMeters} m`;

            const durationDisplay = hours > 0 
                ? `${hours} hr ${minutes} min ${seconds} sec`
                : `${minutes} min ${seconds} sec`;

            dropoffMarker.bindPopup(`Distance: ${distanceDisplay}<br>Duration: ${durationDisplay}`).openPopup();
            fetchRideEstimates(location);
        }
    } catch (error) {
        console.error('Error fetching routes:', error);
    }
}

function displayRoutes(routes) {
    routesLayerGroup = L.layerGroup().addTo(map);

    routes.forEach((route, index) => {
        const coordinates = route.geometry.coordinates.map(coord => [coord[1], coord[0]]);
        const polylineOptions = {
            color: 'blue',
            opacity: index === 0 ? 0.7 : 0.3,
            weight: 5
        };

        const routePolyline = L.polyline(coordinates, polylineOptions).addTo(routesLayerGroup);

        routePolyline.on('click', () => {
            if (currentActiveRoute) {
                currentActiveRoute.setStyle({ opacity: 0.3 });
            }
            routePolyline.setStyle({ opacity: 0.7 });
            currentActiveRoute = routePolyline;
        });

        const duration = route.duration;
        const hours = Math.floor(duration / 3600);
        const minutes = Math.floor((duration % 3600) / 60);
        const seconds = Math.round(duration % 60);
        const distanceMeters = route.distance;
        const distanceKilometers = (distanceMeters / 1000).toFixed(2);

        const distanceDisplay = distanceMeters > 1000 
            ? `${distanceKilometers} km (${distanceMeters} m)`
            : `${distanceMeters} m`;

        const durationDisplay = hours > 0 
            ? `${hours} hr ${minutes} min ${seconds} sec`
            : `${minutes} min ${seconds} sec`;

        routePolyline.bindPopup(`Route ${index + 1}: ${durationDisplay}<br>Distance: ${distanceDisplay}`);

        if (index === 0) {
            currentActiveRoute = routePolyline;
        }
    });
}

async function fetchRideEstimates(location) {
    const dropoffLat = dropoffMarker.getLatLng().lat;
    const dropoffLng = dropoffMarker.getLatLng().lng;

    const uberApiKey = 'YOUR_UBER_API_KEY'; 
    const lyftApiKey = 'YOUR_LYFT_API_KEY'; 
    const boltApiKey = 'YOUR_BOLT_API_KEY';

    const uberUrl = `https://api.uber.com/v1.2/estimates/price?start_latitude=${userLocation[0]}&start_longitude=${userLocation[1]}&end_latitude=${dropoffLat}&end_longitude=${dropoffLng}`;
    const lyftUrl = `https://api.lyft.com/v1/cost?start_lat=${userLocation[0]}&start_lng=${userLocation[1]}&end_lat=${dropoffLat}&end_lng=${dropoffLng}`;
    const boltUrl = `https://api.bolt.eu/v1/estimates/price?start_latitude=${userLocation[0]}&start_longitude=${userLocation[1]}&end_latitude=${dropoffLat}&end_longitude=${dropoffLng}`;

    try {
        const [uberResponse, lyftResponse, boltResponse] = await Promise.all([
            fetch(uberUrl, { headers: { Authorization: `Bearer ${uberApiKey}` } }),
            fetch(lyftUrl, { headers: { Authorization: `Bearer ${lyftApiKey}` } }),
            fetch(boltUrl, { headers: { Authorization: `Bearer ${boltApiKey}` } })
        ]);

        const [uberData, lyftData, boltData] = await Promise.all([uberResponse.json(), lyftResponse.json(), boltResponse.json()]);

        const uberEstimate = uberData.prices[0] ? `${uberData.prices[0].estimated_cost_cents / 100} USD` : "Not available";
        const lyftEstimate = lyftData.cost_estimates[0] ? `${lyftData.cost_estimates[0].estimated_cost_cents / 100} USD` : "Not available";
        const boltEstimate = boltData.estimates[0] ? `${boltData.estimates[0].cost} USD` : "Not available";

        document.getElementById("uber-price").textContent = uberEstimate;
        document.getElementById("lyft-price").textContent = lyftEstimate;
        document.getElementById("bolt-price").textContent = boltEstimate;
    } catch (error) {
        console.error('Error fetching ride estimates:', error);
        document.getElementById("uber-price").textContent = "Error";
        document.getElementById("lyft-price").textContent = "Error";
        document.getElementById("bolt-price").textContent = "Error";
    }
}

async function fetchRides() {
    const endLocation = document.getElementById("end").value;

    if (!endLocation) {
        return;
    }

    const endCoordinates = await getCoordinates(endLocation);
    if (endCoordinates && endCoordinates.lat && endCoordinates.lon) {
        resetMap();
        addDropoffMarker(endCoordinates);
    }
}

async function getCoordinates(location) {
    const response = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(location)}&format=json&limit=1`);
    const data = await response.json();
    return data[0] ? { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon), address: data[0].display_name } : null;
}

window.onload = initMap;
