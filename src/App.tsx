import { Accordion, Button, Drawer, DropdownMenu, Input, Layout, PencilLine, PencilSurface, RadioGroup, RadioGroupItem, Resizable, Tooltip } from '@inkra/react';
import { DocsSelect } from './components/DocsSelect';
import { navigationIcon } from './components/iconCatalog';
import { BrandMark } from './components/BrandMark';
import { GitHubLink } from './components/GitHubLink';
import { useLocale } from './i18n';
import { DeferredPencilText as PencilText } from './components/HomeDemo';
import { docsLanguages, resolveDocsLocale } from './docsLocales';
import { __iconData as languagesIcon } from 'lucide-react/dist/esm/icons/languages.mjs';
import { __iconData as arrowLeftIcon } from 'lucide-react/dist/esm/icons/arrow-left.mjs';
import { __iconData as arrowRightIcon } from 'lucide-react/dist/esm/icons/arrow-right.mjs';
import { __iconData as menuIcon } from 'lucide-react/dist/esm/icons/menu.mjs';
import { __iconData as monitorIcon } from 'lucide-react/dist/esm/icons/monitor.mjs';
import { __iconData as moonIcon } from 'lucide-react/dist/esm/icons/moon.mjs';
import { __iconData as searchIcon } from 'lucide-react/dist/esm/icons/search.mjs';
import { __iconData as sunIcon } from 'lucide-react/dist/esm/icons/sun.mjs';
import { __iconData as xIcon } from 'lucide-react/dist/esm/icons/x.mjs';
import {
  type FormEvent,
  type KeyboardEvent as ReactKeyboardEvent,
  type RefObject,
  type ReactNode,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  lazy,
  Suspense,
} from 'react';
import { componentNavigationGroups, foundationComponents, foundationNames } from './componentRoutes';
import { pageTitle } from './pageTitle';
import { readComponentPageTab, readDocumentAnchor, scrollToDocumentAnchor } from './documentAnchors';
import { ThemeCustomizer } from './components/ThemeCustomizer';
import { HomePage } from './components/HomePage';
import { DocsIcon, type LucideIconData } from './components/DocsIcon';

import { originBlogPath, type ButtonTab, type RoutePath, type Theme } from './routes';

const DocumentRoute = lazy(() => import('./components/DocumentRoute'));
const BlogPage = lazy(() => import('./components/BlogPage').then(module => ({ default: module.BlogPage })));
const EcosystemPage = lazy(() => import('./components/EcosystemPage').then(module => ({ default: module.EcosystemPage })));

type NavItem = {
  path: RoutePath;
  label: string;
  description: string;
};

type NavGroup = { label: string; items: NavItem[]; children?: NavGroup[] };

const navGroups: NavGroup[] = [
  {
    label: '开始',
    items: [
      { path: '/getting-started', label: '快速开始', description: '安装、样式与基础用法' },
      { path: '/internationalization', label: '国际化', description: '语言与自定义字典' },
      { path: '/theming', label: '主题定制', description: '主题模式、局部变量与笔触' },
    ],
  },
  { label: '组件', items: [], children: componentNavigationGroups.map(group => ({
    label: group.label,
    items: group.components.map(name => ({
      path: `/components/${name}` as RoutePath,
      label: name === 'button' ? 'Button' : foundationNames[name],
      description: name === 'button' ? '按钮预览、API 与无障碍' : foundationNames[name],
    })),
  })) },
  {
    label: '设计资源',
    items: [{ path: '/design-standard', label: '设计规范', description: '色彩、排版与铅笔材质' }, { path: '/usage-guide', label: '使用指南', description: '设计规范的使用规则与示例' }],
  },
];

function flattenNavGroups(groups: NavGroup[]): NavGroup[] {
  return groups.flatMap(group => [group, ...flattenNavGroups(group.children ?? [])]);
}

const flatNavGroups = flattenNavGroups(navGroups);
const allNavItems = flatNavGroups.flatMap(group => group.items);

