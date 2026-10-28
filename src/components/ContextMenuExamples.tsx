import { useState } from 'react';
import { ContextMenu, Field, Input, PencilSurface, Switch } from '@inkra/react';

import { PencilText, useLocale } from '../i18n';
import { ComponentExample } from './ComponentExample';
import { ComponentPlayground } from './ComponentPlayground';
import { PropertyTabs } from './PropertyTabs';
import './ContextMenuExamples.css';

export function ContextMenuExamples() {
  const { locale } = useLocale();
  const text = (zh: string, en: string) => locale === 'zh-CN' ? zh : en;
  const [open, setOpen] = useState(false);
  const [controlled, setControlled] = useState(false);
  const [advanced, setAdvanced] = useState(false);
  const [disabled, setDisabled] = useState(false);
  const [longPress, setLongPress] = useState(true);
  const [compact, setCompact] = useState(false);
  const [policyAction, setPolicyAction] = useState(false);
  const [lastAction, setLastAction] = useState<'none' | 'duplicate' | 'ideas' | 'drafts' | 'archive'>('none');
  const code = `const [lastAction, setLastAction] = useState('none');
${controlled ? `const [open, setOpen] = useState(${open});\n\n` : ''}<ContextMenu.Root${controlled ? ' open={open} onOpenChange={setOpen}' : ''}>
  <ContextMenu.Trigger longPress={${longPress}} disabled={${disabled}}>
    <article>${text('在这张笔记上右键', 'Right-click this note')}</article>
  </ContextMenu.Trigger>
  <ContextMenu.Portal>
    <ContextMenu.Content>
      <ContextMenu.Item onSelect={() => setLastAction('duplicate')}>${text('复制笔记', 'Duplicate note')}</ContextMenu.Item>
${advanced ? `      <ContextMenu.Label>${text('笔记操作', 'Note actions')}</ContextMenu.Label>
      <ContextMenu.Item disabled>${text('发布', 'Publish')}</ContextMenu.Item>
      <ContextMenu.Separator />
      <ContextMenu.Sub>
        <ContextMenu.SubTrigger>${text('移动到', 'Move to')}</ContextMenu.SubTrigger>
        <ContextMenu.SubContent>
          <ContextMenu.Item onSelect={() => setLastAction('ideas')}>${text('灵感', 'Ideas')}</ContextMenu.Item>
          <ContextMenu.Item onSelect={() => setLastAction('drafts')}>${text('草稿', 'Drafts')}</ContextMenu.Item>
        </ContextMenu.SubContent>
      </ContextMenu.Sub>` : ''}
      <ContextMenu.Item destructive onSelect={() => setLastAction('archive')}>${text('归档笔记', 'Archive note')}</ContextMenu.Item>
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
        <Switch label={text('更多设置', 'More settings')} checked={advanced} onCheckedChange={setAdvanced} />
        <Switch label={text('受控打开状态', 'Controlled open state')} checked={controlled} onCheckedChange={next => { setControlled(next); setOpen(false); }} />
        <Switch label={text('启用触屏长按', 'Enable touch long press')} checked={longPress} onCheckedChange={setLongPress} />
      </> },
      { label: text('状态', 'State'), content: <>
        <Switch label={text('展开菜单', 'Open menu')} checked={open} disabled={!controlled || disabled} onCheckedChange={setOpen} />
        <Switch label={text('禁用触发区域', 'Disable trigger area')} checked={disabled} onCheckedChange={next => { setDisabled(next); if (next) setOpen(false); }} />
        <Switch label={text('紧凑笔记', 'Compact note')} checked={compact} onCheckedChange={setCompact} />
        {lastAction !== 'none' && <output aria-live="polite"><PencilText>{actionText}</PencilText></output>}
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
            <PencilSurface as="span" aria-hidden="true" className="context-menu-demo__focus" variant="outline" />
            <PencilText className="context-menu-demo__eyebrow">{text('灵感笔记', 'Idea note')}</PencilText>
            <PencilText>{text('铅笔菜单的交互草图', 'Interaction sketch for pencil menus')}</PencilText>
            <span data-context-menu-native className="context-menu-demo__native">
              <PencilText>{text('留下一些值得继续打磨的想法。', 'Keep a few ideas worth refining.')}</PencilText>
            </span>
          </ContextMenu.Trigger>
          <ContextMenu.Portal>
            <ContextMenu.Content aria-label={text('笔记操作', 'Note actions')}>
              <ContextMenu.Item onSelect={() => setLastAction('duplicate')}>{text('复制笔记', 'Duplicate note')}</ContextMenu.Item>
              {advanced && <>
              <ContextMenu.Label>{text('笔记操作', 'Note actions')}</ContextMenu.Label>
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
              </>}
              <ContextMenu.Item destructive onSelect={() => setLastAction('archive')}>{text('归档笔记', 'Archive note')}</ContextMenu.Item>
            </ContextMenu.Content>
          </ContextMenu.Portal>
        </ContextMenu.Root>
      </div>
    </ComponentPlayground>

    <ComponentExample id="context-menu-native-menu-exclusion-policy" title={text('浏览器菜单排除策略', 'Native-menu exclusion policy')} code={`const [copied, setCopied] = useState(false);

<ContextMenu.Root>
  <ContextMenu.Trigger nativeContextMenu="editable" exclude="[data-context-menu-native]" aria-label="${text('草稿操作区域', 'Draft actions region')}">
    <PencilText>${text('待整理草稿', 'Draft to organize')}</PencilText>
    <Field label="${text('名称', 'Name')}"><Input defaultValue="Inkra" /></Field>
    <p data-context-menu-native>${text('保留这段文字，稍后继续整理。', 'Keep this text to revisit later.')}</p>
  </ContextMenu.Trigger>
  <ContextMenu.Portal>
    <ContextMenu.Content aria-label="${text('草稿操作', 'Draft actions')}">
      <ContextMenu.Item onSelect={() => setCopied(true)}>${text('复制笔记', 'Duplicate note')}</ContextMenu.Item>
    </ContextMenu.Content>
  </ContextMenu.Portal>
</ContextMenu.Root>`}>
      <div className="context-menu-demo__policy">
        <ContextMenu.Root>
          <ContextMenu.Trigger className="context-menu-demo__target" nativeContextMenu="editable" exclude="[data-context-menu-native]" aria-label={text('草稿操作区域', 'Draft actions region')}>
            <PencilSurface as="span" aria-hidden="true" className="context-menu-demo__surface" variant="paper" />
            <PencilSurface as="span" aria-hidden="true" className="context-menu-demo__focus" variant="outline" />
            <PencilText>{text('待整理草稿', 'Draft to organize')}</PencilText>
            <Field label={text('名称', 'Name')}><Input defaultValue="Inkra" /></Field>
            <span data-context-menu-native><PencilText>{text('保留这段文字，稍后继续整理。', 'Keep this text to revisit later.')}</PencilText></span>
          </ContextMenu.Trigger>
          <ContextMenu.Portal>
            <ContextMenu.Content aria-label={text('草稿操作', 'Draft actions')}>
              <ContextMenu.Item onSelect={() => setPolicyAction(true)}>{text('复制笔记', 'Duplicate note')}</ContextMenu.Item>
            </ContextMenu.Content>
          </ContextMenu.Portal>
        </ContextMenu.Root>
        <output aria-live="polite" className="context-menu-demo__status"><PencilText>{policyAction ? text('已复制笔记', 'Note duplicated') : text('尚未执行操作', 'No action yet')}</PencilText></output>
      </div>
    </ComponentExample>
  </div>;
}
