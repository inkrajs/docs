import { useState } from 'react';
import { Badge, Button, Flex, Layout, Stack, Tabs } from '@inkra/react';
import { PencilText, useLocale } from '../../i18n';
import { ComponentExample } from '../ComponentExample';

export function LayoutPartsExamples() {
  const { locale } = useLocale();
  const zh = locale === 'zh-CN';
  const [section, setSection] = useState(0);
  const [saved, setSaved] = useState(false);
  const navigation = zh ? ['全部笔记', '收藏', '最近编辑'] : ['All notes', 'Favorites', 'Recent'];
  const note = zh ? '周会记录' : 'Weekly notes';
  return <>
    <ComponentExample id="layout-root" title="Layout.Root" code={'<Layout.Root gap={3} collapseAt="sm">\n  <Layout.Header divided>Inkra</Layout.Header>\n  <Layout.Body>\n    <Layout.Sidebar width={160} divided>All notes</Layout.Sidebar>\n    <Layout.Content>Weekly notes</Layout.Content>\n  </Layout.Body>\n  <Layout.Footer divided>Personal workspace</Layout.Footer>\n</Layout.Root>'}>
      <Layout.Root className="layout-parts-example" gap={3} collapseAt="sm">
        <Layout.Header divided><PencilText>Inkra</PencilText></Layout.Header>
        <Layout.Body>
          <Layout.Sidebar width={160} divided><PencilText>{navigation[0]}</PencilText></Layout.Sidebar>
          <Layout.Content><PencilText>{note}</PencilText></Layout.Content>
        </Layout.Body>
        <Layout.Footer divided><PencilText>{zh ? '个人工作区' : 'Personal workspace'}</PencilText></Layout.Footer>
      </Layout.Root>
    </ComponentExample>
    <ComponentExample id="layout-header" title="Layout.Header" code={'<Tabs.Root defaultValue="notes">\n  <Layout.Root sidebarWidth={160}>\n    <Layout.Header sidebar={<PencilText>Inkra</PencilText>} sidebarDivided divided padding={3}>\n      <Tabs.List aria-label="Note category">\n        <Tabs.Trigger value="notes">All notes</Tabs.Trigger>\n        <Tabs.Trigger value="favorites">Favorites</Tabs.Trigger>\n      </Tabs.List>\n    </Layout.Header>\n    <Layout.Body>\n      <Layout.Sidebar divided padding={3}>Personal workspace</Layout.Sidebar>\n      <Layout.Content>\n        <Tabs.Content value="notes">Weekly notes</Tabs.Content>\n        <Tabs.Content value="favorites">Homepage sketches</Tabs.Content>\n      </Layout.Content>\n    </Layout.Body>\n  </Layout.Root>\n</Tabs.Root>'}>
      <Tabs.Root defaultValue="notes" className="layout-parts-example">
        <Layout.Root sidebarWidth={160}>
          <Layout.Header sidebar={<PencilText>Inkra</PencilText>} sidebarDivided divided padding={3}>
            <Tabs.List aria-label={zh ? '笔记分类' : 'Note category'}>
              <Tabs.Trigger value="notes">{navigation[0]}</Tabs.Trigger>
              <Tabs.Trigger value="favorites">{navigation[1]}</Tabs.Trigger>
            </Tabs.List>
          </Layout.Header>
          <Layout.Body>
          <Layout.Sidebar divided padding={3}><PencilText>{zh ? '个人工作区' : 'Personal workspace'}</PencilText></Layout.Sidebar>
          <Layout.Content>
            <Tabs.Content value="notes"><PencilText>{note}</PencilText></Tabs.Content>
            <Tabs.Content value="favorites"><PencilText>{zh ? '首页草图' : 'Homepage sketches'}</PencilText></Tabs.Content>
          </Layout.Content>
          </Layout.Body>
        </Layout.Root>
      </Tabs.Root>
    </ComponentExample>
    <ComponentExample id="layout-body" title="Layout.Body" code={'<Layout.Root collapseAt="sm">\n  <Layout.Body gap={4}>\n    <Layout.Sidebar width={160} divided>All notes</Layout.Sidebar>\n    <Layout.Content>Weekly notes</Layout.Content>\n  </Layout.Body>\n</Layout.Root>'}>
      <Layout.Root className="layout-parts-example" collapseAt="sm">
        <Layout.Body gap={4}>
          <Layout.Sidebar width={160} divided><PencilText>{navigation[0]}</PencilText></Layout.Sidebar>
          <Layout.Content><PencilText>{note}</PencilText></Layout.Content>
        </Layout.Body>
      </Layout.Root>
    </ComponentExample>
    <ComponentExample id="layout-sidebar" title="Layout.Sidebar" code={'const [section, setSection] = useState(0);\nconst navigation = ["All notes", "Favorites", "Recent"];\n\n<Layout.Root collapseAt="sm">\n  <Layout.Body>\n    <Layout.Sidebar width={200} padding={3} divided>\n      <Stack as="nav" gap={1} aria-label="Notes navigation">\n        {navigation.map((label, index) => <Button key={label}\n          variant={section === index ? "secondary" : "ghost"} fullWidth align="start"\n          aria-current={section === index ? "page" : undefined}\n          onClick={() => setSection(index)}>{label}</Button>)}\n      </Stack>\n    </Layout.Sidebar>\n    <Layout.Content>{navigation[section]}</Layout.Content>\n  </Layout.Body>\n</Layout.Root>'}>
      <Layout.Root className="layout-parts-example" collapseAt="sm">
        <Layout.Body>
          <Layout.Sidebar width={200} padding={3} divided>
            <Stack as="nav" gap={1} aria-label={zh ? '笔记目录' : 'Notes navigation'}>
              {navigation.map((label, index) => <Button key={label}
                variant={section === index ? 'secondary' : 'ghost'} fullWidth align="start"
                aria-current={section === index ? 'page' : undefined}
                onClick={() => setSection(index)}>{label}</Button>)}
            </Stack>
          </Layout.Sidebar>
          <Layout.Content><PencilText>{navigation[section]}</PencilText></Layout.Content>
        </Layout.Body>
      </Layout.Root>
    </ComponentExample>
    <ComponentExample id="layout-content" title="Layout.Content" code={'<Layout.Root>\n  <Layout.Content as="article" padding={3}>\n    <Stack gap={3}>\n      <Badge>Draft</Badge>\n      <PencilText as="p">This week’s progress and the next steps, in one place.</PencilText>\n    </Stack>\n  </Layout.Content>\n</Layout.Root>'}>
      <Layout.Root className="layout-parts-example">
        <Layout.Content as="article" padding={3}>
          <Stack gap={3}>
            <Badge>{zh ? '草稿' : 'Draft'}</Badge>
            <PencilText as="p">{zh ? '把本周的进展和下周要做的事放在一起。' : 'This week’s progress and the next steps, in one place.'}</PencilText>
          </Stack>
        </Layout.Content>
      </Layout.Root>
    </ComponentExample>
    <ComponentExample id="layout-footer" title="Layout.Footer" code={'const [saved, setSaved] = useState(false);\n\n<Layout.Root>\n  <Layout.Footer divided padding={3}>\n    <Flex align="center" justify="between" wrap>\n      <Badge variant={saved ? "success" : "neutral"}>{saved ? "Saved" : "Draft"}</Badge>\n      <Button variant="ghost" onClick={() => setSaved(value => !value)}>\n        {saved ? "Edit" : "Save"}\n      </Button>\n    </Flex>\n  </Layout.Footer>\n</Layout.Root>'}>
      <Layout.Root className="layout-parts-example">
        <Layout.Footer divided padding={3}>
          <Flex align="center" justify="between" wrap>
            <Badge variant={saved ? 'success' : 'neutral'}>{saved ? (zh ? '已保存' : 'Saved') : (zh ? '草稿' : 'Draft')}</Badge>
            <Button variant="ghost" onClick={() => setSaved(value => !value)}>{saved ? (zh ? '继续编辑' : 'Edit') : (zh ? '保存' : 'Save')}</Button>
          </Flex>
        </Layout.Footer>
      </Layout.Root>
    </ComponentExample>
  </>;
}
