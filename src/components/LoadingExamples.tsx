import { useEffect, useMemo, useState } from 'react';
import {
  Button,
  Loading,
  PencilSurface,
  PencilText,
  Switch,
  type LoadingMode,
  type LoadingPreset,
  type LoadingStatus,
} from '@inkra/react';

import { useLocale } from '../i18n';
import { ComponentExample } from './ComponentExample';
import { ComponentPlayground } from './ComponentPlayground';
import { DocsSelect } from './DocsSelect';
import { DocsSlider } from './DocsSlider';
import { PropertyTabs } from './PropertyTabs';
import { loadingDocsCopy } from './loadingCopy';
import './LoadingExamples.css';

const modeOptions = [['inline', 'Inline'], ['region', 'Region'], ['fullscreen', 'Fullscreen']] as const;
const presetOptions = [
  ['brand-center', 'Brand center'], ['scene-bottom', 'Scene bottom'], ['intel', 'Intel'],
  ['staged', 'Staged'], ['edge', 'Edge'], ['skeleton', 'Skeleton'],
] as const;

function DecorativeScene({ character = 0 }: { character?: number }) {
  return <div className="loading-scene" data-character={character} aria-hidden="true">
    <span className="loading-scene__sun" />
    <span className="loading-scene__ridge loading-scene__ridge--far" />
    <span className="loading-scene__ridge loading-scene__ridge--near" />
    <span className="loading-scene__path" />
    <span className="loading-scene__traveler">{character === 0 ? 'A' : character === 1 ? 'B' : 'C'}</span>
  </div>;
}

function DemoLogo() {
  return <PencilSurface className="loading-demo-logo" variant="selection" radius={8}><PencilText>INKRA</PencilText></PencilSurface>;
}

export function LoadingExamples() {
  const { locale } = useLocale();
  const copy = loadingDocsCopy(locale);
  const [mode, setMode] = useState<LoadingMode>('region');
  const [preset, setPreset] = useState<LoadingPreset>('brand-center');
  const [status, setStatus] = useState<LoadingStatus>('loading');
  const [progressMode, setProgressMode] = useState<'determinate' | 'indeterminate' | 'none'>('determinate');
  const [progress, setProgress] = useState(48);
  const [blocking, setBlocking] = useState(true);
  const [lockScroll, setLockScroll] = useState(true);
  const [showTips, setShowTips] = useState(true);
  const [fullscreenOpen, setFullscreenOpen] = useState(false);
  const progressValue = progressMode === 'none' ? undefined : progressMode === 'indeterminate' ? null : progress;
  const title = status === 'error' ? copy.errorTitle : status === 'complete' ? copy.completeTitle : copy.loadingTitle;
  const stages = useMemo(() => [
    { id: 'session', label: copy.stageSession, state: 'complete' as const },
    { id: 'assets', label: copy.stageAssets },
    { id: 'world', label: copy.stageWorld },
  ], [copy]);
  const code = `<Loading
  mode="${mode}" preset="${preset}" status="${status}"
  progress={${progressValue === undefined ? 'undefined' : progressValue === null ? 'null' : progressValue}}
  blocking={${blocking}} lockScroll={${lockScroll}}
  title="${title}"
  tips={[/* localized ReactNode tips */]}
  showTipControls={${showTips}}
  onCancel={() => setOpen(false)}
/>`;

  const preview = <Loading
    aria-label={copy.regionLabel}
    mode={mode}
    preset={preset}
    status={status}
    blocking={blocking}
    lockScroll={lockScroll}
    title={title}
    description={copy.loadingDescription}
    logo={<DemoLogo />}
    background={<DecorativeScene />}
    progress={progressValue}
    progressLabel={copy.progress}
    stages={preset === 'staged' ? stages : undefined}
    activeStage="assets"
    tips={[copy.tipOne, copy.tipTwo, copy.tipThree]}
    showTipControls={showTips}
    onCancel={mode === 'fullscreen' ? () => setFullscreenOpen(false) : undefined}
    onRetry={status === 'error' ? () => setStatus('loading') : undefined}
    onContinue={status === 'complete' ? () => setStatus('loading') : undefined}
  />;

  return <>
    <ComponentPlayground code={code} controls={<PropertyTabs groups={[
      { label: '布局', content: <>
        <DocsSelect label={copy.mode} value={mode} onValueChange={value => { setMode(value as LoadingMode); setFullscreenOpen(false); }} options={modeOptions} />
        <DocsSelect label={copy.preset} value={preset} onValueChange={value => setPreset(value as LoadingPreset)} options={presetOptions} />
      </> },
      { label: '状态', content: <>
        <DocsSelect label={copy.status} value={status} onValueChange={value => setStatus(value as LoadingStatus)} options={[['loading', copy.loadingOption], ['error', copy.errorOption], ['complete', copy.completeOption]]} />
        <DocsSelect label={copy.progress} value={progressMode} onValueChange={value => setProgressMode(value as typeof progressMode)} options={[['determinate', copy.determinateOption], ['indeterminate', copy.indeterminateOption], ['none', copy.hiddenOption]]} />
        <DocsSlider label={copy.progress} min={0} max={100} value={progress} disabled={progressMode !== 'determinate'} onValueChange={setProgress} unit="%" />
      </> },
      { label: '交互', content: <>
        <Switch label={copy.blocking} checked={blocking} onCheckedChange={setBlocking} />
        <Switch label={copy.lockScroll} checked={lockScroll} onCheckedChange={setLockScroll} />
        <Switch label={copy.tips} checked={showTips} onCheckedChange={setShowTips} />
      </> },
    ]} />}>
      <div className="loading-playground-preview" data-loading-playground>
        {mode === 'fullscreen'
          ? <><Button data-testid="open-loading-playground" onClick={() => setFullscreenOpen(true)}>{copy.openFullscreen}</Button>{fullscreenOpen ? preview : null}</>
          : preview}
      </div>
    </ComponentPlayground>

    <ScenePresetExample />
    <SimulationExample />
    <CarrierExample />
  </>;
}

