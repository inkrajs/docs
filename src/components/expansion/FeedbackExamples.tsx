import {
  Button,
  Empty,
  PencilIcon,
  Switch,
  Toast,
  ToggleGroup,
  useToastManager,
  type ToastPlacement,
  type ToastVariant,
  type EmptyIllustration,
} from '@inkra/react';
import { useRef, useState } from 'react';

import { ComponentExample } from '../ComponentExample';
import { ComponentPlayground } from '../ComponentPlayground';
import { DocsSelect } from '../DocsSelect';
import { PropertyTabs } from '../PropertyTabs';
import { useLocale } from '../../i18n';
import type { ExpansionDoc } from './types';
import './FeedbackExamples.css';

const emptyIllustrations: [EmptyIllustration, string, string][] = [
  ['inbox', '暂无内容', 'No content'], ['search', '无搜索结果', 'No results'],
  ['folder', '空文件夹', 'Empty folder'], ['documents', '暂无文档', 'No documents'],
  ['messages', '暂无消息', 'No messages'], ['image', '暂无图片', 'No images'],
  ['offline', '连接中断', 'Offline'], ['favorites', '暂无收藏', 'No favorites'],
];
const checkPaths = [
  { d: 'M5 12.5 10 17l9-10' },
] as const;
const alignStartPaths = [
  { d: 'M5 6h14' }, { d: 'M5 11h9' }, { d: 'M5 16h12' },
] as const;
const alignCenterPaths = [
  { d: 'M5 6h14' }, { d: 'M7.5 11h9' }, { d: 'M6 16h12' },
] as const;
const alignEndPaths = [
  { d: 'M5 6h14' }, { d: 'M10 11h9' }, { d: 'M7 16h12' },
] as const;

function useBilingual() {
  const { locale } = useLocale();
  const zh = locale === 'zh-CN';
  return (cn: string, en: string) => zh ? cn : en;
}

const toastPositions: [ToastPlacement, string, string][] = [
  ['top-start', '左上', 'Top start'], ['top-center', '顶部居中', 'Top center'], ['top-end', '右上', 'Top end'],
  ['center-start', '左侧居中', 'Center start'], ['center', '正中', 'Center'], ['center-end', '右侧居中', 'Center end'],
  ['bottom-start', '左下', 'Bottom start'], ['bottom-center', '底部居中', 'Bottom center'], ['bottom-end', '右下', 'Bottom end'],
];

function ToastControls() {
  const text = useBilingual();
  const [timeout, setTimeoutValue] = useState(5000);
  const [placement, setPlacement] = useState<ToastPlacement>('bottom-end');
  const [variant, setVariant] = useState<ToastVariant>('auto');

  return (
    <Toast.Provider placement={placement} variant={variant} timeout={timeout} limit={3} closeLabel={text('关闭通知', 'Close notification')} viewportLabel={position => {
      const [, zh, en] = toastPositions.find(item => item[0] === position)!;
      return `${text('通知', 'Notifications')}: ${text(zh, en)}`;
    }}>
      <div className="component-examples feedback-examples">
      <ToastControlsContent
        placement={placement}
        setPlacement={setPlacement}
        setTimeoutValue={setTimeoutValue}
        timeout={timeout}
        variant={variant}
        setVariant={setVariant}
      />
      <BasicToastExampleContent />
      <ToastPositionsExample />
      <ToastQueueExample />
      </div>
    </Toast.Provider>
  );
}

