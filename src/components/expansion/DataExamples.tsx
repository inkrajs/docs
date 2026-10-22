import { useMemo, useState, type ReactNode } from 'react';
import {
  DataTable,
  PencilIcon,
  Switch,
  Tree,
  type DataTableColumnDef,
  type DataTablePaginationState,
  type TreeKey,
  type TreeSelection,
} from '@inkra/react';

import { useLocale } from '../../i18n';
import { ComponentExample } from '../ComponentExample';
import { ComponentPlayground } from '../ComponentPlayground';
import { DocsSelect } from '../DocsSelect';
import { PropertyTabs } from '../PropertyTabs';
import type { ExpansionDoc } from './types';
import './DataExamples.css';

interface NoteRow {
  id: string;
  name: string;
  status: string;
  items: number;
}

// Lucide Folder and FolderOpen geometry, rendered by the shared pencil engine.
const folderIcon = [{ d: 'M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z' }] as const;
const folderOpenIcon = [{ d: 'm6 14 1.5-2.9A2 2 0 0 1 9.24 10H20a2 2 0 0 1 1.94 2.5l-1.54 6a2 2 0 0 1-1.95 1.5H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3.9a2 2 0 0 1 1.69.9l.81 1.2a2 2 0 0 0 1.67.9H18a2 2 0 0 1 2 2v2' }] as const;
const fileIcon = [{ d: 'M 6 3 L 15 3 L 20 8 L 20 21 L 6 21 Z M 15 3 L 15 8 L 20 8' }] as const;

