import { useEffect, useId, useRef, useState, type CSSProperties } from 'react';
import { Badge, Button, Card, Checkbox, Empty, PencilSurface, Progress, RadioGroup, RadioGroupItem, ToggleGroup } from '@inkra/react';
import { PencilText, useLocale } from '../i18n';
import { DocsIcon } from './DocsIcon';
import { __iconData as notebookIcon } from 'lucide-react/dist/esm/icons/notebook-pen.mjs';
import { __iconData as monitorIcon } from 'lucide-react/dist/esm/icons/monitor.mjs';
import { __iconData as sunIcon } from 'lucide-react/dist/esm/icons/sun.mjs';
import { __iconData as moonIcon } from 'lucide-react/dist/esm/icons/moon.mjs';

import './ColorSystem.css';

type ThemeName = 'light' | 'dark';
type TokenStyle = CSSProperties & Record<`--inkra-${string}`, string>;

import { themeScales, darkScales, scaleSteps, paletteStyle, type Palette } from './themeColors';
export { themeScales, paletteStyle } from './themeColors';

const themes: ReadonlyArray<{ id: ThemeName; label: string }> = [
  { id: 'light', label: '浅色' },
  { id: 'dark', label: '深色' },
];

const paperSamples = [
  { id: 'paper', label: '基础纸面', foreground: 'ink', paper: 'paper', washToken: null, washNote: '无' },
  { id: 'surface', label: '抬升纸面', foreground: 'ink', paper: 'surface', washToken: null, washNote: '无' },
  { id: 'surface-muted', label: '安静纸面', foreground: 'ink-muted', paper: 'surface-muted', washToken: null, washNote: '无' },
] as const;

const actionSamples = [
  { id: 'action', label: '主操作', variant: 'action', foreground: 'on-accent', paper: 'paper', washToken: 'accent', washNote: 'action wash' },
  { id: 'quiet', label: '次操作', variant: 'quiet', foreground: 'ink', paper: 'paper', washToken: 'accent-soft', washNote: 'quiet wash' },
  { id: 'selection', label: '选中项', variant: 'selection', foreground: 'selection-foreground', paper: 'paper', washToken: 'selection-pigment', washNote: 'selection wash' },
] as const;

const statusSamples = [
  { id: 'success', label: '成功' },
  { id: 'warning', label: '提醒' },
  { id: 'danger', label: '危险' },
  { id: 'info', label: '信息' },
] as const;

const textSamples = [
  { id: 'ink', label: '主要文字', foreground: 'ink' },
  { id: 'ink-muted', label: '次要文字', foreground: 'ink-muted' },
  { id: 'ink-subtle', label: '辅助文字', foreground: 'ink-subtle' },
] as const;

const usageRows = [
  ...paperSamples.map((sample) => ({ pair: sample.label, foreground: sample.foreground, paper: sample.paper, washToken: sample.washToken, washNote: sample.washNote })),
  ...actionSamples.map((sample) => ({ pair: sample.label, foreground: sample.foreground, paper: sample.paper, washToken: sample.washToken, washNote: sample.washNote })),
  ...statusSamples.map((sample) => ({ pair: sample.label, foreground: `${sample.id}-foreground`, paper: `${sample.id}-surface`, washToken: `${sample.id}-pigment`, washNote: 'quiet wash' })),
] as const;

function Scale({ label, values }: { label: string; values: ReadonlyArray<readonly [string, string]> }) {
  const { t } = useLocale();
  const [feedback, setFeedback] = useState<{ hex: string; ok: boolean } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);
  const copyColor = async (hex: string) => {
    let ok = false;
    try {
      if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(hex);
      else {
        const previous = document.activeElement as HTMLElement | null;
        const input = document.createElement('textarea');
        input.value = hex;
        input.style.position = 'fixed';
        input.style.opacity = '0';
        document.body.appendChild(input);
        try { input.select(); if (!document.execCommand('copy')) throw new Error('Copy failed'); }
        finally { input.remove(); previous?.focus(); }
      }
      ok = true;
    } catch { /* Report clipboard failure without changing the color. */ }
    clearTimeout(timer.current);
    setFeedback({ hex, ok });
    timer.current = setTimeout(() => setFeedback(null), 2000);
  };
  return (
    <div className="color-system__scale">
      {label && <div className="color-system__scale-label">
        <PencilText>{label}</PencilText>
      </div>}
      <div className="color-system__swatches">
        {values.map(([step, hex]) => (
          <button type="button" className="color-system__swatch" key={step} title={hex} aria-label={`${t('复制颜色')} ${hex}`} onClick={() => void copyColor(hex)}>
            <PencilSurface aria-hidden="true" className="color-system__pigment" variant="wash" seed={`scale-${step}`} style={{ '--inkra-accent': hex } as TokenStyle} />
          </button>
        ))}
      </div>
      <span className="sr-only" role="status">{feedback ? `${t(feedback.ok ? '已复制' : '复制失败')} ${feedback.hex}` : ''}</span>
    </div>
  );
}


