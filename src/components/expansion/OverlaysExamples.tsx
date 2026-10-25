import { useEffect, useRef, useState } from 'react';
import {
  AlertDialog,
  Button,
  Drawer,
  Field,
  Input,
  PencilIcon,
  Switch,
} from '@inkra/react';
import { __iconData as alertIcon } from 'lucide-react/dist/esm/icons/triangle-alert.mjs';

import { useLocale } from '../../i18n';
import { ComponentExample } from '../ComponentExample';
import { ComponentPlayground } from '../ComponentPlayground';
import { iconPaths } from '../DocsIcon';
import { DocsSelect } from '../DocsSelect';
import { PropertyTabs } from '../PropertyTabs';
import type { ExpansionDoc } from './types';
import './OverlaysExamples.css';

const alertPaths = iconPaths(alertIcon);

function BasicAlertDialogExample() {
  const { locale } = useLocale();
  const zh = locale === 'zh-CN';
  const [result, setResult] = useState<'idle' | 'cancelled' | 'deleted'>('idle');
  return <div className="expansion-overlay-demo">
    <AlertDialog.Root>
      <AlertDialog.Trigger asChild><Button variant="destructive">{zh ? '删除草稿' : 'Delete draft'}</Button></AlertDialog.Trigger>
      <AlertDialog.Portal>
        <AlertDialog.Backdrop />
        <AlertDialog.Content>
          <AlertDialog.Header>
            <AlertDialog.Title>{zh ? '删除这份草稿？' : 'Delete this draft?'}</AlertDialog.Title>
            <AlertDialog.Description>{zh ? '删除后无法恢复，已发布的内容不会受影响。' : 'This cannot be undone. Published content is not affected.'}</AlertDialog.Description>
          </AlertDialog.Header>
          <AlertDialog.Footer>
            <AlertDialog.Cancel onClick={() => setResult('cancelled')}>{zh ? '取消' : 'Cancel'}</AlertDialog.Cancel>
            <AlertDialog.Action onClick={() => setResult('deleted')}>{zh ? '删除' : 'Delete'}</AlertDialog.Action>
          </AlertDialog.Footer>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
    <output className="expansion-overlay-demo__status" aria-live="polite">{result === 'idle' ? (zh ? '尚未操作' : 'No action yet') : result === 'cancelled' ? (zh ? '已取消' : 'Cancelled') : (zh ? '已确认删除' : 'Deletion confirmed')}</output>
  </div>;
}

