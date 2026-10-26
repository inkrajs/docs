import { PropertyTabs } from './PropertyTabs';
import { useState } from 'react';
import { Alert, Avatar, Button, Card, DropdownMenu, Input, Switch, Table, type AlertVariant, type CardPadding } from '@inkra/react';
import { PencilText, useLocale } from '../i18n';
import { ComponentPlayground } from './ComponentPlayground';
import { ComponentExample } from './ComponentExample';
import { DocsSelect, controlSizes } from './DocsSelect';
import { choiceVisuals } from './docsChoiceVisuals';
import { DocsSlider } from './DocsSlider';
import { DocsIcon } from './DocsIcon';
import { __iconData as infoIcon } from 'lucide-react/dist/esm/icons/info.mjs';
import './ContentExamples.css';

export type ContentKind = 'dropdown-menu' | 'alert' | 'avatar' | 'card' | 'table';

function MenuExamples() {
  const { t } = useLocale();
  const [side, setSide] = useState<'top' | 'right' | 'bottom' | 'left'>('bottom');
  const [align, setAlign] = useState<'start' | 'center' | 'end'>('start');
  const [disabled, setDisabled] = useState(false);
  const [checked, setChecked] = useState(true);
  const [view, setView] = useState('list');
  const [result, setResult] = useState('');
  const code = `<DropdownMenu.Root>\n  <DropdownMenu.Trigger asChild><Button>${t('笔记操作')}</Button></DropdownMenu.Trigger>\n  <DropdownMenu.Portal>\n    <DropdownMenu.Content side="${side}" align="${align}">\n      <DropdownMenu.Label>${t('笔记操作')}</DropdownMenu.Label>\n      <DropdownMenu.Item disabled={${disabled}} onSelect={() => setResult('copied')}>${t('复制笔记')}</DropdownMenu.Item>\n      <DropdownMenu.CheckboxItem checked={${checked}} onCheckedChange={setChecked}>${t('接收更新')}</DropdownMenu.CheckboxItem>\n      <DropdownMenu.Separator />\n      <DropdownMenu.RadioGroup value="${view}" onValueChange={setView}>\n        <DropdownMenu.RadioItem value="list">${t('列表')}</DropdownMenu.RadioItem>\n        <DropdownMenu.RadioItem value="grid">${t('网格')}</DropdownMenu.RadioItem>\n      </DropdownMenu.RadioGroup>\n    </DropdownMenu.Content>\n  </DropdownMenu.Portal>\n</DropdownMenu.Root>`;
  return <>
    <ComponentPlayground code={code} controls={<PropertyTabs groups={[
      { label: '布局', content: <>
        <DocsSelect label="方向" value={side} onValueChange={value => setSide(value as typeof side)} options={[["top", "上"], ["right", "右"], ["bottom", "下"], ["left", "左"]]} />
        <DocsSelect label="对齐" visuals={side === 'left' || side === 'right' ? choiceVisuals.verticalAlignment : choiceVisuals.horizontalAlignment} value={align} onValueChange={value => setAlign(value as typeof align)} options={[["start", "Start"], ["center", "Center"], ["end", "End"]]} />
      </> },
      { label: '状态', content: <>
        <Switch label={t('禁用复制')} checked={disabled} onCheckedChange={setDisabled} />
        <Switch label={t('接收更新')} checked={checked} onCheckedChange={setChecked} />
        {result && <output aria-live="polite">{t(result)}</output>}
      </> },
    ]} />}>
      <div className="content-demo-stack">
        <DropdownMenu.Root><DropdownMenu.Trigger asChild><Button>{t('笔记操作')}</Button></DropdownMenu.Trigger><DropdownMenu.Portal><DropdownMenu.Content side={side} align={align}>
          <DropdownMenu.Label>{t('笔记操作')}</DropdownMenu.Label>
          <DropdownMenu.Item disabled={disabled} onSelect={() => setResult('已复制笔记')}>{t('复制笔记')}</DropdownMenu.Item>
          <DropdownMenu.CheckboxItem checked={checked} onCheckedChange={setChecked}>{t('接收更新')}</DropdownMenu.CheckboxItem>
          <DropdownMenu.Separator />
          <DropdownMenu.RadioGroup value={view} onValueChange={setView}><DropdownMenu.RadioItem value="list">{t('列表')}</DropdownMenu.RadioItem><DropdownMenu.RadioItem value="grid">{t('网格')}</DropdownMenu.RadioItem></DropdownMenu.RadioGroup>
        </DropdownMenu.Content></DropdownMenu.Portal></DropdownMenu.Root>
      </div>
    </ComponentPlayground>
    <ComponentExample id="content-destructive-action" title="危险操作" code={`<DropdownMenu.Root>\n  <DropdownMenu.Trigger asChild><Button variant="outline">${t('更多设置')}</Button></DropdownMenu.Trigger>\n  <DropdownMenu.Portal><DropdownMenu.Content>\n    <DropdownMenu.Item destructive onSelect={handleArchive}>${t('归档笔记')}</DropdownMenu.Item>\n  </DropdownMenu.Content></DropdownMenu.Portal>\n</DropdownMenu.Root>`}>
      <DropdownMenu.Root><DropdownMenu.Trigger asChild><Button variant="outline">{t('更多设置')}</Button></DropdownMenu.Trigger><DropdownMenu.Portal><DropdownMenu.Content><DropdownMenu.Item destructive onSelect={() => setResult(t('已归档'))}>{t('归档笔记')}</DropdownMenu.Item></DropdownMenu.Content></DropdownMenu.Portal></DropdownMenu.Root>
    </ComponentExample>
  </>;
}

