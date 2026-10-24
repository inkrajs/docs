import { useState } from 'react';
import { Button, Command, InputNumber, Overlay, Pagination, PencilText, Switch } from '@inkra/react';
import type { PaginationLabels } from '@inkra/react';
import { __iconData as fileIcon } from 'lucide-react/dist/esm/icons/file-text.mjs';
import { __iconData as searchIcon } from 'lucide-react/dist/esm/icons/search.mjs';
import { __iconData as settingsIcon } from 'lucide-react/dist/esm/icons/settings.mjs';
import { useLocale } from '../../i18n';
import { ComponentExample } from '../ComponentExample';
import { ComponentPlayground } from '../ComponentPlayground';
import { DocsIcon } from '../DocsIcon';
import { DocsSelect } from '../DocsSelect';
import { PropertyTabs } from '../PropertyTabs';
import type { ExpansionDoc } from './types';
import './NavigationExamples.css';

function paginationLabels(zh: boolean): PaginationLabels {
  return {
    nav: zh ? '结果分页' : 'Results pagination', first: zh ? '第一页' : 'First page',
    previous: zh ? '上一页' : 'Previous page', next: zh ? '下一页' : 'Next page',
    last: zh ? '最后一页' : 'Last page', page: page => zh ? `第 ${page} 页` : `Page ${page}`,
    ellipsis: zh ? '更多页码' : 'More pages',
  };
}

