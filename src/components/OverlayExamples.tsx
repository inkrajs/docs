import { PropertyTabs } from './PropertyTabs';
import { useId, useState } from 'react';
import { Button, Field, Input, Overlay, Popover, Switch } from '@inkra/react';
import { useLocale } from '../i18n';
import { ComponentPlayground } from './ComponentPlayground';
import { ComponentExample } from './ComponentExample';

export function OverlayExamples() {
  const { t } = useLocale();
  const formId = useId();
  const [open, setOpen] = useState(false);
  const [modal, setModal] = useState(true);
  const [status, setStatus] = useState('');
  const [backdrop, setBackdrop] = useState(true);
  const [divided, setDivided] = useState(true);
  const [showClose, setShowClose] = useState(true);
  const [outsideClose, setOutsideClose] = useState(true);
  const [escapeClose, setEscapeClose] = useState(true);
  const [nestedOpen, setNestedOpen] = useState(false);
  const [notifications, setNotifications] = useState(false);
  const code = `const formId = useId();
const [open, setOpen] = useState(false);
const [status, setStatus] = useState('');

<Overlay.Root open={open} onOpenChange={setOpen} modal={${modal}}>
  <Overlay.Trigger asChild><Button>${t('编辑笔记')}</Button></Overlay.Trigger>
  <Overlay.Portal>${backdrop && modal ? '\n    <Overlay.Backdrop />' : ''}
    <Overlay.Content layout="sections"${outsideClose ? '' : '\n      onPointerDownOutside={event => event.preventDefault()}'}${escapeClose ? '' : '\n      onEscapeKeyDown={event => event.preventDefault()}'}>
      <Overlay.Header closeLabel="${t('关闭')}" showClose={${showClose}} divided={${divided}}>
        <Overlay.Title>${t('编辑笔记')}</Overlay.Title>
        <Overlay.Description>${t('更新笔记的名称与提醒偏好')}</Overlay.Description>
      </Overlay.Header>
      <Overlay.Body>
        <form id={formId} onSubmit={event => {
          event.preventDefault();
          setStatus(JSON.stringify(Object.fromEntries(new FormData(event.currentTarget))));
          setOpen(false);
        }}>
          <Field label="${t('名称')}" required><Input name="name" defaultValue="Inkra" /></Field>
        </form>
      </Overlay.Body>
      <Overlay.Footer divided={${divided}}>
        <Overlay.Close asChild><Button variant="outline">${t('取消')}</Button></Overlay.Close>
        <Button type="submit" form={formId}>${t('保存更改')}</Button>
      </Overlay.Footer>
    </Overlay.Content>
  </Overlay.Portal>
</Overlay.Root>
<output aria-live="polite">{status}</output>`;
  const nestedCode = `const [open, setOpen] = useState(false);
const [notifications, setNotifications] = useState(false);

<Overlay.Root open={open} onOpenChange={setOpen}>
  <Overlay.Trigger asChild><Button variant="outline">${t('更多设置')}</Button></Overlay.Trigger>
  <Overlay.Portal><Overlay.Backdrop /><Overlay.Content layout="sections">
    <Overlay.Header closeLabel="${t('关闭')}">
      <Overlay.Title>${t('更多设置')}</Overlay.Title>
      <Overlay.Description>${t('更新笔记的名称与提醒偏好')}</Overlay.Description>
    </Overlay.Header>
    <Overlay.Body>
      <Popover.Root>
        <Popover.Trigger asChild><Button variant="outline">${t('提醒设置')}</Button></Popover.Trigger>
        <Popover.Portal><Popover.Content sideOffset={8}>
          <div className="component-demo-stack">
            <Popover.Title>${t('提醒设置')}</Popover.Title>
            <Popover.Description>${t('有新内容时通知我')}</Popover.Description>
            <Switch label="${t('接收更新')}" checked={notifications} onCheckedChange={setNotifications} />
            <Popover.Close asChild><Button>${t('完成')}</Button></Popover.Close>
          </div>
        </Popover.Content></Popover.Portal>
      </Popover.Root>
    </Overlay.Body>
    <Overlay.Footer><Overlay.Close asChild><Button>${t('完成')}</Button></Overlay.Close></Overlay.Footer>
  </Overlay.Content></Overlay.Portal>
</Overlay.Root>`;
  return <>
    <ComponentPlayground code={code} controls={<PropertyTabs groups={[
      { label: '基础', content: <>
        <Switch label={t('模态')} checked={modal} onCheckedChange={setModal} />
        <Switch label={t('显示遮罩')} checked={backdrop} disabled={!modal} onCheckedChange={setBackdrop} />
        <Switch label={t('显示关闭按钮')} checked={showClose} onCheckedChange={setShowClose} />
        <Switch label={t('分割线')} checked={divided} onCheckedChange={setDivided} />
      </> },
      { label: '交互', content: <>
        <Switch label={t('展开')} checked={open} onCheckedChange={setOpen} />
        <Switch label={t('外部点击关闭')} checked={outsideClose} onCheckedChange={setOutsideClose} />
        <Switch label={t('Escape 关闭')} checked={escapeClose} onCheckedChange={setEscapeClose} />
      </> },
    ]} />}>
      <div className="component-demo-form">
        <Overlay.Root open={open} onOpenChange={setOpen} modal={modal}>
          <Overlay.Trigger asChild><Button>{t('编辑笔记')}</Button></Overlay.Trigger>
          <Overlay.Portal>{backdrop && modal && <Overlay.Backdrop />}
            <Overlay.Content layout="sections" onPointerDownOutside={event => { if (!outsideClose) event.preventDefault(); }} onEscapeKeyDown={event => { if (!escapeClose) event.preventDefault(); }}>
              <Overlay.Header closeLabel={t('关闭')} showClose={showClose} divided={divided}>
                <Overlay.Title>{t('编辑笔记')}</Overlay.Title>
                <Overlay.Description>{t('更新笔记的名称与提醒偏好')}</Overlay.Description>
              </Overlay.Header>
              <Overlay.Body>
                <form id={formId} onSubmit={event => {
                  event.preventDefault();
                  setStatus(JSON.stringify(Object.fromEntries(new FormData(event.currentTarget))));
                  setOpen(false);
                }}>
                  <Field label={t('名称')} required><Input name="name" defaultValue="Inkra" /></Field>
                </form>
              </Overlay.Body>
              <Overlay.Footer divided={divided}>
                <Overlay.Close asChild><Button variant="outline">{t('取消')}</Button></Overlay.Close>
                <Button type="submit" form={formId}>{t('保存更改')}</Button>
              </Overlay.Footer>
            </Overlay.Content>
          </Overlay.Portal>
        </Overlay.Root>
        <output className="component-demo-status" aria-live="polite">{status}</output>
      </div>
    </ComponentPlayground>
    <ScrollableOverlayExample />
    <ComponentExample title="嵌套浮层" code={nestedCode}>
      <Overlay.Root open={nestedOpen} onOpenChange={setNestedOpen}>
        <Overlay.Trigger asChild><Button variant="outline">{t('更多设置')}</Button></Overlay.Trigger>
        <Overlay.Portal><Overlay.Backdrop /><Overlay.Content layout="sections">
          <Overlay.Header closeLabel={t('关闭')}>
            <Overlay.Title>{t('更多设置')}</Overlay.Title>
            <Overlay.Description>{t('更新笔记的名称与提醒偏好')}</Overlay.Description>
          </Overlay.Header>
          <Overlay.Body>
            <Popover.Root><Popover.Trigger asChild><Button variant="outline">{t('提醒设置')}</Button></Popover.Trigger>
              <Popover.Portal><Popover.Content sideOffset={8}>
                <div className="component-demo-stack">
                  <Popover.Title>{t('提醒设置')}</Popover.Title>
                  <Popover.Description>{t('有新内容时通知我')}</Popover.Description>
                  <Switch label={t('接收更新')} checked={notifications} onCheckedChange={setNotifications} />
                  <Popover.Close asChild><Button>{t('完成')}</Button></Popover.Close>
                </div>
              </Popover.Content></Popover.Portal>
            </Popover.Root>
          </Overlay.Body>
          <Overlay.Footer><Overlay.Close asChild><Button>{t('完成')}</Button></Overlay.Close></Overlay.Footer>
        </Overlay.Content></Overlay.Portal>
      </Overlay.Root>
    </ComponentExample>
  </>;
}

