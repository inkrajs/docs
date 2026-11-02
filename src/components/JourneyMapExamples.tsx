import { useEffect, useMemo, useRef, useState } from 'react';
import { Button, JourneyMap, PencilIcon, PencilSurface } from '@inkra/react';
import type { JourneyArea, JourneyPlace, JourneyRoute } from '@inkra/react';
import { __iconData as flagIcon } from 'lucide-react/dist/esm/icons/flag.mjs';
import { __iconData as pinIcon } from 'lucide-react/dist/esm/icons/map-pin.mjs';
import { __iconData as treeIcon } from 'lucide-react/dist/esm/icons/tree-pine.mjs';
import { useLocale, PencilText } from '../i18n';
import type { DocsLocale } from '../docsLocales';
import { ComponentExample } from './ComponentExample';
import { iconPaths } from './DocsIcon';
import { iconFilledPaths } from './iconFilledPaths';
import { StreetMapExample } from './StreetMapExample';
import { JourneyMapFeatureExample } from './JourneyMapFeatureExamples';
import { streetGeography, streetLandCover } from '../data/street-map';
import { sceneAreas, scenePlaces, sceneRoutes } from '../data/journey-map-scenes';
import './JourneyMapExamples.css';

type Scene = 'single' | 'places' | 'images' | 'routes' | 'areas' | 'combined';
const order: (Scene | 'rivers' | 'buildings')[] = ['single', 'places', 'images', 'routes', 'rivers', 'areas', 'buildings', 'combined'];
type Copy = { titles: Record<Scene, string>; route: string; area: string; selection: string; choose: string; clear: string; combined: string };
const copy: Record<DocsLocale, Copy> = {
  'zh-CN': { titles: { single: '一个地点', places: 'Inkra 图标标记', images: '图片标记', routes: '多条路线', areas: '区域与空洞', combined: '地点、路线与区域' }, route: '路线', area: '区域', selection: '当前选择', choose: '点选地图或下方条目，查看对应内容。', clear: '清除选择', combined: '让地点、路线和区域一起表达一个计划。' },
  en: { titles: { single: 'One place', places: 'Inkra icon markers', images: 'Image markers', routes: 'Multiple routes', areas: 'Areas and holes', combined: 'Places, routes and areas' }, route: 'Route', area: 'Area', selection: 'Selection', choose: 'Select the map or a row below to inspect it.', clear: 'Clear selection', combined: 'Compose places, routes and areas into one plan.' },
  ja: { titles: { single: 'ひとつの地点', places: 'Inkra アイコンのマーカー', images: '画像マーカー', routes: '複数のルート', areas: '領域と穴', combined: '地点・ルート・領域' }, route: 'ルート', area: '領域', selection: '選択中', choose: '地図または下の項目を選択してください。', clear: '選択を解除', combined: '地点・ルート・領域をひとつの計画にまとめます。' },
  ko: { titles: { single: '하나의 장소', places: 'Inkra 아이콘 마커', images: '이미지 마커', routes: '여러 경로', areas: '영역과 빈 공간', combined: '장소, 경로, 영역' }, route: '경로', area: '영역', selection: '현재 선택', choose: '지도나 아래 항목을 선택하세요.', clear: '선택 해제', combined: '장소, 경로, 영역을 하나의 계획으로 구성하세요.' },
  fr: { titles: { single: 'Un lieu', places: 'Repères avec les icônes Inkra', images: 'Repères en images', routes: 'Plusieurs itinéraires', areas: 'Zones et ouvertures', combined: 'Lieux, itinéraires et zones' }, route: 'Itinéraire', area: 'Zone', selection: 'Sélection', choose: 'Choisissez la carte ou un élément ci-dessous.', clear: 'Effacer la sélection', combined: 'Réunissez lieux, itinéraires et zones dans un plan.' },
};
const markerIcons = [pinIcon, flagIcon, treeIcon].map(data => ({ paths: iconPaths(data), filledPaths: iconFilledPaths(data) }));
const markerColors = ['var(--inkra-success-foreground)', 'var(--inkra-danger)', 'var(--inkra-info-foreground)'];
const markerImages = ['/images/synthesis/herb.svg', '/images/synthesis/crystal.svg', '/images/synthesis/potion.svg'];
const iconPlacesCode = `import { JourneyMap, PencilIcon } from '@inkra/react';

const markers = [
${markerIcons.map((icon, i) => `  <PencilIcon paths={${JSON.stringify(icon.paths)}}${i && icon.filledPaths ? ` filledPaths={${JSON.stringify(icon.filledPaths)}}` : ''} variant="${i ? 'filled' : 'outline'}" size={30} decorative />,`).join('\n')}
];
const places = [
${scenePlaces.map((place, i) => `  { ...${JSON.stringify(place)}, color: '${markerColors[i]}', icon: markers[${i}] },`).join('\n')}
];`;
const imagePlacesCode = `const places = [
${scenePlaces.map((place, i) => `  { ...${JSON.stringify(place)}, icon: <img src="${markerImages[i]}" alt="" width={36} height={36} draggable={false} style={{ objectFit: 'contain' }} decoding="async" /> },`).join('\n')}
];`;
const credit = '© OpenStreetMap contributors · ODbL · Historical snapshot (2012)';

