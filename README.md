# AED Risk Assessment Tool

A comprehensive web application for calculating emergency response times and cardiac arrest survivability based on distance to emergency facilities in Ontario, Canada.

## Overview

This tool allows users to:
- Enter an address or drop a pin on an interactive map
- Calculate distances and travel times to the nearest emergency facilities (fire stations, ambulance stations, hospitals)
- View estimated cardiac arrest survival rates based on response times
- Understand the impact of delayed AED access on survival probability

### Available Pages

1. **index.html** - Full interactive application
   - Requires external CDN access (Leaflet.js)
   - Requires API access (Nominatim, OSRM)
   - Full real-time routing and geocoding
   
2. **demo.html** - Demonstration with sample data
   - Works without external dependencies
   - Shows complete UI and features
   - Uses static sample data
   - Best for testing and demonstration
   
3. **embed.html** - Iframe embedding example
   - Shows how to embed the tool
   - Provides embed code examples

## Features

### Interactive Map Interface
- **Leaflet.js-based** map centered on Ontario, Canada
- **Address search** functionality using Nominatim geocoding
- **Pin dropping** capability - click anywhere on the map
- **Responsive design** optimized for iframe embedding
- Visual markers for user location and emergency facilities

### Routing & Distance Calculation
- Calculates routes to nearest fire station, ambulance station, and hospital
- Uses **OSRM** (Open Source Routing Machine) for route calculation
- **Custom speed profiles** for cottage roads (20 km/h) and regular roads
- Displays both distance (km) and estimated travel time (minutes)
- Route visualization on map

### Emergency Facility Data
- Comprehensive coverage of Ontario emergency facilities
- Data includes:
  - Fire stations
  - Ambulance stations
  - Hospitals
- Stored in GeoJSON format for efficient querying
- Facility information includes name, type, and address

### Survivability Calculator
Based on cardiac arrest survival research:
- **Baseline**: 70-90% survival with immediate AED access (0-3 minutes)
- **Decline rate**: ~10% per minute without defibrillation
- **Minimum**: 5-10% survival after 10 minutes

**Formula**: `Survival Rate = Max(5%, 80% - (delay_minutes * 10%))`

Visual comparison shows:
- Baseline (immediate AED): 80% survival
- Fire department response time: Adjusted survival rate
- Ambulance response time: Adjusted survival rate
- Drive to hospital: Adjusted survival rate
- Clear indication of survival reduction percentage

### User Interface
- Clean, professional design
- Color-coded urgency indicators:
  - **Green**: < 5 minute response time
  - **Yellow**: 5-10 minute response time
  - **Red**: > 10 minute response time
- Mobile-responsive layout
- Accessibility-focused design
- Clear disclaimers about estimated vs. actual response times

## Technical Stack

### Frontend
- **Vanilla JavaScript** (ES6+) - No build process required
- **Leaflet.js 1.9.4** - Interactive maps
- **CSS3** - Responsive styling

### APIs & Services
- **Nominatim** - Address geocoding (OpenStreetMap)
- **OSRM** - Route calculation and directions
- **OpenStreetMap** - Facility data source

### Server Requirements
- **LAMP stack** compatible (Linux, Apache, MySQL optional, PHP optional)
- Static file hosting sufficient for basic deployment
- No database required (facilities stored in GeoJSON file)

## File Structure

```
/
├── index.html                    # Main application entry point
├── embed.html                    # Iframe embed example
├── css/
│   └── styles.css               # All styles, responsive design
├── js/
│   ├── app.js                   # Main application controller
│   ├── map.js                   # Map initialization and controls
│   ├── geocoding.js             # Address search functionality
│   ├── routing.js               # Route calculation with custom speeds
│   ├── facilities.js            # Facility data loading and queries
│   └── survival.js              # Survivability calculations
├── data/
│   └── ontario-facilities.geojson  # Emergency facility locations
├── assets/
│   └── icons/                   # Map markers and UI icons (future)
└── README.md                    # This file
```

