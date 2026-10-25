import { useState } from 'react';
import {
  Button,
  Card,
  Flip,
  FlipToggle,
  PencilText,
  Switch,
  Tilt,
  type TiltAxis,
} from '@inkra/react';

import { useLocale } from '../i18n';
import { ComponentExample } from './ComponentExample';
import { ComponentPlayground } from './ComponentPlayground';
import { DocsSelect } from './DocsSelect';
import { DocsSlider } from './DocsSlider';
import { PropertyTabs } from './PropertyTabs';
import './FlipExamples.css';

function NoteFace({ back = false, zh }: { back?: boolean; zh: boolean }) {
  return <Card.Root className="flip-examples__card" divided={false} variant={back ? 'quiet' : 'paper'}>
    <Card.Content className="flip-examples__card-content">
      <span className="flip-examples__eyebrow">{back ? (zh ? '背面' : 'Back') : (zh ? '正面' : 'Front')}</span>
      <PencilText as="h3">{back ? (zh ? '下一步' : 'Next step') : (zh ? '灵感卡片' : 'Idea card')}</PencilText>
      <PencilText>{back
        ? (zh ? '把值得继续的方向写成一个具体动作。' : 'Turn the promising direction into one concrete action.')
        : (zh ? '保留一个值得继续探索的想法。' : 'Keep one idea worth exploring.')}</PencilText>
      <div className="flip-examples__actions">
        <FlipToggle variant="outline">{back ? (zh ? '查看正面' : 'Show front') : (zh ? '查看背面' : 'Show back')}</FlipToggle>
        {back
          ? <Button variant="ghost" onClick={() => undefined}>{zh ? '保存动作' : 'Save action'}</Button>
          : <a className="flip-examples__link" href="#flip-independent-content">{zh ? '阅读说明' : 'Read notes'}</a>}
      </div>
    </Card.Content>
  </Card.Root>;
}

export function FlipExamples() {
  const { locale } = useLocale();
  const zh = locale === 'zh-CN';
  const [flipped, setFlipped] = useState(false);
  const [flipEnabled, setFlipEnabled] = useState(true);
  const [tilt, setTilt] = useState(false);
  const [axis, setAxis] = useState<TiltAxis>('both');
  const [maxAngle, setMaxAngle] = useState(8);
  const [response, setResponse] = useState(120);
  const [resetDuration, setResetDuration] = useState(180);
  const code = `<Flip
  front={<FrontContent />}
  back={<BackContent />}
  flipped={${flipped}}
  onFlippedChange={setFlipped}
  flipEnabled={${flipEnabled}}
  tilt={${tilt}}
  tiltAxis="${axis}"
  tiltMaxAngle={${maxAngle}}
  tiltResponse={${response}}
  tiltResetDuration={${resetDuration}}
/>`;

  return <div className="component-examples flip-examples">
    <ComponentPlayground code={code} controls={<PropertyTabs groups={[
      { label: zh ? '交互' : 'Interaction', content: <>
        <Switch label={zh ? '翻到背面' : 'Show back'} checked={flipped} onCheckedChange={setFlipped} />
        <Switch label={zh ? '允许翻面' : 'Enable flipping'} checked={flipEnabled} onCheckedChange={setFlipEnabled} />
        <Switch label={zh ? '鼠标倾斜' : 'Mouse tilt'} checked={tilt} onCheckedChange={setTilt} />
      </> },
      { label: zh ? '倾斜' : 'Tilt', content: <>
        <DocsSelect label={zh ? '轴向' : 'Axis'} value={axis} onValueChange={value => setAxis(value as TiltAxis)} options={[
          ['both', zh ? '双轴' : 'Both axes'],
          ['x', zh ? '纵向倾斜' : 'Vertical tilt'],
          ['y', zh ? '横向倾斜' : 'Horizontal tilt'],
        ]} />
        <DocsSlider label={zh ? '最大角度' : 'Maximum angle'} min={0} max={16} step={1} unit="°" value={maxAngle} onValueChange={setMaxAngle} />
        <DocsSlider label={zh ? '跟随响应' : 'Response'} min={0} max={420} step={30} unit="ms" value={response} onValueChange={setResponse} />
        <DocsSlider label={zh ? '回正时长' : 'Reset duration'} min={0} max={600} step={30} unit="ms" value={resetDuration} onValueChange={setResetDuration} />
      </> },
    ]} />}>
      <Flip
        aria-label={zh ? '可翻面的灵感卡片' : 'Flippable idea card'}
        back={<NoteFace back zh={zh} />}
        className="flip-examples__playground-card"
        flipEnabled={flipEnabled}
        flipped={flipped}
        front={<NoteFace zh={zh} />}
        onFlippedChange={setFlipped}
        tilt={tilt}
        tiltAxis={axis}
        tiltMaxAngle={maxAngle}
        tiltResetDuration={resetDuration}
        tiltResponse={response}
      />
    </ComponentPlayground>

    <ComponentExample id="flip-uncontrolled-flip-and-independent-content" title={zh ? '非受控翻面与独立内容' : 'Uncontrolled flip and independent content'} code={`<Flip
  defaultFlipped={false}
  front={<ArticleSummary />}
  back={<ArticleActions />}
/>`}>
      <div id="flip-independent-content" className="flip-examples__row">
        <Flip
          aria-label={zh ? '非受控文章卡片' : 'Uncontrolled article card'}
          back={<Card.Root className="flip-examples__compact"><Card.Content className="flip-examples__compact-content"><PencilText as="h3">{zh ? '操作' : 'Actions'}</PencilText><PencilText>{zh ? '按钮仍保持自己的点击行为。' : 'Buttons keep their own click behavior.'}</PencilText><div className="flip-examples__actions"><Button>{zh ? '归档' : 'Archive'}</Button><FlipToggle variant="outline">{zh ? '返回' : 'Back'}</FlipToggle></div></Card.Content></Card.Root>}
          front={<Card.Root className="flip-examples__compact"><Card.Content className="flip-examples__compact-content"><PencilText as="h3">{zh ? '文章摘要' : 'Article summary'}</PencilText><PencilText>{zh ? '链接可以正常聚焦与打开。' : 'The link remains focusable and usable.'}</PencilText><div className="flip-examples__actions"><a className="flip-examples__link" href="#flip-standalone-tilt">{zh ? '打开章节' : 'Open section'}</a><FlipToggle>{zh ? '更多操作' : 'More actions'}</FlipToggle></div></Card.Content></Card.Root>}
        />
      </div>
    </ComponentExample>

    <ComponentExample id="flip-standalone-tilt" title={zh ? '独立 Tilt' : 'Standalone Tilt'} code={`<Tilt maxAngle={6} axis="both">
  <Card.Root><Card.Content>...</Card.Content></Card.Root>
</Tilt>`}>
      <div id="flip-standalone-tilt" className="flip-examples__row">
        <Tilt className="flip-examples__standalone-tilt" maxAngle={6} response={90} resetDuration={240}>
          <Card.Root className="flip-examples__compact" variant="quiet">
            <Card.Content className="flip-examples__compact-content">
              <PencilText as="h3">{zh ? '只跟随鼠标' : 'Mouse tracking only'}</PencilText>
              <PencilText>{zh ? '没有翻面、反光、发光或放大。触屏保持静止。' : 'No flip, glare, glow, or zoom. Touch stays still.'}</PencilText>
              <Button variant="outline">{zh ? '普通操作' : 'Regular action'}</Button>
            </Card.Content>
          </Card.Root>
        </Tilt>
      </div>
    </ComponentExample>
  </div>;
}
