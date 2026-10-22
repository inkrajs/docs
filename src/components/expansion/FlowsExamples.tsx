import { useState } from 'react';
import {
  Button,
  Steps,
  Switch,
  Timeline,
  Upload,
  type StepItem,
  type TimelineItem,
  type UploadItem,
  type UploadLabels,
  type UploadRequestContext,
} from '@inkra/react';
import { PencilText, useLocale } from '../../i18n';
import { ComponentExample } from '../ComponentExample';
import { ComponentPlayground } from '../ComponentPlayground';
import { DocsSelect } from '../DocsSelect';
import { PropertyTabs } from '../PropertyTabs';
import type { ExpansionDoc } from './types';
import './FlowsExamples.css';

function localUploadLabels(zh: boolean): Partial<UploadLabels> {
  return zh ? {
    browse: '选择文件', drop: '或拖放到这里', selected: '已选择', upload: '上传', uploading: '上传中', success: '已完成',
    error: '上传失败', cancelled: '已取消', retry: '重试', cancel: '取消', remove: '移除', rejected: '未添加的文件',
    acceptError: '不支持此文件类型。', sizeError: size => `文件超过 ${Math.round(size / 1024 / 1024)} MB 限制。`,
    countError: count => `最多选择 ${count} 个文件。`,
  } : {};
}

function simulateLocalUpload(_file: File, { signal, reportProgress }: UploadRequestContext): Promise<void> {
  return new Promise((resolve, reject) => {
    let progress = 0;
    const timer = window.setInterval(() => {
      progress += 20;
      reportProgress(progress);
      if (progress >= 100) {
        window.clearInterval(timer);
        resolve();
      }
    }, 180);
    signal.addEventListener('abort', () => {
      window.clearInterval(timer);
      reject(new DOMException('Aborted', 'AbortError'));
    }, { once: true });
  });
}

function UploadExamples() {
  const { locale } = useLocale();
  const zh = locale === 'zh-CN';
  const labels = localUploadLabels(zh);
  const [files, setFiles] = useState<readonly UploadItem[]>([]);
  const [simulate, setSimulate] = useState(false);
  const [autoUpload, setAutoUpload] = useState(true);
  const [disabled, setDisabled] = useState(false);
  const [maxFiles, setMaxFiles] = useState('3');
  const [maxSize, setMaxSize] = useState('2');
  const code = `const [files, setFiles] = useState<readonly UploadItem[]>([]);
${simulate ? `
function simulateLocalUpload(_file: File, { signal, reportProgress }: UploadRequestContext) {
  return new Promise<void>((resolve, reject) => {
    let progress = 0;
    const timer = window.setInterval(() => {
      progress += 20;
      reportProgress(progress);
      if (progress >= 100) {
        window.clearInterval(timer);
        resolve();
      }
    }, 180);
    signal.addEventListener('abort', () => {
      window.clearInterval(timer);
      reject(new DOMException('Aborted', 'AbortError'));
    }, { once: true });
  });
}
` : ''}
<Upload
  accept="image/png,image/jpeg,.pdf"
  maxFiles={${maxFiles}}
  maxSize={${maxSize} * 1024 * 1024}
  autoUpload={${autoUpload}}
  disabled={${disabled}}
  files={files}
  onFilesChange={setFiles}${simulate ? `
  // Local demo only: no file leaves this page.
  onUpload={simulateLocalUpload}` : ''}
/>`;
  return <div className="flows-examples flows-examples--upload">
    <ComponentPlayground code={code} controls={<PropertyTabs groups={[
      { label: '基础', content: <>
        <DocsSelect label={zh ? '最多文件数' : 'Maximum files'} value={maxFiles} onValueChange={setMaxFiles} options={[["1", "1"], ["3", "3"], ["5", "5"]]} />
        <DocsSelect label={zh ? '单文件大小' : 'Per-file size'} value={maxSize} onValueChange={setMaxSize} options={[["1", "1 MB"], ["2", "2 MB"], ["5", "5 MB"]]} />
      </> },
      { label: '交互', content: <>
        <Switch label={zh ? '启用本页模拟传输' : 'Enable local simulated transfer'} checked={simulate} onCheckedChange={value => { setFiles([]); setSimulate(value); }} />
        {simulate && <Switch label={zh ? '自动上传' : 'Auto upload'} checked={autoUpload} onCheckedChange={setAutoUpload} />}
        <Switch label={zh ? '禁用文件更改' : 'Disable file changes'} checked={disabled} onCheckedChange={setDisabled} />
        <PencilText as="p">{zh ? '模拟仅在本页生成进度，不会发送文件。' : 'The simulation only generates progress in this page. No file is sent.'}</PencilText>
      </> },
    ]} />}>
      <div className="flows-examples__upload-stage">
        <Upload
          accept="image/png,image/jpeg,.pdf"
          maxFiles={Number(maxFiles)}
          maxSize={Number(maxSize) * 1024 * 1024}
          autoUpload={autoUpload}
          disabled={disabled}
          files={files}
          onFilesChange={setFiles}
          onUpload={simulate ? simulateLocalUpload : undefined}
          labels={labels}
        />
        <div className="flows-examples__notice" role="note">{simulate
          ? (zh ? '本页模拟传输 · 无外传' : 'Local simulated transfer · no external upload')
          : (zh ? '仅选择文件 · 未配置传输' : 'Selection only · no transport configured')}</div>
      </div>
    </ComponentPlayground>
    <ComponentExample title={zh ? '只选择文件' : 'File selection only'} code={'<Upload accept="image/*,.pdf" maxFiles={3} />'}>
      <Upload accept="image/*,.pdf" maxFiles={3} maxSize={2 * 1024 * 1024} labels={labels} />
    </ComponentExample>
  </div>;
}

