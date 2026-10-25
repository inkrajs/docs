import { useState } from 'react';
import {
  Field,
  Hotkey,
  HotkeyInput,
  PencilLine,
  Switch,
  type HotkeyPlatform,
  type HotkeyValue,
} from '@inkra/react';
import { PencilText, useLocale } from '../i18n';
import { ComponentExample } from './ComponentExample';
import { ComponentPlayground } from './ComponentPlayground';
import { DocsSelect, controlSizes } from './DocsSelect';
import { PropertyTabs } from './PropertyTabs';
import './HotkeyExamples.css';

type HotkeySize = 'sm' | 'md' | 'lg';

const saveShortcut: HotkeyValue = { key: 'S', code: 'KeyS', modifiers: ['meta'] };
const findShortcut: HotkeyValue = { key: 'F', code: 'KeyF', modifiers: ['control', 'shift'] };
const paletteShortcut: HotkeyValue = { key: 'K', code: 'KeyK', modifiers: ['control'] };

function sameHotkey(left: HotkeyValue, right: HotkeyValue) {
  return left.key === right.key
    && left.code === right.code
    && JSON.stringify(left.modifiers ?? []) === JSON.stringify(right.modifiers ?? []);
}

function HotkeyPlayground() {
  const { locale } = useLocale();
  const zh = locale === 'zh-CN';
  const [value, setValue] = useState<HotkeyValue | null>(saveShortcut);
  const [platform, setPlatform] = useState<HotkeyPlatform>('auto');
  const [size, setSize] = useState<HotkeySize>('md');
  const [clearable, setClearable] = useState(true);
  const [blurOnCapture, setBlurOnCapture] = useState(true);
  const [disabled, setDisabled] = useState(false);
  const [readOnly, setReadOnly] = useState(false);
  const [checkConflict, setCheckConflict] = useState(false);
  const placeholder = zh ? '按下快捷键' : 'Press a shortcut';
  const recordingLabel = zh ? '正在录入，请按组合键…' : 'Recording: press a shortcut...';
  const clearButtonLabel = zh ? '清除快捷键' : 'Clear shortcut';
  const conflictMessage = zh ? '快捷键已被占用' : 'Shortcut already assigned';
  const code = `const [shortcut, setShortcut] = useState<HotkeyValue | null>(${JSON.stringify(value)});

<Field label="${zh ? '命令面板快捷键' : 'Command palette shortcut'}">
  <HotkeyInput
    value={shortcut}
    onValueChange={setShortcut}
    platform="${platform}" size="${size}"
    clearable={${clearable}} blurOnCapture={${blurOnCapture}}
    disabled={${disabled}} readOnly={${readOnly}}
    placeholder="${placeholder}"
    recordingLabel="${recordingLabel}"
    clearButtonLabel="${clearButtonLabel}"
    conflictMessage="${conflictMessage}"
    validateHotkey={shortcut =>
      ${checkConflict} && shortcut.code === 'KeyK' && shortcut.modifiers?.includes('control')
        ? '${zh ? '已分配给快速打开' : 'Already assigned to Quick Open'}'
        : undefined
    }
  />
</Field>`;

  return <ComponentPlayground code={code} controls={<PropertyTabs groups={[
    { label: zh ? '基础' : 'Basics', content: <>
      <DocsSelect label={zh ? '平台显示' : 'Platform'} value={platform} onValueChange={next => setPlatform(next as HotkeyPlatform)} options={[
        ['auto', zh ? '自动' : 'Auto'], ['mac', 'macOS'], ['windows', 'Windows'],
      ]} />
      <DocsSelect label={zh ? '尺寸' : 'Size'} value={size} onValueChange={next => setSize(next as HotkeySize)} options={controlSizes} />
    </> },
    { label: zh ? '交互' : 'Interaction', content: <>
      <Switch label={zh ? '录入后失焦' : 'Blur after capture'} checked={blurOnCapture} onCheckedChange={setBlurOnCapture} />
      <Switch label={zh ? '允许清除' : 'Clearable'} checked={clearable} onCheckedChange={setClearable} />
      <Switch label={zh ? '检查冲突' : 'Validate conflict'} checked={checkConflict} onCheckedChange={setCheckConflict} />
    </> },
    { label: zh ? '状态' : 'State', content: <>
      <Switch label={zh ? '只读' : 'Read only'} checked={readOnly} onCheckedChange={setReadOnly} />
      <Switch label={zh ? '禁用' : 'Disabled'} checked={disabled} onCheckedChange={setDisabled} />
    </> },
  ]} />}>
    <div className="hotkey-examples__stage">
      <Field
        label={zh ? '命令面板快捷键' : 'Command palette shortcut'}
      >
        <HotkeyInput
          aria-label={zh ? '录入命令面板快捷键' : 'Record command palette shortcut'}
          blurOnCapture={blurOnCapture}
          clearable={clearable}
          clearButtonLabel={clearButtonLabel}
          conflictMessage={conflictMessage}
          disabled={disabled}
          onValueChange={setValue}
          platform={platform}
          placeholder={placeholder}
          readOnly={readOnly}
          recordingLabel={recordingLabel}
          size={size}
          validateHotkey={shortcut => checkConflict && sameHotkey(shortcut, paletteShortcut)
            ? (zh ? '已分配给快速打开' : 'Already assigned to Quick Open')
            : undefined}
          value={value}
        />
      </Field>
    </div>
  </ComponentPlayground>;
}

