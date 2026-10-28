import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Button, Card, Drawer, PencilLine, PencilText as FontText, Tooltip } from '@inkra/react';
import { __iconData as paletteIcon } from 'lucide-react/dist/esm/icons/palette.mjs';
import { __iconData as resetIcon } from 'lucide-react/dist/esm/icons/rotate-ccw.mjs';
import { __iconData as heartIcon } from 'lucide-react/dist/esm/icons/heart.mjs';
import { DocsIcon } from './DocsIcon';
import { themeScales, useResolvedTheme } from './ColorSystem';
import { customPaletteId, normalizeThemeColor, paletteTokens, rememberCustomColor } from './themeColors';
import { useLocale } from '../i18n';
import { themeRenderControls as controls, themeRenderTokens } from './themeControls';
import { ThemeSettingsPanel } from './ThemeSettingsPanel';
import { useThemeDraft } from './useThemeDraft';
import { defaultThemeSettings as defaults, fontSpecimen, fontStack, getThemeFont, loadThemeFont, readThemeSettings, type ThemeSettings as Settings } from './themeFonts';
import './ThemeCustomizer.css';

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
  const editor = useThemeDraft(settings, theme);
  const { draft, previewRender, draftTheme, fontBusy, setFontError, cancelFontRequest, resetDraft } = editor;
  const previewTheme = useResolvedTheme(draftTheme);
  const [open, setOpen] = useState(false);
  const [storageError, setStorageError] = useState(false);
  const [inspired, setInspired] = useState(false);
  const selectedCustomColor = draft.palette.startsWith('custom:') ? normalizeThemeColor(draft.palette.slice(7)) : null;

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

  function changeOpen(next: boolean) {
    cancelFontRequest();
    if (next) {
      resetDraft(settings, theme);
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
            resetDraft({ ...defaults, customColors: settings.customColors }, 'light');
          }}><DocsIcon data={resetIcon} size={22} /></Button></Tooltip.Trigger>
          <Tooltip.Portal><Tooltip.Content side="bottom">{t("恢复默认", "Reset")}</Tooltip.Content></Tooltip.Portal>
        </Tooltip.Root></Tooltip.Provider>}><Drawer.Title>{label}</Drawer.Title></Drawer.Header>
        <Drawer.Body className="theme-customizer__body">
          <section className="theme-customizer__sample" aria-label={t("主题预览", "Theme preview")}>
            {sample}
          </section>
          <PencilLine className="theme-customizer__separator" seed="customizer-settings-divider" />
          <ThemeSettingsPanel editor={editor} active={open} />
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
