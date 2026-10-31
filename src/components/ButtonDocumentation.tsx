import { Button, ButtonGroup, ButtonLink, PencilLine, PencilSurface, Switch, Tabs } from '@inkra/react';
import type { ButtonAlign, ButtonLoadingPosition, ButtonSize, ButtonVariant } from '@inkra/react';
import { useEffect, useMemo, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from 'react';
import { PencilText, useLocale } from '../i18n';
import type { ButtonTab, RoutePath, Theme } from '../routes';
import { ButtonGroupPlayground } from './ButtonGroupPlayground';
import { DocsSelect } from './DocsSelect';
import { choiceVisuals } from './docsChoiceVisuals';
import { ComponentPageTabs } from './ComponentPageTabs';
import { buttonAccessibilityGuidance, GuidanceMarkdown } from './GuidanceMarkdown';
import { PageHeading } from './PageHeading';
import { ApiGroups } from './ApiGroups';
import { buttonApiGroups } from './buttonApiGroups';
import { CodeBlock } from './CodeBlock';
import { ComponentExample } from './ComponentExample';
import { PropertyTabs } from './PropertyTabs';
import { DocsIcon } from './DocsIcon';
import { __iconData as checkIcon } from 'lucide-react/dist/esm/icons/check.mjs';
import { __iconData as arrowLeftIcon } from 'lucide-react/dist/esm/icons/arrow-left.mjs';
import { __iconData as arrowRightIcon } from 'lucide-react/dist/esm/icons/arrow-right.mjs';
import { __iconData as codeIcon } from 'lucide-react/dist/esm/icons/code-xml.mjs';
import { __iconData as copyIcon } from 'lucide-react/dist/esm/icons/copy.mjs';
import { __iconData as monitorIcon } from 'lucide-react/dist/esm/icons/monitor.mjs';
import { __iconData as sunIcon } from 'lucide-react/dist/esm/icons/sun.mjs';
import { __iconData as plusIcon } from 'lucide-react/dist/esm/icons/plus.mjs';

type PreviewTab = 'preview' | 'code';
type ExampleKind = 'appearance' | 'size' | 'icon-size' | 'icons' | 'state' | 'link' | 'group' | 'rtl';

function useCompactLayout() {
  const [compact, setCompact] = useState(() => window.matchMedia('(max-width: 64rem)').matches);
  useEffect(() => {
    const query = window.matchMedia('(max-width: 64rem)');
    const update = () => setCompact(query.matches);
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);
  return compact;
}

function copyText(text: string) {
  if (navigator.clipboard?.writeText) return navigator.clipboard.writeText(text);
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.select();
  const copied = document.execCommand('copy');
  textarea.remove();
  return copied ? Promise.resolve() : Promise.reject(new Error('Copy command failed'));
}

function handleRovingTabs(event: ReactKeyboardEvent<HTMLDivElement>) {
  if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
  const tabs = Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>('[role="tab"]'));
  const currentIndex = tabs.indexOf(document.activeElement as HTMLButtonElement);
  if (currentIndex < 0 || !tabs.length) return;
  event.preventDefault();
  const nextIndex = event.key === 'Home'
    ? 0
    : event.key === 'End'
      ? tabs.length - 1
      : (currentIndex + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
  tabs[nextIndex]?.focus();
  tabs[nextIndex]?.click();
}

function CopyButton({ code, onResult }: { code: string; onResult: (message: string) => void }) {
  const { t } = useLocale();
  const [status, setStatus] = useState<'idle' | 'copied' | 'failed'>('idle');
  const handleCopy = async () => {
    try {
      await copyText(code);
      setStatus('copied');
      onResult(t('示例代码已复制'));
    } catch {
      setStatus('failed');
      onResult(t('复制失败，请手动选择代码'));
    }
    window.setTimeout(() => setStatus('idle'), 1600);
  };
  const label = t(status === 'copied' ? '已复制代码' : status === 'failed' ? '复制失败' : '复制代码');
  return (
    <button aria-label={label} className="icon-button" data-status={status} data-tooltip={label} onClick={handleCopy} type="button">
      <DocsIcon data={status === 'copied' ? checkIcon : copyIcon} seed={`copy-${status}`} size={30} />
    </button>
  );
}

const comparisonExamples: Record<ExampleKind, { title: string; code: string }> = {
  appearance: {
    title: '外观',
    code: `import { Button } from '@inkra/react';\n\n<Button variant="primary">保存更改</Button>\n<Button variant="secondary">保存更改</Button>\n<Button variant="outline">保存更改</Button>\n<Button variant="ghost">保存更改</Button>\n<Button variant="destructive">删除记录</Button>\n<Button variant="link">查看详情</Button>`,
  },
  size: {
    title: '尺寸',
    code: `import { Button } from '@inkra/react';\n\n<Button size="xs">保存更改</Button>\n<Button size="sm">保存更改</Button>\n<Button size="md">保存更改</Button>\n<Button size="lg">保存更改</Button>`,
  },
  'icon-size': {
    title: '图标尺寸',
    code: `import { Plus } from 'lucide-react';\nimport { Button } from '@inkra/react';\n\n<Button aria-label="新建" size="icon-xs"><Plus /></Button>\n<Button aria-label="新建" size="icon-sm"><Plus /></Button>\n<Button aria-label="新建" size="icon"><Plus /></Button>\n<Button aria-label="新建" size="icon-lg"><Plus /></Button>`,
  },
  icons: {
    title: '前后图标',
    code: `import { ArrowLeft, ArrowRight } from 'lucide-react';\nimport { Button } from '@inkra/react';\n\n<Button startIcon={<ArrowLeft />}>上一步</Button>\n<Button endIcon={<ArrowRight />}>下一步</Button>`,
  },
  state: {
    title: '状态',
    code: `import { useState } from 'react';\nimport { Button } from '@inkra/react';\n\nexport function SaveButton() {\n  const [loading, setLoading] = useState(false);\n  const [status, setStatus] = useState('尚未保存');\n\n  async function save() {\n    setLoading(true);\n    setStatus('保存中');\n    await new Promise(resolve => setTimeout(resolve, 1200));\n    setLoading(false);\n    setStatus('已保存');\n  }\n\n  return <>\n    <Button loading={loading} onClick={save}>保存更改</Button>\n    <span aria-live="polite">{status}</span>\n  </>;\n}`,
  },
  link: {
    title: '链接',
    code: `import { ArrowRight } from 'lucide-react';\nimport { ButtonLink } from '@inkra/react';\n\n<ButtonLink href="/design-standard" endIcon={<ArrowRight />}>设计规范</ButtonLink>\n<ButtonLink disabled href="/design-standard">不可导航</ButtonLink>`,
  },
  group: {
    title: '按钮组',
    code: `import { useState } from 'react';\nimport { Button, ButtonGroup } from '@inkra/react';\n\nexport function ButtonGroups() {\n  const [align, setAlign] = useState<'start' | 'center' | 'end'>('start');\n  const [step, setStep] = useState(1);\n\n  return <>\n    <ButtonGroup aria-label="文本对齐">\n      <Button aria-pressed={align === 'start'} onClick={() => setAlign('start')} variant="outline">左对齐</Button>\n      <Button aria-pressed={align === 'center'} onClick={() => setAlign('center')} variant="outline">居中</Button>\n      <Button aria-pressed={align === 'end'} onClick={() => setAlign('end')} variant="outline">右对齐</Button>\n    </ButtonGroup>\n    <p style={{ textAlign: align }}>对齐示例文字</p>\n\n    <ButtonGroup aria-label="步骤" orientation="vertical">\n      <Button aria-pressed={step === 1} onClick={() => setStep(1)}>第一步</Button>\n      <Button aria-pressed={step === 2} onClick={() => setStep(2)}>第二步</Button>\n    </ButtonGroup>\n  </>;\n}`,
  },
  rtl: {
    title: 'RTL',
    code: `import { ArrowLeft } from 'lucide-react';\nimport { Button } from '@inkra/react';\n\n<div dir="rtl">\n  <Button endIcon={<ArrowLeft />}>继续</Button>\n</div>`,
  },
};

function AsyncButtonExample() {
  const { t } = useLocale();
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('尚未保存');
  const timeoutRef = useRef<number | null>(null);
  useEffect(() => () => {
    if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
  }, []);
  const save = () => {
    setLoading(true);
    setStatus('保存中');
    timeoutRef.current = window.setTimeout(() => {
      setLoading(false);
      setStatus('已保存');
    }, 1200);
  };
  return <div className="async-example"><Button loading={loading} onClick={save} seed="async-save">{t("保存更改")}</Button><PencilText aria-live="polite" seed={`async-status-${status}`}>{status}</PencilText></div>;
}

function ButtonGroupExample() {
  const { t } = useLocale();
  const [alignment, setAlignment] = useState<'start' | 'center' | 'end'>('start');
  const [step, setStep] = useState(1);
  return <>
    <div className="comparison-item comparison-item--wide"><code>horizontal · aria-pressed</code><ButtonGroup aria-label={t('文本对齐')}>{([['start', '左对齐'], ['center', '居中'], ['end', '右对齐']] as const).map(([value, label]) => <Button aria-pressed={alignment === value} key={value} onClick={() => setAlignment(value)} seed={`group-${value}`} variant="outline">{t(label)}</Button>)}</ButtonGroup><PencilText as="p" className="alignment-preview" seed={`alignment-${alignment}`} style={{ textAlign: alignment }}>这行文字会按选择对齐</PencilText></div>
    <div className="comparison-item"><code>{t("vertical · 当前第")}{step}{t("步")}</code><ButtonGroup aria-label={t("步骤")} orientation="vertical"><Button aria-pressed={step === 1} onClick={() => setStep(1)} seed="group-step-1" variant="secondary">{t("第一步")}</Button><Button aria-pressed={step === 2} onClick={() => setStep(2)} seed="group-step-2" variant="secondary">{t("第二步")}</Button></ButtonGroup></div>
  </>;
}

function ComparisonGroup({ kind }: { kind: ExampleKind }) {
  const { t } = useLocale();
  const [announcement, setAnnouncement] = useState('');
  const example = comparisonExamples[kind];
  const handleAction = (label: string) => setAnnouncement(`${label}已触发`);

  return (
    <ComponentExample id={`comparison-${kind}`} title={example.title} code={example.code}
      codeActions={<CopyButton code={example.code} onResult={setAnnouncement} />}>
        <div className={`comparison-row comparison-row--${kind}`}>
          {kind === 'appearance' ? <>
            <div className="comparison-item"><code>primary</code><Button onClick={() => handleAction('Primary')} seed="compare-primary">{t("保存更改")}</Button></div>
            <div className="comparison-item"><code>secondary</code><Button onClick={() => handleAction('Secondary')} seed="compare-secondary" variant="secondary">{t("保存更改")}</Button></div>
            <div className="comparison-item"><code>outline</code><Button onClick={() => handleAction('Outline')} seed="compare-outline" variant="outline">{t("保存更改")}</Button></div>
            <div className="comparison-item"><code>ghost</code><Button onClick={() => handleAction('Ghost')} seed="compare-ghost" variant="ghost">{t("保存更改")}</Button></div>
            <div className="comparison-item"><code>destructive</code><Button onClick={() => handleAction('Destructive')} seed="compare-destructive" variant="destructive">{t("删除记录")}</Button></div>
            <div className="comparison-item"><code>link</code><Button onClick={() => handleAction('Link')} seed="compare-link" variant="link">{t("查看详情")}</Button></div>
          </> : kind === 'size' ? <>
            <div className="comparison-item"><code>xs · 32px</code><Button onClick={() => handleAction('Extra small')} seed="compare-xs" size="xs">{t("保存更改")}</Button></div>
            <div className="comparison-item"><code>sm · 36px</code><Button onClick={() => handleAction('Small')} seed="compare-sm" size="sm">{t("保存更改")}</Button></div>
            <div className="comparison-item"><code>md · 44px</code><Button onClick={() => handleAction('Medium')} seed="compare-md" size="md">{t("保存更改")}</Button></div>
            <div className="comparison-item"><code>lg · 48px</code><Button onClick={() => handleAction('Large')} seed="compare-lg" size="lg">{t("保存更改")}</Button></div>
          </> : kind === 'icon-size' ? <>
            {([['icon-xs', '32px'], ['icon-sm', '36px'], ['icon', '44px'], ['icon-lg', '48px']] as const).map(([size, height]) => <div className="comparison-item" key={size}><code>{size} · {height}</code><Button aria-label={`新建 · ${height}`} className="demo-icon-button" data-tooltip={t("新建")} onClick={() => handleAction(`新建 ${height}`)} seed={`compare-${size}`} size={size}><DocsIcon data={plusIcon} seed={`plus-${size}`} size={28} /></Button></div>)}
          </> : kind === 'icons' ? <>
            <div className="comparison-item"><code>startIcon</code><Button onClick={() => handleAction('上一步')} seed="compare-start-icon" startIcon={<DocsIcon data={arrowLeftIcon} seed="start-arrow" size={24} />}>{t("上一步")}</Button></div>
            <div className="comparison-item"><code>endIcon</code><Button endIcon={<DocsIcon data={arrowRightIcon} seed="end-arrow" size={24} />} onClick={() => handleAction('下一步')} seed="compare-end-icon">{t("下一步")}</Button></div>
          </> : kind === 'state' ? <>
            <div className="comparison-item"><code>async loading</code><AsyncButtonExample /></div>
            <div className="comparison-item"><code>disabled</code><Button disabled seed="compare-disabled">{t("保存更改")}</Button></div>
          </> : kind === 'link' ? <>
            <div className="comparison-item comparison-item--wide"><code>ButtonLink · native anchor</code><ButtonLink endIcon={<DocsIcon data={arrowRightIcon} seed="link-arrow" size={24} />} href="/design-standard" seed="compare-link-anchor">{t("设计规范")}</ButtonLink></div>
            <div className="comparison-item"><code>disabled · no href</code><ButtonLink disabled href="/design-standard" seed="compare-link-disabled">{t("不可导航")}</ButtonLink></div>
          </> : kind === 'group' ? <>
            <ButtonGroupExample />
          </> : <>
            <div className="comparison-item comparison-item--wide" dir="rtl"><code>dir="rtl" · endIcon</code><Button endIcon={<DocsIcon data={arrowLeftIcon} seed="rtl-arrow" size={24} />} onClick={() => handleAction('RTL 继续')} seed="compare-rtl">{t("继续")}</Button></div>
          </>}
        </div>
      <span aria-live="polite" className="visually-hidden">{announcement}</span>
    </ComponentExample>
  );
}

function ButtonPlayground() {
  const { t } = useLocale();
  const compactLayout = useCompactLayout();
  const [view, setView] = useState<PreviewTab>('preview');
  const [variant, setVariant] = useState<ButtonVariant>('primary');
  const [size, setSize] = useState<ButtonSize>('md');
  const [fullWidth, setFullWidth] = useState(false);
  const [align, setAlign] = useState<ButtonAlign>('center');
  const [loadingPosition, setLoadingPosition] = useState<ButtonLoadingPosition>('center');
  const [customIndicator, setCustomIndicator] = useState(false);
  const [icons, setIcons] = useState(false);
  const [dir, setDir] = useState<'ltr' | 'rtl'>('ltr');
  const [loading, setLoading] = useState(false);
  const [disabled, setDisabled] = useState(false);
  const [announcement, setAnnouncement] = useState('');
  const iconOnly = size.startsWith('icon');
  const code = useMemo(() => {
    const props = [variant !== 'primary' ? `variant="${variant}"` : '', size !== 'md' ? `size="${size}"` : '', dir !== 'ltr' ? `dir="${dir}"` : '', fullWidth ? 'fullWidth' : '', align !== 'center' ? `align="${align}"` : '', loadingPosition !== 'center' ? `loadingPosition="${loadingPosition}"` : '', customIndicator ? 'loadingIndicator={<LoadingIcon />}' : '', !iconOnly && icons ? 'startIcon={<PlusIcon />} endIcon={<ArrowRightIcon />}' : '', loading ? 'loading' : '', disabled ? 'disabled' : ''].filter(Boolean);
    const iconImports = [iconOnly || icons ? 'Plus as PlusIcon' : '', icons && !iconOnly ? 'ArrowRight as ArrowRightIcon' : '', customIndicator ? 'Sun as LoadingIcon' : ''].filter(Boolean);
    const imports = `${iconImports.length ? `import { ${iconImports.join(', ')} } from 'lucide-react';\n` : ''}import { Button } from '@inkra/react';\n\n`;
    return imports + (iconOnly
      ? `<Button aria-label="${t('新建')}" ${props.join(' ')}><PlusIcon /></Button>`
      : `<Button${props.length ? ' ' + props.join(' ') : ''}>${t('保存草稿')}</Button>`);
  }, [disabled, iconOnly, loading, size, variant, fullWidth, align, loadingPosition, customIndicator, icons, dir, t]);
  return (
    <PencilSurface className="playground component-playground button-playground" seed="button-playground" variant="paper" data-doc-code={code}>
      <div className="playground-toolbar">
        <div className="view-tabs" role="tablist" aria-label={t("示例视图")} onKeyDown={handleRovingTabs}>
          {([
            ['preview', '预览', monitorIcon],
            ['code', '代码', codeIcon],
          ] as const).map(([value, label, icon]) => (
            <button aria-controls={`button-demo-panel-${value}`} aria-selected={view === value} className="view-tab" id={`button-demo-tab-${value}`} key={value} onClick={() => setView(value)} role="tab" tabIndex={view === value ? 0 : -1} type="button">
              {view === value ? <PencilSurface aria-hidden="true" className="selection-backdrop" seed={`view-selection-${value}`} variant="selection" /> : null}
              <span className="selection-control-content"><DocsIcon active={view === value} data={icon} seed={`view-${value}`} size={26} /><PencilText seed={`view-${value}-label`}>{label}</PencilText></span>
            </button>
          ))}
        </div>
        {view === 'code' ? <CopyButton code={code} onResult={setAnnouncement} /> : null}
      </div>
      <PencilLine className="tool-divider" seed="playground-divider" />
      <div className="preview-panel">
          <div className="preview-workspace">
            <div className="preview-display">
            <div className="preview-stage" aria-hidden={view !== 'preview'} inert={view !== 'preview'} aria-labelledby="button-demo-tab-preview" id="button-demo-panel-preview" role="tabpanel">
              <Button
                aria-label={iconOnly ? t('新建') : undefined}
                className={iconOnly ? 'demo-icon-button' : undefined}
                data-tooltip={iconOnly ? t('新建') : undefined}
                disabled={disabled}
                fullWidth={fullWidth}
                align={align}
                dir={dir}
                loadingPosition={loadingPosition}
                loadingIndicator={customIndicator ? <DocsIcon data={sunIcon} size={20} /> : undefined}
                startIcon={!iconOnly && icons ? <DocsIcon data={plusIcon} size={20} /> : undefined}
                endIcon={!iconOnly && icons ? <DocsIcon data={arrowRightIcon} size={20} /> : undefined}
                loading={loading}
                onClick={() => setAnnouncement(t('已保存'))}
                seed="docs-playground"
                size={size}
                variant={variant}
              >
                {iconOnly ? <DocsIcon data={plusIcon} seed="playground-plus" size={28} /> : t('保存草稿')}
              </Button>
            </div>
            <div className="code-panel" hidden={view !== 'code'} aria-labelledby="button-demo-tab-code" id="button-demo-panel-code" role="tabpanel">{view === 'code' && <CodeBlock code={code} />}</div>
            </div>
            <PencilLine className="preview-controls-divider" orientation={compactLayout ? 'horizontal' : 'vertical'} seed="preview-controls-divider" />
            <div className="preview-controls" aria-label={t("Button 属性控制")}>
              <PropertyTabs groups={[{ label: '基础', content: <>
              <DocsSelect label="外观" value={variant} onValueChange={value => setVariant(value as ButtonVariant)} options={['primary', 'secondary', 'outline', 'ghost', 'destructive', 'link'].map(value => [value, value])} />
              <DocsSelect label="尺寸" value={size} onValueChange={value => setSize(value as ButtonSize)} options={['xs', 'sm', 'md', 'lg', 'icon-xs', 'icon-sm', 'icon', 'icon-lg'].map(value => [value, value])} />
              <Switch label={t('撑满宽度')} checked={fullWidth} onCheckedChange={setFullWidth} disabled={iconOnly} />
              <DocsSelect label="内容对齐" value={align} onValueChange={value => setAlign(value as ButtonAlign)} options={[["start", "起始"], ["center", "居中"], ["end", "末尾"]]} />
              <DocsSelect label="文字方向" value={dir} onValueChange={value => setDir(value as typeof dir)} options={[["ltr", "LTR"], ["rtl", "RTL"]]} />
              </> }, { label: '内容', content: <>
              <Switch label={t('首尾图标')} checked={icons} onCheckedChange={setIcons} disabled={iconOnly} />
              <DocsSelect label="加载位置" visuals={choiceVisuals.horizontalAlignment} value={loadingPosition} onValueChange={value => setLoadingPosition(value as ButtonLoadingPosition)} options={[["start", "起始"], ["center", "居中"], ["end", "末尾"]]} />
              <Switch label={t('自定义加载图标')} checked={customIndicator} onCheckedChange={setCustomIndicator} />
              </> }, { label: '状态', content: <>
              <Switch label={t('加载中')} checked={loading} onCheckedChange={setLoading} />
              <Switch label={t('禁用')} checked={disabled} onCheckedChange={setDisabled} />
              </> }]} />
            </div>
          </div>
        </div>

      <span aria-live="polite" className="visually-hidden">{announcement}</span>
    </PencilSurface>
  );
}

export function ButtonPage({ activeTab, onTabChange }: { activeTab: ButtonTab; onTabChange: (tab: ButtonTab) => void }) {
  const { locale, t } = useLocale();
  return (
    <article className="documentation">
      <PageHeading title="Button" />
      <ComponentPageTabs name="Button" id="button" value={activeTab} onChange={onTabChange} />
      <PencilLine className="section-divider" seed={`button-${activeTab}-divider`} />
      {activeTab === 'preview' ? (
        <section aria-labelledby="button-tab-preview" className="content-section" id="button-panel-preview" role="tabpanel">
          <ButtonPlayground />
          <div className="comparison-list">
            <ComparisonGroup kind="appearance" />
            <ComparisonGroup kind="size" />
            <ComparisonGroup kind="icons" />
            <ComparisonGroup kind="icon-size" />
            <ComparisonGroup kind="link" />
            <ComparisonGroup kind="state" />
            <ButtonGroupPlayground />
            <ComparisonGroup kind="group" />
            <ComparisonGroup kind="rtl" />
          </div>
        </section>
      ) : activeTab === 'api' ? (
        <section aria-labelledby="button-tab-api" className="content-section" id="button-panel-api" role="tabpanel">
          <ApiGroups component="button" groups={buttonApiGroups} />
        </section>
      ) : (
        <section aria-labelledby="button-tab-accessibility" className="content-section" id="button-panel-accessibility" role="tabpanel">
          <GuidanceMarkdown source={buttonAccessibilityGuidance[locale === 'en' ? 'en' : 'zh']} />
        </section>
      )}
    </article>
  );
}

