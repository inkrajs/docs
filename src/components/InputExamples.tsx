import { useState, type FormEvent } from 'react';
import { Button, Field, Input, Textarea, Switch, Tooltip } from 'inkra';
import { __iconData as searchIcon } from 'lucide-react/dist/esm/icons/search.mjs';
import { __iconData as checkIcon } from 'lucide-react/dist/esm/icons/check.mjs';
import { __iconData as mailIcon } from 'lucide-react/dist/esm/icons/mail.mjs';
import { __iconData as copyIcon } from 'lucide-react/dist/esm/icons/copy.mjs';
import { useLocale } from '../i18n';
import { ComponentExample } from './ComponentExample';
import { ComponentPlayground } from './ComponentPlayground';
import { PropertyTabs } from './PropertyTabs';
import { DocsIcon } from './DocsIcon';
import { DocsSelect, controlSizes } from './DocsSelect';
import './InputExamples.css';

type InputSize = 'sm' | 'md' | 'lg';
type InputVariant = 'underline' | 'outline' | 'soft' | 'ghost';
type TextAlign = 'start' | 'center' | 'end';
type InputKind = 'text' | 'search' | 'email' | 'url' | 'tel';

const variants = [['underline', '下划线'], ['outline', '描边'], ['soft', '柔和铺色'], ['ghost', '无边框']] as const;
const quote = (value: string) => JSON.stringify(value);

function CopyAction({ size = 'md', disabled, onClick }: { size?: InputSize; disabled: boolean; onClick: () => void }) {
  const { t } = useLocale();
  return <Tooltip.Provider>
    <Tooltip.Root>
      <Tooltip.Trigger asChild>
        <Button size={size === 'lg' ? 'icon-lg' : size === 'sm' ? 'icon-sm' : 'icon'} variant="ghost" disabled={disabled} aria-label={t('复制内容')} onClick={onClick}>
          <DocsIcon data={copyIcon} size={size === 'sm' ? 18 : size === 'lg' ? 26 : 22} />
        </Button>
      </Tooltip.Trigger>
      <Tooltip.Portal><Tooltip.Content>{t('复制内容')}</Tooltip.Content></Tooltip.Portal>
    </Tooltip.Root>
  </Tooltip.Provider>;
}

