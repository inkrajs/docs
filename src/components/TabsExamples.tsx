import { PropertyTabs } from './PropertyTabs';
import { useState } from 'react';
import { Field, Input, Switch, Tabs } from 'inkra';
import { useLocale } from '../i18n';
import { ComponentPlayground } from './ComponentPlayground';
import { ComponentExample } from './ComponentExample';
import { DocsSelect } from './DocsSelect';
import { DocsIcon } from './DocsIcon';
import { __iconData as fileIcon } from 'lucide-react/dist/esm/icons/file-text.mjs';

export function TabsExamples() {
  const { t } = useLocale();
  const [value, setValue] = useState('notes');
  const [orientation, setOrientation] = useState<'horizontal' | 'vertical'>('horizontal');
  const [activationMode, setActivationMode] = useState<'automatic' | 'manual'>('automatic');
  const [disabled, setDisabled] = useState(false);
  const [size, setSize] = useState<'sm' | 'md' | 'lg'>('md');
  const [align, setAlign] = useState<'start' | 'center' | 'end'>('start');
  const [dir, setDir] = useState<'ltr' | 'rtl'>('ltr');
  const [fullWidth, setFullWidth] = useState(false);
  const [divided, setDivided] = useState(false);
  const [loop, setLoop] = useState(true);
  const [animated, setAnimated] = useState(true);
  const [icons, setIcons] = useState(false);
  const [keepMounted, setKeepMounted] = useState(false);
  const code = `<Tabs.Root value="${value}" onValueChange={setValue} size="${size}" animated={${animated}} dir="${dir}" orientation="${orientation}" activationMode="${activationMode}">\n  <Tabs.List aria-label="${t('笔记分类')}" align="${align}" fullWidth={${fullWidth}} divided={${divided}} loop={${loop}}>\n    <Tabs.Trigger value="notes"${icons ? ' startIcon={<FileTextIcon />}' : ''}>${t('笔记')}</Tabs.Trigger>\n    <Tabs.Trigger value="drafts"${disabled ? ' disabled' : ''}>${t('草稿')}</Tabs.Trigger>\n  </Tabs.List>\n  <Tabs.Content value="notes"${keepMounted ? ' forceMount' : ''}>${t('笔记内容')}</Tabs.Content>\n  <Tabs.Content value="drafts"${keepMounted ? ' forceMount' : ''}>${t('草稿内容')}</Tabs.Content>\n</Tabs.Root>`;
  return <>
    <ComponentPlayground code={code} controls={<PropertyTabs groups={[
      { label: '基础', content: <>
        <DocsSelect label="尺寸" value={size} onValueChange={next => setSize(next as typeof size)} options={[["sm", "Small"], ["md", "Medium"], ["lg", "Large"]]} />
        <DocsSelect label="对齐" value={align} onValueChange={next => setAlign(next as typeof align)} options={[["start", "Start"], ["center", "Center"], ["end", "End"]]} />
        <DocsSelect label="阅读方向" value={dir} onValueChange={next => setDir(next as typeof dir)} options={[["ltr", "LTR"], ["rtl", "RTL"]]} />
        <DocsSelect label="排列" value={orientation} onValueChange={next => setOrientation(next as typeof orientation)} options={[["horizontal", "横向"], ["vertical", "纵向"]]} />
        <Switch label={t('等宽铺满')} checked={fullWidth} onCheckedChange={setFullWidth} />
        <Switch label={t('显示图标')} checked={icons} onCheckedChange={setIcons} />
        <Switch label={t('分割线')} checked={divided} onCheckedChange={setDivided} />
      </> },
      { label: '交互', content: <>
        <DocsSelect label="激活方式" value={activationMode} onValueChange={next => setActivationMode(next as typeof activationMode)} options={[["automatic", "自动"], ["manual", "手动"]]} />
        <Switch label={t('循环导航')} checked={loop} onCheckedChange={setLoop} />
        <Switch label={t('绘制动画')} checked={animated} onCheckedChange={setAnimated} />
        <Switch label={t('保留面板内容')} checked={keepMounted} onCheckedChange={setKeepMounted} />
      </> },
      { label: '状态', content: <>
        <Switch label={t('禁用草稿')} checked={disabled} onCheckedChange={next => { setDisabled(next); if (next && value === 'drafts') setValue('notes'); }} />
      </> },
    ]} />}>
      <Tabs.Root className="tabs-demo" value={value} onValueChange={setValue} orientation={orientation} activationMode={activationMode} size={size} dir={dir} animated={animated}>
        <Tabs.List aria-label={t('笔记分类')} align={align} fullWidth={fullWidth} divided={divided} loop={loop}><Tabs.Trigger value="notes" startIcon={icons ? <DocsIcon data={fileIcon} size={20} /> : undefined}>{t('笔记')}</Tabs.Trigger><Tabs.Trigger value="drafts" disabled={disabled}>{t('草稿')}</Tabs.Trigger></Tabs.List>
        <Tabs.Content value="notes" forceMount={keepMounted || undefined}>{t('笔记内容')}</Tabs.Content>
        <Tabs.Content value="drafts" forceMount={keepMounted || undefined}>{t('草稿内容')}</Tabs.Content>
      </Tabs.Root>
    </ComponentPlayground>
    <ComponentExample title="分割线" code={`<Tabs.Root defaultValue="notes">\n  <Tabs.List divided aria-label="${t('笔记分类')}">\n    <Tabs.Trigger value="notes">${t('笔记')}</Tabs.Trigger>\n    <Tabs.Trigger value="drafts">${t('草稿')}</Tabs.Trigger>\n  </Tabs.List>\n  <Tabs.Content value="notes">${t('笔记内容')}</Tabs.Content>\n  <Tabs.Content value="drafts">${t('草稿内容')}</Tabs.Content>\n</Tabs.Root>`}>
      <Tabs.Root defaultValue="notes" className="tabs-demo">
        <Tabs.List divided aria-label={t('分割线')}><Tabs.Trigger value="notes">{t('笔记')}</Tabs.Trigger><Tabs.Trigger value="drafts">{t('草稿')}</Tabs.Trigger></Tabs.List>
        <Tabs.Content value="notes">{t('笔记内容')}</Tabs.Content>
        <Tabs.Content value="drafts">{t('草稿内容')}</Tabs.Content>
      </Tabs.Root>
    </ComponentExample>
    <ComponentExample title="保留面板内容" code={`<Tabs.Root defaultValue="notes">\n  <Tabs.List aria-label="${t('笔记分类')}">\n    <Tabs.Trigger value="notes">${t('笔记')}</Tabs.Trigger>\n    <Tabs.Trigger value="drafts">${t('草稿')}</Tabs.Trigger>\n  </Tabs.List>\n  <Tabs.Content value="notes" forceMount><Input /></Tabs.Content>\n  <Tabs.Content value="drafts">${t('草稿内容')}</Tabs.Content>\n</Tabs.Root>`}>
      <Tabs.Root defaultValue="notes" className="tabs-demo">
        <Tabs.List aria-label={t('保留面板内容')}><Tabs.Trigger value="notes">{t('笔记')}</Tabs.Trigger><Tabs.Trigger value="drafts">{t('草稿')}</Tabs.Trigger></Tabs.List>
        <Tabs.Content value="notes" forceMount><Field label={t('名称')}><Input defaultValue="Inkra" /></Field></Tabs.Content>
        <Tabs.Content value="drafts">{t('草稿内容')}</Tabs.Content>
      </Tabs.Root>
    </ComponentExample>
  </>;
}
