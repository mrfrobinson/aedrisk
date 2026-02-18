#!/bin/bash
# Fetch Ontario emergency facilities from OpenStreetMap Overpass API

echo "Fetching Ontario emergency facilities from OpenStreetMap..."

# Overpass API endpoint
OVERPASS_URL="https://overpass-api.de/api/interpreter"

# Query for Ontario facilities
# Using a simplified bounding box for Ontario: [41.7,-95.2,56.9,-74.3]
read -r -d '' QUERY << 'OVERPASS'
[out:json][timeout:180];
// Ontario bounding box
(
  // Fire stations
  node["amenity"="fire_station"](41.7,-95.2,56.9,-74.3);
  way["amenity"="fire_station"](41.7,-95.2,56.9,-74.3);
  relation["amenity"="fire_station"](41.7,-95.2,56.9,-74.3);
  
  // Ambulance stations
  node["amenity"="ambulance_station"](41.7,-95.2,56.9,-74.3);
  way["amenity"="ambulance_station"](41.7,-95.2,56.9,-74.3);
  
  // Hospitals
  node["amenity"="hospital"](41.7,-95.2,56.9,-74.3);
  way["amenity"="hospital"](41.7,-95.2,56.9,-74.3);
  relation["amenity"="hospital"](41.7,-95.2,56.9,-74.3);
);
out center;
OVERPASS

# Fetch data
echo "Downloading data from Overpass API..."
curl -X POST "$OVERPASS_URL" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  --data-urlencode "data=$QUERY" \
  -o /tmp/overpass_result.json

# Convert to GeoJSON and process
echo "Converting to GeoJSON format..."
python3 << 'PYTHON'
import json
import sys

try:
    with open('/tmp/overpass_result.json', 'r') as f:
        data = json.load(f)
    
    # Convert to GeoJSON
    geojson = {
        "type": "FeatureCollection",
        "features": []
    }
    
    for element in data.get('elements', []):
        # Get coordinates
        if 'lat' in element and 'lon' in element:
            lat, lon = element['lat'], element['lon']
        elif 'center' in element:
            lat, lon = element['center']['lat'], element['center']['lon']
        else:
            continue
        
        # Get amenity type
        amenity = element.get('tags', {}).get('amenity', 'unknown')
        name = element.get('tags', {}).get('name', 'Unnamed Facility')
        
        # Create feature
        feature = {
            "type": "Feature",
            "geometry": {
                "type": "Point",
                "coordinates": [lon, lat]
            },
            "properties": {
                "type": amenity,
                "name": name,
                "id": element.get('id')
            }
        }
        
        # Add address if available
        tags = element.get('tags', {})
        if 'addr:street' in tags or 'addr:city' in tags:
            address_parts = []
            if 'addr:housenumber' in tags:
                address_parts.append(tags['addr:housenumber'])
            if 'addr:street' in tags:
                address_parts.append(tags['addr:street'])
            if 'addr:city' in tags:
                address_parts.append(tags['addr:city'])
            if 'addr:postcode' in tags:
                address_parts.append(tags['addr:postcode'])
            feature['properties']['address'] = ', '.join(address_parts)
        
        geojson['features'].append(feature)
    
    # Save to file
    with open('data/ontario-facilities.geojson', 'w') as f:
        json.dump(geojson, f, indent=2)
    
    print(f"Successfully converted {len(geojson['features'])} facilities to GeoJSON")
    print(f"  Fire stations: {sum(1 for f in geojson['features'] if f['properties']['type'] == 'fire_station')}")
    print(f"  Ambulance stations: {sum(1 for f in geojson['features'] if f['properties']['type'] == 'ambulance_station')}")
    print(f"  Hospitals: {sum(1 for f in geojson['features'] if f['properties']['type'] == 'hospital')}")

except Exception as e:
    print(f"Error: {e}", file=sys.stderr)
    sys.exit(1)
PYTHON

if [ $? -eq 0 ]; then
    echo "Facility data successfully saved to data/ontario-facilities.geojson"
    rm /tmp/overpass_result.json
else
    echo "Error processing facility data"
    exit 1
fi
