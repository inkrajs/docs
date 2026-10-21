import { useState } from 'react';
import { Breadcrumb, Switch } from 'inkra';
import { useLocale } from '../i18n';
import { ComponentExample } from './ComponentExample';
import { ComponentPlayground } from './ComponentPlayground';
import { PropertyTabs } from './PropertyTabs';

export function BreadcrumbExamples() {
  const { locale } = useLocale();
  const [rtl, setRtl] = useState(false);
  const [disabled, setDisabled] = useState(false);
  const [custom, setCustom] = useState(false);
  const en = locale === 'en';
  const code = `<Breadcrumb.Root aria-label="${en ? 'Current location' : '当前位置'}" dir="${rtl ? 'rtl' : 'ltr'}">
  <Breadcrumb.List>
    <Breadcrumb.Item><Breadcrumb.Link href="/">Inkra</Breadcrumb.Link></Breadcrumb.Item>
    <Breadcrumb.Separator>${custom ? '>' : ''}</Breadcrumb.Separator>
    <Breadcrumb.Item><Breadcrumb.Link href="/docs/getting-started" disabled={${disabled}}>${en ? 'Docs' : '文档'}</Breadcrumb.Link></Breadcrumb.Item>
    <Breadcrumb.Separator>${custom ? '>' : ''}</Breadcrumb.Separator>
    <Breadcrumb.Item><Breadcrumb.Page>Breadcrumb</Breadcrumb.Page></Breadcrumb.Item>
  </Breadcrumb.List>
</Breadcrumb.Root>`;
  return <>
    <ComponentExample title={en ? 'A simple path' : '简单路径'} code={'<Breadcrumb.Root><Breadcrumb.List>\n  <Breadcrumb.Item><Breadcrumb.Link href="/">Inkra</Breadcrumb.Link></Breadcrumb.Item>\n  <Breadcrumb.Separator />\n  <Breadcrumb.Item><Breadcrumb.Page>Breadcrumb</Breadcrumb.Page></Breadcrumb.Item>\n</Breadcrumb.List></Breadcrumb.Root>'}>
      <Breadcrumb.Root aria-label={en ? 'Simple path' : '简单路径'}><Breadcrumb.List>
        <Breadcrumb.Item><Breadcrumb.Link href="/">Inkra</Breadcrumb.Link></Breadcrumb.Item><Breadcrumb.Separator />
        <Breadcrumb.Item><Breadcrumb.Page>Breadcrumb</Breadcrumb.Page></Breadcrumb.Item>
      </Breadcrumb.List></Breadcrumb.Root>
    </ComponentExample>
    <ComponentPlayground code={code} controls={<PropertyTabs groups={[{ label: '基础', content: <>
      <Switch label={en ? 'Right to left' : '从右向左'} checked={rtl} onCheckedChange={setRtl} />
      <Switch label={en ? 'Custom separator' : '自定义分隔符'} checked={custom} onCheckedChange={setCustom} />
      <Switch label={en ? 'Disable parent link' : '禁用上级链接'} checked={disabled} onCheckedChange={setDisabled} />
    </> }]} />}>
      <Breadcrumb.Root aria-label={en ? 'Current location' : '当前位置'} dir={rtl ? 'rtl' : 'ltr'}><Breadcrumb.List>
        <Breadcrumb.Item><Breadcrumb.Link href="/">Inkra</Breadcrumb.Link></Breadcrumb.Item>
        <Breadcrumb.Separator>{custom ? '>' : '/'}</Breadcrumb.Separator>
        <Breadcrumb.Item><Breadcrumb.Link href="/docs/getting-started" disabled={disabled}>{en ? 'Docs' : '文档'}</Breadcrumb.Link></Breadcrumb.Item>
        <Breadcrumb.Separator>{custom ? '>' : '/'}</Breadcrumb.Separator>
        <Breadcrumb.Item><Breadcrumb.Page>Breadcrumb</Breadcrumb.Page></Breadcrumb.Item>
      </Breadcrumb.List></Breadcrumb.Root>
    </ComponentPlayground>
  </>;
}
