import { useState } from 'react';
import {
  AlertDialog,
  Button,
  Drawer,
  PencilIcon,
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
  const [result, setResult] = useState(zh ? '尚未操作' : 'No action yet');
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
            <AlertDialog.Cancel onClick={() => setResult(zh ? '已取消' : 'Cancelled')}>{zh ? '取消' : 'Cancel'}</AlertDialog.Cancel>
            <AlertDialog.Action onClick={() => setResult(zh ? '已确认删除' : 'Deletion confirmed')}>{zh ? '删除' : 'Delete'}</AlertDialog.Action>
          </AlertDialog.Footer>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
    <output className="expansion-overlay-demo__status">{result}</output>
  </div>;
}

function AlertDialogPlayground() {
  const { locale } = useLocale();
  const zh = locale === 'zh-CN';
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [delay, setDelay] = useState(700);
  const [message, setMessage] = useState(zh ? '等待操作' : 'Waiting');

  function confirmArchive() {
    if (pending) return;
    setPending(true);
    setMessage(zh ? '正在归档…' : 'Archiving...');
    window.setTimeout(() => {
      setPending(false);
      setOpen(false);
      setMessage(zh ? '归档完成' : 'Archived');
    }, delay);
  }

  const code = `<AlertDialog.Root open={open} onOpenChange={setOpen} pending={pending}>
  <AlertDialog.Trigger asChild><Button>归档项目</Button></AlertDialog.Trigger>
  <AlertDialog.Portal>
    <AlertDialog.Backdrop />
    <AlertDialog.Content>
      <AlertDialog.Header>
        <AlertDialog.Title>归档这个项目？</AlertDialog.Title>
        <AlertDialog.Description>归档期间用户发起的取消和 Escape 会被拦截。</AlertDialog.Description>
      </AlertDialog.Header>
      <AlertDialog.Body>团队成员将无法继续编辑。</AlertDialog.Body>
      <AlertDialog.Footer>
        <AlertDialog.Cancel>取消</AlertDialog.Cancel>
        <AlertDialog.Action closeOnAction={false} onClick={archive}>确认归档</AlertDialog.Action>
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
      <output className="expansion-overlay-demo__status">{message}</output>
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
  const paragraphs = Array.from({ length: 24 }, (_, index) => zh ? `第 ${index + 1} 条更新：这里是可滚动的完整正文，不会推动头部和底部操作。` : `Update ${index + 1}: this scrollable body does not move the header or footer actions.`);
  const code = `<Drawer.Root>
  <Drawer.Trigger asChild><Button>打开任务</Button></Drawer.Trigger>
  <Drawer.Portal>
    <Drawer.Backdrop />
    <Drawer.Content direction="${direction}" size="${size}">
      <Drawer.Header showClose={${showClose}} divided={${divided}}>
        <Drawer.Title>任务详情</Drawer.Title>
        <Drawer.Description>${direction} 方向，${size} 尺寸。</Drawer.Description>
      </Drawer.Header>
      <Drawer.Body><p>这里是可滚动的任务更新正文。</p></Drawer.Body>
      <Drawer.Footer divided={${divided}}>
        <Drawer.Close asChild><Button variant="secondary">关闭</Button></Drawer.Close>
        <Button>保存</Button>
      </Drawer.Footer>
    </Drawer.Content>
  </Drawer.Portal>
</Drawer.Root>`;
  return <ComponentPlayground code={code} controls={<PropertyTabs groups={[
    { label: '布局', content: <><DocsSelect label={zh ? '方向' : 'Direction'} value={direction} onValueChange={value => setDirection(value as typeof direction)} options={[["top", "top"], ["right", "right"], ["bottom", "bottom"], ["left", "left"]]} /><DocsSelect label={zh ? '尺寸' : 'Size'} value={size} onValueChange={value => setSize(value as typeof size)} options={[["sm", "sm"], ["md", "md"], ["lg", "lg"]]} /></> },
    { label: '内容', content: <><label className="check-control"><input type="checkbox" checked={showClose} onChange={event => setShowClose(event.target.checked)} />{zh ? '显示关闭按钮' : 'Show close button'}</label><label className="check-control"><input type="checkbox" checked={divided} onChange={event => setDivided(event.target.checked)} />{zh ? '显示分割线' : 'Show dividers'}</label></> },
  ]} />}>
    <Drawer.Root>
      <Drawer.Trigger asChild><Button>{zh ? '打开任务抽屉' : 'Open task drawer'}</Button></Drawer.Trigger>
      <Drawer.Portal>
        <Drawer.Backdrop />
        <Drawer.Content direction={direction} size={size}>
          <Drawer.Header closeLabel={zh ? '关闭' : 'Close'} divided={divided} showClose={showClose}>
            <Drawer.Title>{zh ? '任务详情' : 'Task details'}</Drawer.Title>
            <Drawer.Description>{zh ? `${direction} 方向，${size} 尺寸。` : `${direction} direction, ${size} size.`}</Drawer.Description>
          </Drawer.Header>
          <Drawer.Body><div className="expansion-drawer-copy">{paragraphs.map(paragraph => <p key={paragraph}>{paragraph}</p>)}</div></Drawer.Body>
          <Drawer.Footer divided={divided}><Drawer.Close asChild><Button variant="secondary">{zh ? '关闭' : 'Close'}</Button></Drawer.Close><Button>{zh ? '保存' : 'Save'}</Button></Drawer.Footer>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
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
      zh: '要删除、归档或提交重要内容时，先停一下，让用户安心确认。',
      en: 'Give people a calm moment to confirm before deleting, archiving, or committing something important.',
    },
    api: [
      ['Root', 'open, defaultOpen, onOpenChange, pending; always modal'],
      ['Content', 'Radix content props; outside interaction never dismisses'],
      ['Header / Body / Footer', 'section layout; divided and footer align options'],
      ['Cancel', 'secondary close button; disabled while pending'],
      ['Action', 'closes by default; closeOnAction=false for controlled async work'],
    ],
    a11y: {
      zh: '使用 alertdialog 语义；取消按钮获得初始焦点。焦点被限制在弹层内并在关闭后返回触发器，pending 时会阻止组件内的取消、Escape 与关闭控件；受控父组件仍负责自身 open 状态。',
      en: 'Uses alertdialog semantics with initial focus on Cancel. Focus is trapped and returned to the trigger. Pending blocks in-component Cancel, Escape, and close controls; a controlled parent still owns its open state.',
    },
    Examples: AlertDialogExamples,
  },
  drawer: {
    name: 'Drawer',
    intro: {
      zh: '需要补充查看详情或完成一小段任务时，从屏幕边缘展开一块不打断上下文的空间。',
      en: 'Open a focused edge panel for details or a short task without losing the page underneath.',
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
