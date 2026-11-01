import { PropertyTabs } from './PropertyTabs';
import { lazy, Suspense, useState, type ComponentType, type FormEvent } from 'react';
import { Button, Checkbox, PencilLine, RadioGroup, RadioGroupItem, Switch } from '@inkra/react';
import { PencilText, useLocale } from '../i18n';
import libraryCandidate from '../../library-candidate.json';
import { ComponentExample } from './ComponentExample';
import { ComponentPlayground } from './ComponentPlayground';
import { ComponentPageTabs, type ComponentPageTab } from './ComponentPageTabs';
import { PageHeading } from './PageHeading';
import { ApiTable } from './ApiTable';
import { ApiGroups } from './ApiGroups';
import { getFoundationApiGroups } from './foundationApiGroups';
import { __iconData as monitorIcon } from 'lucide-react/dist/esm/icons/monitor.mjs';
import { __iconData as sunIcon } from 'lucide-react/dist/esm/icons/sun.mjs';
import { __iconData as moonIcon } from 'lucide-react/dist/esm/icons/moon.mjs';
import { DocsIcon } from './DocsIcon';
const SelectExamples = lazy(() => import('./SelectExamples').then(module => ({ default: module.SelectExamples })));
const FormInputExamples = lazy(() => import('./InputExamples').then(module => ({ default: module.FormInputExamples })));
const InputNumberExamples = lazy(() => import('./InputNumberExamples').then(module => ({ default: module.InputNumberExamples })));
const SliderExamples = lazy(() => import('./SliderExamples').then(module => ({ default: module.SliderExamples })));
const SwitchCircularExamples = lazy(() => import('./SwitchCircularExamples').then(module => ({ default: module.SwitchCircularExamples })));
const IconExamples = lazy(() => import('./IconExamples').then(module => ({ default: module.IconExamples })));
const PopoverExamples = lazy(() => import('./PopoverExamples').then(module => ({ default: module.PopoverExamples })));
const OverlayExamples = lazy(() => import('./OverlayExamples').then(module => ({ default: module.OverlayExamples })));
const GuideExamples = lazy(() => import('./GuideExamples').then(module => ({ default: module.GuideExamples })));
const LoadingExamples = lazy(() => import('./LoadingExamples').then(module => ({ default: module.LoadingExamples })));
const InfiniteScrollExamples = lazy(() => import('./InfiniteScrollExamples').then(module => ({ default: module.InfiniteScrollExamples })));
const MasonryExamples = lazy(() => import('./MasonryExamples').then(module => ({ default: module.MasonryExamples })));
import { getLoadingApiGroups } from './loadingApi';
import { getInfiniteScrollApiGroups } from './infiniteScrollApi';
import { getMasonryApiGroups } from './masonryApi';
import { asyncLayoutGuidance } from './asyncLayoutGuidance';
const TabsExamples = lazy(() => import('./TabsExamples').then(module => ({ default: module.TabsExamples })));
const MoreExamples = lazy(() => import('./MoreExamples').then(module => ({ default: module.MoreExamples })));
const ContentExamples = lazy(() => import('./ContentExamples').then(module => ({ default: module.ContentExamples })));
const BreadcrumbExamples = lazy(() => import('./BreadcrumbExamples').then(module => ({ default: module.BreadcrumbExamples })));
const SlotExamples = lazy(() => import('./SlotExamples').then(module => ({ default: module.SlotExamples })));
const LogExamples = lazy(() => import('./LogExamples').then(module => ({ default: module.LogExamples })));
const HotkeyExamples = lazy(() => import('./HotkeyExamples').then(module => ({ default: module.HotkeyExamples })));
const NumberTickerExamples = lazy(() => import('./NumberTickerExamples').then(module => ({ default: module.NumberTickerExamples })));
const AudioPlayerExamples = lazy(() => import('./AudioPlayerExamples').then(module => ({ default: module.AudioPlayerExamples })));
const CarouselExamples = lazy(() => import('./CarouselExamples').then(module => ({ default: module.CarouselExamples })));
const ChoiceGridExamples = lazy(() => import('./ChoiceGridExamples').then(module => ({ default: module.ChoiceGridExamples })));
const ColorPickerExamples = lazy(() => import('./ColorPickerExamples').then(module => ({ default: module.ColorPickerExamples })));
const ColorSwatchExamples = lazy(() => import('./ColorSwatchExamples').then(module => ({ default: module.ColorSwatchExamples })));
const ContextMenuExamples = lazy(() => import('./ContextMenuExamples').then(module => ({ default: module.ContextMenuExamples })));
const DockablePanelExamples = lazy(() => import('./DockablePanelExamples').then(module => ({ default: module.DockablePanelExamples })));
const EditableExamples = lazy(() => import('./EditableExamples').then(module => ({ default: module.EditableExamples })));
const FlipExamples = lazy(() => import('./FlipExamples').then(module => ({ default: module.FlipExamples })));
const HeatmapExamples = lazy(() => import('./HeatmapExamples').then(module => ({ default: module.HeatmapExamples })));
const HoverCardExamples = lazy(() => import('./HoverCardExamples').then(module => ({ default: module.HoverCardExamples })));
const ImageCropperExamples = lazy(() => import('./ImageCropperExamples').then(module => ({ default: module.ImageCropperExamples })));
const ImageViewerExamples = lazy(() => import('./ImageViewerExamples').then(module => ({ default: module.ImageViewerExamples })));
const KeypadExamples = lazy(() => import('./KeypadExamples').then(module => ({ default: module.KeypadExamples })));
const NodeGraphExamples = lazy(() => import('./NodeGraphExamples').then(module => ({ default: module.NodeGraphExamples })));
const DependencyGraphExamples = lazy(() => import('./DependencyGraphExamples').then(module => ({ default: module.DependencyGraphExamples })));
const OverflowListExamples = lazy(() => import('./OverflowListExamples').then(module => ({ default: module.OverflowListExamples })));
const PanZoomExamples = lazy(() => import('./PanZoomExamples').then(module => ({ default: module.PanZoomExamples })));
const RadarExamples = lazy(() => import('./RadarExamples').then(module => ({ default: module.RadarExamples })));
const RangeSliderExamples = lazy(() => import('./RangeSliderExamples').then(module => ({ default: module.RangeSliderExamples })));
const RatingExamples = lazy(() => import('./RatingExamples').then(module => ({ default: module.RatingExamples })));
const ResizableExamples = lazy(() => import('./ResizableExamples').then(module => ({ default: module.ResizableExamples })));
const ScrollAreaExamples = lazy(() => import('./ScrollAreaExamples').then(module => ({ default: module.ScrollAreaExamples })));
const SegmentedProgressExamples = lazy(() => import('./SegmentedProgressExamples').then(module => ({ default: module.SegmentedProgressExamples })));
const SortableExamples = lazy(() => import('./SortableExamples').then(module => ({ default: module.SortableExamples })));
const SparklineExamples = lazy(() => import('./SparklineExamples').then(module => ({ default: module.SparklineExamples })));
const TagInputExamples = lazy(() => import('./TagInputExamples').then(module => ({ default: module.TagInputExamples })));
const TransferExamples = lazy(() => import('./TransferExamples').then(module => ({ default: module.TransferExamples })));
const TreeSelectExamples = lazy(() => import('./TreeSelectExamples').then(module => ({ default: module.TreeSelectExamples })));
const TypewriterExamples = lazy(() => import('./TypewriterExamples').then(module => ({ default: module.TypewriterExamples })));
const VirtualListExamples = lazy(() => import('./VirtualListExamples').then(module => ({ default: module.VirtualListExamples })));
const MarkdownExamples = lazy(() => import('./MarkdownExamples').then(module => ({ default: module.MarkdownExamples })));
const MarkdownAccessibility = lazy(() => import('./MarkdownGuidance'));
import { GuidanceMarkdown } from './GuidanceMarkdown';
const LazyTravelExamples = lazy(() => import('./TravelExamples').then(module => ({ default: module.TravelExamples })));
function TravelExamples(props: { kind: 'calendar' | 'day-agenda' | 'journey-map' }) {
  return <Suspense fallback={<span role="status">...</span>}><LazyTravelExamples {...props} /></Suspense>;
}
import { DocsSelect } from './DocsSelect';

import { foundationComponents, foundationNames, isExpansionComponent, type ExpansionComponent } from '../componentRoutes';
const ExpansionPage = lazy(() => import('./expansion/ExpansionPage'));
export { foundationComponents, foundationNames };
export type FoundationComponent = keyof typeof foundationNames;