function DataTableExamples() {
  const { locale } = useLocale();
  const zh = locale === 'zh-CN';
  const text = zh ? {
    basic: '基础数据表', playground: '筛选、选择与分页', caption: '创作笔记', name: '名称', status: '状态', items: '条目',
    filter: '筛选笔记', filterPlaceholder: '输入名称或状态', empty: '没有匹配的笔记', loading: '正在读取笔记',
    selectable: '允许选择', disableRows: '禁用所有行', filterable: '显示筛选', pagination: '显示分页', loadingToggle: '加载状态', emptyToggle: '空数据',
    density: '密度', comfortable: '舒适', compact: '紧凑', pageSize: '每页行数', selectAll: '选择本页所有笔记',
    previous: '上一页', next: '下一页', page: (page: number, count: number) => `第 ${page} / ${count} 页`,
    selected: (name: string) => `选择 ${name}`,
  } : {
    basic: 'Basic data table', playground: 'Filtering, selection and pagination', caption: 'Creative notes', name: 'Name', status: 'Status', items: 'Items',
    filter: 'Filter notes', filterPlaceholder: 'Type a name or status', empty: 'No matching notes', loading: 'Loading notes',
    selectable: 'Selectable rows', disableRows: 'Disable every row', filterable: 'Show filter', pagination: 'Show pagination', loadingToggle: 'Loading state', emptyToggle: 'Empty data',
    density: 'Density', comfortable: 'Comfortable', compact: 'Compact', pageSize: 'Rows per page', selectAll: 'Select every note on this page',
    previous: 'Previous page', next: 'Next page', page: (page: number, count: number) => `Page ${page} of ${count}`,
    selected: (name: string) => `Select ${name}`,
  };
  const rows = useMemo<NoteRow[]>(() => zh ? [
    { id: 'ideas', name: '灵感笔记', status: '草稿', items: 6 },
    { id: 'design', name: '设计清单', status: '已完成', items: 12 },
    { id: 'journal', name: '创作记录', status: '进行中', items: 3 },
    { id: 'review', name: '评审反馈', status: '待确认', items: 8 },
    { id: 'assets', name: '素材列表', status: '进行中', items: 5 },
  ] : [
    { id: 'ideas', name: 'Idea notes', status: 'Draft', items: 6 },
    { id: 'design', name: 'Design checklist', status: 'Complete', items: 12 },
    { id: 'journal', name: 'Creative journal', status: 'In progress', items: 3 },
    { id: 'review', name: 'Review feedback', status: 'In review', items: 8 },
    { id: 'assets', name: 'Asset list', status: 'In progress', items: 5 },
  ], [zh]);
  const columns = useMemo<DataTableColumnDef<NoteRow>[]>(() => [
    { accessorKey: 'name', header: text.name },
    { accessorKey: 'status', header: text.status },
    { accessorKey: 'items', header: text.items },
  ], [text.name, text.status, text.items]);
  const [density, setDensity] = useState<'compact' | 'comfortable'>('comfortable');
  const [filterable, setFilterable] = useState(true);
  const [selectable, setSelectable] = useState(true);
  const [disableRows, setDisableRows] = useState(false);
  const [pagination, setPagination] = useState(true);
  const [loading, setLoading] = useState(false);
  const [empty, setEmpty] = useState(false);
  const [pageState, setPageState] = useState<DataTablePaginationState>({ pageIndex: 0, pageSize: 3 });
  const basicRows = rows.slice(0, 3).map(({ id, name, status }) => ({ id, name, status }));
  const basicCode = `const notes = ${JSON.stringify(basicRows, null, 2)};

type Note = (typeof notes)[number];
const columns: DataTableColumnDef<Note>[] = [
  { accessorKey: 'name', header: '${text.name}' },
  { accessorKey: 'status', header: '${text.status}' },
];

<DataTable
  data={notes}
  columns={columns}
  getRowId={row => row.id}
  caption="${text.caption}"
/>`;
  const code = `const [paginationState, setPaginationState] = useState<DataTablePaginationState>(${JSON.stringify(pageState)});

<DataTable
  data={${empty ? '[]' : 'notes'}}
  columns={columns}
  getRowId={row => row.id}
  density="${density}"
  filterable={${filterable}}
  selectable={${selectable}}
  getRowCanSelect={() => ${!disableRows}}
  pagination={${pagination}}
  paginationState={paginationState}
  onPaginationChange={updater =>
    setPaginationState(current =>
      typeof updater === 'function' ? updater(current) : updater
    )
  }
  loading={${loading}}
  emptyMessage="${text.empty}"
/>`;

  return <div className="data-examples">
    <ComponentPlayground code={code} controls={<PropertyTabs groups={[
      { label: '基础', content: <>
        <DocsSelect label={text.density} value={density} onValueChange={value => setDensity(value as typeof density)} options={[["comfortable", text.comfortable], ["compact", text.compact]]} />
        <DocsSelect label={text.pageSize} value={String(pageState.pageSize)} onValueChange={value => setPageState({ pageIndex: 0, pageSize: Number(value) })} options={[["2", "2"], ["3", "3"], ["5", "5"]]} />
      </> },
      { label: '交互', content: <>
        <Switch label={text.filterable} checked={filterable} onCheckedChange={setFilterable} />
        <Switch label={text.selectable} checked={selectable} onCheckedChange={setSelectable} />
        <Switch label={text.disableRows} checked={disableRows} onCheckedChange={setDisableRows} />
        <Switch label={text.pagination} checked={pagination} onCheckedChange={setPagination} />
      </> },
      { label: '状态', content: <>
        <Switch label={text.loadingToggle} checked={loading} onCheckedChange={setLoading} />
        <Switch label={text.emptyToggle} checked={empty} onCheckedChange={setEmpty} />
      </> },
    ]} />}>
      <DataTable
        className="data-demo-table data-demo-width"
        data={empty ? [] : rows}
        columns={columns}
        getRowId={row => row.id}
        caption={text.caption}
        density={density}
        filterable={filterable}
        filterLabel={text.filter}
        filterPlaceholder={text.filterPlaceholder}
        selectable={selectable}
        getRowCanSelect={() => !disableRows}
        pagination={pagination}
        paginationState={pageState}
        onPaginationChange={updater => setPageState(current => typeof updater === 'function' ? updater(current) : updater)}
        loading={loading}
        loadingMessage={text.loading}
        emptyMessage={text.empty}
        selectAllLabel={text.selectAll}
        selectRowLabel={row => text.selected(row.original.name)}
        previousPageLabel={text.previous}
        nextPageLabel={text.next}
        paginationLabel={text.playground}
        pageLabel={text.page}
        sortStatusLabel={(column, direction) => zh ? `${column}：${direction === 'asc' ? '升序' : direction === 'desc' ? '降序' : '未排序'}` : `${column}: ${direction === 'asc' ? 'ascending' : direction === 'desc' ? 'descending' : 'not sorted'}`}
      />
    </ComponentPlayground>
    <ComponentExample title={text.basic} code={basicCode}>
      <DataTable className="data-demo-table data-demo-width" data={rows.slice(0, 3)} columns={columns.slice(0, 2)} getRowId={row => row.id} caption={text.caption} />
    </ComponentExample>
  </div>;
}

