import { memo, useId, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { Input, PencilIcon, PencilSurface, RadioGroup, RadioGroupItem, Tabs, Tooltip } from '@inkra/react';
import { PencilText, useLocale } from '../i18n';
import { DocsIcon } from './DocsIcon';
import { docsIconCatalog, iconCategories } from './iconCatalog';
import { iconFillCopy } from './iconFillCopy';

type CatalogIcon = typeof docsIconCatalog[number];
export type IconVariant = 'outline' | 'filled' | 'colorful';

export function IconAppearanceControl({ value, onValueChange }: {
  value: IconVariant;
  onValueChange: (value: IconVariant) => void;
}) {
  const { locale } = useLocale();
  const copy = iconFillCopy(locale);
  const name = useId();
  const folder = docsIconCatalog.find(icon => icon.key === 'folder')!;
  return <RadioGroup name={name} role="radiogroup" label={copy.appearance} aria-label={copy.appearance}
    variant="segmented" orientation="horizontal" className="icon-examples__appearance"
    value={value} onValueChange={next => onValueChange(next as IconVariant)}>
    {(['outline', 'filled', 'colorful'] as const).map(variant => <RadioGroupItem key={variant} value={variant}
      aria-label={copy[variant]} label={<PencilText ellipsis>{copy[variant]}</PencilText>}
      icon={<PencilIcon paths={folder.paths} filledPaths={variant === 'colorful' ? folder.colorPaths ?? folder.filledPaths : folder.filledPaths} sourceSize={24} size={28} variant={variant === 'outline' ? 'outline' : 'filled'} decorative />} />)}
  </RadioGroup>;
}

const IconTile = memo(function IconTile({ icon, visible, selected, onSelect, variant }: {
  icon: CatalogIcon;
  visible: boolean;
  selected: boolean;
  onSelect: (key: string) => void;
  variant: IconVariant;
}) {
  const { t } = useLocale();
  const [focused, setFocused] = useState(false);
  const enhanced = visible || focused;
  const content = <span className="icon-examples__choice-content">
    {enhanced ? <PencilIcon paths={icon.paths} filledPaths={variant === 'colorful' ? icon.colorPaths ?? icon.filledPaths : icon.filledPaths} sourceSize={24} size={32} variant={variant === 'outline' ? 'outline' : 'filled'} seed={`catalog-${icon.key}`} decorative />
      : <span aria-hidden="true" style={{ width: 32, height: 32 }} />}
  </span>;

  // Keep the native button mounted: enhancing its paint must not interrupt a
  // pointer click or keyboard focus. Only the existing pencil layers are deferred.
  return <Tooltip.Root><Tooltip.Trigger asChild><button type="button" className="inkra-button icon-examples__choice icon-examples__tile"
    data-icon-key={icon.key} data-variant={selected ? 'outline' : 'ghost'} data-size="md"
    data-enhanced={enhanced || undefined} data-icon-appearance={variant} aria-pressed={selected}
    aria-label={t(icon.label)}
    onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} onClick={() => onSelect(icon.key)}>
    {enhanced ? <>
      <PencilSurface as="span" className="inkra-button__surface" variant={selected ? 'outline' : 'quiet'} seed={`catalog-${icon.key}-surface`}>
        <span className="inkra-button__content"><span className="inkra-button__label">{content}</span></span>
      </PencilSurface>
      <PencilSurface as="span" aria-hidden="true" className="inkra-button__focus-ring" variant="outline" seed={`catalog-${icon.key}-focus`} />
    </> : <span className="icon-examples__fallback">{content}</span>}
  </button></Tooltip.Trigger>
    <Tooltip.Portal><Tooltip.Content>{t(icon.label)}</Tooltip.Content></Tooltip.Portal>
  </Tooltip.Root>;
});

export const IconCatalogGrid = memo(function IconCatalogGrid({ selected, onSelect, variant, onVariantChange }: {
  selected: string;
  onSelect: (key: string) => void;
  variant: IconVariant;
  onVariantChange: (value: IconVariant) => void;
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

  useLayoutEffect(() => {
    const element = grid.current;
    if (!element) return;
    element.scrollTop = 0;
    const overscan = 128;
    let rows: { key: string; top: number; bottom: number }[] = [];
    const measure = () => {
      rows = [...element.querySelectorAll<HTMLElement>('[data-icon-key]')].map(tile => ({
        key: tile.dataset.iconKey!, top: tile.offsetTop, bottom: tile.offsetTop + tile.offsetHeight,
      }));
    };
    const update = () => {
      const rect = element.getBoundingClientRect();
      const top = element.scrollTop + Math.max(0, -rect.top) - overscan;
      const bottom = element.scrollTop + Math.min(element.clientHeight, window.innerHeight - rect.top) + overscan;
      const nearby = rect.bottom > -overscan && rect.top < window.innerHeight + overscan;
      const next = new Set(nearby ? rows.filter(row => row.bottom > top && row.top < bottom).map(row => row.key) : []);
      setVisible(previous => {
        return next.size === previous.size && [...next].every(key => previous.has(key)) ? previous : next;
      });
    };
    // Scroll updates must commit before the next paint, not one observer callback later.
    // Two extra rows keep ordinary scrolling inside an already-painted window.
    const onScroll = () => flushSync(update);
    const onResize = () => { measure(); flushSync(update); };
    measure();
    update();
    window.addEventListener('scroll', onScroll, { capture: true, passive: true });
    window.addEventListener('resize', onResize);
    const observer = typeof ResizeObserver === 'undefined' ? undefined : new ResizeObserver(onResize);
    observer?.observe(element);
    return () => {
      observer?.disconnect();
      window.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('resize', onResize);
    };
  }, [icons]);

  return <div className="icon-examples__catalog">
    <IconAppearanceControl value={variant} onValueChange={onVariantChange} />
    <Input type="search" aria-label={t('搜索图标')} placeholder={t('搜索图标')} value={query}
      onValueChange={setQuery} clearable clearButtonLabel={t('清空搜索')}
      startIcon={<PencilIcon paths={docsIconCatalog[0].paths} sourceSize={24} size={22} />} />
    <Tabs.Root value={category} onValueChange={setCategory} size="sm">
      <Tabs.List overflow="buttons" scrollPreviousLabel={t('向前滚动')} scrollNextLabel={t('向后滚动')} aria-label={t('图标分类')}>
        {iconCategories.map(([key, label, icon]) => <Tabs.Trigger key={key} value={key}
          startIcon={<DocsIcon data={icon} size={24} />}>{t(label)}</Tabs.Trigger>)}
      </Tabs.List>
      <Tabs.Content value={category}>
        <Tooltip.Provider delayDuration={250}>
        <div ref={grid} className="icon-examples__grid" role="group" tabIndex={0} aria-label={t('图标目录')}>
          {icons.map(icon => <IconTile key={icon.key} icon={icon} visible={visible.has(icon.key)}
            selected={selected === icon.key} onSelect={onSelect} variant={variant} />)}
          {!icons.length && <PencilText as="p" role="status" className="icon-examples__empty">没有匹配的图标</PencilText>}
        </div>
        </Tooltip.Provider>
      </Tabs.Content>
    </Tabs.Root>
  </div>;
});
