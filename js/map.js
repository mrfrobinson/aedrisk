/**
 * Map Module
 * Handles Leaflet map initialization and interactions
 */

const MapManager = {
    map: null,
    userMarker: null,
    facilityMarkers: [],
    routeLayer: null,
    
    // Ontario center coordinates
    defaultCenter: [44.5, -79.5],
    defaultZoom: 7,

    /**
     * Initialize the map
     */
    initMap() {
        // Create map centered on Ontario
        this.map = L.map('map', {
            center: this.defaultCenter,
            zoom: this.defaultZoom,
            zoomControl: true
        });

        // Add OpenStreetMap tile layer
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            maxZoom: 19
        }).addTo(this.map);

        // Add click event for pin dropping
        this.map.on('click', (e) => {
            this.onMapClick(e.latlng);
        });

        console.log('Map initialized');
    },

    /**
     * Handle map click event
     * @param {object} latlng - Clicked coordinates
     */
    onMapClick(latlng) {
        if (window.App) {
            window.App.onLocationSelected(latlng.lat, latlng.lng);
        }
    },

    /**
     * Set user location marker
     * @param {number} lat - Latitude
     * @param {number} lon - Longitude
     */
    setUserMarker(lat, lon) {
        // Remove existing marker
        if (this.userMarker) {
            this.map.removeLayer(this.userMarker);
        }

        // Create custom icon for user location
        const userIcon = L.divIcon({
            className: 'user-marker',
            html: '<div style="background: #667eea; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);"></div>',
            iconSize: [20, 20],
            iconAnchor: [10, 10]
        });

        // Add marker
        this.userMarker = L.marker([lat, lon], { icon: userIcon })
            .addTo(this.map)
            .bindPopup('<b>Your Location</b>')
            .openPopup();

        // Center map on location
        this.map.setView([lat, lon], 12);
    },

    /**
     * Add facility markers to map
     * @param {object} facilities - Nearest facilities
     */
    addFacilityMarkers(facilities) {
        // Clear existing facility markers
        this.clearFacilityMarkers();

        const icons = {
            fire_station: { emoji: '🚒', color: '#ff6b6b' },
            ambulance_station: { emoji: '🚑', color: '#4ecdc4' },
            hospital: { emoji: '🏥', color: '#45b7d1' }
        };

        Object.keys(facilities).forEach(type => {
            const facility = facilities[type];
            if (!facility) return;

            const icon = icons[type];
            const markerIcon = L.divIcon({
                className: 'facility-marker',
                html: `<div style="font-size: 24px; text-shadow: 2px 2px 4px rgba(0,0,0,0.5);">${icon.emoji}</div>`,
                iconSize: [30, 30],
                iconAnchor: [15, 15]
            });

            const name = facility.properties.name || 'Unknown';
            const marker = L.marker([facility.lat, facility.lon], { icon: markerIcon })
                .addTo(this.map)
                .bindPopup(`
                    <div class="popup-facility-name">${icon.emoji} ${name}</div>
                    <div class="popup-facility-type">${this.formatFacilityType(type)}</div>
                `);

            this.facilityMarkers.push(marker);
        });
    },

    /**
     * Draw routes on map
     * @param {object} routes - Routes to facilities
     */
    drawRoutes(routes) {
        // Clear existing routes
        if (this.routeLayer) {
            this.map.removeLayer(this.routeLayer);
        }

        // Create layer group for routes
        this.routeLayer = L.layerGroup().addTo(this.map);

        const colors = {
            fire_station: '#ff6b6b',
            ambulance_station: '#4ecdc4',
            hospital: '#45b7d1'
        };

        Object.keys(routes).forEach(type => {
            const route = routes[type];
            if (!route || !route.geometry) return;

            const coordinates = route.geometry.coordinates.map(coord => [coord[1], coord[0]]);
            
            L.polyline(coordinates, {
                color: colors[type],
                weight: 4,
                opacity: 0.7,
                dashArray: route.estimated ? '10, 10' : null
            }).addTo(this.routeLayer);
        });

        // Fit map to show all markers and routes
        this.fitBounds();
    },

    /**
     * Fit map bounds to show all markers
     */
    fitBounds() {
        const bounds = L.latLngBounds([]);
        
        if (this.userMarker) {
            bounds.extend(this.userMarker.getLatLng());
        }

        this.facilityMarkers.forEach(marker => {
            bounds.extend(marker.getLatLng());
        });

        if (bounds.isValid()) {
            this.map.fitBounds(bounds, { padding: [50, 50] });
        }
    },

    /**
     * Clear facility markers
     */
    clearFacilityMarkers() {
        this.facilityMarkers.forEach(marker => {
            this.map.removeLayer(marker);
        });
        this.facilityMarkers = [];
    },

    /**
     * Clear routes
     */
    clearRoutes() {
        if (this.routeLayer) {
            this.map.removeLayer(this.routeLayer);
            this.routeLayer = null;
        }
    },

    /**
     * Format facility type for display
     * @param {string} type - Facility type
     * @returns {string} Formatted type
     */
    formatFacilityType(type) {
        const types = {
            fire_station: 'Fire Station',
            ambulance_station: 'Ambulance Station',
            hospital: 'Hospital'
        };
        return types[type] || type;
    },

    /**
     * Get user's current location using browser geolocation
     * @returns {Promise<object>} User coordinates
     */
    async getUserLocation() {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                reject(new Error('Geolocation not supported'));
                return;
            }

            navigator.geolocation.getCurrentPosition(
                (position) => {
                    resolve({
                        lat: position.coords.latitude,
                        lon: position.coords.longitude
                    });
                },
                (error) => {
                    reject(error);
                },
                {
                    enableHighAccuracy: true,
                    timeout: 5000,
                    maximumAge: 0
                }
            );
        });
    }
};
