import { useState } from 'react';
import { Button, NumberTicker, PencilText } from '@inkra/react';
import { useLocale } from '../i18n';
import { ComponentExample } from './ComponentExample';
import { numberTickerRollCopy } from './numberTickerRollCopy';
import { DocsSelect } from './DocsSelect';

const comparisons = [
  { from: 10, to: 1000, kind: 'shift' },
  { from: 12.34, to: 123.4, kind: 'shift' },
  { from: 1.2, to: 120, kind: 'shift' },
  { from: 12, to: 0.12, kind: 'shift' },
  { from: 12, to: 13, kind: 'increment' },
  { from: 99, to: 100, kind: 'carry' },
] as const;

export function NumberTickerRollExamples() {
  const { locale } = useLocale();
  const labels = numberTickerRollCopy(locale);
  const [value, setValue] = useState(10);
  const [animation, setAnimation] = useState<'count' | 'roll' | 'morph'>('morph');
  const next = value === 10 ? 1000 : 10;
  return <ComponentExample id="number-ticker-rolling-digits" title={labels.animation} code={`const [value, setValue] = useState(${value});
<NumberTicker value={value} animation="${animation}" duration={420} formatOptions={{ useGrouping: false }} />
<Button onClick={() => setValue(current => current === 10 ? 1000 : 10)}>
  {value === 10 ? '10 → 1000' : '1000 → 10'}
</Button>`}>
    <div className="number-ticker-examples__rolling" data-testid="rolling-example">
      <DocsSelect label={labels.animation} value={animation} onValueChange={mode => setAnimation(mode as typeof animation)} presentation="radio" options={[
        ['count', labels.count], ['roll', labels.roll], ['morph', labels.morph],
      ]} />
      <div className="number-ticker-examples__comparison-value">
        <NumberTicker data-testid="rolling-number" value={value} animation={animation} duration={420} locale={locale} formatOptions={{ useGrouping: false }} />
      </div>
      <Button onClick={() => setValue(next)}>{`${value} → ${next}`}</Button>
    </div>
  </ComponentExample>;
}

export function NumberTickerShiftExamples() {
  const { locale } = useLocale();
  const labels = numberTickerRollCopy(locale);
  const [animation, setAnimation] = useState<'count' | 'roll' | 'morph'>('morph');
  const [comparisonValues, setComparisonValues] = useState<number[]>(() => comparisons.map(({ from }) => from));
  const tickerProps = { animation, duration: 420, locale, formatOptions: { maximumFractionDigits: 2, useGrouping: false } };
  const code = comparisons.map(({ from, to }, index) => `const [sample${index + 1}, setSample${index + 1}] = useState(${comparisonValues[index]});
<div style={{ inlineSize: '12ch', maxInlineSize: '100%', textAlign: 'right' }}>
  <NumberTicker value={sample${index + 1}} animation="${animation}" duration={420}
    locale=${JSON.stringify(locale)} formatOptions={{ maximumFractionDigits: 2, useGrouping: false }} />
</div>
<Button onClick={() => setSample${index + 1}(current => current === ${from} ? ${to} : ${from})}>
  {sample${index + 1} === ${from} ? '${from} → ${to}' : '${to} → ${from}'}
</Button>`).join('\n\n');
  return <ComponentExample id="number-ticker-decimal-shifts" title={labels.title} code={code}>
    <div className="number-ticker-examples__rolling" data-testid="ticker-shift-example">
      <DocsSelect label={labels.animation} value={animation} onValueChange={next => setAnimation(next as typeof animation)} presentation="radio" options={[
        ['count', labels.count], ['roll', labels.roll], ['morph', labels.morph],
      ]} />
      <PencilText>{labels.explanation}</PencilText>
      <PencilText>{labels.comparison}</PencilText>
      <div className="number-ticker-examples__comparisons" data-testid="ticker-morph-comparisons">
        {comparisons.map(({ from, to, kind }, index) => {
          const current = comparisonValues[index];
          const next = current === from ? to : from;
          return <div className="number-ticker-examples__comparison" key={`${from}-${to}`} data-comparison={kind}>
            <PencilText>{labels[kind]}</PencilText>
            <div className="number-ticker-examples__comparison-value">
              <NumberTicker data-testid={`ticker-comparison-${index}`} value={current} {...tickerProps} />
            </div>
            <Button variant="secondary" onClick={() => setComparisonValues(values => values.map((amount, position) => position === index ? next : amount))}>
              {`${current} → ${next}`}
            </Button>
          </div>;
        })}
      </div>
    </div>
  </ComponentExample>;
}
