import { useEffect, useId, useRef, useState } from 'react';
import { Badge, Breadcrumb, Button, Card, ChoiceGrid, ChoiceGridOption, Container, Flex, Layout, PencilLine, Progress, Resizable, Stack, Switch, Tabs } from '@inkra/react';
import { __iconData as arrowRightIcon } from 'lucide-react/dist/esm/icons/arrow-right.mjs';
import { __iconData as notebookIcon } from 'lucide-react/dist/esm/icons/notebook-pen.mjs';
import { __iconData as starIcon } from 'lucide-react/dist/esm/icons/star.mjs';
import { __iconData as historyIcon } from 'lucide-react/dist/esm/icons/rotate-ccw-clock.mjs';
import { __iconData as plusIcon } from 'lucide-react/dist/esm/icons/plus.mjs';
import { __iconData as sidebarIcon } from 'lucide-react/dist/esm/icons/panel-left.mjs';
import { __iconData as rightSidebarIcon } from 'lucide-react/dist/esm/icons/panel-right.mjs';
import type { ContainerProps, FlexProps, LayoutSpace } from '@inkra/react';
import type { CSSProperties } from 'react';
import { PencilText, useLocale } from '../../i18n';
import { ComponentExample } from '../ComponentExample';
import { ComponentPlayground } from '../ComponentPlayground';
import { DocsSelect } from '../DocsSelect';
import { PropertyTabs } from '../PropertyTabs';
import { DocsIcon } from '../DocsIcon';
import { LayoutViewport } from './LayoutViewport';
import { LayoutPartsExamples } from './LayoutPartsExamples';
import { layoutApiGroups } from './layoutApi';
import { gridApiGroups } from './gridApi';
import { GridExamples } from './GridExamples';
import { LayoutSidebarPanel } from './LayoutPanels';
import { useLayoutMotion } from './useLayoutMotion';
import type { ExpansionDoc } from './types';
import './LayoutExamples.css';

const spacingOptions = [[0, '0 px'], [2, '8 px'], [3, '12 px'], [4, '16 px'], [5, '20 px'], [6, '24 px'], [8, '32 px']] as const;
const notebookLayouts = [
  ['top', '顶部通栏', 'Full-width header'],
  ['header-tabs', '品牌与导航分栏', 'Brand and navigation'],
  ['side', '侧栏通高', 'Full-height sidebar'],
  ['split', '分区页头', 'Split headers'],
  ['right', '右侧导航', 'Right navigation'],
  ['right-side', '右侧通高', 'Full-height right sidebar'],
  ['right-split', '右侧分区页头', 'Split right headers'],
  ['dual', '双侧栏', 'Two sidebars'],
  ['content', '上下通栏', 'Header and footer'],
] as const;
type NotebookLayout = typeof notebookLayouts[number][0];
type HeaderPath = 'simple' | 'section' | 'long';
const mobileNavigations = [
  ['drawer', '覆盖抽屉'], ['page', '全页面导航'], ['push', '推开页面'], ['push-full', '整页推开'],
] as const;
type MobileNavigation = typeof mobileNavigations[number][0];

function MobileNavigationDiagram({ mode, right }: { mode: MobileNavigation; right: boolean }) {
  return <span className="mobile-navigation-diagram" data-mode={mode} data-side={right ? 'end' : 'start'} aria-hidden="true">
    <span className="mobile-navigation-diagram__sidebar">
      <PencilLine className="mobile-navigation-diagram__sidebar-edge" orientation="vertical" />
      {[0, 1, 2].map(row => <span key={row} className="mobile-navigation-diagram__item" style={{ top: 13 + row * 18 }}>
        <DocsIcon data={row === 0 ? notebookIcon : row === 1 ? starIcon : historyIcon} size={12} />
        <PencilLine />
      </span>)}
    </span>
    <span className="mobile-navigation-diagram__page">
      <PencilLine className="mobile-navigation-diagram__page-edge" orientation="vertical" />
      <PencilLine className="mobile-navigation-diagram__page-header" />
      <span className="mobile-navigation-diagram__page-title"><DocsIcon data={notebookIcon} size={12} /><PencilLine /></span>
      {[0, 1].map(column => <span key={column} className="mobile-navigation-diagram__note" style={{ left: 10 + column * 44 + '%' }}>
        <PencilLine /><PencilLine orientation="vertical" /><PencilLine /><PencilLine orientation="vertical" />
        <PencilLine /><PencilLine />
      </span>)}
    </span>
    <span className="mobile-navigation-diagram__arrow"><DocsIcon data={arrowRightIcon} size={18} /></span>
  </span>;
}

function LayoutDiagram({ layout }: { layout: NotebookLayout }) {
  return <span className="layout-diagram" data-layout={layout} aria-hidden="true">
    {['header', 'navigation', 'details', 'footer'].map(region =>
      <PencilLine key={region} seed={`layout-${layout}-${region}`}
        orientation={region === 'navigation' || region === 'details' ? 'vertical' : 'horizontal'}
        className={`layout-diagram__${region}`} />)}
  </span>;
}
function GapControl({ value, onChange }: { value: LayoutSpace; onChange: (value: LayoutSpace) => void }) {
  const { locale } = useLocale();
  return <DocsSelect label={locale === 'zh-CN' ? '间距' : 'Gap'} value={String(value)}
    onValueChange={next => onChange(Number(next) as LayoutSpace)}
    options={spacingOptions.map(([value, label]) => [String(value), label] as const)} />;
}

