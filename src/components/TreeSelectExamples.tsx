import { useState } from 'react';
import {
  Button,
  Field,
  PencilText,
  Switch,
  TreeSelect,
  type TreeSelectBranchSelection,
  type TreeSelectNode,
  type TreeSelectSelectionPropagation,
} from '@inkra/react';

import { useLocale } from '../i18n';
import { ComponentExample } from './ComponentExample';
import { ComponentPlayground } from './ComponentPlayground';
import { DocsSelect } from './DocsSelect';
import { PropertyTabs } from './PropertyTabs';
import './TreeSelectExamples.css';

export function TreeSelectExamples() {
  const { locale } = useLocale();
  const zh = locale === 'zh-CN';
  const text = (chinese: string, english: string) => zh ? chinese : english;
  const [mode, setMode] = useState<'single' | 'multiple'>('single');
  const [branchSelection, setBranchSelection] = useState<TreeSelectBranchSelection>('leaf');
  const [selectionPropagation, setSelectionPropagation] = useState<TreeSelectSelectionPropagation>('none');
  const [singleValue, setSingleValue] = useState<string | null>('wireframes');
  const [multipleValue, setMultipleValue] = useState<string[]>(['wireframes', 'web']);
  const [disabled, setDisabled] = useState(false);
  const [readOnly, setReadOnly] = useState(false);
  const [invalid, setInvalid] = useState(false);
  const [size, setSize] = useState<'sm' | 'md' | 'lg'>('md');
  const [dir, setDir] = useState<'ltr' | 'rtl'>('ltr');
  const [clearable, setClearable] = useState(true);
  const [customLabels, setCustomLabels] = useState(false);
  const items: TreeSelectNode[] = [
    {
      id: 'design',
      label: text('设计', 'Design'),
      keywords: 'design ux',
      children: [
        { id: 'wireframes', label: text('线框稿', 'Wireframes'), description: text('早期页面结构', 'Early page structure') },
        { id: 'research', label: text('用户研究', 'User research'), disabled: true },
      ],
    },
    {
      id: 'engineering',
      label: text('工程', 'Engineering'),
      keywords: 'code development',
      children: [
        { id: 'web', label: text('网页端', 'Web') },
        { id: 'api', label: 'API' },
      ],
    },
    { id: 'archive', label: text('归档', 'Archive') },
  ];
  const shared = {
    items,
    branchSelection,
    selectionPropagation,
    disabled,
    readOnly,
    invalid,
    size,
    dir,
    clearable,
    placeholder: text('选择工作区', 'Choose workspaces'),
    searchPlaceholder: text('搜索树节点', 'Search tree nodes'),
    emptyContent: text('没有匹配的节点', 'No matching nodes'),
    clearLabel: text('清空树选择', 'Clear tree selection'),
    treeLabel: text('工作区树', 'Workspace tree'),
    expandLabel: text('展开节点', 'Expand node'),
    collapseLabel: text('折叠节点', 'Collapse node'),
    defaultExpandedIds: ['design', 'engineering'],
    renderLabel: customLabels ? (node: TreeSelectNode) => <span className="tree-select-demo__label">
      <PencilText>{node.label}</PencilText><span className="tree-select-demo__id">{node.id}</span>
    </span> : undefined,
  };
  const code = `const [value, setValue] = useState(${JSON.stringify(mode === 'multiple' ? multipleValue : singleValue)});

<Field label=${JSON.stringify(text('工作区', 'Workspace'))}>
  <TreeSelect${mode === 'multiple' ? ' multiple' : ''}
    items={workspaceTree}
    value={value}
    onValueChange={setValue}
    branchSelection="${branchSelection}"
    selectionPropagation="${selectionPropagation}"
    size="${size}"
    dir="${dir}"
    defaultExpandedIds={['design', 'engineering']}
    placeholder=${JSON.stringify(text('选择工作区', 'Choose workspaces'))}
    searchPlaceholder=${JSON.stringify(text('搜索树节点', 'Search tree nodes'))}
    clearLabel=${JSON.stringify(text('清空树选择', 'Clear tree selection'))}
    treeLabel=${JSON.stringify(text('工作区树', 'Workspace tree'))}
    expandLabel=${JSON.stringify(text('展开节点', 'Expand node'))}
    collapseLabel=${JSON.stringify(text('折叠节点', 'Collapse node'))}
    clearable={${clearable}}
    readOnly={${readOnly}}
    invalid={${invalid}}
    disabled={${disabled}}${customLabels ? `
    renderLabel={node => <CustomNodeLabel node={node} />}` : ''}
  />
</Field>`;

  return <div className="tree-select-examples">
    <ComponentPlayground code={code} controls={<PropertyTabs groups={[
      { label: text('基础', 'Basics'), content: <>
        <DocsSelect label={text('尺寸', 'Size')} value={size} onValueChange={value => setSize(value as typeof size)} options={[
          ['sm', text('小', 'Small')], ['md', text('中', 'Medium')], ['lg', text('大', 'Large')],
        ]} />
        <DocsSelect label={text('阅读方向', 'Direction')} value={dir} onValueChange={value => setDir(value as typeof dir)} options={[
          ['ltr', 'LTR'], ['rtl', 'RTL'],
        ]} />
        <DocsSelect label={text('选择模式', 'Selection mode')} value={mode} onValueChange={value => setMode(value as typeof mode)} options={[
          ['single', text('单选', 'Single')],
          ['multiple', text('多选', 'Multiple')],
        ]} />
        <DocsSelect label={text('分支选择', 'Branch selection')} value={branchSelection} onValueChange={value => setBranchSelection(value as TreeSelectBranchSelection)} options={[
          ['leaf', text('仅叶节点', 'Leaves only')],
          ['all', text('分支与叶节点', 'Branches and leaves')],
        ]} />
        <DocsSelect label={text('父子联动', 'Selection propagation')} value={selectionPropagation} disabled={mode === 'single'} onValueChange={value => setSelectionPropagation(value as TreeSelectSelectionPropagation)} options={[
          ['none', text('独立选择', 'Independent')],
          ['down', text('向下联动', 'Downward')],
          ['both', text('双向联动', 'Bidirectional')],
        ]} />
      </> },
      { label: text('内容', 'Content'), content: <>
        <Switch label={text('自定义节点标签', 'Custom node labels')} checked={customLabels} onCheckedChange={setCustomLabels} />
        <Switch label={text('允许清空', 'Clearable')} checked={clearable} onCheckedChange={setClearable} />
      </> },
      { label: text('状态', 'State'), content: <>
        <Switch label={text('禁用', 'Disabled')} checked={disabled} onCheckedChange={setDisabled} />
        <Switch label={text('只读', 'Read only')} checked={readOnly} onCheckedChange={setReadOnly} />
        <Switch label={text('错误状态', 'Invalid')} checked={invalid} onCheckedChange={setInvalid} />
      </> },
    ]} /> }>
      <div className="tree-select-demo">
        <Field
          label={text('工作区', 'Workspace')}
        >
          {mode === 'multiple' ? <TreeSelect
            {...shared}
            multiple
            name="workspace"
            onValueChange={setMultipleValue}
            value={multipleValue}
          /> : <TreeSelect
            {...shared}
            name="workspace"
            onValueChange={setSingleValue}
            value={singleValue}
          />}
        </Field>
      </div>
    </ComponentPlayground>

    <ComponentExample title={text('非受控表单与自定义值标签', 'Uncontrolled form and custom value label')} code={`<form>
  <Field label=${JSON.stringify(text('发布位置', 'Publish location'))}>
    <TreeSelect
      items={workspaceTree}
      name="location"
      defaultValue="web"
      placeholder=${JSON.stringify(text('选择发布位置', 'Choose publish location'))}
      searchPlaceholder=${JSON.stringify(text('搜索发布位置', 'Search publish locations'))}
      clearLabel=${JSON.stringify(text('清空树选择', 'Clear tree selection'))}
      treeLabel=${JSON.stringify(text('发布位置树', 'Publish location tree'))}
      expandLabel=${JSON.stringify(text('展开节点', 'Expand node'))}
      collapseLabel=${JSON.stringify(text('折叠节点', 'Collapse node'))}
      renderValue={nodes => nodes[0] ? <strong>{nodes[0].label}</strong> : null}
    />
  </Field>
  <Button type="reset" variant="secondary">${text('重置', 'Reset')}</Button>
</form>`}>
      <form className="tree-select-demo tree-select-demo--form">
        <Field label={text('发布位置', 'Publish location')}>
          <TreeSelect
            defaultExpandedIds={['engineering']}
            defaultValue="web"
            items={items}
            name="location"
            placeholder={text('选择发布位置', 'Choose publish location')}
            clearLabel={text('清空树选择', 'Clear tree selection')}
            expandLabel={text('展开节点', 'Expand node')}
            collapseLabel={text('折叠节点', 'Collapse node')}
            renderValue={nodes => nodes[0] ? <span className="tree-select-demo__value-label"><PencilText>{nodes[0].label}</PencilText></span> : null}
            searchPlaceholder={text('搜索发布位置', 'Search publish locations')}
            treeLabel={text('发布位置树', 'Publish location tree')}
          />
        </Field>
        <Button type="reset" variant="secondary">{text('重置', 'Reset')}</Button>
      </form>
    </ComponentExample>
  </div>;
}
