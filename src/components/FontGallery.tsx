import { useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { Button, Input, PencilText as FontText } from '@inkra/react';
import { __iconData as searchIcon } from 'lucide-react/dist/esm/icons/search.mjs';
import { PencilText, useLocale } from '../i18n';
import { DocsIcon } from './DocsIcon';
import { fontMatchesQuery, fontSpecimen, fontStack, loadThemeFont, orderedThemeFonts, themeFonts } from './themeFonts';
import './FontGallery.css';

type GalleryFont = typeof themeFonts[number];
type FontState = 'idle' | 'loading' | 'ready' | 'error';

function FontSpecimen({ font }: { font: GalleryFont }) {
  const { t, locale } = useLocale();
  const itemRef = useRef<HTMLLIElement>(null);
  const [visible, setVisible] = useState(false);
  const [state, setState] = useState<FontState>('idle');
  const [attempt, setAttempt] = useState(0);
  const name = t(font.zh, font.en);
  const specimen = fontSpecimen(font.id, locale);
  const sampleText = specimen.title + specimen.body + specimen.card;

  useEffect(() => {
    const item = itemRef.current;
    if (!item) return;
    if (typeof IntersectionObserver === 'undefined') {
      // Older browsers can still read the list; loading is requested explicitly.
      return;
    }
    const observer = new IntersectionObserver(entries => {
      if (!entries.some(entry => entry.isIntersecting)) return;
      setVisible(true);
      observer.disconnect();
    });
    observer.observe(item);
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
    ...Object.fromEntries(Object.entries(font.preset).map(([key, value]) => [`--inkra-letter-${key}`, value])),
  }) as CSSProperties, [font]);

  return <li ref={itemRef} className="font-gallery__item" data-font-id={font.id} data-font-state={state}>
    <div className="font-gallery__heading">
      <PencilText className="font-gallery__name" title={name}>{name}</PencilText>
      <FontText className="font-gallery__languages" ellipsis title={specimen.label}>{specimen.label}</FontText>
    </div>
    {state === 'ready' ? <div className="font-gallery__sample" style={sampleStyle} lang={specimen.lang}>
      <FontText as="h3" className="font-gallery__title">{specimen.title}</FontText>
      <FontText as="p" className="font-gallery__body">{specimen.body}</FontText>
    </div> : <div className="font-gallery__placeholder">
      <span role={state === 'error' ? 'alert' : undefined}>{state === 'error' ? t('加载失败', 'Could not load font') : t('字体加载中…', 'Loading font…')}</span>
      {(state === 'error' || (typeof IntersectionObserver === 'undefined' && state === 'idle')) &&
        <Button variant="ghost" size="sm" onClick={() => { setVisible(true); setAttempt(previous => previous + 1); }}>
          {t('重试', 'Retry')}
        </Button>}
    </div>}
  </li>;
}

export function FontGallery() {
  const { t, locale } = useLocale();
  const [query, setQuery] = useState('');
  const listRef = useRef<HTMLUListElement>(null);
  const matches = orderedThemeFonts(locale, query).filter(font => fontMatchesQuery(font.id, query, locale));

  useLayoutEffect(() => {
    const list = listRef.current;
    if (!list) return;
    // Flush the reordered cards before overriding scroll-snap's previous target.
    list.getBoundingClientRect();
    list.scrollLeft = 0;
  }, [query, locale]);

  function search(value: string) {
    setQuery(value);
  }

  return <section className="font-gallery" aria-labelledby="font-family-title">
    <div className="font-gallery__header">
      <PencilText as="h2" id="font-family-title">字体</PencilText>
      <Input type="search" className="font-gallery__search" aria-label={t('搜索字体', 'Search fonts')}
        placeholder={t('搜索字体', 'Search fonts')} value={query} onChange={event => search(event.target.value)}
        startIcon={<DocsIcon data={searchIcon} size={20} />} />
    </div>
    {matches.length ? <ul ref={listRef} className="font-gallery__list" tabIndex={0} aria-label={t('字体列表', 'Font list')}>
      {matches.map(font => <FontSpecimen key={font.id} font={font} />)}
    </ul> : <p className="font-gallery__empty" role="status">{t('没有匹配的字体', 'No matching fonts')}</p>}
    <PencilText as="p" className="typography-system__note">界面使用手写字体；代码、色值和对齐数值使用等宽字体。数字表格不要用比例字宽制造参差。</PencilText>
  </section>;
}
