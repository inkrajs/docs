import { useEffect, useMemo, useRef, useState } from 'react';
import { Badge, Button, JourneyMap, type JourneyArea, type JourneyPlace } from '@inkra/react';
import { __iconData as horseIcon } from 'lucide-react/dist/esm/icons/chess-knight.mjs';
import { __iconData as heartIcon } from 'lucide-react/dist/esm/icons/heart.mjs';
import { __iconData as personIcon } from 'lucide-react/dist/esm/icons/person-standing.mjs';
import { DocsIcon } from './DocsIcon';
import { ComponentExample } from './ComponentExample';
import { useLocale, PencilText } from '../i18n';
import type { DocsLocale } from '../docsLocales';
import { sceneRoutes } from '../data/journey-map-scenes';
import { streetGeography, streetLandCover } from '../data/street-map';

type Point = readonly [number, number];
const trails = sceneRoutes.map(route => ({ ...route, width: 1.6 }));
const bounds = { south: 43.73735, north: 43.7385, west: 7.41905, east: 7.42065 };
const roamingArea: readonly JourneyArea[] = [{ id: 'roaming', label: 'Roaming area', color: 'var(--inkra-success-foreground)', fillOpacity: .06,
  geometry: { type: 'Polygon', coordinates: [[[bounds.west, bounds.south], [bounds.east, bounds.south], [bounds.east, bounds.north], [bounds.west, bounds.north], [bounds.west, bounds.south]]] } }];
const visuals = [<DocsIcon data={horseIcon} size={34} />, <DocsIcon data={personIcon} size={34} />,
  <img src="/images/synthesis/crystal.svg" width={36} height={36} alt="" draggable={false} decoding="async" />];
const ids = ['rider', 'walker', 'roamer'];
const pigments = ['#994f3f', '#4b96aa', '#4c7952'];
const starts: readonly Point[] = [trails[0].coordinates[0], trails[1].coordinates[20], [43.7379, 7.4198]];
const text: Record<DocsLocale, { title: string; actors: readonly string[]; pause: string; resume: string; description: string; reduced: string; range: string }> = {
 'zh-CN': { range: '活动范围', title: '移动标记：路径巡游与范围漫游', actors: ['骑手', '行人', '漫游标记'], pause: '暂停移动', resume: '继续移动', description: '骑手和行人沿街道往返，图片标记在浅绿色范围内漫游。骑手旁的生命值徽章会跟随移动；点选不会中断移动。', reduced: '已按系统的减少动态效果设置暂停移动。' },
 en: { range: 'Roaming area', title: 'Moving markers: paths and free roaming', actors: ['Rider', 'Walker', 'Roaming marker'], pause: 'Pause movement', resume: 'Resume movement', description: 'The rider and walker follow the streets; the image roams within the green area. A health badge follows the rider; selection does not interrupt movement.', reduced: 'Movement is paused to respect reduced motion.' },
 ja: { range: '移動範囲', title: '動くマーカー：経路と範囲内の移動', actors: ['騎手', '歩行者', '自由移動'], pause: '移動を一時停止', resume: '移動を再開', description: '騎手と歩行者は道を往復し、画像は緑の範囲内を移動します。選択しても移動は続きます。', reduced: 'システムの動きを減らす設定により停止しています。' },
 ko: { range: '이동 범위', title: '움직이는 마커: 경로와 영역 내 이동', actors: ['기수', '보행자', '자유 이동'], pause: '이동 일시 정지', resume: '이동 재개', description: '기수와 보행자는 도로를 왕복하고 이미지는 녹색 영역 안에서 이동합니다. 선택해도 이동은 계속됩니다.', reduced: '시스템의 동작 줄이기 설정에 따라 정지했습니다.' },
 fr: { range: 'Zone de déplacement', title: 'Repères mobiles : parcours et déplacements libres', actors: ['Cavalier', 'Piéton', 'Repère libre'], pause: 'Suspendre', resume: 'Reprendre', description: 'Le cavalier et le piéton suivent les rues ; l’image se déplace dans la zone verte. La sélection n’interrompt pas le mouvement.', reduced: 'Le mouvement est suspendu selon votre préférence de réduction des animations.' },
};
const distance = (a: Point, b: Point) => Math.hypot((b[0] - a[0]) * 111320, (b[1] - a[1]) * 111320 * Math.cos(a[0] * Math.PI / 180));
type Unit = { point: Point; duration: number };