function AlertDialogPlayground() {
  const { locale } = useLocale();
  const zh = locale === 'zh-CN';
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [delay, setDelay] = useState(700);
  const [message, setMessage] = useState<'idle' | 'pending' | 'done'>('idle');
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  function confirmArchive() {
    if (timer.current !== undefined) return;
    setPending(true);
    setMessage('pending');
    timer.current = window.setTimeout(() => {
      timer.current = undefined;
      setPending(false);
      setOpen(false);
      setMessage('done');
    }, delay);
  }

  const code = `const [open, setOpen] = useState(false);
const [pending, setPending] = useState(false);
const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
useEffect(() => () => clearTimeout(timer.current), []);
function archive() {
  if (timer.current !== undefined) return;
  setPending(true);
  timer.current = setTimeout(() => {
    timer.current = undefined;
    setPending(false);
    setOpen(false);
  }, ${delay});
}
<AlertDialog.Root open={open} onOpenChange={setOpen} pending={pending}>
  <AlertDialog.Trigger asChild><Button>${zh ? '归档项目' : 'Archive project'}</Button></AlertDialog.Trigger>
  <AlertDialog.Portal>
    <AlertDialog.Backdrop />
    <AlertDialog.Content>
      <AlertDialog.Header>
        <AlertDialog.Title>${zh ? '归档这个项目？' : 'Archive this project?'}</AlertDialog.Title>
        <AlertDialog.Description>${zh ? '归档期间用户发起的取消和 Escape 会被拦截。' : 'User-initiated Cancel and Escape are blocked while the action is pending.'}</AlertDialog.Description>
      </AlertDialog.Header>
      <AlertDialog.Body>${zh ? '团队成员将无法继续编辑，但以后仍可恢复项目。' : 'Team members cannot continue editing, but the project can be restored later.'}</AlertDialog.Body>
      <AlertDialog.Footer>
        <AlertDialog.Cancel>${zh ? '取消' : 'Cancel'}</AlertDialog.Cancel>
        <AlertDialog.Action closeOnAction={false} onClick={archive}>{pending ? '${zh ? '归档中' : 'Archiving'}' : '${zh ? '确认归档' : 'Confirm archive'}'}</AlertDialog.Action>
      </AlertDialog.Footer>
    </AlertDialog.Content>
  </AlertDialog.Portal>
</AlertDialog.Root>`;

  return <ComponentPlayground code={code} controls={<PropertyTabs groups={[
    { label: '交互', content: <DocsSelect label={zh ? '异步时长' : 'Async duration'} value={String(delay)} onValueChange={value => setDelay(Number(value))} options={[["300", "300 ms"], ["700", "700 ms"], ["1200", "1200 ms"]]} /> },
    { label: '状态', content: <>{message !== 'idle' && <output aria-live="polite">{message === 'pending' ? (zh ? '正在归档…' : 'Archiving...') : (zh ? '归档完成' : 'Archived')}</output>}<Button variant="secondary" onClick={() => setOpen(true)} disabled={open}>{zh ? '从属性区打开' : 'Open from controls'}</Button></> },
  ]} />}>
    <div className="expansion-overlay-demo">
      <AlertDialog.Root open={open} onOpenChange={setOpen} pending={pending}>
        <AlertDialog.Trigger asChild><Button startIcon={<PencilIcon decorative paths={alertPaths} size={20} sourceSize={24} />}>{zh ? '归档项目' : 'Archive project'}</Button></AlertDialog.Trigger>
        <AlertDialog.Portal>
          <AlertDialog.Backdrop />
          <AlertDialog.Content>
            <AlertDialog.Header>
              <AlertDialog.Title>{zh ? '归档这个项目？' : 'Archive this project?'}</AlertDialog.Title>
              <AlertDialog.Description>{zh ? '归档期间用户发起的取消和 Escape 会被拦截。' : 'User-initiated Cancel and Escape are blocked while the action is pending.'}</AlertDialog.Description>
            </AlertDialog.Header>
            <AlertDialog.Body>{zh ? '团队成员将无法继续编辑，但以后仍可恢复项目。' : 'Team members cannot continue editing, but the project can be restored later.'}</AlertDialog.Body>
            <AlertDialog.Footer>
              <AlertDialog.Cancel>{zh ? '取消' : 'Cancel'}</AlertDialog.Cancel>
              <AlertDialog.Action closeOnAction={false} onClick={confirmArchive}>{pending ? (zh ? '归档中' : 'Archiving') : (zh ? '确认归档' : 'Confirm archive')}</AlertDialog.Action>
            </AlertDialog.Footer>
          </AlertDialog.Content>
        </AlertDialog.Portal>
      </AlertDialog.Root>
    </div>
  </ComponentPlayground>;
}

function AlertDialogExamples() {
  const { locale } = useLocale();
  const zh = locale === 'zh-CN';
  return <div className="component-examples expansion-overlays-examples">
    <AlertDialogPlayground />
    <ComponentExample id="overlays-safe-confirmation" title={zh ? '安全确认' : 'Safe confirmation'} code={`import { useState } from 'react';
import { AlertDialog, Button } from '@inkra/react';

export function DeleteDraftDialog() {
  const [result, setResult] = useState('尚未操作');
  return <div>
    <AlertDialog.Root>
      <AlertDialog.Trigger asChild>
        <Button variant="destructive">删除草稿</Button>
      </AlertDialog.Trigger>
      <AlertDialog.Portal>
        <AlertDialog.Backdrop />
        <AlertDialog.Content>
          <AlertDialog.Header>
            <AlertDialog.Title>删除这份草稿？</AlertDialog.Title>
            <AlertDialog.Description>删除后无法恢复，已发布的内容不会受影响。</AlertDialog.Description>
          </AlertDialog.Header>
          <AlertDialog.Footer>
            <AlertDialog.Cancel onClick={() => setResult('已取消')}>取消</AlertDialog.Cancel>
            <AlertDialog.Action onClick={() => setResult('已确认删除')}>删除</AlertDialog.Action>
          </AlertDialog.Footer>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
    <output>{result}</output>
  </div>;
}`}><BasicAlertDialogExample /></ComponentExample>
  </div>;
}

