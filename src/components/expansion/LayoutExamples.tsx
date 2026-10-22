import { useState } from 'react';
import { Badge, Button, Card, Container, Flex, Grid, Layout, Progress, Stack, Switch } from '@inkra/react';
import { __iconData as notebookIcon } from 'lucide-react/dist/esm/icons/notebook-pen.mjs';
import { __iconData as starIcon } from 'lucide-react/dist/esm/icons/star.mjs';
import { __iconData as historyIcon } from 'lucide-react/dist/esm/icons/rotate-ccw-clock.mjs';
import { __iconData as plusIcon } from 'lucide-react/dist/esm/icons/plus.mjs';
import type { ContainerProps, FlexProps, LayoutSpace } from '@inkra/react';
import { PencilText, useLocale } from '../../i18n';
import { ComponentExample } from '../ComponentExample';
import { ComponentPlayground } from '../ComponentPlayground';
import { DocsSelect } from '../DocsSelect';
import { PropertyTabs } from '../PropertyTabs';
import { DocsIcon } from '../DocsIcon';
import { LayoutViewport } from './LayoutViewport';
import type { ExpansionDoc } from './types';
import './LayoutExamples.css';

const spacingOptions = [[0, '0 px'], [2, '8 px'], [3, '12 px'], [4, '16 px'], [5, '20 px'], [6, '24 px'], [8, '32 px']] as const;
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
  const [sidebar, setSidebar] = useState(true);
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

<Layout.Root collapseAt="${collapseAt}">
  <Layout.Header divided={${divided}}>
    <Flex align="center" justify="between" wrap>
      <PencilText>${zh ? '笔记空间' : 'Notebook'}</PencilText>
      <Button onClick={addNote}>${zh ? '新建笔记' : 'New note'}</Button>
    </Flex>
  </Layout.Header>
  <Layout.Body>
    ${sidebar ? `<Layout.Sidebar width={${width}} padding={3} divided={${divided}}>
      <Stack as="nav" gap={1} aria-label="${zh ? '笔记目录' : 'Notes navigation'}">
        {labels.map((label, index) => (
          <Button key={label} variant={active === index ? 'secondary' : 'ghost'}
            align="start" fullWidth aria-current={active === index ? 'page' : undefined}
            onClick={() => setActive(index)}>{label}</Button>
        ))}
      </Stack>
    </Layout.Sidebar>` : ''}
    <Layout.Content>
      <Stack gap={5}>
        <PencilText as="h3">{labels[active]}</PencilText>
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
  </Layout.Body>
  <Layout.Footer divided={${divided}}>
    <PencilText>{notes.length} ${zh ? '条笔记' : 'notes'}</PencilText>
  </Layout.Footer>
</Layout.Root>`;
  const sample = <Layout.Root className="layout-examples__shell layout-notebook" collapseAt={collapseAt}>
    <Layout.Header divided={divided}>
      <Flex align="center" justify="between" wrap gap={3}>
        <Flex align="center" gap={2}><DocsIcon data={notebookIcon} size={28} /><PencilText>{zh ? '笔记空间' : 'Notebook'}</PencilText></Flex>
        <Button variant="outline" startIcon={<DocsIcon data={plusIcon} />} onClick={addNote}>{zh ? '新建笔记' : 'New note'}</Button>
      </Flex>
    </Layout.Header>
    <Layout.Body>
      {sidebar && <Layout.Sidebar width={Number(width)} padding={3} divided={divided}>
        <Stack as="nav" gap={1} aria-label={zh ? '笔记目录' : 'Notes navigation'}>
          {labels.map((label, index) => <Button key={label} variant={active === index ? 'secondary' : 'ghost'}
            startIcon={<DocsIcon data={icons[index]} />} align="start" fullWidth
            aria-current={active === index ? 'page' : undefined} onClick={() => setActive(index)}>{label}</Button>)}
        </Stack>
        <div className="layout-notebook__storage">
          <Progress value={published} max={notes.length} label={zh ? '发布进度' : 'Publishing'} />
          <PencilText>{`${published} / ${notes.length}`}</PencilText>
        </div>
      </Layout.Sidebar>}
      <Layout.Content>
        <Stack gap={5}>
          <Flex align="center" justify="between" wrap>
            <PencilText as="h3">{labels[active]}</PencilText>
            <Badge>{visibleNotes.length + (zh ? ' 条' : ' notes')}</Badge>
          </Flex>
          <div className="layout-notebook__notes">
            {visibleNotes.map(note => <Card.Root key={note.id} className="layout-notebook__note">
              <Card.Content>
                <Stack gap={3}>
                  <Flex align="center" justify="between">
                    <Badge variant={note.published ? 'success' : 'neutral'}>{note.published ? (zh ? '已发布' : 'Published') : (zh ? '草稿' : 'Draft')}</Badge>
                    <Button variant="ghost" size="icon" aria-label={(zh ? '收藏：' : 'Favorite: ') + note.title[zh ? 0 : 1]}
                      aria-pressed={note.favorite} data-tooltip={zh ? '收藏' : 'Favorite'} onClick={() => toggleFavorite(note.id)}>
                      <DocsIcon data={starIcon} active={note.favorite} />
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
      </Layout.Content>
    </Layout.Body>
    <Layout.Footer divided={divided}>
      <Flex align="center" justify="between" wrap>
        <PencilText as="output" aria-live="polite">{notes.length + (zh ? ' 条笔记' : ' notes')}</PencilText>
        <PencilText>{zh ? '个人工作区' : 'Personal workspace'}</PencilText>
      </Flex>
    </Layout.Footer>
  </Layout.Root>;
  return <div className="layout-examples layout-examples--workspace">
    <ComponentPlayground code={code} controls={<PropertyTabs groups={[{ label: '布局', content: <>
      <Switch label={zh ? '显示侧栏' : 'Show sidebar'} checked={sidebar} onCheckedChange={setSidebar} />
      <Switch label={zh ? '区域分割线' : 'Region dividers'} checked={divided} onCheckedChange={setDivided} />
      <DocsSelect label={zh ? '侧栏宽度' : 'Sidebar width'} value={width} onValueChange={setWidth} options={['120', '160', '200', '240'].map(value => [value, value + ' px'] as const)} />
      <DocsSelect label={zh ? '堆叠断点' : 'Stack breakpoint'} value={collapseAt} onValueChange={next => setCollapseAt(next as typeof collapseAt)}
        options={[[ 'sm', '640 px' ], [ 'md', '768 px' ], [ 'never', zh ? '不自动堆叠' : 'Never' ]]} />
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
