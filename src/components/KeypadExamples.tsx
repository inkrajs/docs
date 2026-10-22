import { useMemo, useState } from 'react';
import { Button, Field, Input, Keypad, Switch, type KeypadKey, type KeypadPressDetails } from '@inkra/react';

import { useLocale } from '../i18n';
import { ComponentExample } from './ComponentExample';
import { ComponentPlayground } from './ComponentPlayground';
import { DocsSelect } from './DocsSelect';
import { PropertyTabs } from './PropertyTabs';
import './KeypadExamples.css';

const numericLayout: readonly (readonly KeypadKey[])[] = ([
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  [
    { id: 'delete', label: 'Delete', ariaLabel: 'Delete last character', action: 'delete', variant: 'secondary' },
    { id: 'zero', label: '0', value: '0' },
    { id: 'confirm', label: 'Confirm', action: 'confirm', variant: 'confirm' },
  ],
] as const).map((row, rowIndex) => row.map((key, keyIndex): KeypadKey => typeof key === 'string'
  ? { id: `number-${rowIndex}-${keyIndex}`, label: key, value: key }
  : key));

const compactLayout: readonly (readonly KeypadKey[])[] = [
  [
    { id: 'a', label: 'A', value: 'A' },
    { id: 'b', label: 'B', value: 'B' },
    { id: 'long', label: 'Long custom label / 自定义长标签', value: '-' },
  ],
  [
    { id: 'remove', label: 'Delete / 删除', action: 'delete', variant: 'secondary' },
    { id: 'accept', label: 'Confirm / 确认', action: 'confirm', span: 2, variant: 'confirm' },
  ],
];

const passwordLayout: readonly (readonly KeypadKey[])[] = ([
  ['1', '2', '3'], ['4', '5', '6'], ['7', '8', '9'],
  [
    { id: 'password-delete', label: 'Delete / 删除', action: 'delete', variant: 'secondary' },
    { id: 'password-zero', label: '0', value: '0' },
    { id: 'password-confirm', label: 'Unlock / 解锁', action: 'confirm', variant: 'confirm' },
  ],
] as const).map((row, rowIndex) => row.map((key, keyIndex): KeypadKey => typeof key === 'string'
  ? { id: `password-${rowIndex}-${keyIndex}`, label: key, value: key }
  : key));

const operations: readonly (readonly KeypadKey[])[] = [
  [
    { id: 'previous', label: 'Previous / 上一步', action: 'custom' },
    { id: 'pause', label: 'Pause / 暂停', action: 'custom' },
  ],
  [
    { id: 'disabled', label: 'Unavailable / 暂不可用', action: 'custom', disabled: true },
    { id: 'complete', label: 'Complete operation / 完成操作', action: 'custom', variant: 'confirm' },
  ],
];

function eventText(details: KeypadPressDetails) {
  return `${details.action}: ${details.key.id} (${details.previousValue} -> ${details.nextValue})`;
}

export function KeypadExamples() {
  const { t } = useLocale();
  const [value, setValue] = useState('12');
  const [layoutName, setLayoutName] = useState<'numeric' | 'custom'>('numeric');
  const [disabled, setDisabled] = useState(false);
  const [maxLength, setMaxLength] = useState('6');
  const [lastEvent, setLastEvent] = useState('');
  const [password, setPassword] = useState('');
  const [passwordStatus, setPasswordStatus] = useState('');
  const [operation, setOperation] = useState('');
  const layout = layoutName === 'numeric' ? numericLayout : compactLayout;
  const limit = Number(maxLength);
  const code = useMemo(() => `const [value, setValue] = useState(${JSON.stringify(value)});

<Field label="${t('可编辑值 / Editable value')}">
  <Input value={value} onValueChange={setValue} maxLength={${limit}} />
</Field>
<Keypad
  label="${t('输入面板 / Entry keypad')}"
  layout={${layoutName === 'numeric' ? 'numericLayout' : 'customLayout'}}
  value={value}
  onValueChange={setValue}
  onKeyPress={details => console.log(details)}
  onConfirm={current => submit(current)}
  maxLength={${limit}}
  disabled={${disabled}}
/>`, [disabled, layoutName, limit, t, value]);

  return <>
    <ComponentPlayground code={code} controls={<PropertyTabs groups={[
      { label: t('内容'), content: <>
        <DocsSelect label={t('按键排列 / Key layout')} value={layoutName} onValueChange={next => setLayoutName(next as typeof layoutName)} options={[
          ['numeric', '数字面板 / Numeric'],
          ['custom', '自定义字符 / Custom characters'],
        ]} />
        <DocsSelect label={t('最大长度 / Maximum length')} value={maxLength} onValueChange={setMaxLength} options={[
          ['4', '4'], ['6', '6'], ['12', '12'],
        ]} />
      </> },
      { label: t('状态'), content: <Switch label={t('禁用 / Disabled')} checked={disabled} onCheckedChange={setDisabled} /> },
    ]} />}>
      <div className="keypad-example__playground" data-testid="keypad-playground">
        <Field label={t('可编辑值 / Editable value')} description={t('实体键盘与按键面板都可输入 / Physical keyboard and keypad both work')}>
          <Input value={value} onValueChange={setValue} maxLength={limit} disabled={disabled} />
        </Field>
        <Keypad
          disabled={disabled}
          label={t('输入面板 / Entry keypad')}
          layout={layout}
          maxLength={limit}
          onConfirm={current => setLastEvent(`${t('确认 / Confirm')}: ${current}`)}
          onKeyPress={details => setLastEvent(eventText(details))}
          onValueChange={setValue}
          value={value}
        />
        <output className="keypad-example__status" aria-live="polite">{lastEvent || t('等待按键 / Waiting for a key')}</output>
      </div>
    </ComponentPlayground>

    <ComponentExample title={t('密码面板 / Password keypad')} code={`<Input type="password" inputMode="numeric" value={password} onValueChange={setPassword} />
<Keypad layout={passwordLayout} value={password} onValueChange={setPassword} maxLength={6}
  onConfirm={value => verifyPin(value)} />`}>
      <div className="keypad-example__stack" data-testid="keypad-password">
        <Field label={t('访问码 / Access code')} description={t('可直接使用实体键盘 / Physical keyboard remains available')}>
          <Input type="password" inputMode="numeric" autoComplete="off" value={password} onValueChange={setPassword} maxLength={6} />
        </Field>
        <Keypad label={t('密码按键 / Password keys')} layout={passwordLayout} value={password} onValueChange={setPassword} maxLength={6} onConfirm={current => setPasswordStatus(current.length === 6 ? t('长度有效 / Length accepted') : t('请输入六位 / Enter six digits'))} />
        <output className="keypad-example__status" aria-live="polite">{passwordStatus}</output>
      </div>
    </ComponentExample>

    <ComponentExample title={t('操作面板 / Operation panel')} code={`<Keypad layout={operations} onKeyPress={({ key }) => runAction(key.id)} />`}>
      <div className="keypad-example__stack" data-testid="keypad-operations">
        <Keypad label={t('编辑操作 / Editing actions')} layout={operations} onKeyPress={({ key }) => setOperation(key.id)} />
        <div className="keypad-example__operation-row">
          <output className="keypad-example__status" aria-live="polite">{operation || t('尚未选择操作 / No action selected')}</output>
          <Button variant="ghost" onClick={() => setOperation('')}>{t('清除状态 / Clear status')}</Button>
        </div>
      </div>
    </ComponentExample>
  </>;
}