## Installation & Setup

### Quick Start

For a quick demonstration without external dependencies:
```bash
# Clone repository
git clone https://github.com/mrfrobinson/aedrisk.git
cd aedrisk

# Start local server
python3 -m http.server 8000

# Open demo page in browser
# http://localhost:8000/demo.html
```

The **demo.html** page shows the complete UI with sample data and doesn't require external API access.

### Basic Setup (Static Hosting)

1. **Clone or download** this repository to your web server:
   ```bash
   git clone https://github.com/mrfrobinson/aedrisk.git
   cd aedrisk
   ```

2. **Configure web server** to serve static files:
   ```bash
   # For Apache, ensure .htaccess allows:
   # - CORS headers (if embedding cross-domain)
   # - Proper MIME types for .geojson files
   ```

3. **Open in browser**:
   ```
   http://yourdomain.com/aedrisk/
   ```
   
   **Note**: The full application (index.html) requires:
   - Internet access for Leaflet.js CDN
   - Access to Nominatim API for geocoding
   - Access to OSRM API for routing
   
   If these are not available, use **demo.html** for demonstration purposes.

### Development Setup

1. **Local development server** (Python):
   ```bash
   python3 -m http.server 8000
   ```
   Then open: `http://localhost:8000`

2. **Or use PHP built-in server**:
   ```bash
   php -S localhost:8000
   ```

### Updating Facility Data

The facility data is stored in `data/ontario-facilities.geojson`. To update:

1. **Option 1: Fetch from OpenStreetMap** (requires internet access):
   ```bash
   ./fetch_facilities.sh
   ```

2. **Option 2: Manual update**:
   - Edit `data/ontario-facilities.geojson`
   - Follow GeoJSON format
   - Ensure each facility has:
     - `type`: "fire_station", "ambulance_station", or "hospital"
     - `name`: Facility name
     - `coordinates`: [longitude, latitude]

## Embedding the Application

### Basic Iframe Embed

```html
<iframe 
  src="https://yourdomain.com/aedrisk/" 
  width="100%" 
  height="800px" 
  frameborder="0"
  title="AED Risk Assessment Tool">
</iframe>
```

### Responsive Embed (Maintains Aspect Ratio)

```html
<div style="position: relative; padding-bottom: 75%; height: 0; overflow: hidden;">
  <iframe 
    src="https://yourdomain.com/aedrisk/" 
    style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: 0;" 
    title="AED Risk Assessment Tool">
  </iframe>
</div>
```

### Custom Styling

Add CSS to your parent page:
```css
.aedrisk-embed {
  max-width: 1200px;
  margin: 0 auto;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  border-radius: 8px;
  overflow: hidden;
}
```

## Usage

### For End Users

1. **Search by address**:
   - Type an address in the search box
   - Select from autocomplete suggestions
   - Map will center on the location

2. **Drop a pin**:
   - Click anywhere on the map
   - Application will find nearest facilities
   - Results will display automatically

3. **Use current location**:
   - Click "Use My Location" button
   - Grant browser location permission
   - Application will use your GPS coordinates

4. **View results**:
   - Distances to each facility type
   - Estimated travel times
   - Survival probability for each scenario
   - Visual comparison chart

### For Developers

#### Customizing Speed Profiles

Edit `js/routing.js`, function `adjustTravelTimeForCottageRoads()`:
```javascript
// Adjust cottage road speed (default: 20 km/h)
const cottageSpeed = 5.56; // m/s (20 km/h)

// Modify road type detection
isCottageRoad(step) {
  // Add custom logic
}
```

#### Customizing Survival Calculations

Edit `js/survival.js`, `SurvivalCalculator` object:
```javascript
baselineSurvival: 80,  // Change baseline %
minSurvival: 5,        // Change minimum %
declineRate: 10        // Change decline rate per minute
```

