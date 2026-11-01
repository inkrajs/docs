import { useEffect, useRef, useState } from 'react';
import { JourneyMap } from '@inkra/react';
import { useLocale } from '../i18n';
import type { DocsLocale } from '../docsLocales';
import { ComponentExample } from './ComponentExample';
import { streetGeography, streetLandCover, streetStops, streetReference } from '../data/street-map';

const titles: Record<DocsLocale, string> = {
  'zh-CN': '真实街区 · 摩纳哥', en: 'Real streets · Monaco', ja: '実際の街区 · モナコ',
  ko: '실제 거리 · 모나코', fr: 'Rues réelles · Monaco',
};

const code = `// Historical OpenStreetMap excerpt: surface streets and building footprints.
// GeoJSON coordinates use [longitude, latitude].
// JourneyPlace and JourneyRoute use latitude, longitude.
<div className="street-map-example__map">
<JourneyMap
  places={streetStops}
  geography={streetGeography}
  landCover={streetLandCover}
  maxFitZoom={18}
  height={460}
  selectedPlace={selected}
  onPlaceSelect={place => setSelected(place.id)}
  background="paper"
  attributionDisplay="popover"
  scrollWheelZoom={false}
  attribution="© OpenStreetMap contributors · ODbL · Historical snapshot (2012)"
/>
<a className="street-map-example__credit" href="https://www.openstreetmap.org/copyright">
  © OpenStreetMap contributors
</a>
</div>`;

export function StreetMapExample() {
  const { locale } = useLocale();
  const title = titles[locale];
  const [selected, setSelected] = useState<string>('grimaldi');
  const [visible, setVisible] = useState(false);
  const host = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!host.current || typeof IntersectionObserver === 'undefined') { setVisible(true); return; }
    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) { setVisible(true); observer.disconnect(); }
    }, { rootMargin: '160px' });
    observer.observe(host.current);
    return () => observer.disconnect();
  }, []);
  return <ComponentExample id="journey-map-streets" title={title} code={code}>
    <div className="street-map-example" ref={host}>
      <div className="street-map-example__map">
        {visible && <JourneyMap places={streetStops} geography={streetGeography} landCover={streetLandCover}
          maxFitZoom={18} height={460}
          selectedPlace={selected} onPlaceSelect={place => setSelected(place.id)}
          background="paper" attributionDisplay="popover"
          scrollWheelZoom={false} attribution="© OpenStreetMap contributors · ODbL · Historical snapshot (2012)" aria-label={title} />}
        <a className="street-map-example__credit" href={streetReference.licenseUrl} target="_blank" rel="noreferrer">© OpenStreetMap contributors</a>
      </div>
    </div>
  </ComponentExample>;
}
