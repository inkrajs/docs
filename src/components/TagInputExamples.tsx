import { useMemo, useState } from 'react';
import {
  Field,
  Input,
  PencilText,
  Switch,
  TagInput,
  type TagInputLabels,
  type TagInputTag,
  type TagInputVariant,
} from '@inkra/react';

import { useLocale } from '../i18n';
import { ComponentExample } from './ComponentExample';
import { ComponentPlayground } from './ComponentPlayground';
import { DocsSelect, controlSizes } from './DocsSelect';
import { PropertyTabs } from './PropertyTabs';
import './TagInputExamples.css';

type TagInputSize = 'sm' | 'md' | 'lg';

const initialTags: TagInputTag[] = [
  { id: 'react', value: 'react', label: 'React' },
  { id: 'design-system', value: 'design-system', label: 'Design System' },
];

function exampleLabels(zh: boolean): Partial<TagInputLabels> {
  return {
    tagList: zh ? '已选标签' : 'Selected tags',
    removeTag: tag => zh ? `删除 ${tag.label ?? tag.value}` : `Remove ${tag.label ?? tag.value}`,
    clearAll: zh ? '清空全部标签' : 'Clear all tags',
    duplicate: candidate => zh ? `${candidate} 已经存在。` : `${candidate} is already added.`,
    maxTags: maximum => zh ? `最多添加 ${maximum} 个标签。` : `Add up to ${maximum} tags.`,
    invalid: candidate => zh ? `${candidate} 不是有效标签。` : `${candidate} is not a valid tag.`,
  };
}

function SizeAlignmentExample() {
  const { locale } = useLocale();
  const zh = locale === 'zh-CN';
  const sizes: TagInputSize[] = ['sm', 'md', 'lg'];
  const code = sizes.map(size => `<div className="form-size-row">
  <Input aria-label="Input ${size}" size="${size}" defaultValue="Inkra" />
  <TagInput
    aria-label="TagInput ${size}"
    size="${size}"
    value={[{ id: 'react', value: 'react', label: 'React' }]}
    clearable={false}
  />
</div>`).join('\n');

  return <ComponentExample title={zh ? '尺寸与外框内距' : 'Sizes and control inset'} code={code}>
    <div className="tag-input-examples__size-list">
      {sizes.map(size => <div className="tag-input-examples__size-row" data-size={size} key={size}>
        <PencilText as="span" className="tag-input-examples__size-label">{size}</PencilText>
        <Input aria-label={`Input ${size}`} defaultValue="Inkra" size={size} />
        <TagInput
          aria-label={`TagInput ${size}`}
          clearable={false}
          size={size}
          value={[initialTags[0]]}
        />
      </div>)}
    </div>
  </ComponentExample>;
}

function TagInputPlayground() {
  const { locale } = useLocale();
  const zh = locale === 'zh-CN';
  const [tags, setTags] = useState<TagInputTag[]>(initialTags);
  const [size, setSize] = useState<TagInputSize>('md');
  const [variant, setVariant] = useState<TagInputVariant>('outline');
  const [maxTags, setMaxTags] = useState(5);
  const [clearable, setClearable] = useState(true);
  const [validateLength, setValidateLength] = useState(false);
  const [readOnly, setReadOnly] = useState(false);
  const [disabled, setDisabled] = useState(false);
  const labels = useMemo(() => exampleLabels(zh), [zh]);
  const code = `const [tags, setTags] = useState<TagInputTag[]>([
  { id: 'react', value: 'react', label: 'React' },
  { id: 'design-system', value: 'design-system', label: 'Design System' },
]);

<Field
  label="${zh ? '项目标签' : 'Project tags'}"
>
  <TagInput
    name="tags"
    value={tags}
    onValueChange={next => setTags([...next])}
    size="${size}" variant="${variant}" maxTags={${maxTags}}
    clearable={${clearable}} readOnly={${readOnly}} disabled={${disabled}}
    validateTag={candidate =>
      ${validateLength} && candidate.length < 2
        ? '${zh ? '标签至少需要 2 个字符。' : 'Tags need at least 2 characters.'}'
        : undefined
    }
  />
</Field>`;

  return <ComponentPlayground code={code} controls={<PropertyTabs groups={[
    { label: '基础', content: <>
      <DocsSelect label={zh ? '尺寸' : 'Size'} value={size} onValueChange={next => setSize(next as TagInputSize)} options={controlSizes} />
      <DocsSelect label={zh ? '外观' : 'Variant'} value={variant} onValueChange={next => setVariant(next as TagInputVariant)} options={[
        ['outline', zh ? '描边' : 'Outline'],
        ['underline', zh ? '下划线' : 'Underline'],
        ['soft', zh ? '柔和铺色' : 'Soft'],
      ]} />
      <DocsSelect label={zh ? '数量上限' : 'Maximum tags'} value={String(maxTags)} onValueChange={next => setMaxTags(Number(next))} options={[
        ['3', '3'], ['5', '5'], ['8', '8'],
      ]} />
    </> },
    { label: '交互', content: <>
      <Switch label={zh ? '允许清空' : 'Clearable'} checked={clearable} onCheckedChange={setClearable} />
      <Switch label={zh ? '最短长度校验' : 'Minimum length validation'} checked={validateLength} onCheckedChange={setValidateLength} />
    </> },
    { label: '状态', content: <>
      <Switch label={zh ? '只读' : 'Read only'} checked={readOnly} onCheckedChange={setReadOnly} />
      <Switch label={zh ? '禁用' : 'Disabled'} checked={disabled} onCheckedChange={setDisabled} />
    </> },
  ]} />}>
    <div className="tag-input-examples__stage">
      <Field
        label={zh ? '项目标签' : 'Project tags'}
      >
        <TagInput
          clearable={clearable}
          disabled={disabled}
          labels={labels}
          maxTags={maxTags}
          name="tags"
          onValueChange={next => setTags([...next])}
          placeholder={zh ? '添加标签' : 'Add a tag'}
          readOnly={readOnly}
          size={size}
          validateTag={candidate => validateLength && candidate.length < 2
            ? (zh ? '标签至少需要 2 个字符。' : 'Tags need at least 2 characters.')
            : undefined}
          value={tags}
          variant={variant}
        />
      </Field>
    </div>
  </ComponentPlayground>;
}