function DocumentPageNavigation({ currentPath, onNavigate }: {
  currentPath: RoutePath;
  onNavigate: (path: RoutePath) => void;
}) {
  const { t } = useLocale();
  const cancelFocus = useRef<() => void>(() => {});
  useEffect(() => () => cancelFocus.current(), []);
  const index = allNavItems.findIndex(item => item.path === currentPath);
  if (index < 0) return null;
  const previous = allNavItems[index - 1];
  const next = allNavItems[index + 1];
  const pageLink = (item: NavItem, direction: 'prev' | 'next') => (
    <a className={`docs-page-navigation__link docs-page-navigation__link--${direction}`}
      href={routeHref(item.path)} rel={direction}
      onClick={event => {
        if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        event.preventDefault();
        onNavigate(item.path);
        cancelFocus.current();
        // A newly visited document may still be loading its route chunk.
        let observer: MutationObserver | undefined;
        let timeout: ReturnType<typeof setTimeout> | undefined;
        let frame = 0;
        const stop = () => {
          window.cancelAnimationFrame(frame);
          observer?.disconnect();
          clearTimeout(timeout);
        };
        cancelFocus.current = stop;
        const focus = () => {
          if (window.location.pathname !== routeHref(item.path)) { stop(); return; }
          const heading = document.querySelector<HTMLElement>('#main-content .documentation h1');
          if (!heading || !heading.getClientRects().length) return;
          heading.setAttribute('tabindex', '-1');
          heading.focus({ preventScroll: true });
          stop();
        };
        observer = new MutationObserver(focus);
        observer.observe(document.getElementById('main-content') ?? document.body, { childList: true, subtree: true });
        timeout = setTimeout(stop, 30000);
        frame = window.requestAnimationFrame(focus);
      }}>
      <PencilSurface as="span" className="docs-page-navigation__hover" variant="selection" aria-hidden="true" seed={`docs-${direction}-hover`} />
      <span className="docs-page-navigation__content">
        <span className="docs-page-navigation__direction">
          {direction === 'prev' && <DocsIcon data={arrowLeftIcon} size={20} seed="docs-previous-arrow" />}
          <PencilText seed={`docs-${direction}-label`}>{t(direction === 'prev' ? '上一页' : '下一页')}</PencilText>
          {direction === 'next' && <DocsIcon data={arrowRightIcon} size={20} seed="docs-next-arrow" />}
        </span>
        <PencilText className="docs-page-navigation__title" seed={`docs-${direction}-${item.path}`}>{item.label}</PencilText>
      </span>
    </a>
  );
  return <nav className="docs-page-navigation" aria-label={t('文档页导航')}>
    <PencilLine className="docs-page-navigation__divider" aria-hidden="true" seed="docs-page-navigation-divider" />
    <div className="docs-page-navigation__links">
      {previous && pageLink(previous, 'prev')}
      {next && pageLink(next, 'next')}
    </div>
  </nav>;
}

function expandedForPath(path: RoutePath): string[] {
  return flatNavGroups.filter(group => flattenNavGroups([group])
    .some(child => child.items.some(item => item.path === path))).map(group => group.label);
}

const themeOptions: Array<{ value: Theme; label: string; icon: LucideIconData }> = [
  { value: 'auto', label: '跟随系统', icon: monitorIcon },
  { value: 'light', label: '浅色主题', icon: sunIcon },
  { value: 'dark', label: '深色主题', icon: moonIcon },
];

function isBlogPath(pathname: string): boolean {
  return pathname === '/blog' || pathname === originBlogPath;
}

function validPath(pathname: string): RoutePath {
  pathname = pathname.replace(/\/+$/, '') || '/';
  if (pathname === '/' || pathname === '/blog' || pathname === originBlogPath || pathname === '/ecosystem') return pathname;
  pathname = pathname.replace(/^\/docs(?=\/|$)/, '') || '/getting-started';
  if (foundationComponents.some(name => pathname === `/components/${name}`)) return pathname as RoutePath;
  if (pathname === '/components/button' || pathname === '/design-standard' || pathname === '/usage-guide' || pathname === '/internationalization' || pathname === '/theming') return pathname;
  return '/getting-started';
}

function routeHref(path: RoutePath): string {
  return path === '/' || isBlogPath(path) || path === '/ecosystem' ? path : `/docs${path}`;
}