function ToastControlsContent({
  placement,
  setPlacement,
  setTimeoutValue,
  timeout,
  variant,
  setVariant,
}: {
  placement: ToastPlacement;
  setPlacement: (placement: ToastPlacement) => void;
  setTimeoutValue: (timeout: number) => void;
  timeout: number;
  variant: ToastVariant;
  setVariant: (variant: ToastVariant) => void;
}) {
  const text = useBilingual();
  const toast = useToastManager();
  const lastId = useRef<string | undefined>(undefined);
  const [tone, setTone] = useState<'neutral' | 'success' | 'warning' | 'danger' | 'info'>('neutral');
  const [priority, setPriority] = useState<'low' | 'high'>('low');
  const [withAction, setWithAction] = useState(true);

  const addToast = () => {
    lastId.current = toast.add({
      title: text('行程已保存', 'Itinerary saved'),
      description: text('刚刚修改的内容已同步到工作区。', 'Your changes have been synced to the workspace.'),
      timeout,
      type: tone,
      priority,
      actionProps: withAction ? {
        children: text('撤销', 'Undo'),
        onClick: () => toast.add({ title: text('已撤销', 'Undone'), type: 'info' }),
      } : undefined,
    });
  };

  const saveAsync = () => {
    const request = new Promise<string>((resolve) => window.setTimeout(() => resolve(text('草稿', 'Draft')), 650));
    void toast.promise(request, {
      loading: { title: text('正在保存', 'Saving'), description: text('请稍候…', 'Please wait…'), timeout: 0, type: 'info' },
      success: (name: string) => ({ title: text(`${name}已保存`, `${name} saved`), type: 'success' }),
      error: { title: text('保存失败', 'Save failed'), type: 'danger' },
    });
  };

  const code = `<Toast.Provider placement="${placement}" variant="${variant}" timeout={${timeout}} limit={3}>
  <SaveButtons />
</Toast.Provider>

function SaveButtons() {
  const toast = useToastManager();
  const undo = () => toast.add({ title: '${text('已撤销', 'Undone')}', type: 'info' });
  return <Button onClick={() => toast.add({
    title: '${text('行程已保存', 'Itinerary saved')}',
    type: '${tone}',
    priority: '${priority}',${withAction ? `
    actionProps: { children: '${text('撤销', 'Undo')}', onClick: undo },` : ''}
  })}>${text('显示通知', 'Show notification')}</Button>;
}`;

  return (
      <ComponentPlayground
        code={code}
        controls={<PropertyTabs groups={[
          { label: '基础', content: <>
            <DocsSelect label={text('语气', 'Tone')} value={tone} onValueChange={value => setTone(value as typeof tone)} options={[["neutral", "Neutral"], ["success", "Success"], ["warning", "Warning"], ["danger", "Danger"], ["info", "Info"]]} />
            <DocsSelect label={text('停留时间', 'Timeout')} value={String(timeout)} onValueChange={value => setTimeoutValue(Number(value))} options={[["0", text('手动关闭', 'Manual')], ["3000", "3000 ms"], ["5000", "5000 ms"]]} />
          </> },
          { label: '布局', content: <>
            <DocsSelect label={text('位置', 'Placement')} value={placement} onValueChange={value => setPlacement(value as ToastPlacement)} options={toastPositions.map(([value, zh, en]) => [value, text(zh, en)])} />
            <DocsSelect label={text('样式', 'Appearance')} value={variant} onValueChange={value => setVariant(value as ToastVariant)} options={[["auto", text('按位置自动', 'Automatic')], ["card", text('通知卡片', 'Card')], ["compact", text('紧凑提示', 'Compact')]]} />
          </> },
          { label: '交互', content: <>
            <DocsSelect label={text('播报优先级', 'Announcement priority')} value={priority} onValueChange={value => setPriority(value as typeof priority)} options={[["low", text('普通', 'Polite')], ["high", text('紧急', 'Urgent')]]} />
            <Switch label={text('显示撤销操作', 'Show undo action')} checked={withAction} onCheckedChange={setWithAction} />
          </> },
        ]} />}>
          <div className="component-demo-row">
            <Button onClick={addToast}>{text('显示通知', 'Show notification')}</Button>
            <Button variant="outline" onClick={saveAsync}>{text('保存草稿', 'Save draft')}</Button>
            <Button variant="ghost" onClick={() => lastId.current && toast.close(lastId.current)}>{text('关闭上一条', 'Close last')}</Button>
          </div>
      </ComponentPlayground>
  );
}

