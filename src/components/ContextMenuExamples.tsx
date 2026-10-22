import { useState } from 'react';
import { ContextMenu, PencilSurface, Switch } from '@inkra/react';

import { useLocale } from '../i18n';
import { ComponentExample } from './ComponentExample';
import { ComponentPlayground } from './ComponentPlayground';
import { PropertyTabs } from './PropertyTabs';
import './ContextMenuExamples.css';

export function ContextMenuExamples() {
  const { locale } = useLocale();
  const text = (zh: string, en: string) => locale === 'zh-CN' ? zh : en;
  const [open, setOpen] = useState(false);
  const [controlled, setControlled] = useState(true);
  const [disabled, setDisabled] = useState(false);
  const [longPress, setLongPress] = useState(true);
  const [compact, setCompact] = useState(false);
  const [lastAction, setLastAction] = useState<'none' | 'duplicate' | 'ideas' | 'drafts' | 'archive'>('none');
  const code = `${controlled ? `const [open, setOpen] = useState(${open});\n\n` : ''}<ContextMenu.Root${controlled ? ' open={open} onOpenChange={setOpen}' : ''}>
  <ContextMenu.Trigger longPress={${longPress}} disabled={${disabled}}>
    <article>${text('在这张笔记上右键', 'Right-click this note')}</article>
  </ContextMenu.Trigger>
  <ContextMenu.Portal>
    <ContextMenu.Content>
      <ContextMenu.Label>${text('笔记操作', 'Note actions')}</ContextMenu.Label>
      <ContextMenu.Item>${text('复制', 'Duplicate')}</ContextMenu.Item>
      <ContextMenu.Item disabled>${text('发布', 'Publish')}</ContextMenu.Item>
      <ContextMenu.Separator />
      <ContextMenu.Sub>
        <ContextMenu.SubTrigger>${text('移动到', 'Move to')}</ContextMenu.SubTrigger>
        <ContextMenu.SubContent>
          <ContextMenu.Item>${text('灵感', 'Ideas')}</ContextMenu.Item>
          <ContextMenu.Item>${text('归档', 'Archive')}</ContextMenu.Item>
        </ContextMenu.SubContent>
      </ContextMenu.Sub>
    </ContextMenu.Content>
  </ContextMenu.Portal>
</ContextMenu.Root>`;
  const rootProps = controlled ? { open, onOpenChange: setOpen } : {};
  const actionText = {
    none: text('尚未执行操作', 'No action yet'),
    duplicate: text('已复制笔记', 'Note duplicated'),
    ideas: text('已移动到灵感', 'Moved to Ideas'),
    drafts: text('已移动到草稿', 'Moved to Drafts'),
    archive: text('已归档', 'Archived'),
  }[lastAction];

  return <div className="context-menu-examples">
    <ComponentPlayground code={code} controls={<PropertyTabs groups={[
      { label: text('交互', 'Interaction'), content: <>
        <Switch label={text('受控打开状态', 'Controlled open state')} checked={controlled} onCheckedChange={next => { setControlled(next); setOpen(false); }} />
        <Switch label={text('启用触屏长按', 'Enable touch long press')} checked={longPress} onCheckedChange={setLongPress} />
      </> },
      { label: text('状态', 'State'), content: <>
        <Switch label={text('展开菜单', 'Open menu')} checked={open} disabled={!controlled || disabled} onCheckedChange={setOpen} />
        <Switch label={text('禁用触发区域', 'Disable trigger area')} checked={disabled} onCheckedChange={next => { setDisabled(next); if (next) setOpen(false); }} />
        <Switch label={text('紧凑笔记', 'Compact note')} checked={compact} onCheckedChange={setCompact} />
      </> },
    ]} />}>
      <div className="context-menu-demo">
        <ContextMenu.Root {...rootProps}>
          <ContextMenu.Trigger
            aria-label={text('笔记操作区域', 'Note actions region')}
            className="context-menu-demo__target"
            data-compact={compact || undefined}
            disabled={disabled}
            longPress={longPress ? { delay: 600, movementTolerance: 10 } : false}
          >
            <PencilSurface as="span" aria-hidden="true" className="context-menu-demo__surface" radius={8} seed="context-menu-demo-target" variant="paper" />
            <span className="context-menu-demo__eyebrow">{text('灵感笔记', 'Idea note')}</span>
            <strong>{text('铅笔菜单的交互草图', 'Interaction sketch for pencil menus')}</strong>
            <span>{text('鼠标右键，或聚焦后按 ContextMenu / Shift+F10。', 'Right-click, or focus and press ContextMenu / Shift+F10.')}</span>
            <span data-context-menu-native className="context-menu-demo__native">
              {text('此行保留浏览器原生菜单，可选择和复制文字。', 'This line keeps the browser menu for selecting and copying text.')}
            </span>
          </ContextMenu.Trigger>
          <ContextMenu.Portal>
            <ContextMenu.Content aria-label={text('笔记操作', 'Note actions')}>
              <ContextMenu.Label>{text('笔记操作', 'Note actions')}</ContextMenu.Label>
              <ContextMenu.Item onSelect={() => setLastAction('duplicate')}>{text('复制笔记', 'Duplicate note')}</ContextMenu.Item>
              <ContextMenu.Item disabled>{text('发布到团队（不可用）', 'Publish to team (unavailable)')}</ContextMenu.Item>
              <ContextMenu.Separator />
              <ContextMenu.Group>
                <ContextMenu.Sub>
                  <ContextMenu.SubTrigger>{text('移动到', 'Move to')}</ContextMenu.SubTrigger>
                  <ContextMenu.SubContent aria-label={text('移动目标', 'Move destination')}>
                    <ContextMenu.Item onSelect={() => setLastAction('ideas')}>{text('灵感', 'Ideas')}</ContextMenu.Item>
                    <ContextMenu.Item onSelect={() => setLastAction('drafts')}>{text('草稿', 'Drafts')}</ContextMenu.Item>
                  </ContextMenu.SubContent>
                </ContextMenu.Sub>
              </ContextMenu.Group>
              <ContextMenu.Separator />
              <ContextMenu.Item destructive onSelect={() => setLastAction('archive')}>{text('归档笔记', 'Archive note')}</ContextMenu.Item>
            </ContextMenu.Content>
          </ContextMenu.Portal>
        </ContextMenu.Root>
        <output aria-live="polite" className="context-menu-demo__status">{actionText}</output>
      </div>
    </ComponentPlayground>

    <ComponentExample title={text('浏览器菜单排除策略', 'Native-menu exclusion policy')} code={`<ContextMenu.Trigger nativeContextMenu="editable" exclude="[data-context-menu-native]">
  <p>${text('自定义菜单区域', 'Custom menu area')}</p>
  <input value="${text('输入框保留原生菜单', 'Inputs keep the native menu')}" readOnly />
  <p data-context-menu-native>${text('显式排除区域', 'Explicitly excluded area')}</p>
</ContextMenu.Trigger>`}>
      <div className="context-menu-demo__policy">
        <p>{text('默认策略在输入、可编辑内容、已有文本选择和 data-context-menu-native 区域保留浏览器菜单。禁用 ContextMenu 时也不会阻止原生菜单。', 'The default policy keeps the browser menu for inputs, editable content, active text selections, and data-context-menu-native regions. A disabled ContextMenu also never blocks the native menu.')}</p>
        <code>nativeContextMenu=&quot;editable&quot;</code>
      </div>
    </ComponentExample>
  </div>;
}