function legacyLocation(): { path: RoutePath; tab?: ButtonTab } {
  const hash = window.location.hash.slice(1);
  const path = validPath(window.location.pathname);
  if (path === '/getting-started' && hash === 'internationalization') return { path: '/internationalization' };
  if (path.startsWith('/components/')) return { path, tab: readButtonTab() };
  if (window.location.pathname !== '/') return { path };
  if (hash === 'api' || hash === 'accessibility') return { path: '/components/button', tab: hash };
  if (hash === 'preview' || hash === 'variants' || hash === 'sizes' || hash === 'states') {
    return { path: '/components/button', tab: 'preview' };
  }
  if (hash === 'design-standard') return { path: '/design-standard' };
  return { path: validPath(window.location.pathname) };
}

function readButtonTab(): ButtonTab {
  return readComponentPageTab(window.location.hash);
}

function readInitialTheme(): Theme {
  try {
    const stored = window.localStorage.getItem('inkra-docs-theme');
    return stored === 'light' || stored === 'dark' || stored === 'auto' ? stored : 'light';
  } catch { return 'light'; }
}

function ThemeControl({ theme, onChange }: { theme: Theme; onChange: (theme: Theme) => void }) {
  const { t } = useLocale();
  const name = useId();
  return (
    <RadioGroup className="theme-control" name={`docs-theme-${name}`} variant="segmented" orientation="horizontal" aria-label={t('主题模式')} value={theme} onValueChange={value => onChange(value as Theme)}>
      {themeOptions.map(({ value, label, icon }) => (
        <RadioGroupItem key={value} value={value} label={<span className="sr-only">{t(label)}</span>} title={t(label)} icon={<DocsIcon active={theme === value} data={icon} seed={`theme-${value}`} size={28} />} />
      ))}
    </RadioGroup>
  );
}

function SideNavigation({
  currentPath,
  onNavigate,
}: {
  currentPath: RoutePath;
  onNavigate: (path: RoutePath) => void;
}) {
  const { t } = useLocale();
  const [query, setQuery] = useState('');
  const [expanded, setExpanded] = useState(() => expandedForPath(currentPath));
  const [searchClosed, setSearchClosed] = useState<string[]>([]);
  const keyword = query.trim().toLocaleLowerCase();
  const filterGroups = (source: NavGroup[], ancestors = ''): NavGroup[] => source.map(group => {
    const category = `${ancestors} ${group.label} ${t(group.label)}`;
    return {
      ...group,
      items: group.items.filter(item => `${category} ${item.label} ${t(item.label)} ${item.description} ${t(item.description)} ${item.path}`.toLocaleLowerCase().includes(keyword)),
      children: group.children ? filterGroups(group.children, category) : undefined,
    };
  }).filter(group => group.items.length || group.children?.length);
  const groups = filterGroups(navGroups);
  const visibleGroups = keyword ? flattenNavGroups(groups).filter(group => !searchClosed.includes(group.label)).map(group => group.label) : expanded;
  const firstResult = flattenNavGroups(groups).flatMap(group => group.items)[0];
  const updateQuery = (value: string) => { setQuery(value); setSearchClosed([]); };
  useEffect(() => {
    setExpanded(previous => [...new Set([...previous, ...expandedForPath(currentPath)])]);
  }, [currentPath]);
  const renderGroups = (source: NavGroup[], depth = 0): ReactNode => {
    const labels = source.map(group => group.label);
    return <Accordion.Root type="multiple" value={visibleGroups.filter(label => labels.includes(label))} onValueChange={next => {
        if (keyword) setSearchClosed(previous => [...previous.filter(label => !labels.includes(label)), ...labels.filter(label => !next.includes(label))]);
        else setExpanded(previous => [...previous.filter(label => !labels.includes(label)), ...next]);
      }}>
      {source.map((group) => (
        <Accordion.Item className={`nav-group${depth ? ' nav-group--nested' : ''}`} key={group.label} value={group.label} showDivider={false}>
          <Accordion.Header>
            <Accordion.Trigger className="nav-group-label">
              <DocsIcon data={navigationIcon(group.label)} size={26} /><PencilText ellipsis className="side-navigation__label" seed={`nav-group-${group.label}`}>{group.label}</PencilText>
            </Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Content contentClassName="nav-group__content">{group.children ? renderGroups(group.children, depth + 1) : <ul>
            {group.items.map((item) => (
              <li key={item.path}>
                <a
                  aria-current={currentPath === item.path ? 'page' : undefined}
                  className="nav-link"
                  href={routeHref(item.path)}
                  onClick={(event) => {
                    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
                    event.preventDefault();
                    onNavigate(item.path);
                    updateQuery('');
                  }}
                >
                  {currentPath === item.path ? <PencilSurface aria-hidden="true" className="selection-backdrop" seed={`nav-selection-${item.path}`} variant="selection" /> : null}
                  <span className="selection-control-content"><DocsIcon data={navigationIcon(item.label)} size={26} /><PencilText ellipsis className="side-navigation__label" seed={`nav-${item.path}`}>{item.label}</PencilText></span>
                </a>
              </li>
            ))}
          </ul>}</Accordion.Content>
        </Accordion.Item>
      ))}
      </Accordion.Root>;
  };
  return (
    <nav className="side-navigation" aria-label={t("组件文档目录")}>
      <div className="side-navigation__search">
        <Input type="search" aria-label={t('搜索目录')} placeholder={t('搜索目录')} value={query} onValueChange={updateQuery} clearable clearButtonLabel={t('清空目录搜索')} startIcon={<DocsIcon data={searchIcon} size={22} />} onKeyDown={event => {
          if (event.key === 'Escape' && query) { event.preventDefault(); event.stopPropagation(); updateQuery(''); }
          if (event.key === 'Enter' && keyword && firstResult) { event.preventDefault(); onNavigate(firstResult.path); updateQuery(''); }
        }} />
      </div>
      <div className="side-navigation__groups">
      {renderGroups(groups)}
      {!groups.length && <PencilText as="p" role="status" className="side-navigation__empty">没有匹配的目录</PencilText>}
      </div>
    </nav>
  );
}

