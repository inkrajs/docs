import { PropertyTabs } from './PropertyTabs';
import { lazy, Suspense, useState, type FormEvent } from 'react';
import { Button, Checkbox, PencilLine, RadioGroup, RadioGroupItem, Switch } from 'inkra';
import { PencilText, useLocale } from '../i18n';
import { ComponentExample } from './ComponentExample';
import { ComponentPlayground } from './ComponentPlayground';
import { ComponentPageTabs, type ComponentPageTab } from './ComponentPageTabs';
import { PageHeading } from './PageHeading';
import { __iconData as monitorIcon } from 'lucide-react/dist/esm/icons/monitor.mjs';
import { __iconData as sunIcon } from 'lucide-react/dist/esm/icons/sun.mjs';
import { __iconData as moonIcon } from 'lucide-react/dist/esm/icons/moon.mjs';
import { DocsIcon } from './DocsIcon';
import { SelectExamples } from './SelectExamples';
import { FormInputExamples } from './InputExamples';
import { InputNumberExamples } from './InputNumberExamples';
import { SliderExamples } from './SliderExamples';
import { IconExamples } from './IconExamples';
import { PopoverExamples } from './PopoverExamples';
import { OverlayExamples } from './OverlayExamples';
import { TabsExamples } from './TabsExamples';
import { MoreExamples } from './MoreExamples';
import { ContentExamples } from './ContentExamples';
import { BreadcrumbExamples } from './BreadcrumbExamples';
const LazyTravelExamples = lazy(() => import('./TravelExamples').then(module => ({ default: module.TravelExamples })));
function TravelExamples(props: { kind: 'calendar' | 'day-agenda' | 'journey-map' }) {
  return <Suspense fallback={<span role="status">...</span>}><LazyTravelExamples {...props} /></Suspense>;
}
import { DocsSelect } from './DocsSelect';

import { foundationComponents } from '../componentRoutes';
export { foundationComponents };
export type FoundationComponent = typeof foundationComponents[number];
export const foundationNames: Record<FoundationComponent, string> = {
  icon: 'Icon', 'input-number': 'InputNumber', slider: 'Slider', breadcrumb: 'Breadcrumb',
  calendar: 'Calendar', 'day-agenda': 'DayAgenda', 'journey-map': 'JourneyMap',
  popover: 'Popover', overlay: 'Overlay', field: 'Field', input: 'Input', textarea: 'Textarea', select: 'Select', checkbox: 'Checkbox', 'radio-group': 'RadioGroup', switch: 'Switch', tabs: 'Tabs',
  tooltip: 'Tooltip', accordion: 'Accordion', badge: 'Badge', separator: 'Separator', skeleton: 'Skeleton', progress: 'Progress',
  'dropdown-menu': 'DropdownMenu', alert: 'Alert', avatar: 'Avatar', card: 'Card', table: 'Table',
};

