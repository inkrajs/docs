import { PropertyTabs } from './PropertyTabs';
import { useState } from 'react';
import { Calendar, DayAgenda, JourneyMap, Switch, type AgendaEvent, type JourneyPlace } from '@inkra/react';
import { enUS, zhCN } from 'react-day-picker/locale';
import type { DateRange } from 'react-day-picker';
import type { GeoJsonObject } from 'geojson';
import { useLocale, PencilText } from '../i18n';
import type { DocsLocale } from '../docsLocales';
import { DocsSelect } from './DocsSelect';
import { ComponentPlayground } from './ComponentPlayground';
import { ComponentExample } from './ComponentExample';
import './TravelExamples.css';
import { StreetMapExample } from './StreetMapExample';
import tripGeography from '../data/pencil-geography.json';
import tripLandCover from '../data/pencil-land-cover.json';

const geography = tripGeography.land as GeoJsonObject;
const landCover = { type: 'FeatureCollection', features: tripLandCover.features } as GeoJsonObject;
const water = { type: 'FeatureCollection', features: tripGeography.lakes } as GeoJsonObject;
const places: JourneyPlace[] = [
  { id: 'harbor', label: 'Auckland', latitude: -36.85, longitude: 174.76 },
  { id: 'lake', label: 'Lake Tekapo', latitude: -44.004, longitude: 170.477 },
  { id: 'ridge', label: 'Queenstown', latitude: -45.031, longitude: 168.662 },
];
const mapRenderingCopy: Record<DocsLocale, {
  tab: string; mode: string; auto: string; legacy: string; custom: string;
  boundary: string; terrain: string; canvas: string; cache: string; title: string;
  defaults: string; switches: string; invalidation: string; budget: string; validation: string;
}> = {
  'zh-CN': {
    validation: "Chrome \u4e0e WebKit \u7684\u5c40\u90e8\u5bf9\u6bd4\u5747\u6709\u6539\u5584\uff0c\u56e0\u6b64\u5f53\u524d\u4e0d\u6309\u6d4f\u89c8\u5668\u5206\u6d41\u3002WebKit \u4e0d\u7b49\u540c\u4e8e\u771f\u5b9e Safari\uff1b\u771f\u5b9e Safari \u9a8c\u6536\u4ecd\u672a\u5b8c\u6210\uff0c\u4e5f\u6ca1\u6709\u65b0\u589e Safari CI\u3002legacy \u4ecd\u9075\u5faa\u5185\u5b58\u9884\u7b97\u4e0e\u6062\u590d\u89c4\u5219\u3002",
    tab: '渲染', mode: '渲染策略', auto: '自动', legacy: '原实现', custom: '自定义',
    boundary: '裁剪屏外边界笔触', terrain: '省略地表外纹理', canvas: '复用画布缓冲', cache: '缓存静态底图', title: '渲染配置',
    defaults: 'auto 是默认值，当前开启四项优化，Chrome 与 Safari 使用相同规则，不检测浏览器。legacy 关闭四项优化，用于对照。自定义对象只覆盖指定项；未指定项沿用 auto。切换策略只重绘，不重建地图或重置视角；服务端渲染不读取浏览器信息。',
    switches: 'boundaryViewport 跳过屏外边界和路线的笔触提交，保留原始路径采样；terrainViewport 以保守的多边形行边界省略不会显示的纹理，保持原网格与种子；reuseCanvas 在尺寸未变时复用画布缓冲；cacheBase 缓存静态底图，选点时无需重新绘制地形。四个开关可独立组合。上方“渲染”属性页可试用这些配置。',
    invalidation: '底图缓存随数据、主题颜色、尺寸/DPR、视图或绘图上下文恢复更新；选点保留缓存。更新数据时替换相应输入引用。每张地图只有一条缓存，卸载时释放。',
    budget: '缓存最多 3 Mi 像素（约 12 MiB RGBA），超出时直接绘制；主图与缓存合计最多 6 Mi 像素。主画布单边上限 8192、单层最多 4 Mi 像素，必要时降低像素比。',
  },
  en: {
    validation: "Focused Chrome and WebKit comparisons improved, so the defaults do not branch by browser. WebKit is not branded Safari; real Safari acceptance remains unverified, and no Safari CI was added. legacy still follows memory limits and recovery rules.",
    tab: 'Rendering', mode: 'Rendering strategy', auto: 'Auto', legacy: 'Legacy', custom: 'Custom',
    boundary: 'Clip offscreen boundary strokes', terrain: 'Skip terrain outside polygons', canvas: 'Reuse canvas buffer', cache: 'Cache the static base', title: 'Rendering configuration',
    defaults: 'auto is the default and currently enables all four optimizations. Chrome and Safari follow the same rules, without browser detection. legacy disables all four for comparison. An options object overrides only the specified flags; omitted flags follow auto. Switching redraws without rebuilding the map or resetting its view. Server rendering does not read browser information.',
    switches: 'boundaryViewport skips offscreen boundary and route stroke submissions while preserving path sampling; terrainViewport conservatively skips invisible terrain cells while retaining grid indices and seeds; reuseCanvas reuses the buffer when dimensions are unchanged; cacheBase caches the static base so selecting a place does not repaint terrain. Combine the flags independently using the Rendering property tab above.',
    invalidation: 'Data, theme colors, dimensions/DPR, view changes and context restoration refresh the base cache; place selection reuses it. Replace the relevant input references when updating data. Each map retains one cache entry, released on unmount.',
    budget: 'The cache is limited to 3 Mi pixels (about 12 MiB RGBA); larger bases draw directly. Main canvas plus cache is limited to 6 Mi pixels. The main canvas is capped at 8192 per side and 4 Mi pixels per layer, reducing pixel ratio when needed.',
  },
  ja: {
    validation: "Chrome \u3068 WebKit \u306e\u5c40\u6240\u6bd4\u8f03\u3067\u6539\u5584\u3057\u305f\u305f\u3081\u3001\u6a19\u6e96\u8a2d\u5b9a\u306f\u30d6\u30e9\u30a6\u30b6\u30fc\u5225\u306b\u5206\u5c90\u3057\u307e\u305b\u3093\u3002WebKit \u306f\u5b9f\u969b\u306e Safari \u3067\u306f\u306a\u304f\u3001\u5b9f\u6a5f Safari \u306e\u691c\u8a3c\u306f\u672a\u5b8c\u4e86\u3067\u3059\u3002Safari CI \u306f\u8ffd\u52a0\u3057\u3066\u3044\u307e\u305b\u3093\u3002legacy \u306b\u3082\u30e1\u30e2\u30ea\u30fc\u5236\u9650\u3068\u5fa9\u5143\u51e6\u7406\u304c\u9069\u7528\u3055\u308c\u307e\u3059\u3002",
    tab: '描画', mode: '描画方式', auto: '自動', legacy: '従来方式', custom: 'カスタム',
    boundary: '画面外の境界線を省略', terrain: '地形外の模様を省略', canvas: 'Canvas バッファーを再利用', cache: '静的な地図をキャッシュ', title: '描画設定',
    defaults: '標準の auto は現在 4 つの最適化を有効にします。Chrome と Safari は同じ設定で、ブラウザー判定は行いません。legacy は比較用にすべて無効にします。設定オブジェクトは指定項目だけを上書きし、省略項目は auto を使います。切り替えは再描画のみで、地図や視点を初期化しません。SSR ではブラウザー情報を参照しません。',
    switches: 'boundaryViewport は元の経路サンプルを保ちながら画面外の境界線・ルートの描画を省き、terrainViewport は地形外のセルを保守的に省略し、グリッドと乱数種を維持します。reuseCanvas はサイズが同じバッファーを再利用します。cacheBase は静的な地図を保持し、地点の選択で地形を描き直しません。上の「描画」タブで個別に組み合わせられます。',
    invalidation: 'データ、テーマ色、サイズ/DPR、視点、描画コンテキストの復元でキャッシュを更新します。地点の選択では再利用します。データ更新時は入力の参照を置き換えてください。地図ごとに 1 件を保持し、アンマウント時に解放します。',
    budget: 'キャッシュは最大 3 Mi ピクセル（RGBA 約 12 MiB）で、超過時は直接描画します。主 Canvas と合わせて最大 6 Mi ピクセルです。主 Canvas は一辺 8192、1 層 4 Mi ピクセルまでとし、必要に応じてピクセル比を下げます。',
  },
  ko: {
    validation: "Chrome\uacfc WebKit\uc758 \ud574\ub2f9 \ube44\uad50\uc5d0\uc11c \uac1c\uc120\ub418\uc5b4 \uae30\ubcf8 \uc124\uc815\uc740 \ube0c\ub77c\uc6b0\uc800\ubcc4\ub85c \ub098\ub204\uc9c0 \uc54a\uc2b5\ub2c8\ub2e4. WebKit\uc740 \uc2e4\uc81c Safari\uac00 \uc544\ub2c8\uba70 \uc2e4\uc81c Safari \uac80\uc99d\uc740 \uc544\uc9c1 \uc644\ub8cc\ub418\uc9c0 \uc54a\uc558\uc2b5\ub2c8\ub2e4. Safari CI\ub294 \ucd94\uac00\ud558\uc9c0 \uc54a\uc558\uace0 legacy\uc5d0\ub3c4 \uba54\ubaa8\ub9ac \uc81c\ud55c\uacfc \ubcf5\uc6d0 \uaddc\uce59\uc774 \uc801\uc6a9\ub429\ub2c8\ub2e4.",
    tab: '렌더링', mode: '렌더링 방식', auto: '자동', legacy: '기존 방식', custom: '사용자 설정',
    boundary: '화면 밖 경계선 생략', terrain: '지형 밖 무늬 생략', canvas: '캔버스 버퍼 재사용', cache: '정적 배경 캐시', title: '렌더링 설정',
    defaults: '기본값 auto는 현재 네 최적화를 모두 켭니다. Chrome과 Safari에 같은 규칙을 적용하며 브라우저를 감지하지 않습니다. legacy는 비교를 위해 모두 끕니다. 설정 객체는 지정한 항목만 바꾸고 생략한 항목은 auto를 따릅니다. 방식 전환은 다시 그리기만 하며 지도와 시점을 초기화하지 않습니다. SSR은 브라우저 정보를 읽지 않습니다.',
    switches: 'boundaryViewport는 원래 경로 샘플을 유지하며 화면 밖 경계선과 경로의 그리기 제출을 생략하고, terrainViewport는 지형 밖 셀을 보수적으로 생략하며 격자와 난수 시드를 유지합니다. reuseCanvas는 크기가 같을 때 버퍼를 재사용합니다. cacheBase는 정적 배경을 저장하여 장소를 선택해도 지형을 다시 그리지 않습니다. 위 렌더링 탭에서 네 항목을 독립적으로 조합할 수 있습니다.',
    invalidation: '데이터, 테마 색, 크기/DPR, 시점, 그리기 컨텍스트 복원 시 배경 캐시를 갱신합니다. 장소 선택은 캐시를 재사용합니다. 데이터를 바꿀 때 해당 입력 참조를 교체하세요. 지도마다 한 항목만 보관하며 마운트 해제 시 해제합니다.',
    budget: '캐시는 최대 3 Mi 픽셀(RGBA 약 12 MiB)이며 초과하면 직접 그립니다. 주 캔버스와 캐시 합계는 최대 6 Mi 픽셀입니다. 주 캔버스는 변당 8192, 층당 4 Mi 픽셀로 제한하며 필요하면 픽셀 비율을 낮춥니다.',
  },
  fr: {
    validation: "Les comparaisons cibl\u00e9es dans Chrome et WebKit montrent un gain : les r\u00e9glages par d\u00e9faut ne varient donc pas selon le navigateur. WebKit n\u2019est pas Safari ; la validation dans Safari reste \u00e0 faire et aucun CI Safari n\u2019a \u00e9t\u00e9 ajout\u00e9. legacy conserve les limites m\u00e9moire et la restauration.",
    tab: 'Rendu', mode: 'Stratégie de rendu', auto: 'Auto', legacy: 'Ancien rendu', custom: 'Personnalisé',
    boundary: 'Limiter les contours hors écran', terrain: 'Éviter les textures hors terrain', canvas: 'Réutiliser le tampon canvas', cache: 'Mettre le fond en cache', title: 'Configuration du rendu',
    defaults: 'auto est le réglage par défaut et active actuellement les quatre optimisations. Chrome et Safari suivent les mêmes règles, sans détection du navigateur. legacy les désactive pour comparaison. Un objet ne remplace que les options précisées ; les autres suivent auto. Changer de stratégie redessine la carte sans la recréer ni réinitialiser la vue. Le rendu serveur ne lit aucune information du navigateur.',
    switches: 'boundaryViewport évite les tracés de contours et d’itinéraires hors écran, en conservant l’échantillonnage ; terrainViewport élimine les cellules invisibles sans changer la grille ni les graines ; reuseCanvas réutilise le tampon si ses dimensions restent identiques ; cacheBase conserve le fond statique pour éviter de redessiner le terrain lors d’une sélection. Combinez ces options dans l’onglet Rendu ci-dessus.',
    invalidation: 'Les données, couleurs du thème, dimensions/DPR, changements de vue et restauration du contexte renouvellent le cache ; la sélection le réutilise. Remplacez les références des données modifiées. Chaque carte conserve une entrée, libérée au démontage.',
    budget: 'Le cache est limité à 3 Mi pixels (environ 12 MiB RGBA) ; au-delà, le fond est dessiné directement. Canvas principal et cache sont limités à 6 Mi pixels au total. Le canvas principal est limité à 8192 par côté et 4 Mi pixels par couche, avec réduction du ratio de pixels si nécessaire.',
  },
};
const initialDate = new Date(2026, 9, 21);
const dateKey = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

