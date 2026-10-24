import { useState } from 'react';
import {
  Button,
  DatePicker,
  Field,
  Switch,
  TimePicker,
  type DatePickerRange,
  type DatePickerValue,
} from '@inkra/react';

import { useLocale } from '../../i18n';
import { ComponentExample } from '../ComponentExample';
import { ComponentPlayground } from '../ComponentPlayground';
import { DocsSelect } from '../DocsSelect';
import { PropertyTabs } from '../PropertyTabs';
import type { ExpansionDoc } from './types';
import './DatesExamples.css';

const initialDate = new Date(2026, 9, 22);
const initialRange: DatePickerRange = { from: initialDate, to: new Date(2026, 9, 25) };

function DatePickerExamples() {
  const { locale } = useLocale();
  const zh = locale === 'zh-CN';
  const [mode, setMode] = useState<'single' | 'range'>('single');
  const [single, setSingle] = useState<Date | undefined>(initialDate);
  const [range, setRange] = useState<DatePickerRange | undefined>(initialRange);
  const [size, setSize] = useState<'sm' | 'md' | 'lg'>('md');
  const [disabled, setDisabled] = useState(false);
  const [readOnly, setReadOnly] = useState(false);
  const [clearable, setClearable] = useState(true);
  const value: DatePickerValue = mode === 'single' ? single : range;
  const code = mode === 'single'
    ? `const [date, setDate] = useState<Date | undefined>(new Date(2026, 9, 22));\n\n<DatePicker\n  locale="${locale}"\n  size="${size}"\n  value={date}\n  onValueChange={next => setDate(next instanceof Date ? next : undefined)}\n  clearable={${clearable}}\n  disabled={${disabled}}\n  readOnly={${readOnly}}\n/>`
    : `const [range, setRange] = useState<DatePickerRange | undefined>({\n  from: new Date(2026, 9, 22),\n  to: new Date(2026, 9, 25),\n});\n\n<DatePicker\n  mode="range"\n  locale="${locale}"\n  size="${size}"\n  value={range}\n  onValueChange={next => setRange(next && !(next instanceof Date) ? next : undefined)}\n  clearable={${clearable}}\n  disabled={${disabled}}\n  readOnly={${readOnly}}\n/>`;

  return <div className="dates-examples">
    <ComponentPlayground code={code} controls={<PropertyTabs groups={[
      { label: '基础', content: <>
        <DocsSelect label={zh ? '选择模式' : 'Selection mode'} value={mode} onValueChange={next => {
          setMode(next as 'single' | 'range');
        }} options={[["single", zh ? '单日' : 'Single date'], ["range", zh ? '日期范围' : 'Date range']]} />
        <DocsSelect label={zh ? '尺寸' : 'Size'} value={size} onValueChange={next => setSize(next as typeof size)}
          options={[["sm", zh ? '小' : 'Small'], ["md", zh ? '中' : 'Medium'], ["lg", zh ? '大' : 'Large']]} />
        <Switch label={zh ? '可清空' : 'Clearable'} checked={clearable} onCheckedChange={setClearable} />
      </> },
      { label: '状态', content: <>
        <Switch label={zh ? '只读' : 'Read only'} checked={readOnly} onCheckedChange={setReadOnly} />
        <Switch label={zh ? '禁用' : 'Disabled'} checked={disabled} onCheckedChange={setDisabled} />
      </> },
    ]} />}>
      <div className="dates-examples__stage">
        <Field label={mode === 'single' ? (zh ? '出发日期' : 'Departure date') : (zh ? '住宿日期' : 'Stay dates')}>
          <DatePicker
            locale={locale}
            mode={mode}
            size={size}
            value={value}
            onValueChange={(next: DatePickerValue) => {
              if (mode === 'single') setSingle(next instanceof Date ? next : undefined);
              else setRange(next && !(next instanceof Date) ? next : undefined);
            }}
            clearable={clearable}
            disabled={disabled}
            readOnly={readOnly}
            placeholder={zh ? '选择日期' : 'Choose a date'}
            calendarLabel={zh ? '日期选择日历' : 'Date selection calendar'}
            clearButtonLabel={zh ? '清空日期' : 'Clear date'}
          />
        </Field>
      </div>
    </ComponentPlayground>

    <ComponentExample title={zh ? '基础日期选择' : 'Basic date selection'} code={`<Field label="${zh ? '出发日期' : 'Departure date'}">\n  <DatePicker locale="${locale}" defaultValue={new Date(2026, 9, 22)} />\n</Field>`}>
      <Field label={zh ? '出发日期' : 'Departure date'}>
        <DatePicker locale={locale} defaultValue={initialDate} />
      </Field>
    </ComponentExample>

    <ComponentExample title={zh ? '表单字段与重置' : 'Form fields and reset'} code={`<form>\n  <DatePicker name="departure" required defaultValue={new Date(2026, 9, 22)} />\n  <DatePicker mode="range" name="stayStart" endName="stayEnd" />\n  <button type="reset">Reset</button>\n</form>`}>
      <form className="dates-examples__form" onSubmit={event => event.preventDefault()}>
        <Field label={zh ? '出发日期' : 'Departure date'}>
          <DatePicker name="departure" required locale={locale} defaultValue={initialDate} />
        </Field>
        <Field label={zh ? '住宿日期' : 'Stay dates'}>
          <DatePicker mode="range" name="stayStart" endName="stayEnd" locale={locale} defaultValue={initialRange} />
        </Field>
        <Button type="reset" variant="outline">{zh ? '重置' : 'Reset'}</Button>
      </form>
    </ComponentExample>

    <ComponentExample title={zh ? '当地日历日期' : 'Local calendar dates'} code={`// The selected Date is serialized from local fields.\n// 2026-10-22 stays 2026-10-22 and is never converted with toISOString().\n<DatePicker name="eventDate" locale="${locale}" />`}>
      <p className="dates-examples__note">{zh
        ? 'DatePicker 保留用户选中的当地年、月、日。它不是时刻或时区转换器，表单值固定为 YYYY-MM-DD。'
        : 'DatePicker preserves the selected local year, month, and day. It is not an instant or time-zone converter; form values use YYYY-MM-DD.'}</p>
    </ComponentExample>
  </div>;
}