function FlexExamples({ stack = false }: { stack?: boolean }) {
  const { locale } = useLocale();
  const zh = locale === 'zh-CN';
  const [direction, setDirection] = useState<NonNullable<FlexProps['direction']>>(stack ? 'column' : 'row');
  const [gap, setGap] = useState<LayoutSpace>(3);
  const [align, setAlign] = useState<NonNullable<FlexProps['align']>>('start');
  const [justify, setJustify] = useState<NonNullable<FlexProps['justify']>>('start');
  const [wrap, setWrap] = useState(true);
  const [saved, setSaved] = useState(false);
  const Component = stack ? Stack : Flex;
  const name = stack ? 'Stack' : 'Flex';
  const labels = zh ? ['草稿', '待审核', '已发布'] : ['Draft', 'In review', 'Published'];
  const code = `<${name} direction="${direction}" gap={${gap}} align="${align}" justify="${justify}" wrap={${wrap}}>
  <Badge>${labels[0]}</Badge>
  <Badge variant="warning">${labels[1]}</Badge>
  <Badge variant="success">${labels[2]}</Badge>
</${name}>`;
  return <div className="layout-examples">
    <ComponentPlayground code={code} controls={<PropertyTabs groups={[
      { label: '布局', content: <>
        <DocsSelect label={zh ? '排列方向' : 'Direction'} value={direction} onValueChange={next => setDirection(next as typeof direction)}
          options={['row', 'column', 'row-reverse', 'column-reverse'].map(value => [value, value] as const)} />
        <GapControl value={gap} onChange={setGap} />
        <DocsSelect label={zh ? '交叉轴对齐' : 'Cross-axis alignment'} value={align} onValueChange={next => setAlign(next as typeof align)}
          options={['start', 'center', 'end', 'stretch', 'baseline'].map(value => [value, value] as const)} />
        <DocsSelect label={zh ? '主轴分布' : 'Main-axis distribution'} value={justify} onValueChange={next => setJustify(next as typeof justify)}
          options={['start', 'center', 'end', 'between', 'around', 'evenly'].map(value => [value, value] as const)} />
        <Switch label={zh ? '允许换行' : 'Allow wrapping'} checked={wrap} onCheckedChange={setWrap} />
      </> },
    ]} />}>
      <Component className="layout-examples__flex" direction={direction} gap={gap} align={align} justify={justify} wrap={wrap}>
        <Badge>{labels[0]}</Badge><Badge variant="warning">{labels[1]}</Badge><Badge variant="success">{labels[2]}</Badge>
      </Component>
    </ComponentPlayground>
    <ComponentExample id="content-and-actions" title={zh ? '内容与操作' : 'Content and actions'} code={`const [saved, setSaved] = useState(false);

<Stack gap={5}>
  <PencilText as="h3">${zh ? '下一版' : 'Next version'}</PencilText>
  <Progress value={64} label="${zh ? '完成进度' : 'Progress'}" />
  <Flex gap={2} justify="end" wrap>
    <Button variant="outline" onClick={() => setSaved(false)}>${zh ? '撤销' : 'Undo'}</Button>
    <Button onClick={() => setSaved(true)}>${zh ? '保存' : 'Save'}</Button>
  </Flex>
  <PencilText as="p" role="status">{saved ? '${zh ? '已保存' : 'Saved'}' : '${zh ? '尚未保存' : 'Not saved'}'}</PencilText>
</Stack>`}>
      <Stack className="layout-examples__composition" gap={5}>
        <PencilText as="h3">{zh ? '下一版' : 'Next version'}</PencilText>
        <Progress value={64} label={zh ? '完成进度' : 'Progress'} />
        <Flex gap={2} justify="end" wrap>
          <Button variant="outline" onClick={() => setSaved(false)}>{zh ? '撤销' : 'Undo'}</Button>
          <Button onClick={() => setSaved(true)}>{zh ? '保存' : 'Save'}</Button>
        </Flex>
        <PencilText as="p" role="status">{saved ? (zh ? '已保存' : 'Saved') : (zh ? '尚未保存' : 'Not saved')}</PencilText>
      </Stack>
    </ComponentExample>
  </div>;
}
const StackExamples = () => <FlexExamples stack />;
const RowExamples = () => <FlexExamples />;

function ContainerExamples() {
  const { locale } = useLocale();
  const zh = locale === 'zh-CN';
  const [size, setSize] = useState<NonNullable<ContainerProps['size']>>('sm');
  const [padding, setPadding] = useState<LayoutSpace>(5);
  const [centered, setCentered] = useState(true);
  const code = `<Container size="${size}" padding={${padding}} centered={${centered}}>
  <Stack gap={3}>
    <PencilText as="h3" style={{ margin: 0 }}>${zh ? '工作笔记' : 'Work notes'}</PencilText>
    <PencilText as="p" style={{ margin: 0 }}>${zh ? '今天先把最重要的一件事做好。' : 'Start with the one thing that matters today.'}</PencilText>
  </Stack>
</Container>`;
  return <div className="layout-examples">
    <ComponentPlayground code={code} controls={<PropertyTabs groups={[{ label: '布局', content: <>
      <DocsSelect label={zh ? '最大宽度' : 'Maximum width'} value={size} onValueChange={next => setSize(next as typeof size)}
        options={['sm', 'md', 'lg', 'xl', 'full'].map(value => [value, value] as const)} />
      <GapControl value={padding} onChange={setPadding} />
      <Switch label={zh ? '水平居中' : 'Center horizontally'} checked={centered} onCheckedChange={setCentered} />
    </> }]} />}>
      <div className="layout-examples__container-stage">
        <Container className="layout-examples__container" size={size} padding={padding} centered={centered}>
          <Stack gap={3}>
            <PencilText as="h3" style={{ margin: 0 }}>{zh ? '工作笔记' : 'Work notes'}</PencilText>
            <PencilText as="p" style={{ margin: 0 }}>{zh ? '今天先把最重要的一件事做好。' : 'Start with the one thing that matters today.'}</PencilText>
          </Stack>
        </Container>
      </div>
    </ComponentPlayground>
    <ComponentExample id="reading-width" title={zh ? '阅读宽度' : 'Reading width'} code={`<Container as="article" size="sm" padding={5}>\n  <PencilText as="p">${zh ? '一行不必从屏幕这头跑到那头。把阅读宽度收回来，让视线少赶一点路。' : 'A line does not need to travel from one edge of the screen to the other. Keep reading comfortable with a bounded column.'}</PencilText>\n</Container>`}>
      <Container as="article" size="sm" padding={5} className="layout-examples__container">
        <PencilText as="p">{zh ? '一行不必从屏幕这头跑到那头。把阅读宽度收回来，让视线少赶一点路。' : 'A line does not need to travel from one edge of the screen to the other. Keep reading comfortable with a bounded column.'}</PencilText>
      </Container>
    </ComponentExample>
  </div>;
}

