import { useState } from 'react';
import { Button, ColorSwatch, Field, Input, PencilLine, RadioGroup, RadioGroupItem, Select, Slider, Tabs } from '@inkra/react';
import { ThemeProvider } from '@inkra/react/theme';
import type { InkraTheme, InkraThemeTokens } from '@inkra/react/theme';
import { __iconData as checkIcon } from 'lucide-react/dist/esm/icons/check.mjs';
import { __iconData as sunIcon } from 'lucide-react/dist/esm/icons/sun.mjs';
import { __iconData as moonIcon } from 'lucide-react/dist/esm/icons/moon.mjs';
import { __iconData as monitorIcon } from 'lucide-react/dist/esm/icons/monitor.mjs';
import { __iconData as paletteIcon } from 'lucide-react/dist/esm/icons/palette.mjs';
import { __iconData as typeIcon } from 'lucide-react/dist/esm/icons/type.mjs';
import { __iconData as penIcon } from 'lucide-react/dist/esm/icons/pen-line.mjs';
import { __iconData as brushIcon } from 'lucide-react/dist/esm/icons/paintbrush.mjs';
import { __iconData as resetIcon } from 'lucide-react/dist/esm/icons/rotate-ccw.mjs';
import { PencilText, useLocale } from '../i18n';
import { ApiTable } from './ApiTable';
import { CodeSample } from './CodeSample';
import { ComponentPlayground } from './ComponentPlayground';
import { DocsIcon } from './DocsIcon';
import { paletteStyle, themeScales, useResolvedTheme } from './ColorSystem';
import { defaultThemeRender, themeRenderControls, themeRenderTokens } from './themeControls';
import './ThemeExamples.css';

