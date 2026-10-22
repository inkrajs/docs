import { useEffect, useState } from 'react';
import { Button, Card, Drawer, PencilLine, PencilSurface, RadioGroup, RadioGroupItem, Slider, Tabs, Tooltip } from '@inkra/react';
import { __iconData as paletteIcon } from 'lucide-react/dist/esm/icons/palette.mjs';
import { __iconData as typeIcon } from 'lucide-react/dist/esm/icons/type.mjs';
import { __iconData as penIcon } from 'lucide-react/dist/esm/icons/pen-line.mjs';
import { __iconData as resetIcon } from 'lucide-react/dist/esm/icons/rotate-ccw.mjs';
import { __iconData as brushIcon } from 'lucide-react/dist/esm/icons/paintbrush.mjs';
import { __iconData as heartIcon } from 'lucide-react/dist/esm/icons/heart.mjs';
import { DocsIcon } from './DocsIcon';
import { paletteStyle, themeScales, useResolvedTheme } from './ColorSystem';
import { PencilText, useLocale } from '../i18n';
import './ThemeCustomizer.css';

const storageKey = 'inkra-docs-custom-theme-v1';
const controls = [
  { key: 'variation', token: '--inkra-letter-variation', zh: '笔压变化', en: 'Pressure variation', value: 0.52, min: 0, max: 1, step: 0.01, group: 'text' },
  { key: 'breaks', token: '--inkra-letter-breaks', zh: '断笔程度', en: 'Stroke breaks', value: 0.18, min: 0, max: 0.5, step: 0.01, group: 'text' },
  { key: 'outline', token: '--inkra-letter-outline', zh: '轮廓浓度', en: 'Outline intensity', value: 0.96, min: 0.2, max: 1, step: 0.01, group: 'text' },
  { key: 'fill', token: '--inkra-letter-fill', zh: '填色浓度', en: 'Fill intensity', value: 0.34, min: 0.1, max: 1, step: 0.01, group: 'text' },
  { key: 'grain', token: '--inkra-letter-grain', zh: '颗粒感', en: 'Grain', value: 0.45, min: 0, max: 1, step: 0.01, group: 'text' },
  { key: 'width', token: '--inkra-stroke-width', zh: '线条粗细', en: 'Stroke weight', value: 1.2, min: 0.3, max: 3, step: 0.1, group: 'lines' },
  { key: 'roughness', token: '--inkra-stroke-amplitude', zh: '线条起伏', en: 'Stroke roughness', value: 0.6, min: 0, max: 2, step: 0.1, group: 'lines' },
  { key: 'washStrength', token: '--inkra-wash-strength', zh: '涂色浓度', en: 'Fill strength', value: 0.48, min: 0, max: 1, step: 0.01, group: 'wash' },
  { key: 'washSpacing', token: '--inkra-wash-spacing', zh: '笔触间距', en: 'Stroke spacing', value: 1.8, min: 1, max: 6, step: 0.1, group: 'wash' },
  { key: 'washRoughness', token: '--inkra-wash-roughness', zh: '涂色起伏', en: 'Fill roughness', value: 3.5, min: 0, max: 6, step: 0.1, group: 'wash' },
  { key: 'washAngle', token: '--inkra-wash-angle', zh: '涂色角度', en: 'Fill angle', value: -35, min: -85, max: 85, step: 1, group: 'wash' },
] as const;
type RenderKey = typeof controls[number]['key'];
type Settings = { palette: string; render: Record<RenderKey, number> };
const defaults: Settings = { palette: 'default', render: Object.fromEntries(controls.map(control => [control.key, control.value])) as Settings['render'] };
const colorTokens = ['--inkra-accent', '--inkra-accent-soft', '--inkra-accent-strong', '--inkra-on-accent', '--inkra-selection-pigment', '--inkra-selection-foreground'];

function readSettings(): Settings {
  try {
    const value = JSON.parse(localStorage.getItem(storageKey) ?? 'null');
    return {
      palette: themeScales.some(scale => scale.id === value?.palette) ? value.palette : 'default',
      render: Object.fromEntries(controls.map(control => {
        const number = value?.render?.[control.key];
        return [control.key, typeof number === 'number' && Number.isFinite(number) ? Math.min(control.max, Math.max(control.min, number)) : control.value];
      })) as Settings['render'],
    };
  } catch { return defaults; }
}

