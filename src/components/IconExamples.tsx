import { PropertyTabs } from './PropertyTabs';
import { useState } from 'react';
import { Button, ColorSwatch, Input, Field, PencilIcon, Switch, Tooltip } from '@inkra/react';
import type { PencilIconBadge } from '@inkra/react';
import { __iconData as searchIcon } from 'lucide-react/dist/esm/icons/search.mjs';
import { __iconData as plusIcon } from 'lucide-react/dist/esm/icons/plus.mjs';
import { __iconData as checkIcon } from 'lucide-react/dist/esm/icons/check.mjs';
import { __iconData as xIcon } from 'lucide-react/dist/esm/icons/x.mjs';
import { __iconData as pencilIcon } from 'lucide-react/dist/esm/icons/pencil.mjs';
import { __iconData as downloadIcon } from 'lucide-react/dist/esm/icons/download.mjs';
import { __iconData as settingsIcon } from 'lucide-react/dist/esm/icons/settings.mjs';
import { __iconData as calendarIcon } from 'lucide-react/dist/esm/icons/calendar-days.mjs';
import { __iconData as mapPinIcon } from 'lucide-react/dist/esm/icons/map-pin.mjs';
import { __iconData as clockIcon } from 'lucide-react/dist/esm/icons/clock.mjs';
import { __iconData as bookmarkIcon } from 'lucide-react/dist/esm/icons/bookmark.mjs';
import { __iconData as bookmarkCheckIcon } from 'lucide-react/dist/esm/icons/bookmark-check.mjs';
import { __iconData as folderIcon } from 'lucide-react/dist/esm/icons/folder.mjs';
import { __iconData as userIcon } from 'lucide-react/dist/esm/icons/user.mjs';
import { PencilText, useLocale } from '../i18n';
import { ComponentExample } from './ComponentExample';
import { ComponentPlayground } from './ComponentPlayground';
import { DocsSelect } from './DocsSelect';
import { DocsSlider } from './DocsSlider';
import { iconPaths } from './DocsIcon';
import { docsIconCatalog } from './iconCatalog';
import { IconCatalogGrid } from './IconCatalogGrid';
import './IconExamples.css';

const icons = docsIconCatalog;
const commonIcons = ['search', 'plus', 'check', 'pencil', 'settings', 'download', 'bookmark', 'folder', 'user']
  .map(key => icons.find(icon => icon.key === key)!);

const colors = [
  { key: 'ink', label: '主要文字', value: 'var(--inkra-ink)' },
  { key: 'accent', label: '主题文字', value: 'var(--inkra-accent-strong)' },
  { key: 'success', label: '成功', value: 'var(--inkra-success-foreground, var(--inkra-success))' },
  { key: 'danger', label: '危险', value: 'var(--inkra-danger-foreground, var(--inkra-danger))' },
] as const;
const checkPaths = iconPaths(checkIcon);
const bookmarkPaths = iconPaths(bookmarkIcon);
const bookmarkCheckPaths = iconPaths(bookmarkCheckIcon);
const compositeIcons = [
  { key: 'folder-plus', label: '新建文件夹', paths: iconPaths(folderIcon), badgePaths: iconPaths(plusIcon) },
  { key: 'calendar-check', label: '日程已确认', paths: iconPaths(calendarIcon), badgePaths: checkPaths },
  { key: 'pin-plus', label: '添加地点', paths: iconPaths(mapPinIcon), badgePaths: iconPaths(plusIcon) },
  { key: 'user-plus', label: '添加成员', paths: iconPaths(userIcon), badgePaths: iconPaths(plusIcon) },
  { key: 'download-check', label: '下载完成', paths: iconPaths(downloadIcon), badgePaths: checkPaths },
  { key: 'bookmark-x', label: '移除收藏', paths: bookmarkPaths, badgePaths: iconPaths(xIcon) },
];

