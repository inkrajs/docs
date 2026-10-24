import { memo, useEffect, useMemo, useRef, useState } from 'react';
import { Input, PencilIcon, PencilSurface, Tabs } from '@inkra/react';
import { PencilText, useLocale } from '../i18n';
import { DocsIcon } from './DocsIcon';
import { docsIconCatalog, iconCategories } from './iconCatalog';

type CatalogIcon = typeof docsIconCatalog[number];

const IconTile = memo(function IconTile({ icon, visible, selected, onSelect }: {
  icon: CatalogIcon;
  visible: boolean;
  selected: boolean;
  onSelect: (key: string) => void;
}) {
  const { t } = useLocale();
  const [focused, setFocused] = useState(false);
  const enhanced = visible || focused;
  const content = <span className="icon-examples__choice-content">
    {enhanced ? <PencilIcon paths={icon.paths} sourceSize={24} size={32} seed={`catalog-${icon.key}`} decorative />
      : <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor"
        strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        {icon.paths.map((path, index) => <path key={index} d={path.d} />)}
      </svg>}
    {enhanced ? <PencilText>{icon.label}</PencilText> : <span>{t(icon.label)}</span>}
  </span>;

  // Keep the native button mounted: enhancing its paint must not interrupt a
  // pointer click or keyboard focus. Only the existing pencil layers are deferred.
  return <button type="button" className="inkra-button icon-examples__choice icon-examples__tile"
    data-icon-key={icon.key} data-variant={selected ? 'outline' : 'ghost'} data-size="md"
    data-full-width="true" data-enhanced={enhanced || undefined} aria-pressed={selected}
    onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} onClick={() => onSelect(icon.key)}>
    {enhanced ? <>
      <PencilSurface as="span" className="inkra-button__surface" variant={selected ? 'outline' : 'quiet'} seed={`catalog-${icon.key}-surface`}>
        <span className="inkra-button__content"><span className="inkra-button__label">{content}</span></span>
      </PencilSurface>
      <PencilSurface as="span" aria-hidden="true" className="inkra-button__focus-ring" variant="outline" seed={`catalog-${icon.key}-focus`} />
    </> : <span className="icon-examples__fallback">{content}</span>}
  </button>;
});

export const IconCatalogGrid = memo(function IconCatalogGrid({ selected, onSelect }: {
  selected: string;
  onSelect: (key: string) => void;
}) {
  const { t } = useLocale();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [visible, setVisible] = useState<ReadonlySet<string>>(() => new Set());
  const grid = useRef<HTMLDivElement>(null);
  const icons = useMemo(() => {
    const keyword = query.trim().toLocaleLowerCase();
    return docsIconCatalog.filter(icon => (category === 'all' || icon.category === category)
      && `${icon.key} ${icon.label} ${t(icon.label)}`.toLocaleLowerCase().includes(keyword));
  }, [category, query, t]);

  useEffect(() => {
    const element = grid.current;
    if (!element) return;
    element.scrollTop = 0;
    setVisible(new Set());
    // One observer respects both page visibility and the catalog's clipping box.
    // Offscreen items retain searchable text, SVG fallback and keyboard access.
    if (typeof IntersectionObserver === 'undefined') return;
    let active = true;
    const observer = new IntersectionObserver(entries => {
      if (!active) return;
      setVisible(previous => {
        const next = new Set(previous);
        for (const entry of entries) {
          const key = (entry.target as HTMLElement).dataset.iconKey!;
          if (entry.isIntersecting) next.add(key);
          else next.delete(key);
        }
        return next.size === previous.size && [...next].every(key => previous.has(key)) ? previous : next;
      });
    });
    element.querySelectorAll('[data-icon-key]').forEach(tile => observer.observe(tile));
    return () => { active = false; observer.disconnect(); };
  }, [icons]);

  return <div className="icon-examples__catalog">
    <Input type="search" aria-label={t('搜索图标')} placeholder={t('搜索图标')} value={query}
      onValueChange={setQuery} clearable clearButtonLabel={t('清空搜索')}
      startIcon={<PencilIcon paths={docsIconCatalog[0].paths} sourceSize={24} size={22} />} />
    <Tabs.Root value={category} onValueChange={setCategory} size="sm">
      <Tabs.List overflow="buttons" scrollPreviousLabel={t('向前滚动')} scrollNextLabel={t('向后滚动')} aria-label={t('图标分类')}>
        {iconCategories.map(([key, label, icon]) => <Tabs.Trigger key={key} value={key}
          startIcon={<DocsIcon data={icon} size={24} />}>{t(label)}</Tabs.Trigger>)}
      </Tabs.List>
      <Tabs.Content value={category}>
        <div ref={grid} className="icon-examples__grid" role="group" tabIndex={0} aria-label={t('图标目录')}>
          {icons.map(icon => <IconTile key={icon.key} icon={icon} visible={visible.has(icon.key)}
            selected={selected === icon.key} onSelect={onSelect} />)}
          {!icons.length && <PencilText as="p" role="status" className="icon-examples__empty">没有匹配的图标</PencilText>}
        </div>
      </Tabs.Content>
    </Tabs.Root>
  </div>;
});
