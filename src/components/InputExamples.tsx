import { useId, useState } from 'react';
import { Button, Field, Input, Textarea, Switch, Tooltip } from '@inkra/react';
import { __iconData as searchIcon } from 'lucide-react/dist/esm/icons/search.mjs';
import { __iconData as checkIcon } from 'lucide-react/dist/esm/icons/check.mjs';
import { __iconData as mailIcon } from 'lucide-react/dist/esm/icons/mail.mjs';
import { __iconData as copyIcon } from 'lucide-react/dist/esm/icons/copy.mjs';
import { __iconData as eyeIcon } from 'lucide-react/dist/esm/icons/eye.mjs';
import { __iconData as eyeOffIcon } from 'lucide-react/dist/esm/icons/eye-off.mjs';
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
type InputKind = 'text' | 'search' | 'email' | 'url' | 'tel' | 'password';

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
  const [start, setStart] = useState(false);
  const [end, setEnd] = useState(false);
  const [clearable, setClearable] = useState(false);
  const [loading, setLoading] = useState(false);
  const [action, setAction] = useState(false);
  const [fullWidth, setFullWidth] = useState(true);
  const [disabled, setDisabled] = useState(false);
  const [readOnly, setReadOnly] = useState(false);
  const [invalid, setInvalid] = useState(false);
  const [required, setRequired] = useState(false);
  const [prefix, setPrefix] = useState('');
  const [suffix, setSuffix] = useState('');
  const [status, setStatus] = useState('');
  const password = type === 'password';
  const label = t(password ? '密码' : '名称');
  const placeholder = t(password ? '请输入密码' : '笔记名称');
  async function copyValue() {
    try {
      await navigator.clipboard.writeText(value);
      setStatus(t('已复制'));
    } catch {
      setStatus(t('复制失败，请手动选择文本'));
    }
  }
  const iconSize = size === 'sm' ? 18 : size === 'lg' ? 26 : 22;
  const code = `const [value, setValue] = useState(${quote(password ? '' : value)});
${action && !password ? `const [status, setStatus] = useState('');
async function copyValue() {
  try {
    await navigator.clipboard.writeText(value);
    setStatus(${quote(t('已复制'))});
  } catch {
    setStatus(${quote(t('复制失败，请手动选择文本'))});
  }
}
` : ''}
  <Field label=${quote(label)}${required ? ' required' : ''}${invalid ? ` invalid error=${quote(t(password ? '请输入密码' : '请输入名称'))}` : ''}>
    <Input
      name="title" type="${type}" size="${size}" variant="${variant}"
      value={value} onValueChange={setValue}
      placeholder=${quote(placeholder)}${password ? '\n      autoComplete="new-password"' : ''}
      textAlign="${textAlign}" dir="${dir}" fullWidth={${fullWidth}}
      loading={${loading}}${clearable ? ` clearable clearButtonLabel=${quote(t(password ? '清空密码' : '清空名称'))}` : ''}${disabled ? '\n      disabled' : ''}${readOnly ? '\n      readOnly' : ''}${start ? `\n      startIcon={<DocsIcon data={searchIcon} size={${iconSize}} />}` : ''}${end ? `\n      endIcon={<DocsIcon data={checkIcon} size={${iconSize}} />}` : ''}${prefix ? `\n      prefix=${quote(prefix)}` : ''}${suffix ? `\n      suffix=${quote(suffix)}` : ''}${action && !password ? `
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
    />
  </Field>`;
  return <ComponentPlayground code={code} controls={<PropertyTabs groups={[{ label: '基础', content: <>
    <DocsSelect label="尺寸" value={size} onValueChange={next => setSize(next as InputSize)} options={controlSizes} />
    <DocsSelect label="外观" value={variant} onValueChange={next => setVariant(next as InputVariant)} options={variants} />
    <DocsSelect label="输入类型" value={type} onValueChange={next => { setType(next as InputKind); setStatus(''); }} options={[['text', 'Text'], ['search', 'Search'], ['email', 'Email'], ['url', 'URL'], ['tel', 'Tel'], ['password', '密码']]} />
    <Switch label={t('撑满宽度')} checked={fullWidth} onCheckedChange={setFullWidth} />
    <DocsSelect label="内容对齐" value={textAlign} onValueChange={next => setTextAlign(next as TextAlign)} options={[['start', 'Start'], ['center', 'Center'], ['end', 'End']]} />
    <DocsSelect label="阅读方向" value={dir} onValueChange={next => setDir(next as typeof dir)} options={[['ltr', 'LTR'], ['rtl', 'RTL']]} />
  </> }, { label: '内容', content: <>
    <Field label={label}><Input type={password ? 'password' : 'text'} autoComplete={password ? 'new-password' : undefined} value={value} onChange={event => setValue(event.target.value)} /></Field>
    <Switch label={t('前置图标')} checked={start} onCheckedChange={setStart} />
    <Switch label={t('后置图标')} checked={end} onCheckedChange={setEnd} />
    <Switch label={t('尾部操作')} checked={action && !password} disabled={password} onCheckedChange={setAction} />
    {action && status && <output aria-live="polite">{status}</output>}
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
    <div className="component-demo-form">
      <Field label={label} required={required} invalid={invalid} error={invalid ? t(password ? '请输入密码' : '请输入名称') : undefined}>
        <Input
          name="title" type={type} size={size} variant={variant} value={value}
          onValueChange={setValue}
          placeholder={placeholder} autoComplete={password ? 'new-password' : undefined} clearable={clearable} clearButtonLabel={t(password ? '清空密码' : '清空名称')}
          loading={loading} disabled={disabled} readOnly={readOnly} fullWidth={fullWidth}
          textAlign={textAlign} dir={dir} prefix={prefix || undefined} suffix={suffix || undefined}
          startIcon={start ? <DocsIcon data={searchIcon} size={iconSize} /> : undefined}
          endIcon={end ? <DocsIcon data={checkIcon} size={iconSize} /> : undefined}
          endAction={action && !password ? <CopyAction size={size} disabled={disabled} onClick={() => void copyValue()} /> : undefined}
        />
      </Field>
    </div>
  </ComponentPlayground>;
}

function PasswordExample() {
  const { t } = useLocale();
  const id = useId();
  const [value, setValue] = useState('');
  const [visible, setVisible] = useState(false);
  const [disabled, setDisabled] = useState(false);
  const [readOnly, setReadOnly] = useState(false);
  const toggleLabel = t(visible ? '隐藏密码' : '显示密码');
  const code = `const id = useId();