function StepsExamples() {
  const { locale } = useLocale();
  const zh = locale === 'zh-CN';
  const [current, setCurrent] = useState(1);
  const [orientation, setOrientation] = useState<'horizontal' | 'vertical'>('horizontal');
  const [error, setError] = useState(false);
  const items: StepItem[] = [
    { id: 'details', title: zh ? '填写资料' : 'Details', description: zh ? '基础联系信息' : 'Basic contact information' },
    { id: 'review', title: zh ? '确认内容' : 'Review', description: zh ? '检查后再继续' : 'Check before continuing', status: error ? 'error' : undefined },
    { id: 'finish', title: zh ? '完成' : 'Finish', description: zh ? '保存本次设置' : 'Save these settings' },
    { id: 'locked', title: zh ? '归档' : 'Archive', description: zh ? '当前不可进入' : 'Currently unavailable', disabled: true },
  ];
  const codeItems = items.map(item => ({ ...item, status: item.status ?? undefined }));
  const code = `const [current, setCurrent] = useState(${current});
const steps: StepItem[] = ${JSON.stringify(codeItems, null, 2)};

<Steps
  orientation="${orientation}"
  current={current}
  items={steps}
  onStepChange={(index, step) => {
    if (!step.disabled) setCurrent(index);
  }}
/>`;
  return <div className="flows-examples flows-examples--steps">
    <ComponentPlayground code={code} controls={<PropertyTabs groups={[
      { label: '布局', content: <DocsSelect label={zh ? '方向' : 'Orientation'} value={orientation} onValueChange={value => setOrientation(value as typeof orientation)} options={[["horizontal", zh ? "横向" : "Horizontal"], ["vertical", zh ? "纵向" : "Vertical"]]} /> },
      { label: '状态', content: <>
        <DocsSelect label={zh ? '当前步骤' : 'Current step'} value={String(current)} onValueChange={value => setCurrent(Number(value))} options={items.slice(0, 3).map((item, index) => [String(index), String(item.title)] as const)} />
        <Switch label={zh ? '确认步骤错误' : 'Review step error'} checked={error} onCheckedChange={setError} />
      </> },
    ]} />}>
      <Steps orientation={orientation} current={current} items={items} onStepChange={index => setCurrent(index)} aria-label={zh ? '设置进度' : 'Setup progress'} />
    </ComponentPlayground>
    <ComponentExample title={zh ? '有序进度' : 'Ordered progress'} code={'<Steps current={1} items={steps} />'}>
      <Steps current={1} items={items.slice(0, 3)} aria-label={zh ? '示例进度' : 'Example progress'} />
    </ComponentExample>
  </div>;
}

