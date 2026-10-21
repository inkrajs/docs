import { useState } from 'react';
import { Calendar, JourneyMap, type JourneyPlace } from 'inkra';
import { enUS, zhCN } from 'react-day-picker/locale';
import type { GeoJsonObject } from 'geojson';
import { useLocale } from '../i18n';
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

export function HomeMap() {
  const { locale } = useLocale();
  const [selected, setSelected] = useState('lake');
  const english = locale === 'en';
  return <section className="home-map" aria-label={english ? 'Map example' : '地图示例'}>
    <JourneyMap places={places} geography={geography} landCover={landCover} water={water}
      height={420} selectedPlace={selected} onPlaceSelect={place => setSelected(place.id)}
      showPlaceList={false} attributionDisplay="popover" scrollWheelZoom={false} aria-label={english ? 'New Zealand map' : '新西兰地图'}
      labels={{ zoomIn: english ? 'Zoom in' : '放大', zoomOut: english ? 'Zoom out' : '缩小', reset: english ? 'Reset view' : '复位视图', unavailable: english ? 'Map unavailable; use the place list' : '地图不可用，请使用地点列表', attribution: english ? 'Map credits' : '地图来源' }}
      attribution="Natural Earth (public domain) · ESA WorldCover 2021 (CC BY 4.0). Contains modified Copernicus Sentinel data (2021), processed by ESA WorldCover consortium." />
  </section>;
}

export function HomeCalendar() {
  const { locale } = useLocale();
  const [selected, setSelected] = useState<Date | undefined>(new Date(2026, 9, 21));
  const english = locale === 'en';
  return <section className="home-calendar" aria-label={english ? 'Calendar example' : '日历示例'}>
    <Calendar appearance="itinerary" mode="single" selected={selected} onSelect={setSelected}
      defaultMonth={new Date(2026, 9, 21)} locale={english ? enUS : zhCN} weekStartsOn={1} showOutsideDays={false} />
  </section>;
}