function ColorPalette({ scale, onChange, currentTheme }: { scale: Palette; onChange: (scale: Palette) => void; currentTheme: ThemeName }) {
  const { t } = useLocale();
  const selectionId = useId();
  const [selection, setSelection] = useState('auto');
  const values = currentTheme === 'light' ? scale.values : darkScales[scale.id].map((hex, i) => [scaleSteps[i], hex] as const);
  return <section className="color-palette" aria-label={t('主题色')}>
    <div className="color-palette__body">
      <header className="color-palette__heading"><PencilText as="h2">{scale.label}</PencilText></header>
      <Scale key={`${scale.id}-${currentTheme}`} label="" values={values} />
      <div className="color-palette__applications">
        {themes.map(theme => <PencilSurface as="section" variant="paper" data-inkra-theme={theme.id} data-preview-theme={theme.id} key={`${scale.id}-${theme.id}`} className="color-palette__application" seed={`application-${theme.id}`} style={paletteStyle(scale, theme.id)}>
          <PencilText as="h3">{theme.label}</PencilText>
          <div className="color-palette__papers">
            {paperSamples.map(sample => <PencilSurface key={sample.id} variant="paper" className="color-palette__paper" style={paperStyle(sample.paper, sample.foreground)} seed={`paper-${sample.id}`}>
              <PencilText className="color-palette__paper-label">{sample.label}</PencilText>
              {textSamples.map(text => <PencilText key={text.id} style={{ color: `var(--inkra-${text.foreground})` }}>{text.label}</PencilText>)}
            </PencilSurface>)}
            <PencilSurface variant="action" className="color-palette__paper" seed="accent-paper">
              <PencilText className="color-palette__paper-label">主题背景</PencilText>
              <PencilText style={{ color: 'var(--inkra-on-accent)' }}>主题文字</PencilText>
            </PencilSurface>
          </div>
          <div className="color-palette__selection">
            <PencilText as="h4">选中态</PencilText>
            <RadioGroup className="theme-control" name={`${selectionId}-${theme.id}`} aria-label={`${t(theme.label)} · ${t('选中态')}`} variant="segmented" orientation="horizontal" value={selection} onValueChange={setSelection}>
              {[
                { value: 'auto', label: '跟随系统', icon: monitorIcon },
                { value: 'light', label: '浅色主题', icon: sunIcon },
                { value: 'dark', label: '深色主题', icon: moonIcon },
              ].map(option => <RadioGroupItem key={option.value} value={option.value} label={<span className="sr-only">{t(option.label)}</span>} title={t(option.label)} icon={<DocsIcon data={option.icon} active={selection === option.value} seed={`theme-${option.value}`} size={28} />} />)}
            </RadioGroup>
          </div>
        </PencilSurface>)}
      </div>
    </div>
    <div className="color-palette__choices" role="group" aria-label={t('选择配色')}>
      {themeScales.map(item => <PencilSurface as="button" variant={scale.id === item.id ? 'outline' : 'ghost'} type="button" key={`${item.id}-${currentTheme}`} aria-label={t(item.label)} aria-pressed={scale.id === item.id} data-tooltip={t(item.label)} onClick={() => onChange(item)} seed={`palette-choice-${item.id}`}>
        <PencilSurface aria-hidden="true" variant="wash" className="color-palette__chip" seed="palette-choice" style={{ '--inkra-accent': currentTheme === 'light' ? item.values[6][1] : darkScales[item.id][6] } as TokenStyle} />
      </PencilSurface>)}
    </div>
  </section>;
}

function paperStyle(paper: string, foreground: string): TokenStyle {
  const style: TokenStyle = { color: `var(--inkra-${foreground})` };
  if (paper !== 'paper') style['--inkra-paper'] = `var(--inkra-${paper})`;
  return style;
}

const demoTasks = [
  { id: 'notes', title: '整理灵感笔记', description: '把散落的想法整理成下一次创作的起点。', status: 'success', label: '已完成', meta: '笔记 · 6 条' },
  { id: 'sketch', title: '绘制首页草图', description: '确定内容顺序，留出恰到好处的呼吸空间。', status: 'info', label: '进行中', meta: '设计 · 3 张' },
  { id: 'review', title: '确认插画细节', description: '检查线稿与配色，收集最后一轮修改意见。', status: 'warning', label: '待确认', meta: '评审 · 2 项' },
  { id: 'assets', title: '补齐素材文件', description: '缺少封面原图，需要补充后再交付。', status: 'danger', label: '待处理', meta: '素材 · 1 项' },
] as const;

