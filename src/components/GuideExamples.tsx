import { useState } from 'react';
import { useLocale } from '../i18n';
import { Button, Guide, Switch, type InkraLocale } from '@inkra/react';
import { ComponentExample } from './ComponentExample';
import { ComponentPlayground } from './ComponentPlayground';
import { DocsSelect } from './DocsSelect';
import { PropertyTabs } from './PropertyTabs';
import './GuideExamples.css';

type SkipPlacement = 'panel' | 'top-start' | 'top-end' | 'bottom-start' | 'bottom-end';
type SkipAppearance = 'icon' | 'text';

const guideCopy: Record<InkraLocale, {
  start: string;
  firstTitle: string;
  firstDescription: string;
  secondTitle: string;
  secondDescription: string;
  thirdTitle: string;
  thirdDescription: string;
  language: string;
  content: string;
  currentStep: string;
  behavior: string;
  open: string;
  showSkip: string;
  escape: string;
  autoScroll: string;
  skipPlacement: string;
  skipAppearance: string;
  placements: Record<SkipPlacement, string>;
  appearances: Record<SkipAppearance, string>;
}> = {
  en: {
    start: 'Start guide',
    firstTitle: 'Create a note',
    firstDescription: 'Begin with a new note and keep the first draft small.',
    secondTitle: 'Organize the board',
    secondDescription: 'Move related notes together as the board grows.',
    thirdTitle: 'Share the result',
    thirdDescription: 'Invite the team after the outline is ready.',
    language: 'Language', content: 'Content', currentStep: 'Current step', behavior: 'Behavior', open: 'Open', showSkip: 'Show skip',
    escape: 'Escape closes', autoScroll: 'Auto scroll', skipPlacement: 'Skip placement', skipAppearance: 'Skip appearance',
    placements: { panel: 'Inside panel', 'top-start': 'Top start', 'top-end': 'Top end', 'bottom-start': 'Bottom start', 'bottom-end': 'Bottom end' },
    appearances: { icon: 'Icon', text: 'Text' },
  },
  'zh-CN': {
    start: '开始引导',
    firstTitle: '创建笔记',
    firstDescription: '先写一条简短笔记，之后再逐步补充。',
    secondTitle: '整理看板',
    secondDescription: '内容变多后，把相关笔记放在一起。',
    thirdTitle: '分享结果',
    thirdDescription: '大纲准备好后，再邀请团队一起查看。',
    language: '语言', content: '内容', currentStep: '当前步骤', behavior: '行为', open: '展开', showSkip: '显示跳过',
    escape: 'Escape 关闭', autoScroll: '自动定位', skipPlacement: '跳过位置', skipAppearance: '跳过外观',
    placements: { panel: '面板内', 'top-start': '左上角', 'top-end': '右上角', 'bottom-start': '左下角', 'bottom-end': '右下角' },
    appearances: { icon: '图标', text: '文字' },
  },
  ja: {
    start: 'ガイドを開始',
    firstTitle: 'ノートを作成',
    firstDescription: 'まず短いノートを作り、あとから内容を足します。',
    secondTitle: 'ボードを整理',
    secondDescription: 'ノートが増えたら、関連する内容をまとめます。',
    thirdTitle: '結果を共有',
    thirdDescription: '概要が整ったら、チームを招待します。',
    language: '言語', content: '内容', currentStep: '現在のステップ', behavior: '動作', open: '開く', showSkip: 'スキップを表示',
    escape: 'Escape で閉じる', autoScroll: '自動スクロール', skipPlacement: 'スキップ位置', skipAppearance: 'スキップ表示',
    placements: { panel: 'パネル内', 'top-start': '左上', 'top-end': '右上', 'bottom-start': '左下', 'bottom-end': '右下' },
    appearances: { icon: 'アイコン', text: 'テキスト' },
  },
  ko: {
    start: '가이드 시작',
    firstTitle: '노트 만들기',
    firstDescription: '짧은 노트로 시작하고 나중에 내용을 보완하세요.',
    secondTitle: '보드 정리',
    secondDescription: '노트가 늘어나면 관련 내용을 함께 모으세요.',
    thirdTitle: '결과 공유',
    thirdDescription: '개요가 준비되면 팀을 초대하세요.',
    language: '언어', content: '내용', currentStep: '현재 단계', behavior: '동작', open: '열기', showSkip: '건너뛰기 표시',
    escape: 'Escape로 닫기', autoScroll: '자동 스크롤', skipPlacement: '건너뛰기 위치', skipAppearance: '건너뛰기 모양',
    placements: { panel: '패널 안', 'top-start': '왼쪽 위', 'top-end': '오른쪽 위', 'bottom-start': '왼쪽 아래', 'bottom-end': '오른쪽 아래' },
    appearances: { icon: '아이콘', text: '텍스트' },
  },
  fr: {
    start: 'Démarrer le guide',
    firstTitle: 'Créer une note',
    firstDescription: 'Commencez par une note courte, puis complétez-la.',
    secondTitle: 'Organiser le tableau',
    secondDescription: 'Regroupez les notes liées à mesure que le tableau grandit.',
    thirdTitle: 'Partager le résultat',
    thirdDescription: 'Invitez l’équipe lorsque le plan est prêt.',
    language: 'Langue', content: 'Contenu', currentStep: 'Étape actuelle', behavior: 'Comportement', open: 'Ouvrir', showSkip: 'Afficher Ignorer',
    escape: 'Fermer avec Échap', autoScroll: 'Défilement auto', skipPlacement: 'Position d’Ignorer', skipAppearance: 'Apparence d’Ignorer',
    placements: { panel: 'Dans le panneau', 'top-start': 'En haut au début', 'top-end': 'En haut à la fin', 'bottom-start': 'En bas au début', 'bottom-end': 'En bas à la fin' },
    appearances: { icon: 'Icône', text: 'Texte' },
  },
};