function LayoutExamples() {
  const { locale, t } = useLocale();
  const zh = locale === 'zh-CN';
  const [layout, setLayout] = useState<NotebookLayout>('top');
  const sharedHeader = layout === 'header-tabs';
  const [workspaceTab, setWorkspaceTab] = useState('all');
  const [measuredSidebarWidth, setMeasuredSidebarWidth] = useState(200);
  const [headerPath, setHeaderPath] = useState<HeaderPath>('simple');
  const rightSidebar = layout === 'right' || layout === 'right-side' || layout === 'right-split';
  const fullHeightSidebar = layout === 'side' || layout === 'right-side';
  const splitHeader = layout === 'split' || layout === 'right-split';
  const sectionalHeader = fullHeightSidebar || splitHeader;
  const [sidebar, setSidebar] = useState(true);
  const [desktopOpen, setDesktopOpen] = useState(true);
  const [compactOpen, setCompactOpen] = useState(false);
  const [previewWidth, setPreviewWidth] = useState(() => window.innerWidth <= 480 ? '390' : '1024');
  const [mobileNavigation, setMobileNavigation] = useState<MobileNavigation>('drawer');
  const [backdrops, setBackdrops] = useState<Record<MobileNavigation, boolean>>({ drawer: true, page: false, push: false, 'push-full': false });
  const mobileBackdrop = backdrops[mobileNavigation];
  const [swipeNavigation, setSwipeNavigation] = useState(true);
  const [resizable, setResizable] = useState(true);
  const [collapsible, setCollapsible] = useState(true);
  const [detailsOpen, setDetailsOpen] = useState(true);
  const sidebarId = useId();
  const detailsId = useId();
  const sidebarToggle = useRef<HTMLButtonElement>(null);
  const motion = useLayoutMotion();
  const detailsToggle = useRef<HTMLButtonElement>(null);
  const focusAfterCollapse = useRef(false);
  useEffect(() => {
    if (focusAfterCollapse.current) {
      sidebarToggle.current?.focus({ preventScroll: true });
      focusAfterCollapse.current = false;
    }
  }, [desktopOpen, compactOpen]);
  const [divided, setDivided] = useState(true);
  const [width, setWidth] = useState('200');
  const [collapseAt, setCollapseAt] = useState<'sm' | 'md' | 'never'>('sm');
  const previewNavigation = (next: MobileNavigation) => {
    if (Number(previewWidth) < (collapseAt === 'md' ? 768 : 640)) motion.prepare();
    setPreviewWidth('390');
    setMobileNavigation(next);
    setCompactOpen(true);
  };
  const [active, setActive] = useState(0);
  const [notes, setNotes] = useState([
    { id: 1, title: ['周会记录', 'Weekly notes'], description: ['把本周的进展和下周要做的事放在一起。', 'This week’s progress and the next steps, in one place.'], favorite: true, published: true },
    { id: 2, title: ['首页草图', 'Homepage sketches'], description: ['先把内容排好，再决定哪一笔要重一点。', 'Content first. The finishing touches can follow.'], favorite: false, published: false },
    { id: 3, title: ['下次再试的想法', 'Ideas for next time'], description: ['今天没用上的点子，先留个位置。', 'A place for the ideas that did not fit today.'], favorite: false, published: false },
  ]);
  const labels = zh ? ['全部笔记', '收藏', '最近编辑'] : ['All notes', 'Favorites', 'Recent'];
  const workspaceTabs = zh ? ['工作区', '已发布', '草稿'] : ['Workspace', 'Published', 'Drafts'];
  const workspaceValues = ['all', 'published', 'drafts'];
  const icons = [notebookIcon, starIcon, historyIcon];
  const workspaceNotes = !sharedHeader || workspaceTab === 'all' ? notes : notes.filter(note => workspaceTab === 'published' ? note.published : !note.published);
  const visibleNotes = active === 1 ? workspaceNotes.filter(note => note.favorite) : active === 2 ? [...workspaceNotes].reverse() : workspaceNotes;
  const published = notes.filter(note => note.published).length;
  const toggleFavorite = (id: number) => setNotes(items => items.map(note => note.id === id ? { ...note, favorite: !note.favorite } : note));
  const addNote = () => {
    setNotes(items => [...items, {
      id: Math.max(...items.map(note => note.id), 0) + 1,
      title: ['新笔记 ' + (items.length + 1), 'New note ' + (items.length + 1)],
      description: ['还没想好标题，先记下来。', 'The title can wait. Start with the thought.'],
      favorite: false, published: false,
    }]);
    setActive(0);
  };
  const code = `import { useEffect, useId, useRef, useState } from 'react';
import { Badge, Breadcrumb, Button, Card, Flex, Layout, PencilText, Progress, Resizable, Stack, Tabs, useResizablePanelRef } from '@inkra/react';
import { NotebookPen, PanelLeft, PanelRight } from 'lucide-react';

export function Notebook() {
const [active, setActive] = useState(0);
const [desktopOpen, setDesktopOpen] = useState(true);
${sharedHeader ? `const [sharedWidth, setSharedWidth] = useState(${width});
const [workspaceTab, setWorkspaceTab] = useState('${workspaceTab}');
const workspaceTabs = ${JSON.stringify(workspaceTabs)};
const workspaceValues = ['all', 'published', 'drafts'];` : ''}
const [mobileOpen, setMobileOpen] = useState(false);
const [compact, setCompact] = useState(false);
const sidebarOpen = compact ? mobileOpen : desktopOpen;
const rootRef = useRef<HTMLElement>(null);
const sidebarElement = useRef<HTMLElement>(null);
const toggleRef = useRef<HTMLButtonElement>(null);
const wasMobileOpen = useRef(false);
const [detailsOpen, setDetailsOpen] = useState(true);
const navigationRef = useResizablePanelRef();
const detailsRef = useResizablePanelRef();
const sidebarId = useId();
useEffect(() => {
  const element = rootRef.current;
  if (!element) return;
  const update = () => setCompact(${collapseAt === 'never' ? 'false' : `element.getBoundingClientRect().width < ${collapseAt === 'sm' ? 640 : 768}`});
  const observer = new ResizeObserver(update);
  observer.observe(element);
  update();
  return () => observer.disconnect();
}, []);
useEffect(() => {
  if (compact && mobileOpen) sidebarElement.current?.querySelector<HTMLButtonElement>('button:not(:disabled)')?.focus();
  else if (wasMobileOpen.current) toggleRef.current?.focus({ preventScroll: true });
  wasMobileOpen.current = compact && mobileOpen;
}, [compact, mobileOpen]);
const closeNavigation = () => {
  if (compact) setMobileOpen(false);
  else navigationRef.current?.collapse();
};
const [headerPath, setHeaderPath] = useState('${headerPath}');
const labels = ${JSON.stringify(labels)};
const [notes, setNotes] = useState(${JSON.stringify(notes.map(note => ({ ...note, title: note.title[zh ? 0 : 1], description: note.description[zh ? 0 : 1] })), null, 2)});
const workspaceNotes = ${sharedHeader ? "workspaceTab === 'all' ? notes : notes.filter(note => workspaceTab === 'published' ? note.published : !note.published)" : 'notes'};
const visible = active === 1 ? workspaceNotes.filter(note => note.favorite)
  : active === 2 ? [...workspaceNotes].reverse() : workspaceNotes;
const toggleFavorite = (id: number) => setNotes(items => items.map(note =>
  note.id === id ? { ...note, favorite: !note.favorite } : note));
const addNote = () => {
  setNotes(items => [...items, {
    id: Math.max(...items.map(note => note.id), 0) + 1,
    title: '${zh ? '新笔记' : 'New note'}',
    description: '', favorite: false, published: false,
  }]);
  setActive(0);
};

const sidebarHasHeader = ${sectionalHeader} || (compact && ${mobileNavigation !== 'drawer'});
const bottomToggle = sidebarOpen && !sidebarHasHeader;
const sidebarToggle = ${sidebar && layout !== 'content' ? `((${collapsible} || compact) &&
  <Button ref={toggleRef} variant="ghost" size={bottomToggle ? 'md' : 'icon'}
    fullWidth={bottomToggle} align="start" aria-label="${zh ? '切换侧栏' : 'Toggle sidebar'}"
    startIcon={bottomToggle ? <${rightSidebar ? 'PanelRight' : 'PanelLeft'} size={26} aria-hidden="true" /> : undefined}
    aria-expanded={sidebarOpen} aria-controls={sidebarId}
    onClick={() => compact ? setMobileOpen(value => !value) : sidebarOpen ? navigationRef.current?.collapse() : navigationRef.current?.expand()}>
    {bottomToggle ? '${zh ? '收起侧栏' : 'Close sidebar'}' : <${rightSidebar ? 'PanelRight' : 'PanelLeft'} size={26} aria-hidden="true" />}
  </Button>
);` : 'null;'}
const headerTitle = (
  <div className="layout-notebook__header-title">
    <NotebookPen size={26} aria-hidden="true" />
    <div className="layout-notebook__header-location">
      <Breadcrumb.Root aria-label="${zh ? '当前笔记位置' : 'Current notebook location'}">
        <Breadcrumb.List>
          {headerPath === 'simple' ? <Breadcrumb.Item><Breadcrumb.Page>${zh ? '笔记空间' : 'Notebook'}</Breadcrumb.Page></Breadcrumb.Item> : <>
            <Breadcrumb.Item><Breadcrumb.Link href="#notebook" onClick={event => { event.preventDefault(); setHeaderPath('simple'); }}>${zh ? '笔记空间' : 'Notebook'}</Breadcrumb.Link></Breadcrumb.Item>
            <Breadcrumb.Separator />
            {headerPath === 'section' ? <Breadcrumb.Item><Breadcrumb.Page>${zh ? '产品研究与项目归档' : 'Product research and project archive'}</Breadcrumb.Page></Breadcrumb.Item> : <>
              <Breadcrumb.Item><Breadcrumb.Link href="#research" onClick={event => { event.preventDefault(); setHeaderPath('section'); }}>${zh ? '产品研究与项目归档' : 'Product research and project archive'}</Breadcrumb.Link></Breadcrumb.Item>
              <Breadcrumb.Separator />
              <Breadcrumb.Item><Breadcrumb.Page>${zh ? '2026 年跨区域用户研究与产品决策记录' : '2026 cross-regional user research and product decision records'}</Breadcrumb.Page></Breadcrumb.Item>
            </>}
          </>}
        </Breadcrumb.List>
      </Breadcrumb.Root>
    </div>
  </div>
);
const header = (
  <Layout.Header className="layout-notebook__header notebook-mobile-page" padding={compact ? 3 : 5} divided={${divided}}
    ${sharedHeader ? `sidebar={!compact && ${sidebar} ? headerTitle : undefined} sidebarDivided={${divided}}` : ''}
    inert={compact && mobileOpen} aria-hidden={compact && mobileOpen || undefined}>
    <div className="layout-notebook__header-grid">
      <div className="layout-notebook__header-leading">
        ${!rightSidebar ? '{!sidebarOpen && sidebarToggle}' : ''}
        ${sharedHeader ? `<Tabs.List style={{ flex: 1, minWidth: 0 }} aria-label="${zh ? '工作区导航' : 'Workspace navigation'}">
          {workspaceTabs.map((label, index) => <Tabs.Trigger key={index} value={workspaceValues[index]}>{label}</Tabs.Trigger>)}
        </Tabs.List>` : '{headerTitle}'}
      </div>
      <div className="layout-notebook__header-actions">
        <Button variant="ghost" onClick={addNote}>${zh ? '新建笔记' : 'New note'}</Button>
        ${rightSidebar ? '{!sidebarOpen && sidebarToggle}' : ''}
        ${layout === 'dual' && collapsible ? `{!compact && <Button variant="ghost" size="icon" aria-label="${zh ? '切换详情' : 'Toggle details'}"
        onClick={() => detailsRef.current?.isCollapsed() ? detailsRef.current.expand() : detailsRef.current?.collapse()}>
        <PanelRight aria-hidden="true" />
      </Button>}` : ''}
      </div>
    </div>
  </Layout.Header>
);
const navigation = ${sidebar && layout !== 'content' ? `(
    <Layout.Sidebar ref={sidebarElement} id={sidebarId} className="notebook-navigation" hidden={!compact && !sidebarOpen}
      inert={compact && !mobileOpen} aria-hidden={compact && !mobileOpen || undefined}
      width="100%" padding={3} style={{ height: '100%', overflowY: 'auto', overflowX: 'hidden', display: compact || sidebarOpen ? 'flex' : 'none', flexDirection: 'column' }}>
      {sidebarHasHeader && <Layout.Header className="layout-notebook__sidebar-heading" divided={${divided}} padding={0}>
        <Flex align="center" justify="between">
          <Flex align="center" gap={2}><NotebookPen aria-hidden="true" /><PencilText>${zh ? '我的笔记' : 'My notes'}</PencilText></Flex>
          {sidebarOpen && sidebarToggle}
        </Flex>
      </Layout.Header>}
      <Stack as="nav" gap={1} aria-label="${zh ? '笔记目录' : 'Notes navigation'}">
        {labels.map((label, index) => (
          <Button key={label} variant={active === index ? 'secondary' : 'ghost'}
            align="start" fullWidth aria-current={active === index ? 'page' : undefined}
            onClick={() => { setActive(index); if (compact) setMobileOpen(false); }}>{label}</Button>
        ))}
      </Stack>
      <div style={{ marginTop: 'auto', paddingTop: 24 }}>
        ${sectionalHeader ? `<Progress value={notes.filter(note => note.published).length} max={notes.length} label="${zh ? '发布进度' : 'Publishing'}" />` : '{sidebarOpen && !sidebarHasHeader && sidebarToggle}'}
      </div>
    </Layout.Sidebar>
);` : 'null;'}
const content = (
    <Layout.Content className="notebook-content" padding={compact ? 3 : 5} inert={compact && mobileOpen} aria-hidden={compact && mobileOpen || undefined} style={{ minHeight: 0, overflow: 'auto' }}>
      ${sharedHeader ? '<Tabs.Content value={workspaceTab}>' : ''}
      <Stack gap={5}>
        <Flex wrap gap={4}>
          {visible.map(note => (
            <Card.Root key={note.id} style={{ flex: '1 1 240px', minWidth: 0 }}>
              <Card.Content padding={compact ? 'sm' : 'md'}>
                <Stack gap={3}>
                  <Badge variant={note.published ? 'success' : 'neutral'}>
                    {note.published ? '${zh ? '已发布' : 'Published'}' : '${zh ? '草稿' : 'Draft'}'}
                  </Badge>
                  <PencilText as="h4">{note.title}</PencilText>
                  <PencilText as="p">{note.description}</PencilText>
                  <Button variant="ghost" aria-pressed={note.favorite}
                    onClick={() => toggleFavorite(note.id)}>${zh ? '收藏' : 'Favorite'}</Button>
                </Stack>
              </Card.Content>
            </Card.Root>
          ))}
        </Flex>
      </Stack>
      ${sharedHeader ? '</Tabs.Content>' : ''}
    </Layout.Content>
);
const footer = (
  <Layout.Footer className="notebook-mobile-page" padding={compact ? 3 : 5} divided={${divided}} inert={compact && mobileOpen} aria-hidden={compact && mobileOpen || undefined}>
    <PencilText>{notes.length + ' ${zh ? '条笔记' : 'notes'}'}</PencilText>
  </Layout.Footer>
);
const navigationPanel = navigation && (
  <Resizable.Panel panelRef={navigationRef} defaultSize={${width}} minSize={120} maxSize="40%" collapsible={${collapsible}}
    onResize={size => { setDesktopOpen(size.asPercentage > 0); ${sharedHeader ? 'setSharedWidth(size.inPixels);' : ''} }}>
    {navigation}
  </Resizable.Panel>
);
const handle = <Resizable.Handle className="notebook-resize" hidden={!sidebarOpen} style={{ display: sidebarOpen ? undefined : 'none' }} disabled={${!resizable}} label="${zh ? '调整侧栏宽度' : 'Resize sidebar'}" />;
${layout === 'dual' ? `const details = <Layout.Sidebar width="100%" style={{ height: '100%', overflow: 'auto' }}><PencilText>${zh ? '工作区' : 'Workspace'}</PencilText></Layout.Sidebar>;\n` : ''}
const workspace = <Layout.Content className="notebook-workspace" padding={0}
  style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
  ${sectionalHeader ? '{header}' : ''}
  {content}
  ${fullHeightSidebar ? '{footer}' : ''}
</Layout.Content>;
const desktopBody = <Layout.Body style={{ minHeight: 0 }}>
    <Resizable.Root>
      ${!rightSidebar && layout !== 'content' ? '{navigationPanel}{navigation && handle}' : ''}
      <Resizable.Panel minSize="30%" style={{ display: 'flex', flexDirection: 'column' }}>{workspace}</Resizable.Panel>
      ${rightSidebar ? '{navigation && handle}{navigationPanel}' : layout === 'dual' ? `<Resizable.Handle hidden={!detailsOpen} style={{ display: detailsOpen ? undefined : 'none' }} disabled={${!resizable}} label="${zh ? '调整详情宽度' : 'Resize details'}" />
      <Resizable.Panel panelRef={detailsRef} onResize={size => setDetailsOpen(size.asPercentage > 0)} defaultSize={160} minSize={120} maxSize="40%" collapsible={${collapsible}}>{details}</Resizable.Panel>` : ''}
    </Resizable.Root>
  </Layout.Body>;

// ${zh ? '呈现方式由状态与 CSS 组合；触摸手势使用 Layout.Root 的 swipeNavigation。' : 'State and CSS define the presentation; Layout.Root swipeNavigation handles touch gestures.'}
return ${sharedHeader ? '<Tabs.Root value={workspaceTab} onValueChange={setWorkspaceTab}>' : ''}<Layout.Root ref={rootRef} className="notebook-demo" collapseAt="never"
  ${sharedHeader ? `sidebarWidth={${sidebar} && desktopOpen ? sharedWidth : 0}` : ''}
  swipeNavigation={{ enabled: compact && Boolean(navigation) && ${swipeNavigation}, open: sidebarOpen,
    side: '${rightSidebar ? 'end' : 'start'}', onOpenChange: setMobileOpen }}
  data-compact={compact} data-navigation-open={sidebarOpen}
  data-mobile-navigation="${mobileNavigation}" data-navigation-side="${rightSidebar ? 'end' : 'start'}"
  style={{ height: 640, overflow: 'hidden' }}
  onKeyDown={event => { if (event.key === 'Escape' && sidebarOpen && (compact || ${collapsible})) { event.preventDefault(); closeNavigation(); } }}>
  <style>{\`
    .notebook-demo { position: relative; --layout-toolbar-inset: calc((var(--inkra-control-md) - 26px) / 2); --notebook-mobile-width: min(${width}px, calc(100% - 44px)); --notebook-direction: ${rightSidebar ? '-1' : '1'}; }
    .notebook-demo:dir(rtl) { --notebook-direction: ${rightSidebar ? '1' : '-1'}; }
    .notebook-demo .layout-notebook__header-grid, .notebook-demo .layout-notebook__header-leading,
    .notebook-demo .layout-notebook__header-title, .notebook-demo .layout-notebook__header-actions { display: flex; align-items: center; gap: 8px; min-width: 0; }
    .notebook-demo .layout-notebook__header-leading { flex: 1; }
    .notebook-demo .layout-notebook__header-title { flex: 1; }
    .notebook-demo .layout-notebook__header-title > svg { flex-shrink: 0; }
    .notebook-demo .layout-notebook__header-location { min-width: 0; overflow: auto; }
    .notebook-demo .inkra-breadcrumb__list { flex-wrap: nowrap; width: max-content; }
    .notebook-demo .layout-notebook__header-actions { flex-shrink: 0; }
    ${sharedHeader ? `.notebook-demo .notebook-resize { flex-basis: 0; inline-size: 0; overflow: visible; }
    .notebook-demo .notebook-resize::after { content: ''; position: absolute; inset-block: 0; inset-inline: -6px; }` : ''}
    .notebook-demo :is(.layout-notebook__header, .layout-notebook__sidebar-heading) .inkra-button[data-variant="ghost"] { --inkra-button-visual-padding: var(--layout-toolbar-inset); }
    .notebook-demo .layout-notebook__header-leading > .inkra-button { margin-inline: calc(0px - var(--layout-toolbar-inset)); }
    .notebook-demo .layout-notebook__header-actions > .inkra-button:last-child,
    .notebook-demo .layout-notebook__sidebar-heading > .inkra-flex > .inkra-button:last-child { margin-inline-end: calc(0px - var(--layout-toolbar-inset)); }
    .notebook-demo .notebook-content { flex: 1; }
    .notebook-demo[data-compact="true"] > .inkra-layout__body { position: relative; display: block; }
    .notebook-demo[data-compact="true"] .notebook-workspace { height: 100%; width: 100%; }
    .notebook-demo[data-compact="true"] .notebook-navigation {
      position: absolute; inset-block: 0; inset-inline-${rightSidebar ? 'end' : 'start'}: 0;
      width: var(--notebook-mobile-width); background: var(--inkra-paper); z-index: 3;
      transform: translateX(calc(var(--notebook-direction) * -100%)); visibility: hidden;
      transition: transform 180ms ease, visibility 0s 180ms;
    }
    .notebook-demo[data-compact="true"][data-navigation-open="true"] .notebook-navigation {
      transform: none; visibility: visible; transition-delay: 0s;
    }
    .notebook-demo[data-compact="true"]:is([data-mobile-navigation="page"], [data-mobile-navigation^="push"]) > .inkra-layout__body { position: static; }
    .notebook-demo[data-compact="true"][data-mobile-navigation="page"] .notebook-navigation { width: 100%; }
    .notebook-demo .notebook-dismiss { position: absolute; inset: 0; z-index: 2; background: ${mobileBackdrop ? 'var(--inkra-overlay)' : 'transparent'}; border: 0; padding: 0; border-radius: 0; }
    .notebook-demo[data-compact="true"][data-mobile-navigation^="push"] .notebook-navigation { z-index: 0; transform: none; }
    .notebook-demo[data-compact="true"][data-mobile-navigation^="push"] > .notebook-mobile-page,
    .notebook-demo[data-compact="true"][data-mobile-navigation^="push"] > .inkra-layout__body > .notebook-workspace {
      position: relative; z-index: 1; background: var(--inkra-paper); translate: 0; transition: translate 180ms ease;
    }
    .notebook-demo[data-compact="true"][data-mobile-navigation^="push"][data-navigation-open="true"] > .notebook-mobile-page,
    .notebook-demo[data-compact="true"][data-mobile-navigation^="push"][data-navigation-open="true"] > .inkra-layout__body > .notebook-workspace {
      translate: calc(var(--notebook-direction) * var(--notebook-mobile-width)) 0;
    }
    .notebook-demo[data-compact="true"][data-mobile-navigation^="push"] .notebook-dismiss { inset-inline-${rightSidebar ? 'end' : 'start'}: var(--notebook-mobile-width); }
    .notebook-demo[data-compact="true"][data-mobile-navigation="push-full"] { --notebook-mobile-width: 100%; }
    .notebook-demo[data-compact="true"][data-mobile-navigation="push-full"] .notebook-dismiss { display: none; }
    @media (prefers-reduced-motion: reduce) { .notebook-demo * { transition: none !important; } }
  \`}</style>
  ${!sectionalHeader ? '{header}' : ''}
  {compact ? <Layout.Body>
    {navigation && mobileOpen && <button type="button" className="notebook-dismiss" tabIndex={-1}
      aria-label="${zh ? '收起侧栏' : 'Close sidebar'}" onClick={closeNavigation} />}
    ${!rightSidebar ? '{navigation}' : ''}
    {workspace}
    ${rightSidebar ? '{navigation}' : ''}
  </Layout.Body> : desktopBody}
  ${!sectionalHeader || splitHeader ? '{footer}' : ''}
</Layout.Root>${sharedHeader ? '</Tabs.Root>' : ''};
}`;
  const sample = (previewWidth: number) => {
    const compact = collapseAt !== 'never' && previewWidth < (collapseAt === 'sm' ? 640 : 768);
    const hasSidebar = sidebar && layout !== 'content';
    const open = hasSidebar && (compact ? compactOpen : desktopOpen);
    const nestedHeader = sectionalHeader;
    const sidebarHeader = nestedHeader || (compact && mobileNavigation !== 'drawer');
    const toggleLabel = rightSidebar
      ? (open ? (zh ? '收起右侧栏' : 'Close right sidebar') : (zh ? '展开右侧栏' : 'Open right sidebar'))
      : (open ? (zh ? '收起侧栏' : 'Close sidebar') : (zh ? '展开侧栏' : 'Open sidebar'));
    const closeSidebar = () => {
      motion.prepare();
      focusAfterCollapse.current = true;
      if (compact) setCompactOpen(false);
      else setDesktopOpen(false);
    };
    const bottomToggle = open && !sidebarHeader;
    const toggleIcon = <DocsIcon data={rightSidebar ? rightSidebarIcon : sidebarIcon} size={26} />;
    const toggleSidebar = <Button ref={sidebarToggle} variant="ghost" size={bottomToggle ? 'md' : 'icon'}
      fullWidth={bottomToggle} align={bottomToggle ? 'start' : undefined} startIcon={bottomToggle ? toggleIcon : undefined}
      data-sidebar-toggle="" aria-label={toggleLabel} data-tooltip={bottomToggle ? undefined : toggleLabel}
      aria-controls={sidebarId} aria-expanded={open}
      onClick={() => {
        motion.prepare();
        focusAfterCollapse.current = true;
        if (compact) setCompactOpen(value => !value);
        else setDesktopOpen(value => !value);
      }}>
      {bottomToggle ? toggleLabel : toggleIcon}
    </Button>;
    const headerTitle = <div className="layout-notebook__header-title">
      <DocsIcon data={notebookIcon} size={26} />
      <div className="layout-notebook__header-location">
        <Breadcrumb.Root aria-label={zh ? '当前笔记位置' : 'Current notebook location'}>
          <Breadcrumb.List>
            {headerPath === 'simple' ? <Breadcrumb.Item><Breadcrumb.Page>{zh ? '笔记空间' : 'Notebook'}</Breadcrumb.Page></Breadcrumb.Item> : <>
              <Breadcrumb.Item><Breadcrumb.Link href="#notebook" onClick={event => { event.preventDefault(); setHeaderPath('simple'); }}>{zh ? '笔记空间' : 'Notebook'}</Breadcrumb.Link></Breadcrumb.Item>
              <Breadcrumb.Separator />
              {headerPath === 'section' ? <Breadcrumb.Item><Breadcrumb.Page>{zh ? '产品研究与项目归档' : 'Product research and project archive'}</Breadcrumb.Page></Breadcrumb.Item> : <>
                <Breadcrumb.Item><Breadcrumb.Link href="#research" onClick={event => { event.preventDefault(); setHeaderPath('section'); }}>{zh ? '产品研究与项目归档' : 'Product research and project archive'}</Breadcrumb.Link></Breadcrumb.Item>
                <Breadcrumb.Separator />
                <Breadcrumb.Item><Breadcrumb.Page>{zh ? '2026 年跨区域用户研究与产品决策记录' : '2026 cross-regional user research and product decision records'}</Breadcrumb.Page></Breadcrumb.Item>
              </>}
            </>}
          </Breadcrumb.List>
        </Breadcrumb.Root>
      </div>
    </div>;
    const header = <Layout.Header className="layout-notebook__header" padding={compact ? 3 : 5} divided={divided}
      sidebar={sharedHeader && !compact && hasSidebar ? headerTitle : undefined}
      sidebarDivided={sharedHeader && divided}
      inert={compact && open} aria-hidden={compact && open || undefined}>
      <div className="layout-notebook__header-grid">
        <div className="layout-notebook__header-leading">
          {hasSidebar && !rightSidebar && (collapsible || compact) && !open && toggleSidebar}
          {sharedHeader ? <Tabs.List className="layout-notebook__header-tabs" aria-label={zh ? '工作区导航' : 'Workspace navigation'} overflow="scroll">
            {workspaceTabs.map((label, index) => <Tabs.Trigger key={index} value={workspaceValues[index]}>{label}</Tabs.Trigger>)}
          </Tabs.List> : headerTitle}
        </div>
        <Flex className="layout-notebook__header-actions" align="center" gap={1}>
          <Button variant="ghost" startIcon={<DocsIcon data={plusIcon} size={26} />} onClick={addNote}>{zh ? '新建笔记' : 'New note'}</Button>
          {hasSidebar && rightSidebar && (collapsible || compact) && !open && toggleSidebar}
          {layout === 'dual' && !compact && collapsible && <Button ref={detailsToggle} variant="ghost" size="icon"
            aria-label={detailsOpen ? (zh ? '收起详情' : 'Close details') : (zh ? '展开详情' : 'Open details')}
            data-tooltip={zh ? '切换详情' : 'Toggle details'} aria-expanded={detailsOpen} aria-controls={detailsId}
            onClick={() => { motion.prepare(); setDetailsOpen(value => !value); }}><DocsIcon data={rightSidebarIcon} size={26} /></Button>}
        </Flex>
      </div>
    </Layout.Header>;
    const navigation = hasSidebar && <Layout.Sidebar id={sidebarId} className="layout-notebook__sidebar" data-sidebar-side={rightSidebar ? 'end' : 'start'}
      hidden={!open} width={sharedHeader && !compact ? undefined : Number(width)} padding={0} divided={compact && divided}>
      {sidebarHeader && <Layout.Header className="layout-notebook__sidebar-heading" padding={compact ? 3 : 5} divided={divided}>
        <Flex className="layout-notebook__sidebar-brand" align="center" gap={2}>
          <DocsIcon data={notebookIcon} size={26} /><PencilText>{zh ? '我的笔记' : 'My notes'}</PencilText>
        </Flex>
        {(collapsible || compact) && open && toggleSidebar}
      </Layout.Header>}
      <div className="layout-notebook__navigation">
        <div className="layout-notebook__sidebar-top">
        <Stack as="nav" className="layout-notebook__navigation-list" gap={1} aria-label={zh ? '笔记目录' : 'Notes navigation'}>
          {labels.map((label, index) => <Button key={label} variant={active === index ? 'secondary' : 'ghost'}
            startIcon={<DocsIcon data={icons[index]} size={26} />} align="start" fullWidth
            aria-current={active === index ? 'page' : undefined} onClick={() => { setActive(index); if (compact) closeSidebar(); }}>{label}</Button>)}
        </Stack>
        </div>
        <div className="layout-notebook__sidebar-bottom">
        <div className="layout-notebook__storage">
          <Progress value={published} max={notes.length} label={zh ? '发布进度' : 'Publishing'} />
          <PencilText>{`${published} / ${notes.length}`}</PencilText>
        </div>
        {!sidebarHeader && open && (collapsible || compact) && toggleSidebar}
        </div>
      </div>
    </Layout.Sidebar>;
    const cards = <Stack gap={5}>
          <div className="layout-notebook__notes">
            {visibleNotes.map(note => <Card.Root key={note.id} className="layout-notebook__note">
              <Card.Content padding={compact ? 'sm' : 'md'}>
                <Stack gap={3}>
                  <Flex align="center" justify="between">
                    <Badge variant={note.published ? 'success' : 'neutral'}>{note.published ? (zh ? '已发布' : 'Published') : (zh ? '草稿' : 'Draft')}</Badge>
                    <Button variant="ghost" size="icon" aria-label={(zh ? '收藏：' : 'Favorite: ') + note.title[zh ? 0 : 1]}
                      aria-pressed={note.favorite} data-tooltip={zh ? '收藏' : 'Favorite'} onClick={() => toggleFavorite(note.id)}>
                      <DocsIcon data={starIcon} size={26} active={note.favorite} />
                    </Button>
                  </Flex>
                  <PencilText as="h4">{note.title[zh ? 0 : 1]}</PencilText>
                  <PencilText as="p">{note.description[zh ? 0 : 1]}</PencilText>
                </Stack>
              </Card.Content>
            </Card.Root>)}
          </div>
          {!visibleNotes.length && <PencilText as="p">{zh ? '还没有收藏的笔记' : 'No favorite notes yet'}</PencilText>}
        </Stack>;
    const content = <Layout.Content className="layout-notebook__content" padding={compact ? 3 : 5} inert={compact && open} aria-hidden={compact && open || undefined}>
      {sharedHeader ? <Tabs.Content value={workspaceTab}>{cards}</Tabs.Content> : cards}
    </Layout.Content>;
    const footer = <Layout.Footer padding={compact ? 3 : 5} divided={divided} inert={compact && open} aria-hidden={compact && open || undefined}>
      <Flex align="center" justify="between" wrap>
        <PencilText as="output" aria-live="polite">{notes.length + (zh ? ' 条笔记' : ' notes')}</PencilText>
        <PencilText>{zh ? '个人工作区' : 'Personal workspace'}</PencilText>
      </Flex>
    </Layout.Footer>;
    const secondary = layout === 'dual' && !compact && <Layout.Sidebar id={detailsId} hidden={!detailsOpen} className="layout-notebook__secondary" data-sidebar-side="end" width={160}>
      <Stack gap={5}>
        <PencilText as="h3">{zh ? '工作区' : 'Workspace'}</PencilText>
        <dl>
          <div><PencilText as="dt">{zh ? '笔记' : 'Notes'}</PencilText><PencilText as="dd">{String(notes.length)}</PencilText></div>
          <div><PencilText as="dt">{zh ? '收藏' : 'Favorites'}</PencilText><PencilText as="dd">{String(notes.filter(note => note.favorite).length)}</PencilText></div>
          <div><PencilText as="dt">{zh ? '已发布' : 'Published'}</PencilText><PencilText as="dd">{String(published)}</PencilText></div>
        </dl>
      </Stack>
    </Layout.Sidebar>;
    const workspace = nestedHeader ? <Layout.Content padding={0} className="layout-notebook__column">
      {header}{content}{fullHeightSidebar && footer}
    </Layout.Content> : content;
    const navigationPanel = hasSidebar && <LayoutSidebarPanel id={`${sidebarId}-panel`} width={Number(width)}
      open={desktopOpen} onOpenChange={next => {
        if (!next && desktopOpen) focusAfterCollapse.current = true;
        setDesktopOpen(next);
      }} onWidthChange={sharedHeader ? setMeasuredSidebarWidth : undefined} collapsible={collapsible}>{navigation}</LayoutSidebarPanel>;
    const resizeHandle = <Resizable.Handle disabled={!resizable} hidden={!desktopOpen} className="layout-notebook__resize"
      data-divided={divided} label={zh ? '调整侧栏宽度' : 'Resize sidebar'} />;
    const body = <Layout.Body>
      {compact ? <>
      {compact && open && <button type="button" className="layout-notebook__dismiss" aria-label={zh ? '收起侧栏' : 'Close sidebar'} tabIndex={-1} onClick={closeSidebar} />}
      {!rightSidebar && navigation}
      {workspace}
      {rightSidebar && navigation}
      </> : <Resizable.Root key={`${layout}-${sidebar}`} className="layout-notebook__panels">
        {hasSidebar && !rightSidebar && <>{navigationPanel}{resizeHandle}</>}
        <Resizable.Panel id={`${sidebarId}-content`} minSize="30%" className="layout-notebook__panel">{workspace}</Resizable.Panel>
        {hasSidebar && rightSidebar && <>{resizeHandle}{navigationPanel}</>}
        {secondary && <>
          <Resizable.Handle disabled={!resizable} hidden={!detailsOpen} className="layout-notebook__resize" data-divided={divided} label={zh ? '调整详情宽度' : 'Resize details'} />
          <LayoutSidebarPanel id={`${detailsId}-panel`} width={160} open={detailsOpen} onOpenChange={setDetailsOpen} collapsible={collapsible}>{secondary}</LayoutSidebarPanel>
        </>}
      </Resizable.Root>}
    </Layout.Body>;
    const notebook = <Layout.Root ref={motion.root} className="layout-examples__shell layout-notebook" collapseAt={collapseAt} data-compact={compact} data-layout={layout}
      sidebarWidth={sharedHeader ? (hasSidebar && desktopOpen ? measuredSidebarWidth : 0) : undefined}
      swipeNavigation={{ enabled: swipeNavigation && compact && hasSidebar, open,
        side: rightSidebar ? 'end' : 'start', onOpenChange: next => {
          motion.prepare();
          focusAfterCollapse.current = true;
          setCompactOpen(next);
        } }}
      data-mobile-navigation={mobileNavigation} data-navigation-open={open} data-navigation-side={rightSidebar ? 'end' : 'start'}
      data-mobile-backdrop={mobileBackdrop}
      style={{ '--layout-mobile-width': `${mobileNavigation === 'push-full' ? previewWidth : Math.min(Number(width), previewWidth - 44)}px` } as CSSProperties}
      onKeyDown={event => {
        if (event.key === 'Escape' && open && (collapsible || compact)) {
          event.preventDefault();
          event.stopPropagation();
          closeSidebar();
        }
      }}>
      {!nestedHeader && header}
      {body}
      {(!nestedHeader || splitHeader) && footer}
    </Layout.Root>;
    return sharedHeader ? <Tabs.Root value={workspaceTab} onValueChange={setWorkspaceTab} style={{ height: '100%', minHeight: 0 }}>{notebook}</Tabs.Root> : notebook;
  };
  return <div className="layout-examples layout-examples--workspace">
    <ComponentPlayground code={code} controls={<PropertyTabs groups={[{ label: '布局', content: <>
      <ChoiceGrid className="layout-mode-picker" name={`${sidebarId}-mode`} label={zh ? '布局模式' : 'Layout mode'} columns={2}
        value={layout} onValueChange={next => { setLayout(next as NotebookLayout); setCompactOpen(false); }}>
        {notebookLayouts.map(([value, chinese, english]) => <ChoiceGridOption key={value} value={value}
          label={zh ? chinese : english} icon={<LayoutDiagram layout={value} />} />)}
      </ChoiceGrid>
      <Switch label={zh ? '区域分割线' : 'Region dividers'} checked={divided} onCheckedChange={setDivided} />
    </> }, { label: '内容', content: <>
      <DocsSelect label={zh ? '页头路径' : 'Header path'} value={headerPath} onValueChange={next => setHeaderPath(next as HeaderPath)}
        options={[[ 'simple', zh ? '简单标题' : 'Simple title' ], [ 'section', zh ? '二级页面' : 'Section page' ], [ 'long', zh ? '长路径' : 'Long path' ]]} />
    </> }, { label: '交互', content: <>
      <Switch label={zh ? '启用侧栏' : 'Enable sidebar'} checked={sidebar} onCheckedChange={setSidebar} disabled={layout === 'content'} />
      <Switch label={zh ? '拖拽调宽' : 'Resize panels'} checked={resizable} onCheckedChange={setResizable} disabled={layout === 'content'} />
      <Switch label={zh ? '允许折叠' : 'Collapsible panels'} checked={collapsible} onCheckedChange={value => {
        setCollapsible(value);
        if (!value) { setDesktopOpen(true); setDetailsOpen(true); }
      }} disabled={layout === 'content'} />
      <DocsSelect label={zh ? '初始侧栏宽度' : 'Initial sidebar width'} value={width} onValueChange={setWidth} disabled={!sidebar || layout === 'content'} options={['120', '160', '200', '240'].map(value => [value, value + ' px'] as const)} />
    </> }, { label: zh ? '移动端' : 'Mobile', content: <>
      <DocsSelect label={zh ? '收起断点' : 'Collapse breakpoint'} value={collapseAt} onValueChange={next => setCollapseAt(next as typeof collapseAt)}
        options={[[ 'sm', '640 px' ], [ 'md', '768 px' ], [ 'never', zh ? '不自动收起' : 'Never' ]]} />
      <ChoiceGrid className="layout-mode-picker mobile-navigation-picker" columns={2} name={`${sidebarId}-mobile`} label={t('侧栏呈现')} value={mobileNavigation}
        disabled={!sidebar || layout === 'content' || collapseAt === 'never'}
        onValueChange={next => previewNavigation(next as MobileNavigation)}>
        {mobileNavigations.map(([value, label]) => <ChoiceGridOption key={value} value={value}
          onClick={() => { if (value === mobileNavigation) previewNavigation(value); }}
          label={t(label)} icon={<MobileNavigationDiagram mode={value} right={rightSidebar} />} />)}
      </ChoiceGrid>
      <Switch label={t('内容遮罩')} checked={mobileBackdrop}
        disabled={!sidebar || layout === 'content' || collapseAt === 'never' || mobileNavigation === 'page' || mobileNavigation === 'push-full'}
        onCheckedChange={value => setBackdrops(current => ({ ...current, [mobileNavigation]: value }))} />
      <Switch label={t('滑动手势')} checked={swipeNavigation} onCheckedChange={setSwipeNavigation}
        disabled={!sidebar || layout === 'content' || collapseAt === 'never'} />
    </> }]} />}><LayoutViewport width={previewWidth} onWidthChange={next => { setPreviewWidth(next); setCompactOpen(false); }}>{sample}</LayoutViewport></ComponentPlayground>
    <LayoutPartsExamples />
    <ComponentExample id="without-a-sidebar" title={zh ? '没有侧栏也可以' : 'Without a sidebar'} code={`<Layout.Root>
  <Layout.Header divided><PencilText>${zh ? '一页笔记' : 'One-page notebook'}</PencilText></Layout.Header>
  <Layout.Content><PencilText>${zh ? '正文自己做主，不需要额外的外框。' : 'Content has the space it needs, without another frame.'}</PencilText></Layout.Content>
  <Layout.Footer divided><Badge variant="success">${zh ? '已保存' : 'Saved'}</Badge></Layout.Footer>
</Layout.Root>`}>
      <Layout.Root className="layout-examples__shell">
        <Layout.Header divided><PencilText>{zh ? '一页笔记' : 'One-page notebook'}</PencilText></Layout.Header>
        <Layout.Content><PencilText as="p">{zh ? '正文自己做主，不需要额外的外框。' : 'Content has the space it needs, without another frame.'}</PencilText></Layout.Content>
        <Layout.Footer divided><Badge variant="success">{zh ? '已保存' : 'Saved'}</Badge></Layout.Footer>
      </Layout.Root>
    </ComponentExample>
  </div>;
}
const baseApi = [
  ['as', 'LayoutElement', '选择 div、section、nav 等原生标签；不会自动补充交互语义。', 'Choose a native element such as div, section or nav; no interaction semantics are added.'],
  ['className / style / ref', 'string / CSSProperties / HTMLElement', '透传样式和元素引用，style 可覆盖布局属性。', 'Forward styles and the element ref; style can override layout properties.'],
] as [string, string, string, string][];
const flexApi = [
  ['direction', 'row | column | row-reverse | column-reverse', '控制排列方向。Flex 默认 row，Stack 默认 column；反转不改变 DOM 和 Tab 顺序。', 'Set the main axis. Flex defaults to row, Stack to column. Reversal does not change DOM or tab order.'],
  ['gap', 'LayoutSpace; default 3', '子项间距使用 4px 的 token 档位，3 对应 12px。', 'Space between children uses 4px token steps; 3 equals 12px.'],
  ['align', 'start | center | end | stretch | baseline', '控制交叉轴对齐，默认 stretch。', 'Cross-axis alignment; defaults to stretch.'],
  ['justify', 'start | center | end | between | around | evenly', '控制主轴上的空间分布，默认 start。', 'Distribute space on the main axis; defaults to start.'],
  ['wrap / inline', 'boolean; default false', 'wrap 允许换行，inline 使用行内弹性容器。', 'wrap allows wrapping; inline uses an inline flex container.'],
  ...baseApi,
] as [string, string, string, string][];
const a11y = {
  zh: '布局组件不增加键盘模式，也不修改 DOM 顺序。根据页面层级选择 as，整页只保留一个 main；反向排列不会反转 Tab 顺序。',
  en: 'Layout primitives add no keyboard mode and preserve DOM order. Choose as for the page hierarchy, keep one main per page, and note that reverse directions do not reverse tab order.',
};
export const layoutDocs: Record<string, ExpansionDoc> = {
  stack: { name: 'Stack', intro: { zh: '一个接一个排好，别再拿空格撑场面了。', en: 'One thing after another. Spaces are not a layout system.' }, api: flexApi, a11y, Examples: StackExamples },
  flex: { name: 'Flex', intro: { zh: '横着排、竖着排，居中这事终于不用玄学。', en: 'Rows, columns, and centering without a ritual.' }, api: flexApi, a11y, Examples: RowExamples },
  grid: { name: 'Grid', intro: { zh: '强迫症友好：每个格子都有自己的工位。', en: 'A desk for every item. Finally, some order.' }, a11y: {
    zh: '基础 Grid 保留 DOM 与 Tab 顺序。Grid.Resizable 的分隔条可聚焦，使用方向键调整行高或列宽。Grid.Board 从专用拖动或缩放手柄操作，方向键逐格移动或调整大小；卡片内的输入框和按钮不会启动拖拽。窄容器堆叠时保留桌面布局位置，但禁用编辑。请为分隔条、卡片和操作提供可访问名称。',
    en: 'Basic Grid preserves DOM and tab order. Focus a Grid.Resizable separator and use arrow keys to resize rows or columns. Grid.Board provides dedicated move and resize handles; arrow keys move or resize one cell at a time. Inputs and buttons inside cards do not start dragging. Narrow stacked views preserve desktop positions but disable editing. Provide accessible names for separators, cards and actions.',
  }, Examples: GridExamples, apiGroups: gridApiGroups },
  container: { name: 'Container', intro: { zh: '屏幕再宽，也不用把一行字拉成马拉松。', en: 'Wide screen? Your paragraphs still do not need a marathon.' }, a11y, Examples: ContainerExamples, api: [
    ['size', 'sm | md | lg | xl | full', '最大宽度依次为 640、768、1024、1280px 或不限；默认 lg，窄屏始终不超过父容器。', 'Maximum widths are 640, 768, 1024, 1280px or unlimited. Defaults to lg and never exceeds its parent.'],
    ['padding', 'LayoutSpace; default 5', '只设置左右内距，默认 20px，不重复添加上下间距。', 'Inline padding only, default 20px; no additional block spacing.'],
    ['centered', 'boolean; default true', '达到最大宽度后水平居中；关闭后从逻辑起始侧排列。', 'Center horizontally when max width is reached; false aligns to the logical start.'],
    ...baseApi,
  ] },
  layout: { name: 'Layout', intro: { zh: '页头、侧栏、正文各就各位，别抢彼此的地盘。', en: 'Header, sidebar, content: everyone gets their own space.' }, a11y, Examples: LayoutExamples, apiGroups: layoutApiGroups },
};