function InputPlayground() {
  const { t } = useLocale();
  const [value, setValue] = useState('Inkra');
  const [size, setSize] = useState<InputSize>('md');
  const [variant, setVariant] = useState<InputVariant>('underline');
  const [type, setType] = useState<InputKind>('text');
  const [textAlign, setTextAlign] = useState<TextAlign>('start');
  const [dir, setDir] = useState<'ltr' | 'rtl'>('ltr');
  const [start, setStart] = useState(true);
  const [end, setEnd] = useState(false);
  const [clearable, setClearable] = useState(true);
  const [loading, setLoading] = useState(false);
  const [action, setAction] = useState(false);
  const [fullWidth, setFullWidth] = useState(true);
  const [disabled, setDisabled] = useState(false);
  const [readOnly, setReadOnly] = useState(false);
  const [invalid, setInvalid] = useState(false);
  const [required, setRequired] = useState(true);
  const [prefix, setPrefix] = useState('');
  const [suffix, setSuffix] = useState('');
  const [status, setStatus] = useState('');
  async function copyValue() {
    try {
      await navigator.clipboard.writeText(value);
      setStatus(t('已复制'));
    } catch {
      setStatus(t('复制失败，请手动选择文本'));
    }
  }
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus(JSON.stringify(Object.fromEntries(new FormData(event.currentTarget))));
  }
  const iconSize = size === 'sm' ? 18 : size === 'lg' ? 26 : 22;
  const code = `const [value, setValue] = useState(${quote(value)});
const [status, setStatus] = useState('');
${action ? `async function copyValue() {
  try {
    await navigator.clipboard.writeText(value);
    setStatus(${quote(t('已复制'))});
  } catch {
    setStatus(${quote(t('复制失败，请手动选择文本'))});
  }
}
` : ''}
<form noValidate onSubmit={event => {
  event.preventDefault();
  setStatus(JSON.stringify(Object.fromEntries(new FormData(event.currentTarget))));
}}>
  <Field label=${quote(t('名称'))} description=${quote(t('用于识别这条笔记'))}${required ? ' required' : ''}${invalid ? ` invalid error=${quote(t('请输入名称'))}` : ''}>
    <Input
      name="title" type="${type}" size="${size}" variant="${variant}"
      value={value} onValueChange={setValue}
      placeholder=${quote(t('笔记名称'))}
      textAlign="${textAlign}" dir="${dir}" fullWidth={${fullWidth}}
      loading={${loading}}${clearable ? ` clearable clearButtonLabel=${quote(t('清空名称'))}` : ''}${disabled ? '\n      disabled' : ''}${readOnly ? '\n      readOnly' : ''}${start ? `\n      startIcon={<DocsIcon data={searchIcon} size={${iconSize}} />}` : ''}${end ? `\n      endIcon={<DocsIcon data={checkIcon} size={${iconSize}} />}` : ''}${prefix ? `\n      prefix=${quote(prefix)}` : ''}${suffix ? `\n      suffix=${quote(suffix)}` : ''}${action ? `
      endAction={
        <Tooltip.Provider>
          <Tooltip.Root>
            <Tooltip.Trigger asChild>
              <Button size="${size === 'lg' ? 'icon-lg' : size === 'sm' ? 'icon-sm' : 'icon'}" variant="ghost" disabled={${disabled}} aria-label=${quote(t('复制内容'))} onClick={copyValue}>
                <DocsIcon data={copyIcon} size={${iconSize}} />
              </Button>
            </Tooltip.Trigger>
            <Tooltip.Portal><Tooltip.Content>${t('复制内容')}</Tooltip.Content></Tooltip.Portal>
          </Tooltip.Root>
        </Tooltip.Provider>
      }` : ''}
      onClear={() => setStatus(${quote(t('已清空'))})}
    />
  </Field>
  <Button type="submit" disabled={${disabled}}>${t('读取表单')}</Button>
  <output aria-live="polite">{status}</output>
</form>`;
  return <ComponentPlayground code={code} controls={<PropertyTabs groups={[{ label: '基础', content: <>
    <DocsSelect label="尺寸" value={size} onValueChange={next => setSize(next as InputSize)} options={controlSizes} />
    <DocsSelect label="外观" value={variant} onValueChange={next => setVariant(next as InputVariant)} options={variants} />
    <DocsSelect label="输入类型" value={type} onValueChange={next => setType(next as InputKind)} options={[['text', 'Text'], ['search', 'Search'], ['email', 'Email'], ['url', 'URL'], ['tel', 'Tel']]} />
    <Switch label={t('撑满宽度')} checked={fullWidth} onCheckedChange={setFullWidth} />
    <DocsSelect label="内容对齐" value={textAlign} onValueChange={next => setTextAlign(next as TextAlign)} options={[['start', 'Start'], ['center', 'Center'], ['end', 'End']]} />
    <DocsSelect label="阅读方向" value={dir} onValueChange={next => setDir(next as typeof dir)} options={[['ltr', 'LTR'], ['rtl', 'RTL']]} />
  </> }, { label: '内容', content: <>
    <Field label={t('名称')}><Input value={value} onChange={event => setValue(event.target.value)} /></Field>
    <Switch label={t('前置图标')} checked={start} onCheckedChange={setStart} />
    <Switch label={t('后置图标')} checked={end} onCheckedChange={setEnd} />
    <Switch label={t('尾部操作')} checked={action} onCheckedChange={setAction} />
    <Field label={t('前缀文字')}><Input value={prefix} onChange={event => setPrefix(event.target.value)} placeholder="https://" /></Field>
    <Field label={t('后缀文字')}><Input value={suffix} onChange={event => setSuffix(event.target.value)} placeholder="kg" /></Field>
  </> }, { label: '状态', content: <>
    <Switch label={t('允许清空')} checked={clearable} onCheckedChange={setClearable} />
    <Switch label={t('加载中')} checked={loading} onCheckedChange={setLoading} />
    <Switch label={t('必填')} checked={required} onCheckedChange={setRequired} />
    <Switch label={t('只读')} checked={readOnly} onCheckedChange={setReadOnly} />
    <Switch label={t('禁用')} checked={disabled} onCheckedChange={setDisabled} />
    <Switch label={t('错误状态')} checked={invalid} onCheckedChange={setInvalid} />
  </> }]} />}>
    <form className="component-demo-form" noValidate onSubmit={submit}>
      <Field label={t('名称')} description={t('用于识别这条笔记')} required={required} invalid={invalid} error={invalid ? t('请输入名称') : undefined}>
        <Input
          name="title" type={type} size={size} variant={variant} value={value}
          onValueChange={setValue}
          placeholder={t('笔记名称')} clearable={clearable} clearButtonLabel={t('清空名称')}
          loading={loading} disabled={disabled} readOnly={readOnly} fullWidth={fullWidth}
          textAlign={textAlign} dir={dir} prefix={prefix || undefined} suffix={suffix || undefined}
          startIcon={start ? <DocsIcon data={searchIcon} size={iconSize} /> : undefined}
          endIcon={end ? <DocsIcon data={checkIcon} size={iconSize} /> : undefined}
          endAction={action ? <CopyAction size={size} disabled={disabled} onClick={() => void copyValue()} /> : undefined}
          onClear={() => setStatus(t('已清空'))}
        />
      </Field>
      <div className="component-demo-row"><Button type="submit" disabled={disabled}>{t('读取表单')}</Button></div>
      <output aria-live="polite" className="component-demo-status input-examples__status">{status}</output>
    </form>
  </ComponentPlayground>;
}

