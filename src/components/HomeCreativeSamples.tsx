import { useState, type CSSProperties } from 'react';
import { Button, Card, Checkbox, ColorPicker, Flip, FlipToggle, NumberTicker, PencilSurface, type ColorValue } from '@inkra/react';
import { __iconData as arrowIcon } from 'lucide-react/dist/esm/icons/arrow-right.mjs';
import { __iconData as resetIcon } from 'lucide-react/dist/esm/icons/rotate-ccw.mjs';
import { __iconData as mountainIcon } from 'lucide-react/dist/esm/icons/mountain.mjs';
import { __iconData as paletteIcon } from 'lucide-react/dist/esm/icons/palette.mjs';
import { PencilText, useLocale } from '../i18n';
import { DocsIcon } from './DocsIcon';
import './HomeCreativeSamples.css';

function useHomeCreativeText() {
  const { locale } = useLocale();
  return (zh: string, en: string) => locale === 'en' ? en : zh;
}

const numberSamples = [10, 1000, 12.34, 123.4] as const;

export function HomeNumberSample() {
  const text = useHomeCreativeText();
  const [index, setIndex] = useState(0);
  return <div className="home-new-number">
    <PencilText as="h2" className="home-new-heading">{text('让数字动起来', 'A little movement in the numbers')}</PencilText>
    <div className="home-new-number__value">
      <NumberTicker value={numberSamples[index]} animation="morph" duration={420}
        formatOptions={{ maximumFractionDigits: 2, useGrouping: false }}
        getValueLabel={(_value, formatted) => text(`当前数值：${formatted}`, `Current value: ${formatted}`)} />
    </div>
    <PencilText as="p" className="home-new-muted">{text('整数长出新位数，小数点也跟着走。', 'Watch new digits arrive and the decimal point move.')}</PencilText>
    <div className="home-new-actions">
      <Button variant="outline" endIcon={<DocsIcon data={arrowIcon} />}
        onClick={() => setIndex(current => (current + 1) % numberSamples.length)}>{text('换个数字', 'Change the number')}</Button>
      <Button variant="ghost" aria-label={text('重置数字', 'Reset the number')} disabled={index === 0}
        startIcon={<DocsIcon data={resetIcon} />} onClick={() => setIndex(0)}>{text('重置', 'Reset')}</Button>
    </div>
  </div>;
}

export function HomePaletteSample() {
  const text = useHomeCreativeText();
  const [color, setColor] = useState<ColorValue>('#629568ff');
  const presets = [
    { value: '#629568ff', label: text('松绿', 'Pine green') },
    { value: '#4b96aaff', label: text('湖蓝', 'Lake blue') },
    { value: '#b48b4dff', label: text('赭黄', 'Ochre') },
    { value: '#ab7774ff', label: text('藕红', 'Dusty rose') },
  ];
  const previewStyle = { '--inkra-accent': color } as CSSProperties;
  return <div className="home-new-palette">
    <PencilText as="h2" className="home-new-heading">{text('调一抹自己的颜色', 'Mix a color of your own')}</PencilText>
    <PencilSurface variant="wash" seed="home-color-wash" className="home-new-palette__preview" style={previewStyle}>
      <DocsIcon data={paletteIcon} size={36} />
      <PencilText>{text('给灵感换个颜色。', 'A fresh color for a good idea.')}</PencilText>
    </PencilSurface>
    <ColorPicker presentation="compact" label={text('选一抹颜色', 'Pick a color')} value={color}
      onValueChange={setColor} showAlpha={false} presets={presets}
      labels={{ palette: text('打开选色面板', 'Open the color panel'), value: text('颜色值', 'Color value'),
        presets: text('颜色预设', 'Color presets'), invalid: text('请输入有效的十六进制颜色。', 'Enter a valid hexadecimal color.') }} />
  </div>;
}

export function HomeFlipSample() {
  const text = useHomeCreativeText();
  const [saved, setSaved] = useState(false);
  return <Flip className="home-new-postcard" role="region" aria-label={text('可翻面的旅行明信片', 'Flippable travel postcard')}
    front={<Card.Root className="home-specimen home-new-postcard__paper" divided={false}>
      <Card.Content className="home-new-postcard__content">
        <PencilText className="home-new-muted">{text('寄给下一次出发', 'For the next adventure')}</PencilText>
        <div className="home-new-postcard__landscape"><DocsIcon data={mountainIcon} size={74} /></div>
        <PencilText as="h2" className="home-new-heading">{text('下一站，山野', 'Next stop, the mountains')}</PencilText>
        <PencilText as="p">{text('把想去的地方，先留在一张纸上。', 'Keep a place you want to go on a little piece of paper.')}</PencilText>
        <FlipToggle variant="outline" endIcon={<DocsIcon data={arrowIcon} />}>{text('翻过来看看', 'Turn it over')}</FlipToggle>
      </Card.Content>
    </Card.Root>}
    back={<Card.Root className="home-specimen home-new-postcard__paper" divided={false}>
      <Card.Content className="home-new-postcard__content">
        <PencilText className="home-new-muted">{text('明信片的背面', 'On the other side')}</PencilText>
        <PencilText as="h2" className="home-new-heading">{text('把好奇带上', 'Bring your curiosity')}</PencilText>
        <PencilText as="p">{text('留一点时间给路上的风景，也留一点空白给新的发现。', 'Leave time for the scenery, and a little room for new discoveries.')}</PencilText>
        <Checkbox label={text('记下这个想法', 'Keep this idea')} checked={saved} onCheckedChange={setSaved} />
        <FlipToggle variant="outline">{text('回到正面', 'Back to the front')}</FlipToggle>
      </Card.Content>
    </Card.Root>} />;
}
