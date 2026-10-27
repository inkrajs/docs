import { useEffect, useLayoutEffect, useId, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { Input, PencilSurface, PencilText as FontText } from '@inkra/react';
import { __iconData as searchIcon } from 'lucide-react/dist/esm/icons/search.mjs';
import { __iconData as checkIcon } from 'lucide-react/dist/esm/icons/check.mjs';
import { PencilText, useLocale } from '../i18n';
import { DocsIcon } from './DocsIcon';
import { fontMatchesQuery, fontSpecimen, fontStack, loadThemeFont, orderedThemeFonts, themeFonts, type FontRender } from './themeFonts';
import './FontPicker.css';

type Font = typeof themeFonts[number];
type FontState = 'idle' | 'loading' | 'ready' | 'error';

function revealInList(row: HTMLElement) {
  const list = row.closest<HTMLElement>('.font-picker__list');
  if (!list) return;
  const item = row.getBoundingClientRect();
  const viewport = list.getBoundingClientRect();
  if (item.left < viewport.left) list.scrollLeft += item.left - viewport.left;
  else if (item.right > viewport.right) list.scrollLeft += item.right - viewport.right;
}

function FontOption({ font, group, selected, render, textEffect, onSelect }: {
  font: Font; group: string; selected: boolean; render: FontRender; textEffect: boolean;
  onSelect: (id: string) => void;
}) {
  const { t, locale } = useLocale();
  const rowRef = useRef<HTMLLabelElement>(null);
  const [visible, setVisible] = useState(false);
  const [state, setState] = useState<FontState>('idle');
  const [attempt, setAttempt] = useState(0);
  const name = t(font.zh, font.en);
  const specimen = fontSpecimen(font.id, locale);
  const sampleText = specimen.title + specimen.body + specimen.card;

  useEffect(() => {
    const row = rowRef.current;
    if (!row || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(entries => {
      if (!entries.some(entry => entry.isIntersecting)) return;
      setVisible(true);
      observer.disconnect();
    });
    observer.observe(row);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!visible) return;
    let cancelled = false;
    setState('loading');
    void loadThemeFont(font.id, sampleText).then(() => {
      if (!cancelled) setState('ready');
    }).catch(() => {
      if (!cancelled) setState('error');
    });
    return () => { cancelled = true; };
  }, [visible, font.id, sampleText, attempt]);

  const sampleStyle = useMemo(() => ({
    '--inkra-font-hand': fontStack(font.id),
    '--inkra-letter-effect': textEffect ? 1 : 0,
    ...Object.fromEntries(Object.entries(render).map(([key, value]) => [`--inkra-letter-${key}`, value])),
  }) as CSSProperties, [font.id, render, textEffect]);

  return <label ref={rowRef} className="font-picker__option" data-font-id={font.id} data-font-state={state} data-selected={selected || undefined}>
    <input className="font-picker__radio" type="radio" name={group} value={font.id} checked={selected}
      aria-label={name}
      onFocus={event => { revealInList(event.currentTarget.parentElement!); setVisible(true); }}
      onChange={() => { setVisible(true); if (state === 'error') setAttempt(value => value + 1); onSelect(font.id); }}
      onClick={() => { if (selected && state === 'error') { setVisible(true); setAttempt(value => value + 1); onSelect(font.id); } }} />
    <PencilSurface as="span" variant={selected ? 'selection' : 'outline'} aria-hidden="true" className="font-picker__selection" seed={`font-choice-${font.id}`} />
    <span className="font-picker__content">
      <span className="font-picker__heading">
        <PencilText className="font-picker__name" ellipsis title={name}>{name}</PencilText>
        <FontText className="font-picker__languages" ellipsis title={specimen.label}>{specimen.label}</FontText>
      </span>
      {state === 'ready'
        ? <FontText className="font-picker__specimen" ellipsis style={sampleStyle} lang={specimen.lang}>{specimen.card.replace(/\s*\n\s*/g, ' ')}</FontText>
        : <span className="font-picker__status">{state === 'error'
          ? `${t('加载失败', 'Loading failed')} · ${t('重试', 'Retry')}`
          : t('字体加载中…', 'Loading font…')}</span>}
    </span>
    <span className="font-picker__check" aria-hidden="true">{selected && <DocsIcon data={checkIcon} size={22} />}</span>
  </label>;
}

export function FontPicker({ value, onValueChange, textEffect, currentRender, savedRenders, action }: {
  value: string;
  onValueChange: (id: string) => void;
  textEffect: boolean;
  currentRender: FontRender;
  savedRenders: Record<string, FontRender>;
  action?: ReactNode;
}) {
  const { t, locale } = useLocale();
  const group = useId();
  const [query, setQuery] = useState('');
  const listRef = useRef<HTMLDivElement>(null);
  const previousValue = useRef(value);
  const fonts = orderedThemeFonts(locale, query).filter(font => fontMatchesQuery(font.id, query, locale));

  useLayoutEffect(() => {
    const list = listRef.current;
    if (!list) return;
    // Flush the reordered cards before overriding scroll-snap's previous target.
    list.getBoundingClientRect();
    list.scrollLeft = 0;
  }, [query, locale]);

  useEffect(() => {
    if (previousValue.current === value) return;
    previousValue.current = value;
    const selected = listRef.current?.querySelector<HTMLElement>('[data-selected]');
    if (selected) revealInList(selected);
  }, [value]);

  return <div className="font-picker">
    <div className="font-picker__search-row">
      <Input type="search" aria-label={t('搜索字体', 'Search fonts')} placeholder={t('搜索字体', 'Search fonts')}
        value={query} startIcon={<DocsIcon data={searchIcon} size={20} />}
        onChange={event => setQuery(event.target.value)} />
      {action}
    </div>
    <div ref={listRef} className="font-picker__list" role="radiogroup" aria-label={t('字体', 'Font')} aria-orientation="horizontal">
      {fonts.length ? fonts.map(font => <FontOption key={font.id} font={font} group={group} selected={font.id === value}
        render={font.id === value ? currentRender : savedRenders[font.id] ?? font.preset} textEffect={textEffect} onSelect={onValueChange} />)
        : <p className="font-picker__empty" role="status">{t('没有匹配的字体', 'No matching fonts')}</p>}
    </div>
  </div>;
}
