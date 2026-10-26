import { PropertyTabs } from './PropertyTabs';
import { useRef, useState } from 'react';
import { Button, Checkbox, Field, Input, Popover, Slider, Switch } from '@inkra/react';
import { PencilText, useLocale } from '../i18n';
import { ComponentPlayground } from './ComponentPlayground';
import { ComponentExample } from './ComponentExample';
import { DocsSelect } from './DocsSelect';
import { choiceVisuals } from './docsChoiceVisuals';

export function PopoverExamples() {
  const { t } = useLocale();
  const [open, setOpen] = useState(false);
  const [modal, setModal] = useState(false);
  const [side, setSide] = useState<'top' | 'right' | 'bottom' | 'left'>('bottom');
  const [align, setAlign] = useState<'start' | 'center' | 'end'>('start');
  const [offset, setOffset] = useState(8);
  const [collisionPadding, setCollisionPadding] = useState(12);
  const [collisions, setCollisions] = useState(true);
  const [arrow, setArrow] = useState(false);
  const [disabled, setDisabled] = useState(false);
  const [onlyPending, setOnlyPending] = useState(false);
  const focusRef = useRef<HTMLInputElement>(null);
  const code = `const [open, setOpen] = useState(false);
const [onlyPending, setOnlyPending] = useState(${onlyPending});

<Popover.Root open={open} onOpenChange={setOpen} modal={${modal}}>
  <Popover.Trigger asChild><Button variant="outline" disabled={${disabled}}>${t('筛选')}</Button></Popover.Trigger>
  <Popover.Portal>
    <Popover.Content side="${side}" align="${align}" sideOffset={${offset}} collisionPadding={${collisionPadding}} avoidCollisions={${collisions}} showArrow={${arrow}}>
      <div className="component-demo-stack">
        <Popover.Title>${t('筛选')}</Popover.Title>
        <Popover.Description>${t('选择要显示的笔记')}</Popover.Description>
        <Checkbox label="${t('仅看未完成')}" checked={onlyPending} onCheckedChange={setOnlyPending} />
        <Popover.Close asChild><Button>${t('完成')}</Button></Popover.Close>
      </div>
    </Popover.Content>
  </Popover.Portal>
</Popover.Root>`;
  const focusCode = `const focusRef = useRef(null);

<Popover.Root>
  <Popover.Trigger asChild><Button variant="outline">${t('编辑名称')}</Button></Popover.Trigger>
  <Popover.Portal>
    <Popover.Content sideOffset={8} onOpenAutoFocus={event => {
      event.preventDefault();
      focusRef.current?.focus();
    }}>
      <div className="component-demo-stack">
        <Popover.Title>${t('编辑名称')}</Popover.Title>
        <Popover.Description>${t('用于识别这条笔记')}</Popover.Description>
        <Field label="${t('名称')}"><Input ref={focusRef} defaultValue="Inkra" /></Field>
        <Popover.Close asChild><Button>${t('完成')}</Button></Popover.Close>
      </div>
    </Popover.Content>
  </Popover.Portal>
</Popover.Root>`;
  return <>
    <ComponentPlayground code={code} controls={<PropertyTabs groups={[
      { label: '基础', content: <>
        <DocsSelect label="方向" value={side} onValueChange={next => setSide(next as typeof side)} options={[["top", "上"], ["right", "右"], ["bottom", "下"], ["left", "左"]]} />
        <DocsSelect label="对齐" visuals={side === 'left' || side === 'right' ? choiceVisuals.verticalAlignment : choiceVisuals.horizontalAlignment} value={align} onValueChange={next => setAlign(next as typeof align)} options={[["start", "Start"], ["center", "Center"], ["end", "End"]]} />
        <Switch label={t('显示箭头')} checked={arrow} onCheckedChange={setArrow} />
      </> },
      { label: '布局', content: <>
        <div><PencilText>偏移</PencilText><Slider aria-label={t('偏移')} min={0} max={32} step={4} value={[offset]} onValueChange={next => setOffset(next[0])} getValueLabel={number => `${number}px`} /><output>{offset}px</output></div>
        <div><PencilText>边缘留白</PencilText><Slider aria-label={t('边缘留白')} min={0} max={32} step={4} value={[collisionPadding]} onValueChange={next => setCollisionPadding(next[0])} getValueLabel={number => `${number}px`} /><output>{collisionPadding}px</output></div>
        <Switch label={t('边缘避让')} checked={collisions} onCheckedChange={setCollisions} />
      </> },
      { label: '状态', content: <>
        <Switch label={t('展开')} checked={open} disabled={disabled} onCheckedChange={setOpen} />
        <Switch label={t('模态')} checked={modal} onCheckedChange={setModal} />
        <Switch label={t('禁用')} checked={disabled} onCheckedChange={next => { setDisabled(next); if (next) setOpen(false); }} />
      </> },
    ]} />}>
      <Popover.Root open={open} onOpenChange={setOpen} modal={modal}>
        <Popover.Trigger asChild><Button variant="outline" disabled={disabled}>{t('筛选')}</Button></Popover.Trigger>
        <Popover.Portal><Popover.Content side={side} align={align} sideOffset={offset} collisionPadding={collisionPadding} avoidCollisions={collisions} showArrow={arrow}>
          <div className="component-demo-stack">
            <Popover.Title>{t('筛选')}</Popover.Title>
            <Popover.Description>{t('选择要显示的笔记')}</Popover.Description>
            <Checkbox label={t('仅看未完成')} checked={onlyPending} onCheckedChange={setOnlyPending} />
            <Popover.Close asChild><Button>{t('完成')}</Button></Popover.Close>
          </div>
        </Popover.Content></Popover.Portal>
      </Popover.Root>
    </ComponentPlayground>
    <ComponentExample id="popover-initial-focus-and-focus-return" title="初始焦点与焦点返回" code={focusCode}>
      <Popover.Root><Popover.Trigger asChild><Button variant="outline">{t('编辑名称')}</Button></Popover.Trigger>
        <Popover.Portal><Popover.Content sideOffset={8} onOpenAutoFocus={event => { event.preventDefault(); focusRef.current?.focus(); }}>
          <div className="component-demo-stack">
            <Popover.Title>{t('编辑名称')}</Popover.Title>
            <Popover.Description>{t('用于识别这条笔记')}</Popover.Description>
            <Field label={t('名称')}><Input ref={focusRef} defaultValue="Inkra" /></Field>
            <Popover.Close asChild><Button>{t('完成')}</Button></Popover.Close>
          </div>
        </Popover.Content></Popover.Portal>
      </Popover.Root>
    </ComponentExample>
  </>;
}