export function JourneyMapMotionExample() {
 const { locale } = useLocale(); const copy = text[locale];
 const areas = useMemo(() => roamingArea.map(area => ({ ...area, label: copy.range })), [copy]);
 const host = useRef<HTMLDivElement>(null);
 const [mounted, setMounted] = useState(false);
 const [visible, setVisible] = useState(false), [hidden, setHidden] = useState(false), [reduced, setReduced] = useState(false);
 const [running, setRunning] = useState(true), [mapReady, setMapReady] = useState(false);
 const [units, setUnits] = useState<readonly Unit[]>(() => starts.map(point => ({ point, duration: 1000 })));
 const models = useRef(starts.map((point, index) => ({ point, index: index === 1 ? 20 : 0, direction: 1, deadline: 0, remaining: 0 })));
 const randomState = useRef(731);
 const active = mapReady && running && visible && !hidden && !reduced;
 useEffect(() => {
  if (!host.current) return;
  const observer = new IntersectionObserver(entries => { const shown = entries.some(entry => entry.isIntersecting); setVisible(shown); if (shown) setMounted(true); }, { threshold: .1 });
  observer.observe(host.current);
  const preference = matchMedia('(prefers-reduced-motion: reduce)');
  const visibility = () => setHidden(document.hidden), preferenceChanged = () => setReduced(preference.matches);
  visibility(); preferenceChanged();
  document.addEventListener('visibilitychange', visibility); preference.addEventListener('change', preferenceChanged);
  return () => { observer.disconnect(); document.removeEventListener('visibilitychange', visibility); preference.removeEventListener('change', preferenceChanged); };
 }, []);
 useEffect(() => {
  if (!active) return;
  let timer: ReturnType<typeof setTimeout>;
  const random = () => { randomState.current = (Math.imul(randomState.current, 1664525) + 1013904223) >>> 0; return randomState.current / 4294967296; };
  const now = performance.now();
  models.current.forEach(model => { model.deadline = now + model.remaining; });
  const tick = () => {
   const time = performance.now(); const updates = new Map<number, Unit>();
   models.current.forEach((model, i) => {
    if (time + 1 < model.deadline) return;
    let target: Point;
    if (i < 2) {
     const path = trails[i].coordinates;
     let next = model.index + model.direction;
     if (next < 0 || next >= path.length) { model.direction *= -1; next = model.index + model.direction; }
     model.index = next; target = path[next];
    } else target = [bounds.south + random() * (bounds.north - bounds.south), bounds.west + random() * (bounds.east - bounds.west)];
    const duration = Math.min(15000, Math.max(250, distance(model.point, target) / [9, 4, 12][i] * 1000));
    model.point = target; model.deadline = time + duration; updates.set(i, { point: target, duration });
   });
   if (updates.size) setUnits(previous => previous.map((unit, i) => updates.get(i) ?? unit));
   timer = setTimeout(tick, Math.max(16, Math.min(...models.current.map(model => model.deadline - performance.now()))));
  };
  tick();
  return () => { clearTimeout(timer); const time = performance.now(); models.current.forEach(model => { model.remaining = Math.max(0, model.deadline - time); }); };
 }, [active]);
 const places = useMemo<readonly JourneyPlace[]>(() => units.map((unit, i) => ({ id: ids[i], label: copy.actors[i], latitude: unit.point[0], longitude: unit.point[1], color: pigments[i], icon: visuals[i], labelPosition: i === 0 ? 'right' : i === 1 ? 'top' : 'bottom', labelGap: i === 0 ? 2 : 0, ...(i === 0 ? { labelContent: <Badge><DocsIcon data={heartIcon} size={12} /> 80 / 100</Badge> } : {}), transition: { duration: unit.duration, easing: 'linear', paused: !active } })), [units, copy, active]);
 const code = `const [ready, setReady] = useState(false);
// Start your target source after onReady; pause it while hidden or offscreen.
// Keep stable IDs. The application supplies targets from a path, a bounded
// simulation, live location updates or any other source.
const places = units.map(unit => ({
  id: unit.id, label: unit.label, icon: unit.icon, color: unit.color,
  latitude: unit.target.latitude, longitude: unit.target.longitude,
  // Any ReactNode can follow the marker. label remains its accessible name.
  labelContent: unit.id === 'rider' ? <Badge>♡ 80 / 100</Badge> : undefined,
  labelPosition: unit.id === 'rider' ? 'right' : 'bottom', labelGap: 2,
  transition: { duration: unit.travelTime, easing: 'linear', paused: paused || !ready },
}));
<JourneyMap places={places} routes={trails} areas={roamingArea}
  geography={streets} landCover={buildings} background="paper"
  maxFitZoom={18} height={440} pinSize={36} selectionMode="multiple"
  focusSelectedPlace={false} onReady={() => setReady(true)}
  attributionDisplay="popover" attribution={attribution} />`;
 return <ComponentExample id="journey-map-motion" title={copy.title} code={code}>
  <div ref={host} className="journey-motion">
   <PencilText as="p">{copy.description}</PencilText>
   <Button disabled={reduced} onClick={() => setRunning(previous => !previous)}>{running ? copy.pause : copy.resume}</Button>
   {reduced && <PencilText role="status">{copy.reduced}</PencilText>}
   <div className="journey-motion__map">{mounted && <JourneyMap places={places} routes={trails} areas={areas} geography={streetGeography} landCover={streetLandCover} background="paper"
    maxFitZoom={18} height={440} pinSize={36} selectionMode="multiple" focusSelectedPlace={false} onReady={() => setMapReady(true)} attributionDisplay="popover"
    attribution="© OpenStreetMap contributors · ODbL · Historical snapshot (2012)" aria-label={copy.title} />}</div>
  </div>
 </ComponentExample>;
}