function ClearExamples() {
  const { t } = useLocale();
  const [value, setValue] = useState('Inkra');
  const [status, setStatus] = useState('');
  const code = `const [value, setValue] = useState('Inkra');
const [status, setStatus] = useState('');

<form onReset={() => { setValue('Inkra'); setStatus(''); }} onSubmit={event => {
  event.preventDefault();
  setStatus(JSON.stringify(Object.fromEntries(new FormData(event.currentTarget))));
}}>
  <Field label=${quote(t('受控输入'))}>
    <Input name="controlled" value={value} onValueChange={setValue} clearable clearButtonLabel=${quote(t('清空受控输入'))} onClear={() => setStatus(${quote(t('已清空'))})} />
  </Field>
  <Field label=${quote(t('非受控输入'))}>
    <Input name="uncontrolled" defaultValue="Notes" clearable clearButtonLabel=${quote(t('清空非受控输入'))} onClear={() => setStatus(${quote(t('已清空'))})} />
  </Field>
  <Button type="submit">${t('读取表单')}</Button>
  <Button type="reset" variant="secondary">${t('重置')}</Button>
  <output aria-live="polite">{status}</output>
</form>`;
  return <ComponentExample title="清空与表单重置" code={code}>
    <form className="component-demo-form" onReset={() => { setValue('Inkra'); setStatus(''); }} onSubmit={event => { event.preventDefault(); setStatus(JSON.stringify(Object.fromEntries(new FormData(event.currentTarget)))); }}>
      <Field label={t('受控输入')}><Input name="controlled" value={value} onValueChange={setValue} clearable clearButtonLabel={t('清空受控输入')} onClear={() => setStatus(t('已清空'))} /></Field>
      <Field label={t('非受控输入')}><Input name="uncontrolled" defaultValue="Notes" clearable clearButtonLabel={t('清空非受控输入')} onClear={() => setStatus(t('已清空'))} /></Field>
      <div className="component-demo-row"><Button type="submit">{t('读取表单')}</Button><Button type="reset" variant="secondary">{t('重置')}</Button></div>
      <output aria-live="polite" className="component-demo-status input-examples__status">{status}</output>
    </form>
  </ComponentExample>;
}

