import type { FeatureCollection, LineString, Polygon } from 'geojson';
import reference from './street-reference.json';

// Real, clipped OSM geometry. Provenance, licence and historical snapshot date
// are retained in the JSON and THIRD_PARTY_NOTICES.md; no runtime API calls.
const roads = reference.roads as FeatureCollection<LineString>;
const buildings = reference.buildings as FeatureCollection<Polygon>;
const parks = reference.parks as FeatureCollection<Polygon>;
export const streetGeography: FeatureCollection = {
  type: 'FeatureCollection', features: [...roads.features, ...buildings.features.flatMap(feature =>
    feature.geometry.coordinates.map(ring => ({
      type: 'Feature' as const, properties: {}, geometry: { type: 'LineString' as const, coordinates: ring },
    })))],
};
export const streetLandCover: FeatureCollection = {
  type: 'FeatureCollection', features: [...buildings.features, ...parks.features],
};
// Street labels are placed on the corresponding clipped OSM street geometries.
export const streetStops = [
  { id: 'grimaldi', label: 'Rue Grimaldi', longitude: 7.420679, latitude: 43.736383 },
  { id: 'moneghetti', label: 'Moneghetti', longitude: 7.417639, latitude: 43.737847 },
  { id: 'charlotte', label: 'Princesse Charlotte', longitude: 7.421387, latitude: 43.739053 },
] as const;
export const streetReference = reference.metadata;
