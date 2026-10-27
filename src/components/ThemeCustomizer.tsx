import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Button, Card, CircularSlider, ColorPicker, ColorSwatch, Popover, Drawer, PencilLine, PencilText as FontText, RadioGroup, RadioGroupItem, Switch, Tabs, Tooltip } from '@inkra/react';
import { __iconData as paletteIcon } from 'lucide-react/dist/esm/icons/palette.mjs';
import { __iconData as typeIcon } from 'lucide-react/dist/esm/icons/type.mjs';
import { __iconData as penIcon } from 'lucide-react/dist/esm/icons/pen-line.mjs';
import { __iconData as resetIcon } from 'lucide-react/dist/esm/icons/rotate-ccw.mjs';
import { __iconData as brushIcon } from 'lucide-react/dist/esm/icons/paintbrush.mjs';
import { __iconData as heartIcon } from 'lucide-react/dist/esm/icons/heart.mjs';
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
import { DocsIcon, type LucideIconData } from './DocsIcon';
import { themeScales, useResolvedTheme } from './ColorSystem';
import { customPaletteId, normalizeThemeColor, paletteTokens, rememberCustomColor } from './themeColors';
import { PencilText, useLocale } from '../i18n';
import { themeRenderControls as controls, themeRenderTokens } from './themeControls';
import { FontPicker } from './FontPicker';
import { changeThemeFont, defaultThemeSettings as defaults, fontRender, fontSpecimen, fontStack, getThemeFont, loadThemeFont, readThemeSettings, type ThemeSettings as Settings } from './themeFonts';
import './ThemeCustomizer.css';

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
const storageKey = 'inkra-docs-custom-theme-v2';
const colorTokens = ['--inkra-accent', '--inkra-accent-soft', '--inkra-accent-strong', '--inkra-on-accent', '--inkra-selection-pigment', '--inkra-selection-foreground'];

function readSettings(): Settings {
  try {
    const value = readThemeSettings(JSON.parse(localStorage.getItem(storageKey) ?? localStorage.getItem('inkra-docs-custom-theme-v1') ?? 'null'));
    return { ...value, palette: themeScales.some(scale => scale.id === value.palette) ? value.palette : value.palette.startsWith('custom:') && normalizeThemeColor(value.palette.slice(7)) ? customPaletteId(value.palette.slice(7)) : 'default' };
  } catch { return defaults; }
}