function ActionExamples() {
  const { t } = useLocale();
  const [value, setValue] = useState('Inkra');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const code = `const [value, setValue] = useState('Inkra');
const [loading, setLoading] = useState(false);
const [status, setStatus] = useState('');

async function copyValue() {
  setLoading(true);
  try {
    await navigator.clipboard.writeText(value);
    setStatus(${quote(t('已复制'))});
  } catch {
    setStatus(${quote(t('复制失败，请手动选择文本'))});
  } finally {
    setLoading(false);
  }
}

{(['underline', 'outline'] as const).map(variant => (
<Field key={variant} label={variant === 'underline' ? ${quote(t('下划线'))} : ${quote(t('描边'))}}>
  <Input variant={variant} value={value} onValueChange={setValue} loading={loading}
    clearable clearButtonLabel=${quote(t('清空名称'))}
    endAction={
      <Tooltip.Provider>
        <Tooltip.Root>
          <Tooltip.Trigger asChild>
            <Button size="icon" variant="ghost" disabled={loading} aria-label=${quote(t('复制内容'))} onClick={copyValue}>
              <DocsIcon data={copyIcon} size={22} />
            </Button>
          </Tooltip.Trigger>
          <Tooltip.Portal><Tooltip.Content>${t('复制内容')}</Tooltip.Content></Tooltip.Portal>
        </Tooltip.Root>
      </Tooltip.Provider>
    }
  />
</Field>
))}
<Switch label=${quote(t('加载中'))} checked={loading} onCheckedChange={setLoading} />
<output aria-live="polite">{status}</output>`;
  async function copyValue() {
    setLoading(true);
    try {
      await navigator.clipboard.writeText(value);
      setStatus(t('已复制'));
    } catch {
      setStatus(t('复制失败，请手动选择文本'));
    } finally {
      setLoading(false);
    }
  }
  return <ComponentExample title="加载与尾部操作" code={code}>
    <div className="component-demo-stack">
      <div className="input-examples__fields">{(['underline', 'outline'] as const).map(variant => <Field key={variant} label={t(variant === 'underline' ? '下划线' : '描边')}><Input variant={variant} value={value} onValueChange={setValue} loading={loading} clearable clearButtonLabel={t('清空名称')} endAction={<CopyAction disabled={loading} onClick={() => void copyValue()} />} /></Field>)}</div>
      <Switch label={t('加载中')} checked={loading} onCheckedChange={setLoading} />
      <output aria-live="polite" className="component-demo-status input-examples__status">{status}</output>
    </div>
  </ComponentExample>;
}

export function InputExamples() {
  const { t } = useLocale();
  return <>
    <InputPlayground />
    <ComponentExample title="首尾图标" code={`<Field label=${quote(t('搜索文档'))}><Input type="search" placeholder=${quote(t('搜索文档'))} startIcon={<DocsIcon data={searchIcon} size={22} />} /></Field>\n<Field label=${quote(t('电子邮箱'))}><Input type="email" defaultValue="hello@example.com" startIcon={<DocsIcon data={mailIcon} size={22} />} endIcon={<DocsIcon data={checkIcon} size={22} />} /></Field>`}>
      <div className="input-examples__fields">
        <Field label={t('搜索文档')}><Input type="search" placeholder={t('搜索文档')} startIcon={<DocsIcon data={searchIcon} size={22} />} /></Field>
        <Field label={t('电子邮箱')}><Input type="email" defaultValue="hello@example.com" startIcon={<DocsIcon data={mailIcon} size={22} />} endIcon={<DocsIcon data={checkIcon} size={22} />} /></Field>
      </div>
    </ComponentExample>
    <ComponentExample title="前缀与后缀" code={`<Field label=${quote(t('网站域名'))} description=${quote(t('协议为 HTTPS'))}><Input prefix="https://" defaultValue="example.com" /></Field>\n<Field label=${quote(t('行李重量'))} description=${quote(t('单位：千克'))}><Input inputMode="decimal" suffix="kg" defaultValue="12.5" textAlign="end" /></Field>`}>
      <div className="input-examples__fields">
        <Field label={t('网站域名')} description={t('协议为 HTTPS')}><Input prefix="https://" defaultValue="example.com" /></Field>
        <Field label={t('行李重量')} description={t('单位：千克')}><Input inputMode="decimal" suffix="kg" defaultValue="12.5" textAlign="end" /></Field>
      </div>
    </ComponentExample>
    <ClearExamples />
    <ActionExamples />
    <ComponentExample title="外观" code={variants.map(([variant, label]) => `<Field label=${quote(t(label))}><Input variant="${variant}" defaultValue="Inkra" /></Field>`).join('\n')}>
      <div className="input-examples__fields">{variants.map(([variant, label]) => <Field key={variant} label={t(label)}><Input variant={variant} defaultValue="Inkra" /></Field>)}</div>
    </ComponentExample>
    <ComponentExample title="尺寸" code={controlSizes.map(([size, label]) => `<Field label=${quote(t(label))}><Input size="${size}" defaultValue="Inkra" /></Field>`).join('\n')}>
      <div className="input-examples__fields">{controlSizes.map(([size, label]) => <Field key={size} label={t(label)}><Input size={size} defaultValue="Inkra" /></Field>)}</div>
    </ComponentExample>
    <ComponentExample title="状态" code={`<Field label=${quote(t('只读'))}><Input readOnly defaultValue="Inkra" clearable clearButtonLabel=${quote(t('清空名称'))} /></Field>\n<Field label=${quote(t('禁用'))} disabled><Input defaultValue="Inkra" clearable clearButtonLabel=${quote(t('清空名称'))} /></Field>\n<Field label=${quote(t('名称'))} required error=${quote(t('请输入名称'))}><Input placeholder=${quote(t('笔记名称'))} /></Field>`}>
      <div className="input-examples__fields">
        <Field label={t('只读')}><Input readOnly defaultValue="Inkra" clearable clearButtonLabel={t('清空名称')} /></Field>
        <Field label={t('禁用')} disabled><Input defaultValue="Inkra" clearable clearButtonLabel={t('清空名称')} /></Field>
        <Field label={t('名称')} required error={t('请输入名称')}><Input placeholder={t('笔记名称')} /></Field>
      </div>
    </ComponentExample>
  </>;
}