function ToastExamples() {
  return <ToastControls />;
}

function ToastPositionsExample() {
  const text = useBilingual();
  const toast = useToastManager();
  const code = `const toast = useToastManager();
toast.add({ title: '${text('保存完成', 'Saved')}', placement: 'top-center', timeout: 3000 });
toast.add({ title: '${text('文件上传完成', 'File uploaded')}', placement: 'bottom-end', timeout: 8000 });
toast.add({ title: '${text('等待确认', 'Waiting for confirmation')}', placement: 'center', variant: 'card', timeout: 0 });
toast.closeAll('top-center');`;
  return <ComponentExample title={text('独立位置与样式', 'Independent positions and styles')} code={code}>
    <div className="toast-position-grid">
      {toastPositions.map(([position, zh, en]) => <Button key={position} variant="outline" onClick={() => toast.add({ placement: position, variant: 'auto', title: text('保存完成', 'Saved'), timeout: 5000 })}>{text(zh, en)}</Button>)}
    </div>
    <div className="component-demo-row">
      <Button variant="ghost" onClick={() => {
        toast.add({ title: text('已复制链接', 'Link copied'), placement: 'top-center', timeout: 2000, variant: 'compact' });
        toast.add({ title: text('上传完成', 'Upload complete'), placement: 'bottom-end', timeout: 6000, variant: 'card', type: 'success' });
      }}>{text('同时显示两组', 'Show two queues')}</Button>
      <Button variant="ghost" onClick={() => toast.closeAll()}>{text('关闭全部', 'Close all')}</Button>
    </div>
  </ComponentExample>;
}

function BasicToastExampleContent() {
  const text = useBilingual();
  const toast = useToastManager();
  const code = `<Toast.Provider>
  <BasicToastButton />
</Toast.Provider>

function BasicToastButton() {
  const toast = useToastManager();
  return <Button onClick={() => toast.add({ title: '${text('保存好了', 'Saved')}' })}>
    ${text('显示通知', 'Show notification')}
  </Button>;
}`;
  return <ComponentExample title={text('基础通知', 'Basic notification')} code={code}>
    <Button onClick={() => toast.add({ title: text('保存好了', 'Saved'), description: text('可以继续下一步。', 'You can move on to the next step.') })}>{text('显示通知', 'Show notification')}</Button>
  </ComponentExample>;
}

function ToastQueueExample() {
  const text = useBilingual();
  const toast = useToastManager();
  const code = `<Toast.Provider limit={3}>
  <QueueButton />
</Toast.Provider>

function QueueButton() {
  const toast = useToastManager();
  const queue = () => {
    const ids = ['One', 'Two', 'Three', 'Four'].map(title => toast.add({ title, timeout: 0 }));
    const newestId = ids.at(-1);
    if (newestId) toast.update(newestId, { title: 'Updated', type: 'success' });
  };
  return <Button onClick={queue}>${text('加入四条通知', 'Queue four notifications')}</Button>;
}`;
  return <ComponentExample title={text('队列、更新与关闭', 'Queue, update, and close')} code={code}>
    <Button variant="outline" onClick={() => {
      for (let index = 1; index <= 4; index += 1) {
        const id = toast.add({ title: text(`通知 ${index}`, `Notification ${index}`), timeout: 0 });
        if (index === 4) window.setTimeout(() => toast.update(id, { description: text('已原位更新', 'Updated in place'), type: 'success' }), 400);
      }
    }}>{text('加入四条通知', 'Queue four notifications')}</Button>
  </ComponentExample>;
}

