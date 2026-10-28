import { useEffect, useMemo, useState } from 'react';
import { __iconData as userIcon } from 'lucide-react/dist/esm/icons/user-round.mjs';
import { __iconData as shieldIcon } from 'lucide-react/dist/esm/icons/shield.mjs';
import { __iconData as swordIcon } from 'lucide-react/dist/esm/icons/swords.mjs';
import { __iconData as maximizeIcon } from 'lucide-react/dist/esm/icons/maximize-2.mjs';
import {
  Button,
  Loading,
  PencilSurface,
  PencilText,
  Switch,
  type LoadingAnimation,
  type LoadingMode,
  type LoadingPreset,
  type LoadingStatus,
} from '@inkra/react';

import { useLocale } from '../i18n';
import { ComponentExample } from './ComponentExample';
import { ComponentPlayground } from './ComponentPlayground';
import { DocsSelect } from './DocsSelect';
import { DocsSlider } from './DocsSlider';
import { DocsIcon } from './DocsIcon';
import { PropertyTabs } from './PropertyTabs';
import { loadingDocsCopy } from './loadingCopy';
import './LoadingExamples.css';

const characterIcons = [userIcon, shieldIcon, swordIcon];

function DecorativeScene() {
  return <div className="loading-scene" aria-hidden="true">
    <span className="loading-scene__sun" />
    <span className="loading-scene__ridge loading-scene__ridge--far" />
    <span className="loading-scene__ridge loading-scene__ridge--near" />
    <span className="loading-scene__path" />
  </div>;
}

function DemoLogo() {
  return <PencilSurface className="loading-demo-logo" variant="selection" radius={8}><PencilText>INKRA</PencilText></PencilSurface>;
}