function AlertExamples() {
  const { t, locale } = useLocale();
  const zh = locale === 'zh-CN';
  const [variant, setVariant] = useState<AlertVariant>('info');
  const [icon, setIcon] = useState(true);
  const [title, setTitle] = useState(t('同步完成'));
  const [size, setSize] = useState<'sm' | 'md' | 'lg'>('md');
  const [appearance, setAppearance] = useState<'soft' | 'outline'>('soft');
  const [actions, setActions] = useState(false);
  const [acknowledged, setAcknowledged] = useState(false);
  const [closable, setClosable] = useState(false);
  const [open, setOpen] = useState(true);
  const closeLabel = zh ? '关闭通知' : 'Dismiss notification';
  const code = `const [open, setOpen] = useState(${open});\n\n<Alert.Root open={open} onOpenChange={setOpen} closable={${closable}} closeLabel="${closeLabel}" variant="${variant}" size="${size}" appearance="${appearance}"${icon ? ' icon={<InfoIcon />}' : ''}${actions ? ` actions={<Button onClick={handleAcknowledge}>${t('确认')}</Button>}` : ''}>\n  <Alert.Title>{${JSON.stringify(title)}}</Alert.Title>\n  <Alert.Description>${t('所有笔记已保存到当前工作区。')}</Alert.Description>\n</Alert.Root>`;
  return <>
    <ComponentPlayground code={code} controls={<PropertyTabs groups={[
      { label: '基础', content: <>
        <DocsSelect label="状态" value={variant} onValueChange={value => setVariant(value as AlertVariant)} options={[["info", "信息"], ["success", "成功"], ["warning", "提醒"], ["danger", "危险"]]} />
        <DocsSelect label="尺寸" value={size} onValueChange={value => setSize(value as typeof size)} options={controlSizes} />
        <DocsSelect label="外观" value={appearance} onValueChange={value => setAppearance(value as typeof appearance)} options={[["soft", "铺色"], ["outline", "描边"]]} />
      </> },
      { label: '内容', content: <>
        <label><PencilText>标题</PencilText><Input value={title} onChange={event => setTitle(event.target.value)} /></label>
        <Switch label={t('显示图标')} checked={icon} onCheckedChange={setIcon} />
        <Switch label={t('显示操作')} checked={actions} onCheckedChange={setActions} />
      </> },
      { label: '交互', content: <>
        <Switch label={zh ? '允许关闭' : 'Dismissible'} checked={closable} onCheckedChange={setClosable} />
        <Switch label={zh ? '显示通知' : 'Show notification'} checked={open} onCheckedChange={setOpen} />
      </> },
    ]} />}>
      <Alert.Root className="content-demo-width" open={open} onOpenChange={setOpen} closable={closable} closeLabel={closeLabel} variant={variant} size={size} appearance={appearance} actions={actions ? <Button variant="outline" onClick={() => setAcknowledged(true)}>{t(acknowledged ? '已确认' : '确认')}</Button> : undefined} icon={icon ? <DocsIcon data={infoIcon} size={20} /> : undefined}><Alert.Title>{title}</Alert.Title><Alert.Description>{t('所有笔记已保存到当前工作区。')}</Alert.Description></Alert.Root>
      {!open && <Button variant="outline" onClick={() => setOpen(true)}>{zh ? '重新显示通知' : 'Show notification again'}</Button>}
    </ComponentPlayground>
    <ComponentExample id="content-states" title="状态" code={`<Alert.Root variant="warning" role="alert">\n  <Alert.Title>${t('尚未保存')}</Alert.Title>\n  <Alert.Description>${t('离开前请保存当前修改。')}</Alert.Description>\n</Alert.Root>`}>
      <Alert.Root variant="warning" role="alert"><Alert.Title>{t('尚未保存')}</Alert.Title><Alert.Description>{t('离开前请保存当前修改。')}</Alert.Description></Alert.Root>
    </ComponentExample>
  </>;
}

