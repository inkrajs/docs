import { useState } from 'react';
import { Button, NumberTicker, PencilSurface, Switch } from '@inkra/react';

import { useLocale } from '../i18n';
import { ComponentExample } from './ComponentExample';
import { ComponentPlayground } from './ComponentPlayground';
import { DocsSelect } from './DocsSelect';
import { PropertyTabs } from './PropertyTabs';
import './NumberTickerExamples.css';

const quote = (value: string) => JSON.stringify(value);

export function NumberTickerExamples() {
  const { locale } = useLocale();
  const zh = locale === 'zh-CN';
  const text = (chinese: string, english: string) => zh ? chinese : english;
  const [value, setValue] = useState(12840);
  const [format, setFormat] = useState<'standard' | 'compact' | 'currency' | 'decimal'>('standard');
  const [showDelta, setShowDelta] = useState(true);
  const [animate, setAnimate] = useState(true);
  const [affixes, setAffixes] = useState(true);
  const [duration, setDuration] = useState(420);
  const formatOptions: Intl.NumberFormatOptions = format === 'compact'
    ? { notation: 'compact', maximumFractionDigits: 1 }
    : format === 'currency'
      ? { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }
      : format === 'decimal'
        ? { minimumFractionDigits: 2, maximumFractionDigits: 2 }
        : { maximumFractionDigits: 0 };
  const prefix = affixes && format !== 'currency' ? text('积分', 'Points') : undefined;
  const suffix = affixes && format !== 'currency' ? text('总计', 'total') : undefined;
  const code = `const [value, setValue] = useState(${value});

<NumberTicker
  value={value}
  locale=${quote(locale === 'en' ? 'en-US' : 'zh-CN')}
  formatOptions={${JSON.stringify(formatOptions)}}
  animate={${animate}}
  duration={${duration}}
  showDelta={${showDelta}}${prefix ? `
  prefix=${quote(prefix)}` : ''}${suffix ? `
  suffix=${quote(suffix)}` : ''}
/>
<Button onClick={() => setValue(current => current + 275)}>${text('增加', 'Increase')}</Button>
<Button onClick={() => setValue(current => current - 180)} variant="secondary">${text('减少', 'Decrease')}</Button>`;

  return <div className="number-ticker-examples">
    <ComponentPlayground code={code} controls={<PropertyTabs groups={[
      { label: '基础', content: <>
        <DocsSelect label={text('格式', 'Format')} value={format} onValueChange={next => setFormat(next as typeof format)} options={[
          ['standard', text('千分位', 'Grouped')],
          ['compact', text('紧凑记法', 'Compact')],
          ['currency', text('货币', 'Currency')],
          ['decimal', text('两位小数', 'Two decimals')],
        ]} />
        <DocsSelect label={text('动画时长', 'Duration')} value={String(duration)} onValueChange={next => setDuration(Number(next))} options={[
          ['180', '180 ms'], ['420', '420 ms'], ['800', '800 ms'],
        ]} />
        <Switch label={text('前后缀', 'Prefix and suffix')} checked={affixes} onCheckedChange={setAffixes} />
      </> },
      { label: '交互', content: <>
        <Switch label={text('数值过渡', 'Animate changes')} checked={animate} onCheckedChange={setAnimate} />
        <Switch label={text('显示差值', 'Show delta')} checked={showDelta} onCheckedChange={setShowDelta} />
        <div className="number-ticker-examples__controls">
          <Button onClick={() => setValue(current => current + 275)}>{text('增加 275', 'Add 275')}</Button>
          <Button onClick={() => setValue(current => current - 180)} variant="secondary">{text('减少 180', 'Subtract 180')}</Button>
          <Button onClick={() => { setValue(current => current + 900); setTimeout(() => setValue(current => current - 240), 90); }} variant="outline">{text('快速更新', 'Rapid update')}</Button>
        </div>
      </> },
    ]} />}>
      <div className="number-ticker-examples__hero">
        <NumberTicker
          value={value}
          locale={locale === 'en' ? 'en-US' : 'zh-CN'}
          formatOptions={formatOptions}
          animate={animate}
          duration={duration}
          showDelta={showDelta}
          prefix={prefix}
          suffix={suffix}
          getValueLabel={(_number, formatted) => text(`当前积分 ${formatted}`, `Current points ${formatted}`)}
        />
      </div>
    </ComponentPlayground>

    <ComponentExample title={text('积分与资源', 'Points and resources')} code={`<NumberTicker value={4820} prefix="${text('积分', 'Points')}" showDelta />
<NumberTicker value={73650} suffix="${text('晶石', 'crystals')}" locale="en-US" />`}>
      <div className="number-ticker-examples__specimens">
        <PencilSurface as="section" className="number-ticker-examples__metric" variant="quiet" radius={8}>
          <span>{text('账户积分', 'Account points')}</span>
          <NumberTicker value={4820} prefix={text('积分', 'Points')} showDelta getValueLabel={(_number, formatted) => text(`账户积分 ${formatted}`, `Account points ${formatted}`)} />
        </PencilSurface>
        <PencilSurface as="section" className="number-ticker-examples__metric" variant="quiet" radius={8}>
          <span>{text('可用资源', 'Available resources')}</span>
          <NumberTicker value={73650} suffix={text('晶石', 'crystals')} locale="en-US" formatOptions={{ maximumFractionDigits: 0 }} getValueLabel={(_number, formatted) => text(`可用资源 ${formatted} 晶石`, `${formatted} crystals available`)} />
        </PencilSurface>
      </div>
    </ComponentExample>

    <ComponentExample title={text('普通统计与边界值', 'Statistics and edge values')} code={`<NumberTicker value={-12.75} suffix="%" formatOptions={{ minimumFractionDigits: 2 }} />
<NumberTicker value={0.0038} formatOptions={{ style: 'percent', maximumFractionDigits: 2 }} />`}>
      <div className="number-ticker-examples__statistics">
        <div><span>{text('周环比', 'Weekly change')}</span><NumberTicker value={-12.75} suffix="%" formatOptions={{ minimumFractionDigits: 2, maximumFractionDigits: 2 }} getValueLabel={(_number, formatted) => text(`周环比 ${formatted}%`, `Weekly change ${formatted}%`)} /></div>
        <div><span>{text('转化率', 'Conversion rate')}</span><NumberTicker value={0.0038} formatOptions={{ style: 'percent', maximumFractionDigits: 2 }} getValueLabel={(_number, formatted) => text(`转化率 ${formatted}`, `Conversion rate ${formatted}`)} /></div>
        <div><span>{text('样本量', 'Sample size')}</span><NumberTicker value={1250000} formatOptions={{ notation: 'compact', maximumFractionDigits: 1 }} /></div>
      </div>
    </ComponentExample>

    <ComponentExample title={text('自定义展示', 'Custom display')} code={`<NumberTicker value={4.8} renderValue={(value, { animating }) => (
  <span className={animating ? 'is-changing' : undefined}>{value.toFixed(1)} / 5</span>
)} renderDelta={(delta, { direction }) => <span>{direction === 'increase' ? '↑' : '↓'} {Math.abs(delta).toFixed(1)}</span>} showDelta />`}>
      <div className="number-ticker-examples__custom">
        <span>{text('用户评分', 'User rating')}</span>
        <NumberTicker
          value={4.8}
          showDelta
          renderValue={(number, details) => <span data-changing={details.animating || undefined}>{number.toFixed(1)} / 5</span>}
          renderDelta={(change, details) => <span>{details.direction === 'increase' ? '↑' : '↓'} {Math.abs(change).toFixed(1)}</span>}
          getValueLabel={number => text(`用户评分 ${number.toFixed(1)} / 5`, `User rating ${number.toFixed(1)} out of 5`)}
        />
      </div>
    </ComponentExample>
  </div>;
}
