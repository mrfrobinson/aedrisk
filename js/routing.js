/**
 * Routing Module
 * Handles route calculation with custom speed profiles for cottage roads
 */

const RoutingService = {
    baseUrl: 'https://router.project-osrm.org',
    
    /**
     * Calculate route between two points
     * @param {number} fromLat - Start latitude
     * @param {number} fromLon - Start longitude
     * @param {number} toLat - End latitude
     * @param {number} toLon - End longitude
     * @returns {Promise<object>} Route information with distance and time
     */
    async calculateRoute(fromLat, fromLon, toLat, toLon) {
        try {
            const url = `${this.baseUrl}/route/v1/driving/${fromLon},${fromLat};${toLon},${toLat}?` + 
                new URLSearchParams({
                    overview: 'full',
                    geometries: 'geojson',
                    steps: true,
                    annotations: true
                });

            const response = await fetch(url);
            if (!response.ok) {
                throw new Error('Routing request failed');
            }

            const data = await response.json();
            
            if (data.code !== 'Ok' || !data.routes || data.routes.length === 0) {
                throw new Error('No route found');
            }

            const route = data.routes[0];
            
            // Apply custom speed profile adjustments for cottage roads
            const adjustedTime = this.adjustTravelTimeForCottageRoads(route);
            
            return {
                distance: route.distance / 1000, // Convert to km
                duration: adjustedTime / 60, // Convert to minutes
                geometry: route.geometry,
                legs: route.legs
            };
        } catch (error) {
            console.error('Routing error:', error);
            // Fallback to straight-line distance estimation
            return this.estimateRoute(fromLat, fromLon, toLat, toLon);
        }
    },

    /**
     * Adjust travel time based on road types (cottage roads slower)
     * @param {object} route - OSRM route object
     * @returns {number} Adjusted duration in seconds
     */
    adjustTravelTimeForCottageRoads(route) {
        // Default OSRM time
        let baseDuration = route.duration;
        
        // Check if we have step information
        if (!route.legs || !route.legs[0] || !route.legs[0].steps) {
            // Add 30% buffer for cottage roads (conservative estimate)
            return baseDuration * 1.3;
        }

        let adjustedDuration = 0;
        
        route.legs.forEach(leg => {
            leg.steps.forEach(step => {
                const distance = step.distance; // meters
                const roadType = step.name || '';
                
                // Identify cottage roads by typical characteristics
                // In absence of detailed OSM data, we use conservative adjustments
                const isCottageRoad = this.isCottageRoad(step);
                
                if (isCottageRoad) {
                    // Cottage roads: 20 km/h = 20000 m/h = 5.56 m/s
                    const cottageSpeed = 5.56; // m/s
                    adjustedDuration += distance / cottageSpeed;
                } else {
                    // Use original timing
                    adjustedDuration += step.duration;
                }
            });
        });

        // Return adjusted duration with minimum 30% increase for rural areas
        return Math.max(adjustedDuration, baseDuration * 1.3);
    },

    /**
     * Determine if a road segment is likely a cottage road
     * @param {object} step - Route step
     * @returns {boolean} True if likely a cottage road
     */
    isCottageRoad(step) {
        const name = (step.name || '').toLowerCase();
        
        // Keywords indicating cottage/rural roads
        const cottageIndicators = [
            'cottage', 'lake', 'beach', 'shore', 'island',
            'private', 'seasonal', 'unpaved', 'gravel'
        ];
        
        // Check if road name contains cottage indicators
        const hasCottageKeyword = cottageIndicators.some(keyword => 
            name.includes(keyword)
        );
        
        // Short unnamed roads in rural areas are likely cottage roads
        const isUnnamedShort = (!name || name === '') && step.distance < 2000;
        
        return hasCottageKeyword || isUnnamedShort;
    },

    /**
     * Estimate route using straight-line distance (fallback)
     * @param {number} fromLat - Start latitude
     * @param {number} fromLon - Start longitude
     * @param {number} toLat - End latitude
     * @param {number} toLon - End longitude
     * @returns {object} Estimated route information
     */
    estimateRoute(fromLat, fromLon, toLat, toLon) {
        // Calculate straight-line distance
        const R = 6371; // Earth radius in km
        const dLat = this.toRad(toLat - fromLat);
        const dLon = this.toRad(toLon - fromLon);
        const a = 
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(this.toRad(fromLat)) * Math.cos(this.toRad(toLat)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = R * c;

        // Estimate: road distance ~1.3x straight line, average speed 40 km/h for rural areas
        const roadDistance = distance * 1.3;
        const duration = (roadDistance / 40) * 60; // minutes

        return {
            distance: roadDistance,
            duration: duration,
            geometry: {
                type: 'LineString',
                coordinates: [
                    [fromLon, fromLat],
                    [toLon, toLat]
                ]
            },
            estimated: true
        };
    },

    toRad(degrees) {
        return degrees * (Math.PI / 180);
    },

    /**
     * Calculate routes to all nearest facilities
     * @param {number} lat - User latitude
     * @param {number} lon - User longitude
     * @param {object} facilities - Object with nearest facilities
     * @returns {Promise<object>} Routes to each facility
     */
    async calculateAllRoutes(lat, lon, facilities) {
        const routes = {};

        // Calculate routes in parallel
        const promises = [];
        const types = ['fire_station', 'ambulance_station', 'hospital'];

        types.forEach(type => {
            if (facilities[type]) {
                const facility = facilities[type];
                promises.push(
                    this.calculateRoute(lat, lon, facility.lat, facility.lon)
                        .then(route => {
                            routes[type] = route;
                        })
                );
            }
        });

        await Promise.all(promises);
        return routes;
    }
};