function SelectionExamples({ kind }: { kind: 'checkbox' | 'radio-group' | 'switch' }) {
  const { t } = useLocale();
  const [checked, setChecked] = useState(false);
  const [status, setStatus] = useState('');
  const [demoChecked, setDemoChecked] = useState(true);
  const [disabled, setDisabled] = useState(false);
  const [mixed, setMixed] = useState(false);
  const [visibility, setVisibility] = useState('private');
  const [variant, setVariant] = useState<'radio' | 'segmented'>('radio');
  const [orientation, setOrientation] = useState<'horizontal' | 'vertical'>('vertical');
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus(JSON.stringify(Object.fromEntries(new FormData(event.currentTarget))));
  };
  const choice = kind === 'radio-group';
  const Toggle = kind === 'switch' ? Switch : Checkbox;
  const name = foundationNames[kind];
  const code = choice
    ? `<RadioGroup name="visibility" value="${visibility}" onValueChange={setValue} variant="${variant}" orientation="${orientation}" label="${t('可见范围')}"${disabled ? ' disabled' : ''}>\n  <RadioGroupItem value="private" label="${t('仅自己')}" />\n  <RadioGroupItem value="team" label="${t('团队')}" />\n  <RadioGroupItem value="public" label="${t('公开')}" disabled />\n</RadioGroup>`
    : `<${name} name="updates" label="${t('接收更新')}" checked={${demoChecked}} onCheckedChange={setChecked}${disabled ? ' disabled' : ''}${kind === 'checkbox' && mixed ? ' indeterminate' : ''} />`;
  return <>
    <ComponentPlayground code={code} controls={<PropertyTabs groups={[
      { label: '基础', content: <>
        {choice && <><DocsSelect label="外观" value={variant} onValueChange={value => setVariant(value as typeof variant)} options={[["radio", "单选圆点"], ["segmented", "分段选择"]]} /><DocsSelect label="排列" value={orientation} onValueChange={value => setOrientation(value as typeof orientation)} options={[["vertical", "纵向"], ["horizontal", "横向"]]} /></>}
        {choice ? <DocsSelect label="可见范围" value={visibility} onValueChange={setVisibility} options={[["private", "仅自己"], ["team", "团队"]]} /> : <Switch label={t('选中')} checked={demoChecked} onCheckedChange={setDemoChecked} />}
      </> },
      { label: '状态', content: <>
        <Switch label={t('禁用')} checked={disabled} onCheckedChange={setDisabled} />
        {kind === 'checkbox' && <Switch label={t('半选')} checked={mixed} onCheckedChange={setMixed} />}
      </> },
    ]} />}>
      <form className="component-demo-form" onSubmit={submit} onReset={() => { setStatus(''); setDemoChecked(true); setVisibility('private'); setMixed(false); }}>
        {choice ? <RadioGroup name="visibility" value={visibility} onValueChange={setVisibility} disabled={disabled} variant={variant} orientation={orientation} label={t('可见范围')}><RadioGroupItem value="private" label={t('仅自己')} /><RadioGroupItem value="team" label={t('团队')} /><RadioGroupItem value="public" label={t('公开')} disabled /></RadioGroup> : kind === 'checkbox' ? <Checkbox name="updates" label={t('接收更新')} description={t('有新内容时通知我')} checked={demoChecked} onCheckedChange={setDemoChecked} disabled={disabled} indeterminate={mixed} /> : <Switch name="updates" label={t('接收更新')} description={t('有新内容时通知我')} checked={demoChecked} onCheckedChange={setDemoChecked} disabled={disabled} />}
        <div className="component-demo-row"><Button type="submit">{t('读取表单')}</Button><Button type="reset" variant="secondary">{t('重置')}</Button></div>
        <output className="component-demo-status" aria-live="polite">{status}</output>
      </form>
    </ComponentPlayground>
    {choice && <ComponentExample title="图标分段选择" code={`<RadioGroup name="example-theme" label="${t('主题模式')}" variant="segmented" orientation="horizontal" defaultValue="auto">\n  <RadioGroupItem value="auto" label="${t('跟随系统')}" icon={<MonitorIcon />} />\n  <RadioGroupItem value="light" label="${t('浅色')}" icon={<SunIcon />} />\n  <RadioGroupItem value="dark" label="${t('深色')}" icon={<MoonIcon />} />\n</RadioGroup>`}>
      <RadioGroup name="example-theme" label={t('主题模式')} variant="segmented" orientation="horizontal" defaultValue="auto"><RadioGroupItem value="auto" label={t('跟随系统')} icon={<DocsIcon data={monitorIcon} size={20} />} /><RadioGroupItem value="light" label={t('浅色')} icon={<DocsIcon data={sunIcon} size={20} />} /><RadioGroupItem value="dark" label={t('深色')} icon={<DocsIcon data={moonIcon} size={20} />} /></RadioGroup>
    </ComponentExample>}
    {!choice && <ComponentExample title="状态" code={`<${name} checked={checked} onCheckedChange={setChecked} label="${t('受控状态')}" />\n<${name} disabled label="${t('禁用')}" />${kind === 'checkbox' ? `\n<Checkbox indeterminate label="${t('半选')}" />` : ''}`}>
      <div className="component-demo-form"><Toggle checked={checked} onCheckedChange={setChecked} label={t('受控状态')} /><Toggle disabled label={t('禁用')} /><Toggle disabled defaultChecked label={t('已选且禁用')} />{kind === 'checkbox' && <Checkbox indeterminate label={t('半选')} />}</div>
    </ComponentExample>}
  </>;
}


