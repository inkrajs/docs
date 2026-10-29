import { lazy, useId, useState, type ReactNode } from 'react';
import { Badge, Breadcrumb, Button, ButtonGroup, ButtonLink, Card, Checkbox, Field, Input, InputNumber, Overlay, PencilLine, Progress, Slider, Switch, Tabs, Textarea, Tooltip } from '@inkra/react';
import { __iconData as arrowIcon } from 'lucide-react/dist/esm/icons/arrow-right.mjs';
import { __iconData as plusIcon } from 'lucide-react/dist/esm/icons/plus.mjs';
import { __iconData as checkIcon } from 'lucide-react/dist/esm/icons/check.mjs';
import { __iconData as fileIcon } from 'lucide-react/dist/esm/icons/file-text.mjs';
import { __iconData as starIcon } from 'lucide-react/dist/esm/icons/star.mjs';
import { __iconData as editIcon } from 'lucide-react/dist/esm/icons/pencil.mjs';
import { __iconData as leftIcon } from 'lucide-react/dist/esm/icons/text-align-start.mjs';
import { __iconData as centerIcon } from 'lucide-react/dist/esm/icons/text-align-center.mjs';
import { __iconData as rightIcon } from 'lucide-react/dist/esm/icons/text-align-end.mjs';
import { PencilText, useLocale } from '../i18n';
import { docsLanguages, resolveDocsLocale } from '../docsLocales';
import { DocsIcon, type LucideIconData } from './DocsIcon';
import { DocsSelect } from './DocsSelect';
import { BrandMark } from './BrandMark';
import { DeferredDemo } from './HomeDemo';
import './HomePage.css';

const HomeCalendar = lazy(() => import('./HomeTravelSamples').then(module => ({ default: module.HomeCalendar })));
const HomeMap = lazy(() => import('./HomeMapSample').then(module => ({ default: module.HomeMap })));
const HomeNumberSample = lazy(() => import('./HomeCreativeSamples').then(module => ({ default: module.HomeNumberSample })));
const HomePaletteSample = lazy(() => import('./HomeCreativeSamples').then(module => ({ default: module.HomePaletteSample })));
const HomeFlipSample = lazy(() => import('./HomeCreativeSamples').then(module => ({ default: module.HomeFlipSample })));
const HomePackingSample = lazy(() => import('./HomeWorkspaceSamples').then(module => ({ default: module.HomePackingSample })));
const HomeLogSample = lazy(() => import('./HomeWorkspaceSamples').then(module => ({ default: module.HomeLogSample })));
const HomeRadarSample = lazy(() => import('./HomeWorkspaceSamples').then(module => ({ default: module.HomeRadarSample })));
const HomeSkillsSample = lazy(() => import('./HomeWorkspaceSamples').then(module => ({ default: module.HomeSkillsSample })));
const HomeInventorySample = lazy(() => import('./HomeGameInventorySamples').then(module => ({ default: module.HomeInventorySample })));
const HomeEquipmentSample = lazy(() => import('./HomeGameInventorySamples').then(module => ({ default: module.HomeEquipmentSample })));
const HomeQuestSample = lazy(() => import('./HomeGameQuestSamples').then(module => ({ default: module.HomeQuestSample })));
const HomeCraftingSample = lazy(() => import('./HomeGameQuestSamples').then(module => ({ default: module.HomeCraftingSample })));

function useHomeText() {
  const { locale } = useLocale();
  return (zh: string, en: string) => locale === 'en' ? en : zh;
}

function IconAction({ label, icon, pressed, onClick }: { label: string; icon: LucideIconData; pressed?: boolean; onClick: () => void }) {
  return <Tooltip.Root><Tooltip.Trigger asChild>
    <Button size="icon" variant={pressed ? 'secondary' : 'ghost'} aria-label={label} aria-pressed={pressed} onClick={onClick}>
      <DocsIcon data={icon} size={26} active={pressed} />
    </Button>
  </Tooltip.Trigger><Tooltip.Portal><Tooltip.Content>{label}</Tooltip.Content></Tooltip.Portal></Tooltip.Root>;
}