function TimePickerExamples() {
  const { locale } = useLocale();
  const zh = locale === 'zh-CN';
  const [value, setValue] = useState('09:30');
  const [hourCycle, setHourCycle] = useState<'h12' | 'h24'>('h24');
  const [size, setSize] = useState<'sm' | 'md' | 'lg'>('md');
  const [showSeconds, setShowSeconds] = useState(false);
  const [clearable, setClearable] = useState(true);
  const [disabled, setDisabled] = useState(false);
  const [readOnly, setReadOnly] = useState(false);
  const code = `const [time, setTime] = useState('${showSeconds ? '09:30:00' : '09:30'}');\n\n<TimePicker\n  locale="${locale}"\n  size="${size}"\n  value={time}\n  hourCycle="${hourCycle}"\n  showSeconds={${showSeconds}}\n  clearable={${clearable}}\n  disabled={${disabled}}\n  readOnly={${readOnly}}\n  onValueChange={(next: string) => setTime(next)}\n/>`;

  return <div className="dates-examples">
    <ComponentPlayground code={code} controls={<PropertyTabs groups={[
      { label: '基础', content: <>
        <DocsSelect label={zh ? '小时制' : 'Hour cycle'} value={hourCycle} onValueChange={next => setHourCycle(next as 'h12' | 'h24')} options={[["h24", zh ? '24 小时' : '24 hour'], ["h12", zh ? '12 小时' : '12 hour']]} />
        <DocsSelect label={zh ? '尺寸' : 'Size'} value={size} onValueChange={next => setSize(next as typeof size)}
          options={[["sm", zh ? '小' : 'Small'], ["md", zh ? '中' : 'Medium'], ["lg", zh ? '大' : 'Large']]} />
        <Switch label={zh ? '显示秒' : 'Show seconds'} checked={showSeconds} onCheckedChange={next => {
          setShowSeconds(next);
          setValue(current => next && current.length === 5 ? `${current}:00` : !next ? current.slice(0, 5) : current);
        }} />
        <Switch label={zh ? '可清空' : 'Clearable'} checked={clearable} onCheckedChange={setClearable} />
      </> },
      { label: '状态', content: <>
        <Switch label={zh ? '只读' : 'Read only'} checked={readOnly} onCheckedChange={setReadOnly} />
        <Switch label={zh ? '禁用' : 'Disabled'} checked={disabled} onCheckedChange={setDisabled} />
      </> },
    ]} />}>
      <div className="dates-examples__stage">
        <Field label={zh ? '集合时间' : 'Meeting time'}>
          <TimePicker
            value={value}
            onValueChange={setValue}
            hourCycle={hourCycle}
            locale={locale}
            size={size}
            showSeconds={showSeconds}
            clearable={clearable}
            disabled={disabled}
            readOnly={readOnly}
            clearButtonLabel={zh ? '清空时间' : 'Clear time'}
          />
        </Field>
      </div>
    </ComponentPlayground>

    <ComponentExample title={zh ? '基础时间选择' : 'Basic time selection'} code={`<Field label="${zh ? '出发时间' : 'Departure time'}">\n  <TimePicker defaultValue="09:30" />\n</Field>`}>
      <div className="dates-examples__stage">
        <Field label={zh ? '出发时间' : 'Departure time'}>
          <TimePicker defaultValue="09:30" locale={locale} clearButtonLabel={zh ? '清空时间' : 'Clear time'} />
        </Field>
      </div>
    </ComponentExample>

    <ComponentExample title={zh ? '边界、步进与秒' : 'Limits, steps, and seconds'} code={`<TimePicker min="08:00" max="18:00" step={900} defaultValue="09:30" />\n<TimePicker showSeconds defaultValue="09:30:15" />`}>
      <div className="dates-examples__fields">
        <Field label={zh ? '15 分钟步进' : '15-minute steps'} description="08:00–18:00">
          <TimePicker min="08:00" max="18:00" step={900} defaultValue="09:30" locale={locale} />
        </Field>
        <Field label={zh ? '秒级精度' : 'Second precision'}>
          <TimePicker showSeconds defaultValue="09:30:15" locale={locale} />
        </Field>
      </div>
    </ComponentExample>

    <ComponentExample title={zh ? '表单、空值与重置' : 'Forms, empty values, and reset'} code={`<form>\n  <TimePicker name="meetingTime" defaultValue="09:30" />\n  <button type="reset">Reset</button>\n</form>`}>
      <form className="dates-examples__form" onSubmit={event => event.preventDefault()}>
        <Field label={zh ? '集合时间' : 'Meeting time'}>
          <TimePicker name="meetingTime" defaultValue="09:30" locale={locale} clearButtonLabel={zh ? '清空时间' : 'Clear time'} />
        </Field>
        <Button type="reset" variant="outline">{zh ? '重置' : 'Reset'}</Button>
      </form>
    </ComponentExample>
  </div>;
}