function ShortcutRow({ label, shortcut, platform = 'auto' }: { label: string; shortcut: HotkeyValue; platform?: HotkeyPlatform }) {
  return <div className="hotkey-examples__row"><PencilText>{label}</PencilText><Hotkey value={shortcut} platform={platform} /><PencilLine className="hotkey-examples__divider" /></div>;
}

export function HotkeyExamples() {
  const { locale } = useLocale();
  const zh = locale === 'zh-CN';
  return <div className="component-examples hotkey-examples">
    <HotkeyPlayground />
    <ComponentExample id="hotkey-editor-shortcuts" title={zh ? '编辑器快捷键' : 'Editor shortcuts'} code={`<Hotkey value={{ key: 'S', code: 'KeyS', modifiers: ['meta'] }} />
<Hotkey value={{ key: 'F', code: 'KeyF', modifiers: ['control', 'shift'] }} />`}>
      <div className="hotkey-examples__list">
        <ShortcutRow label={zh ? '保存文档' : 'Save document'} shortcut={saveShortcut} />
        <ShortcutRow label={zh ? '在文件中查找' : 'Find in files'} shortcut={findShortcut} />
        <ShortcutRow label={zh ? '快速打开' : 'Quick open'} shortcut={paletteShortcut} />
      </div>
    </ComponentExample>
    <ComponentExample id="hotkey-uncontrolled-recording-and-conflicts" title={zh ? '非受控录入与冲突校验' : 'Uncontrolled recording and conflicts'} code={`<Field label="${zh ? '格式化文档' : 'Format document'}">
  <HotkeyInput
    defaultValue={{ key: 'F', code: 'KeyF', modifiers: ['alt', 'shift'] }}
    placeholder="${zh ? '按下快捷键' : 'Press a shortcut'}"
    recordingLabel="${zh ? '正在录入，请按组合键…' : 'Recording: press a shortcut...'}"
    clearButtonLabel="${zh ? '清除快捷键' : 'Clear shortcut'}"
    validateHotkey={shortcut => isReserved(shortcut) ? '${zh ? '此快捷键由系统保留' : 'Reserved by the system'}' : undefined}
  />
</Field>`}>
      <Field label={zh ? '格式化文档' : 'Format document'}>
        <HotkeyInput
          aria-label={zh ? '录入格式化快捷键' : 'Record format shortcut'}
          clearButtonLabel={zh ? '清除快捷键' : 'Clear shortcut'}
          conflictMessage={zh ? '此快捷键由系统保留' : 'Reserved by the system'}
          defaultValue={{ key: 'F', code: 'KeyF', modifiers: ['alt', 'shift'] }}
          placeholder={zh ? '按下快捷键' : 'Press a shortcut'}
          recordingLabel={zh ? '正在录入，请按组合键…' : 'Recording: press a shortcut...'}
          validateHotkey={shortcut => shortcut.key === 'Tab' ? (zh ? 'Tab 保留用于焦点导航' : 'Tab is reserved for focus navigation') : undefined}
        />
      </Field>
    </ComponentExample>
    <ComponentExample id="hotkey-game-action-mapping" title={zh ? '游戏操作映射' : 'Game action mapping'} code={`<Field label="${zh ? '打开地图' : 'Open map'}">
  <HotkeyInput
    defaultValue={{ key: 'M', code: 'KeyM' }}
    blurOnCapture={false}
    clearButtonLabel="${zh ? '清除按键' : 'Clear key'}"
    placeholder="${zh ? '按下按键' : 'Press a key'}"
    recordingLabel="${zh ? '正在录入，请按按键…' : 'Recording: press a key...'}"
  />
</Field>
<Field label="${zh ? '冲刺' : 'Sprint'}">
  <HotkeyInput
    defaultValue={{ key: 'Shift', code: 'ShiftLeft' }}
    clearButtonLabel="${zh ? '清除按键' : 'Clear key'}"
    readOnly
  />
</Field>`}>
      <div className="hotkey-examples__grid">
        <Field label={zh ? '打开地图' : 'Open map'}><HotkeyInput
          aria-label={zh ? '录入打开地图按键' : 'Record open map key'}
          blurOnCapture={false}
          clearButtonLabel={zh ? '清除按键' : 'Clear key'}
          defaultValue={{ key: 'M', code: 'KeyM' }}
          placeholder={zh ? '按下按键' : 'Press a key'}
          recordingLabel={zh ? '正在录入，请按按键…' : 'Recording: press a key...'}
        /></Field>
        <Field label={zh ? '冲刺' : 'Sprint'}><HotkeyInput
          aria-label={zh ? '冲刺按键' : 'Sprint key'}
          clearButtonLabel={zh ? '清除按键' : 'Clear key'}
          placeholder={zh ? '未设置按键' : 'No key assigned'}
          value={{ key: 'Shift', code: 'ShiftLeft' }}
          readOnly
        /></Field>
      </div>
    </ComponentExample>
  </div>;
}
