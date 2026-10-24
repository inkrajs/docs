import { useEffect, useState } from 'react';
import { Editable, Field, Switch, Textarea, type EditableBlurBehavior } from '@inkra/react';

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
  const [multiline, setMultiline] = useState(false);
  const [blurBehavior, setBlurBehavior] = useState<EditableBlurBehavior>('ignore');
  const [validate, setValidate] = useState(true);
  const [status, setStatus] = useState('');
  const [customNote, setCustomNote] = useState(zh ? '保留一个简短备注。' : 'Keep a short note.');
  const [memberName, setMemberName] = useState(zh ? '林墨' : 'Alex Lin');
  const startEditingLabel = zh ? '编辑项目标题' : 'Edit project title';
  const saveLabel = zh ? '保存标题' : 'Save title';
  const cancelLabel = zh ? '取消编辑' : 'Cancel editing';
  const placeholder = zh ? '输入项目标题' : 'Enter a project title';
  useEffect(() => {
    setValue(zh ? '点击编辑标题' : 'Click to edit this title');
    setCustomNote(zh ? '保留一个简短备注。' : 'Keep a short note.');
    setMemberName(zh ? '林墨' : 'Alex Lin');
    setEditing(false);
    setStatus('');
  }, [zh]);
  const code = `<Editable
  value={value}
  editing={${editing}}
  multiline={${multiline}}
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
        <Switch label={zh ? '多行编辑' : 'Multiline editor'} checked={multiline} onCheckedChange={setMultiline} />
        <DocsSelect label={zh ? '失焦行为' : 'Blur behavior'} value={blurBehavior} onValueChange={next => setBlurBehavior(next as EditableBlurBehavior)} options={[
          ['ignore', zh ? '忽略' : 'Ignore'], ['save', zh ? '保存' : 'Save'], ['cancel', zh ? '取消' : 'Cancel'],
        ]} />
      </> },
      { label: zh ? '校验' : 'Validation', content: <Switch label={zh ? '启用非空校验' : 'Require non-empty value'} checked={validate} onCheckedChange={setValidate} /> },
    ]} />}>
      <div className="editable-examples__stage">
        <Field label={zh ? '项目标题' : 'Project title'} description={zh ? 'Enter 键保存，Escape 键取消。' : 'Enter saves; Escape cancels.'}>
          <Editable
            aria-label={zh ? '编辑项目标题' : 'Edit project title'}
            blurBehavior={blurBehavior}
            cancelLabel={cancelLabel}
            editing={editing}
            multiline={multiline}
            onCancel={() => setStatus(zh ? '已取消编辑' : 'Editing cancelled')}
            onEditingChange={next => {
              setEditing(next);
              if (next) setStatus(zh ? '正在编辑标题' : 'Editing title');
            }}
            onSave={async next => {
              await Promise.resolve();
              setStatus(zh ? `已保存：${next}` : `Saved: ${next}`);
            }}
            onValueChange={setValue}
            placeholder={placeholder}
            saveLabel={saveLabel}
            startEditingLabel={startEditingLabel}
            validate={next => validate && !next.trim() ? (zh ? '标题不能为空' : 'Title is required') : undefined}
            value={value}
          />
        </Field>
        <output aria-live="polite" className="editable-examples__status">{status}</output>
      </div>
    </ComponentPlayground>

    <ComponentExample title={zh ? '自定义显示与编辑器' : 'Custom display and editor'} code={`<Editable
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

    <ComponentExample title={zh ? '显示内容中的操作' : 'Interactive display content'} code={`<Editable
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