function PaginationExamples() {
  const { locale } = useLocale();
  const zh = locale === 'zh-CN';
  const labels = paginationLabels(zh);
  const [page, setPage] = useState(6);
  const [totalPages, setTotalPages] = useState(20);
  const [siblings, setSiblings] = useState(1);
  const [boundaries, setBoundaries] = useState(1);
  const [size, setSize] = useState<'sm' | 'md' | 'lg'>('md');
  const [disabled, setDisabled] = useState(false);
  const [firstLast, setFirstLast] = useState(true);
  const [simple, setSimple] = useState(false);
  const [previousNext, setPreviousNext] = useState(true);
  const [hideSingle, setHideSingle] = useState(false);
  const [rtl, setRtl] = useState(false);
  const [changingTotal, setChangingTotal] = useState(12);
  const resolvedPage = totalPages ? Math.min(totalPages, Math.max(1, page)) : 0;
  return <div className="component-examples navigation-examples">
    <ComponentPlayground code={`const [page, setPage] = useState(${page});
<Pagination totalPages={${totalPages}} page={page} onPageChange={setPage}
  siblingCount={${siblings}} boundaryCount={${boundaries}}
  simple={${simple}} showPreviousNext={${previousNext}} hideOnSinglePage={${hideSingle}}
  showFirstLast={${firstLast}} size="${size}" disabled={${disabled}} dir="${rtl ? 'rtl' : 'ltr'}" />`}
      controls={<PropertyTabs groups={[
        { label: '基础', content: <>
          <label>{zh ? '总页数' : 'Total pages'}<InputNumber aria-label={zh ? '总页数' : 'Total pages'} min={0} max={1000} value={totalPages} onValueChange={value => setTotalPages(value ?? 0)} /></label>
          <DocsSelect label={zh ? '尺寸' : 'Size'} value={size} onValueChange={value => setSize(value as typeof size)} options={[["sm", "sm"], ["md", "md"], ["lg", "lg"]]} />
        </> },
        { label: '布局', content: <>
          <DocsSelect label={zh ? '相邻页数' : 'Sibling count'} value={String(siblings)} onValueChange={value => setSiblings(Number(value))} options={[["0", "0"], ["1", "1"], ["2", "2"], ["3", "3"]]} />
          <DocsSelect label={zh ? '边界页数' : 'Boundary count'} value={String(boundaries)} onValueChange={value => setBoundaries(Number(value))} options={[["0", "0"], ["1", "1"], ["2", "2"]]} />
          <Switch label={zh ? '首尾操作' : 'First and last controls'} checked={firstLast} onCheckedChange={setFirstLast} />
          <Switch label={zh ? '简洁模式' : 'Simple mode'} checked={simple} onCheckedChange={setSimple} />
          <Switch label={zh ? '上一页与下一页' : 'Previous and next controls'} checked={previousNext} onCheckedChange={setPreviousNext} />
          <Switch label={zh ? '仅一页时隐藏' : 'Hide for a single page'} checked={hideSingle} onCheckedChange={setHideSingle} />
          <Switch label="RTL" checked={rtl} onCheckedChange={setRtl} />
        </> },
        { label: '状态', content: <Switch label={zh ? '禁用' : 'Disabled'} checked={disabled} onCheckedChange={setDisabled} /> },
      ]} />}>
      <div className="navigation-examples__stage" dir={rtl ? 'rtl' : 'ltr'} data-testid="pagination-playground">
        <Pagination totalPages={totalPages} page={page} onPageChange={setPage} siblingCount={siblings} boundaryCount={boundaries} showFirstLast={firstLast} simple={simple} showPreviousNext={previousNext} hideOnSinglePage={hideSingle} disabled={disabled} size={size} labels={labels} />
        <output aria-live="polite" data-testid="pagination-value">{zh ? '当前页' : 'Current page'}: {resolvedPage} / {totalPages}</output>
        <ol start={Math.max(1, (resolvedPage - 1) * 3 + 1)} className="navigation-examples__results">
          {resolvedPage > 0 && [1, 2, 3].map(index => <li key={index}>{zh ? '笔记' : 'Note'} {(resolvedPage - 1) * 3 + index}</li>)}
        </ol>
      </div>
    </ComponentPlayground>
    <ComponentExample title={zh ? '基本分页' : 'Basic pagination'} code={'<Pagination totalPages={5} defaultPage={1} />'}>
      <Pagination totalPages={5} defaultPage={1} labels={labels} data-testid="pagination-basic" />
    </ComponentExample>
    <ComponentExample title={zh ? '自定义页码与摘要' : 'Custom page labels and summary'} code={`<Pagination totalPages={3} renderPage={page => <PencilText>{String(page).padStart(2, '0')}</PencilText>} />
<Pagination totalPages={12} simple renderSummary={(page, total) => <PencilText>{\`${zh ? '第 ${page} 页，共 ${total} 页' : 'Page ${page} of ${total}'}\`}</PencilText>} />`}>
      <div className="navigation-examples__stage">
        <Pagination totalPages={3} labels={labels} renderPage={page => <PencilText>{String(page).padStart(2, '0')}</PencilText>} />
        <Pagination totalPages={12} simple labels={labels} renderSummary={(page, total) => <PencilText>{zh ? `第 ${page} 页，共 ${total} 页` : `Page ${page} of ${total}`}</PencilText>} />
      </div>
    </ComponentExample>
    <ComponentExample title={zh ? '空结果与总页数变化' : 'Empty results and changing totals'} code={`const [totalPages, setTotalPages] = useState(12);
<Pagination totalPages={totalPages} defaultPage={9} showFirstLast />
<Pagination totalPages={0} showFirstLast />`}>
      <div className="navigation-examples__stage" data-testid="pagination-changing-total">
      <DocsSelect label={zh ? '结果页数' : 'Result pages'} value={String(changingTotal)} onValueChange={value => setChangingTotal(Number(value))} options={[["12", "12"], ["3", "3"], ["0", "0"]]} />
      <Pagination totalPages={changingTotal} defaultPage={9} showFirstLast labels={labels} />
      <Pagination totalPages={0} showFirstLast labels={{ ...labels, nav: zh ? '空结果分页' : 'Empty results pagination' }} data-testid="pagination-empty" />
      </div>
    </ComponentExample>
  </div>;
}

function CommandItems({ zh, onSelect, disabled = true }: { zh: boolean; onSelect: (value: string) => void; disabled?: boolean }) {
  return <>
    <Command.Empty>{zh ? '没有匹配的命令' : 'No matching commands'}</Command.Empty>
    <Command.Group heading={zh ? '工作区' : 'Workspace'}>
      <Command.Item value="new-note" keywords={['note', 'create', '新建', '笔记']} icon={<DocsIcon data={fileIcon} />} shortcut="⌘N" onSelect={onSelect}>{zh ? '新建笔记' : 'New note'}</Command.Item>
      <Command.Item value="find-note" keywords={['find', 'search', '查找', '笔记']} icon={<DocsIcon data={searchIcon} />} shortcut="⌘F" onSelect={onSelect}>{zh ? '查找笔记' : 'Find note'}</Command.Item>
    </Command.Group>
    <Command.Separator />
    <Command.Group heading={zh ? '设置' : 'Settings'}>
      <Command.Item value="preferences" keywords={['settings', '设置', '偏好']} icon={<DocsIcon data={settingsIcon} />} onSelect={onSelect}>{zh ? '偏好设置' : 'Preferences'}</Command.Item>
      <Command.Item value="archive" keywords={['archive', '归档']} disabled={disabled} onSelect={onSelect}>{zh ? '归档工作区' : 'Archive workspace'}</Command.Item>
    </Command.Group>
  </>;
}