const apiRows: Record<FoundationComponent, [string, string][]> = {
  breadcrumb: [['Root', 'native nav props; aria-label defaults to Breadcrumb; dir supports RTL'], ['List / Item', 'native ol / li props; paths wrap in narrow containers'], ['Link', 'ButtonLinkProps; real href, startIcon, disabled; default variant ghost'], ['Page', 'native span props; aria-current=page; noninteractive current location'], ['Separator.children', 'ReactNode; default /; decorative and hidden from assistive technology']],
  icon: [
    ['import', "import { PencilIcon } from 'inkra'"],
    ['paths', "readonly { d: string; mode?: 'stroke' | 'wash' | 'scuff' }[]"],
    ['badge.paths', 'readonly PencilIconPath[]; optional corner icon; an empty array hides the badge'],
    ['badge.position', 'top-start | top-end | bottom-start | bottom-end (default); follows dir'],
    ['badge.scale / badge.sourceSize', '0.35-0.65 (default 0.55) / 1-32 (default 24); clamped to keep the badge inside the canvas'],
    ['dir', 'ltr | rtl; mirrors badge placement, not icon paths'],
    ['size / sourceSize', 'number; canvas size defaults 40px / source coordinates default 32; Lucide uses 24'],
    ['seed', 'string | number; stable pencil grain'],
    ['active', 'boolean (default false); accent pencil mark, not semantic selection'],
    ['decorative', 'boolean (default true); false exposes role=img'],
    ['aria-label / aria-labelledby', 'accessible name when decorative=false'],
    ['style.color / className', 'CSS foreground; theme and inherited color changes redraw the canvas'],
    ['ref', 'HTMLCanvasElement; keep interactions on Button or another semantic control'],
  ],
  'input-number': [
    ['value / defaultValue', 'number | null; controlled / uncontrolled; null is empty'],
    ['onValueChange', "(value: number | null, details: { reason: 'input' | 'increment' | 'decrement' }) => void"],
    ['min / max / step', "number / number / number | 'any'; step defaults to 1"],
    ['controls', 'boolean (default true); decrease / value / increase; step=any disables native stepping'],
    ['incrementButtonLabel / decrementButtonLabel', 'string; localize accessible names and tooltips'],
    ['variant / size', 'underline (default) | outline | soft | ghost / sm | md | lg'],
    ['startIcon / endIcon / prefix / suffix / loading', 'Input slots; startAction and endAction are reserved for step controls; no clear button'],
    ['disabled / readOnly / required / invalid', 'boolean; inherits Field state'],
    ['fullWidth / textAlign / classNames', 'Input layout and slot props; textAlign defaults to center'],
    ['name / form / onChange / ref', 'native number input; HTMLInputElement ref'],
  ],
  slider: [
    ['variant', 'standard (default) | inset; thin track or wide enclosing track'],
    ['value / defaultValue', 'number[]; one thumb or multiple range thumbs'],
    ['onValueChange / onValueCommit', '(value: number[]) => void; live / committed values'],
    ['min / max / step', 'number; defaults 0 / 100 / 1'],
    ['minStepsBetweenThumbs', 'number (default 0)'],
    ['orientation / dir / inverted', 'horizontal | vertical / ltr | rtl / boolean'],
    ['size / disabled', 'sm | md (default) | lg / boolean'],
    ['thumbLabels', 'readonly string[]; accessible name for each thumb'],
    ['aria-label / aria-labelledby / aria-describedby', 'shared accessible name / description'],
    ['getValueLabel', '(value: number, index: number) => string; formatted aria-valuetext'],
    ['name / form / ref', 'form field name / form id / HTMLSpanElement'],
  ],
  calendar: [['appearance', 'itinerary (default) | picker'], ['displayRange', '{ from: Date; to: Date }; visible itinerary dates'], ['onEventSelect', '(event: CalendarEvent) => void; independent of date selection'], ['renderDayAccessory', '(date: Date) => ReactNode'], ['mode', 'single | multiple | range'], ['selected / onSelect', 'Date | Date[] | DateRange (by mode)'], ['month / defaultMonth / onMonthChange', 'Date / Date / (month: Date) => void'], ['events', '{ date; label; id?; color?; description? }[]'], ['eventIndicator', 'count (default) | dot | none; picker only'], ['disabled / locale / weekStartsOn / numberOfMonths', 'DayPickerProps'], ['showOutsideDays / showWeekNumber / fixedWeeks', 'boolean; defaults: true / false / false'], ['components / labels / formatters', 'DayPickerProps']],
  'day-agenda': [['date', 'YYYY-MM-DD (local date)'], ['events', 'AgendaEvent[]'], ['event.startMinute / endMinute', 'minutes relative to local midnight; optional'], ['event.id / title / description / kind', 'string / string / ReactNode / activity | travel | stay'], ['event.color / icon', 'string / ReactNode'], ['onPreviousDay / onNextDay', '() => void; absent endpoint disabled'], ['navigationLabels', '{ previous: string; next: string }'], ['selectedEvent / onEventSelect', 'string / (event: AgendaEvent) => void'], ['showOverview', 'boolean (default true); timeline grid visibility'], ['locale / timeZoneLabel', 'string'], ['hourCycle', 'h23 (default) | h12; locale-aware, preserves +1'], ['density', 'comfortable (default) | compact; shared tick/card mapping'], ['showDescriptions / divided', 'boolean; default true'], ['disabled / event.disabled', 'boolean; default false; disables event selection'], ['emptyLabel / untimedLabel', 'string']],
  'journey-map': [['places', '{ id; label; latitude; longitude }[]'], ['routes', '{ id; coordinates: [latitude, longitude][] }[]'], ['geography / landCover / water', 'GeoJsonObject (longitude, latitude); cover feature.properties.id selects category'], ['selectedPlace / onPlaceSelect', 'string / (place: JourneyPlace) => void'], ['attribution', 'string (required)'], ['attributionDisplay', 'inline (default) | popover; full credits remain available'], ['height', 'number (240..800, default 480)'], ['interactive', 'boolean; default true; viewport gestures only'], ['scrollWheelZoom', 'boolean; default false; requires interactive'], ['showControls', 'boolean; default true'], ['showPlaceList', 'boolean; default false; fallback always retained'], ['focusSelectedPlace', 'boolean; default false; absolute 10x overview zoom, 850ms, reduced-motion aware'], ['labels', '{ zoomIn; zoomOut; reset; unavailable; attribution? }']],
  'dropdown-menu': [['Root.open / defaultOpen / onOpenChange', 'boolean / boolean / (open: boolean) => void'], ['Root.modal / dir', 'boolean / ltr | rtl'], ['Trigger.asChild / disabled', 'boolean'], ['Content.side / align / sideOffset / collisionPadding', 'top | right | bottom | left / start | center | end / number / number'], ['Content.loop / avoidCollisions', 'boolean'], ['Item.disabled / destructive / icon / onSelect', 'boolean / boolean / ReactNode / (event: Event) => void'], ['CheckboxItem.checked / onCheckedChange', 'boolean | indeterminate / (checked: boolean) => void'], ['RadioGroup.value / onValueChange', 'string / (value: string) => void'], ['RadioItem.value', 'string'], ['Portal.container', 'HTMLElement']],
  alert: [['Root.variant', 'info | success | warning | danger'], ['Root.size', 'sm (12px padding) | md (16px, default) | lg (24px)'], ['Root.appearance', 'soft (default) | outline'], ['Root.actions / icon', 'ReactNode'], ['Root.role', 'status (default) | alert'], ['Root.seed', 'string | number'], ['Title / Description.children', 'ReactNode']],
  avatar: [['Root.size', 'sm (32px) | md (44px) | lg (64px)'], ['Root.radius / bordered', 'number (0..8, default 8) / boolean (default true)'], ['Image.fit', 'cover (default) | contain'], ['Image.src / alt', 'string / string (required)'], ['Image.onLoadingStatusChange', '(status: idle | loading | loaded | error) => void'], ['Fallback.delayMs', 'number'], ['Fallback.children', 'ReactNode']],
  card: [['Root.variant', 'paper (default) | quiet | outline'], ['Root.size', 'sm (12px padding) | md (16px, default) | lg (24px)'], ['Root.divided', 'boolean (default true)'], ['Root.radius', 'number (0..8, default 8)'], ['Root.seed', 'string | number'], ['Header.action', 'ReactNode'], ['Header.align', 'start (default) | center | end; vertical alignment'], ['Header.divided / Footer.divided', 'boolean (overrides Root.divided)'], ['Header / Content / Footer.padding', 'inherit (default) | none | sm | md | lg'], ['Footer.orientation', 'horizontal (default) | vertical; vertical children stretch'], ['Footer.justify', 'start (default) | center | end | between; along main axis'], ['Header / Content / Footer.children', 'ReactNode'], ['Title.as', 'h2 | h3 (default) | h4 | h5 | h6'], ['Title / Description.children', 'ReactNode']],
  table: [['Root.density', 'compact | comfortable'], ['Root.layout', 'auto (default) | fixed'], ['Root.striped / hoverable / stickyHeader', 'boolean (default false)'], ['Root.captionSide', 'top (default) | bottom'], ['Head.align / Cell.align', 'start (default) | center | end (native align values retained)'], ['Head / Cell.verticalAlign', 'top | middle (default) | bottom'], ['Head / Cell.wrap', 'boolean (default true)'], ['Row.selected', 'boolean (visual only)'], ['Head.scope', 'col (default) | row | colgroup | rowgroup'], ['Head / Cell.colSpan / rowSpan', 'number'], ['Container.tabIndex', 'number (default 0)'], ['Container.style.maxHeight', 'CSSProperties (constrain sticky-header scrolling)'], ['Root / Header / Body / Footer / Caption', 'native table element props']],
  tooltip: [['Provider.delayDuration / skipDelayDuration', 'number'], ['Provider.disableHoverableContent', 'boolean'], ['Root.open / defaultOpen / onOpenChange', 'boolean / boolean / (open: boolean) => void'], ['Trigger.asChild', 'boolean'], ['Content.side / align / sideOffset', 'top | right | bottom | left / start | center | end / number'], ['Content.avoidCollisions / collisionPadding', 'boolean / number'], ['Content.surfaceRadius', 'number (0..8)'], ['Content.surfaceVariant / surfaceClassName / seed', 'PencilSurfaceVariant / string / string | number'], ['Portal.container', 'HTMLElement']],
  accordion: [['Root.type', 'single | multiple'], ['Root.value / defaultValue', 'string (single) | string[] (multiple)'], ['Root.onValueChange', '(value: string | string[]) => void (by type)'], ['Root.collapsible', 'boolean (single only)'], ['Root.orientation / dir', 'horizontal | vertical / ltr | rtl'], ['Root.disabled / Item.disabled', 'boolean'], ['Item.value / showDivider', 'string / boolean'], ['Trigger.icon', 'ReactNode'], ['Content.forceMount', 'true']],
  badge: [['variant', 'neutral | accent | success | warning | danger | info'], ['size', 'sm | md (default) | lg'], ['startIcon / endIcon / children', 'ReactNode'], ['seed', 'string | number']],
  separator: [['orientation', 'horizontal | vertical'], ['decorative', 'boolean (default false)'], ['weight', 'number (0.3..2, default 0.9)'], ['seed', 'string | number']],
  skeleton: [['style / className', 'CSSProperties / string'], ['radius', 'number (0..8)'], ['seed', 'string | number']],
  progress: [['value', 'number | null'], ['max', 'number (default 100)'], ['size', 'sm (12px) | md (16px) | lg (24px)'], ['label', 'ReactNode'], ['dir', 'ltr | rtl'], ['aria-label / aria-labelledby / aria-valuetext', 'string'], ['seed', 'string | number']],
  tabs: [['Root.value / defaultValue', 'string'], ['Root.onValueChange', '(value: string) => void'], ['Root.size', 'sm | md (default) | lg'], ['Root.animated', 'boolean (default true)'], ['Root.orientation', 'horizontal | vertical'], ['Root.activationMode', 'automatic | manual'], ['Root.dir', 'ltr | rtl'], ['List.align', 'start (default) | center | end'], ['List.fullWidth', 'boolean (default false)'], ['List.divided', 'boolean (default false)'], ['List.loop', 'boolean (default true)'], ['Trigger.value / disabled', 'string / boolean'], ['Trigger.startIcon / endIcon', 'ReactNode'], ['Content.value / forceMount', 'string / true']],
  select: [
    ['Root.multiple', 'boolean (default false); selection stays open in multiple mode'],
    ['Root.value / defaultValue', 'string for single; string[] for multiple'],
    ['Root.onValueChange', '(value: string) => void; multiple: (values: string[]) => void'],
    ['Root.items', '{ value: string; label: string }[]; labels for multiple value summaries'],
    ['Root.open / defaultOpen / onOpenChange', 'boolean / boolean / (open: boolean) => void'],
    ['Root.name / form', 'string; multiple submits repeated fields with the same name, read with FormData.getAll(name)'],
    ['Root.required / disabled / invalid / readOnly', 'boolean; integrates with Field'],
    ['Trigger.size', 'sm | md | lg'], ['Value.placeholder', 'ReactNode'],
    ['Trigger.startIcon / endIcon', 'ReactNode; decorative logical start/end slots inside the shared trigger'],
    ['Trigger.hideValue', 'boolean (default false); visually hides Value, retains selected text as an accessible description'],
    ['Trigger.hideIndicator', 'boolean (default false); removes the dropdown indicator and its space'],
    ['Trigger.iconOnly', 'boolean (default false); hides value and indicator, square target >= 44px; startIcon > endIcon > icon > default chevron'],
    ['Trigger.fullWidth', 'boolean (default true); false fits content, iconOnly always keeps a square target'],
    ['Trigger.textAlign', 'start (default) | center | end; logical alignment of the visible value'],
    ['Trigger.icon', 'ReactNode; custom dropdown indicator, null hides it; existing API retained'],
    ['Trigger.aria-label / aria-labelledby', 'string; provide a control name when its visible label is hidden'],
    ['Trigger props scope', 'single and multiple compound Select; Searchable has a separate input/combobox API'],
    ['Item.value / disabled', 'string / boolean; selected items can be toggled off in multiple mode'],
    ['Clear', 'multiple mode only; standalone button, never nest inside Trigger'],
    ['Portal/Content.forceMount / Viewport.nonce / Content.updatePositionStrategy', 'single mode only; multiple mode manages mounting and positioning through Base UI'],
    ['Content.side / align / sideOffset', 'top | right | bottom | left / start | center | end / number'],
  ],
  popover: [['Root.open / defaultOpen', 'boolean'], ['Root.onOpenChange', '(open: boolean) => void'], ['Root.modal', 'boolean (default false)'], ['Trigger.asChild / disabled', 'boolean'], ['Content.side / align', 'top | right | bottom | left / start | center | end'], ['Content.sideOffset / collisionPadding', 'number'], ['Content.avoidCollisions / showArrow', 'boolean'], ['Content.onOpenAutoFocus / onCloseAutoFocus', '(event: Event) => void; preventDefault overrides default focus'], ['Close / Portal', 'Radix primitive props']],
  overlay: [['Root.open / defaultOpen', 'boolean'], ['Root.onOpenChange', '(open: boolean) => void'], ['Root.modal', 'boolean (default true)'], ['Content.layout', 'plain | sections (default plain); sections fixes Header/Footer around scrolling Body'], ['Header.showClose / closeLabel', 'boolean (default true) / string (default Close)'], ['Header.action', 'ReactNode; additional header actions'], ['Header.divided / Footer.divided', 'boolean (default true); pencil separators'], ['Body', 'scrollable content; native div props and ref'], ['Footer.align', 'start | center | end (default end)'], ['CloseButton.label', 'string (default Close); accessible name and tooltip'], ['Content.onEscapeKeyDown / onPointerDownOutside', 'event handler; preventDefault keeps open'], ['Content.onOpenAutoFocus / onCloseAutoFocus', 'event handler'], ['Trigger / Close.asChild', 'boolean'], ['Title / Description', 'accessible dialog name / description'], ['Portal.container', 'HTMLElement']],
  field: [['label / description / error', 'ReactNode'], ['required / invalid / disabled / readOnly', 'boolean'], ['id', 'string (generated if omitted)'], ['children', 'Input | Textarea | Select']],
  input: [
    ['size', 'sm | md (default) | lg'], ['variant', 'underline (default) | outline | soft | ghost'],
    ['value / defaultValue', 'native input value; controlled / uncontrolled'],
    ['onChange', 'ChangeEventHandler<HTMLInputElement>; native edits only'],
    ['onValueChange', "(value: string, details: { reason: 'input' | 'clear' }) => void"],
    ['startIcon / endIcon', 'ReactNode; decorative logical start/end slots'],
    ['prefix / suffix', 'ReactNode; visible affixes, not included in form value'],
    ['clearable', 'boolean (default false); text/search/email/url/tel/password/number'],
    ['clearButtonLabel', 'string (default "Clear input"); localize for your audience'],
    ['onClear', '(event: MouseEvent<HTMLButtonElement>) => void; follows onValueChange'],
    ['loading', 'boolean; explicit false reserves slot, omitted means no slot; remains editable'],
    ['startAction / endAction', 'ReactNode; logical leading/trailing interactive slots with pencil dividers; hover uses shared Tabs selection material'],
    ['fullWidth', 'boolean (default true); false uses compact width'],
    ['textAlign', 'start (default) | center | end'], ['dir', 'ltr | rtl | auto'],
    ['classNames', 'Partial<Record<root | control | input | startIcon | endIcon | prefix | suffix | actions, string>>'],
    ['disabled / readOnly / required / invalid', 'boolean; inherits Field state'],
    ['type / placeholder / inputMode / autoComplete / name / form', 'native input props'],
    ['minLength / maxLength', 'number; native UTF-16 code-unit limits'],
    ['ref / className / style', 'native HTMLInputElement / native input class / native input style'],
  ],
  textarea: [['size', 'sm | md (default) | lg'], ['value / defaultValue', 'string'], ['onChange', 'ChangeEventHandler<HTMLTextAreaElement>'], ['rows / cols', 'number'], ['minLength / maxLength', 'number; native UTF-16 code-unit limits'], ['disabled / readOnly / required / invalid', 'boolean; inherits Field state'], ['name / form / placeholder / autoComplete', 'native textarea props'], ['ref', 'HTMLTextAreaElement']],
  checkbox: [['checked / defaultChecked', 'boolean'], ['onCheckedChange', '(checked: boolean) => void'], ['indeterminate', 'boolean'], ['label / description', 'ReactNode'], ['name / value', 'string']],
  'radio-group': [['value / defaultValue', 'string'], ['onValueChange', '(value: string) => void'], ['variant', 'radio | segmented'], ['orientation', 'horizontal | vertical'], ['RadioGroupItem.icon', 'ReactNode'], ['name', 'string'], ['label / description', 'ReactNode'], ['disabled / required', 'boolean']],
  switch: [['checked / defaultChecked', 'boolean'], ['onCheckedChange', '(checked: boolean) => void'], ['label / description', 'ReactNode'], ['disabled / required', 'boolean'], ['name / value', 'string']],
};

