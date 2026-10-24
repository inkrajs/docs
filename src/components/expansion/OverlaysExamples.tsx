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
    { label: '状态', content: <><p className="component-demo-status">{pending ? (zh ? '正在处理，关闭已锁定' : 'Pending; dismissal is locked') : (zh ? '空闲' : 'Idle')}</p><Button variant="secondary" onClick={() => setOpen(true)} disabled={open}>{zh ? '从属性区打开' : 'Open from controls'}</Button></> },
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
      <output className="expansion-overlay-demo__status" aria-live="polite">{message === 'idle' ? (zh ? '等待操作' : 'Waiting') : message === 'pending' ? (zh ? '正在归档…' : 'Archiving...') : (zh ? '归档完成' : 'Archived')}</output>
    </div>
  </ComponentPlayground>;
}

function AlertDialogExamples() {
  const { locale } = useLocale();
  const zh = locale === 'zh-CN';
  return <div className="component-examples expansion-overlays-examples">
    <AlertDialogPlayground />
    <ComponentExample title={zh ? '安全确认' : 'Safe confirmation'} code={`import { useState } from 'react';
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
  const [saved, setSaved] = useState(false);
  const directionLabels = { top: zh ? '上' : 'Top', right: zh ? '右' : 'Right', bottom: zh ? '下' : 'Bottom', left: zh ? '左' : 'Left' };
  const sizeLabels = { sm: zh ? '小' : 'Small', md: zh ? '中' : 'Medium', lg: zh ? '大' : 'Large' };
  function changeOpen(next: boolean) {
    if (next) setDraftName(savedName);
    setOpen(next);
  }
  function saveDraft() {
    setSavedName(draftName);
    setSaved(true);
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
    <output className="expansion-overlay-demo__status" aria-live="polite">{saved ? (zh ? `本次预览已保存：${savedName}` : `Saved in this preview: ${savedName}`) : savedName}</output>
    </div>
  </ComponentPlayground>;
}

function DrawerExamples() {
  const { locale } = useLocale();
  const zh = locale === 'zh-CN';
  return <div className="component-examples expansion-overlays-examples">
    <DrawerPlayground />
    <ComponentExample title={zh ? '侧边详情' : 'Side details'} code={`import { Button, Drawer } from '@inkra/react';

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
    api: [
      ['Root', 'open, defaultOpen, onOpenChange, pending; always modal'],
      ['Content', 'Radix content props; outside interaction never dismisses'],
      ['Header / Body / Footer', 'section layout; divided and footer align options'],
      ['Cancel', 'secondary close button; disabled while pending'],
      ['Action', 'closes by default; closeOnAction=false for controlled async work'],
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
    api: [
      ['Content.direction', "'top' | 'right' | 'bottom' | 'left'"],
      ['Content.size', "'sm' | 'md' | 'lg' | number | CSS length"],
      ['Header', 'showClose, closeLabel, divided, action'],
      ['Body', 'scroll owner for long drawer content'],
      ['Footer', "divided; align 'start' | 'center' | 'end'"],
    ],
    a11y: {
      zh: '由成熟 Dialog 原语提供焦点限制、Escape 关闭和触发器焦点返回。关闭图标始终需要本地化名称；本版不声明滑动关闭。',
      en: 'A mature Dialog primitive provides focus trapping, Escape dismissal, and trigger focus return. The close icon always needs a localized name; swipe dismissal is not supported.',
    },
    Examples: DrawerExamples,
  },
};