function EmptyExamples() {
  const text = useBilingual();
  const [illustration, setIllustration] = useState<EmptyIllustration>('inbox');
  const [size, setSize] = useState<'sm' | 'md' | 'lg'>('md');
  const [align, setAlign] = useState<'start' | 'center'>('center');
  const [showIcon, setShowIcon] = useState(true);
  const [showDescription, setShowDescription] = useState(true);
  const [showActions, setShowActions] = useState(true);
  const [noteCreated, setNoteCreated] = useState(false);
  const [inboxStatus, setInboxStatus] = useState('');
  const code = `const [noteCreated, setNoteCreated] = useState(false);

<Empty.Root size="${size}" align="${align}" aria-labelledby="empty-title">
  ${showIcon ? `<Empty.Icon illustration="${illustration}" />\n  ` : ''}<Empty.Title id="empty-title">
    {noteCreated ? '${text('第一条笔记已就位', 'Your first note is ready')}' : '${text('还没有笔记', 'No notes yet')}' }
  </Empty.Title>${showDescription ? `
  <Empty.Description>{noteCreated ? '${text('这是本地演示状态。', 'This is local demo state.')}' : '${text('从第一条想法开始。', 'Start with the first idea.')}'}</Empty.Description>` : ''}${showActions ? `
  <Empty.Actions>
    <Button onClick={() => setNoteCreated(current => !current)}>
      {noteCreated ? '${text('重置', 'Reset')}' : '${text('新建笔记', 'Create note')}' }
    </Button>
  </Empty.Actions>` : ''}
</Empty.Root>`;
  return <div className="component-examples feedback-examples">
    <ComponentPlayground code={code} controls={<PropertyTabs groups={[
      { label: '基础', content: <><DocsSelect label={text('尺寸', 'Size')} value={size} onValueChange={value => setSize(value as typeof size)} options={[["sm", "小"], ["md", "中"], ["lg", "大"]]} /><DocsSelect label={text('插画', 'Illustration')} value={illustration} onValueChange={value => setIllustration(value as EmptyIllustration)} options={emptyIllustrations.map(([value, zh, en]) => [value, text(zh, en)])} /></> },
      { label: '内容', content: <><Switch label={text('显示图标', 'Show icon')} checked={showIcon} onCheckedChange={setShowIcon} /><Switch label={text('显示说明', 'Show description')} checked={showDescription} onCheckedChange={setShowDescription} /><Switch label={text('显示操作', 'Show action')} checked={showActions} onCheckedChange={setShowActions} /></> },
      { label: '布局', content: <DocsSelect label={text('对齐', 'Alignment')} value={align} onValueChange={value => setAlign(value as typeof align)} options={[["start", text('靠前', 'Start')], ["center", text('居中', 'Center')]]} /> },
    ]} />}>
      <Empty.Root size={size} align={align} aria-labelledby="empty-playground-title">
        {showIcon && <Empty.Icon illustration={illustration} />}
        <Empty.Title id="empty-playground-title">{noteCreated ? text('第一条笔记已就位', 'Your first note is ready') : text('还没有笔记', 'No notes yet')}</Empty.Title>
        {showDescription && <Empty.Description>{noteCreated ? text('这是本地演示状态。', 'This is local demo state.') : text('从第一条想法开始。', 'Start with the first idea.')}</Empty.Description>}
        {showActions && <Empty.Actions><Button onClick={() => setNoteCreated(current => !current)}>{noteCreated ? text('重置', 'Reset') : text('新建笔记', 'Create note')}</Button></Empty.Actions>}
      </Empty.Root>
    </ComponentPlayground>
    <ComponentExample title={text('通用场景插画', 'Illustration collection')} code={'<Empty.Icon illustration="search" />\n<Empty.Icon illustration="folder" size={144} />'}>
      <div className="empty-illustration-gallery">
        {emptyIllustrations.map(([value, zh, en]) => <Empty.Root key={value} size="sm">
          <Empty.Icon illustration={value} />
          <Empty.Title>{text(zh, en)}</Empty.Title>
        </Empty.Root>)}
      </div>
    </ComponentExample>
    <ComponentExample title={text('自定义图形', 'Custom visual')} code={'<Empty.Icon><PencilIcon paths={[{ d: "M5 12.5 10 17l9-10" }]} size={64} sourceSize={24} /></Empty.Icon>'}>
      <Empty.Root>
        <Empty.Icon><PencilIcon paths={checkPaths} size={64} sourceSize={24} decorative /></Empty.Icon>
        <Empty.Title>{text('全部处理完了', 'All caught up')}</Empty.Title>
      </Empty.Root>
    </ComponentExample>
    <ComponentExample title={text('最小空态', 'Minimal empty state')} code={`<Empty.Root><Empty.Title>${text('暂无内容', 'Nothing here yet')}</Empty.Title></Empty.Root>`}>
      <Empty.Root><Empty.Title>{text('暂无内容', 'Nothing here yet')}</Empty.Title></Empty.Root>
    </ComponentExample>
    <ComponentExample title={text('说明与操作', 'Description and actions')} code={`const [status, setStatus] = useState('');

<Empty.Root aria-labelledby="empty-title">
  <Empty.Icon illustration="messages" />
  <Empty.Title id="empty-title">${text('收件箱是空的', 'Your inbox is empty')}</Empty.Title>
  <Empty.Description>${text('新消息会显示在这里。', 'New messages will appear here.')}</Empty.Description>
  <Empty.Actions>
    <Button onClick={() => setStatus('${text('已打开编辑器', 'Composer opened')}')}>${text('写一条消息', 'Write a message')}</Button>
    <Button variant="outline" onClick={() => setStatus('${text('正在查看草稿', 'Viewing drafts')}')}>${text('查看草稿', 'View drafts')}</Button>
  </Empty.Actions>
  <output aria-live="polite">{status}</output>
</Empty.Root>`}>
      <Empty.Root aria-labelledby="empty-example-title">
        <Empty.Icon illustration="messages" />
        <Empty.Title id="empty-example-title">{text('收件箱是空的', 'Your inbox is empty')}</Empty.Title>
        <Empty.Description>{text('新消息会显示在这里，也可以先创建一条草稿。', 'New messages will appear here, or you can start with a draft.')}</Empty.Description>
        <Empty.Actions><Button onClick={() => setInboxStatus(text('已打开编辑器', 'Composer opened'))}>{text('写一条消息', 'Write a message')}</Button><Button variant="outline" onClick={() => setInboxStatus(text('正在查看草稿', 'Viewing drafts'))}>{text('查看草稿', 'View drafts')}</Button></Empty.Actions>
        <output className="component-demo-status" aria-live="polite">{inboxStatus}</output>
      </Empty.Root>
    </ComponentExample>
    <ComponentExample title={text('非卡片布局', 'Unframed layout')} code={`<Empty.Root align="start" size="sm"><Empty.Title>${text('没有筛选结果', 'No matching results')}</Empty.Title><Empty.Description>…</Empty.Description></Empty.Root>`}>
      <Empty.Root align="start" size="sm"><Empty.Title>{text('没有筛选结果', 'No matching results')}</Empty.Title><Empty.Description>{text('尝试移除一个筛选条件。', 'Try removing one filter.')}</Empty.Description></Empty.Root>
    </ComponentExample>
  </div>;
}