#### Adding More Facility Types

1. Add to GeoJSON with new `type` value
2. Update `js/facilities.js` to handle new type
3. Add UI elements in `index.html`
4. Update styling in `css/styles.css`

## Data Sources

- **Emergency Facilities**: OpenStreetMap (© OpenStreetMap contributors)
- **Geocoding**: Nominatim / OpenStreetMap
- **Routing**: OSRM (Open Source Routing Machine)
- **Maps**: OpenStreetMap tiles

## Scientific Basis

### Cardiac Arrest Survival Research

The survival calculations are based on established cardiac arrest research:

1. **Immediate defibrillation** (0-3 minutes): 70-90% survival rate
2. **Time-dependent decline**: ~10% reduction per minute without AED
3. **Critical window**: First 10 minutes are most crucial
4. **Post-10 minutes**: Survival drops to 5-10%

**References**:
- American Heart Association Guidelines
- Resuscitation Council UK Guidelines
- Canadian Heart & Stroke Foundation

**Important Note**: These are statistical estimates for educational purposes. Actual survival rates depend on many factors including:
- Bystander CPR
- Quality of emergency response
- Patient health factors
- Environmental conditions

## Disclaimers

⚠️ **Important Disclaimers**:

1. **Estimates Only**: Travel times and routes are estimates based on map data and may not reflect actual emergency response times.

2. **Not for Emergency Use**: This tool is for educational and planning purposes only. In an emergency, always call 911 immediately.

3. **Response Time Variability**: Actual emergency response times vary based on:
   - Current traffic conditions
   - Weather
   - Ambulance/fire truck availability
   - Priority of other calls
   - Road conditions

4. **Data Currency**: Facility locations are based on OpenStreetMap data and may not be current. Always verify facility information independently.

5. **Medical Disclaimer**: Survival statistics are based on research averages and do not predict individual outcomes.

## Browser Compatibility

- **Chrome/Edge**: Fully supported (latest 2 versions)
- **Firefox**: Fully supported (latest 2 versions)
- **Safari**: Fully supported (latest 2 versions)
- **Mobile browsers**: Responsive design supports iOS Safari and Chrome

**Requirements**:
- JavaScript enabled
- Geolocation API (optional, for "Use My Location")
- Modern CSS support (flexbox, grid)

## Performance Considerations

- **Initial load**: ~2-3 seconds (includes map tiles and facility data)
- **Route calculation**: ~1-2 seconds per query
- **Facility data**: ~45 KB GeoJSON file (cached by browser)
- **Offline use**: Not supported (requires APIs for routing and geocoding)

## Troubleshooting

### Map doesn't load
- Check browser console for errors
- Verify Leaflet.js CDN is accessible
- Ensure JavaScript is enabled

### Address search not working
- Nominatim API may have rate limits
- Check network connectivity
- Try using map click instead

### Routes not calculating
- OSRM API may be temporarily unavailable
- Falls back to straight-line distance estimation
- Check browser console for error messages

### Facility data not loading
- Verify `data/ontario-facilities.geojson` exists
- Check file permissions
- Verify JSON format is valid

## Future Enhancements

Potential improvements for future versions:

- [ ] Save/export results as PDF
- [ ] Historical data comparison
- [ ] Integration with real-time traffic
- [ ] Custom facility addition
- [ ] Multi-language support
- [ ] Offline mode with service workers
- [ ] Admin panel for facility management
- [ ] API for programmatic access

## Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

[Add your license information here]

## Contact

For questions, issues, or suggestions:
- GitHub Issues: [Create an issue](https://github.com/mrfrobinson/aedrisk/issues)
- Email: [Your contact email]

## Acknowledgments

- OpenStreetMap contributors for facility data
- Leaflet.js team for mapping library
- OSRM project for routing engine
- Cardiac arrest research community

---

**Version**: 1.0.0  
**Last Updated**: 2024  
**Maintained by**: [Your name/organization]