export function ThemeCustomizer({ theme, onThemeChange, renderTrigger, triggerVariant = 'outline' }: {
  theme: 'auto' | 'light' | 'dark';
  onThemeChange: (theme: 'auto' | 'light' | 'dark') => void;
  renderTrigger?: (trigger: ReactNode) => ReactNode;
  triggerVariant?: 'outline' | 'ghost';
}) {
  const { t, locale } = useLocale();
  const label = t("主题定制", "Customize theme");
  const resolvedTheme = useResolvedTheme(theme);
  const [settings, setSettings] = useState(readSettings);
  const [draft, setDraft] = useState(settings);
  const [previewRender, setPreviewRender] = useState(settings.render);
  const currentFontRender = useMemo(() => fontRender(previewRender), [previewRender]);
  const [fontBusy, setFontBusy] = useState(false);
  const [fontError, setFontError] = useState(false);
  const fontRequest = useRef(0);
  const [draftTheme, setDraftTheme] = useState(theme);
  const previewTheme = useResolvedTheme(draftTheme);
  const [open, setOpen] = useState(false);
  const [storageError, setStorageError] = useState(false);
  const [tab, setTab] = useState('theme');
  const [inspired, setInspired] = useState(false);
  const [colorPickerOpen, setColorPickerOpen] = useState(false);
  const [pickerColor, setPickerColor] = useState('#8b6f91');
  const selectedCustomColor = draft.palette.startsWith('custom:') ? normalizeThemeColor(draft.palette.slice(7)) : null;
  const visibleCustomColors = selectedCustomColor ? rememberCustomColor(draft.customColors, selectedCustomColor) : draft.customColors;


  useEffect(() => {
    const root = document.documentElement;
    const tokens = [...colorTokens, ...controls.map(control => control.token), '--inkra-font-hand', '--inkra-letter-effect'];
    const previous = tokens.map(token => [token, root.style.getPropertyValue(token)] as const);
    let cancelled = false;
    // Plain text must not wait for a network font before disabling decoration.
    root.style.setProperty('--inkra-letter-effect', settings.textEffect ? '1' : '0');
    // Apply one coherent font + material preset only after its font is available.
    void loadThemeFont(settings.font).then(() => {
      if (cancelled) return;
      root.style.setProperty('--inkra-font-hand', fontStack(settings.font));
      const colors = paletteTokens(settings.palette, resolvedTheme);
      for (const token of colorTokens) {
        const value = colors[token as keyof typeof colors];
        if (typeof value === 'string') root.style.setProperty(token, value);
        else root.style.removeProperty(token);
      }
      const renderTokens = themeRenderTokens(settings.render);
      for (const control of controls) {
        if (settings.render[control.key] === control.value) root.style.removeProperty(control.token);
        else root.style.setProperty(control.token, renderTokens[control.token]);
      }
    }).catch(() => { if (!cancelled) setFontError(true); });
    return () => {
      cancelled = true;
      for (const [token, value] of previous) {
        if (value) root.style.setProperty(token, value);
        else root.style.removeProperty(token);
      }
    };
  }, [settings, resolvedTheme]);

  const previewStyle = useMemo(() => {
    return {
      ...paletteTokens(draft.palette, previewTheme),
      ...themeRenderTokens(previewRender),
      '--inkra-font-hand': fontStack(draft.font),
      '--inkra-letter-effect': draft.textEffect ? 1 : 0,
      fontFamily: fontStack(draft.font),
    } as React.CSSProperties;
  }, [draft.palette, draft.font, draft.textEffect, previewTheme, previewRender]);

  async function selectFont(id: string) {
    const request = ++fontRequest.current;
    setFontBusy(true);
    setFontError(false);
    try {
      const nextSpecimen = fontSpecimen(id, locale);
      await loadThemeFont(id, nextSpecimen.title + nextSpecimen.body + nextSpecimen.card);
      if (request !== fontRequest.current) return;
      const next = changeThemeFont(draft, id);
      setDraft(previous => changeThemeFont(previous, id));
      setPreviewRender(next.render);
    } catch {
      if (request === fontRequest.current) setFontError(true);
    } finally {
      if (request === fontRequest.current) setFontBusy(false);
    }
  }

  function changeOpen(next: boolean) {
    setColorPickerOpen(false);
    fontRequest.current += 1;
    setFontBusy(false);
    if (next) {
      setDraft(settings);
      setPreviewRender(settings.render);
      setDraftTheme(theme);
      setStorageError(false);
      setInspired(false);
    }
    setOpen(next);
  }

  function save() {
    if (fontBusy) return;
    const saved = { ...draft, customColors: selectedCustomColor ? rememberCustomColor(draft.customColors, selectedCustomColor) : draft.customColors };
    setSettings(saved);
    onThemeChange(draftTheme);
    try {
      localStorage.setItem(storageKey, JSON.stringify(saved));
      localStorage.setItem('inkra-docs-theme', draftTheme);
      setStorageError(false);
      setOpen(false);
    } catch { setStorageError(true); }
  }

  const traditional = getThemeFont(draft.font).traditional;
  const specimen = fontSpecimen(draft.font, locale);
  const previewTitle = specimen.lang.startsWith('zh') ? (traditional ? '主題預覽' : '主题预览')
    : ({ ja: 'テーマプレビュー', ko: '테마 미리보기', fr: 'Aperçu du thème' }[specimen.lang] ?? 'Theme preview');
  const previewBody = specimen.lang.startsWith('zh') ? (traditional ? "像畫畫一樣搭建你的界面" : "像画画一样搭建你的界面") : specimen.body;
  // Slider draft changes must not repaint the canvases on every pointer movement.
  const sample = useMemo(() => <Card.Root className="theme-customizer__preview-card" data-inkra-theme={previewTheme} style={previewStyle}>
    <Card.Content className="theme-customizer__preview-content">
      <FontText as="h4" className="theme-customizer__lettering" lang={specimen.lang}>{previewTitle}</FontText>
      <FontText as="p" lang={specimen.lang}>{previewBody}</FontText>
      <PencilLine className="theme-customizer__line" seed="customizer-line" />
      <Button variant="primary" startIcon={<DocsIcon data={heartIcon} size={22} active={inspired} />} aria-pressed={inspired} onClick={() => setInspired(value => !value)}>{inspired ? t("已喜欢", "Liked") : t("喜欢", "Like")}</Button>
    </Card.Content>
  </Card.Root>, [previewTheme, previewStyle, previewTitle, previewBody, specimen.lang, inspired, t]);

  const trigger = <Tooltip.Provider><Tooltip.Root>
      <Tooltip.Trigger asChild><Drawer.Trigger asChild>
        <Button className="header-customize" size="icon" variant={triggerVariant} aria-label={label}>
          <DocsIcon data={paletteIcon} size={30} />
        </Button>
      </Drawer.Trigger></Tooltip.Trigger>
      <Tooltip.Portal><Tooltip.Content side="bottom">{label}</Tooltip.Content></Tooltip.Portal>
    </Tooltip.Root></Tooltip.Provider>;
  return <Drawer.Root open={open} onOpenChange={changeOpen}>
    {renderTrigger ? renderTrigger(trigger) : trigger}
    <Drawer.Portal>
      <Drawer.Backdrop />
      <Drawer.Content className="theme-customizer" size="md" aria-describedby={undefined}>
        <Drawer.Header closeLabel={t("关闭", "Close")} action={<Tooltip.Provider><Tooltip.Root>
          <Tooltip.Trigger asChild><Button size="icon" variant="ghost" aria-label={t("恢复默认", "Reset")} onFocus={event => {
            const dialog = event.currentTarget.closest('[role="dialog"]');
            // Match DrawerCloseButton: initial drawer focus must not open a tooltip that consumes Escape.
            if (dialog && (!event.relatedTarget || !dialog.contains(event.relatedTarget))) event.preventDefault();
          }} onClick={() => {
            fontRequest.current += 1; setFontBusy(false); setFontError(false); setDraft({ ...defaults, customColors: settings.customColors }); setPreviewRender(defaults.render); setDraftTheme('light');
          }}><DocsIcon data={resetIcon} size={22} /></Button></Tooltip.Trigger>
          <Tooltip.Portal><Tooltip.Content side="bottom">{t("恢复默认", "Reset")}</Tooltip.Content></Tooltip.Portal>
        </Tooltip.Root></Tooltip.Provider>}><Drawer.Title>{label}</Drawer.Title></Drawer.Header>
        <Drawer.Body className="theme-customizer__body">
          <section className="theme-customizer__sample" aria-label={t("主题预览", "Theme preview")}>
            {sample}
          </section>
          <PencilLine className="theme-customizer__separator" seed="customizer-settings-divider" />
          <Tabs.Root className="theme-customizer__tabs" value={tab} onValueChange={setTab}>
            <Tabs.List fullWidth aria-label={t("定制分类", "Theme settings")}>
              <Tabs.Trigger value="theme" startIcon={<DocsIcon data={paletteIcon} size={22} />}>{t("主题", "Theme")}</Tabs.Trigger>
              <Tabs.Trigger value="text" startIcon={<DocsIcon data={typeIcon} size={22} />}>{t("文字", "Text")}</Tabs.Trigger>
              <Tabs.Trigger value="lines" startIcon={<DocsIcon data={penIcon} size={22} />}>{t("线条", "Lines")}</Tabs.Trigger>
              <Tabs.Trigger value="wash" startIcon={<DocsIcon data={brushIcon} size={22} />}>{t("涂色", "Fill")}</Tabs.Trigger>
            </Tabs.List>
            <PencilLine className="theme-customizer__tabs-divider" seed="customizer-tabs-bottom" aria-hidden="true" />
            <Tabs.Content value="theme" className="theme-customizer__panel">
              <RadioGroup className="theme-customizer__mode" name="customizer-theme" label={t('主题模式')} variant="segmented" orientation="horizontal" value={draftTheme} onValueChange={value => setDraftTheme(value as typeof theme)}>
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
                  action={<Button size="icon" variant="ghost" disabled={fontBusy || !draft.textEffect} aria-label={t('恢复此字体参数', 'Reset this font')} title={t('恢复此字体参数', 'Reset this font')} onClick={() => {
                  const render = { ...draft.render, ...getThemeFont(draft.font).preset };
                  setDraft(previous => ({ ...previous, render, fonts: { ...previous.fonts, [previous.font]: fontRender(render) } }));
                  setPreviewRender(render);
                }}><DocsIcon data={resetIcon} size={22} /></Button>} />
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
          {storageError && <p role="status">{t("设置已生效，但暂时无法保存到本机。", "Changes apply now, but could not be saved on this device.")}</p>}
        </Drawer.Body>
        <Drawer.Footer align="end">
          <Drawer.Close asChild><Button variant="outline">{t("取消", "Cancel")}</Button></Drawer.Close>
          <Button onClick={save} disabled={fontBusy}>{t("保存", "Save")}</Button>
        </Drawer.Footer>
      </Drawer.Content>
    </Drawer.Portal>
  </Drawer.Root>;
}
