import { useState } from 'react';
import { Button, defaultJourneyMapPalette, type JourneyMapPalette, type JourneyMapPaletteColors, type JourneyMapPigment } from '@inkra/react';
import { PencilText, useLocale } from '../i18n';
import { DocsSelect } from './DocsSelect';
import { DocsColorControl } from './DocsAppearanceControls';

export const mapPalettePresets: Record<string, JourneyMapPalette> = {
  default: {},
  sepia: {
    background: '#f2e6ce', landBase: '#f6ecd6', boundary: '#8b7353', road: '#9c8159', sea: { fill: '#ede5d5', stroke: '#a99474' },
    terrain: { land: { fill: '#e2c99d', stroke: '#9a7c50' }, forest: { fill: '#b5bb95', stroke: '#6b7950' }, water: { fill: '#b3c5bd', stroke: '#698b84' }, urban: { fill: '#d8b797', stroke: '#987052' } },
    dark: { background: '#211e18', landBase: '#2d261e', boundary: '#c1ac8e', road: '#cab797', sea: { fill: '#1c211f', stroke: '#8eaa9c' },
      terrain: { land: { fill: '#786446', stroke: '#b9a17c' }, forest: { fill: '#536446', stroke: '#a0b089' }, water: { fill: '#46615d', stroke: '#8eb4aa' }, urban: { fill: '#70513e', stroke: '#ba987b' } } },
  },
  cool: {
    background: '#eaf1f2', landBase: '#f0f4f2', boundary: '#6b858b', road: '#617f91', sea: { fill: '#e1edf1', stroke: '#7ea8ba' },
    terrain: { land: { fill: '#cbd7ce', stroke: '#839b8c' }, forest: { fill: '#a0beb5', stroke: '#537f75' }, water: { fill: '#94bed0', stroke: '#507f9a' }, urban: { fill: '#bfc8d1', stroke: '#718598' } },
    dark: { background: '#182127', landBase: '#202d31', boundary: '#9db5bd', road: '#aac4d1', sea: { fill: '#17262e', stroke: '#7ea8ba' },
      terrain: { land: { fill: '#4c6764', stroke: '#a7c3ba' }, forest: { fill: '#3a6157', stroke: '#88b6a7' }, water: { fill: '#36566a', stroke: '#85b4cf' }, urban: { fill: '#4c586d', stroke: '#a2b2cd' } } },
  },
};
const parts = [
 ['background', '画布背景', 'Canvas background'], ['landBase', '陆地底色', 'Land underpainting'], ['sea', '海洋', 'Ocean'],
 ['land', '陆地', 'Land'], ['forest', '森林', 'Forest'], ['crop', '农田', 'Cropland'], ['shrub', '灌木', 'Shrubland'],
 ['bare', '山地与裸地', 'Bare ground'], ['snow', '积雪', 'Snow'], ['wetland', '湿地', 'Wetland'], ['urban', '建筑与城区', 'Buildings'],
 ['water', '河流与湖泊', 'Rivers and lakes'], ['road', '道路', 'Roads'], ['boundary', '边界与轮廓', 'Boundaries'],
] as const;
export function JourneyPalettePreset({ value, onValueChange }: { value: JourneyMapPalette; onValueChange: (palette: JourneyMapPalette) => void }) {
 const { t } = useLocale();
 const preset = Object.keys(mapPalettePresets).find(key => JSON.stringify(mapPalettePresets[key]) === JSON.stringify(value)) ?? 'custom';
 return <DocsSelect presentation="radio" label={t('配色风格', 'Map palette')} value={preset} onValueChange={key => { if (key !== 'custom') onValueChange(mapPalettePresets[key]); }}
  options={[["default", t('原始彩铅', 'Original')], ["sepia", t('暖调手账', 'Warm journal')], ["cool", t('冷调蓝灰', 'Cool blue')], ...(preset === 'custom' ? [["custom", t('自定义', 'Custom')] as const] : [])]} />;
}
export function JourneyMapPaletteEditor({ value, onValueChange }: { value: JourneyMapPalette; onValueChange: (palette: JourneyMapPalette) => void }) {
 const { t } = useLocale(); const [scope, setScope] = useState('base'), [part, setPart] = useState('land');
 const current: JourneyMapPaletteColors = scope === 'dark' ? value.dark ?? {} : value;
 const scalar = ['background', 'landBase', 'road', 'boundary'].includes(part);
 const entry = scalar ? {} : part === 'sea' ? current.sea ?? {} : current.terrain?.[part] ?? {};
 const defaults = part === 'sea' ? defaultJourneyMapPalette.sea : defaultJourneyMapPalette.terrain[part] ?? defaultJourneyMapPalette.terrain.land;
 const parentEntry = part === 'sea' ? value.sea ?? {} : value.terrain?.[part] ?? {};
 const fill = parentEntry.fill ?? defaults.fill;
 const fallback = (field: 'fill' | 'stroke') => scope === 'dark' ? parentEntry[field] ?? (field === 'stroke' && part !== 'sea' ? fill : defaults[field]) : defaults[field];
 const caption = scope === 'dark' ? t('继承基础方案', 'Inherit base palette') : t('使用默认颜色', 'Use default color');
 const update = (field: 'fill' | 'stroke' | 'scalar', color: string) => {
  const next = { ...current };
  if (field === 'scalar') {
   const key = part as 'background' | 'landBase' | 'road' | 'boundary';
   if (color === 'auto') delete next[key]; else next[key] = color;
  } else {
   const pigment: JourneyMapPigment = { ...entry };
   if (color === 'auto') delete pigment[field]; else pigment[field] = color;
   if (part === 'sea') { if (Object.keys(pigment).length) next.sea = pigment; else delete next.sea; }
   else { next.terrain = { ...next.terrain, [part]: pigment }; if (!Object.keys(pigment).length) { const terrain = { ...next.terrain }; delete terrain[part]; if (Object.keys(terrain).length) next.terrain = terrain; else delete next.terrain; } }
  }
  if (scope === 'dark') { const result = { ...value }; if (Object.keys(next).length) result.dark = next; else delete result.dark; onValueChange(result); }
  else onValueChange(next);
 };
 const scalarKey = part as 'background' | 'landBase' | 'road' | 'boundary';
 const scalarFallback = (scope === 'dark' ? value[scalarKey] : undefined) ?? (part === 'background' ? 'var(--inkra-paper)' : part === 'landBase' ? scope === 'dark' ? '#191d1e' : '#fdfcf8' : 'var(--inkra-border-strong)');
 return <div className="journey-palette-editor">
  <JourneyPalettePreset value={value} onValueChange={onValueChange} />
  <DocsSelect presentation="radio" label={t('配置范围', 'Palette scope')} value={scope} onValueChange={setScope} options={[["base", t('基础配色', 'Base colors')], ["dark", t('深色覆写', 'Dark overrides')]]} />
  <DocsSelect label={t('编辑图层', 'Edit map layer')} value={part} onValueChange={setPart} options={parts.map(([id, zh, en]) => [id, t(zh, en)] as const)} />
  {scalar ? <DocsColorControl label={t('图层颜色', 'Layer color')} value={current[scalarKey] ?? 'auto'} onValueChange={color => update('scalar', color)} defaultColor={scalarFallback} defaultLabel={caption} /> : <>
   <DocsColorControl label={t('填色', 'Fill color')} value={entry.fill ?? 'auto'} onValueChange={color => update('fill', color)} defaultColor={fallback('fill')} defaultLabel={caption} />
   <DocsColorControl label={t('笔触颜色', 'Stroke color')} value={entry.stroke ?? 'auto'} onValueChange={color => update('stroke', color)} defaultColor={fallback('stroke')} defaultLabel={caption} />
  </>}
  <PencilText className="journey-palette-editor__hint">{t('只修改当前提供的图层；深色覆写仅在深色主题下生效。', 'Only supplied layers are drawn. Dark overrides apply in a dark theme.')}</PencilText>
  <Button variant="ghost" onClick={() => onValueChange({})}>{t('恢复原始配色', 'Restore original palette')}</Button>
 </div>;
}
