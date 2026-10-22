import { useRef, useState } from 'react';
import { Button, PencilSurface, Switch, Typewriter } from '@inkra/react';
import type { TypewriterHandle } from '@inkra/react';

import { useLocale } from '../i18n';
import { ComponentExample } from './ComponentExample';
import { ComponentPlayground } from './ComponentPlayground';
import { DocsSlider } from './DocsSlider';
import { PropertyTabs } from './PropertyTabs';
import './TypewriterExamples.css';

export function TypewriterExamples() {
  const { locale } = useLocale();
  const zh = locale === 'zh-CN';
  const text = (chinese: string, english: string) => zh ? chinese : english;
  const writer = useRef<TypewriterHandle>(null);
  const noteWriter = useRef<TypewriterHandle>(null);
  const [speed, setSpeed] = useState(52);
  const [punctuationDelay, setPunctuationDelay] = useState(260);
  const [paused, setPaused] = useState(false);
  const [completionCount, setCompletionCount] = useState(0);
  const message = text(
    '沿着海岸慢慢写下今天：风起，云散，然后出发。',
    'Write the day along the coast: wind rises, clouds part, then we go.',
  );
  const code = `<Typewriter
  speed={${speed}}
  punctuationDelay={${punctuationDelay}}
  paused={${paused}}
  onPausedChange={setPaused}
  onComplete={() => setCompletionCount(count => count + 1)}
>
  ${JSON.stringify(message)}
</Typewriter>`;

  const restart = () => {
    setCompletionCount(0);
    writer.current?.restart();
  };

  return <div className="typewriter-examples">
    <ComponentPlayground code={code} controls={<PropertyTabs groups={[
      { label: '基础', content: <>
        <DocsSlider label={text('逐字速度', 'Character speed')} value={speed} onValueChange={setSpeed} min={12} max={180} step={4} unit=" ms" />
        <DocsSlider label={text('标点停顿', 'Punctuation pause')} value={punctuationDelay} onValueChange={setPunctuationDelay} min={0} max={800} step={20} unit=" ms" />
      </> },
      { label: '交互', content: <>
        <Switch label={text('暂停', 'Paused')} checked={paused} onCheckedChange={setPaused} />
        <div className="typewriter-examples__controls">
          <Button variant="secondary" onClick={() => setPaused(value => !value)}>{paused ? text('继续', 'Resume') : text('暂停', 'Pause')}</Button>
          <Button variant="outline" onClick={() => writer.current?.complete()}>{text('立即显示全文', 'Show all')}</Button>
          <Button variant="ghost" onClick={restart}>{text('重新开始', 'Restart')}</Button>
        </div>
      </> },
    ]} />}>
      <PencilSurface as="section" className="typewriter-examples__paper" variant="paper" radius={8}>
        <Typewriter
          ref={writer}
          speed={speed}
          punctuationDelay={punctuationDelay}
          paused={paused}
          onPausedChange={setPaused}
          onComplete={() => setCompletionCount(count => count + 1)}
        >{message}</Typewriter>
        <span className="typewriter-examples__status" aria-live="polite">
          {completionCount > 0 ? text('书写完成', 'Writing complete') : paused ? text('已暂停', 'Paused') : text('正在书写', 'Writing')}
        </span>
      </PencilSurface>
    </ComponentPlayground>

    <ComponentExample title={text('表情与多语言', 'Emoji and multilingual text')} code={`<Typewriter speed={42}>\n  {'你好，世界 👩🏽‍💻 — élan!'}\n</Typewriter>`}>
      <div className="typewriter-examples__specimens">
        <Typewriter speed={42} punctuationDelay={220}>你好，世界 👩🏽‍💻 — élan!</Typewriter>
        <Typewriter speed={34} punctuationDelay={180}>Plan, sketch, revise… 完成。 ✏️</Typewriter>
      </div>
    </ComponentExample>

    <ComponentExample title={text('命令式控制', 'Imperative controls')} code={`const writer = useRef<TypewriterHandle>(null);\n\n<Typewriter ref={writer}>A controllable note.</Typewriter>\n<Button onClick={() => writer.current?.pause()}>Pause</Button>\n<Button onClick={() => writer.current?.resume()}>Resume</Button>\n<Button onClick={() => writer.current?.complete()}>Show all</Button>\n<Button onClick={() => writer.current?.restart()}>Restart</Button>`}>
      <div className="typewriter-examples__note">
        <Typewriter ref={noteWriter} speed={68}>{text('这段便签可以暂停、继续或立即完成。', 'This note can pause, resume, or finish immediately.')}</Typewriter>
        <div className="typewriter-examples__controls">
          <Button size="sm" variant="secondary" onClick={() => noteWriter.current?.pause()}>{text('暂停', 'Pause')}</Button>
          <Button size="sm" variant="secondary" onClick={() => noteWriter.current?.resume()}>{text('继续', 'Resume')}</Button>
          <Button size="sm" variant="outline" onClick={() => noteWriter.current?.complete()}>{text('显示全文', 'Show all')}</Button>
          <Button size="sm" variant="ghost" onClick={() => noteWriter.current?.restart()}>{text('再写一次', 'Write again')}</Button>
        </div>
      </div>
    </ComponentExample>
  </div>;
}
