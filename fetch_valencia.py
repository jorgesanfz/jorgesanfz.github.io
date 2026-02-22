import urllib.request
import json
import os

query = """
[out:json];
(
  way["building"](39.455,-0.395,39.485,-0.355);
);
out body;
>;
out skel qt;
"""

print("Fetching Valencia buildings from Overpass API...")
url = "https://overpass-api.de/api/interpreter"
req = urllib.request.Request(url, data=query.encode('utf-8'))
try:
    with urllib.request.urlopen(req) as response:
        data = json.loads(response.read().decode('utf-8'))

    nodes = {n['id']: (n['lon'], n['lat']) for n in data['elements'] if n['type'] == 'node'}
    buildings = []

    for way in data['elements']:
        if way['type'] == 'way' and 'nodes' in way:
            coords = [nodes[nid] for nid in way['nodes'] if nid in nodes]
            if coords:
                buildings.append(coords)

    os.makedirs('data', exist_ok=True)
    with open('data/valencia_buildings.json', 'w') as f:
        json.dump(buildings, f)
    print(f"Saved {len(buildings)} buildings to data/valencia_buildings.json")
except Exception as e:
    print(f"Error: {e}")
