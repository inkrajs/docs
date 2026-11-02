import type { Feature, FeatureCollection, LineString, MultiLineString, Polygon } from 'geojson';
import type { JourneyRoute } from '@inkra/react';
import geography from './pencil-geography.json';
import { streetBuildingFeatures } from './street-map';

// Reuse source geometries and stable OSM ids, rather than approximating buildings.
const buildingIds = new Set(['way/156780354', 'way/94400040', 'way/94400062']);
export const highlightedBuildings = streetBuildingFeatures.filter(feature => buildingIds.has(String(feature.properties?.osmId)));

// Natural Earth river lines and lake outline from the existing local dataset.
// GeoJSON is longitude-first; JourneyRoute is latitude-first.
const rivers = geography.rivers as Feature<MultiLineString, { name: string }>[];
const networkNames = new Set(['Waikato', 'Tongariro', 'Waihou', 'Piako', 'Waitoa']);
const network = rivers.filter(feature => networkNames.has(feature.properties.name));
const focusNames = new Set(['Waikato', 'Tongariro']);
export const highlightedRivers: readonly JourneyRoute[] = network.filter(feature => focusNames.has(feature.properties.name)).flatMap((feature, index) =>
  feature.geometry.coordinates.map((line, part) => ({
    id: `${feature.properties.name}:${part}`, label: feature.properties.name,
    coordinates: line.map(([longitude, latitude]) => [latitude, longitude] as const),
    color: index ? 'var(--inkra-danger)' : 'var(--inkra-info-foreground)', width: 3,
  })));
const lake = (geography.lakes as Feature<Polygon>[]).filter(feature => feature.properties?.name === 'Lake Taupo');
export const riverWater: FeatureCollection<Polygon> = { type: 'FeatureCollection', features: lake };
export const riverGeography: FeatureCollection<MultiLineString | LineString> = {
  type: 'FeatureCollection', features: [...network, ...lake.flatMap(feature => feature.geometry.coordinates.map(ring => ({
    type: 'Feature' as const, properties: {}, geometry: { type: 'LineString' as const, coordinates: ring },
  })))],
};
