import { PropertyTabs } from './PropertyTabs';
import { useState } from 'react';
import { Calendar, DayAgenda, JourneyMap, Switch, type AgendaEvent, type JourneyPlace } from '@inkra/react';
import { enUS, zhCN } from 'react-day-picker/locale';
import type { DateRange } from 'react-day-picker';
import type { GeoJsonObject } from 'geojson';
import { useLocale, PencilText } from '../i18n';
import { DocsSelect } from './DocsSelect';
import { ComponentPlayground } from './ComponentPlayground';
import { ComponentExample } from './ComponentExample';
import './TravelExamples.css';
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
const initialDate = new Date(2026, 9, 21);
const dateKey = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

export function TravelExamples({ kind }: { kind: 'calendar' | 'day-agenda' | 'journey-map' }) {
  const { t, locale } = useLocale();
  const [date, setDate] = useState<Date | undefined>(initialDate);
  const [range, setRange] = useState<DateRange | undefined>({ from: initialDate, to: new Date(2026, 9, 24) });
  const [mode, setMode] = useState('single');
  const [showEvents, setShowEvents] = useState(true);
  const [showOverview, setOverview] = useState(true);
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
  const [descriptions, setDescriptions] = useState(true);
  const [divided, setDivided] = useState(true);
  const [interactive, setInteractive] = useState(true);
  const [wheelZoom, setWheelZoom] = useState(false);
  const [controls, setControls] = useState(true);
  const [placeList, setPlaceList] = useState(false);
  const [attributionDisplay, setAttributionDisplay] = useState<'inline' | 'popover'>('inline');
  const [focusPlace, setFocusPlace] = useState(false);
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
      <ComponentExample title="按日查看" code={`<Calendar mode="single" selected={date} onSelect={setDate} />\n<DayAgenda date={dateKey(date)} events={eventsByDate[dateKey(date)] ?? []} />`}>
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
  onPlaceSelect={place => setPlace(place.id)}
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
    ]} />}>
        <JourneyMap places={places} geography={geography} landCover={landCover} water={water} height={600} interactive={interactive} scrollWheelZoom={wheelZoom} showControls={controls} showPlaceList={placeList} focusSelectedPlace={focusPlace} selectedPlace={place} onPlaceSelect={item => setPlace(item.id)} attributionDisplay={attributionDisplay} attribution="Natural Earth (public domain) · ESA WorldCover 2021 (CC BY 4.0). Contains modified Copernicus Sentinel data (2021), processed by ESA WorldCover consortium." aria-label={t('行程地图')} labels={{ zoomIn: t('放大'), zoomOut: t('缩小'), reset: t('复位视图'), unavailable: t('地图不可用，请使用地点列表'), attribution: t('地图来源') }} />
      </ComponentPlayground>
      <div role="status" className="travel-examples__detail"><PencilText>{places.find(item => item.id === place)?.label ?? ''}</PencilText></div>
    </>}
  </div>;
}