const independentExamples: Partial<Record<FoundationComponent, ComponentType>> = {
  'audio-player': AudioPlayerExamples,
  carousel: CarouselExamples,
  'choice-grid': ChoiceGridExamples,
  'color-picker': ColorPickerExamples,
  'color-swatch': ColorSwatchExamples,
  'context-menu': ContextMenuExamples,
  'dockable-panel': DockablePanelExamples,
  editable: EditableExamples,
  flip: FlipExamples,
  heatmap: HeatmapExamples,
  'hover-card': HoverCardExamples,
  'image-cropper': ImageCropperExamples,
  'image-viewer': ImageViewerExamples,
  guide: GuideExamples,
  loading: LoadingExamples,
  'infinite-scroll': InfiniteScrollExamples,
  masonry: MasonryExamples,
  markdown: MarkdownExamples,
  keypad: KeypadExamples,
  'node-graph': NodeGraphExamples,
  'dependency-graph': DependencyGraphExamples,
  'overflow-list': OverflowListExamples,
  'pan-zoom': PanZoomExamples,
  radar: RadarExamples,
  'range-slider': RangeSliderExamples,
  rating: RatingExamples,
  resizable: ResizableExamples,
  'scroll-area': ScrollAreaExamples,
  sortable: SortableExamples,
  sparkline: SparklineExamples,
  'tag-input': TagInputExamples,
  transfer: TransferExamples,
  'tree-select': TreeSelectExamples,
  typewriter: TypewriterExamples,
  'virtual-list': VirtualListExamples,
};

function SelectionExamples({ kind }: { kind: 'checkbox' | 'radio-group' | 'switch' }) {
  const { t } = useLocale();
  const [checked, setChecked] = useState(false);
  const [status, setStatus] = useState('');
  const [nativeStatus, setNativeStatus] = useState('');
  const [demoChecked, setDemoChecked] = useState(false);
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
    ? `<RadioGroup name="visibility" value="${visibility}" onValueChange={setValue} variant="${variant}" orientation="${orientation}" label="${t('可见范围')}"${disabled ? ' disabled' : ''}>\n  <RadioGroupItem value="private" label="${t('仅自己')}" />\n  <RadioGroupItem value="team" label="${t('团队')}" />\n</RadioGroup>`
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
      {choice ? <RadioGroup name="visibility" value={visibility} onValueChange={setVisibility} disabled={disabled} variant={variant} orientation={orientation} label={t('可见范围')}><RadioGroupItem value="private" label={t('仅自己')} /><RadioGroupItem value="team" label={t('团队')} /></RadioGroup> : kind === 'checkbox' ? <Checkbox name="updates" label={t('接收更新')} checked={demoChecked} onCheckedChange={setDemoChecked} disabled={disabled} indeterminate={mixed} /> : <Switch name="updates" label={t('接收更新')} checked={demoChecked} onCheckedChange={setDemoChecked} disabled={disabled} />}
    </ComponentPlayground>

    {!choice && <ComponentExample id="foundation-pages-states" title="状态" code={`<${name} checked={checked} onCheckedChange={setChecked} label="${t('受控状态')}" />\n<${name} disabled label="${t('禁用')}" />${kind === 'checkbox' ? `\n<Checkbox indeterminate label="${t('半选')}" />` : ''}`}>
      <div className="component-demo-form"><Toggle checked={checked} onCheckedChange={setChecked} label={t('受控状态')} /><Toggle disabled label={t('禁用')} /><Toggle disabled defaultChecked label={t('已选且禁用')} />{kind === 'checkbox' && <Checkbox indeterminate label={t('半选')} />}</div>
    </ComponentExample>}

    {choice && <ComponentExample id="foundation-pages-icon-segments" title="图标分段选择" code={`<RadioGroup name="example-theme" label="${t('主题模式')}" variant="segmented" orientation="horizontal" defaultValue="auto">\n  <RadioGroupItem value="auto" label="${t('跟随系统')}" icon={<MonitorIcon />} />\n  <RadioGroupItem value="light" label="${t('浅色')}" icon={<SunIcon />} />\n  <RadioGroupItem value="dark" label="${t('深色')}" icon={<MoonIcon />} />\n</RadioGroup>`}>
      <RadioGroup name="example-theme" label={t('主题模式')} variant="segmented" orientation="horizontal" defaultValue="auto"><RadioGroupItem value="auto" label={t('跟随系统')} icon={<DocsIcon data={monitorIcon} size={20} />} /><RadioGroupItem value="light" label={t('浅色')} icon={<DocsIcon data={sunIcon} size={20} />} /><RadioGroupItem value="dark" label={t('深色')} icon={<DocsIcon data={moonIcon} size={20} />} /></RadioGroup>
    </ComponentExample>}

    {kind === 'switch' && <SwitchCircularExamples />}

    <ComponentExample id="foundation-pages-native-defaults" title={t('原生默认值')} code={`<form>
  ${choice ? `<RadioGroup name="visibility" defaultValue="private" label="${t('可见范围')}">
    <RadioGroupItem value="private" label="${t('仅自己')}" />
    <RadioGroupItem value="team" label="${t('团队')}" />
  </RadioGroup>` : `<${name} name="updates" value="enabled" defaultChecked label="${t('接收更新')}" />`}
  <Button type="submit">${t('读取表单')}</Button>
  <Button type="reset">${t('重置')}</Button>
</form>`}>
      <form className="component-demo-form selection-native-form" onSubmit={event => {
        event.preventDefault();
        setNativeStatus(JSON.stringify(Object.fromEntries(new FormData(event.currentTarget))));
      }} onReset={() => setNativeStatus('')}>
        {choice ? <RadioGroup name="visibility" defaultValue="private" label={t('可见范围')}>
          <RadioGroupItem value="private" label={t('仅自己')} />
          <RadioGroupItem value="team" label={t('团队')} />
        </RadioGroup> : <Toggle name="updates" value="enabled" defaultChecked label={t('接收更新')} />}
        <div className="component-demo-row"><Button type="submit">{t('读取表单')}</Button><Button type="reset" variant="secondary">{t('重置')}</Button></div>
        <output className="component-demo-status" aria-live="polite">{nativeStatus}</output>
      </form>
    </ComponentExample>

    <ComponentExample id="foundation-pages-controlled-form" title={t('受控表单', 'Controlled form')} code={`<form onSubmit={handleSubmit}>
  ${choice ? `<RadioGroup name="visibility" value={visibility} onValueChange={setVisibility} label="${t('可见范围')}">
    <RadioGroupItem value="private" label="${t('仅自己')}" />
    <RadioGroupItem value="team" label="${t('团队')}" />
  </RadioGroup>` : `<${name} name="updates" label="${t('接收更新')}" description="${t('有新内容时通知我')}" checked={checked} onCheckedChange={setChecked} />`}
  <Button type="submit">${t('读取表单')}</Button>
  <Button type="reset">${t('重置')}</Button>
</form>`}>
      <form className="component-demo-form selection-controlled-form" onSubmit={submit} onReset={() => { setStatus(''); setDemoChecked(false); setVisibility('private'); setMixed(false); }}>
        {choice ? <RadioGroup name="visibility" value={visibility} onValueChange={setVisibility} disabled={disabled} variant={variant} orientation={orientation} label={t('可见范围')}><RadioGroupItem value="private" label={t('仅自己')} /><RadioGroupItem value="team" label={t('团队')} /></RadioGroup> : kind === 'checkbox' ? <Checkbox name="updates" label={t('接收更新')} description={t('有新内容时通知我')} checked={demoChecked} onCheckedChange={setDemoChecked} disabled={disabled} indeterminate={mixed} /> : <Switch name="updates" label={t('接收更新')} description={t('有新内容时通知我')} checked={demoChecked} onCheckedChange={setDemoChecked} disabled={disabled} />}
        <div className="component-demo-row"><Button type="submit">{t('读取表单')}</Button><Button type="reset" variant="secondary">{t('重置')}</Button></div>
        <output className="component-demo-status" aria-live="polite">{status}</output>
      </form>
    </ComponentExample>
  </>;
}


