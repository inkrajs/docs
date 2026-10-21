import { PropertyTabs } from './PropertyTabs';
import { useState } from 'react';
import { Button, Input, Field, PencilIcon, Switch, Tabs, Tooltip } from '@inkra/react';
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
import { DocsIcon, iconPaths } from './DocsIcon';
import { docsIconCatalog, iconCategories } from './iconCatalog';
import './IconExamples.css';

const icons = docsIconCatalog;

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
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [size, setSize] = useState('40');
  const [sourceSize, setSourceSize] = useState('24');
  const [seed, setSeed] = useState('inkra-icon');
  const [active, setActive] = useState(false);
  const [decorative, setDecorative] = useState(true);
  const [composite, setComposite] = useState(false);
  const [badgeIcon, setBadgeIcon] = useState('plus');
  const [badgePosition, setBadgePosition] = useState<NonNullable<PencilIconBadge['position']>>('bottom-end');
  const [badgeScale, setBadgeScale] = useState(55);
  const [direction, setDirection] = useState('ltr');
  const [color, setColor] = useState<typeof colors[number]['key']>('ink');
  const item = icons.find(icon => icon.key === selected) ?? icons[0];
  const colorValue = colors.find(option => option.key === color)!.value;
  const badgeItem = icons.find(icon => icon.key === badgeIcon)!;
  const keyword = query.trim().toLocaleLowerCase();
  const visibleIcons = icons.filter(icon => (category === 'all' || icon.category === category)
    && `${icon.key} ${icon.label} ${t(icon.label)}`.toLocaleLowerCase().includes(keyword));
  const badge = composite ? { paths: badgeItem.paths, sourceSize: 24, position: badgePosition, scale: badgeScale / 100 } : undefined;
  const iconLabel = composite ? `${t(item.label)} / ${t(badgeItem.label)}` : t(item.label);
  const code = `import { PencilIcon } from '@inkra/react';

const paths = ${JSON.stringify(item.paths, null, 2)};
${composite ? `const badgePaths = ${JSON.stringify(badgeItem.paths, null, 2)};\n` : ''}
const color = ${JSON.stringify(colorValue)};

<PencilIcon paths={paths} sourceSize={${sourceSize}} size={${size}}
${composite ? `  badge={{ paths: badgePaths, sourceSize: 24, position: '${badgePosition}', scale: ${badgeScale / 100} }} dir="${direction}"\n` : ''}
  style={{ color }} seed=${JSON.stringify(seed)} active={${active}}
  decorative={${decorative}}${decorative ? '' : ` aria-label=${JSON.stringify(iconLabel)}`}
/>`;
  return <>
    <ComponentPlayground code={code} controls={<PropertyTabs groups={[
      { label: '基础', content: <>
        <DocsSelect label="图标" value={selected} onValueChange={setSelected} options={icons.map(icon => [icon.key, icon.label])} />
        <DocsSelect label="图标尺寸" value={size} onValueChange={setSize} options={['16', '20', '24', '28', '32', '40', '48'].map(value => [value, `${value}px`])} />
        <DocsSelect label="源坐标范围" value={sourceSize} onValueChange={setSourceSize} options={['24', '28', '32'].map(value => [value, value])} />
        <div className="icon-examples__colors"><PencilText>颜色</PencilText><div role="group" aria-label={t('图标颜色')}>{colors.map(option => <Button key={option.key} type="button" size="icon" variant={color === option.key ? 'outline' : 'ghost'} aria-label={t(option.label)} aria-pressed={color === option.key} onClick={() => setColor(option.key)}><span aria-hidden="true" className="icon-examples__swatch" style={{ backgroundColor: option.value }} /></Button>)}</div></div>
        <Field label={t('笔迹种子')}><Input value={seed} onChange={event => setSeed(event.target.value)} maxLength={40} /></Field>
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
      <div className="icon-examples__stage"><PencilIcon paths={item.paths} badge={badge} dir={direction} size={Number(size)} sourceSize={Number(sourceSize)} seed={seed} active={active} decorative={decorative} aria-label={decorative ? undefined : iconLabel} style={{ color: colorValue }} /></div>
    </ComponentPlayground>
    <ComponentExample title="图标目录" code={`const paths = ${JSON.stringify(item.paths, null, 2)};\n<PencilIcon paths={paths} sourceSize={24} size={32} decorative />`}>
      <div className="icon-examples__catalog">
        <Input type="search" aria-label={t('搜索图标')} placeholder={t('搜索图标')} value={query} onValueChange={setQuery} clearable clearButtonLabel={t('清空搜索')} startIcon={<PencilIcon paths={icons[0].paths} sourceSize={24} size={22} />} />
        <Tabs.Root value={category} onValueChange={setCategory} size="sm">
          <Tabs.List aria-label={t('图标分类')}>{iconCategories.map(([key, label, icon]) => <Tabs.Trigger key={key} value={key} startIcon={<DocsIcon data={icon} size={24} />}>{t(label)}</Tabs.Trigger>)}</Tabs.List>
          <Tabs.Content value={category}>
            <div key={`${category}:${query}`} className="icon-examples__grid" role="group" tabIndex={0} aria-label={t('图标目录')}>
              {visibleIcons.map(icon => <Button key={icon.key} fullWidth variant={selected === icon.key ? 'outline' : 'ghost'} aria-pressed={selected === icon.key} onClick={() => setSelected(icon.key)} className="icon-examples__choice"><span className="icon-examples__choice-content"><PencilIcon paths={icon.paths} sourceSize={24} size={32} decorative /><PencilText>{icon.label}</PencilText></span></Button>)}
              {!visibleIcons.length && <PencilText as="p" role="status" className="icon-examples__empty">没有匹配的图标</PencilText>}
            </div>
          </Tabs.Content>
        </Tabs.Root>
      </div>
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