function ToggleGroupExamples() {
  const text = useBilingual();
  const [multiple, setMultiple] = useState(false);
  const [orientation, setOrientation] = useState<'horizontal' | 'vertical'>('horizontal');
  const [size, setSize] = useState<'sm' | 'md' | 'lg'>('md');
  const [disabled, setDisabled] = useState(false);
  const [rtl, setRtl] = useState(false);
  const [value, setValue] = useState<string[]>(['start']);
  const code = `const [value, setValue] = useState<string[]>(${JSON.stringify(value)});
const multiple = ${multiple};
const orientation = '${orientation}' as const;
const size = '${size}' as const;
const disabled = ${disabled};
const rtl = ${rtl};

<ToggleGroup.Root
  aria-label="${text('文字对齐', 'Text alignment')}"
  value={value}
  onValueChange={setValue}
  multiple={multiple}
  orientation={orientation}
  size={size}
  disabled={disabled}
  dir={rtl ? 'rtl' : 'ltr'}
>
  <ToggleGroup.Item value="start">${text('靠前', 'Start')}</ToggleGroup.Item>
  <ToggleGroup.Item value="center">${text('居中', 'Center')}</ToggleGroup.Item>
  <ToggleGroup.Item value="end">${text('靠后', 'End')}</ToggleGroup.Item>
</ToggleGroup.Root>`;
  const icons = [alignStartPaths, alignCenterPaths, alignEndPaths];

  return <div className="component-examples feedback-examples">
    <ComponentPlayground code={code} controls={<PropertyTabs groups={[
      { label: '基础', content: <>
        <DocsSelect label={text('尺寸', 'Size')} value={size} onValueChange={value => setSize(value as typeof size)} options={[["sm", "小"], ["md", "中"], ["lg", "大"]]} />
        <DocsSelect label={text('方向', 'Orientation')} value={orientation} onValueChange={value => setOrientation(value as typeof orientation)} options={[["horizontal", text('横向', 'Horizontal')], ["vertical", text('纵向', 'Vertical')]]} />
      </> },
      { label: '状态', content: <><Switch label={text('允许多选', 'Multiple')} checked={multiple} onCheckedChange={next => { setMultiple(next); setValue(['start']); }} /><Switch label={text('整体禁用', 'Disabled')} checked={disabled} onCheckedChange={setDisabled} /></> },
      { label: '布局', content: <Switch label="RTL" checked={rtl} onCheckedChange={setRtl} /> },
    ]} />}>
      <div className="feedback-toggle-stage" dir={rtl ? 'rtl' : 'ltr'}>
        <ToggleGroup.Root aria-label={text('文字对齐', 'Text alignment')} value={value} onValueChange={setValue} multiple={multiple} orientation={orientation} size={size} disabled={disabled} dir={rtl ? 'rtl' : 'ltr'}>
          {['start', 'center', 'end'].map((item, index) => <ToggleGroup.Item key={item} value={item} startIcon={<PencilIcon paths={icons[index]} size={20} sourceSize={24} decorative />}>{text(['靠前', '居中', '靠后'][index], ['Start', 'Center', 'End'][index])}</ToggleGroup.Item>)}
        </ToggleGroup.Root>
      </div>
    </ComponentPlayground>
    <ComponentExample title={text('基础单选', 'Basic single selection')} code={`<ToggleGroup.Root aria-label="${text('文字对齐', 'Text alignment')}" defaultValue={['start']}><ToggleGroup.Item value="start">${text('靠前', 'Start')}</ToggleGroup.Item><ToggleGroup.Item value="center">${text('居中', 'Center')}</ToggleGroup.Item></ToggleGroup.Root>`}>
      <ToggleGroup.Root aria-label={text('基础文字对齐', 'Basic text alignment')} defaultValue={['start']}><ToggleGroup.Item value="start">{text('靠前', 'Start')}</ToggleGroup.Item><ToggleGroup.Item value="center">{text('居中', 'Center')}</ToggleGroup.Item></ToggleGroup.Root>
    </ComponentExample>
    <ComponentExample title={text('多选与禁用项', 'Multiple selection and disabled item')} code={`<ToggleGroup.Root multiple defaultValue={['bold']} aria-label="${text('文字样式', 'Text style')}"><ToggleGroup.Item value="bold">Bold</ToggleGroup.Item><ToggleGroup.Item value="italic">Italic</ToggleGroup.Item><ToggleGroup.Item value="strike" disabled>Strike</ToggleGroup.Item></ToggleGroup.Root>`}>
      <ToggleGroup.Root multiple defaultValue={['bold']} aria-label={text('文字样式', 'Text style')}><ToggleGroup.Item value="bold">{text('粗体', 'Bold')}</ToggleGroup.Item><ToggleGroup.Item value="italic">{text('斜体', 'Italic')}</ToggleGroup.Item><ToggleGroup.Item value="strike" disabled>{text('删除线', 'Strike')}</ToggleGroup.Item></ToggleGroup.Root>
    </ComponentExample>
    <ComponentExample title={text('仅图标按钮', 'Icon-only buttons')} code={`const checkPaths = ${JSON.stringify(checkPaths, null, 2)};
<ToggleGroup.Root aria-label="${text('完成状态', 'Completion state')}" defaultValue={['done']}><ToggleGroup.Item value="done" aria-label="${text('完成', 'Done')}"><PencilIcon paths={checkPaths} /></ToggleGroup.Item></ToggleGroup.Root>`}>
      <ToggleGroup.Root aria-label={text('完成状态', 'Completion state')} defaultValue={['done']}><ToggleGroup.Item value="done" aria-label={text('完成', 'Done')}><PencilIcon paths={checkPaths} size={22} sourceSize={24} decorative /></ToggleGroup.Item></ToggleGroup.Root>
    </ComponentExample>
  </div>;
}