const localeOptions: Array<[InkraLocale, string]> = [
  ['en', 'English'],
  ['zh-CN', '简体中文'],
  ['ja', '日本語'],
  ['ko', '한국어'],
  ['fr', 'Français'],
];

export function GuideExamples() {
  const { locale } = useLocale();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [guideLocale, setGuideLocale] = useState<InkraLocale>(locale);
  const [showSkip, setShowSkip] = useState(true);
  const [skipPlacement, setSkipPlacement] = useState<SkipPlacement>('top-end');
  const [skipAppearance, setSkipAppearance] = useState<SkipAppearance>('icon');
  const [closeOnEscape, setCloseOnEscape] = useState(true);
  const [autoScroll, setAutoScroll] = useState(true);
  const [lastEvent, setLastEvent] = useState('none');
  const copy = guideCopy[guideLocale];
  const code = `<Guide.Root
  open={open}
  step={step}
  onOpenChange={setOpen}
  onStepChange={setStep}
  onSkip={() => record('skip')}
  onFinish={() => record('finish')}
  showSkip={${showSkip}}
  skipPlacement="${skipPlacement}"
  skipAppearance="${skipAppearance}"
  closeOnEscape={${closeOnEscape}}
  scrollIntoView={${autoScroll}}
  locale="${guideLocale}"
>
  <Guide.Trigger asChild><Button>${copy.start}</Button></Guide.Trigger>
  <Guide.Step target="#guide-create" title="${copy.firstTitle}" description="${copy.firstDescription}" />
  <Guide.Step target="#guide-board" title="${copy.secondTitle}" description="${copy.secondDescription}" />
  <Guide.Step target="#guide-share" title="${copy.thirdTitle}" description="${copy.thirdDescription}" />
</Guide.Root>`;

  return <>
    <ComponentPlayground code={code} controls={<PropertyTabs groups={[
      { label: copy.content, content: <>
        <DocsSelect label={copy.language} value={guideLocale} onValueChange={value => setGuideLocale(value as InkraLocale)} options={localeOptions} />
        <DocsSelect label={copy.currentStep} value={String(step)} onValueChange={value => setStep(Number(value))} options={[["0", "1"], ["1", "2"], ["2", "3"]]} />
      </> },
      { label: copy.behavior, content: <>
        <Switch label={copy.open} checked={open} onCheckedChange={setOpen} />
        <Switch label={copy.showSkip} checked={showSkip} onCheckedChange={setShowSkip} />
        <DocsSelect label={copy.skipPlacement} value={skipPlacement} onValueChange={value => setSkipPlacement(value as SkipPlacement)} options={Object.entries(copy.placements) as Array<[SkipPlacement, string]>} />
        <DocsSelect label={copy.skipAppearance} value={skipAppearance} onValueChange={value => setSkipAppearance(value as SkipAppearance)} options={Object.entries(copy.appearances) as Array<[SkipAppearance, string]>} />
        <Switch label={copy.escape} checked={closeOnEscape} onCheckedChange={setCloseOnEscape} />
        <Switch label={copy.autoScroll} checked={autoScroll} onCheckedChange={setAutoScroll} />
      </> },
    ]} />}>
      <div className="guide-demo" data-guide-event={lastEvent}>
        <div className="guide-demo__targets">
          <Button id="guide-create" variant="outline">{copy.firstTitle}</Button>
          <div id="guide-board" className="guide-demo__board" tabIndex={-1}>{copy.secondTitle}</div>
          <Button id="guide-share" variant="secondary">{copy.thirdTitle}</Button>
        </div>
        <Guide.Root
          open={open}
          step={step}
          onOpenChange={setOpen}
          onStepChange={setStep}
          onSkip={() => setLastEvent('skip')}
          onFinish={() => setLastEvent('finish')}
          showSkip={showSkip}
          skipPlacement={skipPlacement}
          skipAppearance={skipAppearance}
          closeOnEscape={closeOnEscape}
          scrollIntoView={autoScroll}
          locale={guideLocale}
        >
          <Guide.Trigger asChild><Button className="guide-demo__start">{copy.start}</Button></Guide.Trigger>
          <Guide.Step id="create" target="#guide-create" title={copy.firstTitle} description={copy.firstDescription} />
          <Guide.Step id="board" target="#guide-board" title={copy.secondTitle} description={copy.secondDescription} side="right" />
          <Guide.Step id="share" target="#guide-share" title={copy.thirdTitle} description={copy.thirdDescription} side="top" />
        </Guide.Root>
      </div>
    </ComponentPlayground>

    <CallbackExample />
    <MissingTargetExample />
  </>;
}

