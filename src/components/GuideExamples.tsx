import { useState } from 'react';
import { Button, Guide, Switch, type InkraLocale } from '@inkra/react';
import { ComponentExample } from './ComponentExample';
import { ComponentPlayground } from './ComponentPlayground';
import { DocsSelect } from './DocsSelect';
import { PropertyTabs } from './PropertyTabs';
import { useLocale } from '../i18n';
import './GuideExamples.css';

const guideCopy: Record<InkraLocale, {
  start: string;
  firstTitle: string;
  firstDescription: string;
  secondTitle: string;
  secondDescription: string;
  thirdTitle: string;
  thirdDescription: string;
}> = {
  en: {
    start: 'Start guide',
    firstTitle: 'Create a note',
    firstDescription: 'Begin with a new note and keep the first draft small.',
    secondTitle: 'Organize the board',
    secondDescription: 'Move related notes together as the board grows.',
    thirdTitle: 'Share the result',
    thirdDescription: 'Invite the team after the outline is ready.',
  },
  'zh-CN': {
    start: '开始引导',
    firstTitle: '创建笔记',
    firstDescription: '先写一条简短笔记，之后再逐步补充。',
    secondTitle: '整理看板',
    secondDescription: '内容变多后，把相关笔记放在一起。',
    thirdTitle: '分享结果',
    thirdDescription: '大纲准备好后，再邀请团队一起查看。',
  },
  ja: {
    start: 'ガイドを開始',
    firstTitle: 'ノートを作成',
    firstDescription: 'まず短いノートを作り、あとから内容を足します。',
    secondTitle: 'ボードを整理',
    secondDescription: 'ノートが増えたら、関連する内容をまとめます。',
    thirdTitle: '結果を共有',
    thirdDescription: '概要が整ったら、チームを招待します。',
  },
  ko: {
    start: '가이드 시작',
    firstTitle: '노트 만들기',
    firstDescription: '짧은 노트로 시작하고 나중에 내용을 보완하세요.',
    secondTitle: '보드 정리',
    secondDescription: '노트가 늘어나면 관련 내용을 함께 모으세요.',
    thirdTitle: '결과 공유',
    thirdDescription: '개요가 준비되면 팀을 초대하세요.',
  },
  fr: {
    start: 'Démarrer le guide',
    firstTitle: 'Créer une note',
    firstDescription: 'Commencez par une note courte, puis complétez-la.',
    secondTitle: 'Organiser le tableau',
    secondDescription: 'Regroupez les notes liées à mesure que le tableau grandit.',
    thirdTitle: 'Partager le résultat',
    thirdDescription: 'Invitez l’équipe lorsque le plan est prêt.',
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
  const { t } = useLocale();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [guideLocale, setGuideLocale] = useState<InkraLocale>('zh-CN');
  const [showSkip, setShowSkip] = useState(true);
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
      { label: '内容', content: <>
        <DocsSelect label="语言" value={guideLocale} onValueChange={value => setGuideLocale(value as InkraLocale)} options={localeOptions} />
        <DocsSelect label="当前步骤" value={String(step)} onValueChange={value => setStep(Number(value))} options={[["0", "1"], ["1", "2"], ["2", "3"]]} />
      </> },
      { label: '行为', content: <>
        <Switch label={t('展开')} checked={open} onCheckedChange={setOpen} />
        <Switch label="显示跳过" checked={showSkip} onCheckedChange={setShowSkip} />
        <Switch label="Escape 关闭" checked={closeOnEscape} onCheckedChange={setCloseOnEscape} />
        <Switch label="自动定位" checked={autoScroll} onCheckedChange={setAutoScroll} />
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
      <Guide.Root showSkip={showSkip} onSkip={() => setResult('skip')} onFinish={() => setResult('finish')}>
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