export function CardListDemo({ scale = themeScales[0] }: { scale?: Palette }) {
  const { t } = useLocale();
  const [completed, setCompleted] = useState<string[]>(['notes']);
  const [onlyOpen, setOnlyOpen] = useState(false);
  const visibleTasks = demoTasks.filter(task => !onlyOpen || !completed.includes(task.id));
  return <section className="color-demo" aria-labelledby="color-demo-title">
    <PencilText as="h2" id="color-demo-title">卡片列表</PencilText>
    <div className="color-demo__themes">
      {themes.map(theme => <section key={`${scale.id}-${theme.id}`} className="color-demo__column" data-inkra-theme={theme.id} data-preview-theme={theme.id} style={paletteStyle(scale, theme.id)} aria-label={t(`${theme.label}示例`)}>
        <header className="color-demo__heading">
          <PencilText as="h3">{theme.label}</PencilText>
          <ToggleGroup.Root size="sm" aria-label={t('任务筛选')} value={[onlyOpen ? 'open' : 'all']} onValueChange={values => { if (values.length) setOnlyOpen(values[0] === 'open'); }}>
            <ToggleGroup.Item value="all">{t('全部')}</ToggleGroup.Item>
            <ToggleGroup.Item value="open">{t('仅看未完成')}</ToggleGroup.Item>
          </ToggleGroup.Root>
        </header>
        <Progress value={completed.length} max={demoTasks.length} aria-label={t('完成进度')} />
        <ul className="color-demo__list">
          {visibleTasks.map(task => {
            const done = completed.includes(task.id);
            return <li key={task.id}>
              <Card.Root seed={`demo-card-${task.id}`} style={{ '--inkra-paper': 'var(--inkra-surface)' } as TokenStyle}>
                <Card.Content className="color-demo__card">
                <div className="color-demo__card-heading">
                  <DocsIcon data={notebookIcon} seed={`demo-icon-${task.id}`} size={24} />
                  <Card.Title as="h4">{t(task.title)}</Card.Title>
                  <Badge variant={done ? 'success' : task.status === 'success' ? 'info' : task.status}>{t(done ? '已完成' : task.status === 'success' ? '进行中' : task.label)}</Badge>
                </div>
                <Card.Description>{t(task.description)}</Card.Description>
                <footer className="color-demo__footer">
                  <PencilText className="color-demo__meta">{task.meta}</PencilText>
                  <Checkbox label={t('完成')} aria-label={`${t('标记完成')} · ${t(task.title)}`} checked={done} onCheckedChange={checked => setCompleted(previous => checked ? [...new Set([...previous, task.id])] : previous.filter(id => id !== task.id))} />
                </footer>
                </Card.Content>
              </Card.Root>
            </li>;
          })}
        </ul>
        {!visibleTasks.length && <Empty.Root size="sm">
          <Empty.Icon><DocsIcon data={notebookIcon} size={32} /></Empty.Icon>
          <Empty.Title>{t('全部完成')}</Empty.Title>
          <Empty.Actions><Button variant="outline" onClick={() => setOnlyOpen(false)}>{t('查看全部')}</Button></Empty.Actions>
        </Empty.Root>}
      </section>)}
    </div>
  </section>;
}

export function useResolvedTheme(theme: ThemeName | 'auto'): ThemeName {
  const [systemDark, setSystemDark] = useState(() => window.matchMedia('(prefers-color-scheme: dark)').matches);
  useEffect(() => {
    const query = window.matchMedia('(prefers-color-scheme: dark)');
    const update = () => setSystemDark(query.matches);
    update();
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);
  return theme === 'auto' ? systemDark ? 'dark' : 'light' : theme;
}

export function ColorSystem({ theme }: { theme: ThemeName | 'auto' }) {
  const { t } = useLocale();
  const [scale, setScale] = useState(themeScales[0]);
  const currentTheme = useResolvedTheme(theme);
  return <section aria-label={t('色彩')} className="color-system" data-current-theme={currentTheme}>
    <ColorPalette scale={scale} onChange={setScale} currentTheme={currentTheme} />
  </section>;
}

export function ColorUsageTable() {
  const names: Record<string, string> = {
    ink: '主要文字', 'ink-muted': '次要文字', paper: '基础纸面', surface: '抬升纸面', 'surface-muted': '安静纸面',
    'on-accent': '操作文字', 'selection-foreground': '选中文字', accent: '主题铺色', 'accent-soft': '轻铺色', 'selection-pigment': '选中铺色',
  };
  for (const sample of statusSamples) {
    names[`${sample.id}-foreground`] = `${sample.label}文字`;
    names[`${sample.id}-surface`] = `${sample.label}纸面`;
    names[`${sample.id}-pigment`] = `${sample.label}铺色`;
  }

  return (<section className="color-system__usage" aria-labelledby="color-usage-title">
        <PencilText as="h2" id="color-usage-title">使用矩阵</PencilText>
        <div className="color-system__matrix-wrap" role="region" aria-labelledby="color-usage-title" tabIndex={0}>
        <table className="color-system__matrix" aria-labelledby="color-usage-title">
          <thead>
            <tr>{['用途', '文字', '纸面', '铺色'].map(label => <th scope="col" key={label}><PencilText>{label}</PencilText></th>)}</tr>
          </thead>
          <tbody>
            {usageRows.map((row) => (
              <tr key={row.pair}>
                <th scope="row"><PencilText>{row.pair}</PencilText></th>
                <td><PencilText>{names[row.foreground]}</PencilText></td>
                <td><PencilText>{names[row.paper]}</PencilText></td>
                <td><PencilText>{row.washToken ? names[row.washToken] : '无'}</PencilText></td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
        <PencilText as="p">状态纸面仅用于深色；浅色使用基础纸面。</PencilText>
      </section>);
}