function CommandExamples() {
  const { locale } = useLocale();
  const zh = locale === 'zh-CN';
  const [selected, setSelected] = useState('');
  const [search, setSearch] = useState('');
  const [active, setActive] = useState('new-note');
  const [loop, setLoop] = useState(true);
  const [disableArchive, setDisableArchive] = useState(true);
  const [rtl, setRtl] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [open, setOpen] = useState(false);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  return <div className="component-examples navigation-examples">
    <ComponentPlayground code={`const [active, setActive] = useState(${JSON.stringify(active)});
const [search, setSearch] = useState(${JSON.stringify(search)});
const [selected, setSelected] = useState('');
<div dir="${rtl ? 'rtl' : 'ltr'}" data-inkra-theme="${theme}">
<Command.Root label="Workspace commands" value={active}
  onValueChange={setActive} loop={${loop}}>
  <Command.Input value={search} onValueChange={setSearch} />
  <Command.List>
  <Command.Empty>No matching commands</Command.Empty>
  <Command.Group heading="Workspace">
    <Command.Item value="new-note" keywords={['create']}
      shortcut="⌘N" onSelect={setSelected}>New note</Command.Item>
    <Command.Item value="find-note" keywords={['search']}
      shortcut="⌘F" onSelect={setSelected}>Find note</Command.Item>
  </Command.Group>
  <Command.Separator />
  <Command.Group heading="Settings">
    <Command.Item value="preferences" onSelect={setSelected}>Preferences</Command.Item>
    <Command.Item value="archive" disabled={${disableArchive}} onSelect={setSelected}>Archive workspace</Command.Item>
  </Command.Group>
  </Command.List>
</Command.Root>
<output aria-live="polite">{selected || 'No command executed'}</output>
</div>`} controls={<PropertyTabs groups={[
      { label: '交互', content: <>
        <Switch label={zh ? '循环选择' : 'Loop selection'} checked={loop} onCheckedChange={setLoop} />
        <Button variant="outline" onClick={() => { setSearch(''); setActive('new-note'); }}>{zh ? '重置搜索' : 'Reset search'}</Button>
      </> },
      { label: '状态', content: <>
        <Switch label={zh ? '禁用归档' : 'Disable archive'} checked={disableArchive} onCheckedChange={setDisableArchive} />
        <DocsSelect label={zh ? '预览主题' : 'Preview theme'} value={theme} onValueChange={value => setTheme(value as typeof theme)} options={[["light", zh ? '浅色' : 'Light'], ["dark", zh ? '深色' : 'Dark']]} />
      </> },
      { label: '布局', content: <Switch label="RTL" checked={rtl} onCheckedChange={setRtl} /> },
    ]} />}>
      <div className="navigation-examples__stage navigation-examples__themed" dir={rtl ? 'rtl' : 'ltr'} data-inkra-theme={theme} data-testid="command-playground">
        <Command.Root label={zh ? '工作区命令' : 'Workspace commands'} loop={loop} value={active} onValueChange={setActive}>
          <Command.Input value={search} onValueChange={setSearch} placeholder={zh ? '搜索命令' : 'Search commands'} />
          <Command.List label={zh ? '搜索结果' : 'Search results'}><CommandItems zh={zh} onSelect={setSelected} disabled={disableArchive} /></Command.List>
        </Command.Root>
        <output aria-live="polite">{selected || (zh ? '尚未执行' : 'No command executed')}</output>
        <Overlay.Root open={open} onOpenChange={setOpen}>
          <Overlay.Trigger asChild><Button variant="outline">{zh ? '打开命令面板' : 'Open command palette'}</Button></Overlay.Trigger>
          <Overlay.Portal><Overlay.Backdrop /><Overlay.Content layout="sections" className="navigation-command-overlay" aria-describedby={undefined}>
            <Overlay.Title className="visually-hidden">{zh ? '命令面板' : 'Command palette'}</Overlay.Title>
            <Command.Root surface={false} label={zh ? '面板命令' : 'Palette commands'}>
              <Command.Input placeholder={zh ? '搜索命令' : 'Search commands'} />
              <Command.List label={zh ? '面板结果' : 'Palette results'}><CommandItems zh={zh} onSelect={value => { setSelected(value); setOpen(false); }} /></Command.List>
            </Command.Root>
          </Overlay.Content></Overlay.Portal>
        </Overlay.Root>
      </div>
    </ComponentPlayground>
    <ComponentExample title={zh ? '内嵌命令列表' : 'Inline command list'} code={`const [selected, setSelected] = useState('');
<Command.Root label="Notes">
  <Command.Input placeholder="Search..." />
  <Command.List><Command.Empty>No matches</Command.Empty>
    <Command.Item value="new-note" onSelect={setSelected}>New note</Command.Item>
    <Command.Item value="find-note" onSelect={setSelected}>Find note</Command.Item>
    <Command.Item value="preferences" onSelect={setSelected}>Preferences</Command.Item>
    <Command.Item value="archive" disabled onSelect={setSelected}>Archive workspace</Command.Item>
  </Command.List>
</Command.Root>
<output aria-live="polite">{selected || 'No command executed'}</output>`}>
      <div className="navigation-examples__stage" data-testid="command-basic">
        <Command.Root label={zh ? '笔记命令' : 'Note commands'}>
          <Command.Input placeholder={zh ? '搜索命令' : 'Search commands'} />
          <Command.List label={zh ? '可用命令' : 'Available commands'}><CommandItems zh={zh} onSelect={setSelected} /></Command.List>
        </Command.Root>
        <output aria-live="polite" data-testid="command-result">{selected || (zh ? '尚未执行' : 'No command executed')}</output>
      </div>
    </ComponentExample>
    <ComponentExample title={zh ? '与 Overlay 组合' : 'Compose with Overlay'} code={`const [open, setOpen] = useState(false);
const [selected, setSelected] = useState('');
<Overlay.Root open={open} onOpenChange={setOpen}>
  <Overlay.Trigger asChild><Button>Search actions</Button></Overlay.Trigger>
  <Overlay.Portal><Overlay.Backdrop /><Overlay.Content layout="sections" aria-describedby={undefined}>
    <Overlay.Title style={{ position: 'absolute', width: 1, height: 1, margin: 0,
      overflow: 'hidden', clipPath: 'inset(50%)' }}>Commands</Overlay.Title>
    <Command.Root surface={false} label="Commands">
      <Command.Input placeholder="Search commands" />
      <Command.List><Command.Empty>No matching commands</Command.Empty>
        <Command.Item value="new-note" onSelect={value => { setSelected(value); setOpen(false); }}>New note</Command.Item>
        <Command.Item value="find-note" onSelect={value => { setSelected(value); setOpen(false); }}>Find note</Command.Item>
      </Command.List>
    </Command.Root>
  </Overlay.Content></Overlay.Portal>
</Overlay.Root>
<output aria-live="polite">{selected || 'No command executed'}</output>`}>
      <div className="navigation-examples__stage" data-testid="command-composition">
        <Overlay.Root open={advancedOpen} onOpenChange={setAdvancedOpen}>
          <Overlay.Trigger asChild><Button variant="outline">{zh ? '搜索操作' : 'Search actions'}</Button></Overlay.Trigger>
          <Overlay.Portal><Overlay.Backdrop /><Overlay.Content layout="sections" className="navigation-command-overlay" aria-describedby={undefined}>
            <Overlay.Title className="visually-hidden">{zh ? '操作命令' : 'Actions'}</Overlay.Title>
            <Command.Root surface={false} label={zh ? '操作命令' : 'Actions'}>
              <Command.Input placeholder={zh ? '搜索命令' : 'Search commands'} />
              <Command.List><Command.Empty>{zh ? '没有匹配的命令' : 'No matching commands'}</Command.Empty>
                <Command.Item value="new-note" keywords={[zh ? '新建笔记' : 'New note']} onSelect={value => { setSelected(value); setAdvancedOpen(false); }}>{zh ? '新建笔记' : 'New note'}</Command.Item>
                <Command.Item value="find-note" keywords={[zh ? '查找笔记' : 'Find note']} onSelect={value => { setSelected(value); setAdvancedOpen(false); }}>{zh ? '查找笔记' : 'Find note'}</Command.Item>
              </Command.List>
            </Command.Root>
          </Overlay.Content></Overlay.Portal>
        </Overlay.Root>
        <output aria-live="polite">{selected || (zh ? '尚未执行' : 'No command executed')}</output>
      </div>
    </ComponentExample>
  </div>;
}

