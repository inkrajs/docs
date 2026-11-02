import { useEffect, useMemo, useRef, useState } from 'react';
import { Button, JourneyMap, PencilSurface } from '@inkra/react';
import type { JourneyArea, JourneyPlace, JourneyRoute } from '@inkra/react';
import { useLocale, PencilText } from '../i18n';
import { ComponentExample } from './ComponentExample';
import { streetGeography, streetLandCover } from '../data/street-map';
import { highlightedBuildings, highlightedRivers, riverGeography, riverWater } from '../data/journey-map-features';

const copy = {
  'zh-CN': { buildings: '建筑高亮', rivers: '河流高亮', building: '建筑', selection: '当前选择', choose: '点选轮廓或下方条目。', clear: '清除选择' },
  en: { buildings: 'Building highlights', rivers: 'River highlights', building: 'Building', selection: 'Selection', choose: 'Select a shape or a row below.', clear: 'Clear selection' },
  ja: { buildings: '建物のハイライト', rivers: '河川のハイライト', building: '建物', selection: '選択中', choose: '輪郭または下の項目を選択してください。', clear: '選択を解除' },
  ko: { buildings: '건물 강조', rivers: '하천 강조', building: '건물', selection: '현재 선택', choose: '윤곽이나 아래 항목을 선택하세요.', clear: '선택 해제' },
  fr: { buildings: 'Bâtiments en surbrillance', rivers: 'Rivières en surbrillance', building: 'Bâtiment', selection: 'Sélection', choose: 'Choisissez une forme ou un élément ci-dessous.', clear: 'Effacer la sélection' },
};
const noPlaces: readonly JourneyPlace[] = [];
const noRoutes: readonly JourneyRoute[] = [];
const noAreas: readonly JourneyArea[] = [];

export function JourneyMapFeatureExample({ kind }: { kind: 'buildings' | 'rivers' }) {
  const { locale } = useLocale();
  const text = copy[locale]; const isBuilding = kind === 'buildings';
  const host = useRef<HTMLDivElement>(null); const [visible, setVisible] = useState(false);
  const areas = useMemo<readonly JourneyArea[]>(() => isBuilding ? highlightedBuildings.map((feature, index) => ({
    id: String(feature.properties?.osmId), label: `${text.building} ${String.fromCharCode(65 + index)}`,
    geometry: feature.geometry, color: 'var(--inkra-warning-pigment)', fillOpacity: .32,
  })) : noAreas, [isBuilding, text.building]);
  const routes = isBuilding ? noRoutes : highlightedRivers;
  const [selected, setSelected] = useState<string | undefined>(() => isBuilding ? areas[0]?.id : routes[0]?.id);
  const selectedLabel = (isBuilding ? areas : routes).find(item => item.id === selected)?.label;
  useEffect(() => {
    if (!host.current || typeof IntersectionObserver === 'undefined') { setVisible(true); return; }
    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) { setVisible(true); observer.disconnect(); }
    }, { rootMargin: '160px' });
    observer.observe(host.current); return () => observer.disconnect();
  }, []);
  const credit = isBuilding ? '© OpenStreetMap contributors · ODbL · Historical snapshot (2012)' : 'Natural Earth · Public domain';
  const source = isBuilding ? `// Reuse the building's GeoJSON geometry and source id.
const highlightedIds = new Set(${JSON.stringify(highlightedBuildings.map(feature => feature.properties?.osmId))});
const areas = buildingFeatures.filter(feature => highlightedIds.has(feature.properties.osmId)).map((feature, index) => ({
  id: feature.properties.osmId, label: '${text.building} ' + String.fromCharCode(65 + index),
  geometry: feature.geometry, // Polygon / MultiPolygon, [longitude, latitude]
  color: 'var(--inkra-warning-pigment)', fillOpacity: .32,
}));
<JourneyMap places={[]} geography={streets} landCover={buildings}
  areas={areas} selectedArea={selected}
  onAreaSelect={area => setSelected(area.id)} showFeatureList
  background="paper" maxFitZoom={18} height={380}
  attribution={attribution} attributionDisplay="popover" />`
    : `// Reuse river geometry; convert GeoJSON [longitude, latitude] to route coordinates.
const highlightedNames = new Set(['Waikato', 'Tongariro']);
const routes = riverFeatures.filter(feature => highlightedNames.has(feature.properties.name)).flatMap((feature, index) =>
  feature.geometry.coordinates.map((line, part) => ({
    id: feature.properties.name + ':' + part, label: feature.properties.name,
    coordinates: line.map(([longitude, latitude]) => [latitude, longitude]),
    color: index ? 'var(--inkra-danger)' : 'var(--inkra-info-foreground)', width: 3,
  })));
<JourneyMap places={[]} geography={riverNetwork} water={lakes}
  routes={routes} selectedRoute={selected}
  onRouteSelect={river => setSelected(river.id)} showFeatureList
  background="paper" maxFitZoom={10} height={380}
  attribution={attribution} attributionDisplay="popover" />`;
  return <ComponentExample id={`journey-map-${kind}`} title={text[kind]} code={source}>
    <div ref={host} className="journey-scenario" data-scene={kind}>
      <div className="journey-scenario__layout" data-details="true">
        <div className="journey-scenario__map" data-features="true">
          {visible && <JourneyMap places={noPlaces} areas={areas} routes={routes}
            geography={isBuilding ? streetGeography : riverGeography} landCover={isBuilding ? streetLandCover : undefined}
            water={isBuilding ? undefined : riverWater} background="paper" maxFitZoom={isBuilding ? 18 : 10} height={380}
            selectedArea={isBuilding ? selected : undefined} onAreaSelect={isBuilding ? area => setSelected(area.id) : undefined}
            selectedRoute={isBuilding ? undefined : selected} onRouteSelect={isBuilding ? undefined : river => setSelected(river.id)}
            showFeatureList attribution={credit} attributionDisplay="popover" aria-label={text[kind]} />}
          <a className="journey-scenario__credit" href={isBuilding ? 'https://www.openstreetmap.org/copyright' : 'https://www.naturalearthdata.com/'} target="_blank" rel="noreferrer">{isBuilding ? '© OpenStreetMap contributors' : 'Natural Earth'}</a>
        </div>
        <PencilSurface className="journey-scenario__details" variant="paper" radius={8}>
          <PencilText as="h3">{text.selection}</PencilText>
          <PencilText as="p">{selectedLabel || text.choose}</PencilText>
          <Button disabled={!selected} onClick={() => setSelected(undefined)}>{text.clear}</Button>
        </PencilSurface>
      </div>
    </div>
  </ComponentExample>;
}