function SearchBox({ onNavigate, expanded = false, onClose }: { onNavigate: (path: RoutePath) => void; expanded?: boolean; onClose?: () => void }) {
  const { t } = useLocale();
  const searchId = useId();
  const resultsId = `${searchId}-results`;
  const [query, setQuery] = useState('');
  const [focused, setFocused] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const results = useMemo(() => {
    const keyword = query.trim().toLocaleLowerCase('zh-CN');
    return keyword
      ? allNavItems.filter((item) => `${t(item.label)} ${t(item.description)} ${item.label}`.toLocaleLowerCase().includes(keyword))
      : expanded ? allNavItems : [];
  }, [query, t, expanded]);
  useEffect(() => setActiveIndex(0), [t]);
  useEffect(() => {
    if (focused) document.getElementById(`${searchId}-result-${activeIndex}`)?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex, focused, query, searchId]);
  const showResults = expanded || (focused && Boolean(query));

  const openResult = (item: NavItem) => {
    onNavigate(item.path);
    setQuery('');
    setFocused(false);
  };

  const handleKeyDown = (event: ReactKeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Escape') {
      if (expanded) return;
      setQuery('');
      setFocused(false);
    } else if (results.length && event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex((index) => (index + 1) % results.length);
    } else if (results.length && event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((index) => (index - 1 + results.length) % results.length);
    } else if (results.length && event.key === 'Enter') {
      event.preventDefault();
      const item = results[activeIndex];
      if (item) openResult(item);
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const item = results[activeIndex] ?? results[0];
    if (item) openResult(item);
  };

  return (
    <form className={expanded ? 'search-screen' : 'header-search'} onSubmit={handleSubmit} role="search">
      <div className="search-input-row">
      {expanded && <Button size="icon" variant="ghost" aria-label={t('关闭')} title={t('关闭')} onClick={onClose}><DocsIcon data={arrowLeftIcon} size={30} /></Button>}
      <label className="visually-hidden" htmlFor={searchId}>{t('搜索文档')}</label>
      <Input
        aria-activedescendant={showResults && results[activeIndex] ? `${searchId}-result-${activeIndex}` : undefined}
        aria-autocomplete="list"
        aria-controls={showResults ? resultsId : undefined}
        aria-expanded={showResults}
        autoComplete="off"
        clearable
        clearButtonLabel={t('清空搜索')}
        id={searchId}
        onBlur={() => { if (!expanded) window.setTimeout(() => setFocused(false), 100); }}
        onValueChange={(value) => { setQuery(value); setActiveIndex(0); setFocused(true); }}
        onFocus={() => setFocused(true)}
        onKeyDown={handleKeyDown}
        placeholder={t('搜索文档')}
        role="combobox"
        seed="docs-search"
        startIcon={<DocsIcon data={searchIcon} seed="search-icon" size={22} />}
        type="search"
        value={query}
      />
      </div>
      {showResults ? (
        <PencilSurface className="search-results" id={resultsId} role="listbox" aria-label={t('搜索文档')} seed="search-results" variant={expanded ? 'ghost' : 'paper'}>
          {results.length ? results.map((item, index) => (
            <button
              aria-selected={activeIndex === index}
              className="search-result"
              id={`${searchId}-result-${index}`}
              key={item.path}
              onMouseEnter={() => setActiveIndex(index)}
              onMouseDown={event => event.preventDefault()}
              onClick={() => openResult(item)}
              role="option"
              type="button"
            >
              <PencilText seed={`search-label-${index}`}>{item.label}</PencilText>
              {t(item.description) !== t(item.label) && <PencilText as="small" seed={`search-description-${index}`}>{item.description}</PencilText>}
            </button>
          )) : (
            <PencilText as="p" className="search-empty" seed="search-empty">没有匹配的页面</PencilText>
          )}
        </PencilSurface>
      ) : null}
    </form>
  );
}