function ScenePresetExample() {
  const { locale } = useLocale();
  const copy = loadingDocsCopy(locale);
  const [preset, setPreset] = useState<LoadingPreset | null>(null);
  const [character, setCharacter] = useState(0);
  const presets: LoadingPreset[] = ['brand-center', 'scene-bottom', 'intel', 'staged', 'edge', 'skeleton'];
  return <ComponentExample id="loading-fullscreen-scenes" title={copy.sceneTitle} code={`const [preset, setPreset] = useState<LoadingPreset | null>(null);

<Loading mode="fullscreen" preset={preset ?? 'brand-center'} active={preset !== null}
  background={<CustomScene />} progress={null}
  slots={{ 'top-end': <CharacterSwitcher />, 'bottom-end': <Cancel /> }} />`}>
    <div className="loading-scene-example" data-scene-example>
      <PencilText>{copy.sceneDescription}</PencilText>
      <div className="loading-scene-example__buttons">
        {presets.map(value => <Button key={value} variant="outline" data-loading-preset={value} onClick={() => setPreset(value)}>{value}</Button>)}
      </div>
      {preset ? <Loading
        mode="fullscreen"
        preset={preset}
        blocking={preset !== 'edge'}
        lockScroll={preset !== 'edge'}
        background={<DecorativeScene character={character} />}
        logo={<DemoLogo />}
        title={copy.loadingTitle}
        description={copy.loadingDescription}
        progress={preset === 'staged' ? undefined : null}
        stages={preset === 'staged' ? [
          { id: 'session', label: copy.stageSession, state: 'complete' },
          { id: 'assets', label: copy.stageAssets, state: 'active' },
          { id: 'world', label: copy.stageWorld },
        ] : undefined}
        activeStage="assets"
        tips={[copy.tipOne, copy.tipTwo, copy.tipThree]}
        showTipControls
        skeleton={preset === 'skeleton' ? <div className="loading-demo-skeleton-note"><PencilText>{copy.tipTwo}</PencilText></div> : undefined}
        slots={{
          'top-end': <Button variant="secondary" onClick={() => setCharacter(value => (value + 1) % 3)}>{copy.character}</Button>,
          'bottom-end': <Button data-testid="close-loading-scene" variant="ghost" onClick={() => setPreset(null)}>{copy.close}</Button>,
        }}
      /> : null}
    </div>
  </ComponentExample>;
}

function SimulationExample() {
  const { locale } = useLocale();
  const copy = loadingDocsCopy(locale);
  const [active, setActive] = useState(false);
  const [progress, setProgress] = useState(0);
  const status: LoadingStatus = progress >= 100 ? 'complete' : 'loading';

  useEffect(() => {
    if (!active || status === 'complete') return undefined;
    const timer = window.setInterval(() => setProgress(value => Math.min(100, value + 10)), 220);
    return () => window.clearInterval(timer);
  }, [active, status]);

  function start() {
    setProgress(0);
    setActive(true);
  }

  return <ComponentExample id="loading-honest-timing" title={copy.simulationTitle} code={`// Demo only: this timer does not represent a network or map resource.
const [active, setActive] = useState(false);
const [progress, setProgress] = useState(0);

<Loading active={active} mode="region" delay={180} minDuration={700}
  status={progress === 100 ? 'complete' : 'loading'} progress={progress}
  onCancel={() => setActive(false)} onContinue={() => setActive(false)} />`}>
    <div className="loading-simulation" data-simulation-example>
      <PencilText>{copy.simulationDescription}</PencilText>
      <Button data-testid="start-loading-simulation" onClick={start}>{copy.startSimulation}</Button>
      <Loading
        active={active}
        className="loading-simulation__region"
        delay={180}
        minDuration={700}
        mode="region"
        preset="intel"
        status={status}
        title={status === 'complete' ? copy.completeTitle : copy.loadingTitle}
        progress={progress}
        progressLabel={copy.progress}
        onCancel={status === 'loading' ? () => setActive(false) : undefined}
        onContinue={status === 'complete' ? () => setActive(false) : undefined}
      />
    </div>
  </ComponentExample>;
}

function CarrierExample() {
  const { locale } = useLocale();
  const copy = loadingDocsCopy(locale);
  return <ComponentExample id="loading-carriers" title={copy.mode} code={`<Loading mode="inline" progress={null} title="Saving" />
<Loading mode="region" preset="skeleton" title="Loading article" />
<Loading mode="fullscreen" preset="edge" blocking={false} lockScroll={false} />`}>
    <div className="loading-carriers">
      <Loading mode="inline" progress={null} title={copy.loadingTitle} />
      <Loading mode="region" preset="skeleton" title={copy.loadingTitle} description={copy.loadingDescription} />
    </div>
  </ComponentExample>;
}