function Specimen({ title, showTitle = false, children }: { title: string; showTitle?: boolean; children: ReactNode }) {
  return <Card.Root className="home-specimen" role="region" aria-label={title}>
    <Card.Content className="home-specimen__body">
      {showTitle && <PencilText as="h2" className="home-specimen__title">{title}</PencilText>}
      {children}
    </Card.Content>
  </Card.Root>;
}

function ProjectSample() {
  const text = useHomeText();
  const [name, setName] = useState('');
  const [visibility, setVisibility] = useState('private');
  const [saved, setSaved] = useState('');
  return <Specimen title={text('新建项目', 'Create a project')} showTitle>
    <form className="home-stack" onSubmit={event => { event.preventDefault(); setSaved(name.trim()); }}>
      <Field label={text('项目名称', 'Project name')} required><Input required pattern=".*\S.*" maxLength={60} value={name} onValueChange={value => { setName(value); setSaved(''); }} placeholder={text('一个好主意', 'A good idea')} clearable clearButtonLabel={text('清空名称', 'Clear name')} /></Field>
      <DocsSelect label={text('可见范围', 'Visibility')} value={visibility} onValueChange={setVisibility} options={[
        ['private', text('仅自己', 'Only me')], ['team', text('团队', 'Team')], ['public', text('公开', 'Public')],
      ]} />
      <Field label={text('备注', 'Notes')}><Textarea rows={3} placeholder={text('先记下来，慢慢长大。', 'A small start is still a start.')} /></Field>
      <Button type="submit" fullWidth startIcon={<DocsIcon data={plusIcon} />}>{text('创建草稿', 'Create draft')}</Button>
      <output className={`home-result${saved ? '' : ' sr-only'}`} aria-live="polite">{saved ? text(`「${saved}」草稿已创建，仅保留在当前页面。`, `Draft "${saved}" created for this page only.`) : ''}</output>
    </form>
  </Specimen>;
}

function PreferencesSample({ themeControl }: { themeControl: ReactNode }) {
  const text = useHomeText();
  const { locale, setLocale } = useLocale();
  const [updates, setUpdates] = useState(true);
  const [mentions, setMentions] = useState(false);
  return <Specimen title={text('偏好设置', 'Make it yours')}>
    <Tabs.Root defaultValue="appearance" className="home-preferences">
      <Tabs.List divided fullWidth aria-label={text('偏好设置分类', 'Preference categories')}>
        <Tabs.Trigger value="appearance">{text('外观', 'Appearance')}</Tabs.Trigger>
        <Tabs.Trigger value="notifications">{text('通知', 'Notifications')}</Tabs.Trigger>
      </Tabs.List>
      <Tabs.Content value="appearance" forceMount className="home-stack">
        <PencilText>{text('换个光线，继续创作。', 'A different light. The same good ideas.')}</PencilText>
        {themeControl}
        <DocsSelect label="语言" value={locale} onValueChange={value => setLocale(resolveDocsLocale(value))} options={docsLanguages} />
      </Tabs.Content>
      <Tabs.Content value="notifications" forceMount className="home-stack">
        <Switch label={text('接收更新', 'Product updates')} checked={updates} onCheckedChange={setUpdates} />
        <Switch label={text('提及提醒', 'Mention notifications')} checked={mentions} onCheckedChange={setMentions} />
        <PencilText className="home-muted">{text('示例偏好只保留在当前页面。', 'Demo preferences stay on this page.')}</PencilText>
      </Tabs.Content>
    </Tabs.Root>
  </Specimen>;
}

