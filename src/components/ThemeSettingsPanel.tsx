import { useEffect, useId, useMemo, useState } from 'react';
import { Button, CircularSlider, ColorPicker, ColorSwatch, Popover, PencilLine, RadioGroup, RadioGroupItem, Switch, Tabs } from '@inkra/react';
import type { InkraTheme } from '@inkra/react/theme';
import { DocsIcon, type LucideIconData } from './DocsIcon';
import { themeScales } from './ColorSystem';
import { customPaletteId, normalizeThemeColor, rememberCustomColor } from './themeColors';
import { PencilText, useLocale } from '../i18n';
import { themeRenderControls as controls } from './themeControls';
import { FontPicker } from './FontPicker';
import { fontRender } from './themeFonts';
import type { ThemeDraftEditor } from './useThemeDraft';
import './ThemeSettingsPanel.css';
import { __iconData as paletteIcon } from 'lucide-react/dist/esm/icons/palette.mjs';
import { __iconData as typeIcon } from 'lucide-react/dist/esm/icons/type.mjs';
import { __iconData as penIcon } from 'lucide-react/dist/esm/icons/pen-line.mjs';
import { __iconData as resetIcon } from 'lucide-react/dist/esm/icons/rotate-ccw.mjs';
import { __iconData as brushIcon } from 'lucide-react/dist/esm/icons/paintbrush.mjs';
import { __iconData as monitorIcon } from 'lucide-react/dist/esm/icons/monitor.mjs';
import { __iconData as sunIcon } from 'lucide-react/dist/esm/icons/sun.mjs';
import { __iconData as moonIcon } from 'lucide-react/dist/esm/icons/moon.mjs';
import { __iconData as pressureIcon } from 'lucide-react/dist/esm/icons/pen-tool.mjs';
import { __iconData as breaksIcon } from 'lucide-react/dist/esm/icons/scissors.mjs';
import { __iconData as outlineIcon } from 'lucide-react/dist/esm/icons/circle-dashed.mjs';
import { __iconData as fillIcon } from 'lucide-react/dist/esm/icons/paint-bucket.mjs';
import { __iconData as grainIcon } from 'lucide-react/dist/esm/icons/sparkles.mjs';
import { __iconData as wavesIcon } from 'lucide-react/dist/esm/icons/waves-horizontal.mjs';
import { __iconData as spacingIcon } from 'lucide-react/dist/esm/icons/align-horizontal-space-between.mjs';
import { __iconData as angleIcon } from 'lucide-react/dist/esm/icons/angle.mjs';
import { __iconData as plusIcon } from 'lucide-react/dist/esm/icons/plus.mjs';

const controlIcons = {
  variation: pressureIcon,
  breaks: breaksIcon,
  outline: outlineIcon,
  fill: fillIcon,
  grain: grainIcon,
  width: penIcon,
  roughness: wavesIcon,
  washStrength: brushIcon,
  washSpacing: spacingIcon,
  washRoughness: wavesIcon,
  washAngle: angleIcon,
} satisfies Record<typeof controls[number]['key'], LucideIconData>;
const formatControlValue = (value: number) => value.toFixed(2);

