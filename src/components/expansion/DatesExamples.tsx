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
const localDate = (date: Date | undefined) => date
  ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
  : '';

function DatePickerExamples() {
  const { locale } = useLocale();
  const zh = locale === 'zh-CN';
  const [mode, setMode] = useState<'single' | 'range'>('single');
  const [single, setSingle] = useState<Date | undefined>(initialDate);
  const [range, setRange] = useState<DatePickerRange | undefined>(initialRange);
  const [disabled, setDisabled] = useState(false);
  const [readOnly, setReadOnly] = useState(false);
  const [clearable, setClearable] = useState(true);
  const value: DatePickerValue = mode === 'single' ? single : range;
  const summary = mode === 'single'
    ? localDate(single)
    : `${localDate(range?.from)} → ${localDate(range?.to)}`;
  const code = mode === 'single'
    ? `const [date, setDate] = useState<Date | undefined>(new Date(2026, 9, 22));\n\n<DatePicker\n  locale="${locale}"\n  value={date}\n  onValueChange={next => setDate(next instanceof Date ? next : undefined)}\n  clearable={${clearable}}\n  disabled={${disabled}}\n  readOnly={${readOnly}}\n/>`
    : `const [range, setRange] = useState<DatePickerRange | undefined>({\n  from: new Date(2026, 9, 22),\n  to: new Date(2026, 9, 25),\n});\n\n<DatePicker\n  mode="range"\n  locale="${locale}"\n  value={range}\n  onValueChange={next => setRange(next && !(next instanceof Date) ? next : undefined)}\n  clearable={${clearable}}\n  disabled={${disabled}}\n  readOnly={${readOnly}}\n/>`;

  return <div className="dates-examples">
    <ComponentPlayground code={code} controls={<PropertyTabs groups={[
      { label: '基础', content: <>
        <DocsSelect label={zh ? '选择模式' : 'Selection mode'} value={mode} onValueChange={next => {
          setMode(next as 'single' | 'range');
        }} options={[["single", zh ? '单日' : 'Single date'], ["range", zh ? '日期范围' : 'Date range']]} />
        <Switch label={zh ? '可清空' : 'Clearable'} checked={clearable} onCheckedChange={setClearable} />
      </> },
      { label: '状态', content: <>
        <Switch label={zh ? '只读' : 'Read only'} checked={readOnly} onCheckedChange={setReadOnly} />
        <Switch label={zh ? '禁用' : 'Disabled'} checked={disabled} onCheckedChange={setDisabled} />
      </> },
    ]} />}>
      <div className="dates-examples__stage">
        <Field label={mode === 'single' ? (zh ? '出发日期' : 'Departure date') : (zh ? '住宿日期' : 'Stay dates')} description={zh ? '值始终表示当地日历日期' : 'Values always represent local calendar dates'}>
          <DatePicker
            locale={locale}
            mode={mode}
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
        <output className="dates-examples__status" aria-live="polite">{summary || (zh ? '未选择' : 'No selection')}</output>
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
  const [showSeconds, setShowSeconds] = useState(false);
  const [clearable, setClearable] = useState(true);
  const [disabled, setDisabled] = useState(false);
  const [readOnly, setReadOnly] = useState(false);
  const code = `const [time, setTime] = useState('${showSeconds ? '09:30:00' : '09:30'}');\n\n<TimePicker\n  locale="${locale}"\n  value={time}\n  hourCycle="${hourCycle}"\n  showSeconds={${showSeconds}}\n  clearable={${clearable}}\n  disabled={${disabled}}\n  readOnly={${readOnly}}\n  onValueChange={(next: string) => setTime(next)}\n/>`;

  return <div className="dates-examples">
    <ComponentPlayground code={code} controls={<PropertyTabs groups={[
      { label: '基础', content: <>
        <DocsSelect label={zh ? '小时制偏好' : 'Hour-cycle hint'} value={hourCycle} onValueChange={next => setHourCycle(next as 'h12' | 'h24')} options={[["h24", zh ? '24 小时偏好' : 'Prefer 24 hour'], ["h12", zh ? '12 小时偏好' : 'Prefer 12 hour']]} />
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
        <Field label={zh ? '集合时间' : 'Meeting time'} description={zh ? '原生时间字段，保留浏览器校验' : 'Native time field with browser validation'}>
          <TimePicker
            value={value}
            onValueChange={setValue}
            hourCycle={hourCycle}
            locale={hourCycle === 'h12' ? 'en-US' : locale}
            showSeconds={showSeconds}
            clearable={clearable}
            disabled={disabled}
            readOnly={readOnly}
            clearButtonLabel={zh ? '清空时间' : 'Clear time'}
          />
        </Field>
        <output className="dates-examples__status" aria-live="polite">{value || (zh ? '空值' : 'Empty value')}</output>
      </div>
    </ComponentPlayground>

    <ComponentExample title={zh ? '基础时间选择' : 'Basic time selection'} code={`<Field label="${zh ? '出发时间' : 'Departure time'}">\n  <TimePicker defaultValue="09:30" />\n</Field>`}>
      <Field label={zh ? '出发时间' : 'Departure time'}>
        <TimePicker defaultValue="09:30" locale={locale} clearButtonLabel={zh ? '清空时间' : 'Clear time'} />
      </Field>
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
      ['value / defaultValue', "Native HH:mm or HH:mm:ss string; '' is empty"],
      ['onValueChange', "(value, { reason: 'input' | 'clear' }) => void"],
      ['hourCycle', "'h12' | 'h24' locale/display hint; user agent may override"],
      ['showSeconds', 'Defaults step to 1 second'],
      ['min / max / step', 'Native time constraints'],
      ['name / form / required', 'Native form attributes'],
      ['disabled / readOnly', 'Native control state'],
    ],
    a11y: {
      zh: '组件保留 input[type=time] 的原生语义、浏览器校验、键盘操作和移动选择器。清空按钮有独立名称，清空后焦点回到时间输入。',
      en: 'The component preserves native input[type=time] semantics, browser validation, keyboard behavior, and mobile pickers. The clear button has its own name and returns focus to the time input.',
    },
    Examples: TimePickerExamples,
  },
};