function ContractExample() {
  const { locale } = useLocale();
  const zh = locale === 'zh-CN';
  const labels = exampleLabels(zh);
  const code = `<TagInput
  name="areas"
  defaultValue={[
    { id: 'area-frontend', value: 'fe', label: '${zh ? '前端' : 'Frontend'}' },
    { id: 'area-accessibility', value: 'a11y', label: '${zh ? '无障碍' : 'Accessibility'}' },
  ]}
  createTag={candidate => ({
    id: \`area-\${candidate.toLowerCase().replaceAll(' ', '-')}\`,
    value: candidate.toLowerCase(),
    label: candidate,
  })}
/>`;
  return <ComponentExample title={zh ? '稳定身份、表单值与显示文字' : 'Stable identity, form value, and display text'} code={code}>
    <div className="tag-input-examples__stage">
      <Field
        label={zh ? '负责领域' : 'Areas of ownership'}
        description={zh
          ? 'id 用于稳定身份，value 用于去重和表单提交，label 负责显示。'
          : 'id is stable identity, value drives deduplication and form submission, and label is displayed.'}
      >
        <TagInput
          createTag={candidate => ({
            id: `area-${candidate.toLowerCase().replaceAll(' ', '-')}`,
            value: candidate.toLowerCase(),
            label: candidate,
          })}
          defaultValue={[
            { id: 'area-frontend', value: 'fe', label: zh ? '前端' : 'Frontend' },
            { id: 'area-accessibility', value: 'a11y', label: zh ? '无障碍' : 'Accessibility' },
          ]}
          labels={labels}
          name="areas"
          placeholder={zh ? '添加领域' : 'Add an area'}
        />
      </Field>
    </div>
  </ComponentExample>;
}

function PasteAndStateExamples() {
  const { locale } = useLocale();
  const zh = locale === 'zh-CN';
  const labels = exampleLabels(zh);
  return <>
    <ComponentExample title={zh ? '非受控粘贴与校验' : 'Uncontrolled paste and validation'} code={`<TagInput
  defaultValue={[{ id: 'docs', value: 'docs', label: 'Docs' }]}
  delimiters={[',', ';', '\\n']}
  maxTags={6}
  validateTag={candidate => candidate.includes(' ') ? '${zh ? '标签不能包含空格。' : 'Tags cannot contain spaces.'}' : undefined}
/>`}>
      <div className="tag-input-examples__stage">
        <Field
          label={zh ? '发布标签' : 'Release tags'}
          description={zh ? '试试粘贴 alpha, beta; rc。输入法组合期间不会提交。' : 'Try pasting alpha, beta; rc. IME composition does not commit.'}
        >
          <TagInput
            defaultValue={[{ id: 'docs', value: 'docs', label: 'Docs' }]}
            delimiters={[',', ';', '\n']}
            labels={labels}
            maxTags={6}
            placeholder={zh ? '添加发布标签' : 'Add release tags'}
            validateTag={candidate => candidate.includes(' ')
              ? (zh ? '标签不能包含空格。' : 'Tags cannot contain spaces.')
              : undefined}
          />
        </Field>
      </div>
    </ComponentExample>

    <ComponentExample title={zh ? '只读与禁用' : 'Read-only and disabled'} code={`<TagInput readOnly value={tags} />
<TagInput disabled value={tags} />`}>
      <div className="tag-input-examples__state-grid">
        <Field label={zh ? '只读' : 'Read only'} readOnly>
          <TagInput labels={labels} readOnly value={initialTags} />
        </Field>
        <Field disabled label={zh ? '禁用' : 'Disabled'}>
          <TagInput disabled labels={labels} value={initialTags} />
        </Field>
      </div>
    </ComponentExample>
  </>;
}

export function TagInputExamples() {
  return <div className="component-examples tag-input-examples">
    <TagInputPlayground />
    <SizeAlignmentExample />
    <ContractExample />
    <PasteAndStateExamples />
  </div>;
}