function TreeExamples() {
  const { locale } = useLocale();
  const zh = locale === 'zh-CN';
  const text = zh ? {
    basic: '嵌套目录', playground: '受控展开与选择', label: '项目目录', workspace: '工作区', workspaceDescription: '当前项目文件',
    drafts: '草稿', draftsDescription: '仍在整理的想法', published: '已发布', archive: '归档', archiveDescription: '只读历史记录',
    assets: '素材', images: '图片', selectionMode: '选择模式', none: '无', single: '单选', multiple: '多选',
    disableArchive: '禁用归档', selected: '已选择', nothing: '无', expand: '展开项目', collapse: '折叠项目',
  } : {
    basic: 'Nested folders', playground: 'Controlled expansion and selection', label: 'Project folders', workspace: 'Workspace', workspaceDescription: 'Files in the current project',
    drafts: 'Drafts', draftsDescription: 'Ideas still being organized', published: 'Published', archive: 'Archive', archiveDescription: 'Read-only history',
    assets: 'Assets', images: 'Images', selectionMode: 'Selection mode', none: 'None', single: 'Single', multiple: 'Multiple',
    disableArchive: 'Disable archive', selected: 'Selected', nothing: 'None', expand: 'Expand item', collapse: 'Collapse item',
  };
  const [selectionMode, setSelectionMode] = useState<'none' | 'single' | 'multiple'>('multiple');
  const [selectedKeys, setSelectedKeys] = useState<TreeSelection>(new Set<TreeKey>(['drafts']));
  const [expandedKeys, setExpandedKeys] = useState<Set<TreeKey>>(new Set<TreeKey>(['workspace', 'assets']));
  const [disableArchive, setDisableArchive] = useState(true);
  const [disclosureStyle, setDisclosureStyle] = useState<'folder' | 'chevron'>('folder');
  const selectedText = selectedKeys === 'all' ? '*' : [...selectedKeys].map(String).join(', ') || text.nothing;
  const selectedKeysCode = selectedKeys === 'all' ? "'all'" : `new Set<TreeKey>(${JSON.stringify([...selectedKeys])})`;
  const expandedKeysCode = `new Set<TreeKey>(${JSON.stringify([...expandedKeys])})`;
  const icon = (paths: readonly { d: string }[], seed: string) => <PencilIcon paths={paths} size={22} sourceSize={24} seed={seed} />;
  const itemContent = (title: string, description: string | undefined, itemIcon: ReactNode, branch = false) => <Tree.ItemContent
    icon={branch && disclosureStyle === 'folder' ? undefined : itemIcon}
    disclosureIcon={branch && disclosureStyle === 'folder' ? ({ isExpanded }) => <span data-folder-state={isExpanded ? 'open' : 'closed'}>{icon(isExpanded ? folderOpenIcon : folderIcon, title)}</span> : undefined}
    expandLabel={text.expand} collapseLabel={text.collapse}>
    <Tree.ItemTitle>{title}</Tree.ItemTitle>
    {description && <Tree.ItemDescription>{description}</Tree.ItemDescription>}
  </Tree.ItemContent>;
  const iconCode = `const folderIcon = ${JSON.stringify(folderIcon)};
const folderOpenIcon = ${JSON.stringify(folderOpenIcon)};
`;
  const branchProps = disclosureStyle === 'folder'
    ? ' disclosureIcon={({ isExpanded }) => <PencilIcon paths={isExpanded ? folderOpenIcon : folderIcon} size={22} sourceSize={24} />}'
    : ' icon={<PencilIcon paths={folderIcon} size={22} sourceSize={24} />}';
  const basicCode = `${iconCode}
<Tree.Root aria-label="${text.label}" defaultExpandedKeys={['workspace']} defaultSelectedKeys={['drafts']}>
  <Tree.Item id="workspace" textValue="${text.workspace}">
    <Tree.ItemContent${branchProps}>
      <Tree.ItemTitle>${text.workspace}</Tree.ItemTitle>
      <Tree.ItemDescription>${text.workspaceDescription}</Tree.ItemDescription>
    </Tree.ItemContent>
    <Tree.Item id="drafts" textValue="${text.drafts}">
      <Tree.ItemContent><Tree.ItemTitle>${text.drafts}</Tree.ItemTitle></Tree.ItemContent>
    </Tree.Item>
    <Tree.Item id="published" textValue="${text.published}">
      <Tree.ItemContent><Tree.ItemTitle>${text.published}</Tree.ItemTitle></Tree.ItemContent>
    </Tree.Item>
  </Tree.Item>
</Tree.Root>`;
  const code = `${iconCode}
const [expandedKeys, setExpandedKeys] = useState<Set<TreeKey>>(${expandedKeysCode});
const [selectedKeys, setSelectedKeys] = useState<TreeSelection>(${selectedKeysCode});

<Tree.Root
  aria-label="${text.label}"
  selectionMode="${selectionMode}"
  expandedKeys={expandedKeys}
  onExpandedChange={setExpandedKeys}
  selectedKeys={selectedKeys}
  onSelectionChange={setSelectedKeys}
  disabledKeys={${disableArchive ? "['archive']" : '[]'}}
>
  <Tree.Item id="workspace" textValue="${text.workspace}">
    <Tree.ItemContent${branchProps}>
      <Tree.ItemTitle>${text.workspace}</Tree.ItemTitle>
      <Tree.ItemDescription>${text.workspaceDescription}</Tree.ItemDescription>
    </Tree.ItemContent>
    <Tree.Item id="drafts" textValue="${text.drafts}">
      <Tree.ItemContent>
        <Tree.ItemTitle>${text.drafts}</Tree.ItemTitle>
        <Tree.ItemDescription>${text.draftsDescription}</Tree.ItemDescription>
      </Tree.ItemContent>
    </Tree.Item>
    <Tree.Item id="published" textValue="${text.published}">
      <Tree.ItemContent><Tree.ItemTitle>${text.published}</Tree.ItemTitle></Tree.ItemContent>
    </Tree.Item>
    <Tree.Item id="archive" textValue="${text.archive}">
      <Tree.ItemContent>
        <Tree.ItemTitle>${text.archive}</Tree.ItemTitle>
        <Tree.ItemDescription>${text.archiveDescription}</Tree.ItemDescription>
      </Tree.ItemContent>
    </Tree.Item>
  </Tree.Item>
  <Tree.Item id="assets" textValue="${text.assets}">
    <Tree.ItemContent${branchProps}><Tree.ItemTitle>${text.assets}</Tree.ItemTitle></Tree.ItemContent>
    <Tree.Item id="images" textValue="${text.images}">
      <Tree.ItemContent><Tree.ItemTitle>${text.images}</Tree.ItemTitle></Tree.ItemContent>
    </Tree.Item>
  </Tree.Item>
</Tree.Root>`;

  return <div className="data-examples data-examples--tree">
    <ComponentPlayground code={code} controls={<PropertyTabs groups={[
      { label: '交互', content: <>
        <DocsSelect label={text.selectionMode} value={selectionMode} onValueChange={value => setSelectionMode(value as typeof selectionMode)} options={[["none", text.none], ["single", text.single], ["multiple", text.multiple]]} />
        <DocsSelect label={zh ? '展开图标' : 'Disclosure icon'} value={disclosureStyle} onValueChange={value => setDisclosureStyle(value as typeof disclosureStyle)}
          options={[['folder', zh ? '文件夹' : 'Folder'], ['chevron', zh ? '箭头' : 'Chevron']]} />
      </> },
      { label: '状态', content: <Switch label={text.disableArchive} checked={disableArchive} onCheckedChange={setDisableArchive} /> },
    ]} />}>
      <div className="data-demo-tree-wrap">
        <Tree.Root
          className="data-demo-tree"
          aria-label={text.label}
          selectionMode={selectionMode}
          selectedKeys={selectedKeys}
          onSelectionChange={setSelectedKeys}
          expandedKeys={expandedKeys}
          onExpandedChange={setExpandedKeys}
          disabledKeys={disableArchive ? ['archive'] : []}
        >
          <Tree.Item id="workspace" textValue={text.workspace}>
            {itemContent(text.workspace, text.workspaceDescription, icon(folderIcon, 'workspace'), true)}
            <Tree.Item id="drafts" textValue={text.drafts}>{itemContent(text.drafts, text.draftsDescription, icon(fileIcon, 'drafts'))}</Tree.Item>
            <Tree.Item id="published" textValue={text.published}>{itemContent(text.published, undefined, icon(fileIcon, 'published'))}</Tree.Item>
            <Tree.Item id="archive" textValue={text.archive}>{itemContent(text.archive, text.archiveDescription, icon(folderIcon, 'archive'))}</Tree.Item>
          </Tree.Item>
          <Tree.Item id="assets" textValue={text.assets}>
            {itemContent(text.assets, undefined, icon(folderIcon, 'assets'), true)}
            <Tree.Item id="images" textValue={text.images}>{itemContent(text.images, undefined, icon(fileIcon, 'images'))}</Tree.Item>
          </Tree.Item>
        </Tree.Root>
        <output className="data-demo-output" aria-live="polite">{text.selected}: {selectedText}</output>
      </div>
    </ComponentPlayground>
    <ComponentExample title={text.basic} code={basicCode}>
      <Tree.Root className="data-demo-tree" aria-label={text.label} defaultExpandedKeys={['workspace']} defaultSelectedKeys={['drafts']}>
        <Tree.Item id="workspace" textValue={text.workspace}>
          {itemContent(text.workspace, text.workspaceDescription, icon(folderIcon, 'basic-workspace'), true)}
          <Tree.Item id="drafts" textValue={text.drafts}>{itemContent(text.drafts, undefined, icon(fileIcon, 'basic-drafts'))}</Tree.Item>
          <Tree.Item id="published" textValue={text.published}>{itemContent(text.published, undefined, icon(fileIcon, 'basic-published'))}</Tree.Item>
        </Tree.Item>
      </Tree.Root>
    </ComponentExample>
  </div>;
}