export const navigationDocs: Record<string, ExpansionDoc> = {
  pagination: {
    name: 'Pagination',
    intro: { zh: '还有下一页，至少这次不用猜要滑多久。', en: 'There is more. At least you know where this page ends.' },
    api: [
      ['totalPages', 'Page count, not item count; zero/nonfinite totals have no page buttons'],
      ['page / defaultPage / onPageChange', '1-based controlled or uncontrolled page; total changes clamp without emitting a user callback'],
      ['siblingCount / boundaryCount', '0..3, default 1; omitted ranges use noninteractive ellipses'],
      ['showFirstLast / disabled / size', 'boolean / boolean / sm | md | lg'],
      ['simple', 'boolean = false', '用当前页 / 总页数替代页码列表；保留已启用的翻页操作。空结果显示 0 / 0。', 'Replace page buttons with current / total while retaining enabled navigation controls. Empty results show 0 / 0.'],
      ['showPreviousNext', 'boolean = true', '显示上一页和下一页，不影响独立的首尾页开关。', 'Show previous and next controls independently of first/last controls.'],
      ['hideOnSinglePage', 'boolean = false', '总页数不超过 1 时不渲染导航，不触发页码变化回调。', 'Render no navigation when total pages is at most one, without emitting a page-change callback.'],
      ['renderPage', '(page, { isCurrent }) => ReactNode', '自定义页码按钮内的非交互内容；不改变按钮语义，名称仍由 labels.page 提供。', 'Customize non-interactive page button content. Button semantics and labels.page naming remain intact.'],
      ['renderSummary', '(page, totalPages) => ReactNode', '简洁模式下自定义非交互摘要，接收规范化页码。', 'Customize the non-interactive simple-mode summary with normalized page numbers.'],
      ['labels', 'Partial<PaginationLabels>; localize nav, first, previous, next, last, page(number), ellipsis'],
    ],
    a11y: { zh: 'nav 内的原生按钮通过 Tab、Enter、Space 操作，当前页带 aria-current="page"。省略符不可交互。此组件只支持数据翻页按钮，不提供链接导航。', en: 'Native buttons inside nav support Tab, Enter, and Space; the current page has aria-current="page". Ellipses are noninteractive. This component supports data pagination buttons, not link navigation.' },
    Examples: PaginationExamples,
  },
  command: {
    name: 'Command',
    intro: { zh: '菜单藏得再深，也躲不过我打字搜。', en: 'Somewhere in a menu? I will just type it.' },
    api: [['Command.Root', 'cmdk value/defaultValue/onValueChange, filter, shouldFilter, loop (default true), label'], ['Command.Root.surface', 'boolean = true', '是否绘制独立纸面与描边；嵌入已有弹窗纸面时设为 false，避免重复边框。', 'Draw the standalone paper and outline; set false inside an existing dialog surface to avoid duplicate frames.'], ['Command.Input', 'Search value/onValueChange and native input attributes'], ['Command.List / Group', 'List label; Group heading/value/forceMount'], ['Command.Item', 'Stable value, keywords, disabled, onSelect(value), icon, shortcut'], ['Command.Empty / Separator / Shortcut', 'No-results content; separator alwaysRender; display-only kbd']],
    a11y: { zh: 'cmdk 负责 combobox/listbox 关联、方向键、Home/End、禁用项跳过与 Enter 选择。IME 组合输入不会提交命令。为 Root 提供本地化 label；Overlay 负责焦点约束、Escape 与返回。快捷键提示不自动注册全局按键。', en: 'cmdk owns combobox/listbox relationships, arrows, Home/End, disabled-item skipping, and Enter selection. IME composition does not submit a command. Provide a localized Root label; Overlay handles focus trapping, Escape, and return. Shortcut hints do not register global keys.' },
    Examples: CommandExamples,
  },
};
