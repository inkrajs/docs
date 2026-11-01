"""Rebuild the small historical OSM street demo (Python + Shapely 2).

  python scripts/import-street-reference.py /path/to/monaco.osm.gz

The input URL/revision and hash are recorded in the output metadata. This is an
optional maintainer tool; the documentation build consumes checked-in JSON only.
"""
import gzip
import hashlib
import json
from pathlib import Path
import sys
import xml.etree.ElementTree as ET
from shapely.geometry import Polygon, LineString, box, mapping

SOURCE = 'https://raw.githubusercontent.com/graphhopper/graphhopper/92dca7ceacdd2f98abe3cacd8c20e08c38324c32/core/files/monaco.osm.gz'
BBOX = [7.417, 43.736, 7.423, 43.7402]  # west, south, east, north
raw = Path(sys.argv[1]).read_bytes()
expected_sha256 = 'cca67724618cf38c2e8ff39082b19daa03a66b0725a5025515feb0fc678dcdfa'
if hashlib.sha256(raw).hexdigest() != expected_sha256:
    raise SystemExit('Input archive does not match the pinned historical source; review provenance before updating it.')
root = ET.fromstring(gzip.decompress(raw))
nodes = {node.get('id'): (float(node.get('lon')), float(node.get('lat'))) for node in root.findall('node')}
crop = box(*BBOX)
roads, buildings, parks = [], [], []
for way in root.findall('way'):
    tags = {tag.get('k'): tag.get('v') for tag in way.findall('tag')}
    points = [nodes[nd.get('ref')] for nd in way.findall('nd') if nd.get('ref') in nodes]
    if len(points) < 2:
        continue
    category = None
    if tags.get('building') not in (None, 'no') and len(points) >= 4 and points[0] == points[-1]:
        geometry = Polygon(points)
        category = buildings
    elif tags.get('leisure') in ('park', 'garden') and len(points) >= 4 and points[0] == points[-1]:
        geometry = Polygon(points)
        category = parks
    elif tags.get('highway') in ('primary', 'secondary', 'tertiary', 'residential', 'unclassified', 'living_street', 'pedestrian', 'service', 'footway', 'path') and tags.get('tunnel') not in ('yes', 'building_passage') and tags.get('area') != 'yes':
        geometry = LineString(points)
        category = roads
    else:
        continue
    if not geometry.is_valid:
        geometry = geometry.buffer(0)
    geometry = geometry.intersection(crop)
    # ~0.1 m tolerance, without turning corners into curves or warping lots.
    geometry = geometry.simplify(.000001, preserve_topology=True)
    for part in getattr(geometry, 'geoms', [geometry]):
        if part.is_empty or part.geom_type not in ('LineString', 'Polygon'):
            continue
        feature = {'type': 'Feature', 'properties': {'osmId': 'way/' + way.get('id')}, 'geometry': mapping(part)}
        if tags.get('name'):
            feature['properties']['name'] = tags['name']
        if category is buildings:
            feature['properties']['id'] = 'urban'
        elif category is parks:
            feature['properties']['id'] = 'forest'
        category.append(feature)

def rounded(value):
    if isinstance(value, float):
        return round(value, 7)
    if isinstance(value, (list, tuple)):
        return [rounded(item) for item in value]
    if isinstance(value, dict):
        return {key: rounded(item) for key, item in value.items()}
    return value

timestamps = [item.get('timestamp') for item in root if item.get('timestamp')]
data = rounded({
    'metadata': {
        'title': 'Monaco street reference', 'source': SOURCE,
        'sourceSha256': hashlib.sha256(raw).hexdigest(),
        'sourceLatestObjectTimestamp': max(timestamps) if timestamps else None,
        'notice': 'Historical GraphHopper OSM fixture; illustrative snapshot, not current navigation data.',
        'bbox': BBOX, 'copyright': '© OpenStreetMap contributors',
        'license': 'ODbL-1.0', 'licenseUrl': 'https://www.openstreetmap.org/copyright',
        'processing': 'Clipped to bbox; surface roads only; polygons and lines simplified by 0.000001 degrees; coordinates rounded to seven decimals. No synthetic geometry.',
    },
    'roads': {'type': 'FeatureCollection', 'features': roads},
    'buildings': {'type': 'FeatureCollection', 'features': buildings},
    'parks': {'type': 'FeatureCollection', 'features': parks},
})
output = Path(__file__).resolve().parents[1] / 'src/data/street-reference.json'
output.write_text(json.dumps(data, ensure_ascii=False, separators=(',', ':')) + '\n')
print(json.dumps({'roads': len(roads), 'buildings': len(buildings), 'parks': len(parks), 'bytes': output.stat().st_size, 'metadata': data['metadata']}, ensure_ascii=False))
