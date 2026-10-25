import { useMemo, useState } from 'react';
import { DatePicker, Field, InkraProvider, Input, Pagination, Select, Switch, TimePicker } from '@inkra/react';
import type { InkraDictionary, InkraLocale } from '@inkra/react';
import { PencilText, useLocale } from '../i18n';
import { CodeSample } from './CodeSample';
import { DocsSelect } from './DocsSelect';
import { ComponentPlayground } from './ComponentPlayground';
import { PropertyTabs } from './PropertyTabs';

const languages = [['zh-CN', '简体中文'], ['en', 'English'], ['ja', '日本語'], ['ko', '한국어'], ['fr', 'Français']] as const;
const sampleCopy = {
  'zh-CN': { note: '备注', team: '团队', date: '日期', time: '时间', options: ['设计', '工程', '支持'], choose: '选择你的团队', clear: '清空备注', clearDate: '重选日期' },
  en: { note: 'Note', team: 'Team', date: 'Date', time: 'Time', options: ['Design', 'Engineering', 'Support'], choose: 'Choose your team', clear: 'Clear note', clearDate: 'Reset date' },
  ja: { note: 'メモ', team: 'チーム', date: '日付', time: '時刻', options: ['デザイン', '開発', 'サポート'], choose: 'チームを選んでください', clear: 'メモを消去', clearDate: '日付をリセット' },
  ko: { note: '메모', team: '팀', date: '날짜', time: '시간', options: ['디자인', '개발', '지원'], choose: '팀을 선택하세요', clear: '메모 지우기', clearDate: '날짜 초기화' },
  fr: { note: 'Note', team: 'Équipe', date: 'Date', time: 'Heure', options: ['Design', 'Développement', 'Assistance'], choose: 'Choisir votre équipe', clear: 'Effacer la note', clearDate: 'Réinitialiser la date' },
} satisfies Record<InkraLocale, { note: string; team: string; date: string; time: string; options: string[]; choose: string; clear: string; clearDate: string }>;

export function InternationalizationExamples() {
  const { locale: docsLocale, t } = useLocale();
  const [localeOverride, setLocale] = useState<InkraLocale>();
  const locale = localeOverride ?? docsLocale;
  const [custom, setCustom] = useState(false);
  const copy = sampleCopy[locale];
  const messages = useMemo<InkraDictionary | undefined>(() => custom ? {
    'select.placeholder': copy.choose,
    'input.clear': copy.clear,
    'datePicker.clear': copy.clearDate,
  } : undefined, [custom, copy]);
  const items = useMemo(() => copy.options.map((label, index) => ({ value: String(index), label })), [copy]);
  const code = [
    "import { DatePicker, Field, InkraProvider, Input, Pagination, Select, TimePicker } from '@inkra/react';",
    "import type { InkraDictionary } from '@inkra/react';",
    '',
    ...(messages ? ['const messages = ' + JSON.stringify(messages, null, 2) + ' satisfies InkraDictionary;', ''] : []),
    'const items = ' + JSON.stringify(items, null, 2) + ';',
    '',
    '<InkraProvider locale="' + locale + '"' + (messages ? ' messages={messages}' : '') + '>',
    '  <form onSubmit={event => event.preventDefault()}>',
    '    <Field label=' + JSON.stringify(copy.note) + '>',
    '      <Input name="note" defaultValue="Inkra" clearable />',
    '    </Field>',
    '    <Field label=' + JSON.stringify(copy.team) + '>',
    '      <Select.Searchable name="team" items={items} />',
    '    </Field>',
    '    <Field label=' + JSON.stringify(copy.date) + '>',
    '      <DatePicker name="date" defaultValue={new Date(2026, 9, 25)} />',
    '    </Field>',
    '    <Field label=' + JSON.stringify(copy.time) + '>',
    '      <TimePicker name="time" defaultValue="09:30" />',
    '    </Field>',
    '    <Pagination totalPages={5} />',
    '  </form>',
    '</InkraProvider>',
  ].join('\n');

  return <section className="content-section i18n-examples" id="internationalization">
    <ComponentPlayground code={code} controls={<PropertyTabs groups={[{ label: '基础', content: <>
      <DocsSelect label="组件语言" options={languages} value={locale} onValueChange={value => setLocale(value as InkraLocale)} />
      <Switch label={t('自定义字典')} checked={custom} onCheckedChange={setCustom} />
    </> }]} />}>
    <InkraProvider locale={locale} messages={messages}>
      <form className="i18n-examples__preview" lang={locale} onSubmit={event => event.preventDefault()}>
        <div className="i18n-examples__fields">
          <Field label={copy.note}><Input name="note" defaultValue="Inkra" clearable /></Field>
          <Field label={copy.team}><Select.Searchable name="team" items={items} /></Field>
          <Field label={copy.date}><DatePicker name="date" defaultValue={new Date(2026, 9, 25)} /></Field>
          <Field label={copy.time}><TimePicker name="time" defaultValue="09:30" /></Field>
        </div>
        <Pagination totalPages={5} />
      </form>
    </InkraProvider>
    </ComponentPlayground>
    <PencilText as="p">locale 支持中文、英文、日语、韩语和法语，也接受 ja-JP、fr-CA 等地区标记。日期和数字跟随地区格式；业务文案和值由应用管理。</PencilText>
    <PencilText as="p">messages 是按 key 覆盖的部分字典。组件显式文案优先于当前 Provider，内层 Provider 继承外层覆盖；未覆盖项使用内置语言，未知语言回退英文。</PencilText>
    <CodeSample seed="i18n-dictionary-example" code={[
      "import { InkraProvider, inkraLocales } from '@inkra/react/i18n';",
      "import type { InkraDictionary } from '@inkra/react/i18n';",
      '',
      'const messages = {',
      "  'pagination.page': " + JSON.stringify(docsLocale === 'en' ? 'Open page {page}' : '打开第 {page} 页') + ',',
      "  'input.clear': " + JSON.stringify(docsLocale === 'en' ? 'Clear note' : '清空备注') + ',',
      '} satisfies InkraDictionary;',
      '',
      '<InkraProvider locale="fr-CA" messages={messages}>',
      '  {children}',
      '</InkraProvider>',
      '',
      'Object.keys(inkraLocales.en);',
    ].join('\n')} />
    <PencilText as="p">{'用 InkraDictionary 校验 key，通过 inkraLocales 查看完整字典。保留原有的占位符，如 {page}、{count}；替换只产生文本，不执行 HTML。空字符串是有效覆盖，undefined 不覆盖。'}</PencilText>
  </section>;
}