export function LoadingExamples() {
  const { locale } = useLocale();
  const copy = loadingDocsCopy(locale);
  const modeOptions = [['inline', copy.modeInline], ['region', copy.modeRegion], ['fullscreen', copy.modeFullscreen]] as const;
  const presetOptions = [
    ['brand-center', copy.presetBrandCenter], ['scene-bottom', copy.presetSceneBottom], ['intel', copy.presetIntel],
    ['staged', copy.presetStaged], ['edge', copy.presetEdge], ['skeleton', copy.presetSkeleton],
  ] as const;
  const animationOptions = [
    ['progress', copy.animationProgress], ['orbit', copy.animationOrbit], ['dots', copy.animationDots],
    ['pulse', copy.animationPulse], ['trail', copy.animationTrail],
  ] as const;
  const [mode, setMode] = useState<LoadingMode>('region');
  const [preset, setPreset] = useState<LoadingPreset>('brand-center');
  const [animation, setAnimation] = useState<LoadingAnimation>('progress');
  const [status, setStatus] = useState<LoadingStatus>('loading');
  const [progressMode, setProgressMode] = useState<'determinate' | 'indeterminate' | 'none'>('indeterminate');
  const [progress, setProgress] = useState(48);
  const [blocking, setBlocking] = useState(true);
  const [lockScroll, setLockScroll] = useState(true);
  const [showLogo, setShowLogo] = useState(false);
  const [showBackground, setShowBackground] = useState(false);
  const [showTips, setShowTips] = useState(false);
  const [showTipControls, setShowTipControls] = useState(false);
  const [fullscreenOpen, setFullscreenOpen] = useState(false);
  const progressValue = progressMode === 'none' ? undefined : progressMode === 'indeterminate' ? null : progress;
  const title = status === 'error' ? copy.errorOption : status === 'complete' ? copy.completeOption : copy.loadingOption;
  const stages = useMemo(() => [
    { id: 'session', label: copy.stageSession, state: 'complete' as const },
    { id: 'assets', label: copy.stageAssets },
    { id: 'world', label: copy.stageWorld },
  ], [copy]);
  const code = [
    '<Loading',
    `  mode="${mode}" preset="${preset}" animation="${animation}" status="${status}"`,
    `  progress={${progressValue === undefined ? 'undefined' : progressValue === null ? 'null' : progressValue}}`,
    `  title=${JSON.stringify(title)}`,
    ...(mode === 'fullscreen' ? [`  blocking={${blocking}} lockScroll={${lockScroll}}`, '  onCancel={() => setOpen(false)}'] : []),
    ...(showLogo ? ['  logo={<DemoLogo />}'] : []),
    ...(showBackground ? ['  background={<DecorativeScene />}'] : []),
    ...(preset === 'staged' ? [`  stages={${JSON.stringify(stages)}} activeStage="assets"`] : []),
    ...(showTips ? [`  tips={${JSON.stringify([copy.tipOne, copy.tipTwo, copy.tipThree])}}`, `  showTipControls={${showTipControls}}`] : []),
    ...(status === 'error' ? ['  onRetry={() => setStatus("loading")}'] : []),
    ...(status === 'complete' ? ['  onContinue={() => setStatus("loading")}'] : []),
    '/>',
  ].join('\n');

  const preview = <Loading
    aria-label={copy.regionLabel}
    mode={mode}
    preset={preset}
    animation={animation}
    status={status}
    blocking={blocking}
    lockScroll={lockScroll}
    title={title}
    logo={showLogo ? <DemoLogo /> : undefined}
    background={showBackground ? <DecorativeScene /> : undefined}
    progress={progressValue}
    stages={preset === 'staged' ? stages : undefined}
    activeStage="assets"
    tips={showTips ? [copy.tipOne, copy.tipTwo, copy.tipThree] : undefined}
    showTipControls={showTips && showTipControls}
    onCancel={mode === 'fullscreen' ? () => setFullscreenOpen(false) : undefined}
    onRetry={status === 'error' ? () => setStatus('loading') : undefined}
    onContinue={status === 'complete' ? () => setStatus('loading') : undefined}
  />;

  return <>
    <ComponentPlayground code={code} controls={<PropertyTabs groups={[
      { label: '布局', content: <>
        <DocsSelect label={copy.mode} value={mode} onValueChange={value => { setMode(value as LoadingMode); setFullscreenOpen(false); }} options={modeOptions} />
        <DocsSelect label={copy.preset} value={preset} onValueChange={value => setPreset(value as LoadingPreset)} options={presetOptions} />
        <DocsSelect label={copy.animation} value={animation} onValueChange={value => setAnimation(value as LoadingAnimation)} options={animationOptions} />
      </> },
      { label: '内容', content: <>
        <Switch label={copy.showLogo} checked={showLogo} onCheckedChange={setShowLogo} />
        <Switch label={copy.showBackground} checked={showBackground} onCheckedChange={setShowBackground} />
        <Switch label={copy.showTips} checked={showTips} onCheckedChange={setShowTips} />
      </> },
      { label: '状态', content: <>
        <DocsSelect label={copy.status} value={status} onValueChange={value => setStatus(value as LoadingStatus)} options={[['loading', copy.loadingOption], ['error', copy.errorOption], ['complete', copy.completeOption]]} />
        <DocsSelect label={copy.progress} value={progressMode} onValueChange={value => setProgressMode(value as typeof progressMode)} options={[['determinate', copy.determinateOption], ['indeterminate', copy.indeterminateOption], ['none', copy.hiddenOption]]} />
        <DocsSlider label={copy.progress} min={0} max={100} value={progress} disabled={progressMode !== 'determinate'} onValueChange={setProgress} unit="%" />
      </> },
      { label: '交互', content: <>
        <Switch label={copy.blocking} checked={blocking} onCheckedChange={setBlocking} />
        <Switch label={copy.lockScroll} checked={lockScroll} onCheckedChange={setLockScroll} />
        <Switch label={copy.tips} checked={showTipControls} disabled={!showTips} onCheckedChange={setShowTipControls} />
      </> },
    ]} />}>
      <div className="loading-playground-preview" data-loading-playground>
        {mode === 'fullscreen'
          ? <><Button data-testid="open-loading-playground" onClick={() => setFullscreenOpen(true)}>{copy.openFullscreen}</Button>{fullscreenOpen ? preview : null}</>
          : preview}
      </div>
    </ComponentPlayground>

    <CarrierExample />
    <SimulationExample />
    <ScenePresetExample />
  </>;
}