function TimelineExamples() {
  const { locale } = useLocale();
  const zh = locale === 'zh-CN';
  const [orientation, setOrientation] = useState<'horizontal' | 'vertical'>('vertical');
  const [details, setDetails] = useState(true);
  const [selected, setSelected] = useState('');
  const items: TimelineItem[] = [
    { id: 'draft', date: zh ? '10 月 20 日' : 'Oct 20', dateTime: '2026-10-20', title: zh ? '建立草稿' : 'Draft created', description: zh ? '保存第一版内容。' : 'The first version was saved.' },
    { id: 'review', date: zh ? '10 月 21 日' : 'Oct 21', dateTime: '2026-10-21', title: zh ? '团队评审' : 'Team review', description: zh ? '记录修改意见和决定。' : 'Feedback and decisions were recorded.' },
    { id: 'ready', date: zh ? '10 月 22 日' : 'Oct 22', dateTime: '2026-10-22', title: zh ? '准备交付' : 'Ready to hand off', description: zh ? '验证交互和无障碍状态。' : 'Interactions and accessibility states were verified.' },
  ];
  const interactive = items.map(item => ({ ...item, description: details ? item.description : undefined, content: <Button size="sm" variant="ghost" onClick={() => setSelected(item.id)}>{zh ? '查看记录' : 'View entry'}</Button> }));
  const codeEvents = items.map(item => details ? item : { ...item, description: undefined });
  const code = `const [selectedEntry, setSelectedEntry] = useState('');
const events: TimelineItem[] = ${JSON.stringify(codeEvents, null, 2)};
const timelineItems = events.map(event => ({
  ...event,
  content: (
    <Button size="sm" variant="ghost" onClick={() => setSelectedEntry(event.id)}>
      ${zh ? '查看记录' : 'View entry'}
    </Button>
  ),
}));

<>
  <Timeline
  orientation="${orientation}"
    items={timelineItems}
  />
  <p role="status">
    {selectedEntry
      ? '${zh ? '已选择' : 'Selected'}: ' + (events.find(event => event.id === selectedEntry)?.title ?? '')
      : '${zh ? '尚未选择记录' : 'No entry selected'}'}
  </p>
</>`;
  return <div className="flows-examples flows-examples--timeline">
    <ComponentPlayground code={code} controls={<PropertyTabs groups={[
      { label: '布局', content: <DocsSelect label={zh ? '方向' : 'Orientation'} value={orientation} onValueChange={value => setOrientation(value as typeof orientation)} options={[["vertical", zh ? "纵向" : "Vertical"], ["horizontal", zh ? "横向" : "Horizontal"]]} /> },
      { label: '内容', content: <Switch label={zh ? '显示描述' : 'Show descriptions'} checked={details} onCheckedChange={setDetails} /> },
    ]} />}>
      <div className="flows-examples__timeline-stage">
        <Timeline orientation={orientation} items={interactive} aria-label={zh ? '交付时间线' : 'Delivery timeline'} />
        <div className="flows-examples__selection" role="status">{selected
          ? `${zh ? '已选择' : 'Selected'}: ${items.find(item => item.id === selected)?.title ?? ''}`
          : (zh ? '尚未选择记录' : 'No entry selected')}</div>
      </div>
    </ComponentPlayground>
    <ComponentExample title={zh ? '基础时间线' : 'Basic timeline'} code={'<Timeline items={events} />'}>
      <Timeline items={items} aria-label={zh ? '项目历史' : 'Project history'} />
    </ComponentExample>
  </div>;
}

export const flowsDocs: Record<string, ExpansionDoc> = {
  upload: {
    name: 'Upload',
    intro: { zh: '把文件放进来，剩下的进度慢慢告诉你。', en: 'Drop your files in, and let the progress keep you posted as it goes.' },
    api: [
      ['files / defaultFiles', 'readonly UploadItem[]'], ['onFilesChange', '(files, details) => void'], ['accept', 'string'],
      ['maxSize / maxFiles', 'number'], ['onUpload', '(file, { signal, reportProgress }) => Promise<void> | void'],
      ['onReject', '(rejections) => void'], ['validate', '(file, acceptedFiles) => string | undefined'],
    ],
    a11y: { zh: '拖放区可用 Enter 或 Space 打开原生文件选择器；文件状态、错误和进度保留可读 DOM。移除和取消会中止仍在运行的请求。', en: 'Enter or Space opens the native picker. Status, errors, and progress remain readable DOM content, and removing or cancelling aborts active work.' },
    Examples: UploadExamples,
  },
  steps: {
    name: 'Steps',
    intro: { zh: '一步一步来，走到哪儿、还差几步，一眼就知道。', en: 'Take it one step at a time. See where you are and how many steps remain at a glance.' },
    api: [['items', 'readonly StepItem[]'], ['current', 'number'], ['orientation', '"horizontal" | "vertical"'], ['onStepChange', '(index, item) => void']],
    a11y: { zh: '组件使用 ol/li；当前项具有 aria-current="step"。只有提供 onStepChange 时才渲染原生按钮，禁用步骤使用原生 disabled。', en: 'The component uses ol/li and marks the current item with aria-current="step". Native buttons only appear when onStepChange is supplied, and disabled steps use native disabled.' },
    Examples: StepsExamples,
  },
  timeline: {
    name: 'Timeline',
    intro: { zh: '把发生过的事串起来，每个时间点都留一笔。', en: 'Connect what happened, leaving a note at every point in time.' },
    api: [['items', 'readonly TimelineItem[]'], ['orientation', '"horizontal" | "vertical"'], ['item.dateTime', 'string'], ['item.content', 'ReactNode']],
    a11y: { zh: '时间线使用 ol/li；机器可读日期使用 time[dateTime]。标记和连接线只作装饰，正文不依赖画布或颜色。', en: 'The timeline uses ol/li and time[dateTime] for machine-readable dates. Markers and connectors are decorative; content never depends on canvas or color.' },
    Examples: TimelineExamples,
  },
};