function MapScene({ kind }: { kind: Scene }) {
  const { locale } = useLocale(); const text = copy[locale];
  const host = useRef<HTMLDivElement>(null); const [visible, setVisible] = useState(false);
  const [place, setPlace] = useState<string>(); const [route, setRoute] = useState<string>(); const [area, setArea] = useState<string>();
  useEffect(() => {
    if (!host.current || typeof IntersectionObserver === 'undefined') { setVisible(true); return; }
    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) { setVisible(true); observer.disconnect(); }
    }, { rootMargin: '160px' });
    observer.observe(host.current); return () => observer.disconnect();
  }, []);
  const points = useMemo<readonly JourneyPlace[]>(() => {
    if (kind === 'single') return [scenePlaces[0]];
    if (kind === 'areas') return [];
    if (kind === 'places') return scenePlaces.map((item, i) => ({ ...item, color: markerColors[i],
      icon: <PencilIcon {...markerIcons[i]} variant={i ? 'filled' : 'outline'} size={30} decorative /> }));
    if (kind === 'images') return scenePlaces.map((item, i) => ({ ...item,
      icon: <img src={markerImages[i]} alt="" width={36} height={36} draggable={false} style={{ objectFit: 'contain' }} decoding="async" /> }));
    return scenePlaces;
  }, [kind]);
  const routes = useMemo<readonly JourneyRoute[]>(() => kind === 'routes' || kind === 'combined'
    ? sceneRoutes.map((item, i) => ({ ...item, label: `${text.route} ${String.fromCharCode(65 + i)}` })) : [], [kind, text.route]);
  const areas = useMemo<readonly JourneyArea[]>(() => kind === 'areas' || kind === 'combined'
    ? sceneAreas.map((item, i) => ({ ...item, label: `${text.area} ${String.fromCharCode(65 + i)}` })) : [], [kind, text.area]);
  const showDetails = kind === 'places' || kind === 'images' || kind === 'combined';
  const selected = points.find(item => item.id === place)?.label || routes.find(item => item.id === route)?.label || areas.find(item => item.id === area)?.label;
  const selectPlace = (item: JourneyPlace) => { setPlace(item.id); setRoute(undefined); setArea(undefined); };
  const selectRoute = (item: JourneyRoute) => { setRoute(item.id); setPlace(undefined); setArea(undefined); };
  const selectArea = (item: JourneyArea) => { setArea(item.id); setPlace(undefined); setRoute(undefined); };
  const code = kind === 'single' ? `<JourneyMap places={[place]} geography={streets} landCover={buildings}
  background="paper" maxFitZoom={18} attribution={attribution} />`
    : kind === 'places' || kind === 'images' ? `${kind === 'places' ? iconPlacesCode : imagePlacesCode}
<JourneyMap places={places} selectedPlace={selected}
  onPlaceSelect={place => setSelected(place.id)} geography={streets}
  landCover={buildings} height={380} focusZoomScale={2}
  background="paper" maxFitZoom={18} attributionDisplay="popover"
  attribution={attribution} />`
    : kind === 'routes' ? `const routes = [{ id: 'route-1', label: '${text.route} A',
  color: 'var(--inkra-info-foreground)', width: 2.4,
  coordinates: routeCoordinates }];
<JourneyMap places={places} routes={routes} selectedRoute={selected}
  onRouteSelect={route => setSelected(route.id)} showFeatureList
  geography={streets} background="paper" maxFitZoom={18}
  attribution={attribution} />`
    : kind === 'areas' ? `const areas = [{ id: 'west', label: '${text.area} A',
  color: 'var(--inkra-success-foreground)', fillOpacity: .13,
  geometry: { type: 'Polygon', coordinates: [outerRing, holeRing] } }];
<JourneyMap places={[]} areas={areas} selectedArea={selected}
  onAreaSelect={area => setSelected(area.id)} showFeatureList
  geography={streets} background="paper" maxFitZoom={18}
  attribution={attribution} />`
    : `<JourneyMap places={places} routes={routes} areas={areas}
  selectedPlace={place} onPlaceSelect={selectPlace}
  selectedRoute={route} onRouteSelect={selectRoute}
  selectedArea={area} onAreaSelect={selectArea} showFeatureList
  geography={streets} landCover={buildings} background="paper"
  maxFitZoom={18} attribution={attribution} />`;
  return <ComponentExample id={`journey-map-${kind}`} title={text.titles[kind]} code={code}>
    <div ref={host} className="journey-scenario" data-scene={kind}>
      <div className="journey-scenario__layout" data-details={showDetails}>
        <div className="journey-scenario__map" data-features={routes.length > 0 || areas.length > 0}>
          {visible && <JourneyMap places={points} routes={routes} areas={areas}
            geography={streetGeography} landCover={streetLandCover} background="paper" maxFitZoom={18} height={380}
            selectedPlace={place} onPlaceSelect={selectPlace} selectedRoute={route} onRouteSelect={selectRoute}
            selectedArea={area} onAreaSelect={selectArea} showFeatureList={routes.length > 0 || areas.length > 0}
            focusZoomScale={2} attribution={credit} attributionDisplay="popover" aria-label={text.titles[kind]} />}
          <a className="journey-scenario__credit" href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">© OpenStreetMap contributors</a>
        </div>
        {showDetails && <PencilSurface className="journey-scenario__details" variant="paper" radius={8}>
          <PencilText as="h3">{text.selection}</PencilText>
          <PencilText as="p">{selected || text.choose}</PencilText>
          {kind === 'combined' && <PencilText as="p">{text.combined}</PencilText>}
          <Button onClick={() => { setPlace(undefined); setRoute(undefined); setArea(undefined); }} disabled={!selected}>{text.clear}</Button>
        </PencilSurface>}
      </div>
    </div>
  </ComponentExample>;
}
export function JourneyMapExamples() { return <><MapScene kind="single" /><StreetMapExample />{order.slice(1).map(kind => kind === 'rivers' || kind === 'buildings' ? <JourneyMapFeatureExample key={kind} kind={kind} /> : <MapScene key={kind} kind={kind} />)}</>; }
