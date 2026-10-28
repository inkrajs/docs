import { useState } from 'react';
import { Button, HoverCard, Slider, Switch } from '@inkra/react';

import { useLocale } from '../i18n';
import { ComponentExample } from './ComponentExample';
import { ComponentPlayground } from './ComponentPlayground';
import { DocsSelect } from './DocsSelect';
import { PropertyTabs } from './PropertyTabs';
import './HoverCardExamples.css';

type Side = 'top' | 'right' | 'bottom' | 'left';

const copy = {
  zh: {
    author: '查看创作人',
    title: '林墨',
    role: '插画与视觉设计',
    description: '用彩铅记录城市植物，也维护团队的图形语言。',
    works: '作品',
    projects: '12 项',
    location: '地点',
    city: '杭州',
    open: '展开',
    controlled: '受控',
    image: '显示图片',
    details: '显示详情',
    openDelay: '打开延迟',
    closeDelay: '关闭延迟',
    side: '方向',
    managed: '当前由组件内部管理展开状态',
    openState: '浮层已展开',
    closedState: '浮层已关闭',
    notes: '查看项目说明',
    noteTitle: '暮色植物图鉴',
    noteDescription: '悬停、键盘聚焦或轻触按钮都能打开。浮层内的操作保持可用。',
    add: '加入灵感板',
    added: '已加入灵感板',
    close: '关闭',
    imageAlt: 'Inkra 彩铅标记',
  },
  en: {
    author: 'View creator',
    title: 'Mina Lin',
    role: 'Illustration and visual design',
    description: 'Documents urban plants in colored pencil and maintains the team visual language.',
    works: 'Work',
    projects: '12 projects',
    location: 'Location',
    city: 'Hangzhou',
    open: 'Open',
    controlled: 'Controlled',
    image: 'Show image',
    details: 'Show details',
    openDelay: 'Open delay',
    closeDelay: 'Close delay',
    side: 'Side',
    managed: 'Open state is managed inside the component',
    openState: 'Card is open',
    closedState: 'Card is closed',
    notes: 'View project note',
    noteTitle: 'Twilight plant index',
    noteDescription: 'Hover, keyboard focus, or a direct tap opens the card. Actions inside remain usable.',
    add: 'Add to idea board',
    added: 'Added to idea board',
    close: 'Close',
    imageAlt: 'Inkra pencil mark',
  },
} as const;