export const feedbackDocs: Record<string, ExpansionDoc> = {
  toast: {
    name: 'Toast',
    intro: { zh: '通知你一下，没打算跟你开个会。', en: 'A quick heads-up. This does not need to be a meeting.' },
    api: [
      ['Toast.Provider', 'timeout, limit, limits, placement, variant, swipeDirection, toastManager, closeLabel, viewportLabel, viewportClassName'],
      ['placement', 'top-start | top-center | top-end | center-start | center | center-end | bottom-start | bottom-center | bottom-end', '默认 bottom-end；start/end 随 RTL 翻转。修改默认位置只影响之后创建的通知。', 'Defaults to bottom-end. Start/end follow RTL. Changing the default only affects new notifications.'],
      ['variant', 'auto | card | compact', '默认 auto：四角使用卡片，其余位置使用紧凑提示。两种样式均可用于任意位置，单条通知可覆盖。', 'Auto uses cards at corners and compact messages elsewhere. Either style can be used at any position and overridden per toast.'],
      ['limit / limits', 'number / Partial<Record<ToastPlacement, number>>', 'limit 默认 3，独立应用于每个位置；limits 按位置覆盖。超额旧通知隐藏，新通知优先显示。', 'Limit defaults to 3 per position; limits overrides individual queues. Excess older notifications are hidden, with newer ones displayed first.'],
      ['timeout', 'number', '默认 5000 毫秒，0 表示不自动关闭；单条通知可独立覆盖，悬停和聚焦只暂停所在队列。', 'Defaults to 5000 ms; 0 disables automatic dismissal. Each toast can override it. Hover and focus pause only that queue.'],
      ['useToastManager', 'toasts, add(options), update(id, options), close(id?), closeAll(placement?), promise(promise, states)'],
      ['add', '({ title, description, placement?, variant?, timeout?, type?, actionProps?, data?, ... }) => string', '返回通知 id；位置在创建时确定，同 id 再次添加会在原队列更新并重置计时。', 'Returns a toast ID. Placement is fixed on creation; adding the same ID updates it in its original queue and resets its timer.'],
      ['update', '(id, options | (previous) => options) => void', '原位更新文字、样式、超时或操作，保留所属队列。', 'Update content, appearance, timeout or actions in place without changing queues.'],
      ['close / closeAll', 'close(id?) / closeAll(placement?)', 'close(id) 关闭单条，close() 关闭全部；closeAll(placement) 仅关闭指定位置。', 'Close one by ID, or all when omitted. closeAll(placement) only clears the specified queue.'],
      ['promise', '(promise, { loading, success, error, placement?, variant? }) => Promise', '异步通知从等待到成功或失败保持同一位置和 id，拒绝状态仍需调用方处理。', 'Loading, success and error retain the same ID and position. The caller must still handle a rejected promise.'],
      ['createToastManager', 'Create an external manager and pass it to Toast.Provider'],
    ],
    a11y: { zh: 'Base UI 负责播报、各队列的悬停与聚焦暂停、滑动关闭及数量限制。F6 / Shift+F6 在非空队列间移动，边界 Tab 或键盘关闭返回原控件。关闭操作始终有名称；高优先级只用于紧急更新。', en: 'Base UI owns announcements, per-queue hover/focus pause, swipe dismissal and limits. F6 / Shift+F6 move between nonempty queues; boundary Tab or keyboard dismissal returns to the original control. Close actions are named; reserve high priority for urgent updates.' },
    Examples: ToastExamples,
  },
  empty: {
    name: 'Empty',
    intro: { zh: '这里真的什么都没有，不是你网卡了。', en: 'Nothing here. Your internet is fine.' },
    api: [
      ['Empty.Root', 'size: sm | md | lg; align: start | center; native div props', '组件尺寸和对齐；预设插画分别为 112 / 160 / 192px。', 'Size and alignment; preset illustrations are 112 / 160 / 192px.'],
      ['Empty.Icon.illustration', 'inbox | search | folder | documents | messages | image | offline | favorites', '默认 inbox，复用彩铅笔触渲染 SVG 路径。', 'Defaults to inbox. SVG paths use the shared pencil renderer.'],
      ['Empty.Icon.size', 'number', '覆盖预设插画尺寸（像素），不超过容器可用宽度；无效值回退默认尺寸。', 'Override preset size in pixels, bounded by available width. Invalid values use the default.'],
      ['Empty.Icon.children', 'ReactNode', '传入自定义图形时替换预设；null 隐藏图形。', 'Custom children replace the preset; null hides the visual.'],
      ['Empty.Icon.decorative', 'boolean = true', '默认对辅助技术隐藏；设为 false 时用 aria-label 提供名称。', 'Hidden from assistive technology by default. When false, supply an aria-label.'],
      ['Empty.Title', 'Optional heading; as selects the heading element'], ['Empty.Description', 'Optional supporting paragraph'], ['Empty.Actions', 'Optional action group'],
    ],
    a11y: { zh: '按页面层级选择标题元素，并用 aria-labelledby 或周边结构建立名称。插画默认仅作装饰；有独立含义时设 decorative={false} 并提供 aria-label。强制颜色、打印和绘制失败保留 SVG 后备；交互只放在真实控件中。', en: 'Choose a heading that fits the hierarchy and name the region with aria-labelledby or surrounding structure. Illustrations are decorative by default; use decorative={false} with aria-label for meaningful visuals. SVG fallbacks remain in forced colors, print and drawing failures. Actions stay real controls.' },
    Examples: EmptyExamples,
  },
  'toggle-group': {
    name: 'ToggleGroup',
    intro: { zh: '加粗壮胆，斜体歪头。也可以一起。', en: 'Feeling bold? Leaning italic? Both is an option.' },
    api: [['ToggleGroup.Root', 'value/defaultValue: string[]; onValueChange; multiple; orientation; loopFocus; disabled; size'], ['ToggleGroup.Item', 'value; disabled; startIcon; endIcon; native button and ARIA props']],
    a11y: { zh: 'Root 使用 group，Item 是带 aria-pressed 的原生按钮。水平组用左右方向键，垂直组用上下方向键；Tab 只进入当前漫游焦点项。', en: 'Root uses group semantics and each Item is a native button with aria-pressed. Horizontal groups use Left/Right, vertical groups use Up/Down, and Tab enters the current roving item.' },
    Examples: ToggleGroupExamples,
  },
};
