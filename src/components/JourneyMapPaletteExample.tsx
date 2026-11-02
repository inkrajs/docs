import { useEffect, useRef, useState } from 'react';
import { JourneyMap, type JourneyMapPalette } from '@inkra/react';
import { useLocale } from '../i18n';
import { ComponentExample } from './ComponentExample';
import { JourneyMapPaletteEditor, mapPalettePresets } from './JourneyMapPaletteEditor';
import { streetGeography, streetLandCover, streetStops } from '../data/street-map';

export function JourneyMapPaletteExample() {
 const { t } = useLocale(); const host = useRef<HTMLDivElement>(null); const [visible, setVisible] = useState(false);
 const [palette, setPalette] = useState<JourneyMapPalette>(mapPalettePresets.cool);
 useEffect(() => {
  if (!host.current) return;
  const observer = new IntersectionObserver(entries => { if (entries.some(entry => entry.isIntersecting)) { setVisible(true); observer.disconnect(); } }, { rootMargin: '120px' });
  observer.observe(host.current); return () => observer.disconnect();
 }, []);
 return <ComponentExample id="journey-map-palette" title={t('底图配色方案', 'Base-map palettes')} code={`<JourneyMap places={places} geography={streets} landCover={buildings}
  palette={${JSON.stringify(palette, null, 2)}}
  background="paper" maxFitZoom={18} height={440}
  attribution="© OpenStreetMap contributors · ODbL" />`}>
  <div ref={host} className="journey-palette-example">
   <div className="journey-palette-example__map">{visible && <JourneyMap places={streetStops} geography={streetGeography} landCover={streetLandCover}
    palette={palette} background="paper" maxFitZoom={18} height={440} attributionDisplay="popover"
    attribution="© OpenStreetMap contributors · ODbL · Historical snapshot (2012)" />}</div>
   <JourneyMapPaletteEditor value={palette} onValueChange={setPalette} />
  </div>
 </ComponentExample>;
}
