import { useMemo, useState } from 'react';
import { Button, Field, Input, Keypad, Switch, type KeypadKey } from '@inkra/react';

import { useLocale } from '../i18n';
import { ComponentExample } from './ComponentExample';
import { ComponentPlayground } from './ComponentPlayground';
import { DocsSelect } from './DocsSelect';
import { PropertyTabs } from './PropertyTabs';
import './KeypadExamples.css';

const numericLayoutMessages: readonly (readonly KeypadKey[])[] = ([
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  [
    { id: 'delete', label: '删除', ariaLabel: '删除最后一个字符', action: 'delete', variant: 'secondary' },
    { id: 'zero', label: '0', value: '0' },
    { id: 'confirm', label: '确认', action: 'confirm', variant: 'confirm' },
  ],
] as const).map((row, rowIndex) => row.map((key, keyIndex): KeypadKey => typeof key === 'string'
  ? { id: `number-${rowIndex}-${keyIndex}`, label: key, value: key }
  : key));

const compactLayoutMessages: readonly (readonly KeypadKey[])[] = [
  [
    { id: 'a', label: 'A', value: 'A' },
    { id: 'b', label: 'B', value: 'B' },
    { id: 'long', label: '自定义长标签', value: '-' },
  ],
  [
    { id: 'remove', label: '删除', action: 'delete', variant: 'secondary' },
    { id: 'accept', label: '确认', action: 'confirm', span: 2, variant: 'confirm' },
  ],
];

const passwordLayoutMessages: readonly (readonly KeypadKey[])[] = ([
  ['1', '2', '3'], ['4', '5', '6'], ['7', '8', '9'],
  [
    { id: 'password-delete', label: '删除', action: 'delete', variant: 'secondary' },
    { id: 'password-zero', label: '0', value: '0' },
    { id: 'password-confirm', label: '解锁', action: 'confirm', variant: 'confirm' },
  ],
] as const).map((row, rowIndex) => row.map((key, keyIndex): KeypadKey => typeof key === 'string'
  ? { id: `password-${rowIndex}-${keyIndex}`, label: key, value: key }
  : key));

const operationMessages: readonly (readonly KeypadKey[])[] = [
  [
    { id: 'previous', label: '上一步', action: 'custom' },
    { id: 'pause', label: '暂停', action: 'custom' },
  ],
  [
    { id: 'disabled', label: '暂不可用', action: 'custom', disabled: true },
    { id: 'complete', label: '完成操作', action: 'custom', variant: 'confirm' },
  ],
];

export function KeypadExamples() {
  const { t } = useLocale();
  const localizeLayout = (rows: readonly (readonly KeypadKey[])[]) => rows.map(row => row.map(key => ({
    ...key,
    label: typeof key.label === 'string' ? t(key.label) : key.label,
    ariaLabel: key.ariaLabel ? t(key.ariaLabel) : undefined,
  })));
  const numericLayout = localizeLayout(numericLayoutMessages);
  const compactLayout = localizeLayout(compactLayoutMessages);
  const passwordLayout = localizeLayout(passwordLayoutMessages);
  const operations = localizeLayout(operationMessages);
  const [value, setValue] = useState('12');
  const [layoutName, setLayoutName] = useState<'numeric' | 'custom'>('numeric');
  const [disabled, setDisabled] = useState(false);
  const [maxLength, setMaxLength] = useState('6');
  const [password, setPassword] = useState('');
  const [passwordStatus, setPasswordStatus] = useState('');
  const [operation, setOperation] = useState('');
  const layout = layoutName === 'numeric' ? numericLayout : compactLayout;
  const limit = Number(maxLength);
  const code = useMemo(() => `const [value, setValue] = useState(${JSON.stringify(value)});

<Field label="${t('可编辑值')}">
  <Input value={value} onValueChange={setValue} maxLength={${limit}} />
</Field>
<Keypad
  label="${t('输入面板')}"
  layout={${layoutName === 'numeric' ? 'numericLayout' : 'customLayout'}}
  value={value}
  onValueChange={setValue}
  maxLength={${limit}}
  disabled={${disabled}}
/>`, [disabled, layoutName, limit, t, value]);

  return <>
    <ComponentPlayground code={code} controls={<PropertyTabs groups={[
      { label: t('内容'), content: <>
        <DocsSelect label={t('按键排列')} value={layoutName} onValueChange={next => setLayoutName(next as typeof layoutName)} options={[
          ['numeric', '数字面板'],
          ['custom', '自定义字符'],
        ]} />
        <DocsSelect label={t('最大长度')} value={maxLength} onValueChange={setMaxLength} options={[
          ['4', '4'], ['6', '6'], ['12', '12'],
        ]} />
      </> },
      { label: t('状态'), content: <Switch label={t('禁用')} checked={disabled} onCheckedChange={setDisabled} /> },
    ]} />}>
      <div className="keypad-example__playground" data-testid="keypad-playground">
        <Field label={t('可编辑值')}>
          <Input value={value} onValueChange={setValue} maxLength={limit} disabled={disabled} />
        </Field>
        <Keypad
          disabled={disabled}
          label={t('输入面板')}
          layout={layout}
          maxLength={limit}
          onValueChange={setValue}
          value={value}
        />
      </div>
    </ComponentPlayground>

    <ComponentExample title={t('密码面板')} code={`<Input type="password" inputMode="numeric" value={password} onValueChange={setPassword} />
<Keypad layout={passwordLayout} value={password} onValueChange={setPassword} maxLength={6}
  onConfirm={value => verifyPin(value)} />`}>
      <div className="keypad-example__stack" data-testid="keypad-password">
        <Field label={t('访问码')} description={t('可直接使用实体键盘')}>
          <Input type="password" inputMode="numeric" autoComplete="off" value={password} onValueChange={setPassword} maxLength={6} />
        </Field>
        <Keypad label={t('密码按键')} layout={passwordLayout} value={password} onValueChange={setPassword} maxLength={6} onConfirm={current => setPasswordStatus(current.length === 6 ? '长度有效' : '请输入六位')} />
        <output className="keypad-example__status" aria-live="polite">{t(passwordStatus)}</output>
      </div>
    </ComponentExample>

    <ComponentExample title={t('操作面板')} code={`<Keypad layout={operations} onKeyPress={({ key }) => runAction(key.id)} />`}>
      <div className="keypad-example__stack" data-testid="keypad-operations">
        <Keypad label={t('编辑操作')} layout={operations} onKeyPress={({ key }) => setOperation(key.id)} />
        <div className="keypad-example__operation-row">
          <output className="keypad-example__status" aria-live="polite">{operation ? operations.flat().find(key => key.id === operation)?.label : t('尚未选择操作')}</output>
          <Button variant="ghost" onClick={() => setOperation('')}>{t('清除状态')}</Button>
        </div>
      </div>
    </ComponentExample>
  </>;
}