function AvatarExamples() {
  const { t } = useLocale();
  const [size, setSize] = useState<'sm' | 'md' | 'lg'>('md');
  const [src, setSrc] = useState('');
  const [name, setName] = useState('Inkra');
  const [radius, setRadius] = useState(8);
  const [bordered, setBordered] = useState(true);
  const [fit, setFit] = useState<'cover' | 'contain'>('cover');
  const [fallback, setFallback] = useState('IK');
  const code = `<Avatar.Root size="${size}" radius={${radius}} bordered={${bordered}}>\n  <Avatar.Image src={${JSON.stringify(src)}} alt={${JSON.stringify(name)}} fit="${fit}" />\n  <Avatar.Fallback role="img" aria-label={${JSON.stringify(name)}}>{${JSON.stringify(fallback)}}</Avatar.Fallback>\n</Avatar.Root>`;
  return <>
    <ComponentPlayground code={code} controls={<PropertyTabs groups={[
      { label: '基础', content: <>
        <DocsSelect label="尺寸" value={size} onValueChange={value => setSize(value as typeof size)} options={controlSizes} />
        <DocsSlider label="圆角" min={0} max={8} value={radius} onValueChange={setRadius} unit="px" />
        <Switch label={t('显示边框')} checked={bordered} onCheckedChange={setBordered} />
        <DocsSelect label="图片适配" value={fit} onValueChange={value => setFit(value as typeof fit)} options={[["cover", "填满裁切"], ["contain", "完整显示"]]} />
      </> },
      { label: '内容', content: <>
        <label><PencilText>图片地址</PencilText><Input value={src} onChange={event => setSrc(event.target.value)} /></label>
        <label><PencilText>名称</PencilText><Input value={name} onChange={event => setName(event.target.value)} /></label>
        <label><PencilText>回退文字</PencilText><Input value={fallback} onChange={event => setFallback(event.target.value)} /></label>
      </> },
    ]} />}>
      <Avatar.Root size={size} radius={radius} bordered={bordered}><Avatar.Image src={src || undefined} alt={name} fit={fit} /><Avatar.Fallback role="img" aria-label={name}>{fallback}</Avatar.Fallback></Avatar.Root>
    </ComponentPlayground>
    <ComponentExample id="content-size" title="尺寸" code={['sm', 'md', 'lg'].map(size => `<Avatar.Root size="${size}"><Avatar.Fallback role="img" aria-label="Inkra">IK</Avatar.Fallback></Avatar.Root>`).join('\n')}>
      <div className="content-demo-row">{(['sm', 'md', 'lg'] as const).map(size => <Avatar.Root size={size} key={size}><Avatar.Fallback role="img" aria-label="Inkra">IK</Avatar.Fallback></Avatar.Root>)}</div>
    </ComponentExample>
  </>;
}