const apiRows: Partial<Record<Exclude<FoundationComponent, ExpansionComponent>, [string, string][]>> = {
  guide: [],
  markdown: [
    ['children', 'string'],
    ['headingLevelOffset', 'number (default 0; clamped to h1-h6)'],
    ['labels', 'MarkdownLabels; code / plainText / copy / copied / copyFailed / table / taskChecked / taskUnchecked'],
    ['transformUrl', "(url, kind: 'link' | 'image') => string | null | undefined"],
    ['components', 'react-markdown Components'],
    ['className / style / ref', 'native div props / HTMLDivElement'],
  ],
  slot: [['children', 'ReactNode; arbitrary visual content'], ['interactive', 'boolean (default false); div or native button'], ['empty / emptyContent', 'boolean / ReactNode; preserves geometry'], ['selected', 'boolean (default false); visual selection and aria-pressed for buttons'], ['disabled', 'boolean; native disabled for interactive slots'], ['size', 'sm (48px) | md (64px) | lg (80px)'], ['count', 'number; rendered with Badge'], ['renderCount', '(count: number) => ReactNode'], ['aria-label / aria-labelledby', 'string; name interactive or meaningful slots'], ['seed', 'string | number'], ['ref', 'HTMLDivElement | HTMLButtonElement']],
  icon: [
    ['import', "import { PencilIcon } from '@inkra/react'"],
    ['paths', 'readonly PencilIconPath[]'],
    ['variant', "'outline' | 'filled' (default 'outline')"],
    ['fillColor', "string; CSS color (default 'currentColor')"],
    ['filledPaths', 'readonly PencilIconPath[]; optional dedicated filled geometry'],
    ['paths[].mode', "'stroke' | 'wash' | 'scuff' | 'fill' | 'cutout'"],
    ['paths[].color', 'string; per-fill color override'],
    ['paths[].fillRule', "'nonzero' | 'evenodd' (default 'nonzero')"],
    ['badge.paths', 'readonly PencilIconPath[]; optional corner icon; an empty array hides the badge'],
    ['badge.variant / badge.fillColor / badge.filledPaths', 'same as icon; variant and fillColor inherit from the base icon'],
    ['badge.position', 'top-start | top-end | bottom-start | bottom-end (default); follows dir'],
    ['badge.scale / badge.sourceSize', '0.35-0.65 (default 0.55) / 1-32 (default 24); clamped to keep the badge inside the canvas'],
    ['dir', 'ltr | rtl; mirrors badge placement, not icon paths'],
    ['size / sourceSize', 'number; canvas size defaults 40px / source coordinates default 32; Lucide uses 24'],
    ['strokeWidth', 'number (0.3-3); inherits icon stroke token; default 1.5'],
    ['intensity', 'number (0-1); inherits icon intensity token or defaults to 1'],
    ['breaks', 'number (0-1); inherits icon breaks token or defaults to 0.18'],
    ['breakCount', 'integer (0-12); maximum gaps per continuous path, limited by displayed length; defaults to 1'],
    ['--inkra-icon-break-count', 'CSS custom property; inherited per container; explicit breakCount takes precedence'],
    ['pressureVariation', 'number (0-1); inherits icon pressure variation token or defaults to 0.82'],
    ['--inkra-icon-pressure-variation', 'CSS custom property; inherited per container; explicit pressureVariation takes precedence'],
    ['--inkra-icon-breaks', 'CSS custom property; inherited per container; explicit breaks takes precedence'],
    ['--inkra-icon-stroke-width / --inkra-icon-intensity', 'CSS custom properties; inherited per container; explicit props take precedence'],
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
    ['stepModifiers', 'readonly InputNumberStepModifier[]; exact shiftKey/altKey/ctrlKey/metaKey chords with absolute step; default Shift: 10; [] disables'],
    ['pressAndHold', 'boolean (default true); repeat while holding a step button'],
    ['repeatDelay / repeatInterval', 'milliseconds; defaults 400 / 80; clamped to 150-60000 / 32-60000'],
    ['incrementButtonLabel / decrementButtonLabel', 'string; localize accessible names and tooltips'],
    ['variant / size', 'underline (default) | outline | soft | ghost / sm | md | lg'],
    ['startIcon / endIcon / prefix / suffix / loading', 'Input slots; startAction and endAction are reserved for step controls; no clear button'],
    ['disabled / readOnly / required / invalid', 'boolean; inherits Field state'],
    ['fullWidth / textAlign / classNames', 'Input layout and slot props; textAlign defaults to center'],
    ['name / form / onChange / ref', 'native number input; HTMLInputElement ref'],
  ],
  hotkey: [['Hotkey.value', 'HotkeyValue; key, optional code and modifiers'], ['Hotkey.platform / separator / size', 'auto | mac | windows / ReactNode / sm | md | lg'], ['HotkeyInput.value / defaultValue', 'HotkeyValue | null; controlled / uncontrolled'], ['HotkeyInput.onValueChange', "(value, details: { reason: 'record' | 'clear'; conflict? }) => void"], ['HotkeyInput.platform / size', 'auto | mac | windows / sm | md | lg'], ['HotkeyInput.clearable / clearButtonLabel', 'boolean (default true) / string'], ['HotkeyInput.recordingLabel', 'string; default "Press a shortcut..."'], ['HotkeyInput.blurOnCapture', 'boolean (default true)'], ['HotkeyInput.validateHotkey / onConflict', 'validation callback / conflict callback'], ['HotkeyInput.conflict / conflictMessage', 'boolean | string / string'], ['HotkeyInput.onCancel', '() => void; Escape cancels recording'], ['HotkeyInput.disabled / readOnly / required / invalid', 'boolean; integrates with Field'], ['HotkeyInput.placeholder / classNames', 'string / internal slot classes'], ['HotkeyInput.ref', 'HTMLInputElement']],
  slider: [
    ['variant', 'standard (default) | inset; thin track or wide enclosing track'],
    ['thumbAlignment', 'edge (default) | contain; center reaches the track ends or stays inset'],
    ['value / defaultValue', 'number[]; one thumb or multiple range thumbs'],
    ['onValueChange / onValueCommit', '(value: number[]) => void; live / committed values'],
    ['min / max / step', 'number; defaults 0 / 100 / 1'],
    ['minStepsBetweenThumbs', 'number (default 0)'],
    ['preserveThumbOrder', 'boolean (default false)'],
    ['orientation / dir / inverted', 'horizontal | vertical / ltr | rtl / boolean'],
    ['size / disabled', 'sm | md (default) | lg / boolean'],
    ['thumbLabels', 'readonly string[]; accessible name for each thumb'],
    ['aria-label / aria-labelledby / aria-describedby', 'shared accessible name / description'],
    ['getValueLabel', '(value: number, index: number) => string; formatted aria-valuetext'],
    ['name / form / ref', 'form field name / form id / HTMLSpanElement'],
    ['CircularSlider.value / defaultValue', 'number; controlled / uncontrolled scalar value'],
    ['CircularSlider.onValueChange / onValueCommit', '(value: number) => void; live updates / completed interaction'],
    ['CircularSlider.min / max / step', 'number; defaults 0 / 100 / 1'],
    ['CircularSlider.startAngle / sweepAngle / clockwise', 'number / number / boolean; defaults 225 / 270 / true; 0° is top, 90° is right'],
    ['CircularSlider.size / diameter', 'sm | md | lg / number; sizes 128 / 160 / 192 px'],
    ['CircularSlider.showValue / getValueLabel', 'boolean (default true) / (value: number) => string'],
    ['CircularSlider.centerIcon / centerContent', 'ReactNode / ReactNode | ((value: number) => ReactNode)'],
    ['CircularSlider.disabled / readOnly', 'boolean; readOnly remains focusable'],
    ['CircularSlider.name / form / ref', 'form field / external form / HTMLDivElement; uncontrolled reset restores initial value'],
  ],
  calendar: [['appearance', 'itinerary (default) | picker'], ['displayRange', '{ from: Date; to: Date }; visible itinerary dates'], ['onEventSelect', '(event: CalendarEvent) => void; independent of date selection'], ['renderDayAccessory', '(date: Date) => ReactNode'], ['mode', 'single | multiple | range'], ['selected / onSelect', 'Date | Date[] | DateRange (by mode)'], ['month / defaultMonth / onMonthChange', 'Date / Date / (month: Date) => void'], ['events', '{ date; label; id?; color?; description? }[]'], ['eventIndicator', 'count (default) | dot | none; picker only'], ['disabled / locale / weekStartsOn / numberOfMonths', 'DayPickerProps'], ['showOutsideDays / showWeekNumber / fixedWeeks', 'boolean; defaults: true / false / false'], ['components / labels / formatters', 'DayPickerProps']],
  'day-agenda': [['date', 'YYYY-MM-DD (local date)'], ['events', 'AgendaEvent[]'], ['event.startMinute / endMinute', 'minutes relative to local midnight; optional'], ['event.id / title / description / kind', 'string / string / ReactNode / activity | travel | stay'], ['event.color / icon', 'string / ReactNode'], ['onPreviousDay / onNextDay', '() => void; absent endpoint disabled'], ['navigationLabels', '{ previous: string; next: string }'], ['selectedEvent / onEventSelect', 'string / (event: AgendaEvent) => void'], ['showOverview', 'boolean (default true); timeline grid visibility'], ['locale / timeZoneLabel', 'string'], ['hourCycle', 'h23 (default) | h12; locale-aware, preserves +1'], ['density', 'comfortable (default) | compact; shared tick/card mapping'], ['showDescriptions / divided', 'boolean; default true'], ['disabled / event.disabled', 'boolean; default false; disables event selection'], ['emptyLabel / untimedLabel', 'string']],
  'journey-map': [['places', '{ id; label; latitude; longitude }[]'], ['routes', '{ id; coordinates: [latitude, longitude][] }[]'], ['geography / landCover / water', 'GeoJsonObject (longitude, latitude); cover feature.properties.id selects category'], ['selectedPlace / onPlaceSelect', 'string / (place: JourneyPlace) => void'], ['attribution', 'string (required)'], ['attributionDisplay', 'inline (default) | popover; full credits remain available'], ['height', 'number (240..800, default 480)'], ['maxFitZoom', 'number (0..20, default 12); use 18 for street-scale fit/reset'], ['background', 'sea (default) | paper; paper omits the ocean texture'], ['interactive', 'boolean; default true; viewport gestures only'], ['scrollWheelZoom', 'boolean; default false; requires interactive'], ['showControls', 'boolean; default true'], ['showPlaceList', 'boolean; default false; fallback always retained'], ['focusSelectedPlace', 'boolean (default true); focus pin/list clicks and later selectedPlace changes; initial overview retained'], ['focusZoomScale', 'number (1..64, default 2); magnification relative to overview, never cumulative'], ['animate', 'boolean (default true); programmatic zoom, reset and focus; respects reduced motion'], ['animationDuration', 'number (0..5000 ms, default 420); 0 disables animation'], ['rendering', "'auto' (default) | 'legacy' | JourneyMapRenderingOptions"], ['rendering.boundaryViewport', 'boolean; auto true; legacy false'], ['rendering.terrainViewport', 'boolean; auto true; legacy false'], ['rendering.reuseCanvas', 'boolean; auto true; legacy false'], ['rendering.cacheBase', 'boolean; auto true; legacy false; bounded per-instance cache'], ['labels', '{ zoomIn; zoomOut; reset; unavailable; attribution? }']],
  'dropdown-menu': [['Root.open / defaultOpen / onOpenChange', 'boolean / boolean / (open: boolean) => void'], ['Root.modal / dir', 'boolean / ltr | rtl'], ['Trigger.asChild / disabled', 'boolean'], ['Content.side / align / sideOffset / collisionPadding', 'top | right | bottom | left / start | center | end / number / number'], ['Content.loop / avoidCollisions', 'boolean'], ['Item.disabled / destructive / icon / onSelect', 'boolean / boolean / ReactNode / (event: Event) => void'], ['CheckboxItem.checked / onCheckedChange', 'boolean | indeterminate / (checked: boolean) => void'], ['RadioGroup.value / onValueChange', 'string / (value: string) => void'], ['RadioItem.value', 'string'], ['Portal.container', 'HTMLElement']],
  alert: [['Root.variant', 'info | success | warning | danger'], ['Root.size', 'sm (12px padding) | md (16px, default) | lg (24px)'], ['Root.appearance', 'soft (default) | outline'], ['Root.actions / icon', 'ReactNode'], ['Root.closable', 'boolean = false'], ['Root.open / defaultOpen', 'boolean; defaultOpen = true'], ['Root.onOpenChange', '(open: boolean) => void'], ['Root.closeLabel', 'string'], ['Root.role', 'status (default) | alert'], ['Root.seed', 'string | number'], ['Title / Description.children', 'ReactNode']],
  avatar: [['Root.size', 'sm (32px) | md (44px) | lg (64px)'], ['Root.radius / bordered', 'number (0..8, default 8) / boolean (default true)'], ['Image.fit', 'cover (default) | contain'], ['Image.src / alt', 'string / string (required)'], ['Image.onLoadingStatusChange', '(status: idle | loading | loaded | error) => void'], ['Fallback.delayMs', 'number'], ['Fallback.children', 'ReactNode']],
  card: [['Root.variant', 'paper (default) | quiet | outline'], ['Root.size', 'sm (12px padding) | md (16px, default) | lg (24px)'], ['Root.divided', 'boolean (default true)'], ['Root.radius', 'number (0..8, default 8)'], ['Root.seed', 'string | number'], ['Header.action', 'ReactNode'], ['Header.align', 'start (default) | center | end; vertical alignment'], ['Header.divided / Footer.divided', 'boolean (overrides Root.divided)'], ['Header / Content / Footer.padding', 'inherit (default) | none | sm | md | lg'], ['Footer.orientation', 'horizontal (default) | vertical; vertical children stretch'], ['Footer.justify', 'start (default) | center | end | between; along main axis'], ['Header / Content / Footer.children', 'ReactNode'], ['Title.as', 'h2 | h3 (default) | h4 | h5 | h6'], ['Title / Description.children', 'ReactNode']],
  table: [['Root.density', 'compact | comfortable'], ['Root.layout', 'auto (default) | fixed'], ['Root.striped / hoverable / stickyHeader', 'boolean (default false)'], ['Root.captionSide', 'top (default) | bottom'], ['Head.align / Cell.align', 'start (default) | center | end (native align values retained)'], ['Head / Cell.verticalAlign', 'top | middle (default) | bottom'], ['Head / Cell.wrap', 'boolean (default true)'], ['Row.selected', 'boolean (visual only)'], ['Head.scope', 'col (default) | row | colgroup | rowgroup'], ['Head / Cell.colSpan / rowSpan', 'number'], ['Container.tabIndex', 'number (default 0)'], ['Container.style.maxHeight', 'CSSProperties (constrain sticky-header scrolling)'], ['Root / Header / Body / Footer / Caption', 'native table element props']],
  tooltip: [['Provider.delayDuration / skipDelayDuration', 'number'], ['Provider.disableHoverableContent', 'boolean'], ['Root.open / defaultOpen / onOpenChange', 'boolean / boolean / (open: boolean) => void'], ['Trigger.asChild', 'boolean'], ['Content.side / align / sideOffset', 'top | right | bottom | left / start | center | end / number'], ['Content.avoidCollisions / collisionPadding', 'boolean / number'], ['Content.surfaceRadius', 'number (0..8)'], ['Content.surfaceVariant / surfaceClassName / seed', 'PencilSurfaceVariant / string / string | number'], ['Portal.container', 'HTMLElement']],
  accordion: [['Root.type', 'single | multiple'], ['Root.value / defaultValue', 'string (single) | string[] (multiple)'], ['Root.onValueChange', '(value: string | string[]) => void (by type)'], ['Root.collapsible', 'boolean (single only)'], ['Root.orientation / dir', 'horizontal | vertical / ltr | rtl'], ['Root.disabled / Item.disabled', 'boolean'], ['Item.value / showDivider', 'string / boolean'], ['Trigger.icon', 'ReactNode'], ['Content.forceMount', 'true']],
  badge: [['variant', 'neutral | accent | success | warning | danger | info'], ['size', 'sm | md (default) | lg'], ['startIcon / endIcon / children', 'ReactNode'], ['seed', 'string | number']],
  'number-ticker': [
    ['animation', 'count (default) | roll | morph'], ['rollDirection', 'auto (default) | up | down'],
    ['value', 'number | bigint | string'], ['compact', 'boolean | en | zh (default false)'],
    ['locale / formatOptions', 'NumberTickerLocale / NumberTickerFormatOptions'],
    ['formatOptions.notation', 'standard | scientific | engineering | compact'],
    ['formatOptions.roundingMode', 'halfExpand (default) | trunc | ceil | floor | expand | halfCeil | halfFloor | halfTrunc | halfEven'],
    ['formatOptions.minimumFractionDigits / maximumFractionDigits', 'number; compact default 0 / 1'],
    ['compactOptions.minUnit / maxUnit', 'string; unit label, e.g. M or 万'],
    ['compactOptions.units', 'readonly { factor: NumberTickerValue; label: string; threshold?: NumberTickerValue }[]'],
    ['compactOptions.separator', 'string (default: space)'],
    ['compactOptions.promotionThreshold', 'number | bigint | string; > 0 (default 1)'],
    ['compactOptions.promoteAfterRounding', 'boolean (default true)'],
    ['compactOptions.overflow', 'unit | scientific (default: unit if maxUnit set, otherwise scientific)'],
    ['numberTickerUnits', '{ en: readonly NumberTickerUnit[]; zh: readonly NumberTickerUnit[] }'],
    ['prefix / suffix', 'ReactNode; text, icon or combination'], ['animate / duration / easing', 'boolean / milliseconds / (progress: number) => number'], ['showDelta / deltaDuration', 'boolean / milliseconds'], ['deltaFormatOptions', 'NumberTickerFormatOptions'], ['renderValue', '(value, details) => ReactNode'], ['renderDelta', '(delta, details) => ReactNode'], ['getValueLabel', '(value, formattedValue) => string'], ['className / style / ref', 'native span props / HTMLSpanElement'],
  ],
  log: [['items', 'readonly LogEntry[]; stable id and caller order'], ['levels', 'readonly LogLevelDefinition[]'], ['filteredLevels / defaultFilteredLevels', 'readonly string[]; controlled / uncontrolled filter'], ['onFilteredLevelsChange', '(levels: readonly string[]) => void'], ['paused / defaultPaused', 'boolean; controlled / uncontrolled follow state'], ['onPausedChange', '(paused: boolean) => void'], ['showLevelFilter / showFollowControl', 'boolean (default true)'], ['nearBottomThreshold', 'number (default 32px)'], ['empty / noMatches', 'ReactNode'], ['labels', 'Partial<LogLabels>'], ['viewportProps', 'native div props for the scroll region'], ['className / style / ref', 'native root div props / HTMLDivElement']],
  separator: [['orientation', 'horizontal | vertical'], ['decorative', 'boolean (default false)'], ['weight', 'number (0.3..2, default 0.9)'], ['seed', 'string | number']],
  skeleton: [['width / height', 'CSSProperties["width"] / CSSProperties["height"]'], ['animation', 'none (default) | pulse'], ['style / className', 'CSSProperties / string'], ['radius', 'number (0..8)'], ['seed', 'string | number']],
  progress: [['value', 'number | null'], ['max', 'number (default 100)'], ['shape', 'linear (default) | circular'], ['size', 'sm | md | lg: linear 12/16/24px; circular 64/96/128px'], ['diameter', 'number (32-512px)'], ['thickness', 'number (1-diameter/8; default 4/6/8px)'], ['contentPosition', 'center | top | bottom | start | end'], ['children', 'ReactNode | (state: ProgressRenderState) => ReactNode'], ['label', 'ReactNode'], ['dir', 'ltr | rtl'], ['aria-label / aria-labelledby / aria-valuetext', 'string'], ['seed', 'string | number']],
  tabs: [['Root.value / defaultValue', 'string'], ['Root.onValueChange', '(value: string) => void'], ['Root.size', 'sm | md (default) | lg'], ['Root.animated', 'boolean (default true)'], ['Root.orientation', 'horizontal | vertical'], ['Root.activationMode', 'automatic | manual'], ['Root.dir', 'ltr | rtl'], ['List.align', 'start (default) | center | end'], ['List.fullWidth', 'boolean (default false)'], ['List.divided', 'boolean (default false)'], ['List.loop', 'boolean (default true)'], ['List.overflow', 'scroll (default) | menu | buttons'], ['List.moreLabel', 'string (default "More tabs")'], ['List.scrollPreviousLabel / scrollNextLabel', 'string'], ['Trigger.value / disabled', 'string / boolean'], ['Trigger.startIcon / endIcon', 'ReactNode'], ['Trigger.overflowLabel', 'string'], ['Content.value / forceMount', 'string / true']],
  select: [
    ['Searchable.items', 'readonly SearchableSelectOption[]; value, label, disabled?, keywords?'],
    ['Searchable.searchPlacement', 'trigger (default) | popup'],
    ['Searchable.multiple', 'boolean (default false)'],
    ['Searchable.value / defaultValue / onValueChange', 'string | null for single; string[] for multiple; matching value callback'],
    ['Searchable.size / dir', 'sm | md (default) | lg / ltr | rtl'],
    ['Searchable.clearable / clearLabel / openLabel', 'boolean (default true) / string / string'],
    ['Searchable.placeholder / searchPlaceholder / emptyContent', 'string / string / ReactNode'],
    ['Searchable.name / form / required', 'string / string / boolean'],
    ['Searchable.disabled / readOnly / invalid', 'boolean; inherits Field state'],
    ['Searchable.open / defaultOpen / onOpenChange', 'boolean / boolean / (open: boolean) => void'],
    ['Searchable.side / align / sideOffset / collisionPadding', 'top | right | bottom | left / start | center | end / number / number'],
    ['Stepper.items', 'readonly SelectStepperItem[]; { value: string; label: string; disabled?: boolean }'],
    ['Stepper.value / defaultValue / onValueChange', 'string | null / string | null / (value: string) => void'],
    ['Stepper.loop', 'boolean (default false)'],
    ['Stepper.size / fullWidth / dir', 'sm | md (default) | lg / boolean (default true) / ltr | rtl'],
    ['Stepper.placeholder / previousLabel / nextLabel', 'string; localized labels'],
    ['Stepper.name / form / required', 'string / string / boolean'],
    ['Stepper.disabled / readOnly / invalid', 'boolean; inherits Field state'],
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
    ['type / placeholder / inputMode / autoComplete / name / form', 'native input props; type includes password'],
    ['minLength / maxLength', 'number; native UTF-16 code-unit limits'],
    ['ref / className / style', 'native HTMLInputElement / native input class / native input style'],
  ],
  textarea: [
    ['variant', 'outline (default) | underline'], ['endAction', 'ReactNode'],
    ['size', 'sm | md (default) | lg'], ['value / defaultValue', 'string'],
    ['onChange', 'ChangeEventHandler<HTMLTextAreaElement>'], ['rows / cols', 'number'],
    ['autoSize', 'boolean | { minRows?: number; maxRows?: number } (default false)'],
    ['minLength / maxLength', 'number; native UTF-16 code-unit limits'],
    ['countMode', 'remaining (default) | fraction | progress | none'],
    ['countDisplay', 'auto (default) | always'], ['countThreshold', 'number (0..1, default 0.8)'],
    ['getCountLabel', '({ count, maxLength, remaining }: TextareaCountDetails) => string'],
    ['resize', 'none (default) | vertical'], ['resizeLabel', 'string'],
    ['disabled / readOnly / required / invalid', 'boolean; inherits Field state'],
    ['name / form / placeholder / autoComplete', 'native textarea props'], ['ref', 'HTMLTextAreaElement'],
  ],
  checkbox: [['checked / defaultChecked', 'boolean'], ['onCheckedChange', '(checked: boolean) => void'], ['onChange', 'ChangeEventHandler<HTMLInputElement>'], ['indeterminate', 'boolean'], ['label / description', 'ReactNode'], ['disabled / required', 'boolean'], ['name / value / form', 'native input props'], ['ref', 'HTMLInputElement']],
  'radio-group': [['value / defaultValue', 'string'], ['onValueChange', '(value: string) => void'], ['variant', 'radio | segmented'], ['orientation', 'horizontal | vertical'], ['RadioGroupItem.value / label / description / icon', 'string / ReactNode / ReactNode / ReactNode'], ['RadioGroupItem.onChange', 'ChangeEventHandler<HTMLInputElement>'], ['name / form', 'string'], ['label / description', 'ReactNode'], ['disabled / required', 'boolean'], ['ref / RadioGroupItem.ref', 'HTMLFieldSetElement / HTMLInputElement']],
  switch: [['checked / defaultChecked', 'boolean'], ['onCheckedChange', '(checked: boolean) => void'], ['onChange', 'ChangeEventHandler<HTMLInputElement>'], ['variant', 'standard | circular'], ['diameter', 'number'], ['centerIcon / centerContent', 'ReactNode / ReactNode | ((checked: boolean) => ReactNode)'], ['label / description', 'ReactNode'], ['disabled / readOnly / required', 'boolean'], ['name / value / form', 'native input props'], ['ref', 'HTMLInputElement']],
  'audio-player': [
    ['src', 'string'], ['preload / autoPlay / crossOrigin', 'none | metadata | auto / boolean / native audio crossOrigin'],
    ['volume / defaultVolume', 'number (0..1)'], ['muted / defaultMuted', 'boolean'],
    ['playbackRate / defaultPlaybackRate', 'number (0.25..4)'],
    ['onVolumeChange / onMutedChange / onPlaybackRateChange', '(volume: number) / (muted: boolean) / (rate: number) => void'],
    ['onTimeChange', '(currentTime: number) => void'], ['onStateChange', '(state: AudioPlayerState) => void'],
    ['onError', '(error: MediaError | DOMException | null) => void'], ['labels', 'AudioPlayerLabels'],
    ['renderControls', '(controls: AudioPlayerControls) => ReactNode'], ['audioProps', 'native audio attributes, excluding managed properties'],
    ['ref', 'AudioPlayerControls: audio / state / play / pause / togglePlay / seek / setVolume / setMuted / setPlaybackRate / focus'],
  ],
  carousel: [
    ['children', 'ReactNode'], ['currentIndex / defaultIndex / onCurrentIndexChange', 'number / number / (index: number) => void'],
    ['visibleItems', 'number | { base?: number; sm?: number; md?: number; lg?: number }'],
    ['gap / align', 'number (px, default 16) / start | center | end'], ['loop / dragFree / disabled', 'boolean'],
    ['controls / pagination', 'boolean (default true)'], ['autoplay', 'boolean | CarouselAutoplayOptions'],
    ['labels', 'CarouselLabels'], ['emptyState', 'ReactNode'], ['dir', 'ltr | rtl'],
    ['ref', 'CarouselRef: root / previous / next / scrollTo / play / pause'],
  ],
  'choice-grid': [
    ['type', 'single (default) | multiple'],
    ['value / defaultValue / onValueChange', 'string / string / (value: string) => void; single'],
    ['values / defaultValues / onValuesChange', 'readonly string[] / readonly string[] / (values: string[]) => void; multiple'],
    ['name / form', 'string'], ['label / description / error', 'ReactNode'],
    ['columns / minItemWidth', '1 | 2 | 3 | 4 / CSS length (default 13rem)'],
    ['disabled', 'boolean'],
    ['ChoiceGridOption.value / label / description', 'string / ReactNode / ReactNode'],
    ['ChoiceGridOption.icon / image', "ReactNode / ChoiceGridImage; decorative image with alt=''"],
    ['ChoiceGridOption.disabled / required / form', 'boolean / boolean / string; native input props'],
    ['ChoiceGridOption.onChange', 'ChangeEventHandler<HTMLInputElement>'],
    ['ref / ChoiceGridOption.ref', 'HTMLFieldSetElement / HTMLInputElement'],
  ],
  'color-picker': [
    ['presentation', 'inline (default) | compact | popover | swatches'],
    ['value / defaultValue', 'string; with allowGradient: string | ColorGradient'],
    ['onValueChange', '(value: ColorValue | ColorPaint, details: ColorPickerChangeDetails) => void'],
    ['allowGradient', 'boolean (default false)'],
    ['colorTypes', 'readonly (solid | linear | radial | conic)[]'],
    ['maxStops', 'number (default 8; 2-64)'],
    ['gradientLabels', 'ColorGradientLabels'],
    ['ColorGradient', '{ type; stops: { id?, color, position }[]; angle?; center?: { x, y }; shape?; extent?; repeating? }'],
    ['formatColorPaint', '(paint: string | ColorGradient) => string'],
    ['onInvalidInput', '(input: string) => void'],
    ['presets', 'readonly (string | ColorPreset)[]'],
    ['showAlpha', 'boolean (default true)'],
    ['label / labels', 'ReactNode / ColorPickerLabels'],
    ['name / form', 'string'], ['disabled', 'boolean (default false)'],
    ['seed', 'string | number'],
  ],
  'color-swatch': [
    ['color', 'string'], ['background', 'CSSProperties[background]'], ['label', 'string'], ['selected', 'boolean (default false)'],
    ['size', 'sm | md (default) | lg'], ['onClick', 'MouseEventHandler<HTMLButtonElement>'],
    ['disabled', 'boolean'], ['seed', 'string | number'], ['ref', 'HTMLButtonElement'],
  ],
  'context-menu': [['Root.open / defaultOpen', 'boolean'], ['Root.onOpenChange', '(open: boolean, details: ContextMenuOpenChangeDetails) => void'], ['Root.modal / dir', 'boolean / ltr | rtl'], ['Trigger.as / disabled', 'ElementType / boolean'], ['Trigger.longPress', 'boolean | { delay?: number; movementTolerance?: number }'], ['Trigger.nativeContextMenu', 'editable | always | never'], ['Trigger.exclude', 'string | (target: Element, currentTarget: HTMLElement) => boolean'], ['Content.onCloseAutoFocus', '(event: Event) => void'], ['Content.side / align / sideOffset / collisionPadding', 'top | right | bottom | left / start | center | end / number / number'], ['Item.disabled / destructive / icon / onSelect', 'boolean / boolean / ReactNode / (event: Event) => void'], ['CheckboxItem.checked / onCheckedChange', 'boolean | indeterminate / (checked: boolean) => void'], ['RadioGroup.value / onValueChange', 'string / (value: string) => void'], ['Sub.open / defaultOpen / onOpenChange', 'boolean / boolean / (open: boolean) => void'], ['SubTrigger.disabled / icon', 'boolean / ReactNode'], ['SubContent.sideOffset / collisionPadding', 'number'], ['Portal.container', 'HTMLElement']],
  'dockable-panel': [['position / defaultPosition', '{ x; y }'], ['onPositionChange', 'position callback'], ['collapsed / defaultCollapsed', 'boolean'], ['snap', 'viewport edge options'], ['bounds', 'viewport | HTMLElement'], ['panelId / activePanelId', 'layer management']],
  editable: [['value / defaultValue', 'string'], ['editing / defaultEditing', 'boolean'], ['onValueChange / onEditingChange', 'callbacks'], ['editorType', 'input (default) | textarea | select'], ['selectProps', 'EditableSelectProps: items, mode (dropdown | searchable | stepper), size, dir, labels, clearable, loop'], ['multiline', 'boolean; legacy textarea shorthand'], ['validate', 'sync or async validator'], ['display / editor', 'ReactNode | render callback'], ['blurBehavior', 'ignore (default) | save | cancel'], ['submitOnEnter', 'boolean (default true); multiline uses Ctrl/Command + Enter'], ['inputProps / textareaProps', 'InputProps / TextareaProps; excludes value handlers'], ['startEditingLabel / saveLabel / cancelLabel', 'string'], ['onSave / onCancel', 'EditableSaveHandler / (value: string) => void'], ['EditableEditorProps', 'value, onValueChange, onKeyDown, onBlur, disabled, readOnly, invalid, error, autoFocus, ARIA'], ['ref', 'EditableHandle: focus / startEditing / save / cancel']],
  heatmap: [['rows / columns / cells', 'axis and cell data'], ['scaleType / domain / binCount', 'continuous | quantize'], ['selectedCell / defaultSelectedCell', 'HeatmapSelection'], ['onSelectedCellChange', 'selection callback'], ['renderCell / renderDetails', 'render hooks'], ['showLegend / showValues', 'boolean']],
  'image-cropper': [['src', 'string'], ['crop / defaultCrop', 'crop state'], ['zoom / rotation / aspect', 'number'], ['onCropChange / onCropComplete', 'callbacks'], ['exportImage', 'bounded export options'], ['keyboardStep / zoomStep', 'number']],
  'image-viewer': [
    ['Root.items', 'readonly ImageViewerItem[]'], ['Root.activeId / defaultActiveId', 'string | null'],
    ['Root.onActiveIdChange', '(id: string | null, details: ImageViewerChangeDetails) => void'],
    ['Root.open / defaultOpen / onOpenChange', 'boolean / boolean / (open: boolean) => void'], ['Root.loop', 'boolean (default true)'],
    ['Content.showThumbnails / zoomable / rotatable', 'boolean (defaults true / true / false)'],
    ['Content.showCounter', 'boolean (default false)'],
    ['Content.toolbarPosition', "'top' | 'bottom' (default 'top')"],
    ['Content.minScale / maxScale / wheel', 'number / number / disabled | always | modifier'],
    ['Content.labels', 'Partial<ImageViewerLabels>'], ['Content.renderImage', '(item: ImageViewerItem, props: ImageViewerImageRenderProps) => ReactNode'],
    ['Content.videoLabels', 'Partial<VideoResourceLabels>'],
    ['Content.emptyState', 'ReactNode'], ['Content.dir / onOpenAutoFocus', 'ltr | rtl / (event: Event) => void'],
    ['ImageViewerItem.id / src / alt', 'string'], ['ImageViewerItem.thumbnailSrc / thumbnailAlt / width / height', 'string / string / number / number'],
    ['ImageViewerItem.type / poster', 'image | video (default image) / string'],
    ['MediaViewer', 'ImageViewer alias'],
  ],
  keypad: [['keys', 'readonly KeypadKey[]'], ['value / defaultValue', 'string'], ['onValueChange', '(value, details) => void'], ['columns / maxLength', 'number'], ['onConfirm', '(value) => void'], ['disabled / readOnly', 'boolean']],
  'node-graph': [['nodes / edges', 'React Flow data'], ['onNodesChange / onEdgesChange', 'change callbacks'], ['onConnect', 'connection callback'], ['fitView / minZoom / maxZoom', 'viewport options'], ['Node / Edge', 'bounded Inkra renderers'], ['ref', 'NodeGraphRef']],
  'overflow-list': [['items', 'readonly OverflowListItem[]'], ['strategy', 'end | start | priority'], ['renderItem / renderOverflowItem', 'render hooks'], ['renderOverflowTrigger', 'trigger hook'], ['onOverflowChange', 'visible and overflow ids'], ['minVisibleItems', 'number']],
  'pan-zoom': [['value / defaultValue', 'PanZoomTransform'], ['onTransformChange', '(transform, details) => void'], ['minScale / maxScale', 'number'], ['wheel / pinch / pan / keyboard', 'interaction options'], ['wheelStep', 'number'], ['fitOnInit / limitToBounds / centerZoomedOut', 'boolean | FitToViewMode / boolean / boolean'], ['ref', 'PanZoomRef']],
  radar: [['axes / series', 'radar data'], ['hiddenSeries / defaultHiddenSeries', 'string[]'], ['onHiddenSeriesChange', 'callback'], ['showLegend / showTable', 'boolean'], ['tableCaption / seriesLabel', 'ReactNode'], ['renderLabel / renderTooltip', 'render hooks'], ['domain', 'per-axis ranges']],
  'range-slider': [
    ['value / defaultValue', '[number, number]; default [min, max]'],
    ['onValueChange / onValueCommit', '(value: [number, number]) => void'],
    ['min / max / step', 'number; defaults 0 / 100 / 1'],
    ['minDistance', 'number = 0'],
    ['allowCross', 'boolean = false'],
    ['thumbLabels', 'readonly [string, string]'],
    ['getValueLabel', '(value: number, index: number) => string'],
    ['orientation / dir / inverted', 'horizontal | vertical / ltr | rtl / boolean'],
    ['variant', 'standard (default) | inset'],
    ['size / disabled', 'sm | md (default) | lg / boolean'],
    ['name / form / ref', 'form field name / form id / HTMLSpanElement'],
  ],
  rating: [['value / defaultValue', 'number'], ['onValueChange', '(value: number) => void'], ['count', 'number = 5'], ['step', 'number = 1'], ['clearable', 'boolean | reselect | keyboard = false'], ['hoverPreview', 'boolean = true'], ['onPreviewChange', '(value: number | null) => void'], ['name / form', 'string'], ['readOnly / disabled', 'boolean'], ['size', 'sm | md | lg'], ['dir', 'ltr | rtl'], ['symbol', 'ReactNode'], ['renderSymbol', '(state: RatingSymbolState) => ReactNode'], ['getValueLabel', '(value: number, count: number) => string']],
  'scroll-area': [['type', 'auto (default) | always'], ['viewportLabel', 'string'], ['viewportProps', 'native div props; scroll events and tabIndex'], ['overflowEdgeThreshold', 'number | { xStart?: number; xEnd?: number; yStart?: number; yEnd?: number }'], ['seed', 'string | number'], ['className / style / ref', 'native root div props / HTMLDivElement'], ['Root', 'alias of ScrollArea; viewport, scrollbars and corner included']],
  sortable: [['items', 'readonly SortableItem[]'], ['onItemsChange', '(items, details) => void'], ['containers', 'optional grouped data'], ['strategy / orientation', 'sorting strategy'], ['renderItem / renderOverlay', 'render hooks'], ['disabled / announcements', 'accessibility options']],
  sparkline: [['data', 'readonly SparklineDatum[]'], ['variant', 'line | bar'], ['xDomain / yDomain', 'domains'], ['showExtrema / showCurrent', 'boolean'], ['getValueLabel', 'accessible formatter'], ['renderTooltip', 'render hook']],
  'tag-input': [['value / defaultValue', 'TagInputTag[]'], ['inputValue / defaultInputValue', 'string'], ['onValueChange / onInputValueChange', 'callbacks'], ['createTag / validateTag', 'creation hooks'], ['delimiters / maxTags', 'constraints'], ['disabled / readOnly / clearable', 'boolean']],
  transfer: [
    ['items', 'readonly TransferItem[]'],
    ['targetKeys / defaultTargetKeys', 'readonly string[]'],
    ['onTargetKeysChange', '(keys: string[], details: TransferChangeDetails) => void'],
    ['searchable', 'boolean (default true)'],
    ['filterItem', '(item: TransferItem, query: string, side: TransferSide) => boolean'],
    ['renderItem', '(item: TransferItem, state: TransferItemRenderState) => ReactNode'],
    ['formatCount', '(details: TransferCountDetails) => ReactNode'],
    ['labels', 'TransferLabels'], ['disabled', 'boolean (default false)'],
    ['dir', 'ltr | rtl | auto'], ['ref', 'HTMLDivElement'],
  ],
  'tree-select': [
    ['items', 'readonly TreeSelectNode[]; id, label, children?, disabled?, description?, keywords?'],
    ['value / defaultValue', 'string | null for single; readonly string[] for multiple'],
    ['multiple', 'boolean (default false)'],
    ['branchSelection', 'leaf (default) | all'],
    ['selectionPropagation', 'none (default) | down | both'],
    ['onValueChange', '(value, details: TreeSelectChangeDetails) => void'],
    ['size / dir', 'sm | md (default) | lg / ltr | rtl'],
    ['clearable / clearLabel', 'boolean (default true) / string'],
    ['placeholder / searchPlaceholder / emptyContent', 'string / string / ReactNode'],
    ['treeLabel / expandLabel / collapseLabel', 'string; localized accessible names'],
    ['renderLabel', '(node: TreeSelectNode, state: TreeSelectRenderLabelState) => ReactNode'],
    ['renderValue', '(nodes: readonly TreeSelectNode[], ids: readonly string[]) => ReactNode'],
    ['expandedIds / defaultExpandedIds / onExpandedIdsChange', 'readonly string[] / readonly string[] / (ids: string[]) => void'],
    ['open / defaultOpen / onOpenChange', 'boolean / boolean / (open: boolean) => void'],
    ['name / form', 'string; multiple selection submits repeated fields'],
    ['disabled / readOnly / invalid', 'boolean; inherits Field state'],
    ['required', 'boolean; accessible required state, not native constraint validation'],
    ['side / align / sideOffset / collisionPadding', 'top | right | bottom | left / start | center | end / number / number'],
    ['className / style / ref', 'native root div props / HTMLDivElement'],
  ],
  typewriter: [['text', 'string'], ['speed / punctuationDelay', 'milliseconds'], ['paused', 'boolean'], ['onComplete', 'callback'], ['reducedMotion', 'follow-system | always | never'], ['ref', 'pause, resume, complete and restart']],
  'virtual-list': [['items / itemKey', 'data and stable key'], ['estimateSize / measureItems', 'sizing options'], ['renderItem / getItemProps', 'render hooks'], ['overscan / gap / padding', 'layout options'], ['getScrollElement', 'external viewport'], ['ref', 'VirtualListHandle']],
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
  slot: '静态 Slot 保持普通 div，不强制按钮语义；可操作 Slot 使用原生 button，Tab 聚焦后可用 Enter 或 Space 激活。可操作模式只放非交互图标或内容，复杂控件应放在静态 Slot 中，避免嵌套按钮。选中状态同时使用 aria-pressed，不只依赖颜色。',
  hotkey: 'Hotkey 只展示快捷键。HotkeyInput 仅在自身输入框聚焦时录入，不注册全局监听，也不拦截浏览器快捷键；Escape 取消，Delete 或 Backspace 清除，IME 与纯修饰键不会提交。冲突校验由调用方提供。',
  'number-ticker': '最终数值通过礼貌 live region 发布，动画中间帧不逐帧播报；减少动态效果时直接显示终值。使用 getValueLabel 为货币、单位或自定义渲染提供完整读屏文字。',
  log: '滚动区域用 region 和名称表达，不把整个长列表设为 live region。Home/End 可跳到顶部或底部；用户离开底部或暂停后不强制抢回滚动位置，稳定 id 保持记录身份。',
  'audio-player': '播放、暂停、进度、音量和倍速均使用有名称的控件；自动播放默认关闭，显式启用仍受浏览器策略限制。加载失败、缓冲与播放被拒绝通过可读状态反馈。',
  carousel: '前后按钮和分页有可访问名称，键盘可移动当前项；自动播放默认关闭，启用时在交互、页面隐藏和减少动态效果时暂停。',
  'choice-grid': '复用原生单选或多选语义，方向键与 Tab 遵循对应控件规则；图标、图片和颜色不替代文字标签与错误说明。',
  'color-picker': '颜色值同时用文本和通道数值表达；色块不是唯一信息。每个通道控件有名称，预设按钮暴露实际颜色值。',
  'color-swatch': '色样使用具名原生按钮，Enter 或 Space 选择，选中状态通过轮廓和 aria-pressed 表达；禁用项不进入键盘顺序。',
  'context-menu': '右键、ContextMenu 键或 Shift+F10 打开；Escape 关闭并返回实际触发区域。长按不得阻止页面滚动或文本选择。',
  'dockable-panel': '标题栏是移动把手但不劫持内部按钮；键盘可移动、收起和恢复。面板始终夹在视口内，缩小视口后标题栏仍可到达。',
  editable: '展示态与编辑态共享清晰名称；Enter 提交、Escape 取消，多行与输入法组合期间不误提交。异步校验保留焦点并播报错误。',
  flip: '隐藏面从焦点顺序和无障碍树移除；翻面与倾斜不改变内部按钮、链接的原生交互。减少动态效果时直接切换。',
  heatmap: '网格单元提供行、列和数值名称，方向键在网格中移动，Enter 或 Space 选择。缺失值与 0 明确区分，不只依赖颜色。',
  'hover-card': '触发器聚焦或悬停显示补充信息；交互内容可进入并操作，Escape 关闭并返回触发器。触摸设备不依赖悬停。',
  'image-cropper': '拖动和缩放均有键盘替代控件；裁剪坐标与原图像素关系明确。加载、CORS 和导出错误以可读文字反馈。',
  'image-viewer': '全屏查看器保留隐藏标题、焦点管理、Escape 关闭和焦点返回，不显示顶部标题栏。图片提供替代文本；视频控制与缩略图有名称，切换资源或关闭时停止播放。加载失败与空列表保留关闭入口。',
  guide: '打开后焦点进入引导面板；Tab 遍历操作，左右方向键切换步骤，Escape 按配置关闭。关闭、跳过与完成后焦点返回触发器或打开前的焦点；目标缺失时面板仍可操作且不绘制错误高亮。',
  keypad: '每个按键都是原生按钮并有稳定名称；输入、删除与确认提供可读反馈。列跨度仅影响布局，不改变按键顺序。',
  'dependency-graph': '节点保留原生按钮与键盘操作，选中状态和业务状态用文字说明。Tab 移动焦点，Enter 或 Space 选择；缩放和适应视图有具名控件。前置条件由业务数据决定，锁定节点仍可查看详情，disabled 节点不可激活。',
  'node-graph': '节点与边保留可读名称和键盘可达操作；画布手势不是唯一入口。缩放、适配与连接状态通过有名称控件提供。',
  'overflow-list': '被收纳项目仍通过菜单可达；测量副本对读屏和焦点隐藏。当前焦点项目被收纳时，焦点转移到更多菜单。',
  'pan-zoom': '可聚焦视口提供方向键平移、加减号缩放和 0 复位；按钮、链接和表单控件不触发拖动。普通滚轮默认留给页面。',
  radar: '轴、系列和值提供摘要与数据表；系列开关可用键盘操作。颜色之外同时使用线型、标签和文字区分系列。',
  'range-slider': '两个滑块分别命名上下限，方向键调整，Home/End 到端点；读屏值通过 getValueLabel 提供单位和上下文。',
  rating: '单个 slider 承担焦点与键盘交互，方向键、Home 和 End 调整值；符号是视觉目标，数值标签不只依赖图形。',
  resizable: '分隔条使用 separator 语义，方向键调整相邻区域并暴露当前值；折叠后可恢复，最小和最大尺寸始终有效。',
  'scroll-area': '内容保留原生滚动、键盘和触摸语义；自定义滚动条仅作用于组件范围。轨道与滑块保持足够命中尺寸。',
  sortable: '拖动不是唯一入口，键盘传感器可拾取、移动和放下；实时播报当前项目、目标位置与取消结果，稳定 id 保持身份。',
  sparkline: '趋势图提供当前值、极值和可访问数据摘要；键盘可检查数据点。负值、缺失值和常数序列不只用颜色区分。',
  'tag-input': '输入法组合期间不提交；Backspace 删除末项，方向键在标签和输入间移动。每个标签删除按钮有名称，校验错误保留草稿和焦点。',
  transfer: '两个列表有名称，项目选择与移动操作分离；键盘可完成筛选、选择和转移。禁用项不移动，结果变化通过状态反馈。',
  'tree-select': '触发器与树形弹层正确关联；方向键浏览树，分支展开与选择策略明确。过滤不丢失隐藏的已选项，关闭后焦点返回触发器。',
  typewriter: '完整文字始终存在于可选择 DOM 和无障碍内容中；动画只控制视觉显现，不逐字骚扰读屏。减少动态效果时立即显示全文。',
  'virtual-list': '列表暴露稳定总数和项目身份；重新挂载不改变 itemKey。键盘焦点项滚出虚拟窗口时由调用方保留可恢复的选择或焦点策略。',
};