export function ThemeCustomizer({ theme, onThemeChange }: { theme: 'auto' | 'light' | 'dark'; onThemeChange: (theme: 'auto' | 'light' | 'dark') => void }) {
  const { locale, t } = useLocale();
  const en = locale === 'en';
  const label = en ? 'Customize theme' : '主题定制';
  const resolvedTheme = useResolvedTheme(theme);
  const [settings, setSettings] = useState(readSettings);
  const [draft, setDraft] = useState(settings);
  const [draftTheme, setDraftTheme] = useState(theme);
  const previewTheme = useResolvedTheme(draftTheme);
  const [open, setOpen] = useState(false);
  const [storageError, setStorageError] = useState(false);
  const [tab, setTab] = useState('theme');
  const [inspired, setInspired] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    const tokens = [...colorTokens, ...controls.map(control => control.token)];
    const previous = tokens.map(token => [token, root.style.getPropertyValue(token)] as const);
    // Coalesce slider changes before invalidating visible canvas textures.
    const timer = window.setTimeout(() => {
      const scale = themeScales.find(scale => scale.id === settings.palette);
      const colors = scale ? paletteStyle(scale, resolvedTheme) : {};
      for (const token of colorTokens) {
        const value = colors[token as keyof typeof colors];
        if (typeof value === 'string') root.style.setProperty(token, value);
        else root.style.removeProperty(token);
      }
      for (const control of controls) {
        const value = settings.render[control.key];
        if (value === control.value) root.style.removeProperty(control.token);
        else root.style.setProperty(control.token, String(value));
      }
    }, 100);
    return () => {
      window.clearTimeout(timer);
      for (const [token, value] of previous) {
        if (value) root.style.setProperty(token, value);
        else root.style.removeProperty(token);
      }
    };
  }, [settings, resolvedTheme]);

  const previewScale = themeScales.find(scale => scale.id === draft.palette);
  const previewStyle = {
    ...(previewScale ? paletteStyle(previewScale, previewTheme) : {}),
    ...Object.fromEntries(controls.map(control => [control.token, draft.render[control.key]])),
  } as React.CSSProperties;

  function changeOpen(next: boolean) {
    if (next) {
      setDraft(settings);
      setDraftTheme(theme);
      setStorageError(false);
      setInspired(false);
    }
    setOpen(next);
  }

  function save() {
    setSettings(draft);
    onThemeChange(draftTheme);
    try {
      localStorage.setItem(storageKey, JSON.stringify(draft));
      localStorage.setItem('inkra-docs-theme', draftTheme);
      setStorageError(false);
      setOpen(false);
    } catch { setStorageError(true); }
  }

  return <Drawer.Root open={open} onOpenChange={changeOpen}>
    <Tooltip.Provider><Tooltip.Root>
      <Tooltip.Trigger asChild><Drawer.Trigger asChild>
        <Button className="header-customize" size="icon" variant="outline" aria-label={label}>
          <DocsIcon data={paletteIcon} size={30} />
        </Button>
      </Drawer.Trigger></Tooltip.Trigger>
      <Tooltip.Portal><Tooltip.Content side="bottom">{label}</Tooltip.Content></Tooltip.Portal>
    </Tooltip.Root></Tooltip.Provider>
    <Drawer.Portal>
      <Drawer.Backdrop />
      <Drawer.Content className="theme-customizer" size="md" aria-describedby={undefined}>
        <Drawer.Header closeLabel={en ? 'Close' : '关闭'}><Drawer.Title>{label}</Drawer.Title></Drawer.Header>
        <Drawer.Body>
          <section className="theme-customizer__sample" aria-label={en ? 'Theme preview' : '主题预览'}>
            <PencilText as="h3">{en ? 'Theme preview' : '主题预览'}</PencilText>
            <Card.Root className="theme-customizer__preview-card" data-inkra-theme={previewTheme} style={previewStyle}>
              <Card.Content className="theme-customizer__preview-content">
                <PencilText as="h4" className="theme-customizer__lettering">{en ? 'A page of inspiration' : '一页灵感'}</PencilText>
                <PencilText as="p">{en ? 'Draw your next idea.' : '像画画一样搭建你的界面'}</PencilText>
                <PencilLine className="theme-customizer__line" seed="customizer-line" />
                <Button variant="primary" startIcon={<DocsIcon data={heartIcon} size={22} />} aria-pressed={inspired} onClick={() => setInspired(value => !value)}>{inspired ? en ? 'Liked' : '已喜欢' : en ? 'Like' : '喜欢'}</Button>
              </Card.Content>
            </Card.Root>
          </section>
          <PencilLine className="theme-customizer__separator" seed="customizer-settings-divider" />
          <Tabs.Root className="theme-customizer__tabs" value={tab} onValueChange={setTab}>
            <Tabs.List fullWidth aria-label={en ? 'Theme settings' : '定制分类'}>
              <Tabs.Trigger value="theme" startIcon={<DocsIcon data={paletteIcon} size={22} />}>{en ? 'Theme' : '主题'}</Tabs.Trigger>
              <Tabs.Trigger value="text" startIcon={<DocsIcon data={typeIcon} size={22} />}>{en ? 'Text' : '文字'}</Tabs.Trigger>
              <Tabs.Trigger value="lines" startIcon={<DocsIcon data={penIcon} size={22} />}>{en ? 'Lines' : '线条'}</Tabs.Trigger>
              <Tabs.Trigger value="wash" startIcon={<DocsIcon data={brushIcon} size={22} />}>{en ? 'Fill' : '涂色'}</Tabs.Trigger>
            </Tabs.List>
            <Tabs.Content value="theme" className="theme-customizer__panel">
              <RadioGroup name="customizer-theme" aria-label={t('主题模式')} variant="segmented" orientation="horizontal" value={draftTheme} onValueChange={value => setDraftTheme(value as typeof theme)}>
                <RadioGroupItem value="auto" label={en ? 'System' : '系统'} />
                <RadioGroupItem value="light" label={en ? 'Light' : '浅色'} />
                <RadioGroupItem value="dark" label={en ? 'Dark' : '深色'} />
              </RadioGroup>
              <PencilText as="h3">{en ? 'Accent color' : '主题色'}</PencilText>
              <div className="theme-customizer__swatches" role="group" aria-label={en ? 'Accent color' : '主题色'}>
                {[{ id: 'default', label: '默认', color: 'var(--inkra-ink)' }, ...themeScales.map(scale => ({ id: scale.id, label: scale.label, color: scale.values[6][1] }))].map(scale => <button key={scale.id} type="button" aria-label={scale.id === 'default' ? en ? 'Default' : '默认' : t(scale.label)} aria-pressed={draft.palette === scale.id} title={scale.id === 'default' ? en ? 'Default' : '默认' : t(scale.label)} onClick={() => setDraft(previous => ({ ...previous, palette: scale.id }))}>
                  <PencilSurface as="span" className="theme-customizer__swatch" variant="wash" style={{ '--inkra-accent': scale.color } as React.CSSProperties} />
                  {draft.palette === scale.id && <PencilSurface as="span" className="theme-customizer__swatch-outline" variant="outline" />}
                </button>)}
              </div>
            </Tabs.Content>
            {(['text', 'lines', 'wash'] as const).map(group => <Tabs.Content key={group} value={group} className="theme-customizer__panel">
              {controls.filter(control => control.group === group).map(control => <div key={control.key} className="theme-customizer__control">
                <div><PencilText>{en ? control.en : control.zh}</PencilText><output>{draft.render[control.key].toFixed(2)}</output></div>
                <Slider aria-label={en ? control.en : control.zh} min={control.min} max={control.max} step={control.step} value={[draft.render[control.key]]} onValueChange={([value]) => setDraft(previous => ({ ...previous, render: { ...previous.render, [control.key]: value } }))} />
              </div>)}
            </Tabs.Content>)}
          </Tabs.Root>
          {storageError && <p role="status">{en ? 'Changes apply now, but could not be saved on this device.' : '设置已生效，但暂时无法保存到本机。'}</p>}
        </Drawer.Body>
        <Drawer.Footer align="end">
          <Button variant="outline" onClick={() => { setDraft(defaults); setDraftTheme('auto'); }} startIcon={<DocsIcon data={resetIcon} size={22} />}>{en ? 'Reset' : '恢复默认'}</Button>
          <Drawer.Close asChild><Button variant="outline">{en ? 'Cancel' : '取消'}</Button></Drawer.Close>
          <Button onClick={save}>{en ? 'Save' : '保存'}</Button>
        </Drawer.Footer>
      </Drawer.Content>
    </Drawer.Portal>
  </Drawer.Root>;
}
