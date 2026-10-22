import { useState } from 'react';
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
  const code = `<Editable
  value={value}
  editing={${editing}}
  multiline={${multiline}}
  blurBehavior="${blurBehavior}"
  onEditingChange={setEditing}
  onValueChange={setValue}
  validate={value => ${validate} && value.trim() ? undefined : '${zh ? '请输入内容' : 'Enter a value'}'}
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
        <Field label={zh ? '项目标题' : 'Project title'} description={zh ? 'Enter 保存，Escape 取消。' : 'Enter saves; Escape cancels.'}>
          <Editable
            aria-label={zh ? '编辑项目标题' : 'Edit project title'}
            blurBehavior={blurBehavior}
            editing={editing}
            multiline={multiline}
            onEditingChange={setEditing}
            onSave={async next => {
              await Promise.resolve();
              setStatus(zh ? `已保存：${next}` : `Saved: ${next}`);
            }}
            onValueChange={setValue}
            validate={next => validate && !next.trim() ? (zh ? '标题不能为空' : 'Title is required') : undefined}
            value={value}
          />
        </Field>
        <output aria-live="polite" className="editable-examples__status">{status}</output>
      </div>
    </ComponentPlayground>

    <ComponentExample title={zh ? '自定义显示与编辑器' : 'Custom display and editor'} code={`<Editable
  value={title}
  display={value => <strong>{value}</strong>}
  editor={({ value, onValueChange, ...props }) => <Textarea value={value} onChange={event => onValueChange(event.currentTarget.value)} {...props} />}
/>`}>
      <Editable
        aria-label={zh ? '编辑备注' : 'Edit note'}
        value={zh ? '保留一个简短备注。' : 'Keep a short note.'}
        display={current => <strong>{current}</strong>}
        editor={({ value: current, onValueChange: change, ...editorProps }) => <Textarea {...editorProps} value={current} onChange={event => change(event.currentTarget.value)} />}
        multiline
      />
    </ComponentExample>

    <ComponentExample title={zh ? '显示内容中的操作' : 'Interactive display content'} code={`<Editable value={name} display={value => <span><a href="/profile">{value}</a></span>} />`}>
      <Editable aria-label={zh ? '编辑成员名称' : 'Edit member name'} value={zh ? '林墨' : 'Alex Lin'} display={current => <span><a href="#editable-profile" data-editable-ignore>{current}</a></span>} />
    </ComponentExample>
  </div>;
}