const additionalGuidance: Partial<Record<FoundationComponent, string>> = {
  breadcrumb: '使用 nav 与有序列表表达路径，为导航提供本地化名称。上级使用真实链接，当前页使用 aria-current="page"；分隔符对读屏隐藏，不进入 Tab 顺序。长路径自动换行，键盘焦点沿用 ButtonLink。',
  select: '方向键浏览选项，Enter 确认，Escape 关闭并返回触发器。首尾图标仅作装饰，不嵌套按钮；hideValue 和 iconOnly 保留选中值的读屏描述，仍需 Field 标签或 aria-label 命名。纯图标触发器搭配 Tooltip，命中区域至少 44px；隐藏标签不等于删除可访问名称。',
  icon: '有文字标签时图标设为装饰；独立传意时使用 decorative=false 并提供可访问名称。点击行为放在 Button 中，纯图标操作提供 Tooltip，命中区域至少 44px。',
  slider: '每个滑块提供独立名称；方向键调整，Home/End 跳到端点。范围选择保留上下限语义，单位通过 getValueLabel 提供。',
  'input-number': '使用原生数字输入和校验，空值为 null。增减按钮和上下方向键按 step 调整；输入超出 min/max 时保留值供表单校验，不静默改写。',
  input: '首尾图标仅作装饰，交互内容放在 startAction / endAction 并提供名称。前后缀不属于输入值，必要单位通过 Field 描述关联。清空可用键盘操作，完成后焦点回输入；只读、禁用和输入法组合期间不可清空。受控清空须在 onValueChange 或 onClear 中更新 value，原生 onChange 不伪造清空事件。加载不禁止输入，Escape 由调用方处理。',
  calendar: '日期键盘导航、范围选择与禁用规则由 DayPicker 处理；日格与事件提供独立入口。行程日历保留七列，窄容器隐藏事件文字，完整名称仍在日期按钮中；picker 保留 44px 日期按钮。',
  'day-agenda': '时间按调用方提供的当地午夜分钟数显示，不推断时区或未知时长。事件卡与刻度共用分段纵轴，短事件展开，重叠分列；时点独立占位而不编造时长，事件按钮支持键盘选择。',
  'journey-map': '地图由 Leaflet 管理投影和拖动。地点提供等价的 DOM 按钮列表；地图不可用时仍可选择地点。线路仅绘制调用方提供的几何，不计算真实路线、车程或定位。必须提供数据来源或示意说明。',
  'dropdown-menu': '方向键、Home 和 End 浏览菜单，输入文字定位；Enter 或 Space 执行操作，Escape 关闭并返回触发器。禁用项跳过，勾选与单选保留对应菜单语义。',
  alert: '默认使用温和的 status 通知，仅紧急反馈使用 role="alert"。用标题和说明表达状态，不只依赖颜色；不会自动移动焦点。',
  avatar: '图片必须提供 alt；回退内容应有对应的可访问名称。纯装饰头像可以使用空 alt，并隐藏回退内容的无障碍语义。',
  card: 'Card 不自动获得按钮语义；交互放在内部按钮或链接。标题按页面结构选择合适层级，不把整个卡片变成不可达的点击区域。',
  table: '保留原生表格结构，用 Caption 命名，Head 提供表头 scope。宽表格只在容器内滚动；selected 仅表示视觉强调，选行交互应使用有名称的 Checkbox。',
  tabs: '方向键、Home 和 End 浏览标签，跳过禁用项；手动模式按 Enter 或 Space 激活。面板与标签关联，未选面板隐藏；减少动态效果时直接切换。',
  tooltip: '悬停或键盘聚焦显示补充说明，Escape 关闭。不放置交互控件，不用提示代替触发器的可访问名称；必要信息应直接呈现在页面。',
  accordion: 'Enter 或 Space 展开和收起，方向键、Home 和 End 浏览标题；禁用项跳过。Header 保留标题语义，折叠面板不可聚焦。',
  badge: '用文字表达状态，不仅依赖颜色；Badge 不是按钮，不用于独立触发操作。',
  separator: '内容分隔使用 separator 语义；纯装饰时设置 decorative。垂直分隔线需由容器提供高度。',
  skeleton: '占位材质对辅助技术隐藏；在内容容器标记 aria-busy，并在加载完成后替换为实际内容。',
  progress: '通过 label、aria-label 或 aria-labelledby 提供名称；value 为 null 表示进度未知，不设置 aria-valuenow；减少动态效果时停止动画。',
};

