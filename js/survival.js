/**
 * Survivability Calculator
 * Calculates cardiac arrest survival probability based on response time
 */

const SurvivalCalculator = {
    baselineSurvival: 80, // 80% with immediate AED access
    minSurvival: 5, // Minimum 5% survival rate
    declineRate: 10, // 10% decline per minute

    /**
     * Calculate survival rate based on response time
     * @param {number} minutes - Response time in minutes
     * @returns {number} Survival rate as percentage
     */
    calculateSurvivalRate(minutes) {
        const survival = this.baselineSurvival - (minutes * this.declineRate);
        return Math.max(this.minSurvival, survival);
    },

    /**
     * Calculate survival reduction from baseline
     * @param {number} minutes - Response time in minutes
     * @returns {object} Survival rate and reduction
     */
    calculateSurvivalReduction(minutes) {
        const survivalRate = this.calculateSurvivalRate(minutes);
        const reduction = this.baselineSurvival - survivalRate;
        const reductionPercent = (reduction / this.baselineSurvival) * 100;

        return {
            survivalRate: survivalRate,
            reduction: reduction,
            reductionPercent: reductionPercent,
            minutes: minutes
        };
    },

    /**
     * Calculate survival statistics for all facilities
     * @param {object} routes - Routes to each facility type
     * @returns {object} Survival statistics for each facility
     */
    calculateAllSurvivalStats(routes) {
        const stats = {};

        const facilityTypes = [
            { key: 'fire_station', label: 'Fire Station' },
            { key: 'ambulance_station', label: 'Ambulance Station' },
            { key: 'hospital', label: 'Hospital' }
        ];

        facilityTypes.forEach(({ key, label }) => {
            if (routes[key]) {
                const minutes = routes[key].duration;
                stats[key] = {
                    ...this.calculateSurvivalReduction(minutes),
                    label: label,
                    urgency: this.getUrgencyLevel(minutes)
                };
            }
        });

        return stats;
    },

    /**
     * Get urgency level based on response time
     * @param {number} minutes - Response time in minutes
     * @returns {string} Urgency level: 'green', 'yellow', or 'red'
     */
    getUrgencyLevel(minutes) {
        if (minutes < 5) return 'green';
        if (minutes < 10) return 'yellow';
        return 'red';
    },

    /**
     * Get survival rate category
     * @param {number} survivalRate - Survival rate percentage
     * @returns {string} Category: 'high', 'medium', or 'low'
     */
    getSurvivalCategory(survivalRate) {
        if (survivalRate >= 60) return 'high';
        if (survivalRate >= 30) return 'medium';
        return 'low';
    },

    /**
     * Format survival data for display
     * @param {object} stats - Survival statistics
     * @returns {object} Formatted data for UI
     */
    formatForDisplay(stats) {
        const formatted = {};

        Object.keys(stats).forEach(key => {
            const stat = stats[key];
            formatted[key] = {
                survivalRate: `${stat.survivalRate.toFixed(1)}%`,
                reduction: `${stat.reduction.toFixed(1)}%`,
                reductionPercent: `${stat.reductionPercent.toFixed(0)}%`,
                minutes: stat.minutes.toFixed(1),
                urgency: stat.urgency,
                category: this.getSurvivalCategory(stat.survivalRate),
                label: stat.label,
                numericSurvival: stat.survivalRate
            };
        });

        return formatted;
    },

    /**
     * Generate comparison data for chart
     * @param {object} stats - Survival statistics
     * @returns {Array} Array of comparison data
     */
    generateComparisonData(stats) {
        const comparison = [
            {
                label: 'Baseline (Immediate AED)',
                survivalRate: this.baselineSurvival,
                minutes: 0,
                color: '#28a745',
                class: 'baseline'
            }
        ];

        const order = ['fire_station', 'ambulance_station', 'hospital'];
        const icons = {
            fire_station: '🚒',
            ambulance_station: '🚑',
            hospital: '🏥'
        };

        order.forEach(key => {
            if (stats[key]) {
                const stat = stats[key];
                comparison.push({
                    label: `${icons[key]} ${stat.label}`,
                    survivalRate: stat.numericSurvival,
                    minutes: parseFloat(stat.minutes),
                    reduction: stat.reduction,
                    color: this.getColorByUrgency(stat.urgency),
                    class: key.replace('_', '')
                });
            }
        });

        return comparison;
    },

    /**
     * Get color based on urgency level
     * @param {string} urgency - Urgency level
     * @returns {string} Color code
     */
    getColorByUrgency(urgency) {
        const colors = {
            green: '#28a745',
            yellow: '#ffc107',
            red: '#dc3545'
        };
        return colors[urgency] || '#6c757d';
    }
};