export function TextareaExamples() {
  const { t } = useLocale();
  const [value, setValue] = useState('');
  const [size, setSize] = useState<InputSize>('md');
  const [rows, setRows] = useState(3);
  const [maxLength, setMaxLength] = useState('120');
  const [disabled, setDisabled] = useState(false);
  const [readOnly, setReadOnly] = useState(false);
  const [invalid, setInvalid] = useState(false);
  const [required, setRequired] = useState(false);
  const [status, setStatus] = useState('');
  const code = `const [value, setValue] = useState(${quote(value)});
const [status, setStatus] = useState('');

<form noValidate onReset={() => { setValue(''); setStatus(''); }} onSubmit={event => {
  event.preventDefault();
  setStatus(JSON.stringify(Object.fromEntries(new FormData(event.currentTarget))));
}}>
  <Field label=${quote(t('笔记内容'))}${required ? ' required' : ''}${invalid ? ` invalid error=${quote(t('请输入笔记内容'))}` : ''}>
    <Textarea name="notes" size="${size}" rows={${rows}}${maxLength !== 'none' ? ` maxLength={${maxLength}}` : ''}
      value={value} onChange={event => setValue(event.target.value)}
      placeholder=${quote(t('写下你的想法'))}${readOnly ? ' readOnly' : ''}${disabled ? ' disabled' : ''}
    />
  </Field>
  <Button type="submit" disabled={${disabled}}>${t('读取表单')}</Button>
  <Button type="reset" variant="secondary">${t('重置')}</Button>
  <output aria-live="polite">{status}</output>
</form>`;
  return <>
    <ComponentPlayground code={code} controls={<PropertyTabs groups={[
      { label: '基础', content: <>
        <DocsSelect label="尺寸" value={size} onValueChange={next => setSize(next as InputSize)} options={controlSizes} />
        <DocsSelect label="行数" value={String(rows)} onValueChange={next => setRows(Number(next))} options={[["2", "2"], ["3", "3"], ["5", "5"]]} />
        <DocsSelect label="最大长度" value={maxLength} onValueChange={setMaxLength} options={[["none", "不限"], ["40", "40"], ["120", "120"], ["240", "240"]]} />
      </> },
      { label: '状态', content: <>
        <Switch label={t('必填')} checked={required} onCheckedChange={setRequired} />
        <Switch label={t('只读')} checked={readOnly} onCheckedChange={setReadOnly} />
        <Switch label={t('禁用')} checked={disabled} onCheckedChange={setDisabled} />
        <Switch label={t('错误状态')} checked={invalid} onCheckedChange={setInvalid} />
      </> },
    ]} />}>
      <form className="component-demo-form" noValidate onReset={() => { setValue(''); setStatus(''); }} onSubmit={event => { event.preventDefault(); setStatus(JSON.stringify(Object.fromEntries(new FormData(event.currentTarget)))); }}>
        <Field label={t('笔记内容')} required={required} invalid={invalid} error={invalid ? t('请输入笔记内容') : undefined}><Textarea name="notes" size={size} rows={rows} maxLength={maxLength === 'none' ? undefined : Number(maxLength)} value={value} onChange={event => setValue(event.target.value)} placeholder={t('写下你的想法')} readOnly={readOnly} disabled={disabled} /></Field>
        <div className="component-demo-row"><Button type="submit" disabled={disabled}>{t('读取表单')}</Button><Button type="reset" variant="secondary">{t('重置')}</Button></div>
        <output aria-live="polite" className="component-demo-status input-examples__status">{status}</output>
      </form>
    </ComponentPlayground>
    <ComponentExample title="行数与长度限制" code={`<Field label=${quote(t('简短备注'))} description=${quote(t('最多 40 个 UTF-16 码元'))}><Textarea rows={2} maxLength={40} placeholder=${quote(t('写下你的想法'))} /></Field>\n<Field label=${quote(t('笔记内容'))} description=${quote(t('最多 120 个 UTF-16 码元'))}><Textarea rows={5} maxLength={120} defaultValue="Inkra" /></Field>`}>
      <div className="input-examples__fields">
        <Field label={t('简短备注')} description={t('最多 40 个 UTF-16 码元')}><Textarea rows={2} maxLength={40} placeholder={t('写下你的想法')} /></Field>
        <Field label={t('笔记内容')} description={t('最多 120 个 UTF-16 码元')}><Textarea rows={5} maxLength={120} defaultValue="Inkra" /></Field>
      </div>
    </ComponentExample>
    <ComponentExample title="状态" code={`<Field label=${quote(t('只读'))}><Textarea readOnly rows={3} defaultValue="Inkra" /></Field>\n<Field label=${quote(t('禁用'))} disabled><Textarea rows={3} defaultValue="Inkra" /></Field>`}>
      <div className="input-examples__fields"><Field label={t('只读')}><Textarea readOnly rows={3} defaultValue="Inkra" /></Field><Field label={t('禁用')} disabled><Textarea rows={3} defaultValue="Inkra" /></Field></div>
    </ComponentExample>
  </>;
}