export function FoundationPage({ component, activeTab, onTabChange }: { component: FoundationComponent; activeTab: ComponentPageTab; onTabChange: (tab: ComponentPageTab) => void }) {
  const { t } = useLocale();
  return <article className="documentation">
    <PageHeading title={foundationNames[component]} />
    <ComponentPageTabs name={foundationNames[component]} id={component} value={activeTab} onChange={onTabChange} />
    <PencilLine className="section-divider" />
    <section className="content-section component-examples" role="tabpanel" id={`${component}-panel-${activeTab}`} aria-labelledby={`${component}-tab-${activeTab}`}>
      {activeTab === 'preview' && component === 'breadcrumb' && <BreadcrumbExamples />}
      {activeTab === 'preview' && component !== 'breadcrumb' && <>
      {component === 'icon' ? <IconExamples /> : component === 'input-number' ? <InputNumberExamples /> : component === 'slider' ? <SliderExamples /> : component === 'calendar' || component === 'day-agenda' || component === 'journey-map' ? <TravelExamples key={component} kind={component} /> : component === 'dropdown-menu' || component === 'alert' || component === 'avatar' || component === 'card' || component === 'table' ? <ContentExamples kind={component} /> : component === 'tooltip' || component === 'accordion' || component === 'badge' || component === 'separator' || component === 'skeleton' || component === 'progress' ? <MoreExamples kind={component} /> : component === 'tabs' ? <TabsExamples /> : component === 'select' ? <SelectExamples /> : component === 'popover' ? <PopoverExamples /> : component === 'overlay' ? <OverlayExamples /> : component === 'field' || component === 'input' || component === 'textarea' ? <FormInputExamples key={component} kind={component} /> : <SelectionExamples key={component} kind={component} />}
      </>}
      {activeTab === 'api' && <section className="component-api"><PencilText as="h2">API</PencilText><table><thead><tr><th>{t('属性')}</th><th>{t('类型')}</th></tr></thead><tbody>{apiRows[component].map(([name, type]) => <tr key={name}><td><code>{name}</code></td><td><code>{type}</code></td></tr>)}</tbody></table></section>}
      {activeTab === 'accessibility' && <section className="component-api"><PencilText as="h2">无障碍</PencilText><PencilText as="p">{additionalGuidance[component] ?? (component === 'select' ? '方向键浏览选项，输入文字定位，Enter 确认，Escape 关闭并返回触发器；禁用项不可选择。' : component === 'popover' || component === 'overlay' ? 'Escape 关闭当前浮层并返回触发器；模态浮层限制焦点，非模态浮层允许外部交互。' : component === 'radio-group' ? '方向键切换选项，Tab 进入或离开分组；禁用项不可选择。' : component === 'checkbox' || component === 'switch' ? 'Tab 聚焦，Space 切换；标签与描述关联原生输入，禁用项不提交表单。' : '标签、描述和错误关联输入；支持原生键盘编辑、表单提交与只读状态。')}</PencilText></section>}
    </section>
  </article>;
}