function TasksSample() {
  const text = useHomeText();
  const [completed, setCompleted] = useState([true, false, false]);
  const labels = [text('把灵感写下来', 'Capture an idea'), text('给细节一点耐心', 'Give the details some time'), text('做出自己的样子', 'Make it your own')];
  const done = completed.filter(Boolean).length;
  return <Specimen title={text('一件一件来', 'One thing at a time')}>
    <div className="home-task-summary"><PencilText className="home-number">{`${done} / 3`}</PencilText><Badge variant={done === 3 ? 'success' : 'info'}>{done === 3 ? text('完成啦', 'All done') : text('进行中', 'In progress')}</Badge></div>
    <Progress value={done} max={3} aria-label={text('清单完成进度', 'Checklist progress')} />
    <div className="home-checklist">{labels.map((label, index) => <Checkbox key={index} label={label} checked={completed[index]} onCheckedChange={checked => setCompleted(current => current.map((value, item) => item === index ? checked : value))} />)}</div>
  </Specimen>;
}

function TextSample() {
  const text = useHomeText();
  const [align, setAlign] = useState<'left' | 'center' | 'right'>('left');
  const [size, setSize] = useState<number | null>(22);
  const [value, setValue] = useState('');
  const choices = [
    ['left', text('左对齐', 'Align left'), leftIcon], ['center', text('居中', 'Align center'), centerIcon], ['right', text('右对齐', 'Align right'), rightIcon],
  ] as const;
  return <Specimen title={text('留一点手感', 'A little human touch')}>
    <div className="home-type-tools">
      <ButtonGroup aria-label={text('文本对齐', 'Text alignment')} variant="outline">{choices.map(([position, label, icon]) =>
        <IconAction key={position} label={label} icon={icon} pressed={align === position} onClick={() => setAlign(position)} />)}
      </ButtonGroup>
      <InputNumber aria-label={text('字号', 'Font size')} incrementButtonLabel={text('增大字号', 'Increase font size')} decrementButtonLabel={text('减小字号', 'Decrease font size')} min={16} max={32} value={size} onValueChange={setSize} />
    </div>
    <div className="home-type-preview" style={{ textAlign: align }}><PencilText style={{ fontSize: size ?? 22 }}>{value || text('好界面，也可以有笔迹。', 'Good interfaces can have a pencil mark.')}</PencilText></div>
    <Slider aria-label={text('文字大小', 'Text size')} min={16} max={32} value={[size ?? 22]} onValueChange={values => setSize(values[0])} />
    <Input aria-label={text('预览文字', 'Preview text')} value={value} onValueChange={setValue} placeholder={text('换成你的一句话', 'Make it your own line')} maxLength={60} clearable clearButtonLabel={text('清空预览文字', 'Clear preview text')} />
  </Specimen>;
}

function FilesSample() {
  const text = useHomeText();
  const [favorites, setFavorites] = useState([true, false, false]);
  const [tab, setTab] = useState('recent');
  const files = [text('没写完的好主意', 'An unfinished good idea'), text('一些小小的发现', 'Small discoveries'), text('下一次再继续', 'Pick this up next time')];
  const list = (onlyFavorites: boolean) => <ul className="home-files">{files.map((name, index) => (!onlyFavorites || favorites[index]) && <li key={index}>
    <DocsIcon data={fileIcon} size={24} /><PencilText>{name}</PencilText>
    <IconAction label={favorites[index] ? text(`取消收藏 ${name}`, `Unstar ${name}`) : text(`收藏 ${name}`, `Star ${name}`)} icon={starIcon} pressed={favorites[index]} onClick={() => setFavorites(current => current.map((value, item) => item === index ? !value : value))} />
  </li>)}{onlyFavorites && !favorites.some(Boolean) && <li className="home-files__empty"><PencilText>{text('还没有收藏，留个位置。', 'No favorites yet. Room for a good find.')}</PencilText></li>}</ul>;
  return <Specimen title={text('桌面上的几页纸', 'A few pages on your desk')}>
    <Breadcrumb.Root aria-label={text('文件路径', 'File path')}><Breadcrumb.List>
      <Breadcrumb.Item><Breadcrumb.Link href="#home-files" onClick={event => { event.preventDefault(); setTab('recent'); }}>{text('我的文件', 'My files')}</Breadcrumb.Link></Breadcrumb.Item>
      <Breadcrumb.Separator />
      <Breadcrumb.Item><Breadcrumb.Page>{tab === 'recent' ? text('最近', 'Recent') : text('收藏', 'Favorites')}</Breadcrumb.Page></Breadcrumb.Item>
    </Breadcrumb.List></Breadcrumb.Root>
    <Tabs.Root id="home-files" value={tab} onValueChange={setTab}>
      <Tabs.List aria-label={text('文件分类', 'File categories')} divided>
        <Tabs.Trigger value="recent" startIcon={<DocsIcon data={fileIcon} />}>{text('最近', 'Recent')}</Tabs.Trigger>
        <Tabs.Trigger value="favorites" startIcon={<DocsIcon data={starIcon} />}>{text('收藏', 'Favorites')}</Tabs.Trigger>
      </Tabs.List>
      <Tabs.Content value="recent">{list(false)}</Tabs.Content>
      <Tabs.Content value="favorites">{list(true)}</Tabs.Content>
    </Tabs.Root>
  </Specimen>;
}