const [value, setValue] = useState('');
const [visible, setVisible] = useState(false);
const [disabled, setDisabled] = useState(${disabled});
const [readOnly, setReadOnly] = useState(${readOnly});
const toggleLabel = visible ? ${quote(t('隐藏密码'))} : ${quote(t('显示密码'))};

<Field id={id} label=${quote(t('密码'))}>
  <Input
    id={id} name="demo-password" type={visible ? 'text' : 'password'}
    value={value} onValueChange={setValue}
    autoComplete="new-password" autoCapitalize="none" spellCheck={false}
    placeholder=${quote(t('请输入密码'))} disabled={disabled} readOnly={readOnly}
    endAction={
      <Button type="button" size="icon" variant="ghost"
        disabled={disabled} aria-label={toggleLabel} title={toggleLabel}
        aria-controls={id} aria-pressed={visible}
        onClick={() => setVisible(current => !current)}>
        <DocsIcon data={visible ? eyeOffIcon : eyeIcon} size={22} />
      </Button>
    }
  />
</Field>
<Switch label=${quote(t('只读'))} checked={readOnly} onCheckedChange={setReadOnly} />
<Switch label=${quote(t('禁用'))} checked={disabled} onCheckedChange={next => {
  setDisabled(next);
  if (next) setVisible(false);
}} />`;
  return <ComponentExample id="input-password-input" title="密码输入" code={code}>
    <div className="component-demo-form" data-password-example="">
      <Field id={id} label={t('密码')}>
        <Input
          id={id} name="demo-password" type={visible ? 'text' : 'password'}
          value={value} onValueChange={setValue}
          autoComplete="new-password" autoCapitalize="none" spellCheck={false}
          placeholder={t('请输入密码')} disabled={disabled} readOnly={readOnly}
          endAction={<Button type="button" size="icon" variant="ghost"
            disabled={disabled} aria-label={toggleLabel} title={toggleLabel}
            aria-controls={id} aria-pressed={visible}
            onClick={() => setVisible(current => !current)}>
            <DocsIcon data={visible ? eyeOffIcon : eyeIcon} size={22} />
          </Button>}
        />
      </Field>
      <Switch label={t('只读')} checked={readOnly} onCheckedChange={setReadOnly} />
      <Switch label={t('禁用')} checked={disabled} onCheckedChange={next => {
        setDisabled(next);
        if (next) setVisible(false);
      }} />
    </div>
  </ComponentExample>;
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
  return <ComponentExample id="input-clear-and-form-reset" title="清空与表单重置" code={code}>
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
  return <ComponentExample id="input-loading-and-trailing-action" title="加载与尾部操作" code={code}>
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
    <PasswordExample />
    <ComponentExample id="input-leading-and-trailing-icons" title="首尾图标" code={`<Field label=${quote(t('搜索文档'))}><Input type="search" placeholder=${quote(t('搜索文档'))} startIcon={<DocsIcon data={searchIcon} size={22} />} /></Field>\n<Field label=${quote(t('电子邮箱'))}><Input type="email" defaultValue="hello@example.com" startIcon={<DocsIcon data={mailIcon} size={22} />} endIcon={<DocsIcon data={checkIcon} size={22} />} /></Field>`}>
      <div className="input-examples__fields">
        <Field label={t('搜索文档')}><Input type="search" placeholder={t('搜索文档')} startIcon={<DocsIcon data={searchIcon} size={22} />} /></Field>
        <Field label={t('电子邮箱')}><Input type="email" defaultValue="hello@example.com" startIcon={<DocsIcon data={mailIcon} size={22} />} endIcon={<DocsIcon data={checkIcon} size={22} />} /></Field>
      </div>
    </ComponentExample>
    <ComponentExample id="input-prefix-and-suffix" title="前缀与后缀" code={`<Field label=${quote(t('网站域名'))} description=${quote(t('协议为 HTTPS'))}><Input prefix="https://" defaultValue="example.com" /></Field>\n<Field label=${quote(t('行李重量'))} description=${quote(t('单位：千克'))}><Input inputMode="decimal" suffix="kg" defaultValue="12.5" textAlign="end" /></Field>`}>
      <div className="input-examples__fields">
        <Field label={t('网站域名')} description={t('协议为 HTTPS')}><Input prefix="https://" defaultValue="example.com" /></Field>
        <Field label={t('行李重量')} description={t('单位：千克')}><Input inputMode="decimal" suffix="kg" defaultValue="12.5" textAlign="end" /></Field>
      </div>
    </ComponentExample>
    <ClearExamples />
    <ActionExamples />
    <ComponentExample id="input-appearance" title="外观" code={variants.map(([variant, label]) => `<Field label=${quote(t(label))}><Input variant="${variant}" defaultValue="Inkra" /></Field>`).join('\n')}>
      <div className="input-examples__fields">{variants.map(([variant, label]) => <Field key={variant} label={t(label)}><Input variant={variant} defaultValue="Inkra" /></Field>)}</div>
    </ComponentExample>
    <ComponentExample id="input-size" title="尺寸" code={controlSizes.map(([size, label]) => `<Field label=${quote(t(label))}><Input size="${size}" defaultValue="Inkra" /></Field>`).join('\n')}>
      <div className="input-examples__fields">{controlSizes.map(([size, label]) => <Field key={size} label={t(label)}><Input size={size} defaultValue="Inkra" /></Field>)}</div>
    </ComponentExample>
    <ComponentExample id="input-states" title="状态" code={`<Field label=${quote(t('只读'))}><Input readOnly defaultValue="Inkra" clearable clearButtonLabel=${quote(t('清空名称'))} /></Field>\n<Field label=${quote(t('禁用'))} disabled><Input defaultValue="Inkra" clearable clearButtonLabel=${quote(t('清空名称'))} /></Field>\n<Field label=${quote(t('名称'))} required error=${quote(t('请输入名称'))}><Input placeholder=${quote(t('笔记名称'))} /></Field>`}>
      <div className="input-examples__fields">
        <Field label={t('只读')}><Input readOnly defaultValue="Inkra" clearable clearButtonLabel={t('清空名称')} /></Field>
        <Field label={t('禁用')} disabled><Input defaultValue="Inkra" clearable clearButtonLabel={t('清空名称')} /></Field>
        <Field label={t('名称')} required error={t('请输入名称')}><Input placeholder={t('笔记名称')} /></Field>
      </div>
    </ComponentExample>
  </>;
}

export function TextareaExamples() {
  const { t, locale } = useLocale();
  const [value, setValue] = useState('');
  const [submitted, setSubmitted] = useState('');
  const [size, setSize] = useState<InputSize>('md');
  const [rows, setRows] = useState(3);
  const [autoSize, setAutoSize] = useState(false);
  const [maxRows, setMaxRows] = useState(6);
  const [maxLength, setMaxLength] = useState('120');
  const [countMode, setCountMode] = useState<'remaining' | 'fraction' | 'progress' | 'none'>('remaining');
  const [countDisplay, setCountDisplay] = useState<'auto' | 'always'>('auto');
  const [countThreshold, setCountThreshold] = useState('0.8');
  const [resizable, setResizable] = useState(false);
  const zh = locale === 'zh-CN';
  const countLabel = ({ remaining }: { remaining: number }) => zh
    ? remaining < 0 ? `超出 ${-remaining}` : `剩余 ${remaining}`
    : remaining < 0 ? `${-remaining} over limit` : `${remaining} remaining`;
  const [disabled, setDisabled] = useState(false);
  const [readOnly, setReadOnly] = useState(false);
  const [invalid, setInvalid] = useState(false);
  const [required, setRequired] = useState(false);
  const code = `const [value, setValue] = useState(${quote(value)});

  <Field label=${quote(t('笔记内容'))}${required ? ' required' : ''}${invalid ? ` invalid error=${quote(t('请输入笔记内容'))}` : ''}>
    <Textarea name="notes" size="${size}" rows={${rows}}${autoSize ? ` autoSize={{ minRows: ${rows}, maxRows: ${maxRows} }}` : ''}${maxLength !== 'none' ? ` maxLength={${maxLength}}` : ''}
      countMode="${countMode}" countDisplay="${countDisplay}" countThreshold={${countThreshold}} resize="${resizable ? 'vertical' : 'none'}"
      resizeLabel=${quote(zh ? '调整输入框高度' : 'Resize text area')}
      ${zh ? 'getCountLabel={({ remaining }) => remaining < 0 ? `超出 ${-remaining}` : `剩余 ${remaining}`}' : ''}
      value={value} onChange={event => setValue(event.target.value)}
      placeholder=${quote(t('写下你的想法'))}${readOnly ? ' readOnly' : ''}${disabled ? ' disabled' : ''}
    />
  </Field>`;
  return <>
    <ComponentPlayground code={code} controls={<PropertyTabs groups={[
      { label: '基础', content: <>
        <DocsSelect label="尺寸" value={size} onValueChange={next => setSize(next as InputSize)} options={controlSizes} />
        <DocsSelect label="行数" value={String(rows)} onValueChange={next => setRows(Number(next))} options={[["1", "1"], ["2", "2"], ["3", "3"], ["5", "5"]]} />
        <Switch label={zh ? '自动高度' : 'Automatic height'} checked={autoSize} onCheckedChange={setAutoSize} />
        {autoSize && <DocsSelect label={zh ? '最大正文行数' : 'Maximum text rows'} value={String(maxRows)} onValueChange={next => setMaxRows(Number(next))} options={[["3", "3"], ["6", "6"], ["10", "10"]]} />}
        <DocsSelect label="最大长度" value={maxLength} onValueChange={setMaxLength} options={[["none", "不限"], ["40", "40"], ["120", "120"], ["240", "240"]]} />
      </> },
      { label: '交互', content: <>
        <DocsSelect label={zh ? '长度提示' : 'Length indicator'} value={countMode} onValueChange={next => setCountMode(next as typeof countMode)}
          options={[['remaining', zh ? '剩余字数' : 'Remaining'], ['fraction', zh ? '已输入 / 上限' : 'Count / limit'], ['progress', zh ? '进度条' : 'Progress'], ['none', zh ? '隐藏' : 'Hidden']]} />
        <DocsSelect label={zh ? '显示时机' : 'Visibility'} value={countDisplay} onValueChange={next => setCountDisplay(next as typeof countDisplay)}
          options={[['auto', zh ? '接近上限时' : 'Near the limit'], ['always', zh ? '始终显示' : 'Always']]} />
        {countDisplay === 'auto' && <DocsSelect label={zh ? '提示阈值' : 'Threshold'} value={countThreshold} onValueChange={setCountThreshold}
          options={[['0.5', '50%'], ['0.8', '80%'], ['0.9', '90%'], ['1', '100%']]} />}
        <Switch label={zh ? '手绘高度调节' : 'Pencil resize handle'} checked={resizable} onCheckedChange={setResizable} disabled={autoSize} />
      </> },
      { label: '状态', content: <>
        <Switch label={t('必填')} checked={required} onCheckedChange={setRequired} />
        <Switch label={t('只读')} checked={readOnly} onCheckedChange={setReadOnly} />
        <Switch label={t('禁用')} checked={disabled} onCheckedChange={setDisabled} />
        <Switch label={t('错误状态')} checked={invalid} onCheckedChange={setInvalid} />
      </> },
    ]} />}>
      <div className="component-demo-form">
        <Field label={t('笔记内容')} required={required} invalid={invalid} error={invalid ? t('请输入笔记内容') : undefined}><Textarea name="notes" size={size} rows={rows} autoSize={autoSize ? { minRows: rows, maxRows } : false} maxLength={maxLength === 'none' ? undefined : Number(maxLength)} value={value} onChange={event => setValue(event.target.value)} placeholder={t('写下你的想法')} readOnly={readOnly} disabled={disabled}
          countMode={countMode} countDisplay={countDisplay} countThreshold={Number(countThreshold)} getCountLabel={countLabel} resize={resizable ? 'vertical' : 'none'} resizeLabel={zh ? '调整输入框高度' : 'Resize text area'} /></Field>
      </div>
    </ComponentPlayground>
    <ComponentExample id="input-form-submission-and-reset" title={zh ? '表单提交与重置' : 'Form submission and reset'} code={`const [submitted, setSubmitted] = useState('');