export function FoundationPage({ component, activeTab, onTabChange }: { component: FoundationComponent; activeTab: ComponentPageTab; onTabChange: (tab: ComponentPageTab) => void }) {
  const { locale, t } = useLocale();
  const fromRegistry = 'source' in libraryCandidate && libraryCandidate.source === 'registry';
  if (isExpansionComponent(component)) return <Suspense fallback={<span role="status">{t('加载中')}</span>}><ExpansionPage component={component} activeTab={activeTab} onTabChange={onTabChange} /></Suspense>;
  const IndependentExamples = independentExamples[component];
  const asyncGuidance = asyncLayoutGuidance(component, locale);
  const groups = activeTab !== 'api' ? undefined
    : component === 'loading' ? getLoadingApiGroups(locale)
    : component === 'infinite-scroll' ? getInfiniteScrollApiGroups(locale)
    : component === 'masonry' ? getMasonryApiGroups(locale)
    : getFoundationApiGroups(component, apiRows[component] ?? []);
  return <article className="documentation">
    <PageHeading title={foundationNames[component]} />
    {component === 'dependency-graph' && !fromRegistry && <PencilText as="p" role="note">{t('当前预览使用固定源码提交的候选包；正式可用功能请以已发布的 npm 版本为准。', 'This preview uses a pinned source candidate; published capabilities are defined by the released npm package.')}</PencilText>}
    <ComponentPageTabs name={foundationNames[component]} id={component} value={activeTab} onChange={onTabChange} />
    <PencilLine className="section-divider" />
    <section className="content-section component-examples" role="tabpanel" id={`${component}-panel-${activeTab}`} aria-labelledby={`${component}-tab-${activeTab}`}>
      <Suspense fallback={<span role="status">{t('加载中')}</span>}>
      {activeTab === 'preview' && (component === 'breadcrumb' ? <BreadcrumbExamples /> : IndependentExamples ? <IndependentExamples /> : component === 'progress' ? <><MoreExamples kind="progress" /><SegmentedProgressExamples /></> : component === 'slot' ? <SlotExamples /> : component === 'log' ? <LogExamples /> : component === 'hotkey' ? <HotkeyExamples /> : component === 'number-ticker' ? <NumberTickerExamples /> : component === 'icon' ? <IconExamples /> : component === 'input-number' ? <InputNumberExamples /> : component === 'slider' ? <SliderExamples /> : component === 'calendar' || component === 'day-agenda' || component === 'journey-map' ? <TravelExamples key={component} kind={component} /> : component === 'dropdown-menu' || component === 'alert' || component === 'avatar' || component === 'card' || component === 'table' ? <ContentExamples kind={component} /> : component === 'tooltip' || component === 'accordion' || component === 'badge' || component === 'separator' || component === 'skeleton' ? <MoreExamples kind={component} /> : component === 'tabs' ? <TabsExamples /> : component === 'select' ? <SelectExamples /> : component === 'popover' ? <PopoverExamples /> : component === 'overlay' ? <OverlayExamples /> : component === 'field' || component === 'input' || component === 'textarea' ? <FormInputExamples key={component} kind={component} /> : component === 'checkbox' || component === 'radio-group' || component === 'switch' ? <SelectionExamples key={component} kind={component} /> : null)}
    {activeTab === 'api' && <section className="component-api">{groups ? <ApiGroups component={component} groups={groups} /> : <ApiTable rows={apiRows[component] ?? [['component', foundationNames[component]]]} component={component} label={`${foundationNames[component]} API`} />}</section>}
      {activeTab === 'accessibility' && <section className="component-api">{component === 'markdown' ? <MarkdownAccessibility /> : <GuidanceMarkdown source={asyncGuidance ? asyncGuidance : t(additionalGuidance[component] ?? (component === 'select' ? '方向键浏览选项，输入文字定位，Enter 确认，Escape 关闭并返回触发器；禁用项不可选择。' : component === 'popover' || component === 'overlay' ? 'Escape 关闭当前浮层并返回触发器；模态浮层限制焦点，非模态浮层允许外部交互。' : component === 'radio-group' ? '方向键切换选项，Tab 进入或离开分组；禁用项不可选择。' : component === 'checkbox' || component === 'switch' ? 'Tab 聚焦，Space 切换；标签与描述关联原生输入，禁用项不提交表单。' : '标签、描述和错误关联输入；支持原生键盘编辑、表单提交与只读状态。'))} />}</section>}
      </Suspense>
    </section>
  </article>;
}