function DialogSample() {
  const text = useHomeText();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [draft, setDraft] = useState('');
  const [saved, setSaved] = useState(false);
  const formId = useId();
  const displayed = title || text('今天也有新想法', 'Something new today');
  return <Specimen title={text('认真说件小事', 'A moment for the details')}>
    <div className="home-dialog-preview"><DocsIcon data={editIcon} size={38} /><PencilText as="h3">{displayed}</PencilText><PencilText className="home-muted">{text('名字可以慢慢想，灵感先留下。', 'The name can wait. Keep the idea.')}</PencilText></div>
    <Overlay.Root open={open} onOpenChange={next => { if (next) setDraft(displayed); setOpen(next); }}>
      <Overlay.Trigger asChild><Button variant="outline" fullWidth startIcon={<DocsIcon data={editIcon} />}>{text('编辑标题', 'Edit title')}</Button></Overlay.Trigger>
      <Overlay.Portal><Overlay.Backdrop /><Overlay.Content layout="sections" aria-describedby={undefined}>
        <Overlay.Header closeLabel={text('关闭', 'Close')}><Overlay.Title>{text('换个名字', 'Give it a name')}</Overlay.Title></Overlay.Header>
        <Overlay.Body><form id={formId} onSubmit={event => { event.preventDefault(); if (draft.trim()) { setTitle(draft.trim()); setSaved(true); setOpen(false); } }}><Field label={text('标题', 'Title')} required><Input required pattern=".*\S.*" maxLength={60} value={draft} onValueChange={setDraft} /></Field></form></Overlay.Body>
        <Overlay.Footer><Overlay.Close asChild><Button variant="outline">{text('取消', 'Cancel')}</Button></Overlay.Close><Button type="submit" form={formId} startIcon={<DocsIcon data={checkIcon} />}>{text('保存', 'Save')}</Button></Overlay.Footer>
      </Overlay.Content></Overlay.Portal>
    </Overlay.Root>
    <output className={`home-result${saved ? '' : ' sr-only'}`} aria-live="polite">{saved ? text('标题已更新，仅保留在当前页面。', 'Title updated for this page only.') : ''}</output>
  </Specimen>;
}