function MobileSearch({ onNavigate }: { onNavigate: (path: RoutePath) => void }) {
  const { t } = useLocale();
  const [open, setOpen] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const mobile = window.matchMedia('(max-width: 48rem)');
    const update = () => { if (!mobile.matches) setOpen(false); };
    mobile.addEventListener('change', update);
    return () => mobile.removeEventListener('change', update);
  }, []);
  return <Drawer.Root open={open} onOpenChange={setOpen}>
    <Drawer.Trigger asChild><Button className="mobile-search-trigger" size="icon" variant="ghost" aria-label={t('搜索文档')} title={t('搜索文档')}><DocsIcon data={searchIcon} size={30} /></Button></Drawer.Trigger>
    <Drawer.Portal>
      <Drawer.Backdrop />
      <Drawer.Content ref={dialogRef} className="mobile-search-dialog" direction="bottom" size="100dvh" aria-describedby={undefined}
        onOpenAutoFocus={event => { event.preventDefault(); dialogRef.current?.querySelector('input')?.focus(); }}
        onCloseAutoFocus={event => {
          if (!window.matchMedia('(max-width: 48rem)').matches) {
            event.preventDefault();
            document.querySelector<HTMLInputElement>('.app-header .header-search input')?.focus();
          }
        }}>
        <Drawer.Title className="visually-hidden">{t('搜索文档')}</Drawer.Title>
        <SearchBox expanded onClose={() => setOpen(false)} onNavigate={path => { setOpen(false); onNavigate(path); }} />
      </Drawer.Content>
    </Drawer.Portal>
  </Drawer.Root>;
}

function LanguageControl() {
  const { locale, setLocale, t } = useLocale();
  return <div className="language-control" title={t('语言')}>
    <DocsSelect label="语言" hideLabel startIcon={<DocsIcon data={languagesIcon} seed="language-icon" size={28} />} value={locale} onValueChange={value => setLocale(resolveDocsLocale(value))} options={docsLanguages} />
  </div>;
}

function SidebarPreferences({ theme, onThemeChange }: { theme: Theme; onThemeChange: (theme: Theme) => void }) {
  return <div className="sidebar-preferences"><PencilLine seed="preferences-divider" /><LanguageControl /><ThemeControl theme={theme} onChange={onThemeChange} /></div>;
}

function HomeLanguageMenu() {
  const { locale, setLocale, t } = useLocale();
  const label = t('语言');
  return <DropdownMenu.Root>
    <Tooltip.Provider><Tooltip.Root>
      <Tooltip.Trigger asChild><DropdownMenu.Trigger asChild>
        <Button className="header-language" size="icon" variant="ghost" aria-label={label}>
          <DocsIcon data={languagesIcon} seed="header-language" size={30} />
        </Button>
      </DropdownMenu.Trigger></Tooltip.Trigger>
      <Tooltip.Portal><Tooltip.Content side="bottom">{label}</Tooltip.Content></Tooltip.Portal>
    </Tooltip.Root></Tooltip.Provider>
    <DropdownMenu.Portal><DropdownMenu.Content align="end" sideOffset={8} aria-label={label}>
      <DropdownMenu.RadioGroup value={locale} onValueChange={value => setLocale(resolveDocsLocale(value))}>
        {docsLanguages.map(([value, label]) => <DropdownMenu.RadioItem key={value} value={value}>{label}</DropdownMenu.RadioItem>)}
      </DropdownMenu.RadioGroup>
    </DropdownMenu.Content></DropdownMenu.Portal>
  </DropdownMenu.Root>;
}

