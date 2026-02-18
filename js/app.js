/**
 * Main Application Controller
 * Coordinates all modules and handles user interactions
 */

window.App = {
    selectedLocation: null,
    autocompleteTimeout: null,

    /**
     * Initialize application
     */
    async init() {
        console.log('Initializing AED Risk Assessment Tool...');

        // Initialize map
        MapManager.initMap();

        // Load facility data
        await FacilitiesManager.loadFacilities();

        // Set up event listeners
        this.setupEventListeners();

        console.log('Application ready');
    },

    /**
     * Set up event listeners
     */
    setupEventListeners() {
        // Address input with autocomplete
        const addressInput = document.getElementById('address-input');
        addressInput.addEventListener('input', (e) => {
            this.handleAddressInput(e.target.value);
        });

        // Current location button
        const locationBtn = document.getElementById('current-location-btn');
        locationBtn.addEventListener('click', () => {
            this.handleCurrentLocation();
        });

        // Close autocomplete when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.input-group')) {
                this.hideAutocomplete();
            }
        });
    },

    /**
     * Handle address input with autocomplete
     */
    handleAddressInput(query) {
        clearTimeout(this.autocompleteTimeout);

        if (query.length < 3) {
            this.hideAutocomplete();
            return;
        }

        this.autocompleteTimeout = setTimeout(async () => {
            const results = await GeocodingService.searchAddress(query);
            this.showAutocompleteResults(results);
        }, 300);
    },

    /**
     * Show autocomplete results
     */
    showAutocompleteResults(results) {
        const container = document.getElementById('autocomplete-results');
        container.innerHTML = '';

        if (results.length === 0) {
            container.classList.remove('show');
            return;
        }

        results.forEach(result => {
            const item = document.createElement('div');
            item.className = 'autocomplete-item';
            item.textContent = result.display_name;
            item.addEventListener('click', () => {
                this.selectAutocompleteResult(result);
            });
            container.appendChild(item);
        });

        container.classList.add('show');
    },

    /**
     * Hide autocomplete results
     */
    hideAutocomplete() {
        const container = document.getElementById('autocomplete-results');
        container.classList.remove('show');
    },

    /**
     * Select autocomplete result
     */
    selectAutocompleteResult(result) {
        document.getElementById('address-input').value = result.display_name;
        this.hideAutocomplete();
        this.onLocationSelected(result.lat, result.lon, result.display_name);
    },

    /**
     * Handle current location button
     */
    async handleCurrentLocation() {
        try {
            this.showLoading();
            const location = await MapManager.getUserLocation();
            const address = await GeocodingService.reverseGeocode(location.lat, location.lon);
            document.getElementById('address-input').value = address.display_name;
            await this.onLocationSelected(location.lat, location.lon, address.display_name);
        } catch (error) {
            console.error('Error getting location:', error);
            alert('Unable to get your current location. Please enter an address or click on the map.');
        } finally {
            this.hideLoading();
        }
    },

    /**
     * Handle location selection (from map click, address search, or current location)
     */
    async onLocationSelected(lat, lon, displayName = null) {
        try {
            this.showLoading();

            // Store selected location
            this.selectedLocation = { lat, lon };

            // Update map marker
            MapManager.setUserMarker(lat, lon);

            // Get display name if not provided
            if (!displayName) {
                const address = await GeocodingService.reverseGeocode(lat, lon);
                displayName = address.display_name;
                document.getElementById('address-input').value = displayName;
            }

            // Find nearest facilities
            const nearestFacilities = FacilitiesManager.findAllNearestFacilities(lat, lon);

            // Calculate routes
            const routes = await RoutingService.calculateAllRoutes(lat, lon, nearestFacilities);

            // Calculate survival statistics
            const survivalStats = SurvivalCalculator.calculateAllSurvivalStats(routes);

            // Update map
            MapManager.addFacilityMarkers(nearestFacilities);
            MapManager.drawRoutes(routes);

            // Display results
            this.displayResults(displayName, nearestFacilities, routes, survivalStats);

        } catch (error) {
            console.error('Error processing location:', error);
            alert('Error calculating routes. Please try again.');
        } finally {
            this.hideLoading();
        }
    },

    /**
     * Display results
     */
    displayResults(address, facilities, routes, survivalStats) {
        // Show results panel
        const resultsPanel = document.getElementById('results-panel');
        resultsPanel.classList.remove('hidden');

        // Set selected address
        document.getElementById('selected-address').textContent = address;

        // Format survival data
        const formattedStats = SurvivalCalculator.formatForDisplay(survivalStats);

        // Update facility cards
        this.updateFacilityCard('fire', facilities.fire_station, routes.fire_station, formattedStats.fire_station);
        this.updateFacilityCard('ambulance', facilities.ambulance_station, routes.ambulance_station, formattedStats.ambulance_station);
        this.updateFacilityCard('hospital', facilities.hospital, routes.hospital, formattedStats.hospital);

        // Update survival comparison chart
        this.updateSurvivalChart(formattedStats);

        // Scroll to results
        resultsPanel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    },

    /**
     * Update facility card
     */
    updateFacilityCard(prefix, facility, route, stats) {
        if (!facility || !route || !stats) {
            return;
        }

        const name = facility.properties.name || 'Unknown';
        document.getElementById(`${prefix}-name`).textContent = name;
        document.getElementById(`${prefix}-distance`).textContent = `${route.distance.toFixed(2)} km`;
        document.getElementById(`${prefix}-time`).textContent = `${stats.minutes} min`;
        
        const survivalElement = document.getElementById(`${prefix}-survival`);
        survivalElement.textContent = stats.survivalRate;
        survivalElement.className = `survival-rate ${stats.category}`;

        const badge = document.getElementById(`${prefix}-time-badge`);
        badge.textContent = `${stats.minutes} min`;
        badge.className = `time-badge ${stats.urgency}`;
    },

    /**
     * Update survival comparison chart
     */
    updateSurvivalChart(stats) {
        const chartContainer = document.getElementById('survival-chart');
        chartContainer.innerHTML = '';

        const comparisonData = SurvivalCalculator.generateComparisonData(stats);

        comparisonData.forEach(item => {
            const barDiv = document.createElement('div');
            barDiv.className = `survival-bar ${item.class}`;

            const widthPercent = (item.survivalRate / 80) * 100; // Relative to baseline

            barDiv.innerHTML = `
                <div class="survival-bar-label">${item.label}</div>
                <div class="survival-bar-visual">
                    <div class="survival-bar-fill" style="width: ${widthPercent}%; background: ${item.color};">
                        ${item.survivalRate >= 20 ? item.survivalRate.toFixed(0) + '%' : ''}
                    </div>
                </div>
                <div class="survival-bar-value">
                    ${item.survivalRate.toFixed(0)}%
                    ${item.reduction ? `<div class="reduction-text">(-${item.reduction})</div>` : ''}
                </div>
            `;

            chartContainer.appendChild(barDiv);
        });
    },

    /**
     * Show loading indicator
     */
    showLoading() {
        document.getElementById('loading-indicator').classList.remove('hidden');
        document.getElementById('results-panel').classList.add('hidden');
    },

    /**
     * Hide loading indicator
     */
    hideLoading() {
        document.getElementById('loading-indicator').classList.add('hidden');
    }
};

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.App.init();
    });
} else {
    window.App.init();
}