export function FieldExamples() {
  const { t } = useLocale();
  const [value, setValue] = useState('');
  const [required, setRequired] = useState(true);
  const [disabled, setDisabled] = useState(false);
  const [readOnly, setReadOnly] = useState(false);
  const [description, setDescription] = useState(true);
  const [invalid, setInvalid] = useState(false);
  const [multiline, setMultiline] = useState(false);
  const tag = multiline ? 'Textarea' : 'Input';
  const code = `const [value, setValue] = useState(${quote(value)});

<Field label=${quote(t('名称'))}${description ? ` description=${quote(t('用于识别这条笔记'))}` : ''}${required ? ' required' : ''}${readOnly ? ' readOnly' : ''}${disabled ? ' disabled' : ''}${invalid ? ` error=${quote(t('请输入名称'))}` : ''}>
  <${tag} name="title" value={value} onChange={event => setValue(event.target.value)} placeholder=${quote(t('笔记名称'))} />
</Field>`;
  return <>
    <ComponentPlayground code={code} controls={<PropertyTabs groups={[
      { label: '内容', content: <>
        <Switch label={t('显示描述')} checked={description} onCheckedChange={setDescription} />
        <Switch label={t('多行输入')} checked={multiline} onCheckedChange={setMultiline} />
      </> },
      { label: '状态', content: <>
        <Switch label={t('必填')} checked={required} onCheckedChange={setRequired} />
        <Switch label={t('只读')} checked={readOnly} onCheckedChange={setReadOnly} />
        <Switch label={t('禁用')} checked={disabled} onCheckedChange={setDisabled} />
        <Switch label={t('错误状态')} checked={invalid} onCheckedChange={setInvalid} />
      </> },
    ]} />}>
      <div className="component-demo-form"><Field label={t('名称')} description={description ? t('用于识别这条笔记') : undefined} required={required} readOnly={readOnly} disabled={disabled} error={invalid ? t('请输入名称') : undefined}>
        {multiline ? <Textarea name="title" value={value} onChange={event => setValue(event.target.value)} placeholder={t('笔记名称')} /> : <Input name="title" value={value} onChange={event => setValue(event.target.value)} placeholder={t('笔记名称')} />}
      </Field></div>
    </ComponentPlayground>
    <ComponentExample title="标签、描述与错误" code={`<Field label=${quote(t('名称'))} required description=${quote(t('用于识别这条笔记'))}><Input placeholder=${quote(t('笔记名称'))} /></Field>\n<Field label=${quote(t('笔记内容'))} required error=${quote(t('请输入笔记内容'))}><Textarea /></Field>`}>
      <div className="input-examples__fields"><Field label={t('名称')} required description={t('用于识别这条笔记')}><Input placeholder={t('笔记名称')} /></Field><Field label={t('笔记内容')} required error={t('请输入笔记内容')}><Textarea /></Field></div>
    </ComponentExample>
  </>;
}

export function FormInputExamples({ kind }: { kind: 'input' | 'textarea' | 'field' }) {
  if (kind === 'textarea') return <TextareaExamples />;
  if (kind === 'field') return <FieldExamples />;
  return <InputExamples />;
}
