/**
 * Facilities Data Management
 * Loads and queries emergency facility data from GeoJSON
 */

const FacilitiesManager = {
    facilities: null,
    loaded: false,

    /**
     * Load facility data from GeoJSON file
     */
    async loadFacilities() {
        try {
            const response = await fetch('data/ontario-facilities.geojson');
            if (!response.ok) {
                throw new Error('Failed to load facilities data');
            }
            const data = await response.json();
            this.facilities = data.features;
            this.loaded = true;
            console.log(`Loaded ${this.facilities.length} facilities`);
            return this.facilities;
        } catch (error) {
            console.error('Error loading facilities:', error);
            // Return empty array as fallback
            this.facilities = [];
            this.loaded = true;
            return this.facilities;
        }
    },

    /**
     * Get facilities by type
     * @param {string} type - Facility type (fire_station, hospital, ambulance_station)
     */
    getFacilitiesByType(type) {
        if (!this.loaded) {
            console.error('Facilities not loaded yet');
            return [];
        }
        return this.facilities.filter(f => f.properties.type === type);
    },

    /**
     * Calculate distance between two points using Haversine formula
     * @param {number} lat1 - Latitude of point 1
     * @param {number} lon1 - Longitude of point 1
     * @param {number} lat2 - Latitude of point 2
     * @param {number} lon2 - Longitude of point 2
     * @returns {number} Distance in kilometers
     */
    calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371; // Earth's radius in km
        const dLat = this.toRad(lat2 - lat1);
        const dLon = this.toRad(lon2 - lon1);
        const a = 
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    },

    toRad(degrees) {
        return degrees * (Math.PI / 180);
    },

    /**
     * Find nearest facility of a given type to a location
     * @param {number} lat - User latitude
     * @param {number} lon - User longitude
     * @param {string} type - Facility type
     * @returns {object} Nearest facility with distance
     */
    findNearestFacility(lat, lon, type) {
        const facilities = this.getFacilitiesByType(type);
        if (facilities.length === 0) {
            return null;
        }

        let nearest = null;
        let minDistance = Infinity;

        facilities.forEach(facility => {
            const coords = facility.geometry.coordinates;
            // GeoJSON uses [lon, lat] format
            const facilityLon = coords[0];
            const facilityLat = coords[1];
            const distance = this.calculateDistance(lat, lon, facilityLat, facilityLon);

            if (distance < minDistance) {
                minDistance = distance;
                nearest = {
                    ...facility,
                    distance: distance,
                    lat: facilityLat,
                    lon: facilityLon
                };
            }
        });

        return nearest;
    },

    /**
     * Find all nearest facilities for each type
     * @param {number} lat - User latitude
     * @param {number} lon - User longitude
     * @returns {object} Object with nearest fire station, ambulance, and hospital
     */
    findAllNearestFacilities(lat, lon) {
        return {
            fire_station: this.findNearestFacility(lat, lon, 'fire_station'),
            ambulance_station: this.findNearestFacility(lat, lon, 'ambulance_station'),
            hospital: this.findNearestFacility(lat, lon, 'hospital')
        };
    },

    /**
     * Get all facilities for map display
     */
    getAllFacilities() {
        return this.facilities || [];
    }
};