function AppHeader({
  theme,
  onThemeChange,
  currentPath,
  menuButtonRef,
  onNavigate,
  onOpenMenu,
}: {
  theme: Theme;
  onThemeChange: (theme: Theme) => void;
  currentPath: RoutePath;
  menuButtonRef: RefObject<HTMLButtonElement | null>;
  onNavigate: (path: RoutePath) => void;
  onOpenMenu: () => void;
}) {
  const { t } = useLocale();
  const docsActive = currentPath !== '/' && !isBlogPath(currentPath) && currentPath !== '/ecosystem';
  const activeSection = docsActive ? '/getting-started' : isBlogPath(currentPath) ? '/blog' : currentPath;
  const links = [{ path: '/getting-started', label: '文档' }, { path: '/blog', label: '博客' }, { path: '/ecosystem', label: '生态' }] as const;
  const brand = <a className="brand" href="/" onClick={(event) => { if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return; event.preventDefault(); onNavigate('/'); }}>
    <BrandMark />
    <PencilText className="brand-word" seed="inkra-brand">Inkra</PencilText>
  </a>;
  const brandSlot = <div className="header-brand">
        {docsActive && <button aria-label={t("打开文档目录")} className="icon-button menu-button" data-tooltip={t("打开目录")} onClick={onOpenMenu} ref={menuButtonRef} type="button">
          <DocsIcon data={menuIcon} seed="menu-icon" size={30} />
        </button>}
        {brand}
  </div>;
  const navigation = <>
        <nav className="site-navigation inkra-tabs" data-size="md" aria-label={t('主导航')}>
          {links.map(({ path, label }, index) => <div className="site-navigation__item" key={path}>
            {index > 0 && <PencilLine className="site-navigation__divider" orientation="vertical" seed={`site-divider-${path}`} />}
            <a className="inkra-tabs__trigger" data-state={path === activeSection ? 'active' : 'inactive'} href={routeHref(path)} aria-current={path === activeSection ? 'page' : undefined}
              onClick={event => { if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return; event.preventDefault(); onNavigate(path); }}>
              <PencilSurface as="span" aria-hidden="true" className="inkra-tabs__selection" variant="selection" seed={`site-tab-${path}`} />
              <PencilSurface as="span" aria-hidden="true" className="inkra-tabs__focus-ring" variant="outline" seed={`site-tab-${path}-focus`} />
              <span className="inkra-tabs__label"><PencilText>{label}</PencilText></span>
            </a>
          </div>)}
        </nav>
        <PencilLine className="header-action-divider" orientation="vertical" seed="header-search-divider" />
        <SearchBox onNavigate={onNavigate} />
        <PencilLine className="header-action-divider" orientation="vertical" seed="header-actions-divider" />
        <ThemeCustomizer theme={theme} onThemeChange={onThemeChange} triggerVariant="ghost" renderTrigger={trigger =>
          <div className="header-action-group" role="group" aria-label={t('页面操作')}>
            <MobileSearch onNavigate={onNavigate} />
            {!docsActive && <HomeLanguageMenu />}
            {trigger}<GitHubLink variant="ghost" />
          </div>} />
  </>;
  return <Layout.Header className={`app-header app-header--shared${docsActive ? ' app-header--docs' : ''}`} padding={5} sidebar={brandSlot} sidebarDivided divided>
    <div className="header-inner">{navigation}</div>
  </Layout.Header>;
}