export function ThemeExamples() {
  const { t } = useLocale();
  const [theme, setTheme] = useState<InkraTheme>('light');
  const [palette, setPalette] = useState('default');
  const [strokeWidth, setStrokeWidth] = useState(1.5);
  const [saved, setSaved] = useState(false);
  const [render, setRender] = useState(defaultThemeRender);
  const resolved = useResolvedTheme(theme);
  const scale = themeScales.find(item => item.id === palette);
  const tokens: InkraThemeTokens = {
    ...(scale ? paletteStyle(scale, resolved) : {}),
    ...themeRenderTokens(render),
    '--inkra-icon-stroke-width': `${strokeWidth}px`,
  };
  const code = [
    "import '@inkra/react/styles.css';",
    "import { ThemeProvider } from '@inkra/react/theme';",
    "import type { InkraThemeTokens } from '@inkra/react/theme';", '',
    'const tokens = ' + JSON.stringify(tokens, null, 2) + ' satisfies InkraThemeTokens;', '',
    `<ThemeProvider theme="${theme}" tokens={tokens}>`,
    '  <App />',
    '</ThemeProvider>',
  ].join('\n');

  return <div className="theme-examples">
    <section className="content-section" id="theme-provider">
      <ComponentPlayground code={code} controls={<div className="theme-examples__settings">
        <Tabs.Root defaultValue="theme" size="sm">
          <Tabs.List fullWidth aria-label={t("定制分类", "Theme settings")}>
            <Tabs.Trigger value="theme" startIcon={<DocsIcon data={paletteIcon} size={20} />}>{t("主题", "Theme")}</Tabs.Trigger>
            <Tabs.Trigger value="text" startIcon={<DocsIcon data={typeIcon} size={20} />}>{t("文字", "Text")}</Tabs.Trigger>
            <Tabs.Trigger value="lines" startIcon={<DocsIcon data={penIcon} size={20} />}>{t("线条", "Lines")}</Tabs.Trigger>
            <Tabs.Trigger value="wash" startIcon={<DocsIcon data={brushIcon} size={20} />}>{t("涂色", "Fill")}</Tabs.Trigger>
          </Tabs.List>
          <Tabs.Content value="theme" className="theme-examples__panel">
            <RadioGroup name="theme-example-mode" label={t('主题模式')} variant="segmented" orientation="horizontal" value={theme} onValueChange={value => setTheme(value as InkraTheme)}>
              <RadioGroupItem value="light" label={t('浅色')} icon={<DocsIcon data={sunIcon} />} />
              <RadioGroupItem value="dark" label={t('深色')} icon={<DocsIcon data={moonIcon} />} />
              <RadioGroupItem value="auto" label={t("系统", "System")} icon={<DocsIcon data={monitorIcon} />} />
            </RadioGroup>
            <div className="theme-examples__colors" role="group" aria-label={t("主题色", "Accent color")}>
              <ColorSwatch color="var(--inkra-accent)" label={t('默认')} selected={palette === 'default'} onClick={() => setPalette('default')} />
              {themeScales.map(item => <ColorSwatch key={item.id} color={item.values[6][1]} label={t(item.label)} selected={palette === item.id} onClick={() => setPalette(item.id)} />)}
            </div>
          </Tabs.Content>
          {(['text', 'lines', 'wash'] as const).map(group => <Tabs.Content key={group} value={group} className="theme-examples__panel">
            {themeRenderControls.filter(control => control.group === group).map(control => <div className="theme-examples__control" key={control.key}>
              <div><PencilText>{t(control.zh, control.en)}</PencilText><output>{render[control.key].toFixed(control.step < 1 ? 2 : 0)}</output></div>
              <Slider aria-label={t(control.zh, control.en)} min={control.min} max={control.max} step={control.step} value={[render[control.key]]}
                onValueChange={([value]) => setRender(previous => ({ ...previous, [control.key]: value }))} />
            </div>)}
            {group === 'lines' && <div className="theme-examples__control">
              <div><PencilText>{t("图标粗细", "Icon stroke")}</PencilText><output>{strokeWidth.toFixed(1)}px</output></div>
              <Slider aria-label={t("图标粗细", "Icon stroke")} min={0.3} max={3} step={0.1} value={[strokeWidth]} onValueChange={([value]) => setStrokeWidth(value)} />
            </div>}
          </Tabs.Content>)}
        </Tabs.Root>
        <Button variant="ghost" size="sm" startIcon={<DocsIcon data={resetIcon} size={20} />}
          onClick={() => { setTheme('light'); setPalette('default'); setRender(defaultThemeRender); setStrokeWidth(1.5); }}>
          {t("恢复默认", "Reset")}
        </Button>
      </div>}>
        <ThemeProvider className="theme-examples__preview" theme={theme} tokens={tokens} data-testid="theme-preview">
          <PencilText as="h3" className="theme-examples__lettering">{t("一页灵感", "A page of inspiration")}</PencilText>
          <PencilText as="p" className="theme-examples__lettering">{t("把今天的想法，留给明天。", "Keep an idea for tomorrow.")}</PencilText>
          <PencilLine className="theme-examples__line" seed="theme-example-line" />
          <Field label={t("名称", "Name")}><Input defaultValue="Inkra" /></Field>
          <Field label={t("状态", "Status")}><Select.Root defaultValue="draft">
            <Select.Trigger><Select.Value /></Select.Trigger>
            <Select.Portal><Select.Content position="popper" sideOffset={8}><Select.Viewport>
              <Select.Item value="draft"><Select.ItemText>{t("草稿", "Draft")}</Select.ItemText></Select.Item>
              <Select.Item value="ready"><Select.ItemText>{t("就绪", "Ready")}</Select.ItemText></Select.Item>
            </Select.Viewport></Select.Content></Select.Portal>
          </Select.Root></Field>
          <Button startIcon={<DocsIcon data={checkIcon} />} aria-pressed={saved} onClick={() => setSaved(value => !value)}>{saved ? t('已保存') : t('保存')}</Button>
        </ThemeProvider>
      </ComponentPlayground>
      <PencilText as="p">{t("ThemeProvider 用一个局部 div 承载现有 CSS 变量，不修改整页主题，也不自动保存偏好。不传 theme 时继承外层；auto 通过 CSS 跟随系统，服务端渲染也可使用。", "ThemeProvider creates a local div scope for existing CSS tokens. It does not change the document theme or save preferences. Omit theme to inherit; auto follows the operating system through CSS, including server-rendered pages.")}</PencilText>
      <PencilText as="p">{t("tokens 可以配置颜色、字体、间距和笔触，长度值需要单位，例如 1.5px。auto 模式不会自动转换自定义颜色，请分别提供适配浅深色的变量或使用 CSS 媒体查询。强制颜色模式优先采用系统颜色。", "tokens can configure color, typography, spacing and pencil strokes. Lengths need units, such as 1.5px. Custom colors stay as supplied in auto mode; supply suitable light/dark tokens or use CSS media queries. System colors take precedence in forced-color mode.")}</PencilText>
    </section>
    <section className="content-section" id="theme-scopes">
      <PencilText as="h2">{t("局部主题与语言组合", "Scopes and language")}</PencilText>
      <CodeSample seed="theme-provider-nested" code={[
        "import { InkraProvider, ThemeProvider, Button } from '@inkra/react';", '',
        '<InkraProvider locale="ja">',
        '  <ThemeProvider theme="dark">',
        '    <App />',
        '    <ThemeProvider tokens={{ "--inkra-icon-stroke-width": "1px" }}>',
        '      <Toolbar />',
        '    </ThemeProvider>',
        '    <ThemeProvider theme="light">',
        '      <Button>Preview</Button>',
        '    </ThemeProvider>',
        '  </ThemeProvider>',
        '</InkraProvider>',
      ].join('\n')} />
      <PencilText as="p">{t("不传 theme 的内层继承外层变量，只覆盖提供的 key。显式指定主题时以该模式的内置配色为基础，再通过当前层 tokens 定制。弹出菜单和浮层继承触发器的主题，动态修改也会同步，不影响相邻区域。", "A scope without theme inherits parent tokens and overrides only the supplied keys. An explicit theme starts from its built-in palette; set tokens on that scope for further customization. Popovers and menus inherit tokens from their trigger, including live changes. Sibling scopes stay independent.")}</PencilText>
    </section>
    <section className="content-section" id="theme-api">
      <PencilText as="h2">API</PencilText>
      <ApiTable component="ThemeProvider" rows={[
        ['theme', "'light' | 'dark' | 'auto'", t("继承", "Inherit"), t("局部主题模式。", "Local theme mode.")],
        ['tokens', 'InkraThemeTokens', '{}', t("部分 --inkra-* CSS 变量。", "Partial --inkra-* CSS variables.")],
        ['style / className', 'CSSProperties / string', '-', t("作用于容器 div；style 优先于 tokens。", "Styles on the scope div; style wins over tokens.")],
        ['ref', 'Ref<HTMLDivElement>', '-', t("实际的主题容器节点。", "The actual scope element.")],
        ['children', 'ReactNode', '-', t("使用该主题的组件。", "Components within the theme scope.")],
      ]} />
    </section>
  </div>;
}
