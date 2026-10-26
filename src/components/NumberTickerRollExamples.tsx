import { useState } from 'react';
import { Button, NumberTicker } from '@inkra/react';
import { useLocale } from '../i18n';
import { ComponentExample } from './ComponentExample';
import { numberTickerRollCopy } from './numberTickerRollCopy';

export function NumberTickerRollExamples() {
  const { locale } = useLocale();
  const labels = numberTickerRollCopy(locale);
  const [value, setValue] = useState(12);
  return <ComponentExample id="number-ticker-rolling-digits" title={labels.title} code={`const [value, setValue] = useState(12);
<NumberTicker value={value} animation="roll" rollDirection="auto" duration={650}
  formatOptions={{ maximumFractionDigits: 2 }} />
<Button onClick={() => setValue(current => current * 100)}>{'\\u00d7 100'}</Button>`}>
    <div className="number-ticker-examples__rolling" data-testid="rolling-example">
      <NumberTicker data-testid="rolling-number" value={value} animation="roll" duration={650} locale={locale} formatOptions={{ maximumFractionDigits: 2 }} />
      <div className="number-ticker-examples__controls">
        <Button onClick={() => setValue(current => Math.min(1e12, current + 1))}>+1</Button>
        <Button onClick={() => setValue(current => Math.min(1e12, current * 100))}>{'\u00d7 100'}</Button>
        <Button onClick={() => setValue(current => current / 100)}>{'\u00f7 100'}</Button>
        <Button onClick={() => setValue(999)}>999</Button>
        <Button onClick={() => setValue(-12.34)}>-12.34</Button>
        <Button variant="secondary" onClick={() => setValue(12)}>{labels.reset}</Button>
      </div>
    </div>
  </ComponentExample>;
}