function BasicDrawerExample() {
  const { locale } = useLocale();
  const zh = locale === 'zh-CN';
  return <Drawer.Root>
    <Drawer.Trigger asChild><Button>{zh ? '打开详情' : 'Open details'}</Button></Drawer.Trigger>
    <Drawer.Portal>
      <Drawer.Backdrop />
      <Drawer.Content direction="right" size="sm">
        <Drawer.Header closeLabel={zh ? '关闭' : 'Close'}>
          <Drawer.Title>{zh ? '项目详情' : 'Project details'}</Drawer.Title>
          <Drawer.Description>{zh ? '头尾固定，正文独立滚动。' : 'Header and footer stay fixed while the body scrolls.'}</Drawer.Description>
        </Drawer.Header>
        <Drawer.Body><p>{zh ? '在这里查看项目成员、状态和最近更新。' : 'Review project members, status, and recent updates here.'}</p></Drawer.Body>
        <Drawer.Footer><Drawer.Close asChild><Button variant="secondary">{zh ? '完成' : 'Done'}</Button></Drawer.Close></Drawer.Footer>
      </Drawer.Content>
    </Drawer.Portal>
  </Drawer.Root>;
}

function DrawerPlayground() {
  const { locale } = useLocale();
  const zh = locale === 'zh-CN';
  const [direction, setDirection] = useState<'top' | 'right' | 'bottom' | 'left'>('right');
  const [size, setSize] = useState<'sm' | 'md' | 'lg'>('md');
  const [divided, setDivided] = useState(true);
  const [showClose, setShowClose] = useState(true);
  const [open, setOpen] = useState(false);
  const [savedName, setSavedName] = useState('Inkra');
  const [draftName, setDraftName] = useState(savedName);
  const directionLabels = { top: zh ? '上' : 'Top', right: zh ? '右' : 'Right', bottom: zh ? '下' : 'Bottom', left: zh ? '左' : 'Left' };
  const sizeLabels = { sm: zh ? '小' : 'Small', md: zh ? '中' : 'Medium', lg: zh ? '大' : 'Large' };
  function changeOpen(next: boolean) {
    if (next) setDraftName(savedName);
    setOpen(next);
  }
  function saveDraft() {
    setSavedName(draftName);
    setOpen(false);
  }
  const paragraphs = Array.from({ length: 24 }, (_, index) => zh ? `第 ${index + 1} 条更新：这里是可滚动的完整正文，不会推动头部和底部操作。` : `Update ${index + 1}: this scrollable body does not move the header or footer actions.`);
  const code = `const [open, setOpen] = useState(false);
const [savedName, setSavedName] = useState('Inkra');
const [draftName, setDraftName] = useState(savedName);
<Drawer.Root open={open} onOpenChange={next => {
  if (next) setDraftName(savedName);
  setOpen(next);
}}>
  <Drawer.Trigger asChild><Button>${zh ? '打开任务抽屉' : 'Open task drawer'}</Button></Drawer.Trigger>
  <Drawer.Portal>
    <Drawer.Backdrop />
    <Drawer.Content direction="${direction}" size="${size}">
      <Drawer.Header closeLabel="${zh ? '关闭' : 'Close'}" showClose={${showClose}} divided={${divided}}>
        <Drawer.Title>${zh ? '任务详情' : 'Task details'}</Drawer.Title>
        <Drawer.Description>${zh ? `${directionLabels[direction]}侧，${sizeLabels[size]}尺寸。` : `${directionLabels[direction]} edge, ${sizeLabels[size].toLowerCase()} size.`}</Drawer.Description>
      </Drawer.Header>
      <Drawer.Body>
        <Field label="${zh ? '项目名称' : 'Project name'}">
          <Input value={draftName} onChange={event => setDraftName(event.target.value)} />
        </Field>
      </Drawer.Body>
      <Drawer.Footer divided={${divided}}>
        <Drawer.Close asChild><Button variant="secondary">${zh ? '关闭' : 'Close'}</Button></Drawer.Close>
        <Button onClick={() => { setSavedName(draftName); setOpen(false); }}>${zh ? '保存' : 'Save'}</Button>
      </Drawer.Footer>
    </Drawer.Content>
  </Drawer.Portal>
</Drawer.Root>`;
  return <ComponentPlayground code={code} controls={<PropertyTabs groups={[
    { label: '布局', content: <><DocsSelect label={zh ? '方向' : 'Direction'} value={direction} onValueChange={value => setDirection(value as typeof direction)} options={Object.entries(directionLabels)} /><DocsSelect label={zh ? '尺寸' : 'Size'} value={size} onValueChange={value => setSize(value as typeof size)} options={Object.entries(sizeLabels)} /></> },
    { label: '内容', content: <><Switch checked={showClose} onCheckedChange={setShowClose} label={zh ? '显示关闭按钮' : 'Show close button'} /><Switch checked={divided} onCheckedChange={setDivided} label={zh ? '显示分割线' : 'Show dividers'} /></> },
    { label: '状态', content: <Field label={zh ? '已保存名称' : 'Saved name'}><Input value={savedName} readOnly /></Field> },
  ]} />}>
    <div className="expansion-overlay-demo">
    <Drawer.Root open={open} onOpenChange={changeOpen}>
      <Drawer.Trigger asChild><Button>{zh ? '打开任务抽屉' : 'Open task drawer'}</Button></Drawer.Trigger>
      <Drawer.Portal>
        <Drawer.Backdrop />
        <Drawer.Content direction={direction} size={size}>
          <Drawer.Header closeLabel={zh ? '关闭' : 'Close'} divided={divided} showClose={showClose}>
            <Drawer.Title>{zh ? '任务详情' : 'Task details'}</Drawer.Title>
            <Drawer.Description>{zh ? `${directionLabels[direction]}侧，${sizeLabels[size]}尺寸。` : `${directionLabels[direction]} edge, ${sizeLabels[size].toLowerCase()} size.`}</Drawer.Description>
          </Drawer.Header>
          <Drawer.Body><div className="expansion-drawer-copy"><Field label={zh ? '项目名称' : 'Project name'}><Input value={draftName} onChange={event => setDraftName(event.target.value)} /></Field>{paragraphs.map(paragraph => <p key={paragraph}>{paragraph}</p>)}</div></Drawer.Body>
          <Drawer.Footer divided={divided}><Drawer.Close asChild><Button variant="secondary">{zh ? '关闭' : 'Close'}</Button></Drawer.Close><Button onClick={saveDraft}>{zh ? '保存' : 'Save'}</Button></Drawer.Footer>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
    </div>
  </ComponentPlayground>;
}