export function TravelExamples({ kind }: { kind: 'calendar' | 'day-agenda' | 'journey-map' }) {
  const { t, locale } = useLocale();
  const [date, setDate] = useState<Date | undefined>(initialDate);
  const [range, setRange] = useState<DateRange | undefined>({ from: initialDate, to: new Date(2026, 9, 24) });
  const [mode, setMode] = useState('single');
  const [showEvents, setShowEvents] = useState(false);
  const [showOverview, setOverview] = useState(false);
  const [empty, setEmpty] = useState(false);
  const [disabled, setDisabled] = useState(false);
  const [selected, setSelected] = useState('');
  const [place, setPlace] = useState('harbor');
  const [weekStart, setWeekStart] = useState('1');
  const [indicator, setIndicator] = useState<'count' | 'dot' | 'none'>('count');
  const [calendarAppearance, setCalendarAppearance] = useState<'itinerary' | 'picker'>('itinerary');
  const [months, setMonths] = useState('1');
  const [weekNumbers, setWeekNumbers] = useState(false);
  const [outsideDays, setOutsideDays] = useState(true);
  const [hourCycle, setHourCycle] = useState<'h12' | 'h23'>('h23');
  const [density, setDensity] = useState<'compact' | 'comfortable'>('comfortable');
  const [descriptions, setDescriptions] = useState(false);
  const [divided, setDivided] = useState(true);
  const [interactive, setInteractive] = useState(true);
  const [wheelZoom, setWheelZoom] = useState(false);
  const [controls, setControls] = useState(true);
  const [placeList, setPlaceList] = useState(false);
  const [attributionDisplay, setAttributionDisplay] = useState<'inline' | 'popover'>('popover');
  const [focusPlace, setFocusPlace] = useState(false);
  const [renderingMode, setRenderingMode] = useState<'auto' | 'legacy' | 'custom'>('auto');
  const [boundaryViewport, setBoundaryViewport] = useState(true);
  const [terrainViewport, setTerrainViewport] = useState(true);
  const [reuseCanvas, setReuseCanvas] = useState(true);
  const [cacheBase, setCacheBase] = useState(true);
  const renderingCopy = mapRenderingCopy[locale];
  const rendering = renderingMode === 'custom' ? { boundaryViewport, terrainViewport, reuseCanvas, cacheBase } : renderingMode;
  const renderingCode = renderingMode === 'auto' ? '' : renderingMode === 'legacy'
    ? '\n  rendering="legacy"'
    : `\n  rendering={{ boundaryViewport: ${boundaryViewport}, terrainViewport: ${terrainViewport}, reuseCanvas: ${reuseCanvas}, cacheBase: ${cacheBase} }}`;
  const events: AgendaEvent[] = [
    { id: 'stay', title: t('湖畔住宿'), startMinute: -120, endMinute: 480, kind: 'stay', description: t('从前一天延续') },
    { id: 'walk', title: t('湖边散步'), startMinute: 540, endMinute: 630, kind: 'activity', description: t('沿湖步道') },
    { id: 'travel', title: t('前往山间小镇'), startMinute: 600, endMinute: 720, kind: 'travel', description: t('示例交通时段，非实际车程') },
    { id: 'meet', title: t('集合'), startMinute: 900, description: t('时点事件，不推断结束时间') },
    { id: 'free', title: t('自由活动'), description: t('时间待定') },
  ];
  const calendarEvents = showEvents ? Array.from({ length: 12 }, (_, index) => [
    { id: `walk-${index}`, date: new Date(2026, 9, 18 + index), label: t(index % 2 ? '前往山间小镇' : '湖边散步'), color: index % 2 ? '#87bbc0' : '#a7c7ad' },
    { id: `stay-${index}`, date: new Date(2026, 9, 18 + index), label: t('湖畔住宿'), color: '#c8c38f' },
  ]).flat() : [];
  const selectedEvent = events.find(event => event.id === selected);
  const agenda = <DayAgenda date={dateKey(date ?? initialDate)} events={empty ? [] : events} locale={locale} timeZoneLabel={t('当地时间 · 示例')} showOverview={showOverview} hourCycle={hourCycle} density={density} showDescriptions={descriptions} divided={divided} disabled={disabled} selectedEvent={selected} onEventSelect={event => setSelected(event.id)} emptyLabel={t('暂无安排')} untimedLabel={t('时间待定')} onPreviousDay={dateKey(date ?? initialDate) === '2026-10-22' ? () => setDate(initialDate) : undefined} onNextDay={dateKey(date ?? initialDate) === '2026-10-21' ? () => setDate(new Date(2026, 9, 22)) : undefined} navigationLabels={{ previous: t('前一天'), next: t('后一天') }} />;
  return <div className={`travel-examples travel-examples--${kind}`}>
    {kind === 'calendar' ? <>
      <ComponentPlayground code={`<Calendar appearance="${calendarAppearance}" mode="${mode}" ${mode === 'single' ? 'selected={date} onSelect={setDate}' : 'selected={range} onSelect={setRange}'}
  ${calendarAppearance === 'itinerary' ? 'displayRange={{ from: new Date(2026, 9, 18), to: new Date(2026, 9, 29) }}\n  startMonth={new Date(2026, 9)} endMonth={new Date(2026, 9)}\n  onEventSelect={event => { setDate(event.date); setSelected(event.label); }}' : ''}
  defaultMonth={new Date(2026, 9)} weekStartsOn={${weekStart}}
  fixedWeeks numberOfMonths={${months}} showWeekNumber={${weekNumbers}} showOutsideDays={${outsideDays}}
  eventIndicator="${indicator}"
  events={${showEvents ? 'calendarEvents' : '[]'}}${disabled ? '\n  disabled={{ dayOfWeek: [0, 6] }}' : ''} />`} controls={<PropertyTabs groups={[
      { label: '基础', content: <>
        <DocsSelect label="选择模式" value={mode} onValueChange={setMode} options={[["single", "单日"], ["range", "日期范围"]]} />
        <DocsSelect label="日历外观" value={calendarAppearance} onValueChange={value => setCalendarAppearance(value as typeof calendarAppearance)} options={[["itinerary", "行程日历"], ["picker", "日期选择器"]]} />
        <DocsSelect label="每周起始日" value={weekStart} onValueChange={setWeekStart} options={[["1", "周一"], ["0", "周日"]]} />
      </> },
      { label: '布局', content: <>
        {calendarAppearance === 'picker' && <><DocsSelect label="标记样式" value={indicator} onValueChange={value => setIndicator(value as typeof indicator)} options={[["count", "数量"], ["dot", "圆点"], ["none", "隐藏"]]} />
        <DocsSelect label="显示月份数" value={months} onValueChange={setMonths} options={[["1", "1"], ["2", "2"]]} /></>}
        <Switch label={t('显示周数')} checked={weekNumbers} onCheckedChange={setWeekNumbers} />
        <Switch label={t('显示相邻月日期')} checked={outsideDays} onCheckedChange={setOutsideDays} />
      </> },
      { label: '状态', content: <>
        <Switch label={t('事件标记')} checked={showEvents} onCheckedChange={setShowEvents} />
        <Switch label={t('禁用周末')} checked={disabled} onCheckedChange={setDisabled} />
      </> },
    ]} />}>
        <Calendar appearance={calendarAppearance} displayRange={calendarAppearance === 'itinerary' ? { from: new Date(2026, 9, 18), to: new Date(2026, 9, 29) } : undefined} startMonth={calendarAppearance === 'itinerary' ? initialDate : undefined} endMonth={calendarAppearance === 'itinerary' ? initialDate : undefined} {...(mode === 'single' ? { mode: 'single' as const, selected: date, onSelect: setDate } : { mode: 'range' as const, selected: range, onSelect: setRange, excludeDisabled: true })} onEventSelect={event => { setDate(event.date); setSelected(event.label); }} defaultMonth={initialDate} fixedWeeks numberOfMonths={Number(months)} showWeekNumber={weekNumbers} showOutsideDays={outsideDays} eventIndicator={indicator} events={calendarEvents} locale={locale === 'en' ? enUS : zhCN} weekStartsOn={Number(weekStart) as 0 | 1} disabled={disabled ? { dayOfWeek: [0, 6] } : undefined} />
      </ComponentPlayground>
      <div role="status">{selected}</div>
      <ComponentExample id="travel-daily-agenda" title="按日查看" code={`<Calendar mode="single" selected={date} onSelect={setDate} />\n<DayAgenda date={dateKey(date)} events={eventsByDate[dateKey(date)] ?? []} />`}>
        <DayAgenda date={dateKey(date ?? initialDate)} events={date?.getDate() === 21 && date.getMonth() === 9 && date.getFullYear() === 2026 ? events : []} locale={locale} emptyLabel={t('暂无安排')} untimedLabel={t('时间待定')} />
      </ComponentExample>
    </> : kind === 'day-agenda' ? <>
      <ComponentPlayground code={`<DayAgenda date="${dateKey(date ?? initialDate)}" locale="${locale}"
  events={${empty ? '[]' : JSON.stringify(events, null, 2)}}
  showOverview={${showOverview}} selectedEvent={${JSON.stringify(selected)}}
  hourCycle="${hourCycle}" density="${density}" showDescriptions={${descriptions}}
  divided={${divided}} disabled={${disabled}}
  onPreviousDay={${dateKey(date ?? initialDate) === '2026-10-22' ? '() => setDate(new Date(2026, 9, 21))' : 'undefined'}}
  onNextDay={${dateKey(date ?? initialDate) === '2026-10-21' ? '() => setDate(new Date(2026, 9, 22))' : 'undefined'}}
  onEventSelect={event => setSelected(event.id)} />`} controls={<PropertyTabs groups={[
      { label: '基础', content: <>
        <DocsSelect label="日期" value={dateKey(date ?? initialDate)} onValueChange={value => { setDate(new Date(`${value}T12:00:00`)); setSelected(''); }} options={[["2026-10-21", "2026-10-21"], ["2026-10-22", "2026-10-22"]]} />
        <DocsSelect label="时间格式" value={hourCycle} onValueChange={value => setHourCycle(value as typeof hourCycle)} options={[["h23", "24 小时"], ["h12", "12 小时"]]} />
        <DocsSelect label="内容密度" value={density} onValueChange={value => setDensity(value as typeof density)} options={[["comfortable", "舒适"], ["compact", "紧凑"]]} />
      </> },
      { label: '内容', content: <>
        <Switch label={t('时间分布')} checked={showOverview} onCheckedChange={setOverview} />
        <Switch label={t('显示事件说明')} checked={descriptions} onCheckedChange={setDescriptions} />
        <Switch label={t('事件分割线')} checked={divided} onCheckedChange={setDivided} />
      </> },
      { label: '状态', content: <>
        <Switch label={t('空状态')} checked={empty} onCheckedChange={setEmpty} />
        <Switch label={t('禁用')} checked={disabled} onCheckedChange={setDisabled} />
      </> },
    ]} />}>{agenda}</ComponentPlayground>
      <div role="status" className="travel-examples__detail"><PencilText>{selectedEvent && !empty ? `${selectedEvent.title} · ${selectedEvent.description}` : t('未选择事件')}</PencilText></div>
    </> : <>
      <ComponentPlayground code={`<JourneyMap places={places} geography={geography} landCover={landCover} water={water}
  height={600} selectedPlace="${place}" attributionDisplay="${attributionDisplay}"
  interactive={${interactive}} scrollWheelZoom={${wheelZoom}}
  showControls={${controls}} showPlaceList={${placeList}} focusSelectedPlace={${focusPlace}}
  onPlaceSelect={place => setPlace(place.id)}${renderingCode}
  attribution="Natural Earth (public domain); ESA WorldCover 2021 (CC BY 4.0). Contains modified Copernicus Sentinel data (2021), processed by ESA WorldCover consortium." />`} controls={<PropertyTabs groups={[
      { label: '基础', content: <>
        <DocsSelect label="地点" value={place} onValueChange={setPlace} options={places.map(item => [item.id, item.label] as const)} />
        <DocsSelect label="来源显示" value={attributionDisplay} onValueChange={value => setAttributionDisplay(value as typeof attributionDisplay)} options={[["inline", "正文"], ["popover", "信息按钮"]]} />
        <Switch label={t('地图工具栏')} checked={controls} onCheckedChange={setControls} />
        <Switch label={t('地点列表')} checked={placeList} onCheckedChange={setPlaceList} />
      </> },
      { label: '交互', content: <>
        <Switch label={t('地图手势')} checked={interactive} onCheckedChange={setInteractive} />
        <Switch label={t('滚轮缩放')} checked={wheelZoom} onCheckedChange={setWheelZoom} />
        <Switch label={t('跟随选中地点')} checked={focusPlace} onCheckedChange={setFocusPlace} />
      </> },
      { label: renderingCopy.tab, content: <>
        <DocsSelect label={renderingCopy.mode} value={renderingMode} onValueChange={value => setRenderingMode(value as typeof renderingMode)} options={[["auto", renderingCopy.auto], ["legacy", renderingCopy.legacy], ["custom", renderingCopy.custom]]} />
        {renderingMode === 'custom' && <>
          <Switch label={renderingCopy.boundary} checked={boundaryViewport} onCheckedChange={setBoundaryViewport} />
          <Switch label={renderingCopy.terrain} checked={terrainViewport} onCheckedChange={setTerrainViewport} />
          <Switch label={renderingCopy.canvas} checked={reuseCanvas} onCheckedChange={setReuseCanvas} />
          <Switch label={renderingCopy.cache} checked={cacheBase} onCheckedChange={setCacheBase} />
        </>}
      </> },
    ]} />}>
        <JourneyMap places={places} geography={geography} landCover={landCover} water={water} rendering={rendering} height={600} interactive={interactive} scrollWheelZoom={wheelZoom} showControls={controls} showPlaceList={placeList} focusSelectedPlace={focusPlace} selectedPlace={place} onPlaceSelect={item => setPlace(item.id)} attributionDisplay={attributionDisplay} attribution="Natural Earth (public domain) · ESA WorldCover 2021 (CC BY 4.0). Contains modified Copernicus Sentinel data (2021), processed by ESA WorldCover consortium." aria-label={t('行程地图')} labels={{ zoomIn: t('放大'), zoomOut: t('缩小'), reset: t('复位视图'), unavailable: t('地图不可用，请使用地点列表'), attribution: t('地图来源') }} />
      </ComponentPlayground>
      <div role="status" className="travel-examples__detail"><PencilText>{places.find(item => item.id === place)?.label ?? ''}</PencilText></div>
      <StreetMapExample />
      <ComponentExample id="journey-map-rendering" title={renderingCopy.title} code={`// auto is the default. Override only the options needed for this map.
<JourneyMap places={places} geography={geography} landCover={landCover} water={water}
  rendering={{ cacheBase: false }}
  attribution={attribution} />

// Use the original rendering path for comparison.
<JourneyMap places={places} geography={geography} landCover={landCover} water={water}
  rendering="legacy"
  attribution={attribution} />`}>
        <PencilText as="p">{renderingCopy.defaults}</PencilText>
        <PencilText as="p">{renderingCopy.switches}</PencilText>
        <PencilText as="p">{renderingCopy.invalidation}</PencilText>
        <PencilText as="p">{renderingCopy.budget}</PencilText>
        <PencilText as="p">{renderingCopy.validation}</PencilText>
      </ComponentExample>
    </>}
  </div>;
}
