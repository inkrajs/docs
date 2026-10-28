import { useEffect, useRef, useState } from 'react';
import type { InkraTheme } from '@inkra/react/theme';
import { useLocale } from '../i18n';
import { changeThemeFont, fontRender, fontSpecimen, getThemeFont, loadThemeFont, type ThemeSettings } from './themeFonts';

export function useThemeDraft(initial: ThemeSettings, initialTheme: InkraTheme) {
  const { locale } = useLocale();
  const [draft, setDraft] = useState(initial);
  const [previewRender, setPreviewRender] = useState(initial.render);
  const [draftTheme, setDraftTheme] = useState(initialTheme);
  const [fontBusy, setFontBusy] = useState(false);
  const [fontError, setFontError] = useState(false);
  const [tab, setTab] = useState('theme');
  const [resetVersion, setResetVersion] = useState(0);
  const request = useRef(0);
  const current = useRef(draft);
  current.current = draft;

  useEffect(() => () => { request.current += 1; }, []);

  function cancelFontRequest() {
    request.current += 1;
    setFontBusy(false);
  }

  function resetDraft(settings: ThemeSettings, theme: InkraTheme) {
    cancelFontRequest();
    setFontError(false);
    setDraft(settings);
    setPreviewRender(settings.render);
    setDraftTheme(theme);
    setResetVersion(value => value + 1);
  }

  async function selectFont(id: string) {
    const attempt = ++request.current;
    setFontBusy(true);
    setFontError(false);
    try {
      const specimen = fontSpecimen(id, locale);
      await loadThemeFont(id, specimen.title + specimen.body + specimen.card);
      if (attempt !== request.current) return;
      const next = changeThemeFont(current.current, id);
      setDraft(next);
      setPreviewRender(next.render);
    } catch {
      if (attempt === request.current) setFontError(true);
    } finally {
      if (attempt === request.current) setFontBusy(false);
    }
  }

  function resetFont() {
    cancelFontRequest();
    setFontError(false);
    const render = { ...current.current.render, ...getThemeFont(current.current.font).preset };
    setDraft(previous => ({ ...previous, render, fonts: { ...previous.fonts, [previous.font]: fontRender(render) } }));
    setPreviewRender(render);
  }

  return { draft, setDraft, previewRender, setPreviewRender, draftTheme, setDraftTheme, fontBusy, fontError, setFontError,
    tab, setTab, resetVersion, selectFont, resetFont, resetDraft, cancelFontRequest };
}

export type ThemeDraftEditor = ReturnType<typeof useThemeDraft>;