export const datesDocs: Record<string, ExpansionDoc> = {
  'date-picker': {
    name: 'DatePicker',
    intro: {
      zh: '「改天」是哪天？今天就把它选出来。',
      en: '"Someday" is not a date. Pick an actual one.',
    },
    api: [
      ['mode', "'single' | 'range'"],
      ['value / defaultValue', 'Date | { from?: Date; to?: Date }'],
      ['onValueChange', "(value, { reason: 'select' | 'clear' }) => void"],
      ['locale', 'BCP 47 locale string'],
      ['name / endName', 'Local YYYY-MM-DD form fields'],
      ['disabled / readOnly / required', 'Field and form state'],
      ['calendarProps', 'Non-selection Calendar configuration'],
      ['size / fullWidth', 'sm | md (default) | lg / boolean', '共享外框视觉高度为 36/44/48px，操作命中区域至少 44px；fullWidth 控制是否撑满。', 'The shared frame is 36/44/48px high with targets of at least 44px. fullWidth controls stretching.'],
      ['clearable / clearButtonLabel', 'boolean / string', '清空图标位于共享外框的逻辑末端，保持独立按钮语义；清空不会打开弹层，焦点返回触发器。', 'The clear icon sits at the logical end inside the shared frame as a separate native button. Clearing does not open the popup and returns focus to the trigger.'],
    ],
    a11y: {
      zh: '触发器是原生按钮，Popover 负责 Escape、边界和焦点返回，DayPicker 负责日期网格的方向键导航。打开时焦点落在已选、今日或首个可用日期。',
      en: 'The trigger is a native button. Popover owns Escape, collision handling, and focus return; DayPicker owns arrow-key navigation in the date grid. Opening focuses the selected day, today, or the first available day.',
    },
    Examples: DatePickerExamples,
  },
  'time-picker': {
    name: 'TimePicker',
    intro: {
      zh: '「马上到」不算时间，几点几分才算。',
      en: '"Be there soon" is not a time. Hours and minutes, please.',
    },
    api: [
      ['value / defaultValue', "string; HH:mm / HH:mm:ss", '受控值与非受控初始值；空字符串表示未选择，提交始终使用 24 小时格式。', 'Controlled value or uncontrolled initial value. An empty string means no selection; submitted values always use 24-hour format.'],
      ['onValueChange', "(value, { reason: 'input' | 'clear' }) => void", '确认选择或清空时回调；在浮层中调整、取消或按 Escape 不提交草稿。', 'Called when applying or clearing a time. Editing, cancelling, and Escape do not commit the draft.'],
      ['hourCycle', "'h12' | 'h24'; default h24", '控制显示与小时选项；12 小时制额外提供上午、下午选择，不改变表单值格式。', 'Controls the display and hour options. The 12-hour mode adds AM/PM without changing the form value format.'],
      ['locale', 'string', '设置时间显示、浮层标题及按钮语言；中文 locale 显示中文操作名称。', 'Localizes the displayed time, popup heading, and actions. Chinese locales use Chinese action labels.'],
      ['showSeconds', 'boolean; default false', '显示秒选项，未指定 step 时使用 1 秒步进；非整分钟 step 也会显示秒。', 'Shows seconds and defaults step to one second. Non-minute steps also show seconds.'],
      ['min / max / step', 'string / string / number | "any"', '复用浏览器时间校验，支持跨午夜范围；不合范围或步进的草稿不能确认。step 单位为秒。', 'Uses browser time validation, including overnight ranges. Invalid drafts cannot be applied. Step is measured in seconds.'],
      ['clearable / clearButtonLabel / onClear', 'boolean / string / MouseEventHandler<HTMLButtonElement>', '清空图标与触发器共享外框，但保留独立原生按钮语义；清空不打开弹层，焦点返回触发器。', 'The clear icon shares the trigger frame while retaining separate native button semantics. Clearing does not open the popup and returns focus to the trigger.'],
      ['name / form / required', 'string / string / boolean', '关联原生表单字段；必填校验失败会聚焦可见触发器，重置恢复初始值。', 'Associates the native form field. Required validation focuses the visible trigger; reset restores the initial value.'],
      ['disabled / readOnly / invalid', 'boolean', '继承 Field 状态；禁用或只读时不打开浮层、不清空，invalid 显示错误状态。', 'Inherits Field state. Disabled and read-only pickers cannot open or clear; invalid marks an error.'],
      ['size / fullWidth', "'sm' | 'md' | 'lg' / boolean", '共享外框视觉高度为 36/44/48px，操作命中区域至少 44px；图标、时间与清空保持同一行。', 'The shared frame is 36/44/48px high with targets of at least 44px. Icon, time, and clear action remain on one row.'],
      ['placeholder / startIcon / endIcon', 'string / ReactNode / ReactNode', '设置空值提示及触发器两侧的装饰图标。', 'Sets the empty-value prompt and decorative icons at each end of the trigger.'],
      ['ref', 'HTMLInputElement', '指向用于校验和提交的原生时间字段；调用 focus 会转到可见触发器。选择变更请使用 onValueChange。', 'Points to the native validation/submission field. Calling focus redirects to the visible trigger. Use onValueChange for picker changes.'],
      ['onChange / onClick / onKeyDown / ...', 'InputProps', '继承的原生输入框属性和事件作用于隐藏的表单校验字段，不是可见按钮；时间选择提交请使用 onValueChange。', 'Inherited native input attributes and events belong to the hidden validation field, not the visible button. Use onValueChange for picker commits.'],
    ],
    a11y: {
      zh: '整行触发器使用原生按钮和 PencilText，Enter 或 Space 打开 Inkra Popover。时、分、秒使用具名 RadioGroup，可用方向键选择；确定后提交，取消或 Escape 放弃草稿并返回焦点。隐藏的原生时间字段仅负责表单校验和提交，不调用系统选择器。',
      en: 'A full-row native button with PencilText opens an Inkra Popover with Enter or Space. Named RadioGroups support arrow-key selection. Apply commits; Cancel or Escape discards the draft and returns focus. A hidden native time field handles only validation and submission, never the system picker.',
    },
    Examples: TimePickerExamples,
  },
};
