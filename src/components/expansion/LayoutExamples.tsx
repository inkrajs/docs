import { useEffect, useId, useRef, useState } from 'react';
import { Badge, Breadcrumb, Button, Card, ChoiceGrid, ChoiceGridOption, Container, Flex, Grid, Layout, PencilLine, Progress, Resizable, Stack, Switch } from '@inkra/react';
import { __iconData as notebookIcon } from 'lucide-react/dist/esm/icons/notebook-pen.mjs';
import { __iconData as starIcon } from 'lucide-react/dist/esm/icons/star.mjs';
import { __iconData as historyIcon } from 'lucide-react/dist/esm/icons/rotate-ccw-clock.mjs';
import { __iconData as plusIcon } from 'lucide-react/dist/esm/icons/plus.mjs';
import { __iconData as sidebarIcon } from 'lucide-react/dist/esm/icons/panel-left.mjs';
import { __iconData as rightSidebarIcon } from 'lucide-react/dist/esm/icons/panel-right.mjs';
import type { ContainerProps, FlexProps, LayoutSpace } from '@inkra/react';
import { PencilText, useLocale } from '../../i18n';
import { ComponentExample } from '../ComponentExample';
import { ComponentPlayground } from '../ComponentPlayground';
import { DocsSelect } from '../DocsSelect';
import { PropertyTabs } from '../PropertyTabs';
import { DocsIcon } from '../DocsIcon';
import { LayoutViewport } from './LayoutViewport';
import { LayoutSidebarPanel } from './LayoutPanels';
import { useLayoutMotion } from './useLayoutMotion';
import type { ExpansionDoc } from './types';
import './LayoutExamples.css';