function ScenePresetExample() {
  const { locale } = useLocale();
  const copy = loadingDocsCopy(locale);
  const [preset, setPreset] = useState<LoadingPreset | null>(null);
  const [character, setCharacter] = useState(0);
  const presets: Array<{
    animation: LoadingAnimation;
    label: string;
    preset: LoadingPreset;
    progress?: number | null;
  }> = [
    { preset: 'brand-center', label: copy.presetBrandCenter, animation: 'progress', progress: null },
    { preset: 'scene-bottom', label: copy.presetSceneBottom, animation: 'orbit' },
    { preset: 'intel', label: copy.presetIntel, animation: 'dots' },
    { preset: 'staged', label: copy.presetStaged, animation: 'pulse' },
    { preset: 'edge', label: copy.presetEdge, animation: 'trail', progress: null },
    { preset: 'skeleton', label: copy.presetSkeleton, animation: 'dots' },
  ];
  const activePreset = presets.find(item => item.preset === preset);
  const stages = [
    { id: 'session', label: copy.stageSession, state: 'complete' as const },
    { id: 'assets', label: copy.stageAssets, state: 'active' as const },
    { id: 'world', label: copy.stageWorld },
  ];
  return <ComponentExample id="loading-fullscreen-scenes" title={copy.sceneTitle} code={`const previews = [
  { preset: 'brand-center', animation: 'progress' },
  { preset: 'scene-bottom', animation: 'orbit' },
  { preset: 'intel', animation: 'dots' },
  { preset: 'staged', animation: 'pulse' },
  { preset: 'edge', animation: 'trail', progress: null },
  { preset: 'skeleton', animation: 'dots' },
];

{previews.map(item => <Loading mode="region" {...item} />)}`}>
    <div className="loading-scene-example" data-scene-example>
      <PencilText>{copy.sceneDescription}</PencilText>
      <div className="loading-preset-grid">
        {presets.map(item => <Loading
          aria-label={`${copy.regionLabel}: ${item.label}`}
          animation={item.animation}
          className="loading-preset-preview"
          data-loading-preset={item.preset}
          key={item.preset}
          mode="region"
          preset={item.preset}
          title={item.label}
          background={item.preset === 'scene-bottom' ? <DecorativeScene /> : undefined}
          logo={item.preset === 'brand-center' ? <DemoLogo /> : undefined}
          progress={item.progress}
          stages={item.preset === 'staged' ? stages : undefined}
          activeStage="assets"
          slots={{
            'top-end': <Button
              aria-label={`${copy.fullscreenPreview}: ${item.label}`}
              data-open-loading-preset={item.preset}
              size="icon-sm"
              title={`${copy.fullscreenPreview}: ${item.label}`}
              variant="ghost"
              onClick={() => setPreset(item.preset)}
            ><DocsIcon data={maximizeIcon} /></Button>,
          }}
        />)}
      </div>
      {preset && activePreset ? <Loading
        animation={activePreset.animation}
        mode="fullscreen"
        preset={preset}
        blocking={preset !== 'edge'}
        lockScroll={preset !== 'edge'}
        background={<DecorativeScene />}
        logo={<DemoLogo />}
        title={copy.loadingTitle}
        description={copy.loadingDescription}
        progress={activePreset.progress}
        stages={preset === 'staged' ? stages : undefined}
        activeStage="assets"
        tips={[copy.tipOne, copy.tipTwo, copy.tipThree]}
        showTipControls
        slots={{
          'bottom-start': <Button variant="ghost" data-character={character} startIcon={<DocsIcon data={characterIcons[character]} />} onClick={() => setCharacter(value => (value + 1) % characterIcons.length)}>{copy.character}</Button>,
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
