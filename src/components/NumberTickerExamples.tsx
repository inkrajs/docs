import { useState } from 'react';
import { Button, Field, Input, InputNumber, NumberTicker, PencilIcon, PencilSurface, PencilText, Switch, createNumberFormatter, formatTickerValue, numberTickerUnits, type NumberTickerCompactOptions, type NumberTickerFormatOptions } from '@inkra/react';
import { __iconData as coinsIcon } from 'lucide-react/dist/esm/icons/coins.mjs';
import { __iconData as gemIcon } from 'lucide-react/dist/esm/icons/gem.mjs';

import { useLocale } from '../i18n';
import { ComponentExample } from './ComponentExample';
import { ComponentPlayground } from './ComponentPlayground';
import { DocsSelect } from './DocsSelect';
import { iconPaths } from './DocsIcon';
import { PropertyTabs } from './PropertyTabs';
import { NumberTickerRollExamples } from './NumberTickerRollExamples';
import { numberTickerRollCopy } from './numberTickerRollCopy';
import './NumberTickerExamples.css';

const quote = (value: string) => JSON.stringify(value);
const coinPaths = iconPaths(coinsIcon);
const gemPaths = iconPaths(gemIcon);
const binaryUnits = [{ factor: 1024, label: 'KiB' }, { factor: 1048576, label: 'MiB' }, { factor: 1073741824, label: 'GiB' }];
type AffixMode = 'none' | 'text' | 'icon' | 'both';

function ExactNumberExamples() {
  const { locale } = useLocale();
  const zh = locale === 'zh-CN';
  const text = (chinese: string, english: string) => zh ? chinese : english;
  const [integer, setInteger] = useState(9007199254740993n);
  const [draft, setDraft] = useState('12345678901234567890.123456');
  const [decimal, setDecimal] = useState(draft);
  const [invalid, setInvalid] = useState(false);
  const [scientific, setScientific] = useState(false);
  return <ComponentExample id="number-ticker-big-int-and-decimal-strings" title={text('大整数与数字字符串', 'BigInt and decimal strings')} code={`<NumberTicker value={9007199254740993n} showDelta />
<NumberTicker value="12345678901234567890.123456" formatOptions={{ maximumFractionDigits: 6 }} />
<NumberTicker value="1.23456789e1000" formatOptions={{ notation: 'scientific' }} />
<NumberTicker value="1.234e1001" compact="en" compactOptions={{ units: [{ factor: '1e1000', threshold: '1e1001', label: 'U' }] }} />`}>
    <div className="number-ticker-examples__statistics" data-testid="exact-number-examples">
      <Field label="BigInt"><NumberTicker data-testid="exact-integer" value={integer} showDelta locale={locale} formatOptions={{ useGrouping: false }} /></Field>
      <div className="number-ticker-examples__controls">
        <Button aria-label={text('大整数加一', 'Increment BigInt')} onClick={() => setInteger(value => value + 1n)}>+1</Button>
        <Button aria-label={text('大整数减一', 'Decrement BigInt')} variant="secondary" onClick={() => setInteger(value => value - 1n)}>-1</Button>
      </div>
      <Field label={text('数字字符串', 'Decimal string')} error={invalid ? text('请输入有效的十进制数字或科学计数法。', 'Enter a valid decimal or scientific value.') : undefined}>
        <Input value={draft} onChange={event => {
          const next = event.target.value;
          setDraft(next);
          try {
            formatTickerValue(createNumberFormatter(locale), next);
            setDecimal(next);
            setInvalid(false);
          } catch { setInvalid(true); }
        }} />
      </Field>
      <Switch label={text('科学计数法', 'Scientific notation')} checked={scientific} onCheckedChange={setScientific} />
      <div className="number-ticker-examples__exact-value"><NumberTicker data-testid="exact-decimal" value={decimal} locale={locale} formatOptions={{ maximumFractionDigits: 6, useGrouping: false, notation: scientific ? 'scientific' : 'standard' }} /></div>
      <NumberTicker data-testid="exact-exponent" value="1.23456789e1000" locale={locale} formatOptions={{ notation: 'scientific', maximumFractionDigits: 4 }} />
    </div>
  </ComponentExample>;
}