const spacingOptions = [[0, '0 px'], [2, '8 px'], [3, '12 px'], [4, '16 px'], [5, '20 px'], [6, '24 px'], [8, '32 px']] as const;
const notebookLayouts = [
  ['top', '顶部通栏', 'Full-width header'],
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
    <ComponentExample title={zh ? '内容与操作' : 'Content and actions'} code={`const [saved, setSaved] = useState(false);

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

function GridExamples() {
  const { locale } = useLocale();
  const zh = locale === 'zh-CN';
  const [columns, setColumns] = useState('3');
  const [gap, setGap] = useState<LayoutSpace>(3);
  const [responsive, setResponsive] = useState(true);
  const names = zh ? ['草图', '图标', '色彩', '文字', '布局', '交互'] : ['Sketches', 'Icons', 'Colors', 'Text', 'Layout', 'Interaction'];
  const code = `const items = ${JSON.stringify(names)};

<Grid columns={${responsive ? `{ base: 1, sm: 2, lg: ${columns} }` : columns}} gap={${gap}}>
  {items.map(item => <PencilText key={item}>{item}</PencilText>)}
</Grid>`;
  return <div className="layout-examples">
    <ComponentPlayground code={code} controls={<PropertyTabs groups={[{ label: '布局', content: <>
      <DocsSelect label={zh ? '列数' : 'Columns'} value={columns} onValueChange={setColumns} options={['1', '2', '3', '4'].map(value => [value, value] as const)} />
      <GapControl value={gap} onChange={setGap} />
      <Switch label={zh ? '响应式列数' : 'Responsive columns'} checked={responsive} onCheckedChange={setResponsive} />
    </> }]} />}>
      <Grid className="layout-examples__grid" columns={responsive ? { base: 1, sm: 2, lg: Number(columns) } : Number(columns)} gap={gap}>
        {names.map((name, index) => <div className="layout-examples__cell" key={name}>
          <Badge variant={index % 2 ? 'success' : 'info'}>{String(index + 1).padStart(2, '0')}</Badge><PencilText>{name}</PencilText>
        </div>)}
      </Grid>
    </ComponentPlayground>
    <ComponentExample title={zh ? '不同的行列间距' : 'Separate row and column spacing'} code={`const items = ${JSON.stringify(names.slice(0, 4))};\n\n<Grid columns={{ base: 1, md: 2 }} rowGap={5} columnGap={2}>\n  {items.map(item => <PencilText key={item}>{item}</PencilText>)}\n</Grid>`}>
      <Grid className="layout-examples__grid" columns={{ base: 1, md: 2 }} rowGap={5} columnGap={2}>
        {names.slice(0, 4).map(name => <div className="layout-examples__cell" key={name}><PencilText>{name}</PencilText></div>)}
      </Grid>
    </ComponentExample>
  </div>;
}

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
    <ComponentExample title={zh ? '阅读宽度' : 'Reading width'} code={`<Container as="article" size="sm" padding={5}>\n  <PencilText as="p">${zh ? '一行不必从屏幕这头跑到那头。把阅读宽度收回来，让视线少赶一点路。' : 'A line does not need to travel from one edge of the screen to the other. Keep reading comfortable with a bounded column.'}</PencilText>\n</Container>`}>
      <Container as="article" size="sm" padding={5} className="layout-examples__container">
        <PencilText as="p">{zh ? '一行不必从屏幕这头跑到那头。把阅读宽度收回来，让视线少赶一点路。' : 'A line does not need to travel from one edge of the screen to the other. Keep reading comfortable with a bounded column.'}</PencilText>
      </Container>
    </ComponentExample>
  </div>;
}

function LayoutExamples() {
  const { locale } = useLocale();
  const zh = locale === 'zh-CN';
  const [layout, setLayout] = useState<NotebookLayout>('top');
  const [headerPath, setHeaderPath] = useState<HeaderPath>('simple');
  const rightSidebar = layout === 'right' || layout === 'right-side' || layout === 'right-split';
  const fullHeightSidebar = layout === 'side' || layout === 'right-side';
  const splitHeader = layout === 'split' || layout === 'right-split';
  const sectionalHeader = fullHeightSidebar || splitHeader;
  const [sidebar, setSidebar] = useState(true);
  const [desktopOpen, setDesktopOpen] = useState(true);
  const [compactOpen, setCompactOpen] = useState(false);
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
  const [active, setActive] = useState(0);
  const [notes, setNotes] = useState([
    { id: 1, title: ['周会记录', 'Weekly notes'], description: ['把本周的进展和下周要做的事放在一起。', 'This week’s progress and the next steps, in one place.'], favorite: true, published: true },
    { id: 2, title: ['首页草图', 'Homepage sketches'], description: ['先把内容排好，再决定哪一笔要重一点。', 'Content first. The finishing touches can follow.'], favorite: false, published: false },
    { id: 3, title: ['下次再试的想法', 'Ideas for next time'], description: ['今天没用上的点子，先留个位置。', 'A place for the ideas that did not fit today.'], favorite: false, published: false },
  ]);
  const labels = zh ? ['全部笔记', '收藏', '最近编辑'] : ['All notes', 'Favorites', 'Recent'];
  const icons = [notebookIcon, starIcon, historyIcon];
  const visibleNotes = active === 1 ? notes.filter(note => note.favorite) : active === 2 ? [...notes].reverse() : notes;
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
  const code = `const [active, setActive] = useState(0);
const [sidebarOpen, setSidebarOpen] = useState(true);
const [detailsOpen, setDetailsOpen] = useState(true);
const navigationRef = useResizablePanelRef();
const detailsRef = useResizablePanelRef();
const sidebarId = useId();
const [headerPath, setHeaderPath] = useState('${headerPath}');
const labels = ${JSON.stringify(labels)};
const [notes, setNotes] = useState(${JSON.stringify(notes.map(note => ({ ...note, title: note.title[zh ? 0 : 1], description: note.description[zh ? 0 : 1] })), null, 2)});
const visible = active === 1 ? notes.filter(note => note.favorite)
  : active === 2 ? [...notes].reverse() : notes;
const toggleFavorite = id => setNotes(items => items.map(note =>
  note.id === id ? { ...note, favorite: !note.favorite } : note));
const addNote = () => {
  setNotes(items => [...items, {
    id: Math.max(...items.map(note => note.id), 0) + 1,
    title: '${zh ? '新笔记' : 'New note'}',
    description: '', favorite: false, published: false,
  }]);
  setActive(0);
};

const sidebarToggle = ${sidebar && layout !== 'content' && collapsible ? `(
  <Button variant="ghost" size={${sectionalHeader ? "'icon'" : "sidebarOpen ? 'md' : 'icon'"}}
    fullWidth={${sectionalHeader ? 'false' : 'sidebarOpen'}} align="start" aria-label="${zh ? '切换侧栏' : 'Toggle sidebar'}"
    ${!sectionalHeader ? `startIcon={sidebarOpen ? <${rightSidebar ? 'PanelRight' : 'PanelLeft'} size={26} aria-hidden="true" /> : undefined}` : ''}
    aria-expanded={sidebarOpen} aria-controls={sidebarId}
    onClick={() => sidebarOpen ? navigationRef.current?.collapse() : navigationRef.current?.expand()}>
    ${sectionalHeader ? `<${rightSidebar ? 'PanelRight' : 'PanelLeft'} size={26} aria-hidden="true" />` : `{sidebarOpen ? '${zh ? '收起侧栏' : 'Close sidebar'}' : <${rightSidebar ? 'PanelRight' : 'PanelLeft'} size={26} aria-hidden="true" />}`}
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
  <Layout.Header className="layout-notebook__header" divided={${divided}}>
    <div className="layout-notebook__header-grid">
      <div className="layout-notebook__header-leading">
        ${!rightSidebar ? '{!sidebarOpen && sidebarToggle}' : ''}
        {headerTitle}
      </div>
      <div className="layout-notebook__header-actions">
        <Button variant="ghost" onClick={addNote}>${zh ? '新建笔记' : 'New note'}</Button>
        ${rightSidebar ? '{!sidebarOpen && sidebarToggle}' : ''}
        ${layout === 'dual' && collapsible ? `<Button variant="ghost" size="icon" aria-label="${zh ? '切换详情' : 'Toggle details'}"
        onClick={() => detailsRef.current?.isCollapsed() ? detailsRef.current.expand() : detailsRef.current?.collapse()}>
        <PanelRight aria-hidden="true" />
      </Button>` : ''}
      </div>
    </div>
  </Layout.Header>
);
const navigation = ${sidebar && layout !== 'content' ? `(
    <Layout.Sidebar id={sidebarId} hidden={!sidebarOpen} width="100%" padding={3} style={{ height: '100%', overflow: 'auto', display: sidebarOpen ? 'flex' : 'none', flexDirection: 'column' }}>
      ${sectionalHeader ? `<Layout.Header divided={${divided}} padding={0}>
        <Flex align="center" justify="between">
          <Flex align="center" gap={2}><NotebookPen aria-hidden="true" /><PencilText>${zh ? '我的笔记' : 'My notes'}</PencilText></Flex>
          {sidebarOpen && sidebarToggle}
        </Flex>
      </Layout.Header>` : ''}
      <Stack as="nav" gap={1} aria-label="${zh ? '笔记目录' : 'Notes navigation'}">
        {labels.map((label, index) => (
          <Button key={label} variant={active === index ? 'secondary' : 'ghost'}
            align="start" fullWidth aria-current={active === index ? 'page' : undefined}
            onClick={() => setActive(index)}>{label}</Button>
        ))}
      </Stack>
      <div style={{ marginTop: 'auto', paddingTop: 24 }}>
        ${sectionalHeader ? `<Progress value={notes.filter(note => note.published).length} max={notes.length} label="${zh ? '发布进度' : 'Publishing'}" />` : '{sidebarOpen && sidebarToggle}'}
      </div>
    </Layout.Sidebar>
);` : 'null;'}
const content = (
    <Layout.Content style={{ minHeight: 0, overflow: 'auto' }}>
      <Stack gap={5}>
        <Flex wrap gap={4}>
          {visible.map(note => (
            <Card.Root key={note.id} style={{ flex: '1 1 240px', minWidth: 0 }}>
              <Card.Content>
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
    </Layout.Content>
);
const footer = (
  <Layout.Footer divided={${divided}}>
    <PencilText>{notes.length} ${zh ? '条笔记' : 'notes'}</PencilText>
  </Layout.Footer>
);
const navigationPanel = navigation && (
  <Resizable.Panel panelRef={navigationRef} defaultSize={${width}} minSize={120} maxSize="40%" collapsible={${collapsible}}
    onResize={size => setSidebarOpen(size.asPercentage > 0)}>
    {navigation}
  </Resizable.Panel>
);
const handle = <Resizable.Handle hidden={!sidebarOpen} style={{ display: sidebarOpen ? undefined : 'none' }} disabled={${!resizable}} label="${zh ? '调整侧栏宽度' : 'Resize sidebar'}" />;
${layout === 'dual' ? `const details = <Layout.Sidebar width="100%" style={{ height: '100%', overflow: 'auto' }}><PencilText>${zh ? '工作区' : 'Workspace'}</PencilText></Layout.Sidebar>;\n` : ''}
<Layout.Root collapseAt="${collapseAt}" style={{ height: 640, overflow: 'hidden' }}>
  ${sectionalHeader ? `<Layout.Body style={{ minHeight: 0 }}>
    <Resizable.Root>
    ${!rightSidebar ? '{navigationPanel}{navigation && handle}' : ''}
    <Resizable.Panel minSize="30%" style={{ display: 'flex', flexDirection: 'column' }}>
    <Layout.Content padding={0} style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      {header}
      {content}
      ${fullHeightSidebar ? '{footer}' : ''}
    </Layout.Content>
    </Resizable.Panel>
    ${rightSidebar ? '{navigation && handle}{navigationPanel}' : ''}
    </Resizable.Root>
  </Layout.Body>
  ${splitHeader ? '{footer}' : ''}` : `{header}
  <Layout.Body style={{ minHeight: 0 }}>
    <Resizable.Root>
      ${!rightSidebar && layout !== 'content' ? '{navigationPanel}{navigation && handle}' : ''}
      <Resizable.Panel minSize="30%" style={{ display: 'flex', flexDirection: 'column' }}>{content}</Resizable.Panel>
      ${rightSidebar ? '{navigation && handle}{navigationPanel}' : layout === 'dual' ? `<Resizable.Handle hidden={!detailsOpen} style={{ display: detailsOpen ? undefined : 'none' }} disabled={${!resizable}} label="${zh ? '调整详情宽度' : 'Resize details'}" />
      <Resizable.Panel panelRef={detailsRef} onResize={size => setDetailsOpen(size.asPercentage > 0)} defaultSize={160} minSize={120} maxSize="40%" collapsible={${collapsible}}>{details}</Resizable.Panel>` : ''}
    </Resizable.Root>
  </Layout.Body>
  {footer}`}
</Layout.Root>`;
  const sample = (previewWidth: number) => {
    const compact = collapseAt !== 'never' && previewWidth < (collapseAt === 'sm' ? 640 : 768);
    const hasSidebar = sidebar && layout !== 'content';
    const open = hasSidebar && (compact ? compactOpen : desktopOpen);
    const nestedHeader = !compact && sectionalHeader;
    const toggleLabel = rightSidebar
      ? (open ? (zh ? '收起右侧栏' : 'Close right sidebar') : (zh ? '展开右侧栏' : 'Open right sidebar'))
      : (open ? (zh ? '收起侧栏' : 'Close sidebar') : (zh ? '展开侧栏' : 'Open sidebar'));
    const closeSidebar = () => {
      motion.prepare();
      focusAfterCollapse.current = true;
      if (compact) setCompactOpen(false);
      else setDesktopOpen(false);
    };
    const bottomToggle = open && !nestedHeader;
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
    const header = <Layout.Header className="layout-notebook__header" divided={divided}>
      <div className="layout-notebook__header-grid">
        <div className="layout-notebook__header-leading">
          {hasSidebar && !rightSidebar && (collapsible || compact) && !open && toggleSidebar}
          {headerTitle}
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
      hidden={!open} width={Number(width)} padding={0} divided={compact && divided}>
      {nestedHeader && <Layout.Header className="layout-notebook__sidebar-heading" divided={divided}>
        <Flex className="layout-notebook__sidebar-brand" align="center" gap={2}>
          <DocsIcon data={notebookIcon} size={26} /><PencilText>{zh ? '我的笔记' : 'My notes'}</PencilText>
        </Flex>
        {collapsible && open && toggleSidebar}
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
        {!nestedHeader && open && (collapsible || compact) && toggleSidebar}
        </div>
      </div>
    </Layout.Sidebar>;
    const content = <Layout.Content className="layout-notebook__content" inert={compact && open} aria-hidden={compact && open || undefined}>
        <Stack gap={5}>
          <div className="layout-notebook__notes">
            {visibleNotes.map(note => <Card.Root key={note.id} className="layout-notebook__note">
              <Card.Content>
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
        </Stack>
    </Layout.Content>;
    const footer = <Layout.Footer divided={divided}>
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
      }} collapsible={collapsible}>{navigation}</LayoutSidebarPanel>;
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
    return <Layout.Root ref={motion.root} className="layout-examples__shell layout-notebook" collapseAt={collapseAt} data-compact={compact} data-layout={layout}
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
  };
  return <div className="layout-examples layout-examples--workspace">
    <ComponentPlayground code={code} controls={<PropertyTabs groups={[{ label: '布局', content: <>
      <ChoiceGrid className="layout-mode-picker" name={`${sidebarId}-mode`} label={zh ? '布局模式' : 'Layout mode'} columns={2}
        value={layout} onValueChange={next => { setLayout(next as NotebookLayout); setCompactOpen(false); }}>
        {notebookLayouts.map(([value, chinese, english]) => <ChoiceGridOption key={value} value={value}
          label={zh ? chinese : english} icon={<LayoutDiagram layout={value} />} />)}
      </ChoiceGrid>
      <DocsSelect label={zh ? '页头路径' : 'Header path'} value={headerPath} onValueChange={next => setHeaderPath(next as HeaderPath)}
        options={[[ 'simple', zh ? '简单标题' : 'Simple title' ], [ 'section', zh ? '二级页面' : 'Section page' ], [ 'long', zh ? '长路径' : 'Long path' ]]} />
      <Switch label={zh ? '启用侧栏' : 'Enable sidebar'} checked={sidebar} onCheckedChange={setSidebar} disabled={layout === 'content'} />
      <Switch label={zh ? '拖拽调宽' : 'Resize panels'} checked={resizable} onCheckedChange={setResizable} disabled={layout === 'content'} />
      <Switch label={zh ? '允许折叠' : 'Collapsible panels'} checked={collapsible} onCheckedChange={value => {
        setCollapsible(value);
        if (!value) { setDesktopOpen(true); setDetailsOpen(true); }
      }} disabled={layout === 'content'} />
      <Switch label={zh ? '区域分割线' : 'Region dividers'} checked={divided} onCheckedChange={setDivided} />
      <DocsSelect label={zh ? '初始侧栏宽度' : 'Initial sidebar width'} value={width} onValueChange={setWidth} disabled={!sidebar || layout === 'content'} options={['120', '160', '200', '240'].map(value => [value, value + ' px'] as const)} />
      <DocsSelect label={zh ? '收起断点' : 'Collapse breakpoint'} value={collapseAt} onValueChange={next => setCollapseAt(next as typeof collapseAt)}
        options={[[ 'sm', '640 px' ], [ 'md', '768 px' ], [ 'never', zh ? '不自动收起' : 'Never' ]]} />
    </> }]} />}><LayoutViewport>{sample}</LayoutViewport></ComponentPlayground>
    <ComponentExample title={zh ? '没有侧栏也可以' : 'Without a sidebar'} code={`<Layout.Root>
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
  grid: { name: 'Grid', intro: { zh: '强迫症友好：每个格子都有自己的工位。', en: 'A desk for every item. Finally, some order.' }, a11y, Examples: GridExamples, api: [
    ['columns', 'number | { base?, sm?, md?, lg? }', '默认 1 列，限制为 1–12。视口断点为 640、768、1024px，未设置的档位继承上一档。', 'Defaults to 1, clamped to 1–12. Viewport breakpoints are 640, 768 and 1024px; omitted values inherit the previous one.'],
    ['gap / rowGap / columnGap', 'LayoutSpace; default 3', '统一间距默认 12px；可分别覆盖行和列的间距。', 'The default gap is 12px; override row and column spacing independently.'],
    ['align', 'start | center | end | stretch | baseline', '控制单元格内容在行内的垂直对齐，默认 stretch。', 'Align items within grid rows; defaults to stretch.'],
    ...baseApi,
  ] },
  container: { name: 'Container', intro: { zh: '屏幕再宽，也不用把一行字拉成马拉松。', en: 'Wide screen? Your paragraphs still do not need a marathon.' }, a11y, Examples: ContainerExamples, api: [
    ['size', 'sm | md | lg | xl | full', '最大宽度依次为 640、768、1024、1280px 或不限；默认 lg，窄屏始终不超过父容器。', 'Maximum widths are 640, 768, 1024, 1280px or unlimited. Defaults to lg and never exceeds its parent.'],
    ['padding', 'LayoutSpace; default 5', '只设置左右内距，默认 20px，不重复添加上下间距。', 'Inline padding only, default 20px; no additional block spacing.'],
    ['centered', 'boolean; default true', '达到最大宽度后水平居中；关闭后从逻辑起始侧排列。', 'Center horizontally when max width is reached; false aligns to the logical start.'],
    ...baseApi,
  ] },
  layout: { name: 'Layout', intro: { zh: '页头、侧栏、正文各就各位，别抢彼此的地盘。', en: 'Header, sidebar, content: everyone gets their own space.' }, a11y, Examples: LayoutExamples, api: [
    ['Root.collapseAt', 'sm | md | never; default sm', '按 Layout 容器宽度在 640/768px 以下把侧栏放到正文上方；never 保持横排。', 'Stack sidebar above content below 640/768px of container width; never keeps the row.'],
    ['Root.gap / Body.gap', 'LayoutSpace; default 0', 'Root 控制纵向区域间距，Body 控制侧栏与正文间距。', 'Root spaces vertical regions; Body spaces sidebar and content.'],
    ['Sidebar.width', 'CSSProperties.width; default 240', '桌面侧栏宽度；数字按像素处理。堆叠后自动占满可用宽度。', 'Sidebar width; numbers are pixels. It fills available width when stacked.'],
    ['Header / Sidebar / Content / Footer.padding', 'LayoutSpace; default 5', '区域内部统一内距，默认 20px；设为 0 交给子内容负责。', 'Region padding, default 20px; use 0 when children own spacing.'],
    ['Header / Sidebar / Footer.divided', 'boolean; default false', '显示区域边缘的手绘分割线；侧栏堆叠时自动换成横线。', 'Draw a pencil divider at the region edge; sidebar dividers become horizontal when stacked.'],
    ['Content.as', 'LayoutElement; default div', '默认 div，避免示例或嵌套布局产生重复 main；整页正文可显式使用 main。', 'Defaults to div to avoid nested main landmarks; use main explicitly for page content.'],
    ...baseApi,
  ] },
};
