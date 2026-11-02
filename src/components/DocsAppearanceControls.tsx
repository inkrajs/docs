import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { Button, CircularSlider, ColorPicker, ColorSwatch, Editable, PencilText, Popover } from '@inkra/react';
import { __iconData as plusIcon } from 'lucide-react/dist/esm/icons/plus.mjs';
import { DocsIcon } from './DocsIcon';
import { useLocale } from '../i18n';
import { normalizeThemeColor, rememberCustomColor, themeScales } from './themeColors';
import './DocsAppearanceControls.css';

/** Reuse for color parameters: a theme default, real pigment swatches and custom colors. */
export function DocsColorControl({ label, value, onValueChange, defaultColor = 'var(--inkra-paper)', defaultLabel }: {
  label: string; value: string; onValueChange: (value: string) => void; defaultColor?: string; defaultLabel: string;
}) {
  const { t } = useLocale();
  const [open, setOpen] = useState(false);
  const [customColors, setCustomColors] = useState<string[]>([]);
  const [pickerColor, setPickerColor] = useState('#ffffff');
  const presets = themeScales.map(scale => ({ color: scale.values[6][1], label: t(scale.label) }));
  const custom = rememberCustomColor(customColors, value).filter(color => !presets.some(preset => preset.color === color));
  return <div className="docs-color-control">
    <PencilText>{label}</PencilText>
    <div className="docs-color-control__swatches" role="group" aria-label={label}>
      <ColorSwatch color={defaultColor} label={defaultLabel} selected={value === 'auto'} onClick={() => onValueChange('auto')} />
      {presets.map(preset => <ColorSwatch key={preset.color} {...preset} selected={value === preset.color} onClick={() => onValueChange(preset.color)} />)}
      {custom.map(color => <ColorSwatch key={color} color={color} label={`${t('自定义颜色', 'Custom color')} ${color}`} selected={value === color} onClick={() => onValueChange(color)} />)}
      <Popover.Root open={open} onOpenChange={next => { if (next) setPickerColor(normalizeThemeColor(value) ?? '#ffffff'); else setCustomColors(previous => rememberCustomColor(previous, pickerColor)); setOpen(next); }}>
        <Popover.Trigger asChild><Button size="icon" variant="outline" aria-label={t('添加自定义颜色', 'Add custom color')}><DocsIcon data={plusIcon} size={22} /></Button></Popover.Trigger>
        <Popover.Portal><Popover.Content className="docs-color-control__popover" side="top" align="end" sideOffset={8} collisionPadding={12} aria-label={label} aria-describedby={undefined}>
          <ColorPicker presentation="compact" showAlpha={false} label={label} value={pickerColor}
            labels={{ palette: t('调色板', 'Color palette'), value: t('颜色值', 'Color value'), invalid: t('请输入有效的颜色值', 'Enter a valid color') }}
            onValueChange={next => { const color = normalizeThemeColor(next); if (!color) return; setPickerColor(color); onValueChange(color); }} />
        </Popover.Content></Popover.Portal>
      </Popover.Root>
    </div>
  </div>;
}

/** Continuous values use a dial; click its caption for precise entry outside the inert center. */
export function DocsNumberControl({ label, value, onValueChange, min, max, step = 1, unit = '', disabled = false, icon, expandable = false }: {
  label: string; value: number; onValueChange: (value: number) => void; min: number; max: number; step?: number; unit?: string; disabled?: boolean; icon?: ReactNode; expandable?: boolean;
}) {
  const { t } = useLocale();
  const [draft, setDraft] = useState(String(value));
  useEffect(() => { setDraft(String(value)); }, [value]);
  const valid = (text: string) => text.trim() !== '' && Number.isFinite(Number(text)) && Number(text) >= min && (expandable || Number(text) <= max);
  const format = (number: number) => `${Number(number.toFixed(3))}${unit}`;
  return <div className="docs-number-control">
    <CircularSlider size="sm" diameter={120} aria-label={label} min={min} max={expandable ? Math.max(max, value) : max} step={step} value={value} disabled={disabled}
      centerIcon={icon} getValueLabel={format} onValueChange={onValueChange} />
    <Editable aria-label={label} className="docs-number-control__caption" value={draft} onValueChange={setDraft} disabled={disabled} display={<PencilText ellipsis title={label}>{label}</PencilText>}
      startEditingLabel={`${t('编辑数值', 'Edit value')}: ${label}`} inputProps={{ type: 'number', min, max: expandable ? undefined : max, step, 'aria-label': label }}
      validate={text => valid(text)} onSave={text => { if (!valid(text)) return false; onValueChange(Number((min + Math.round((Number(text) - min) / step) * step).toFixed(8))); }} />
  </div>;
}