function CardExamples() {
  const { t } = useLocale();
  const [variant, setVariant] = useState<'paper' | 'quiet' | 'outline'>('paper');
  const [footer, setFooter] = useState(true);
  const [radius, setRadius] = useState(8);
  const [saved, setSaved] = useState(false);
  const [size, setSize] = useState<'sm' | 'md' | 'lg'>('md');
  const [divided, setDivided] = useState(true);
  const [action, setAction] = useState(false);
  const [description, setDescription] = useState(true);
  const [padding, setPadding] = useState<CardPadding>('inherit');
  const [headerPadding, setHeaderPadding] = useState<CardPadding>('inherit');
  const [footerPadding, setFooterPadding] = useState<CardPadding>('inherit');
  const [headerAlign, setHeaderAlign] = useState<'start' | 'center' | 'end'>('start');
  const [orientation, setOrientation] = useState<'horizontal' | 'vertical'>('horizontal');
  const paddingOptions = [['inherit', '继承尺寸'], ['none', '无'], ['sm', '小'], ['md', '中'], ['lg', '大']] as const;
  const [justify, setJustify] = useState<'start' | 'center' | 'end' | 'between'>('start');
  const [heading, setHeading] = useState<'h2' | 'h3' | 'h4'>('h3');
  const code = `<Card.Root variant="${variant}" size="${size}" radius={${radius}} divided={${divided}}>\n  <Card.Header padding="${headerPadding}" align="${headerAlign}"${action ? ` action={<Button variant="ghost" onClick={handleSave}>${t('保存更改')}</Button>}` : ''}>\n    <Card.Title as="${heading}">${t('灵感笔记')}</Card.Title>${description ? `\n    <Card.Description>${t('今天的创作记录')}</Card.Description>` : ''}\n  </Card.Header>\n  <Card.Content padding="${padding}">${t('记录一个值得继续探索的想法。')}</Card.Content>${footer ? `\n  <Card.Footer padding="${footerPadding}" orientation="${orientation}" justify="${justify}"><Button onClick={handleSave}>${t('保存更改')}</Button></Card.Footer>` : ''}\n</Card.Root>`;
  return <>
    <ComponentPlayground code={code} controls={<PropertyTabs groups={[
      { label: '基础', content: <>
        <DocsSelect label="纸面" value={variant} onValueChange={value => setVariant(value as typeof variant)} options={[["paper", "基础纸面"], ["quiet", "安静纸面"], ["outline", "描边"]]} />
        <DocsSlider label="圆角" min={0} max={8} value={radius} onValueChange={setRadius} unit="px" />
        <DocsSelect label="尺寸" value={size} onValueChange={value => setSize(value as typeof size)} options={controlSizes} />
        <Switch label={t('显示分割线')} checked={divided} onCheckedChange={setDivided} />
      </> },
      { label: '内容', content: <>
        <Switch label={t('显示页脚')} checked={footer} onCheckedChange={setFooter} />
        <Switch label={t('头部操作')} checked={action} onCheckedChange={setAction} />
        <Switch label={t('显示描述')} checked={description} onCheckedChange={setDescription} />
        <DocsSelect label="标题层级" value={heading} onValueChange={value => setHeading(value as typeof heading)} options={[["h2", "H2"], ["h3", "H3"], ["h4", "H4"]]} />
      </> },
      { label: '布局', content: <>
        <DocsSelect label="头部内边距" value={headerPadding} onValueChange={value => setHeaderPadding(value as CardPadding)} options={paddingOptions} />
        <DocsSelect label="头部垂直对齐" visuals={choiceVisuals.verticalAlignment} value={headerAlign} onValueChange={value => setHeaderAlign(value as typeof headerAlign)} options={[["start", "上"], ["center", "Center"], ["end", "下"]]} />
        <DocsSelect label="内容内边距" value={padding} onValueChange={value => setPadding(value as CardPadding)} options={paddingOptions} />
        <DocsSelect label="页脚内边距" value={footerPadding} onValueChange={value => setFooterPadding(value as CardPadding)} options={paddingOptions} />
        <DocsSelect label="页脚排列" value={orientation} onValueChange={value => setOrientation(value as typeof orientation)} options={[["horizontal", "横向"], ["vertical", "纵向"]]} />
        <DocsSelect label="页脚对齐" visuals={orientation === 'horizontal' ? choiceVisuals.horizontalAlignment : choiceVisuals.verticalAlignment} value={justify} onValueChange={value => setJustify(value as typeof justify)} options={[["start", "Start"], ["center", "Center"], ["end", "End"], ["between", "两端对齐"]]} />
      </> },
    ]} />}>
      <Card.Root className="content-demo-width" variant={variant} radius={radius} size={size} divided={divided}><Card.Header padding={headerPadding} align={headerAlign} action={action ? <Button variant="ghost" onClick={() => setSaved(true)}>{t('保存更改')}</Button> : undefined}><Card.Title as={heading}>{t('灵感笔记')}</Card.Title>{description && <Card.Description>{t('今天的创作记录')}</Card.Description>}</Card.Header><Card.Content padding={padding}><PencilText>记录一个值得继续探索的想法。</PencilText>{!footer && <span role="status">{saved ? t('已保存') : ''}</span>}</Card.Content>{footer && <Card.Footer padding={footerPadding} orientation={orientation} justify={justify}><Button onClick={() => setSaved(true)}>{t('保存更改')}</Button><span role="status">{saved ? t('已保存') : ''}</span></Card.Footer>}</Card.Root>
    </ComponentPlayground>
  </>;
}