function CompositeIconExample() {
  const { t } = useLocale();
  const [selected, setSelected] = useState(compositeIcons[0].key);
  const item = compositeIcons.find(icon => icon.key === selected)!;
  const code = `import { PencilIcon } from '@inkra/react';

const paths = ${JSON.stringify(item.paths, null, 2)};
const badgePaths = ${JSON.stringify(item.badgePaths, null, 2)};

<PencilIcon paths={paths} sourceSize={24} size={48}
  badge={{ paths: badgePaths, sourceSize: 24, position: 'bottom-end', scale: 0.55 }}
  decorative={false} aria-label=${JSON.stringify(t(item.label))}
/>`;
  return <ComponentExample title="组合图标" code={code}>
    <div className="icon-examples__composites" role="group" aria-label={t('组合图标')}>
      {compositeIcons.map(icon => <Button key={icon.key} fullWidth variant={selected === icon.key ? 'outline' : 'ghost'} aria-pressed={selected === icon.key} onClick={() => setSelected(icon.key)} className="icon-examples__choice">
        <span className="icon-examples__choice-content"><PencilIcon paths={icon.paths} sourceSize={24} size={48} badge={{ paths: icon.badgePaths }} decorative /><PencilText>{icon.label}</PencilText></span>
      </Button>)}
    </div>
  </ComponentExample>;
}

function IconActionExample() {
  const { t } = useLocale();
  const [saved, setSaved] = useState(false);
  const label = t(saved ? '取消收藏' : '收藏');
  const code = `const bookmarkPaths = ${JSON.stringify(bookmarkPaths, null, 2)};
const savedPaths = ${JSON.stringify(bookmarkCheckPaths, null, 2)};
const [saved, setSaved] = useState(false);

<Tooltip.Provider>
  <Tooltip.Root>
    <Tooltip.Trigger asChild>
      <Button size="icon" variant="outline" aria-pressed={saved}
        aria-label={saved ? ${JSON.stringify(t('取消收藏'))} : ${JSON.stringify(t('收藏'))}}
        onClick={() => setSaved(current => !current)}>
        <PencilIcon paths={saved ? savedPaths : bookmarkPaths}
          sourceSize={24} size={28} decorative />
      </Button>
    </Tooltip.Trigger>
    <Tooltip.Portal>
      <Tooltip.Content>{saved ? ${JSON.stringify(t('取消收藏'))} : ${JSON.stringify(t('收藏'))}}</Tooltip.Content>
    </Tooltip.Portal>
  </Tooltip.Root>
</Tooltip.Provider>
<output aria-live="polite">{saved ? ${JSON.stringify(t('已收藏'))} : ${JSON.stringify(t('未收藏'))}}</output>`;
  return <ComponentExample title="图标按钮与提示" code={code}>
    <div className="icon-examples__action">
      <Tooltip.Provider><Tooltip.Root>
        <Tooltip.Trigger asChild><Button size="icon" variant="outline" aria-pressed={saved} aria-label={label} onClick={() => setSaved(current => !current)}><PencilIcon paths={saved ? bookmarkCheckPaths : bookmarkPaths} sourceSize={24} size={28} decorative /></Button></Tooltip.Trigger>
        <Tooltip.Portal><Tooltip.Content>{label}</Tooltip.Content></Tooltip.Portal>
      </Tooltip.Root></Tooltip.Provider>
      <output className="component-demo-status" aria-live="polite">{t(saved ? '已收藏' : '未收藏')}</output>
    </div>
  </ComponentExample>;
}

