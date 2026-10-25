import { useEffect, useState, type ReactNode } from 'react';
import { Button, Card, ColorSwatch, Drawer, PencilLine, RadioGroup, RadioGroupItem, Slider, Tabs, Tooltip } from '@inkra/react';
import { __iconData as paletteIcon } from 'lucide-react/dist/esm/icons/palette.mjs';
import { __iconData as typeIcon } from 'lucide-react/dist/esm/icons/type.mjs';
import { __iconData as penIcon } from 'lucide-react/dist/esm/icons/pen-line.mjs';
import { __iconData as resetIcon } from 'lucide-react/dist/esm/icons/rotate-ccw.mjs';
import { __iconData as brushIcon } from 'lucide-react/dist/esm/icons/paintbrush.mjs';
import { __iconData as heartIcon } from 'lucide-react/dist/esm/icons/heart.mjs';
import { __iconData as monitorIcon } from 'lucide-react/dist/esm/icons/monitor.mjs';
import { __iconData as sunIcon } from 'lucide-react/dist/esm/icons/sun.mjs';
import { __iconData as moonIcon } from 'lucide-react/dist/esm/icons/moon.mjs';
import { DocsIcon } from './DocsIcon';
import { paletteStyle, themeScales, useResolvedTheme } from './ColorSystem';
import { PencilText, useLocale } from '../i18n';
import { themeRenderControls as controls } from './themeControls';
import './ThemeCustomizer.css';

const storageKey = 'inkra-docs-custom-theme-v1';
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

export function ThemeCustomizer({ theme, onThemeChange, renderTrigger, triggerVariant = 'outline' }: {
  theme: 'auto' | 'light' | 'dark';
  onThemeChange: (theme: 'auto' | 'light' | 'dark') => void;
  renderTrigger?: (trigger: ReactNode) => ReactNode;
  triggerVariant?: 'outline' | 'ghost';
}) {
  const { t } = useLocale();
  const label = t("主题定制", "Customize theme");
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
        <Drawer.Header closeLabel={t("关闭", "Close")}><Drawer.Title>{label}</Drawer.Title></Drawer.Header>
        <Drawer.Body>
          <section className="theme-customizer__sample" aria-label={t("主题预览", "Theme preview")}>
            <PencilText as="h3">{t("主题预览", "Theme preview")}</PencilText>
            <Card.Root className="theme-customizer__preview-card" data-inkra-theme={previewTheme} style={previewStyle}>
              <Card.Content className="theme-customizer__preview-content">
                <PencilText as="h4" className="theme-customizer__lettering">{t("一页灵感", "A page of inspiration")}</PencilText>
                <PencilText as="p">{t("像画画一样搭建你的界面", "Draw your next idea.")}</PencilText>
                <PencilLine className="theme-customizer__line" seed="customizer-line" />
                <Button variant="primary" startIcon={<DocsIcon data={heartIcon} size={22} />} aria-pressed={inspired} onClick={() => setInspired(value => !value)}>{inspired ? t("已喜欢", "Liked") : t("喜欢", "Like")}</Button>
              </Card.Content>
            </Card.Root>
          </section>
          <PencilLine className="theme-customizer__separator" seed="customizer-settings-divider" />
          <Tabs.Root className="theme-customizer__tabs" value={tab} onValueChange={setTab}>
            <Tabs.List fullWidth aria-label={t("定制分类", "Theme settings")}>
              <Tabs.Trigger value="theme" startIcon={<DocsIcon data={paletteIcon} size={22} />}>{t("主题", "Theme")}</Tabs.Trigger>
              <Tabs.Trigger value="text" startIcon={<DocsIcon data={typeIcon} size={22} />}>{t("文字", "Text")}</Tabs.Trigger>
              <Tabs.Trigger value="lines" startIcon={<DocsIcon data={penIcon} size={22} />}>{t("线条", "Lines")}</Tabs.Trigger>
              <Tabs.Trigger value="wash" startIcon={<DocsIcon data={brushIcon} size={22} />}>{t("涂色", "Fill")}</Tabs.Trigger>
            </Tabs.List>
            <Tabs.Content value="theme" className="theme-customizer__panel">
              <RadioGroup className="theme-customizer__mode" name="customizer-theme" label={t('主题模式')} variant="segmented" orientation="horizontal" value={draftTheme} onValueChange={value => setDraftTheme(value as typeof theme)}>
                <RadioGroupItem value="auto" label={t("系统", "System")} icon={<DocsIcon data={monitorIcon} size={24} />} />
                <RadioGroupItem value="light" label={t("浅色", "Light")} icon={<DocsIcon data={sunIcon} size={24} />} />
                <RadioGroupItem value="dark" label={t("深色", "Dark")} icon={<DocsIcon data={moonIcon} size={24} />} />
              </RadioGroup>
              <PencilText as="h3">{t("主题色", "Accent color")}</PencilText>
              <div className="theme-customizer__swatches" role="group" aria-label={t("主题色", "Accent color")}>
                {[{ id: 'default', label: '默认', color: 'var(--inkra-ink)' }, ...themeScales.map(scale => ({ id: scale.id, label: scale.label, color: scale.values[6][1] }))].map(scale => <ColorSwatch key={scale.id} color={scale.color} label={scale.id === 'default' ? t("默认", "Default") : t(scale.label)} selected={draft.palette === scale.id} onClick={() => setDraft(previous => ({ ...previous, palette: scale.id }))} />)}
              </div>
            </Tabs.Content>
            {(['text', 'lines', 'wash'] as const).map(group => <Tabs.Content key={group} value={group} className="theme-customizer__panel">
              {controls.filter(control => control.group === group).map(control => <div key={control.key} className="theme-customizer__control">
                <div><PencilText>{t(control.zh, control.en)}</PencilText><output>{draft.render[control.key].toFixed(2)}</output></div>
                <Slider aria-label={t(control.zh, control.en)} min={control.min} max={control.max} step={control.step} value={[draft.render[control.key]]} onValueChange={([value]) => setDraft(previous => ({ ...previous, render: { ...previous.render, [control.key]: value } }))} />
              </div>)}
            </Tabs.Content>)}
          </Tabs.Root>
          {storageError && <p role="status">{t("设置已生效，但暂时无法保存到本机。", "Changes apply now, but could not be saved on this device.")}</p>}
        </Drawer.Body>
        <Drawer.Footer align="end">
          <Button variant="outline" onClick={() => { setDraft(defaults); setDraftTheme('light'); }} startIcon={<DocsIcon data={resetIcon} size={22} />}>{t("恢复默认", "Reset")}</Button>
          <Drawer.Close asChild><Button variant="outline">{t("取消", "Cancel")}</Button></Drawer.Close>
          <Button onClick={save}>{t("保存", "Save")}</Button>
        </Drawer.Footer>
      </Drawer.Content>
    </Drawer.Portal>
  </Drawer.Root>;
}