function MobileDrawer({
  currentPath,
  onClose,
  onNavigate,
  onThemeChange,
  open,
  theme,
}: {
  currentPath: RoutePath;
  onClose: () => void;
  onNavigate: (path: RoutePath) => void;
  onThemeChange: (theme: Theme) => void;
  open: boolean;
  theme: Theme;
}) {
  const { t } = useLocale();
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLElement>(null);
  useEffect(() => {
    if (!open) return;
    closeButtonRef.current?.focus();
    const overflow = document.body.style.overflow;
    const background = Array.from(document.querySelectorAll<HTMLElement>('.app-header, .docs-layout'));
    document.body.style.overflow = 'hidden';
    background.forEach((element) => {
      element.inert = true;
      element.setAttribute('aria-hidden', 'true');
    });
    return () => {
      document.body.style.overflow = overflow;
      background.forEach((element) => {
        element.inert = false;
        element.removeAttribute('aria-hidden');
      });
    };
  }, [open]);
  if (!open) return null;
  return (
    <div className="drawer-layer" onKeyDown={(event) => {
      if (event.key === 'Escape') {
        onClose();
        return;
      }
      if (event.key !== 'Tab') return;
      const focusable = Array.from(drawerRef.current?.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), input:not([disabled])') ?? []).filter(element => element.getClientRects().length && element.tabIndex >= 0);
      const first = focusable[0];
      const last = focusable.at(-1);
      if (!first || !last) return;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }}>
      <button aria-label={t("关闭文档目录")} className="drawer-backdrop" onClick={onClose} tabIndex={-1} type="button" />
      <PencilSurface as="aside" aria-label={t("文档目录")} aria-modal="true" className="mobile-drawer" ref={drawerRef} role="dialog" seed="mobile-drawer" variant="full">
        <div className="drawer-header">
          <a className="drawer-brand" href="/" onClick={event => {
            if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
            event.preventDefault();
            onNavigate('/');
          }}><BrandMark /><PencilText className="brand-word" seed="drawer-brand">Inkra</PencilText></a>
          <button aria-label={t("关闭文档目录")} className="icon-button" data-tooltip={t("关闭目录")} onClick={onClose} ref={closeButtonRef} type="button">
            <DocsIcon data={xIcon} seed="close-drawer" size={30} />
          </button>
        </div>
        <SideNavigation currentPath={currentPath} onNavigate={(path) => { onNavigate(path); onClose(); }} />
        <SidebarPreferences theme={theme} onThemeChange={onThemeChange} />
      </PencilSurface>
    </div>
  );
}

function DocsNavigationPanel({ width, onWidthChange, children }: {
  width: number;
  onWidthChange: (width: number) => void;
  children: ReactNode;
}) {
  // Restore on mount, but keep defaultSize stable while a drag updates the header.
  const [initialWidth] = useState(width);
  return <Resizable.Panel id="docs-navigation" className="docs-sidebar-panel" defaultSize={initialWidth} minSize={200} maxSize={360} groupResizeBehavior="preserve-pixel-size" style={{ overflow: 'visible' }} onResize={size => {
    if (window.matchMedia('(min-width: 769px)').matches) onWidthChange(size.inPixels);
  }}>{children}</Resizable.Panel>;
}

