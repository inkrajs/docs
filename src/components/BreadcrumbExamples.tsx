import { useState } from 'react';
import { Breadcrumb, ContextMenu, DropdownMenu, Switch } from '@inkra/react';
import { __iconData as chevronDownIcon } from 'lucide-react/dist/esm/icons/chevron-down.mjs';
import { __iconData as fileTextIcon } from 'lucide-react/dist/esm/icons/file-text.mjs';
import { __iconData as homeIcon } from 'lucide-react/dist/esm/icons/house.mjs';
import { __iconData as routeIcon } from 'lucide-react/dist/esm/icons/route.mjs';
import { useLocale } from '../i18n';
import { ComponentExample } from './ComponentExample';
import { ComponentPlayground } from './ComponentPlayground';
import { DocsIcon } from './DocsIcon';
import { PropertyTabs } from './PropertyTabs';

export function BreadcrumbExamples() {
  const { locale } = useLocale();
  const [rtl, setRtl] = useState(false);
  const [disabled, setDisabled] = useState(false);
  const [custom, setCustom] = useState(false);
  const [branch, setBranch] = useState<'components' | 'patterns'>('components');
  const en = locale === 'en';
  const branchLabel = branch === 'components' ? (en ? 'Components' : '组件') : (en ? 'Patterns' : '模式');
  const code = `<Breadcrumb.Root aria-label="${en ? 'Current location' : '当前位置'}" dir="${rtl ? 'rtl' : 'ltr'}">
  <Breadcrumb.List>
    <Breadcrumb.Item><Breadcrumb.Link href="/" startIcon={<HomeIcon />}>Inkra</Breadcrumb.Link></Breadcrumb.Item>
    <Breadcrumb.Separator>${custom ? '>' : ''}</Breadcrumb.Separator>
    <Breadcrumb.Item><Breadcrumb.Link href="/docs/getting-started" endIcon={<FileTextIcon />} disabled={${disabled}}>${en ? 'Docs' : '文档'}</Breadcrumb.Link></Breadcrumb.Item>
    <Breadcrumb.Separator>${custom ? '>' : ''}</Breadcrumb.Separator>
    <Breadcrumb.Item><Breadcrumb.Page startIcon={<RouteIcon />}>Breadcrumb</Breadcrumb.Page></Breadcrumb.Item>
  </Breadcrumb.List>
</Breadcrumb.Root>`;
  return <>
    <ComponentPlayground code={code} controls={<PropertyTabs groups={[{ label: '基础', content: <>
      <Switch label={en ? 'Right to left' : '从右向左'} checked={rtl} onCheckedChange={setRtl} />
      <Switch label={en ? 'Custom separator' : '自定义分隔符'} checked={custom} onCheckedChange={setCustom} />
      <Switch label={en ? 'Disable parent link' : '禁用上级链接'} checked={disabled} onCheckedChange={setDisabled} />
    </> }]} />}>
      <Breadcrumb.Root aria-label={en ? 'Current location' : '当前位置'} dir={rtl ? 'rtl' : 'ltr'}><Breadcrumb.List>
        <Breadcrumb.Item><Breadcrumb.Link href="/" startIcon={<DocsIcon data={homeIcon} size={20} />}>Inkra</Breadcrumb.Link></Breadcrumb.Item>
        <Breadcrumb.Separator>{custom ? '>' : '/'}</Breadcrumb.Separator>
        <Breadcrumb.Item><Breadcrumb.Link href="/docs/getting-started" endIcon={<DocsIcon data={fileTextIcon} size={20} />} disabled={disabled}>{en ? 'Docs' : '文档'}</Breadcrumb.Link></Breadcrumb.Item>
        <Breadcrumb.Separator>{custom ? '>' : '/'}</Breadcrumb.Separator>
        <Breadcrumb.Item><Breadcrumb.Page startIcon={<DocsIcon data={routeIcon} size={20} />}>Breadcrumb</Breadcrumb.Page></Breadcrumb.Item>
      </Breadcrumb.List></Breadcrumb.Root>
    </ComponentPlayground>
    <ComponentExample title={en ? 'Path menus' : '路径菜单'} code={`<Breadcrumb.Root aria-label="${en ? 'Project path' : '项目路径'}">
  <Breadcrumb.List>
    <Breadcrumb.Item><Breadcrumb.Link href="/">Inkra</Breadcrumb.Link></Breadcrumb.Item>
    <Breadcrumb.Separator />
    <Breadcrumb.Item>
      <DropdownMenu.Root>
        <Breadcrumb.MenuTrigger endIcon={<ChevronDownIcon />}>${branchLabel}</Breadcrumb.MenuTrigger>
        <DropdownMenu.Portal><DropdownMenu.Content>
          <DropdownMenu.RadioGroup value={branch} onValueChange={setBranch}>
            <DropdownMenu.RadioItem value="components">${en ? 'Components' : '组件'}</DropdownMenu.RadioItem>
            <DropdownMenu.RadioItem value="patterns">${en ? 'Patterns' : '模式'}</DropdownMenu.RadioItem>
          </DropdownMenu.RadioGroup>
        </DropdownMenu.Content></DropdownMenu.Portal>
      </DropdownMenu.Root>
    </Breadcrumb.Item>
    <Breadcrumb.Separator />
    <Breadcrumb.Item>
      <ContextMenu.Root>
        <Breadcrumb.ContextLink href="/docs/components/breadcrumb" longPress>Breadcrumb</Breadcrumb.ContextLink>
        <ContextMenu.Portal><ContextMenu.Content>
          <ContextMenu.Item onSelect={() => setBranch('components')}>${en ? 'Use Components parent' : '使用组件上级'}</ContextMenu.Item>
          <ContextMenu.Item onSelect={() => setBranch('patterns')}>${en ? 'Use Patterns parent' : '使用模式上级'}</ContextMenu.Item>
        </ContextMenu.Content></ContextMenu.Portal>
      </ContextMenu.Root>
    </Breadcrumb.Item>
  </Breadcrumb.List>
</Breadcrumb.Root>`}>
      <Breadcrumb.Root className="breadcrumb-composition-example" aria-label={en ? 'Project path' : '项目路径'}><Breadcrumb.List>
        <Breadcrumb.Item><Breadcrumb.Link href="/">Inkra</Breadcrumb.Link></Breadcrumb.Item>
        <Breadcrumb.Separator />
        <Breadcrumb.Item>
          <DropdownMenu.Root>
            <Breadcrumb.MenuTrigger endIcon={<DocsIcon data={chevronDownIcon} size={20} />}>{branchLabel}</Breadcrumb.MenuTrigger>
            <DropdownMenu.Portal><DropdownMenu.Content aria-label={en ? 'Choose parent' : '选择上级'}>
              <DropdownMenu.RadioGroup value={branch} onValueChange={value => setBranch(value as typeof branch)}>
                <DropdownMenu.RadioItem value="components">{en ? 'Components' : '组件'}</DropdownMenu.RadioItem>
                <DropdownMenu.RadioItem value="patterns">{en ? 'Patterns' : '模式'}</DropdownMenu.RadioItem>
              </DropdownMenu.RadioGroup>
            </DropdownMenu.Content></DropdownMenu.Portal>
          </DropdownMenu.Root>
        </Breadcrumb.Item>
        <Breadcrumb.Separator />
        <Breadcrumb.Item>
          <ContextMenu.Root>
            <Breadcrumb.ContextLink href="/docs/components/breadcrumb" longPress>Breadcrumb</Breadcrumb.ContextLink>
            <ContextMenu.Portal><ContextMenu.Content aria-label={en ? 'Breadcrumb actions' : '面包屑操作'}>
              <ContextMenu.Item onSelect={() => setBranch('components')}>{en ? 'Use Components parent' : '使用组件上级'}</ContextMenu.Item>
              <ContextMenu.Item onSelect={() => setBranch('patterns')}>{en ? 'Use Patterns parent' : '使用模式上级'}</ContextMenu.Item>
            </ContextMenu.Content></ContextMenu.Portal>
          </ContextMenu.Root>
        </Breadcrumb.Item>
      </Breadcrumb.List></Breadcrumb.Root>
    </ComponentExample>
  </>;
}