export function IconExamples() {
  const { t } = useLocale();
  const [selected, setSelected] = useState('search');
  const [size, setSize] = useState(40);
  const [sourceSize, setSourceSize] = useState('24');
  const [seed, setSeed] = useState('inkra-icon');
  const [active, setActive] = useState(false);
  const [customStroke, setCustomStroke] = useState(false);
  const [strokeWidth, setStrokeWidth] = useState(1.5);
  const [intensity, setIntensity] = useState(1);
  const [breaks, setBreaks] = useState(0.18);
  const [breakCount, setBreakCount] = useState(1);
  const [pressureVariation, setPressureVariation] = useState(0.82);
  const [decorative, setDecorative] = useState(true);
  const [composite, setComposite] = useState(false);
  const [badgeIcon, setBadgeIcon] = useState('plus');
  const [badgePosition, setBadgePosition] = useState<NonNullable<PencilIconBadge['position']>>('bottom-end');
  const [badgeScale, setBadgeScale] = useState(55);
  const [direction, setDirection] = useState('ltr');
  const [color, setColor] = useState<typeof colors[number]['key']>('ink');
  const item = icons.find(icon => icon.key === selected) ?? icons[0];
  const previewIcons = [item, ...commonIcons.filter(icon => icon.key !== item.key)].slice(0, 9);
  const colorValue = colors.find(option => option.key === color)!.value;
  const badgeItem = icons.find(icon => icon.key === badgeIcon)!;
  const badge = composite ? { paths: badgeItem.paths, sourceSize: 24, position: badgePosition, scale: badgeScale / 100 } : undefined;
  const iconLabel = (label: string) => composite ? `${t(label)} / ${t(badgeItem.label)}` : t(label);
  const code = `import { PencilIcon } from '@inkra/react';

const icons = ${JSON.stringify(previewIcons.map(icon => ({ key: icon.key, label: iconLabel(icon.label), paths: icon.paths })), null, 2)};
${composite ? `const badgePaths = ${JSON.stringify(badgeItem.paths, null, 2)};\n` : ''}
const color = ${JSON.stringify(colorValue)};

<div style={{ width: '100%', overflowX: 'auto' }}>
<div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
  gridTemplateRows: 'repeat(3, minmax(0, 1fr))', placeItems: 'center',
  width: ${Math.max(240, size * 3 + 24)}, minWidth: ${size * 3 + 24}, maxWidth: '100%', aspectRatio: '1', marginInline: 'auto' }}>
  {icons.map(icon => <PencilIcon key={icon.key} paths={icon.paths} sourceSize={${sourceSize}} size={${size}}
${customStroke ? `    strokeWidth={${strokeWidth}} intensity={${intensity}} breaks={${breaks}} breakCount={${breakCount}} pressureVariation={${pressureVariation}}\n` : ''}
${composite ? `    badge={{ paths: badgePaths, sourceSize: 24, position: '${badgePosition}', scale: ${badgeScale / 100} }}\n` : ''}
    dir="${direction}" style={{ color }} seed=${JSON.stringify(seed)} active={${active}}
    decorative={${decorative}}${decorative ? '' : ' aria-label={icon.label}'}
  />)}
</div>
</div>`;
  return <>
    <ComponentPlayground code={code} controls={<PropertyTabs groups={[
      { label: '基础', content: <>
        <DocsSelect label="图标" value={selected} onValueChange={setSelected} options={icons.map(icon => [icon.key, icon.label])} />
        <DocsSlider label="图标尺寸" value={size} onValueChange={setSize} min={16} max={128} step={1} unit="px" />
        <DocsSelect label="源坐标范围" value={sourceSize} onValueChange={setSourceSize} options={['24', '28', '32'].map(value => [value, value])} />
        <div className="icon-examples__colors"><PencilText>颜色</PencilText><div role="group" aria-label={t('图标颜色')}>{colors.map(option => <ColorSwatch key={option.key} color={option.value} label={t(option.label)} selected={color === option.key} onClick={() => setColor(option.key)} />)}</div></div>
        <Field label={t('笔迹种子')}><Input value={seed} onChange={event => setSeed(event.target.value)} maxLength={40} /></Field>
      </> },
      { label: '笔触', content: <>
        <Switch label={t('自定义图标笔触')} checked={customStroke} onCheckedChange={setCustomStroke} />
        <DocsSlider label="图标粗细" min={0.3} max={3} step={0.1} value={strokeWidth} onValueChange={setStrokeWidth} disabled={!customStroke} />
        <DocsSlider label="图标浓度" min={0} max={100} step={5} value={Math.round(intensity * 100)} onValueChange={value => setIntensity(value / 100)} unit="%" disabled={!customStroke} />
        <DocsSlider label="图标断裂程度" min={0} max={100} step={1} value={Math.round(breaks * 100)} onValueChange={value => setBreaks(value / 100)} unit="%" disabled={!customStroke} />
        <DocsSlider label="最大断裂个数" min={0} max={12} step={1} value={breakCount} onValueChange={setBreakCount} disabled={!customStroke} />
        <DocsSlider label="笔压变化" min={0} max={100} step={1} value={Math.round(pressureVariation * 100)} onValueChange={value => setPressureVariation(value / 100)} unit="%" disabled={!customStroke} />
      </> },
      { label: '组合', content: <>
        <Switch label={t('组合图标')} checked={composite} onCheckedChange={setComposite} />
        {composite && <>
        <DocsSelect label="角标图标" value={badgeIcon} onValueChange={setBadgeIcon} options={icons.map(icon => [icon.key, icon.label])} />
        <DocsSelect label="角标位置" value={badgePosition} onValueChange={value => setBadgePosition(value as typeof badgePosition)} options={[
          ['top-start', '顶部起始侧'], ['top-end', '顶部结束侧'], ['bottom-start', '底部起始侧'], ['bottom-end', '底部结束侧'],
        ]} />
        <DocsSlider label="角标比例" value={badgeScale} onValueChange={setBadgeScale} min={35} max={65} step={5} unit="%" />
        <DocsSelect label="阅读方向" value={direction} onValueChange={setDirection} options={[[ 'ltr', 'LTR' ], [ 'rtl', 'RTL' ]]} />
      </>}
      </> },
      { label: '状态', content: <>
        <Switch label={t('强调笔迹')} checked={active} onCheckedChange={setActive} />
        <Switch label={t('装饰性图标')} checked={decorative} onCheckedChange={setDecorative} />
      </> },
    ]} />}>
      <div className="icon-examples__viewport">
        <div className="icon-examples__stage" style={{ width: Math.max(240, size * 3 + 24), minWidth: size * 3 + 24 }}>{previewIcons.map(icon => <PencilIcon key={icon.key} paths={icon.paths} badge={badge} dir={direction} size={size} sourceSize={Number(sourceSize)} strokeWidth={customStroke ? strokeWidth : undefined} intensity={customStroke ? intensity : undefined} breaks={customStroke ? breaks : undefined} breakCount={customStroke ? breakCount : undefined} pressureVariation={customStroke ? pressureVariation : undefined} seed={seed} active={active} decorative={decorative} aria-label={decorative ? undefined : iconLabel(icon.label)} style={{ color: colorValue }} />)}</div>
      </div>
    </ComponentPlayground>
    <ComponentExample title="图标目录" code={`const paths = ${JSON.stringify(item.paths, null, 2)};\n<PencilIcon paths={paths} sourceSize={24} size={32} decorative />`}>
      <IconCatalogGrid selected={selected} onSelect={setSelected} />
    </ComponentExample>
    <ComponentExample title="尺寸" code={`const paths = ${JSON.stringify(item.paths, null, 2)};\n\n${['16', '20', '24', '32', '40'].map(value => `<PencilIcon paths={paths} sourceSize={24} size={${value}} decorative />`).join('\n')}`}>
      <div className="icon-examples__sizes">{[16, 20, 24, 32, 40].map(value => <div key={value}><span className="icon-examples__size-box"><PencilIcon paths={item.paths} sourceSize={24} size={value} decorative /></span><PencilText>{`${value}px`}</PencilText></div>)}</div>
    </ComponentExample>
    <ComponentExample title="装饰与语义" code={`const checkPaths = ${JSON.stringify(checkPaths, null, 2)};

<span>
  <PencilIcon paths={checkPaths} sourceSize={24} size={28} decorative />
  <PencilText>${t('已保存')}</PencilText>
</span>
<PencilIcon paths={checkPaths} sourceSize={24} size={28}
  decorative={false} aria-label=${JSON.stringify(t('已保存'))} />`}>
      <div className="icon-examples__semantics">
        <div><PencilText as="h3">装饰性图标</PencilText><span className="icon-examples__semantic-sample"><PencilIcon paths={checkPaths} sourceSize={24} size={28} decorative /><PencilText>已保存</PencilText></span></div>
        <div><PencilText as="h3">语义图标</PencilText><span className="icon-examples__semantic-sample"><PencilIcon paths={checkPaths} sourceSize={24} size={28} decorative={false} aria-label={t('已保存')} /></span></div>
      </div>
    </ComponentExample>
    <IconActionExample />
    <CompositeIconExample />
  </>;
}
