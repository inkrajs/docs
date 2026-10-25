import { Accordion, Button, ButtonGroup, ButtonLink, Drawer, DropdownMenu, Input, Layout, PencilLine, PencilSurface, RadioGroup, RadioGroupItem, Resizable, Switch, Tabs, Tooltip } from '@inkra/react';
import { ButtonGroupPlayground } from './components/ButtonGroupPlayground';
import { DocsSelect } from './components/DocsSelect';
import { InternationalizationExamples } from './components/InternationalizationExamples';
import { ThemeExamples } from './components/ThemeExamples';
import { navigationIcon } from './components/iconCatalog';
import { BrandMark } from './components/BrandMark';
import { GitHubLink } from './components/GitHubLink';
import { PencilText, useLocale } from './i18n';
import { docsLanguages, resolveDocsLocale } from './docsLocales';
import { __iconData as languagesIcon } from 'lucide-react/dist/esm/icons/languages.mjs';
import type { ButtonAlign, ButtonLoadingPosition, ButtonSize, ButtonVariant } from '@inkra/react';
import { __iconData as checkIcon } from 'lucide-react/dist/esm/icons/check.mjs';
import { __iconData as arrowLeftIcon } from 'lucide-react/dist/esm/icons/arrow-left.mjs';
import { __iconData as arrowRightIcon } from 'lucide-react/dist/esm/icons/arrow-right.mjs';
import { __iconData as codeIcon } from 'lucide-react/dist/esm/icons/code-xml.mjs';
import { __iconData as copyIcon } from 'lucide-react/dist/esm/icons/copy.mjs';
import { __iconData as menuIcon } from 'lucide-react/dist/esm/icons/menu.mjs';
import { __iconData as monitorIcon } from 'lucide-react/dist/esm/icons/monitor.mjs';
import { __iconData as moonIcon } from 'lucide-react/dist/esm/icons/moon.mjs';
import { __iconData as plusIcon } from 'lucide-react/dist/esm/icons/plus.mjs';
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
} from 'react';
import { ColorSystem } from './components/ColorSystem';
import { GeometrySystem } from './components/GeometrySystem';
import { TypographySystem } from './components/TypographySystem';
import { UsageGuide } from './components/UsageGuide';
import { FoundationPage, foundationComponents, foundationNames, type FoundationComponent } from './components/FoundationPages';
import { componentNavigationGroups } from './componentRoutes';
import { pageTitle } from './pageTitle';
import { readComponentPageTab, readDocumentAnchor, scrollToDocumentAnchor } from './documentAnchors';
import { ThemeCustomizer } from './components/ThemeCustomizer';
import { ComponentPageTabs } from './components/ComponentPageTabs';
import { buttonAccessibilityGuidance, GuidanceMarkdown } from './components/GuidanceMarkdown';
import { PageHeading } from './components/PageHeading';
import { ApiGroups } from './components/ApiGroups';
import { buttonApiGroups } from './components/buttonApiGroups';
import { CodeBlock } from './components/CodeBlock';
import { ComponentExample } from './components/ComponentExample';
import { CodeSample } from './components/CodeSample';
import { HomePage } from './components/HomePage';
import { PropertyTabs } from './components/PropertyTabs';
import { DocsIcon, type LucideIconData } from './components/DocsIcon';

type Theme = 'auto' | 'light' | 'dark';
type RoutePath = '/' | '/blog' | '/ecosystem' | '/getting-started' | '/internationalization' | '/theming' | '/components/button' | '/design-standard' | '/usage-guide' | `/components/${FoundationComponent}`;
type ButtonTab = 'preview' | 'api' | 'accessibility';
type PreviewTab = 'preview' | 'code';
type ExampleKind = 'appearance' | 'size' | 'icon-size' | 'icons' | 'state' | 'link' | 'group' | 'rtl';

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

function expandedForPath(path: RoutePath): string[] {
  return flatNavGroups.filter(group => flattenNavGroups([group])
    .some(child => child.items.some(item => item.path === path))).map(group => group.label);
}

const themeOptions: Array<{ value: Theme; label: string; icon: LucideIconData }> = [
  { value: 'auto', label: '跟随系统', icon: monitorIcon },
  { value: 'light', label: '浅色主题', icon: sunIcon },
  { value: 'dark', label: '深色主题', icon: moonIcon },
];