export function NumberTickerExamples() {
  const { locale } = useLocale();
  const zh = locale === 'zh-CN';
  const text = (chinese: string, english: string) => zh ? chinese : english;
  const [value, setValue] = useState(12840);
  const [format, setFormat] = useState<'standard' | 'compact' | 'compact-en' | 'compact-zh' | 'binary' | 'scientific' | 'engineering' | 'currency' | 'decimal'>('standard');
  const [precision, setPrecision] = useState(1);
  const [roundingMode, setRoundingMode] = useState<NonNullable<NumberTickerFormatOptions['roundingMode']>>('halfExpand');
  const [padDecimals, setPadDecimals] = useState(false);
  const [grouping, setGrouping] = useState(true);
  const [minUnit, setMinUnit] = useState('');
  const [maxUnit, setMaxUnit] = useState('');
  const [separator, setSeparator] = useState(' ');
  const [promotionThreshold, setPromotionThreshold] = useState(1);
  const [promoteAfterRounding, setPromoteAfterRounding] = useState(true);
  const [overflow, setOverflow] = useState<'auto' | 'unit' | 'scientific'>('auto');
  const [prefixMode, setPrefixMode] = useState<AffixMode>('text');
  const [suffixMode, setSuffixMode] = useState<AffixMode>('text');
  const [showDelta, setShowDelta] = useState(true);
  const [animate, setAnimate] = useState(true);
  const [duration, setDuration] = useState(420);
  const [animation, setAnimation] = useState<'count' | 'roll'>('count');
  const [rollDirection, setRollDirection] = useState<'auto' | 'up' | 'down'>('auto');
  const rollLabels = numberTickerRollCopy(locale);
  const compact = format === 'compact' ? true : format === 'compact-en' || format === 'binary' ? 'en' : format === 'compact-zh' ? 'zh' : false;
  const units = format === 'binary' ? binaryUnits : numberTickerUnits[compact === 'zh' || (compact === true && zh) ? 'zh' : 'en'];
  const minimum = units.find(unit => unit.label === minUnit);
  const maximum = units.find(unit => unit.label === maxUnit);
  const compactOptions: NumberTickerCompactOptions | undefined = compact ? {
    ...(format === 'binary' ? { units: binaryUnits } : {}),
    ...(minimum ? { minUnit: minimum.label } : {}), ...(maximum ? { maxUnit: maximum.label } : {}),
    separator, promotionThreshold, promoteAfterRounding,
    ...(overflow !== 'auto' ? { overflow } : {}),
  } : undefined;
  const formatOptions: NumberTickerFormatOptions = {
    maximumFractionDigits: format === 'decimal' ? 2 : precision,
    minimumFractionDigits: format === 'decimal' ? 2 : padDecimals ? precision : 0,
    roundingMode, useGrouping: grouping,
    ...(format === 'currency' ? { style: 'currency', currency: 'USD' } : {}),
    ...(format === 'scientific' || format === 'engineering' ? { notation: format } : {}),
  };
  const affixOptions = [['none', text('无', 'None')], ['text', text('文字', 'Text')], ['icon', text('图标', 'Icon')], ['both', text('图标与文字', 'Icon and text')]] as const;
  const affix = (mode: AffixMode, label: string, paths: typeof coinPaths) => mode === 'none' ? undefined : mode === 'text' ? label
    : <><PencilIcon paths={paths} size={28} sourceSize={24} decorative />{mode === 'both' && <PencilText>{label}</PencilText>}</>;
  const affixCode = (mode: AffixMode, label: string, name: string) => mode === 'text' ? quote(label)
    : `{<>${`<PencilIcon paths={${name}} size={28} sourceSize={24} decorative />`}${mode === 'both' ? `<PencilText>{${quote(label)}}</PencilText>` : ''}</>}`;
  const prefix = affix(prefixMode, text('积分', 'Points'), coinPaths);
  const suffix = affix(suffixMode, text('总计', 'total'), gemPaths);
  const code = `${[prefixMode, suffixMode].some(mode => mode === 'icon' || mode === 'both') ? `const coinPaths = ${JSON.stringify(coinPaths)};\nconst gemPaths = ${JSON.stringify(gemPaths)};\n` : ''}const [value, setValue] = useState(${value});

<NumberTicker
  value={value}
  locale=${quote(locale)}
  compact={${JSON.stringify(compact)}}
  ${compactOptions ? `compactOptions={${JSON.stringify(compactOptions)}}\n  ` : ''}formatOptions={${JSON.stringify(formatOptions)}}
  animate={${animate}}
  animation="${animation}"
  rollDirection="${rollDirection}"
  duration={${duration}}
  showDelta={${showDelta}}${prefixMode !== 'none' ? `
  prefix=${affixCode(prefixMode, text('积分', 'Points'), 'coinPaths')}` : ''}${suffixMode !== 'none' ? `
  suffix=${affixCode(suffixMode, text('总计', 'total'), 'gemPaths')}` : ''}
  getValueLabel={(_value, formatted) => ${quote(text('当前积分 ', 'Current points '))} + formatted}
/>
<Button onClick={() => setValue(current => current + 275)}>${text('增加', 'Increase')}</Button>
<Button onClick={() => setValue(current => current - 180)} variant="secondary">${text('减少', 'Decrease')}</Button>`;

  return <div className="number-ticker-examples">
    <ComponentPlayground code={code} controls={<PropertyTabs groups={[
      { label: '基础', content: <>
        <DocsSelect label={text('格式', 'Format')} value={format} onValueChange={next => { setFormat(next as typeof format); setMinUnit(''); setMaxUnit(''); }} options={[
          ['standard', text('千分位', 'Grouped')],
          ['compact', text('自动单位（跟随语言）', 'Compact (locale)')],
          ['compact-en', 'K / M / B / T'],
          ['compact-zh', '千 / 万 / 亿 / 兆'],
          ['binary', text('自定义二进制单位', 'Custom binary units')],
          ['scientific', text('科学计数法', 'Scientific notation')],
          ['engineering', text('工程计数法', 'Engineering notation')],
          ['currency', text('货币', 'Currency')],
          ['decimal', text('两位小数', 'Two decimals')],
        ]} />
        <Field label={text('数值', 'Value')}>
          <InputNumber value={value} onValueChange={next => setValue(next ?? 0)} controls={false} step="any" />
        </Field>
        <DocsSelect label={text('数值样本', 'Value preset')} value={String(value)} onValueChange={next => setValue(Number(next))} options={[
          [String(value), text('当前值', 'Current value')], ...[12840, 1e16, 1e24, 1e68, 1e100, 1.284e-6].filter(amount => amount !== value).map(amount => [String(amount), String(amount)] as const),
        ]} />
        <DocsSelect label={text('最多小数位', 'Maximum decimals')} value={String(precision)} disabled={format === 'decimal'} onValueChange={next => setPrecision(Number(next))} options={['0', '1', '2', '3', '4', '6'].map(n => [n, n])} />
        <DocsSelect label={text('舍入方式', 'Rounding')} value={roundingMode} onValueChange={next => setRoundingMode(next as typeof roundingMode)} options={[
          ['halfExpand', text('四舍五入', 'Nearest, ties away from zero')], ['trunc', text('直接截断', 'Truncate')], ['ceil', text('向上取整', 'Ceiling')], ['floor', text('向下取整', 'Floor')],
        ]} />
        <Switch label={text('小数补零', 'Pad decimals')} checked={padDecimals} onCheckedChange={setPadDecimals} disabled={format === 'decimal'} />
        <Switch label={text('数字分组', 'Digit grouping')} checked={grouping} onCheckedChange={setGrouping} />
      </> },
      { label: '内容', content: <>
        <DocsSelect label={text('前缀', 'Prefix')} value={prefixMode} onValueChange={next => setPrefixMode(next as AffixMode)} options={affixOptions} />
        <DocsSelect label={text('后缀', 'Suffix')} value={suffixMode} onValueChange={next => setSuffixMode(next as AffixMode)} options={affixOptions} />
        {compact && <>
          <DocsSelect label={text('最小单位', 'Minimum unit')} value={minimum?.label ?? 'auto'} onValueChange={next => setMinUnit(next === 'auto' ? '' : next)} options={[
            ['auto', text('不限制', 'Unrestricted')], ...units.filter(unit => !maximum || unit.factor <= maximum.factor).map(unit => [unit.label, unit.label] as const),
          ]} />
          <DocsSelect label={text('最大单位', 'Maximum unit')} value={maximum?.label ?? 'auto'} onValueChange={next => setMaxUnit(next === 'auto' ? '' : next)} options={[
            ['auto', text('不限制', 'Unrestricted')], ...units.filter(unit => !minimum || unit.factor >= minimum.factor).map(unit => [unit.label, unit.label] as const),
          ]} />
          <DocsSelect label={text('单位间距', 'Unit spacing')} value={separator ? 'space' : 'none'} onValueChange={next => setSeparator(next === 'space' ? ' ' : '')} options={[
            ['space', text('空格', 'Space')], ['none', text('无间距', 'No space')],
          ]} />
          <DocsSelect label={text('切换阈值倍率', 'Promotion threshold multiplier')} value={String(promotionThreshold)} onValueChange={next => setPromotionThreshold(Number(next))} options={[
            ['0.1', '0.1'], ['1', '1'], ['10', '10'], ['100', '100'],
          ]} />
          <Switch label={text('舍入后判断进位', 'Promote after rounding')} checked={promoteAfterRounding} onCheckedChange={setPromoteAfterRounding} />
          <DocsSelect label={text('超出单位范围', 'Unit overflow')} value={overflow} onValueChange={next => setOverflow(next as typeof overflow)} options={[
            ['auto', text('自动', 'Automatic')], ['unit', text('保留最大单位', 'Keep largest unit')], ['scientific', text('科学计数法', 'Scientific notation')],
          ]} />
        </>}
      </> },
      { label: '交互', content: <>
        <DocsSelect label={rollLabels.animation} value={animation} onValueChange={next => setAnimation(next as typeof animation)} options={[
          ['count', rollLabels.count], ['roll', rollLabels.roll],
        ]} />
        <DocsSelect label={rollLabels.direction} value={rollDirection} disabled={animation !== 'roll'} onValueChange={next => setRollDirection(next as typeof rollDirection)} options={[
          ['auto', rollLabels.auto], ['up', rollLabels.up], ['down', rollLabels.down],
        ]} />
        <DocsSelect label={text('动画时长', 'Duration')} value={String(duration)} onValueChange={next => setDuration(Number(next))} options={[
          ['180', '180 ms'], ['420', '420 ms'], ['800', '800 ms'],
        ]} />
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
          locale={locale}
          compact={compact}
          compactOptions={compactOptions}
          formatOptions={formatOptions}
          animate={animate}
          animation={animation}
          rollDirection={rollDirection}
          duration={duration}
          showDelta={showDelta}
          prefix={prefix}
          suffix={suffix}
          getValueLabel={(_number, formatted) => text(`当前积分 ${formatted}`, `Current points ${formatted}`)}
        />
      </div>
    </ComponentPlayground>

    <NumberTickerRollExamples />
    <ExactNumberExamples />

    <ComponentExample id="number-ticker-automatic-compact-units" title={text('自动单位换算', 'Automatic compact units')} code={`<NumberTicker value={12840} compact="en" />
<NumberTicker value={12840} compact="zh" />
<NumberTicker value={1250000000} compact="en" />
<NumberTicker value={1250000000} compact="zh" />
<NumberTicker value={1250000000000} compact locale="zh-CN" formatOptions={{ maximumFractionDigits: 2 }} />`}>
      <div className="number-ticker-examples__unit-grid">
        {[1000, 12840, 1250000, 1e16, 1e24, 1e68].map(amount => <div className="number-ticker-examples__unit-row" key={amount}>
          <PencilText>{amount >= 1e16 ? String(amount.toExponential()) : new Intl.NumberFormat(locale).format(amount)}</PencilText>
          <NumberTicker value={amount} locale={locale} compact="en" />
          <NumberTicker value={amount} locale={locale} compact="zh" />
        </div>)}
      </div>
    </ComponentExample>

    <ComponentExample id="number-ticker-fixed-units-and-custom-thresholds" title={text('固定单位与独立阈值', 'Fixed units and custom thresholds')} code={`<NumberTicker value={1e8} compact="zh" compactOptions={{ maxUnit: '万' }} />
<NumberTicker value={12840} compact="zh" compactOptions={{ minUnit: '万', maxUnit: '万' }} formatOptions={{ roundingMode: 'trunc', minimumFractionDigits: 2, maximumFractionDigits: 2 }} />
<NumberTicker value={100000} compact="zh" compactOptions={{ units: [{ factor: 10000, label: '万', threshold: 100000 }] }} />`}>
      <div className="number-ticker-examples__statistics">
        <div><PencilText>{text('最大单位：万', 'Maximum unit: 万')}</PencilText><NumberTicker value={1e8} compact="zh" compactOptions={{ maxUnit: '万' }} /></div>
        <div><PencilText>{text('固定万，截断两位', 'Fixed 万, truncate to 2 decimals')}</PencilText><NumberTicker value={12840} compact="zh" compactOptions={{ minUnit: '万', maxUnit: '万' }} formatOptions={{ roundingMode: 'trunc', minimumFractionDigits: 2, maximumFractionDigits: 2 }} /></div>
        <div><PencilText>{text('达到十万再换算', 'Convert at 100,000')}</PencilText><NumberTicker value={100000} compact="zh" compactOptions={{ units: [{ factor: 10000, label: '万', threshold: 100000 }] }} /></div>
      </div>
    </ComponentExample>

    <ComponentExample id="number-ticker-scientific-and-engineering-notation" title={text('科学与工程计数法', 'Scientific and engineering notation')} code={`<NumberTicker value={12840} formatOptions={{ notation: 'scientific', maximumFractionDigits: 2 }} />
<NumberTicker value={12840} formatOptions={{ notation: 'engineering', maximumFractionDigits: 2 }} />
<NumberTicker value={0.000001284} formatOptions={{ notation: 'scientific', maximumFractionDigits: 2 }} />`}>
      <div className="number-ticker-examples__statistics">
        <NumberTicker value={12840} formatOptions={{ notation: 'scientific', maximumFractionDigits: 2 }} />
        <NumberTicker value={12840} formatOptions={{ notation: 'engineering', maximumFractionDigits: 2 }} />
        <NumberTicker value={0.000001284} formatOptions={{ notation: 'scientific', maximumFractionDigits: 2 }} />
      </div>
    </ComponentExample>

    <ComponentExample id="number-ticker-icon-prefixes-and-suffixes" title={text('图标前后缀', 'Icon prefixes and suffixes')} code={`const coinPaths = ${JSON.stringify(coinPaths)};
const gemPaths = ${JSON.stringify(gemPaths)};
<NumberTicker value={12840} compact="en" prefix={<PencilIcon paths={coinPaths} size={28} sourceSize={24} decorative />} suffix={<PencilIcon paths={gemPaths} size={28} sourceSize={24} decorative />} getValueLabel={(_value, formatted) => ${quote(text('积分 ', 'Points '))} + formatted} />`}>
      <NumberTicker value={12840} compact="en" prefix={<PencilIcon paths={coinPaths} size={28} sourceSize={24} decorative />} suffix={<PencilIcon paths={gemPaths} size={28} sourceSize={24} decorative />} getValueLabel={(_value, formatted) => text(`积分 ${formatted}`, `Points ${formatted}`)} />
    </ComponentExample>

    <ComponentExample id="number-ticker-points-and-resources" title={text('积分与资源', 'Points and resources')} code={`<NumberTicker value={4820} prefix="${text('积分', 'Points')}" showDelta />
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

    <ComponentExample id="number-ticker-statistics-and-edge-values" title={text('普通统计与边界值', 'Statistics and edge values')} code={`<NumberTicker value={-12.75} suffix="%" formatOptions={{ minimumFractionDigits: 2 }} />
<NumberTicker value={0.0038} formatOptions={{ style: 'percent', maximumFractionDigits: 2 }} />`}>
      <div className="number-ticker-examples__statistics">
        <div><span>{text('周环比', 'Weekly change')}</span><NumberTicker value={-12.75} suffix="%" formatOptions={{ minimumFractionDigits: 2, maximumFractionDigits: 2 }} getValueLabel={(_number, formatted) => text(`周环比 ${formatted}%`, `Weekly change ${formatted}%`)} /></div>
        <div><span>{text('转化率', 'Conversion rate')}</span><NumberTicker value={0.0038} formatOptions={{ style: 'percent', maximumFractionDigits: 2 }} getValueLabel={(_number, formatted) => text(`转化率 ${formatted}`, `Conversion rate ${formatted}`)} /></div>
        <div><span>{text('样本量', 'Sample size')}</span><NumberTicker value={1250000} compact locale={locale} formatOptions={{ maximumFractionDigits: 1 }} /></div>
      </div>
    </ComponentExample>

    <ComponentExample id="number-ticker-custom-display" title={text('自定义展示', 'Custom display')} code={`<NumberTicker value={4.8} formatOptions={{ minimumFractionDigits: 1, maximumFractionDigits: 1 }} renderValue={(_value, { animating, formattedValue }) => (
  <span className={animating ? 'is-changing' : undefined}>{formattedValue} / 5</span>
)} renderDelta={(_delta, { direction, formattedDelta }) => <span>{direction === 'increase' ? '↑' : '↓'} {formattedDelta}</span>} showDelta />`}>
      <div className="number-ticker-examples__custom">
        <span>{text('用户评分', 'User rating')}</span>
        <NumberTicker
          value={4.8}
          showDelta
          formatOptions={{ minimumFractionDigits: 1, maximumFractionDigits: 1 }}
          renderValue={(_number, details) => <span data-changing={details.animating || undefined}>{details.formattedValue} / 5</span>}
          renderDelta={(_change, details) => <span>{details.direction === 'increase' ? '↑' : '↓'} {details.formattedDelta}</span>}
          getValueLabel={(_number, formatted) => text(`用户评分 ${formatted} / 5`, `User rating ${formatted} out of 5`)}
        />
      </div>
    </ComponentExample>
  </div>;
}