export function HomePage({ themeControl }: { themeControl: ReactNode }) {
  const text = useHomeText();
  return <main id="main-content" className="home-page">
    <section className="home-intro" aria-labelledby="home-title">
      <div className="home-intro__brand"><BrandMark size={72} /><PencilText as="h1" id="home-title">Inkra</PencilText></div>
      <PencilText as="p">{text('像画画一样搭建你的界面', 'Build your interface like you draw.')}</PencilText>
      <div className="home-intro__actions">
        <ButtonLink size="sm" href="/docs/getting-started" endIcon={<DocsIcon data={arrowIcon} />}>{text('开始使用', 'Get started')}</ButtonLink>
        <ButtonLink size="sm" href="/docs/components/button#preview" variant="outline">{text('查看组件', 'View components')}</ButtonLink>
      </div>
    </section>
    <Tooltip.Provider delayDuration={350}>
      <section className="home-showcase" aria-label={text('组件示例', 'Component examples')}>
        <div className="home-showcase__column">
          <DeferredDemo order={1} estimatedHeight={458}><ProjectSample /></DeferredDemo>
          <DeferredDemo order={2} estimatedHeight={382}><TextSample /></DeferredDemo>
          <DeferredDemo id="home-more" order={10} estimatedHeight={318}><Specimen title={text('让数字动起来', 'Numbers in motion')}><HomeNumberSample /></Specimen></DeferredDemo>
          <DeferredDemo order={13} estimatedHeight={402}><Specimen title={text('整理出发前的行囊', 'Pack for a little adventure')}><HomePackingSample /></Specimen></DeferredDemo>
          <DeferredDemo id="home-inventory" order={16} estimatedHeight={443} mobileHeight={480}><Specimen title={text('冒险者的背包', 'An adventurer’s backpack')}><HomeInventorySample /></Specimen></DeferredDemo>
          <DeferredDemo id="home-crafting" order={19} estimatedHeight={638} mobileHeight={680}><Specimen title={text('营地合成台', 'Camp crafting bench')}><HomeCraftingSample /></Specimen></DeferredDemo>
        </div>
        <div className="home-showcase__column">
          <DeferredDemo order={3} estimatedHeight={416} mobileHeight={416}><Specimen title={text('日历', 'Calendar')}><HomeCalendar /></Specimen></DeferredDemo>
          <DeferredDemo order={4} estimatedHeight={292}><PreferencesSample themeControl={themeControl} /></DeferredDemo>
          <DeferredDemo order={5} estimatedHeight={336}><FilesSample /></DeferredDemo>
          <DeferredDemo order={11} estimatedHeight={385}><Specimen title={text('调一抹自己的颜色', 'A color of your own')}><HomePaletteSample /></Specimen></DeferredDemo>
          <DeferredDemo order={14} estimatedHeight={383}><Specimen title={text('记录一点小进展', 'A little progress log')}><HomeLogSample /></Specimen></DeferredDemo>
          <DeferredDemo id="home-quest" order={17} estimatedHeight={561} mobileHeight={600}><Specimen title={text('领取冒险奖励', 'Claim an adventure reward')}><HomeQuestSample /></Specimen></DeferredDemo>
        </div>
        <div className="home-showcase__column">
          <DeferredDemo order={6} estimatedHeight={460}><Specimen title={text('地图', 'Map')}><HomeMap /></Specimen></DeferredDemo>
          <DeferredDemo order={7} estimatedHeight={295}><TasksSample /></DeferredDemo>
          <DeferredDemo order={8} estimatedHeight={274}><DialogSample /></DeferredDemo>
          <DeferredDemo order={12} estimatedHeight={350} mobileHeight={330}><HomeFlipSample /></DeferredDemo>
          <DeferredDemo order={15} estimatedHeight={498} mobileHeight={492}><Specimen title={text('画出不同的侧面', 'A different shape to every day')}><HomeRadarSample /></Specimen></DeferredDemo>
          <DeferredDemo id="home-equipment" order={18} estimatedHeight={477} mobileHeight={500}><Specimen title={text('换一件趁手的装备', 'Find your next equipment')}><HomeEquipmentSample /></Specimen></DeferredDemo>
        </div>
        <DeferredDemo wide order={20} estimatedHeight={491} mobileHeight={726}><Specimen title={text('把想法连成一棵树', 'Let an idea branch out')}><HomeSkillsSample /></Specimen></DeferredDemo>
      </section>
    </Tooltip.Provider>
    <footer className="home-footer"><PencilLine /><PencilText>Inkra</PencilText><ButtonLink href="/docs/components/icon#preview" variant="link">{text('从一个小图标开始', 'Start with a little icon')}</ButtonLink></footer>
  </main>;
}