<form onSubmit={event => {
  event.preventDefault();
  setSubmitted(String(new FormData(event.currentTarget).get('notes') ?? ''));
}} onReset={() => setSubmitted('')}>
  <Field label=${quote(t('笔记内容'))}><Textarea name="notes" defaultValue="Inkra" /></Field>
  <Button type="submit">${t('读取表单')}</Button>
  <Button type="reset" variant="outline">${t('重置')}</Button>
  <output aria-live="polite">{submitted}</output>
</form>`}>
      <form className="component-demo-form" data-testid="textarea-form" onSubmit={event => {
        event.preventDefault();
        setSubmitted(String(new FormData(event.currentTarget).get('notes') ?? ''));
      }} onReset={() => setSubmitted('')}>
        <Field label={t('笔记内容')}><Textarea name="notes" defaultValue="Inkra" /></Field>
        <div className="component-demo-actions"><Button type="submit">{t('读取表单')}</Button><Button type="reset" variant="outline">{t('重置')}</Button></div>
        <output aria-live="polite">{submitted}</output>
      </form>
    </ComponentExample>
    <ComponentExample id="input-auto-size" title={zh ? '从一行增长到最多六行' : 'Grow from one to six rows'} code={`<Field label=${quote(t('笔记内容'))}><Textarea autoSize={{ minRows: 1, maxRows: 6 }} placeholder=${quote(t('写下你的想法'))} /></Field>`}>
      <Field label={t('笔记内容')}><Textarea autoSize={{ minRows: 1, maxRows: 6 }} placeholder={t('写下你的想法')} /></Field>
    </ComponentExample>
    <ComponentExample id="input-rows-and-length-limits" title="行数与长度限制" code={`<Field label=${quote(t('简短备注'))} description=${quote(t('最多 40 个 UTF-16 码元'))}><Textarea rows={2} maxLength={40} countMode="fraction" countDisplay="always" placeholder=${quote(t('写下你的想法'))} /></Field>\n<Field label=${quote(t('笔记内容'))} description=${quote(t('最多 120 个 UTF-16 码元'))}><Textarea rows={5} maxLength={120} countMode="progress" countDisplay="always" defaultValue="Inkra" /></Field>`}>
      <div className="input-examples__fields">
        <Field label={t('简短备注')} description={t('最多 40 个 UTF-16 码元')}><Textarea rows={2} maxLength={40} countMode="fraction" countDisplay="always" placeholder={t('写下你的想法')} /></Field>
        <Field label={t('笔记内容')} description={t('最多 120 个 UTF-16 码元')}><Textarea rows={5} maxLength={120} countMode="progress" countDisplay="always" defaultValue="Inkra" /></Field>
      </div>
    </ComponentExample>
    <ComponentExample id="input-states-textarea" title="状态" code={`<Field label=${quote(t('只读'))}><Textarea readOnly rows={3} defaultValue="Inkra" /></Field>\n<Field label=${quote(t('禁用'))} disabled><Textarea rows={3} defaultValue="Inkra" /></Field>`}>
      <div className="input-examples__fields"><Field label={t('只读')}><Textarea readOnly rows={3} defaultValue="Inkra" /></Field><Field label={t('禁用')} disabled><Textarea rows={3} defaultValue="Inkra" /></Field></div>
    </ComponentExample>
  </>;
}

export function FieldExamples() {
  const { t } = useLocale();
  const [value, setValue] = useState('');
  const [required, setRequired] = useState(false);
  const [disabled, setDisabled] = useState(false);
  const [readOnly, setReadOnly] = useState(false);
  const [description, setDescription] = useState(false);
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
    <ComponentExample id="input-labels-descriptions-and-errors" title="标签、描述与错误" code={`<Field label=${quote(t('名称'))} required description=${quote(t('用于识别这条笔记'))}><Input placeholder=${quote(t('笔记名称'))} /></Field>\n<Field label=${quote(t('笔记内容'))} required error=${quote(t('请输入笔记内容'))}><Textarea /></Field>`}>
      <div className="input-examples__fields"><Field label={t('名称')} required description={t('用于识别这条笔记')}><Input placeholder={t('笔记名称')} /></Field><Field label={t('笔记内容')} required error={t('请输入笔记内容')}><Textarea /></Field></div>
    </ComponentExample>
  </>;
}

export function FormInputExamples({ kind }: { kind: 'input' | 'textarea' | 'field' }) {
  if (kind === 'textarea') return <TextareaExamples />;
  if (kind === 'field') return <FieldExamples />;
  return <InputExamples />;
}