function CallbackExample() {
  const [result, setResult] = useState('none');
  const [showSkip, setShowSkip] = useState(true);
  return <ComponentExample id="guide-skip-and-finish" title="跳过、完成与隐藏跳过" code={`<Guide.Root
  showSkip={showSkip}
  skipPlacement="panel"
  skipAppearance="text"
  onSkip={() => setResult('skip')}
  onFinish={() => setResult('finish')}
>
  <Guide.Trigger asChild><Button>Start</Button></Guide.Trigger>
  <Guide.Step target="#guide-callback-target" title="One" />
  <Guide.Step target="#guide-callback-target" title="Two" />
</Guide.Root>`}>
    <div className="guide-demo guide-demo--supplemental">
      <div className="guide-demo__targets"><Button id="guide-callback-target" variant="outline">Target</Button></div>
      <Switch label="显示跳过" checked={showSkip} onCheckedChange={setShowSkip} />
      <Guide.Root showSkip={showSkip} skipPlacement="panel" skipAppearance="text" onSkip={() => setResult('skip')} onFinish={() => setResult('finish')}>
        <Guide.Trigger asChild><Button>Start</Button></Guide.Trigger>
        <Guide.Step target="#guide-callback-target" title="First step" description="Skip ends the guide without finishing." />
        <Guide.Step target="#guide-callback-target" title="Final step" description="Finish runs only from the last step." />
      </Guide.Root>
      <output className="component-demo-status" data-guide-result={result}>result: {result}</output>
    </div>
  </ComponentExample>;
}

function MissingTargetExample() {
  return <ComponentExample id="guide-missing-target" title="缺失目标降级" code={`<Guide.Root>
  <Guide.Trigger asChild><Button>Start</Button></Guide.Trigger>
  <Guide.Step target="#not-mounted" title="Target unavailable" description="The guide stays usable in the viewport." />
  <Guide.Step target="#guide-existing-target" title="Target available" />
</Guide.Root>`}>
    <div className="guide-demo guide-demo--supplemental">
      <Button id="guide-existing-target" variant="outline">Existing target</Button>
      <Guide.Root>
        <Guide.Trigger asChild><Button>Start missing-target guide</Button></Guide.Trigger>
        <Guide.Step target="#guide-target-not-mounted" title="Target unavailable" description="The card falls back to the viewport without a false highlight." />
        <Guide.Step target="#guide-existing-target" title="Target available" description="The next step attaches to the mounted target." />
      </Guide.Root>
    </div>
  </ComponentExample>;
}
