import { useEffect, useState } from 'react';
import { Editable, Field, Switch, Textarea, type EditableBlurBehavior, type EditableEditorType } from '@inkra/react';

import { useLocale } from '../i18n';
import { ComponentExample } from './ComponentExample';
import { ComponentPlayground } from './ComponentPlayground';
import { DocsSelect } from './DocsSelect';
import { PropertyTabs } from './PropertyTabs';
import './EditableExamples.css';

export function EditableExamples() {
  const { locale } = useLocale();
  const zh = locale === 'zh-CN';
  const [value, setValue] = useState(zh ? '点击编辑标题' : 'Click to edit this title');
  const [editing, setEditing] = useState(false);
  const [editorType, setEditorType] = useState<EditableEditorType>('input');
  const [selectMode, setSelectMode] = useState<'dropdown' | 'searchable' | 'stepper'>('dropdown');
  const [status, setStatus] = useState('draft');
  const [blurBehavior, setBlurBehavior] = useState<EditableBlurBehavior>('ignore');
  const [validate, setValidate] = useState(false);
  const [customNote, setCustomNote] = useState(zh ? '保留一个简短备注。' : 'Keep a short note.');
  const [memberName, setMemberName] = useState(zh ? '林墨' : 'Alex Lin');
  const startEditingLabel = zh ? '编辑项目标题' : 'Edit project title';
  const saveLabel = zh ? '保存标题' : 'Save title';
  const cancelLabel = zh ? '取消编辑' : 'Cancel editing';
  const placeholder = zh ? '输入项目标题' : 'Enter a project title';
  const items = [
    { value: 'draft', label: zh ? '草稿' : 'Draft' },
    { value: 'review', label: zh ? '待审核' : 'In review' },
    { value: 'published', label: zh ? '已发布' : 'Published' },
    { value: 'archived', label: zh ? '已归档' : 'Archived', disabled: true },
  ];
  useEffect(() => {
    setValue(zh ? '点击编辑标题' : 'Click to edit this title');
    setCustomNote(zh ? '保留一个简短备注。' : 'Keep a short note.');
    setMemberName(zh ? '林墨' : 'Alex Lin');
    setEditing(false);
  }, [zh]);
  const code = `const [value, setValue] = useState(${JSON.stringify(editorType === 'select' ? status : value)});
const [editing, setEditing] = useState(false);
${editorType === 'select' ? `const items = ${JSON.stringify(items, null, 2)};\n` : ''}
<Editable
  value={value}
  editing={editing}
  editorType="${editorType}"
  ${editorType === 'select' ? `selectProps={{ items, mode: '${selectMode}' }}` : ''}
  blurBehavior="${blurBehavior}"
  onEditingChange={setEditing}
  onValueChange={setValue}
  startEditingLabel="${startEditingLabel}"
  saveLabel="${saveLabel}"
  cancelLabel="${cancelLabel}"
  placeholder="${placeholder}"
  validate={value => !${validate} || value.trim() ? undefined : '${zh ? '请输入内容' : 'Enter a value'}'}
/>`;

  return <div className="component-examples editable-examples">
    <ComponentPlayground code={code} controls={<PropertyTabs groups={[
      { label: zh ? '交互' : 'Interaction', content: <>
        <DocsSelect label={zh ? '编辑器' : 'Editor'} value={editorType} onValueChange={next => { setEditing(false); setEditorType(next as EditableEditorType); }}
          options={[['input', zh ? '单行输入' : 'Input'], ['textarea', zh ? '多行输入' : 'Textarea'], ['select', zh ? '选项选择' : 'Select']]} />
        {editorType === 'select' && <DocsSelect label={zh ? '选择模式' : 'Selection mode'} value={selectMode} onValueChange={next => { setEditing(false); setSelectMode(next as typeof selectMode); }}
          options={[['dropdown', zh ? '下拉选择' : 'Dropdown'], ['searchable', zh ? '搜索选择' : 'Searchable'], ['stepper', zh ? '左右切换' : 'Stepper']]} />}
        <DocsSelect label={zh ? '失焦行为' : 'Blur behavior'} value={blurBehavior} onValueChange={next => setBlurBehavior(next as EditableBlurBehavior)} options={[
          ['ignore', zh ? '忽略' : 'Ignore'], ['save', zh ? '保存' : 'Save'], ['cancel', zh ? '取消' : 'Cancel'],
        ]} />
      </> },
      { label: zh ? '校验' : 'Validation', content: <Switch label={zh ? '启用非空校验' : 'Require non-empty value'} checked={validate} onCheckedChange={setValidate} /> },
    ]} />}>
      <div className="editable-examples__stage">
        <Field label={zh ? '项目标题' : 'Project title'}>
          <Editable
            aria-label={zh ? '编辑项目标题' : 'Edit project title'}
            blurBehavior={blurBehavior}
            cancelLabel={cancelLabel}
            editing={editing}
            editorType={editorType}
            selectProps={{ items, mode: selectMode, searchPlaceholder: zh ? '搜索状态' : 'Search status', emptyContent: zh ? '没有匹配选项' : 'No matching options', previousLabel: zh ? '上一个状态' : 'Previous status', nextLabel: zh ? '下一个状态' : 'Next status' }}
            onEditingChange={setEditing}
            onValueChange={editorType === 'select' ? setStatus : setValue}
            placeholder={placeholder}
            saveLabel={saveLabel}
            startEditingLabel={startEditingLabel}
            validate={next => validate && !next.trim() ? (zh ? '标题不能为空' : 'Title is required') : undefined}
            value={editorType === 'select' ? status : value}
          />
        </Field>
      </div>
    </ComponentPlayground>

    <ComponentExample id="editable-multiline-text" title={zh ? '多行文本' : 'Multiline text'} code={`<Editable editorType="textarea" defaultValue="Inkra" textareaProps={{ rows: 3 }} />`}>
      <Editable editorType="textarea" defaultValue={zh ? '保留一个简短备注。\n稍后继续补充。' : 'Keep a short note.\nAdd more details later.'}
        aria-label={zh ? '编辑多行备注' : 'Edit multiline note'} startEditingLabel={zh ? '编辑多行备注' : 'Edit multiline note'}
        saveLabel={zh ? '确认备注' : 'Confirm note'} cancelLabel={cancelLabel} textareaProps={{ rows: 3 }} />
    </ComponentExample>
    <ComponentExample id="editable-select-editors" title={zh ? '选择器编辑' : 'Select editors'} code={`<Editable editorType="select" defaultValue="draft" selectProps={{ items }} />
<Editable editorType="select" defaultValue="draft" selectProps={{ items, mode: 'searchable' }} />
<Editable editorType="select" defaultValue="draft" selectProps={{ items, mode: 'stepper' }} />`}>
      <div className="component-demo-stack">
        {(['dropdown', 'searchable', 'stepper'] as const).map((mode, index) => <Field key={mode} label={(zh ? ['下拉选择', '搜索选择', '左右切换'] : ['Dropdown', 'Searchable', 'Stepper'])[index]}>
          <Editable editorType="select" defaultValue="draft"
            selectProps={{ items, mode, searchPlaceholder: zh ? '搜索状态' : 'Search status', emptyContent: zh ? '没有匹配选项' : 'No matching options', previousLabel: zh ? '上一个状态' : 'Previous status', nextLabel: zh ? '下一个状态' : 'Next status' }}
            aria-label={zh ? '编辑状态' : 'Edit status'} startEditingLabel={zh ? '编辑状态' : 'Edit status'}
            saveLabel={zh ? '确认状态' : 'Confirm status'} cancelLabel={cancelLabel} />
        </Field>)}
      </div>
    </ComponentExample>
    <ComponentExample id="editable-custom-display-and-editor" title={zh ? '自定义显示与编辑器' : 'Custom display and editor'} code={`<Editable
  value={title}
  onValueChange={setTitle}
  display={value => <strong>{value}</strong>}
  editor={({ value, onValueChange, ...props }) => <Textarea value={value} onChange={event => onValueChange(event.currentTarget.value)} {...props} />}
  startEditingLabel="${zh ? '编辑备注' : 'Edit note'}"
  saveLabel="${zh ? '保存备注' : 'Save note'}"
  cancelLabel="${zh ? '取消编辑' : 'Cancel editing'}"
/>`}>
      <Editable
        aria-label={zh ? '编辑备注' : 'Edit note'}
        cancelLabel={zh ? '取消编辑' : 'Cancel editing'}
        display={current => <strong>{current}</strong>}
        editor={({ value: current, onValueChange: change, ...editorProps }) => <Textarea {...editorProps} value={current} onChange={event => change(event.currentTarget.value)} />}
        multiline
        onValueChange={setCustomNote}
        placeholder={zh ? '输入备注' : 'Enter a note'}
        saveLabel={zh ? '保存备注' : 'Save note'}
        startEditingLabel={zh ? '编辑备注' : 'Edit note'}
        value={customNote}
      />
    </ComponentExample>

    <ComponentExample id="editable-interactive-display-content" title={zh ? '显示内容中的操作' : 'Interactive display content'} code={`<Editable
  value={name}
  onValueChange={setName}
  display={value => <span><a href="/profile">{value}</a></span>}
  startEditingLabel="${zh ? '编辑成员名称' : 'Edit member name'}"
  saveLabel="${zh ? '保存名称' : 'Save name'}"
  cancelLabel="${zh ? '取消编辑' : 'Cancel editing'}"
/>`}>
      <Editable
        aria-label={zh ? '编辑成员名称' : 'Edit member name'}
        cancelLabel={zh ? '取消编辑' : 'Cancel editing'}
        display={current => <span><a href="#editable-profile" data-editable-ignore>{current}</a></span>}
        onValueChange={setMemberName}
        placeholder={zh ? '输入成员名称' : 'Enter a member name'}
        saveLabel={zh ? '保存名称' : 'Save name'}
        startEditingLabel={zh ? '编辑成员名称' : 'Edit member name'}
        value={memberName}
      />
    </ComponentExample>
  </div>;
}