export const dataDocs: Record<string, ExpansionDoc> = {
  'data-table': {
    name: 'DataTable',
    intro: {
      zh: '表格一加筛选和排序，班味就上来了。',
      en: 'Add filters and sorting. Congratulations, it is a workday.',
    },
    api: [
      ['data / columns', 'TData[] / DataTableColumnDef<TData>[]'],
      ['getRowId', '(row, index, parent?) => string; required stable identity'],
      ['sorting / onSortingChange', 'controlled TanStack SortingState and updater'],
      ['globalFilter / onGlobalFilterChange', 'controlled filter text; defaultGlobalFilter for uncontrolled use'],
      ['pagination / paginationState', 'opt-in client pagination with controlled or default state'],
      ['selectable / rowSelection', 'real checkbox selection with controlled or default state'],
      ['loading / emptyMessage', 'semantic loading row and honest empty result'],
    ],
    a11y: {
      zh: '保留 table、caption、th、td 语义；排序按钮写入 aria-sort，选择使用真实复选框，分页按钮有本地化名称。当前不包含虚拟化、行内编辑或服务端传输。',
      en: 'Preserves table, caption, th and td semantics. Sort buttons update aria-sort, selection uses real checkboxes, and pagination controls are named. Virtualization, inline editing and server transport are not included.',
    },
    Examples: DataTableExamples,
  },
  tree: {
    name: 'Tree',
    intro: {
      zh: '文件夹套文件夹，禁止套娃？这里不禁止。',
      en: 'A folder inside a folder inside a folder. Yes, keep going.',
    },
    api: [
      ['Tree.Root', 'selectionMode, selectedKeys, expandedKeys, disabledKeys and matching default/onChange props'],
      ['Tree.Item', 'stable id, required textValue, isDisabled and nested Tree.Item children'],
      ['Tree.ItemContent', 'disclosure, indentation, optional icon, localized expand/collapse labels'],
      ['Tree.ItemContent.disclosureIcon', 'ReactNode | (state: TreeItemContentState) => ReactNode', '替换展开图标；根据 isExpanded 显示打开或关闭的文件夹。不传时使用无外框箭头。', 'Replace the disclosure icon; use isExpanded to switch open/closed folders. Defaults to an unframed chevron.'],
      ['Tree.ItemContent.icon', 'ReactNode | (state: TreeItemContentState) => ReactNode', '可选的行图标，也可读取展开、选择、禁用与子项状态。用文件夹作为展开图标时可以省略，避免重复。', 'Optional row icon, with expansion, selection, disabled and child state. Omit it when the folder already serves as the disclosure icon.'],
      ['Tree.ItemTitle / Description', 'visible selectable text slots'],
    ],
    a11y: {
      zh: '方向键、Home/End、展开折叠、单选/多选与禁用项由 React Aria 管理；展开按钮是真实按钮。RTL 使用逻辑缩进，强制颜色和减少动态效果保留状态。当前不支持拖放。',
      en: 'React Aria owns arrow, Home/End, expansion, single/multiple selection and disabled behavior, with a real disclosure button. Logical indentation supports RTL, and forced colors/reduced motion preserve state. Drag and drop is not included.',
    },
    Examples: TreeExamples,
  },
};