function validPath(pathname: string): RoutePath {
  pathname = pathname.replace(/\/+$/, '') || '/';
  if (pathname === '/' || pathname === '/blog' || pathname === '/ecosystem') return pathname;
  pathname = pathname.replace(/^\/docs(?=\/|$)/, '') || '/getting-started';
  if (foundationComponents.some(name => pathname === `/components/${name}`)) return pathname as RoutePath;
  if (pathname === '/components/button' || pathname === '/design-standard' || pathname === '/usage-guide' || pathname === '/internationalization' || pathname === '/theming') return pathname;
  return '/getting-started';
}

function routeHref(path: RoutePath): string {
  return path === '/' || path === '/blog' || path === '/ecosystem' ? path : `/docs${path}`;
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

function useCompactLayout() {
  const [compact, setCompact] = useState(() => window.matchMedia('(max-width: 64rem)').matches);
  useEffect(() => {
    const query = window.matchMedia('(max-width: 64rem)');
    const update = () => setCompact(query.matches);
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);
  return compact;
}

function copyText(text: string) {
  if (navigator.clipboard?.writeText) return navigator.clipboard.writeText(text);
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.select();
  const copied = document.execCommand('copy');
  textarea.remove();
  return copied ? Promise.resolve() : Promise.reject(new Error('Copy command failed'));
}

function handleRovingTabs(event: ReactKeyboardEvent<HTMLDivElement>) {
  if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
  const tabs = Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>('[role="tab"]'));
  const currentIndex = tabs.indexOf(document.activeElement as HTMLButtonElement);
  if (currentIndex < 0 || !tabs.length) return;
  event.preventDefault();
  const nextIndex = event.key === 'Home'
    ? 0
    : event.key === 'End'
      ? tabs.length - 1
      : (currentIndex + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
  tabs[nextIndex]?.focus();
  tabs[nextIndex]?.click();
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
        <Button className="header-language" size="icon" variant="outline" aria-label={label}>
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
  const docsActive = currentPath !== '/' && currentPath !== '/blog' && currentPath !== '/ecosystem';
  const home = currentPath === '/';
  const ActionGroup = docsActive ? 'div' : ButtonGroup;
  const links = [{ path: '/getting-started', label: '文档' }, { path: '/blog', label: '博客' }, { path: '/ecosystem', label: '生态' }] as const;
  const brand = <a className="brand" href="/" onClick={(event) => { if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return; event.preventDefault(); onNavigate('/'); }}>
    <BrandMark />
    <PencilText className="brand-word" seed="inkra-brand">Inkra</PencilText>
  </a>;
  const brandSlot = <div className="header-brand">
        <button aria-label={t("打开文档目录")} className="icon-button menu-button" data-tooltip={t("打开目录")} onClick={onOpenMenu} ref={menuButtonRef} type="button">
          <DocsIcon data={menuIcon} seed="menu-icon" size={30} />
        </button>
        {brand}
  </div>;
  const navigation = <>
        <nav className="site-navigation inkra-tabs" data-size="md" aria-label={t('主导航')}>
          {links.map(({ path, label }, index) => <div className="site-navigation__item" key={path}>
            {index > 0 && <PencilLine className="site-navigation__divider" orientation="vertical" seed={`site-divider-${path}`} />}
            <a className="inkra-tabs__trigger" data-state={(path === '/getting-started' ? docsActive : path === currentPath) ? 'active' : 'inactive'} href={routeHref(path)} aria-current={(path === '/getting-started' ? docsActive : path === currentPath) ? 'page' : undefined}
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
        <ThemeCustomizer theme={theme} onThemeChange={onThemeChange} triggerVariant={docsActive ? 'ghost' : 'outline'} renderTrigger={trigger =>
          <ActionGroup className="header-action-group" role="group" aria-label={t('页面操作')}>
            {docsActive && <MobileSearch onNavigate={onNavigate} />}
            {home && <HomeLanguageMenu />}{trigger}<GitHubLink variant={docsActive ? 'ghost' : 'outline'} />
          </ActionGroup>} />
  </>;
  if (docsActive) return <Layout.Header className="app-header app-header--docs" padding={5} sidebar={brandSlot} sidebarDivided divided>
    <div className="header-inner">{navigation}</div>
  </Layout.Header>;
  return (
    <header className="app-header">
      <div className="header-inner">
        {brand}
        <PencilLine className="header-brand-divider header-action-divider" orientation="vertical" seed="header-brand-divider" />
        {navigation}
      </div>
      <PencilLine className="header-divider" seed="header-divider" roughness={0.7} />
    </header>
  );
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

function CopyButton({ code, onResult }: { code: string; onResult: (message: string) => void }) {
  const { t } = useLocale();
  const [status, setStatus] = useState<'idle' | 'copied' | 'failed'>('idle');
  const handleCopy = async () => {
    try {
      await copyText(code);
      setStatus('copied');
      onResult(t('示例代码已复制'));
    } catch {
      setStatus('failed');
      onResult(t('复制失败，请手动选择代码'));
    }
    window.setTimeout(() => setStatus('idle'), 1600);
  };
  const label = t(status === 'copied' ? '已复制代码' : status === 'failed' ? '复制失败' : '复制代码');
  return (
    <button aria-label={label} className="icon-button" data-status={status} data-tooltip={label} onClick={handleCopy} type="button">
      <DocsIcon data={status === 'copied' ? checkIcon : copyIcon} seed={`copy-${status}`} size={30} />
    </button>
  );
}

const comparisonExamples: Record<ExampleKind, { title: string; code: string }> = {
  appearance: {
    title: '外观',
    code: `import { Button } from '@inkra/react';\n\n<Button variant="primary">保存更改</Button>\n<Button variant="secondary">保存更改</Button>\n<Button variant="outline">保存更改</Button>\n<Button variant="ghost">保存更改</Button>\n<Button variant="destructive">删除记录</Button>\n<Button variant="link">查看详情</Button>`,
  },
  size: {
    title: '尺寸',
    code: `import { Button } from '@inkra/react';\n\n<Button size="xs">保存更改</Button>\n<Button size="sm">保存更改</Button>\n<Button size="md">保存更改</Button>\n<Button size="lg">保存更改</Button>`,
  },
  'icon-size': {
    title: '图标尺寸',
    code: `import { Plus } from 'lucide-react';\nimport { Button } from '@inkra/react';\n\n<Button aria-label="新建" size="icon-xs"><Plus /></Button>\n<Button aria-label="新建" size="icon-sm"><Plus /></Button>\n<Button aria-label="新建" size="icon"><Plus /></Button>\n<Button aria-label="新建" size="icon-lg"><Plus /></Button>`,
  },
  icons: {
    title: '前后图标',
    code: `import { ArrowLeft, ArrowRight } from 'lucide-react';\nimport { Button } from '@inkra/react';\n\n<Button startIcon={<ArrowLeft />}>上一步</Button>\n<Button endIcon={<ArrowRight />}>下一步</Button>`,
  },
  state: {
    title: '状态',
    code: `import { useState } from 'react';\nimport { Button } from '@inkra/react';\n\nexport function SaveButton() {\n  const [loading, setLoading] = useState(false);\n  const [status, setStatus] = useState('尚未保存');\n\n  async function save() {\n    setLoading(true);\n    setStatus('保存中');\n    await new Promise(resolve => setTimeout(resolve, 1200));\n    setLoading(false);\n    setStatus('已保存');\n  }\n\n  return <>\n    <Button loading={loading} onClick={save}>保存更改</Button>\n    <span aria-live="polite">{status}</span>\n  </>;\n}`,
  },
  link: {
    title: '链接',
    code: `import { ArrowRight } from 'lucide-react';\nimport { ButtonLink } from '@inkra/react';\n\n<ButtonLink href="/design-standard" endIcon={<ArrowRight />}>设计规范</ButtonLink>\n<ButtonLink disabled href="/design-standard">不可导航</ButtonLink>`,
  },
  group: {
    title: '按钮组',
    code: `import { useState } from 'react';\nimport { Button, ButtonGroup } from '@inkra/react';\n\nexport function ButtonGroups() {\n  const [align, setAlign] = useState<'start' | 'center' | 'end'>('start');\n  const [step, setStep] = useState(1);\n\n  return <>\n    <ButtonGroup aria-label="文本对齐">\n      <Button aria-pressed={align === 'start'} onClick={() => setAlign('start')} variant="outline">左对齐</Button>\n      <Button aria-pressed={align === 'center'} onClick={() => setAlign('center')} variant="outline">居中</Button>\n      <Button aria-pressed={align === 'end'} onClick={() => setAlign('end')} variant="outline">右对齐</Button>\n    </ButtonGroup>\n    <p style={{ textAlign: align }}>对齐示例文字</p>\n\n    <ButtonGroup aria-label="步骤" orientation="vertical">\n      <Button aria-pressed={step === 1} onClick={() => setStep(1)}>第一步</Button>\n      <Button aria-pressed={step === 2} onClick={() => setStep(2)}>第二步</Button>\n    </ButtonGroup>\n  </>;\n}`,
  },
  rtl: {
    title: 'RTL',
    code: `import { ArrowLeft } from 'lucide-react';\nimport { Button } from '@inkra/react';\n\n<div dir="rtl">\n  <Button endIcon={<ArrowLeft />}>继续</Button>\n</div>`,
  },
};

function AsyncButtonExample() {
  const { t } = useLocale();
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('尚未保存');
  const timeoutRef = useRef<number | null>(null);
  useEffect(() => () => {
    if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
  }, []);
  const save = () => {
    setLoading(true);
    setStatus('保存中');
    timeoutRef.current = window.setTimeout(() => {
      setLoading(false);
      setStatus('已保存');
    }, 1200);
  };
  return <div className="async-example"><Button loading={loading} onClick={save} seed="async-save">{t("保存更改")}</Button><PencilText aria-live="polite" seed={`async-status-${status}`}>{status}</PencilText></div>;
}

function ButtonGroupExample() {
  const { t } = useLocale();
  const [alignment, setAlignment] = useState<'start' | 'center' | 'end'>('start');
  const [step, setStep] = useState(1);
  return <>
    <div className="comparison-item comparison-item--wide"><code>horizontal · aria-pressed</code><ButtonGroup aria-label={t('文本对齐')}>{([['start', '左对齐'], ['center', '居中'], ['end', '右对齐']] as const).map(([value, label]) => <Button aria-pressed={alignment === value} key={value} onClick={() => setAlignment(value)} seed={`group-${value}`} variant="outline">{t(label)}</Button>)}</ButtonGroup><PencilText as="p" className="alignment-preview" seed={`alignment-${alignment}`} style={{ textAlign: alignment }}>这行文字会按选择对齐</PencilText></div>
    <div className="comparison-item"><code>{t("vertical · 当前第")}{step}{t("步")}</code><ButtonGroup aria-label={t("步骤")} orientation="vertical"><Button aria-pressed={step === 1} onClick={() => setStep(1)} seed="group-step-1" variant="secondary">{t("第一步")}</Button><Button aria-pressed={step === 2} onClick={() => setStep(2)} seed="group-step-2" variant="secondary">{t("第二步")}</Button></ButtonGroup></div>
  </>;
}

function ComparisonGroup({ kind }: { kind: ExampleKind }) {
  const { t } = useLocale();
  const [announcement, setAnnouncement] = useState('');
  const example = comparisonExamples[kind];
  const handleAction = (label: string) => setAnnouncement(`${label}已触发`);

  return (
    <ComponentExample id={`comparison-${kind}`} title={example.title} code={example.code}
      codeActions={<CopyButton code={example.code} onResult={setAnnouncement} />}>
        <div className={`comparison-row comparison-row--${kind}`}>
          {kind === 'appearance' ? <>
            <div className="comparison-item"><code>primary</code><Button onClick={() => handleAction('Primary')} seed="compare-primary">{t("保存更改")}</Button></div>
            <div className="comparison-item"><code>secondary</code><Button onClick={() => handleAction('Secondary')} seed="compare-secondary" variant="secondary">{t("保存更改")}</Button></div>
            <div className="comparison-item"><code>outline</code><Button onClick={() => handleAction('Outline')} seed="compare-outline" variant="outline">{t("保存更改")}</Button></div>
            <div className="comparison-item"><code>ghost</code><Button onClick={() => handleAction('Ghost')} seed="compare-ghost" variant="ghost">{t("保存更改")}</Button></div>
            <div className="comparison-item"><code>destructive</code><Button onClick={() => handleAction('Destructive')} seed="compare-destructive" variant="destructive">{t("删除记录")}</Button></div>
            <div className="comparison-item"><code>link</code><Button onClick={() => handleAction('Link')} seed="compare-link" variant="link">{t("查看详情")}</Button></div>
          </> : kind === 'size' ? <>
            <div className="comparison-item"><code>xs · 32px</code><Button onClick={() => handleAction('Extra small')} seed="compare-xs" size="xs">{t("保存更改")}</Button></div>
            <div className="comparison-item"><code>sm · 36px</code><Button onClick={() => handleAction('Small')} seed="compare-sm" size="sm">{t("保存更改")}</Button></div>
            <div className="comparison-item"><code>md · 44px</code><Button onClick={() => handleAction('Medium')} seed="compare-md" size="md">{t("保存更改")}</Button></div>
            <div className="comparison-item"><code>lg · 48px</code><Button onClick={() => handleAction('Large')} seed="compare-lg" size="lg">{t("保存更改")}</Button></div>
          </> : kind === 'icon-size' ? <>
            {([['icon-xs', '32px'], ['icon-sm', '36px'], ['icon', '44px'], ['icon-lg', '48px']] as const).map(([size, height]) => <div className="comparison-item" key={size}><code>{size} · {height}</code><Button aria-label={`新建 · ${height}`} className="demo-icon-button" data-tooltip={t("新建")} onClick={() => handleAction(`新建 ${height}`)} seed={`compare-${size}`} size={size}><DocsIcon data={plusIcon} seed={`plus-${size}`} size={28} /></Button></div>)}
          </> : kind === 'icons' ? <>
            <div className="comparison-item"><code>startIcon</code><Button onClick={() => handleAction('上一步')} seed="compare-start-icon" startIcon={<DocsIcon data={arrowLeftIcon} seed="start-arrow" size={24} />}>{t("上一步")}</Button></div>
            <div className="comparison-item"><code>endIcon</code><Button endIcon={<DocsIcon data={arrowRightIcon} seed="end-arrow" size={24} />} onClick={() => handleAction('下一步')} seed="compare-end-icon">{t("下一步")}</Button></div>
          </> : kind === 'state' ? <>
            <div className="comparison-item"><code>async loading</code><AsyncButtonExample /></div>
            <div className="comparison-item"><code>disabled</code><Button disabled seed="compare-disabled">{t("保存更改")}</Button></div>
          </> : kind === 'link' ? <>
            <div className="comparison-item comparison-item--wide"><code>ButtonLink · native anchor</code><ButtonLink endIcon={<DocsIcon data={arrowRightIcon} seed="link-arrow" size={24} />} href="/design-standard" seed="compare-link-anchor">{t("设计规范")}</ButtonLink></div>
            <div className="comparison-item"><code>disabled · no href</code><ButtonLink disabled href="/design-standard" seed="compare-link-disabled">{t("不可导航")}</ButtonLink></div>
          </> : kind === 'group' ? <>
            <ButtonGroupExample />
          </> : <>
            <div className="comparison-item comparison-item--wide" dir="rtl"><code>dir="rtl" · endIcon</code><Button endIcon={<DocsIcon data={arrowLeftIcon} seed="rtl-arrow" size={24} />} onClick={() => handleAction('RTL 继续')} seed="compare-rtl">{t("继续")}</Button></div>
          </>}
        </div>
      <span aria-live="polite" className="visually-hidden">{announcement}</span>
    </ComponentExample>
  );
}

function GettingStartedPage({ onNavigate }: { onNavigate: (path: RoutePath) => void }) {
  const { t } = useLocale();
  return (
    <article className="documentation">
      <PageHeading title="快速开始" description="先放一个按钮，别急着写整个应用。" />
      <section className="content-section getting-started-content">
        <PencilText as="h2" seed="install-heading">安装与样式</PencilText>
        <CodeSample seed="install-command" language="bash" code="npm install @inkra/react" />
        <CodeSample seed="install-code" code={`import '@inkra/react/tokens.css';\nimport '@inkra/react/styles.css';\nimport { Button } from '@inkra/react';`} />
        <PencilText as="p" seed="font-note">文档站使用与参考站相同的 Yozai Light 本地子集。该子集仅含 706 个参考站字符，其余文字按系统手写与楷体顺序回退。</PencilText>
        <Button onClick={() => onNavigate('/components/button')} seed="start-button">{t("查看 Button")}</Button>
      </section>
      <section className="content-section getting-started-links">
        <ButtonLink variant="link" href="/docs/internationalization">{t('国际化')}</ButtonLink>
        <ButtonLink variant="link" href="/docs/theming">{t('主题定制')}</ButtonLink>
      </section>
    </article>
  );
}

function ButtonPlayground() {
  const { t } = useLocale();
  const compactLayout = useCompactLayout();
  const [view, setView] = useState<PreviewTab>('preview');
  const [variant, setVariant] = useState<ButtonVariant>('primary');
  const [size, setSize] = useState<ButtonSize>('md');
  const [fullWidth, setFullWidth] = useState(false);
  const [align, setAlign] = useState<ButtonAlign>('center');
  const [loadingPosition, setLoadingPosition] = useState<ButtonLoadingPosition>('center');
  const [customIndicator, setCustomIndicator] = useState(false);
  const [icons, setIcons] = useState(false);
  const [dir, setDir] = useState<'ltr' | 'rtl'>('ltr');
  const [loading, setLoading] = useState(false);
  const [disabled, setDisabled] = useState(false);
  const [clicks, setClicks] = useState(0);
  const [announcement, setAnnouncement] = useState('');
  const iconOnly = size.startsWith('icon');
  const code = useMemo(() => {
    const props = [`variant="${variant}"`, `size="${size}"`, `dir="${dir}"`, fullWidth ? 'fullWidth' : '', `align="${align}"`, `loadingPosition="${loadingPosition}"`, customIndicator ? 'loadingIndicator={<LoadingIcon />}' : '', !iconOnly && icons ? 'startIcon={<PlusIcon />} endIcon={<ArrowRightIcon />}' : '', loading ? 'loading' : '', disabled ? 'disabled' : '', 'seed="docs-playground"'].filter(Boolean);
    const iconImports = [iconOnly || icons ? 'Plus as PlusIcon' : '', icons && !iconOnly ? 'ArrowRight as ArrowRightIcon' : '', customIndicator ? 'Sun as LoadingIcon' : ''].filter(Boolean);
    const imports = `${iconImports.length ? `import { ${iconImports.join(', ')} } from 'lucide-react';\n` : ''}import { Button } from '@inkra/react';\n\n`;
    return imports + (iconOnly
      ? `<Button aria-label="${t('新建')}" ${props.join(' ')}><PlusIcon /></Button>`
      : `<Button ${props.join(' ')}>${t('保存草稿')}</Button>`);
  }, [disabled, iconOnly, loading, size, variant, fullWidth, align, loadingPosition, customIndicator, icons, dir, t]);
  return (
    <PencilSurface className="playground component-playground button-playground" seed="button-playground" variant="paper" data-doc-code={code}>
      <div className="playground-toolbar">
        <div className="view-tabs" role="tablist" aria-label={t("示例视图")} onKeyDown={handleRovingTabs}>
          {([
            ['preview', '预览', monitorIcon],
            ['code', '代码', codeIcon],
          ] as const).map(([value, label, icon]) => (
            <button aria-controls={`button-demo-panel-${value}`} aria-selected={view === value} className="view-tab" id={`button-demo-tab-${value}`} key={value} onClick={() => setView(value)} role="tab" tabIndex={view === value ? 0 : -1} type="button">
              {view === value ? <PencilSurface aria-hidden="true" className="selection-backdrop" seed={`view-selection-${value}`} variant="selection" /> : null}
              <span className="selection-control-content"><DocsIcon active={view === value} data={icon} seed={`view-${value}`} size={26} /><PencilText seed={`view-${value}-label`}>{label}</PencilText></span>
            </button>
          ))}
        </div>
        {view === 'code' ? <CopyButton code={code} onResult={setAnnouncement} /> : null}
      </div>
      <PencilLine className="tool-divider" seed="playground-divider" />
      <div className="preview-panel">
          <div className="preview-workspace">
            <div className="preview-display">
            <div className="preview-stage" aria-hidden={view !== 'preview'} inert={view !== 'preview'} aria-labelledby="button-demo-tab-preview" id="button-demo-panel-preview" role="tabpanel">
              <Button
                aria-label={iconOnly ? t('新建') : undefined}
                className={iconOnly ? 'demo-icon-button' : undefined}
                data-tooltip={iconOnly ? t('新建') : undefined}
                disabled={disabled}
                fullWidth={fullWidth}
                align={align}
                dir={dir}
                loadingPosition={loadingPosition}
                loadingIndicator={customIndicator ? <DocsIcon data={sunIcon} size={20} /> : undefined}
                startIcon={!iconOnly && icons ? <DocsIcon data={plusIcon} size={20} /> : undefined}
                endIcon={!iconOnly && icons ? <DocsIcon data={arrowRightIcon} size={20} /> : undefined}
                loading={loading}
                onClick={() => setClicks((value) => value + 1)}
                seed="docs-playground"
                size={size}
                variant={variant}
              >
                {iconOnly ? <DocsIcon data={plusIcon} seed="playground-plus" size={28} /> : t('保存草稿')}
              </Button>
              <PencilText className="preview-feedback" seed={`preview-feedback-${clicks}`}>{clicks ? `已保存 ${clicks} 次` : '尚未保存'}</PencilText>
            </div>
            <div className="code-panel" hidden={view !== 'code'} aria-labelledby="button-demo-tab-code" id="button-demo-panel-code" role="tabpanel">{view === 'code' && <CodeBlock code={code} />}</div>
            </div>
            <PencilLine className="preview-controls-divider" orientation={compactLayout ? 'horizontal' : 'vertical'} seed="preview-controls-divider" />
            <div className="preview-controls" aria-label={t("Button 属性控制")}>
              <PropertyTabs groups={[{ label: '基础', content: <>
              <DocsSelect label="外观" value={variant} onValueChange={value => setVariant(value as ButtonVariant)} options={['primary', 'secondary', 'outline', 'ghost', 'destructive', 'link'].map(value => [value, value])} />
              <DocsSelect label="尺寸" value={size} onValueChange={value => setSize(value as ButtonSize)} options={['xs', 'sm', 'md', 'lg', 'icon-xs', 'icon-sm', 'icon', 'icon-lg'].map(value => [value, value])} />
              <Switch label={t('撑满宽度')} checked={fullWidth} onCheckedChange={setFullWidth} disabled={iconOnly} />
              <DocsSelect label="内容对齐" value={align} onValueChange={value => setAlign(value as ButtonAlign)} options={[["start", "起始"], ["center", "居中"], ["end", "末尾"]]} />
              <DocsSelect label="文字方向" value={dir} onValueChange={value => setDir(value as typeof dir)} options={[["ltr", "LTR"], ["rtl", "RTL"]]} />
              </> }, { label: '内容', content: <>
              <Switch label={t('首尾图标')} checked={icons} onCheckedChange={setIcons} disabled={iconOnly} />
              <DocsSelect label="加载位置" value={loadingPosition} onValueChange={value => setLoadingPosition(value as ButtonLoadingPosition)} options={[["start", "起始"], ["center", "居中"], ["end", "末尾"]]} />
              <Switch label={t('自定义加载图标')} checked={customIndicator} onCheckedChange={setCustomIndicator} />
              </> }, { label: '状态', content: <>
              <Switch label={t('加载中')} checked={loading} onCheckedChange={setLoading} />
              <Switch label={t('禁用')} checked={disabled} onCheckedChange={setDisabled} />
              </> }]} />
            </div>
          </div>
        </div>

      <span aria-live="polite" className="visually-hidden">{announcement}</span>
    </PencilSurface>
  );
}

function ButtonPage({ activeTab, onTabChange }: { activeTab: ButtonTab; onTabChange: (tab: ButtonTab) => void }) {
  const { locale, t } = useLocale();
  return (
    <article className="documentation">
      <PageHeading title="Button" />
      <ComponentPageTabs name="Button" id="button" value={activeTab} onChange={onTabChange} />
      <PencilLine className="section-divider" seed={`button-${activeTab}-divider`} />
      {activeTab === 'preview' ? (
        <section aria-labelledby="button-tab-preview" className="content-section" id="button-panel-preview" role="tabpanel">
          <ButtonPlayground />
          <div className="comparison-list">
            <ButtonGroupPlayground />
            <ComparisonGroup kind="appearance" />
            <ComparisonGroup kind="size" />
            <ComparisonGroup kind="icon-size" />
            <ComparisonGroup kind="icons" />
            <ComparisonGroup kind="state" />
            <ComparisonGroup kind="link" />
            <ComparisonGroup kind="group" />
            <ComparisonGroup kind="rtl" />
          </div>
        </section>
      ) : activeTab === 'api' ? (
        <section aria-labelledby="button-tab-api" className="content-section" id="button-panel-api" role="tabpanel">
          <ApiGroups component="button" groups={buttonApiGroups} />
        </section>
      ) : (
        <section aria-labelledby="button-tab-accessibility" className="content-section" id="button-panel-accessibility" role="tabpanel">
          <GuidanceMarkdown source={buttonAccessibilityGuidance[locale === 'en' ? 'en' : 'zh']} />
        </section>
      )}
    </article>
  );
}

function DesignStandardPage({ theme }: { theme: Theme }) {
  const { t } = useLocale();
  const [section, setSection] = useState('colors');
  const sections = [{ id: 'colors', label: '色彩' }, { id: 'geometry', label: '尺寸与间距' }, { id: 'materials', label: '排版与材质' }];
  return (
    <article className="documentation documentation--standard">
      <PageHeading title="设计规范" />
      <Tabs.Root value={section} onValueChange={setSection}>
      <Tabs.List className="standard-tabs" aria-label={t('设计规范分类')}>
        {sections.map(item => <Tabs.Trigger key={item.id} value={item.id}>{t(item.label)}</Tabs.Trigger>)}
      </Tabs.List>
      <PencilLine className="section-divider standard-tabs-divider" seed="standard-tabs-divider" />
      <Tabs.Content value="colors" className="content-section design-standard"><ColorSystem theme={theme} /></Tabs.Content>
      <Tabs.Content value="geometry" className="content-section design-standard"><GeometrySystem /></Tabs.Content>
      <Tabs.Content value="materials" className="content-section design-standard">
        <TypographySystem />
        <PencilText as="h2" seed="material-title">铅笔材质</PencilText>
        <div className="material-specimens"><PencilSurface className="material-sample" seed="paper-material" variant="paper"><PencilText seed="paper-label">纸面与压力描边</PencilText></PencilSurface><PencilSurface className="material-sample" seed="selection-material" variant="selection"><PencilText seed="selection-label">选中项连续彩铅铺色</PencilText></PencilSurface></div>
        <PencilText as="p" className="standard-note" seed="standard-note">本地字体是 Yozai Light 的 706 字符子集；未覆盖字形由 HanziPen SC、Hannotate SC、Kaiti SC、STKaiti 等平台字体回退。</PencilText>
      </Tabs.Content>
      </Tabs.Root>
    </article>
  );
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
  const isDocs = route !== '/' && route !== '/blog' && route !== '/ecosystem';
  const Shell = isDocs ? Layout.Root : 'div';
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
      <Shell className={isDocs ? 'docs-shell' : undefined} {...(isDocs ? { collapseAt: 'never' as const, sidebarWidth } : {})}>
      <AppHeader currentPath={route} menuButtonRef={menuButtonRef} onNavigate={navigate} onOpenMenu={() => setDrawerOpen(true)} theme={theme} onThemeChange={setTheme} />
      {isDocs ? <Layout.Body className="docs-layout">
        <Resizable.Root className="docs-resizable" style={{ overflow: 'visible' }}>
        <Resizable.Panel id="docs-navigation" className="docs-sidebar-panel" defaultSize={240} minSize={200} maxSize={360} groupResizeBehavior="preserve-pixel-size" style={{ overflow: 'visible' }} onResize={size => {
          if (window.matchMedia('(min-width: 769px)').matches) setSidebarWidth(size.inPixels);
        }}>
        <Layout.Sidebar className="desktop-sidebar" width="100%" padding={0} divided><SideNavigation currentPath={route} onNavigate={navigate} /><SidebarPreferences theme={theme} onThemeChange={setTheme} /></Layout.Sidebar>
        </Resizable.Panel>
        <Resizable.Handle className="docs-sidebar-resize" />
        <Resizable.Panel id="docs-content" className="docs-content-panel" minSize="40%" style={{ overflow: 'visible' }}>
        <Layout.Content as="main" id="main-content" padding={0}>
          {route === '/components/button' ? <ButtonPage activeTab={buttonTab} onTabChange={changeButtonTab} /> : route.startsWith('/components/') ? <FoundationPage key={route} component={route.slice('/components/'.length) as FoundationComponent} activeTab={buttonTab} onTabChange={changeButtonTab} /> : route === '/internationalization' ? <article className="documentation"><PageHeading title="国际化" description="换种语言打招呼，别让用户自己翻译。" /><InternationalizationExamples /></article> : route === '/theming' ? <article className="documentation"><PageHeading title="主题定制" description="颜色、笔触都能改，不用和我长得一样。" /><ThemeExamples /></article> : route === '/design-standard' ? <DesignStandardPage theme={theme} /> : route === '/usage-guide' ? <article className="documentation"><PageHeading title="使用指南" /><section className="content-section"><UsageGuide theme={theme} /></section></article> : <GettingStartedPage onNavigate={navigate} />}
        </Layout.Content>
        </Resizable.Panel>
        </Resizable.Root>
      </Layout.Body> : route === '/' ? <HomePage themeControl={<ThemeControl theme={theme} onChange={setTheme} />} /> : <main id="main-content" className="site-section" aria-label={t(route === '/blog' ? '博客' : '生态')}>
        <h1 className="visually-hidden">{t(route === '/blog' ? '博客' : '生态')}</h1>
      </main>}
      </Shell>
      {isDocs && <MobileDrawer currentPath={route} onClose={closeDrawer} onNavigate={navigate} onThemeChange={setTheme} open={drawerOpen} theme={theme} />}
    </div>
  );
}