export function ThemeSettingsPanel({ editor, active = true }: { editor: ThemeDraftEditor; active?: boolean }) {
  const { t } = useLocale();
  const { draft, setDraft, previewRender, setPreviewRender, draftTheme, setDraftTheme, tab, setTab,
    fontBusy, fontError, selectFont, resetFont, resetVersion } = editor;
  const modeName = useId();
  const currentFontRender = useMemo(() => fontRender(previewRender), [previewRender]);
  const [colorPickerOpen, setColorPickerOpen] = useState(false);
  const [pickerColor, setPickerColor] = useState('#8b6f91');
  const selectedCustomColor = draft.palette.startsWith('custom:') ? normalizeThemeColor(draft.palette.slice(7)) : null;
  const visibleCustomColors = selectedCustomColor ? rememberCustomColor(draft.customColors, selectedCustomColor) : draft.customColors;
  useEffect(() => { if (!active) setColorPickerOpen(false); }, [active]);
  useEffect(() => { setColorPickerOpen(false); }, [resetVersion]);
  return (
    <Tabs.Root className="theme-customizer__tabs theme-settings-panel" value={tab} onValueChange={setTab}>
      <Tabs.List fullWidth aria-label={t("定制分类", "Theme settings")}>
        <Tabs.Trigger value="theme" startIcon={<DocsIcon data={paletteIcon} size={22} />}>{t("主题", "Theme")}</Tabs.Trigger>
        <Tabs.Trigger value="text" startIcon={<DocsIcon data={typeIcon} size={22} />}>{t("文字", "Text")}</Tabs.Trigger>
        <Tabs.Trigger value="lines" startIcon={<DocsIcon data={penIcon} size={22} />}>{t("线条", "Lines")}</Tabs.Trigger>
        <Tabs.Trigger value="wash" startIcon={<DocsIcon data={brushIcon} size={22} />}>{t("涂色", "Fill")}</Tabs.Trigger>
      </Tabs.List>
      <PencilLine className="theme-customizer__tabs-divider" seed="customizer-tabs-bottom" aria-hidden="true" />
      <Tabs.Content value="theme" className="theme-customizer__panel">
        <RadioGroup className="theme-customizer__mode" name={modeName} label={t('主题模式')} variant="segmented" orientation="horizontal" value={draftTheme} onValueChange={value => setDraftTheme(value as InkraTheme)}>
          <RadioGroupItem value="auto" label={t("系统", "System")} icon={<DocsIcon data={monitorIcon} size={24} />} />
          <RadioGroupItem value="light" label={t("浅色", "Light")} icon={<DocsIcon data={sunIcon} size={24} />} />
          <RadioGroupItem value="dark" label={t("深色", "Dark")} icon={<DocsIcon data={moonIcon} size={24} />} />
        </RadioGroup>
        <PencilText as="h3">{t("主题色", "Accent color")}</PencilText>
        <div className="theme-customizer__swatches" role="group" aria-label={t("主题色", "Accent color")}>
          {[{ id: 'default', label: '默认', color: 'var(--inkra-ink)' }, ...themeScales.map(scale => ({ id: scale.id, label: scale.label, color: scale.values[6][1] }))].map(scale => <ColorSwatch key={scale.id} color={scale.color} label={scale.id === 'default' ? t("默认", "Default") : t(scale.label)} selected={draft.palette === scale.id} onClick={() => setDraft(previous => ({ ...previous, palette: scale.id }))} />)}
          {visibleCustomColors.map(color => <ColorSwatch key={color} color={color}
            label={`${t('自定义颜色', 'Custom color')} ${color}`} selected={draft.palette === customPaletteId(color)}
            onClick={() => setDraft(previous => ({ ...previous, palette: customPaletteId(color) }))} />)}
          <Popover.Root open={colorPickerOpen} onOpenChange={next => {
            if (next) setPickerColor(selectedCustomColor ?? themeScales.find(scale => scale.id === draft.palette)?.values[6][1] ?? '#8b6f91');
            setColorPickerOpen(next);
          }}>
            <Popover.Trigger asChild><Button size="icon" variant="outline" className="theme-customizer__add-color"
              aria-label={t('添加自定义颜色', 'Add custom color')} title={t('添加自定义颜色', 'Add custom color')}>
              <DocsIcon data={plusIcon} size={22} />
            </Button></Popover.Trigger>
            <Popover.Portal><Popover.Content className="theme-customizer__color-popover" side="top" align="end" sideOffset={8} collisionPadding={12}
              aria-label={t('自定义主题色', 'Custom accent color')} aria-describedby={undefined}>
              <ColorPicker presentation="compact" showAlpha={false} label={t('自定义主题色', 'Custom accent color')}
                labels={{ palette: t('调色板', 'Color palette'), value: t('颜色值', 'Color value'), invalid: t('请输入有效的颜色值', 'Enter a valid color') }}
                value={pickerColor} onValueChange={value => {
                  const color = normalizeThemeColor(value);
                  if (!color) return;
                  setPickerColor(color);
                  setDraft(previous => ({ ...previous, palette: customPaletteId(color) }));
                }} />
            </Popover.Content></Popover.Portal>
          </Popover.Root>
        </div>
      </Tabs.Content>
      {(['text', 'lines', 'wash'] as const).map(group => <Tabs.Content key={group} value={group} className="theme-customizer__panel theme-customizer__panel--render">
        {group === 'text' && <>
          <FontPicker value={draft.font} onValueChange={id => { void selectFont(id); }}
            textEffect={draft.textEffect} currentRender={currentFontRender} savedRenders={draft.fonts}
            action={<Button size="icon" variant="ghost" disabled={fontBusy || !draft.textEffect} aria-label={t('恢复此字体参数', 'Reset this font')} title={t('恢复此字体参数', 'Reset this font')} onClick={resetFont}><DocsIcon data={resetIcon} size={22} /></Button>} />
          {fontBusy && <span role="status">{t('字体加载中…', 'Loading font…')}</span>}
          {fontError && <span role="alert">{t('字体加载失败，请重新选择。', 'Could not load font. Select it again to retry.')}</span>}
        </>}
        <div className="theme-customizer__controls">
          {group === 'text' && <Switch className="theme-customizer__effect" variant="circular" diameter={120}
            label={t('彩铅效果', 'Pencil effect')} checked={draft.textEffect} disabled={fontBusy}
            centerIcon={<DocsIcon data={typeIcon} size={20} />}
            onCheckedChange={textEffect => setDraft(previous => ({ ...previous, textEffect }))} />}
          {controls.filter(control => control.group === group).map(control => <div key={control.key} className="theme-customizer__control" data-render-control={control.key}>
            <CircularSlider size="sm" diameter={120} disabled={fontBusy || (group === 'text' && !draft.textEffect)} aria-label={t(control.zh, control.en)}
              min={control.min} max={control.max} step={control.step} value={draft.render[control.key]}
              centerIcon={<DocsIcon data={controlIcons[control.key]} size={20} />} getValueLabel={formatControlValue}
              onValueChange={value => setDraft(previous => ({ ...previous, render: { ...previous.render, [control.key]: value } }))}
              onValueCommit={value => setPreviewRender(previous => ({ ...previous, [control.key]: value }))} />
            <PencilText className="theme-customizer__control-label" ellipsis title={t(control.zh, control.en)}>{t(control.zh, control.en)}</PencilText>
          </div>)}
        </div>
      </Tabs.Content>)}
    </Tabs.Root>
  );
}
