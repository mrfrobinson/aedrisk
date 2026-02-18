/**
 * Geocoding Module
 * Handles address search and coordinate conversion using Nominatim
 */

const GeocodingService = {
    baseUrl: 'https://nominatim.openstreetmap.org',
    
    /**
     * Search for addresses
     * @param {string} query - Search query
     * @returns {Promise<Array>} Array of search results
     */
    async searchAddress(query) {
        if (!query || query.length < 3) {
            return [];
        }

        try {
            const url = `${this.baseUrl}/search?` + new URLSearchParams({
                q: query,
                format: 'json',
                countrycodes: 'ca', // Limit to Canada
                viewbox: '-95.2,41.7,-74.3,56.9', // Ontario bounding box (roughly)
                bounded: 1,
                limit: 5,
                addressdetails: 1
            });

            const response = await fetch(url, {
                headers: {
                    'User-Agent': 'AEDRiskAssessment/1.0'
                }
            });

            if (!response.ok) {
                throw new Error('Geocoding request failed');
            }

            const results = await response.json();
            return results.map(result => ({
                display_name: result.display_name,
                lat: parseFloat(result.lat),
                lon: parseFloat(result.lon),
                address: result.address
            }));
        } catch (error) {
            console.error('Geocoding error:', error);
            return [];
        }
    },

    /**
     * Reverse geocode - convert coordinates to address
     * @param {number} lat - Latitude
     * @param {number} lon - Longitude
     * @returns {Promise<object>} Address information
     */
    async reverseGeocode(lat, lon) {
        try {
            const url = `${this.baseUrl}/reverse?` + new URLSearchParams({
                lat: lat,
                lon: lon,
                format: 'json',
                addressdetails: 1
            });

            const response = await fetch(url, {
                headers: {
                    'User-Agent': 'AEDRiskAssessment/1.0'
                }
            });

            if (!response.ok) {
                throw new Error('Reverse geocoding failed');
            }

            const result = await response.json();
            return {
                display_name: result.display_name,
                address: result.address
            };
        } catch (error) {
            console.error('Reverse geocoding error:', error);
            return {
                display_name: `${lat.toFixed(5)}, ${lon.toFixed(5)}`,
                address: {}
            };
        }
    }
};