function TableExamples() {
  const { t } = useLocale();
  const [density, setDensity] = useState<'compact' | 'comfortable'>('comfortable');
  const [selected, setSelected] = useState(false);
  const [empty, setEmpty] = useState(false);
  const [striped, setStriped] = useState(false);
  const [hoverable, setHoverable] = useState(false);
  const [sticky, setSticky] = useState(false);
  const [captionSide, setCaptionSide] = useState<'top' | 'bottom'>('top');
  const [layout, setLayout] = useState<'auto' | 'fixed'>('auto');
  const [verticalAlign, setVerticalAlign] = useState<'top' | 'middle' | 'bottom'>('middle');
  const [wrap, setWrap] = useState(true);
  const [align, setAlign] = useState<'start' | 'center' | 'end'>('start');
  const rows = [['灵感笔记', '草稿', '6'], ['设计清单', '已完成', '12'], ['今天的创作记录', '草稿', '3'], ['笔记列表', '已完成', '8']];
  const cellProps = `verticalAlign="${verticalAlign}" wrap={${wrap}}`;
  const rowCode = empty ? `<Table.Row><Table.Cell colSpan={3}>${t('暂无记录')}</Table.Cell></Table.Row>` : rows.map(([name, status, count], index) => `<Table.Row${index === 0 ? ` selected={${selected}}` : ''}><Table.Cell ${cellProps}>${t(name)}</Table.Cell><Table.Cell ${cellProps}>${t(status)}</Table.Cell><Table.Cell ${cellProps} align="${align}">${count}</Table.Cell></Table.Row>`).join('\n    ');
  const code = `<Table.Container tabIndex={0} aria-label="${t('笔记列表')}" style={{ maxHeight: 240 }}>\n  <Table.Root layout="${layout}" density="${density}" striped={${striped}} hoverable={${hoverable}} stickyHeader={${sticky}} captionSide="${captionSide}">\n    <Table.Caption>${t('笔记列表')}</Table.Caption>\n    <Table.Header><Table.Row><Table.Head>${t('名称')}</Table.Head><Table.Head>${t('状态')}</Table.Head><Table.Head align="${align}">${t('条目')}</Table.Head></Table.Row></Table.Header>\n    <Table.Body>${rowCode}</Table.Body>\n  </Table.Root>\n</Table.Container>`;
  return <ComponentPlayground code={code} controls={<PropertyTabs groups={[
      { label: '基础', content: <>
        <DocsSelect label="密度" value={density} onValueChange={value => setDensity(value as typeof density)} options={[["compact", "紧凑"], ["comfortable", "舒适"]]} />
        <Switch label={t('隔行底色')} checked={striped} onCheckedChange={setStriped} />
        <Switch label={t('悬停反馈')} checked={hoverable} onCheckedChange={setHoverable} />
      </> },
      { label: '布局', content: <>
        <Switch label={t('固定表头')} checked={sticky} onCheckedChange={setSticky} />
        <DocsSelect label="列布局" value={layout} onValueChange={value => setLayout(value as typeof layout)} options={[["auto", "自动"], ["fixed", "固定"]]} />
        <DocsSelect label="单元格垂直对齐" value={verticalAlign} onValueChange={value => setVerticalAlign(value as typeof verticalAlign)} options={[["top", "上"], ["middle", "Center"], ["bottom", "下"]]} />
        <Switch label={t('单元格换行')} checked={wrap} onCheckedChange={setWrap} />
        <DocsSelect label="标题位置" value={captionSide} onValueChange={value => setCaptionSide(value as typeof captionSide)} options={[["top", "上"], ["bottom", "下"]]} />
        <DocsSelect label="数值对齐" value={align} onValueChange={value => setAlign(value as typeof align)} options={[["start", "Start"], ["center", "Center"], ["end", "End"]]} />
      </> },
      { label: '状态', content: <>
        <Switch label={t('选中首行')} checked={selected} onCheckedChange={setSelected} />
        <Switch label={t('空状态')} checked={empty} onCheckedChange={setEmpty} />
      </> },
    ]} />}>
    <Table.Container className="content-demo-width" style={{ maxHeight: 240 }} aria-label={t('笔记列表')}><Table.Root layout={layout} density={density} striped={striped} hoverable={hoverable} stickyHeader={sticky} captionSide={captionSide}><Table.Caption>{t('笔记列表')}</Table.Caption><Table.Header><Table.Row><Table.Head>{t('名称')}</Table.Head><Table.Head>{t('状态')}</Table.Head><Table.Head align={align}>{t('条目')}</Table.Head></Table.Row></Table.Header><Table.Body>{empty ? <Table.Row><Table.Cell colSpan={3}>{t('暂无记录')}</Table.Cell></Table.Row> : rows.map(([name, status, count], index) => <Table.Row key={name} selected={index === 0 && selected}><Table.Cell verticalAlign={verticalAlign} wrap={wrap}>{t(name)}</Table.Cell><Table.Cell verticalAlign={verticalAlign} wrap={wrap}>{t(status)}</Table.Cell><Table.Cell verticalAlign={verticalAlign} wrap={wrap} align={align}>{count}</Table.Cell></Table.Row>)}</Table.Body></Table.Root></Table.Container>
  </ComponentPlayground>;
}

export function ContentExamples({ kind }: { kind: ContentKind }) {
  if (kind === 'dropdown-menu') return <MenuExamples />;
  if (kind === 'alert') return <AlertExamples />;
  if (kind === 'avatar') return <AvatarExamples />;
  if (kind === 'card') return <CardExamples />;
  return <TableExamples />;
}