function DrawerExamples() {
  const { locale } = useLocale();
  const zh = locale === 'zh-CN';
  return <div className="component-examples expansion-overlays-examples">
    <DrawerPlayground />
    <ComponentExample id="overlays-side-details" title={zh ? '侧边详情' : 'Side details'} code={`import { Button, Drawer } from '@inkra/react';

export function ProjectDetailsDrawer() {
  return <Drawer.Root>
    <Drawer.Trigger asChild><Button>打开详情</Button></Drawer.Trigger>
    <Drawer.Portal>
      <Drawer.Backdrop />
      <Drawer.Content direction="right" size="sm">
        <Drawer.Header closeLabel="关闭">
          <Drawer.Title>项目详情</Drawer.Title>
          <Drawer.Description>头尾固定，正文独立滚动。</Drawer.Description>
        </Drawer.Header>
        <Drawer.Body><p>在这里查看项目成员、状态和最近更新。</p></Drawer.Body>
        <Drawer.Footer>
          <Drawer.Close asChild><Button variant="secondary">完成</Button></Drawer.Close>
        </Drawer.Footer>
      </Drawer.Content>
    </Drawer.Portal>
  </Drawer.Root>;
}`}><BasicDrawerExample /></ComponentExample>
  </div>;
}

export const overlaysDocs: Record<string, ExpansionDoc> = {
  'alert-dialog': {
    name: 'AlertDialog',
    intro: {
      zh: '手比脑子快的时候，还好有一句「确定吗」。',
      en: 'For when your click gets ahead of your thinking. Are you sure?',
    },
    apiGroups: [
      { id: 'root', title: 'AlertDialog.Root', rows: [
        ['open / defaultOpen', 'boolean', '受控或非受控打开状态；始终为模态弹窗，不接受 modal。', 'Controlled or initial open state; always modal, with no modal prop.'],
        ['onOpenChange', '(open: boolean) => void', '打开状态变化回调。', 'Called when the open state changes.'],
        ['pending', 'boolean = false', '等待时禁用内部关闭与操作；受控父组件仍负责 open 状态。', 'Disable internal dismissal and actions while pending; controlled parents still own open.'],
      ] },
      { id: 'trigger', title: 'AlertDialog.Trigger', rows: [
        ['asChild / children', 'boolean / ReactNode', '通过 asChild 复用真实触发按钮；支持 Radix Trigger 属性。', 'Use asChild to reuse a real trigger button; accepts Radix Trigger props.'],
      ] },
      { id: 'portal', title: 'AlertDialog.Portal', rows: [
        ['container', 'HTMLElement | null', '指定挂载容器，保留局部主题。', 'Choose the portal container while preserving the local theme.'],
        ['forceMount', 'true', '由外部动画控制挂载。', 'Keep mounted for external animation control.'],
      ] },
      { id: 'backdrop', title: 'AlertDialog.Backdrop', rows: [
        ['asChild / forceMount', 'boolean / true', '透传 Radix Overlay 配置；点击遮罩不会关闭确认弹窗。', 'Forward Radix Overlay configuration; clicking the backdrop does not dismiss the alert dialog.'],
        ['className / style', 'string / CSSProperties', '遮罩样式。', 'Backdrop styling.'],
      ] },
      { id: 'content', title: 'AlertDialog.Content', rows: [
        ['seed', 'string | number', '纸面笔触种子。', 'Seed for the pencil surface.'],
        ['onOpenAutoFocus / onCloseAutoFocus', '(event: Event) => void', '打开与关闭时的焦点生命周期；默认优先聚焦可用的 Cancel。', 'Focus lifecycle on open and close; an available Cancel receives initial focus by default.'],
        ['onEscapeKeyDown', '(event: KeyboardEvent) => void', 'Escape 事件；pending 时不关闭。', 'Escape handler; pending prevents dismissal.'],
        ['onPointerDownOutside / onInteractOutside', 'DialogContentProps handlers', '可以观察外部交互，但组件始终阻止外部交互关闭。', 'Observe outside interactions; the component always prevents outside dismissal.'],
        ['children / className / style', 'ReactNode / string / CSSProperties', '内容与样式；支持其余 Radix Content 属性。', 'Content and styling; other Radix Content props are supported.'],
      ] },
      { id: 'header', title: 'AlertDialog.Header', rows: [
        ['divided', 'boolean = true', '显示页头分割线。', 'Show the header divider.'],
        ['children', 'ReactNode', '通常放置 Title 与 Description；支持原生 div 属性。', 'Usually contains Title and Description; accepts native div attributes.'],
      ] },
      { id: 'body', title: 'AlertDialog.Body', rows: [
        ['children', 'ReactNode', '正文区域；支持原生 div 属性。', 'Body content; accepts native div attributes.'],
      ] },
      { id: 'footer', title: 'AlertDialog.Footer', rows: [
        ['align', '"start" | "center" | "end" = "end"', '操作区对齐。', 'Action alignment.'],
        ['divided', 'boolean = true', '显示页脚分割线。', 'Show the footer divider.'],
        ['children', 'ReactNode', '通常放置 Cancel 与 Action；支持原生 div 属性。', 'Usually contains Cancel and Action; accepts native div attributes.'],
      ] },
      { id: 'title', title: 'AlertDialog.Title', rows: [
        ['children', 'string', '弹窗名称，由 Radix 关联到内容。', 'Dialog title associated with the content by Radix.'],
        ['seed', 'string | number', '标题笔迹种子；支持其余 Radix Title 属性。', 'Title lettering seed; accepts other Radix Title props.'],
      ] },
      { id: 'description', title: 'AlertDialog.Description', rows: [
        ['children', 'string', '弹窗说明，由 Radix 关联到内容。', 'Dialog description associated with the content by Radix.'],
        ['seed', 'string | number', '说明笔迹种子；支持其余 Radix Description 属性。', 'Description lettering seed; accepts other Radix Description props.'],
      ] },
      { id: 'cancel', title: 'AlertDialog.Cancel', rows: [
        ['variant', 'ButtonProps["variant"] = "secondary"', '取消按钮样式。', 'Cancel button appearance.'],
        ['disabled', 'boolean', '禁用按钮；Root.pending 也会禁用。', 'Disable the button; Root.pending also disables it.'],
        ['children / onClick', 'ReactNode / MouseEventHandler<HTMLButtonElement>', '按钮内容与点击事件；支持除 type 外的 Button 属性。', 'Button content and click handler; accepts Button props except type.'],
      ] },
      { id: 'action', title: 'AlertDialog.Action', rows: [
        ['closeOnAction', 'boolean = true', '点击后默认关闭；异步操作设为 false 并自行控制 open。', 'Close on activation by default; use false and control open for async actions.'],
        ['variant', 'ButtonProps["variant"] = "destructive"', '确认按钮样式。', 'Action button appearance.'],
        ['disabled / loading', 'boolean', '禁用与加载状态；Root.pending 同时启用两者。', 'Disabled and loading states; Root.pending enables both.'],
        ['children / onClick', 'ReactNode / MouseEventHandler<HTMLButtonElement>', '按钮内容与点击事件；支持除 type 外的 Button 属性。', 'Button content and click handler; accepts Button props except type.'],
      ] },
    ],
    a11y: {
      zh: '使用 alertdialog 语义；优先聚焦可用的取消按钮，否则聚焦弹窗本身，不默认聚焦危险操作。焦点被限制在弹层内并在关闭后返回触发器，pending 时会阻止组件内的取消、Escape 与关闭控件；受控父组件仍负责自身 open 状态。',
      en: 'Uses alertdialog semantics and focuses an available Cancel button, otherwise the dialog itself, never a destructive action by default. Focus is trapped and returned to the trigger. Pending blocks in-component Cancel, Escape, and close controls; a controlled parent still owns its open state.',
    },
    Examples: AlertDialogExamples,
  },
  drawer: {
    name: 'Drawer',
    intro: {
      zh: '主线先别关，支线任务从旁边拉出来。',
      en: 'A side quest slides in. Your main quest stays put.',
    },
    apiGroups: [
      { id: 'root', title: 'Drawer.Root', rows: [
        ['open / defaultOpen', 'boolean', '受控或非受控打开状态。', 'Controlled or initial open state.'],
        ['onOpenChange', '(open: boolean) => void', '打开状态变化回调。', 'Called when the open state changes.'],
        ['modal', 'boolean', '继承 Radix Dialog 的模态行为配置。', 'Inherit Radix Dialog modal behavior configuration.'],
      ] },
      { id: 'trigger', title: 'Drawer.Trigger', rows: [
        ['asChild / children', 'boolean / ReactNode', '通过 asChild 复用触发按钮；支持 Radix Trigger 属性。', 'Use asChild to reuse the trigger button; accepts Radix Trigger props.'],
      ] },
      { id: 'portal', title: 'Drawer.Portal', rows: [
        ['container', 'HTMLElement | null', '指定挂载容器，保留局部主题。', 'Choose the portal container while preserving the local theme.'],
        ['forceMount', 'true', '由外部动画控制挂载。', 'Keep mounted for external animation control.'],
      ] },
      { id: 'backdrop', title: 'Drawer.Backdrop', rows: [
        ['asChild / forceMount', 'boolean / true', '透传 Radix Overlay 配置。', 'Forward Radix Overlay configuration.'],
        ['className / style', 'string / CSSProperties', '遮罩样式。', 'Backdrop styling.'],
      ] },
      { id: 'content', title: 'Drawer.Content', rows: [
        ['direction', '"top" | "right" | "bottom" | "left" = "right"', '抽屉进入方向。', 'Edge from which the drawer enters.'],
        ['size', '"sm" | "md" | "lg" | number | string = "md"', '预设为 20/28/36rem；数字按 px，自定义字符串为 CSS 长度。', 'Presets are 20/28/36rem; numbers use px and strings accept CSS lengths.'],
        ['seed', 'string | number', '纸面笔触种子。', 'Seed for the pencil surface.'],
        ['onOpenAutoFocus / onCloseAutoFocus', '(event: Event) => void', '打开与关闭时的焦点生命周期。', 'Focus lifecycle on open and close.'],
        ['onEscapeKeyDown / onPointerDownOutside / onInteractOutside', 'DialogContentProps handlers', '取消事件默认行为可阻止关闭。', 'Prevent the event default to stop dismissal.'],
        ['children / className / style', 'ReactNode / string / CSSProperties', '内容与样式；支持其余 Radix Content 属性。', 'Content and styling; other Radix Content props are supported.'],
      ] },
      { id: 'header', title: 'Drawer.Header', rows: [
        ['action', 'ReactNode', '页头右侧的自定义操作。', 'Custom actions at the end of the header.'],
        ['showClose', 'boolean = true', '是否显示关闭按钮。', 'Show the close button.'],
        ['closeLabel', 'string', '关闭按钮名称，默认来自当前语言字典。', 'Close button label, defaulting to the active locale dictionary.'],
        ['divided', 'boolean = true', '显示页头分割线。', 'Show the header divider.'],
        ['children', 'ReactNode', '通常放置 Title 与 Description；支持原生 div 属性。', 'Usually contains Title and Description; accepts native div attributes.'],
      ] },
      { id: 'body', title: 'Drawer.Body', rows: [
        ['children', 'ReactNode', '负责长内容滚动的正文区域；支持原生 div 属性。', 'Body region that owns long-content scrolling; accepts native div attributes.'],
      ] },
      { id: 'footer', title: 'Drawer.Footer', rows: [
        ['align', '"start" | "center" | "end" = "end"', '操作区对齐。', 'Action alignment.'],
        ['divided', 'boolean = true', '显示页脚分割线。', 'Show the footer divider.'],
        ['children', 'ReactNode', '页脚内容；支持原生 div 属性。', 'Footer content; accepts native div attributes.'],
      ] },
      { id: 'title', title: 'Drawer.Title', rows: [
        ['children', 'string', '抽屉名称，由 Radix 关联到内容。', 'Drawer title associated with the content by Radix.'],
        ['seed', 'string | number', '标题笔迹种子；支持其余 Radix Title 属性。', 'Title lettering seed; accepts other Radix Title props.'],
      ] },
      { id: 'description', title: 'Drawer.Description', rows: [
        ['children', 'string', '抽屉说明，由 Radix 关联到内容。', 'Drawer description associated with the content by Radix.'],
        ['seed', 'string | number', '说明笔迹种子；支持其余 Radix Description 属性。', 'Description lettering seed; accepts other Radix Description props.'],
      ] },
      { id: 'close', title: 'Drawer.Close', rows: [
        ['asChild / children', 'boolean / ReactNode', '将现有按钮组合为关闭触发器；支持 Radix Close 属性。', 'Compose an existing button as a close trigger; accepts Radix Close props.'],
      ] },
      { id: 'close-button', title: 'Drawer.CloseButton', rows: [
        ['label', 'string', '关闭图标及 Tooltip 的名称，默认来自当前语言字典。', 'Label for the close icon and tooltip, defaulting to the active locale dictionary.'],
        ['disabled / onClick', 'boolean / MouseEventHandler<HTMLButtonElement>', '关闭按钮状态与点击事件；type、size、variant、loading、children 和 aria-label 由组件管理。', 'Close button state and click handler; type, size, variant, loading, children and aria-label are component-owned.'],
      ] },
    ],
    a11y: {
      zh: '由成熟 Dialog 原语提供焦点限制、Escape 关闭和触发器焦点返回。关闭图标始终需要本地化名称；本版不声明滑动关闭。',
      en: 'A mature Dialog primitive provides focus trapping, Escape dismissal, and trigger focus return. The close icon always needs a localized name; swipe dismissal is not supported.',
    },
    Examples: DrawerExamples,
  },
};