export function App() {
  const initial = legacyLocation();
  const [theme, setTheme] = useState<Theme>(readInitialTheme);
  const [route, setRoute] = useState<RoutePath>(initial.path);
  const [buttonTab, setButtonTab] = useState<ButtonTab>(initial.tab ?? readButtonTab());
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(240);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const cancelAnchorScroll = useRef<() => void>(() => {});
  const isDocs = route !== '/' && !isBlogPath(route) && route !== '/ecosystem';
  const { t } = useLocale();

  useEffect(() => {
    document.title = pageTitle(route, t);
  }, [route, t]);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.dataset.inkraTheme = theme;
    try { window.localStorage.setItem('inkra-docs-theme', theme); } catch { /* Theme changes do not require storage. */ }
  }, [theme]);

  useEffect(() => {
    const header = document.querySelector('.app-header');
    if (!header) return;
    const update = () => document.documentElement.style.setProperty('--docs-header-height', `${header.getBoundingClientRect().height}px`);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(header);
    return () => {
      observer.disconnect();
      document.documentElement.style.removeProperty('--docs-header-height');
    };
  }, [isDocs]);

  useEffect(() => {
    const initialLocation = legacyLocation();
    const samePage = validPath(window.location.pathname) === initialLocation.path;
    const canonicalHash = samePage && readDocumentAnchor(window.location.hash)
      ? window.location.hash
      : initialLocation.path.startsWith('/components/') ? `#${initialLocation.tab ?? 'preview'}` : '';
    if (window.location.pathname !== routeHref(initialLocation.path) || window.location.hash !== canonicalHash) {
      window.history.replaceState(null, '', `${routeHref(initialLocation.path)}${window.location.search}${canonicalHash}`);
    }
    cancelAnchorScroll.current = scrollToDocumentAnchor(window.location.hash);
    const onPopState = () => {
      const next = legacyLocation();
      if (next.path === '/internationalization' && validPath(window.location.pathname) === '/getting-started') {
        window.history.replaceState(null, '', `${routeHref(next.path)}${window.location.search}`);
      }
      setRoute(next.path);
      setButtonTab(next.tab ?? readButtonTab());
      cancelAnchorScroll.current();
      if (readDocumentAnchor(window.location.hash)) {
        cancelAnchorScroll.current = scrollToDocumentAnchor(window.location.hash);
      } else {
        window.scrollTo({ top: 0, behavior: 'auto' });
      }
    };
    window.addEventListener('popstate', onPopState);
    window.addEventListener('hashchange', onPopState);
    return () => {
      window.removeEventListener('popstate', onPopState);
      window.removeEventListener('hashchange', onPopState);
      cancelAnchorScroll.current();
    };
  }, []);

  const navigate = (path: RoutePath, tab?: ButtonTab) => {
    cancelAnchorScroll.current();
    const nextTab = path.startsWith('/components/') ? tab ?? 'preview' : undefined;
    window.history.pushState(null, '', `${routeHref(path)}${nextTab ? `#${nextTab}` : ''}`);
    setRoute(path);
    setDrawerOpen(false);
    if (nextTab) setButtonTab(nextTab);
    window.scrollTo({ top: 0, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  };

  const changeButtonTab = (tab: ButtonTab) => {
    if (window.location.hash === `#${tab}`) return;
    cancelAnchorScroll.current();
    window.history.pushState(null, '', `${routeHref(route)}#${tab}`);
    setButtonTab(tab);
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
    window.requestAnimationFrame(() => menuButtonRef.current?.focus());
  };

  return (
    <div className="app-shell">
      <PencilSurface aria-hidden="true" className="page-paper" seed="docs-viewport-paper" variant="full" />
      <Layout.Root className={`site-shell${isDocs ? ' docs-shell' : ''}`} collapseAt="never" sidebarWidth={sidebarWidth}>
      <AppHeader currentPath={route} menuButtonRef={menuButtonRef} onNavigate={navigate} onOpenMenu={() => setDrawerOpen(true)} theme={theme} onThemeChange={setTheme} />
      {isDocs ? <Layout.Body className="docs-layout">
        <Resizable.Root className="docs-resizable" style={{ overflow: 'visible' }}>
        <DocsNavigationPanel width={sidebarWidth} onWidthChange={setSidebarWidth}>
        <Layout.Sidebar className="desktop-sidebar" width="100%" padding={0} divided><SideNavigation currentPath={route} onNavigate={navigate} /><SidebarPreferences theme={theme} onThemeChange={setTheme} /></Layout.Sidebar>
        </DocsNavigationPanel>
        <Resizable.Handle className="docs-sidebar-resize" />
        <Resizable.Panel id="docs-content" className="docs-content-panel" minSize="40%" style={{ overflow: 'visible' }}>
        <Layout.Content as="main" id="main-content" className="docs-main" padding={0}>
          <Suspense fallback={<div className="documentation" role="status">{t('加载中')}</div>}>
            <DocumentRoute route={route} activeTab={buttonTab} onTabChange={changeButtonTab} onNavigate={navigate} theme={theme} />
          </Suspense>
          <DocumentPageNavigation currentPath={route} onNavigate={navigate} />
        </Layout.Content>
        </Resizable.Panel>
        </Resizable.Root>
      </Layout.Body> : route === '/' ? <HomePage themeControl={<ThemeControl theme={theme} onChange={setTheme} />} /> : <Suspense fallback={<main id="main-content" className="site-page" role="status">{t('加载中')}</main>}>{isBlogPath(route) ? <BlogPage article={route === originBlogPath} onNavigate={navigate} /> : <EcosystemPage />}</Suspense>}
      </Layout.Root>
      {isDocs && <MobileDrawer currentPath={route} onClose={closeDrawer} onNavigate={navigate} onThemeChange={setTheme} open={drawerOpen} theme={theme} />}
    </div>
  );
}