function ScrollableOverlayExample() {
  const { t } = useLocale();
  const code = `<Overlay.Root>
  <Overlay.Trigger asChild><Button variant="outline">${t('批量编辑')}</Button></Overlay.Trigger>
  <Overlay.Portal><Overlay.Backdrop /><Overlay.Content layout="sections">
    <Overlay.Header closeLabel="${t('关闭')}">
      <Overlay.Title>${t('批量编辑')}</Overlay.Title>
      <Overlay.Description>${t('整理笔记名称')}</Overlay.Description>
    </Overlay.Header>
    <Overlay.Body>
      <div className="component-demo-stack">
        {Array.from({ length: 12 }, (_, index) => (
          <Field key={index} label={\`${t('笔记名称')} \${index + 1}\`}>
            <Input defaultValue={\`Inkra \${index + 1}\`} />
          </Field>
        ))}
      </div>
    </Overlay.Body>
    <Overlay.Footer><Overlay.Close asChild><Button>${t('完成')}</Button></Overlay.Close></Overlay.Footer>
  </Overlay.Content></Overlay.Portal>
</Overlay.Root>`;
  return <ComponentExample title="长内容与固定操作区" code={code}>
    <Overlay.Root>
      <Overlay.Trigger asChild><Button variant="outline">{t('批量编辑')}</Button></Overlay.Trigger>
      <Overlay.Portal><Overlay.Backdrop /><Overlay.Content layout="sections">
        <Overlay.Header closeLabel={t('关闭')}>
          <Overlay.Title>{t('批量编辑')}</Overlay.Title>
          <Overlay.Description>{t('整理笔记名称')}</Overlay.Description>
        </Overlay.Header>
        <Overlay.Body><div className="component-demo-stack">
          {Array.from({ length: 12 }, (_, index) => <Field key={index} label={`${t('笔记名称')} ${index + 1}`}>
            <Input defaultValue={`Inkra ${index + 1}`} />
          </Field>)}
        </div></Overlay.Body>
        <Overlay.Footer><Overlay.Close asChild><Button>{t('完成')}</Button></Overlay.Close></Overlay.Footer>
      </Overlay.Content></Overlay.Portal>
    </Overlay.Root>
  </ComponentExample>;
}