export function HoverCardExamples() {
  const { locale } = useLocale();
  const text = locale === 'en' ? copy.en : copy.zh;
  const [controlled, setControlled] = useState(false);
  const [open, setOpen] = useState(false);
  const [showImage, setShowImage] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [openDelay, setOpenDelay] = useState(500);
  const [closeDelay, setCloseDelay] = useState(250);
  const [side, setSide] = useState<Side>('bottom');
  const [added, setAdded] = useState(false);
  const controlledProps = controlled
    ? { open, onOpenChange: setOpen }
    : { defaultOpen: false, onOpenChange: setOpen };
  const code = `${controlled ? "const [open, setOpen] = useState(false);\n\n" : ''}<HoverCard.Root
  ${controlled ? 'open={open}\n  onOpenChange={setOpen}' : 'defaultOpen={false}'}
  openDelay={${openDelay}}
  closeDelay={${closeDelay}}
>
  <HoverCard.Trigger asChild>
    <Button variant="outline">${text.author}</Button>
  </HoverCard.Trigger>
  <HoverCard.Content side="${side}">
    <article className="profile-card">
      ${showImage ? `<img src="/favicon.png" alt="${text.imageAlt}" />\n      ` : ''}<div>
        <HoverCard.Title>${text.title}</HoverCard.Title>
        <HoverCard.Description>${text.description}</HoverCard.Description>${showDetails ? `
        <p>${text.role}</p>
        <dl><dt>${text.works}</dt><dd>${text.projects}</dd><dt>${text.location}</dt><dd>${text.city}</dd></dl>` : ''}
      </div>
    </article>
  </HoverCard.Content>
</HoverCard.Root>`;

  return <>
    <ComponentPlayground code={code} controls={<PropertyTabs groups={[
      { label: '交互', content: <>
        <Switch label={text.controlled} checked={controlled} onCheckedChange={next => { setControlled(next); setOpen(false); }} />
        <Switch label={text.open} checked={open} disabled={!controlled} onCheckedChange={setOpen} />
      </> },
      { label: '布局', content: <>
        <DocsSelect label={text.side} value={side} onValueChange={next => setSide(next as Side)} options={[
          ['top', locale === 'en' ? 'Top' : '上'],
          ['right', locale === 'en' ? 'Right' : '右'],
          ['bottom', locale === 'en' ? 'Bottom' : '下'],
          ['left', locale === 'en' ? 'Left' : '左'],
        ]} />
        <label>{text.openDelay}<Slider aria-label={text.openDelay} min={0} max={1200} step={100} value={[openDelay]} onValueChange={values => setOpenDelay(values[0])} getValueLabel={value => `${value}ms`} /><output>{openDelay}ms</output></label>
        <label>{text.closeDelay}<Slider aria-label={text.closeDelay} min={0} max={800} step={50} value={[closeDelay]} onValueChange={values => setCloseDelay(values[0])} getValueLabel={value => `${value}ms`} /><output>{closeDelay}ms</output></label>
      </> },
      { label: '状态', content: <><Switch label={text.image} checked={showImage} onCheckedChange={setShowImage} /><Switch label={text.details} checked={showDetails} onCheckedChange={setShowDetails} /></> },
    ]} />}>
      <div className="hover-card-demo">
        <HoverCard.Root key={controlled ? 'controlled' : 'uncontrolled'} {...controlledProps} openDelay={openDelay} closeDelay={closeDelay}>
          <HoverCard.Trigger asChild>
            <Button variant="outline">{text.author}</Button>
          </HoverCard.Trigger>
          <HoverCard.Content side={side} className="hover-card-demo__content">
            <article className="hover-card-profile">
              {showImage ? <img src="/favicon.png" alt={text.imageAlt} /> : null}
              <div className="hover-card-profile__main">
                <header>
                  <HoverCard.Title>{text.title}</HoverCard.Title>
                  {showDetails && <p className="hover-card-profile__role">{text.role}</p>}
                </header>
                <HoverCard.Description>{text.description}</HoverCard.Description>
                {showDetails && <dl>
                  <div><dt>{text.works}</dt><dd>{text.projects}</dd></div>
                  <div><dt>{text.location}</dt><dd>{text.city}</dd></div>
                </dl>}
              </div>
            </article>
          </HoverCard.Content>
        </HoverCard.Root>
      </div>
    </ComponentPlayground>

    <ComponentExample id="hover-card-notes" title={text.notes} code={`<HoverCard.Root openDelay={300} closeDelay={300}>
  <HoverCard.Trigger asChild><Button variant="link">${text.notes}</Button></HoverCard.Trigger>
  <HoverCard.Content>
    <HoverCard.Title>${text.noteTitle}</HoverCard.Title>
    <HoverCard.Description>${text.noteDescription}</HoverCard.Description>
    <HoverCard.Close asChild><Button>${text.add}</Button></HoverCard.Close>
  </HoverCard.Content>
</HoverCard.Root>`}>
      <div className="hover-card-demo hover-card-demo--interactive">
        <HoverCard.Root openDelay={300} closeDelay={300}>
          <HoverCard.Trigger asChild><Button variant="link">{text.notes}</Button></HoverCard.Trigger>
          <HoverCard.Content side="top" focusOnOpen="focus-and-press" className="hover-card-demo__content">
            <div className="hover-card-note">
              <HoverCard.Title>{text.noteTitle}</HoverCard.Title>
              <HoverCard.Description>{text.noteDescription}</HoverCard.Description>
              <div className="hover-card-note__actions">
                <HoverCard.Close asChild><Button onClick={() => setAdded(true)}>{text.add}</Button></HoverCard.Close>
                <HoverCard.Close asChild><Button variant="ghost">{text.close}</Button></HoverCard.Close>
              </div>
            </div>
          </HoverCard.Content>
        </HoverCard.Root>
        <output className="hover-card-demo__status" aria-live="polite">{added ? text.added : ''}</output>
      </div>
    </ComponentExample>
  </>;
}
