import { useMemo, useState } from 'react';
import { Button, Field, Input, PencilLine, PencilText as FontText, Select } from '@inkra/react';
import { ThemeProvider } from '@inkra/react/theme';
import type { InkraThemeTokens } from '@inkra/react/theme';
import { __iconData as checkIcon } from 'lucide-react/dist/esm/icons/check.mjs';
import { __iconData as resetIcon } from 'lucide-react/dist/esm/icons/rotate-ccw.mjs';
import { PencilText, useLocale } from '../i18n';
import { ApiTable } from './ApiTable';
import { CodeSample } from './CodeSample';
import { ComponentPlayground } from './ComponentPlayground';
import { DocsIcon } from './DocsIcon';
import { useResolvedTheme } from './ColorSystem';
import { paletteTokens } from './themeColors';
import { themeRenderTokens } from './themeControls';
import { defaultThemeSettings, fontSpecimen, fontStack } from './themeFonts';
import { ThemeSettingsPanel } from './ThemeSettingsPanel';
import { useThemeDraft } from './useThemeDraft';
import './ThemeExamples.css';

export function ThemeExamples() {
  const { t, locale } = useLocale();
  const editor = useThemeDraft(defaultThemeSettings, 'light');
  const { draft, previewRender, draftTheme } = editor;
  const [saved, setSaved] = useState(false);
  const resolved = useResolvedTheme(draftTheme);
  const specimen = useMemo(() => fontSpecimen(draft.font, locale), [draft.font, locale]);
  const tokens = useMemo<InkraThemeTokens>(() => ({
    ...paletteTokens(draft.palette, resolved),
    ...themeRenderTokens(previewRender),
    '--inkra-font-hand': fontStack(draft.font),
    '--inkra-letter-effect': draft.textEffect ? 1 : 0,
  }), [draft.palette, draft.font, draft.textEffect, resolved, previewRender]);
  const code = [
    "import '@inkra/react/styles.css';",
    "import { ThemeProvider } from '@inkra/react/theme';",
    "import type { InkraThemeTokens } from '@inkra/react/theme';", '',
    'const tokens = ' + JSON.stringify(tokens, null, 2) + ' satisfies InkraThemeTokens;', '',
    '<ThemeProvider theme=' + JSON.stringify(draftTheme) + ' tokens={tokens}>',
    '  <App />',
    '</ThemeProvider>',
  ].join('\n');

  // Keep canvas samples unchanged while dials update their uncommitted values.
  const preview = useMemo(() => <ThemeProvider className="theme-examples__preview" theme={draftTheme} tokens={tokens} data-testid="theme-preview">
    <FontText as="h3" className="theme-examples__lettering" lang={specimen.lang}>{specimen.title}</FontText>
    <FontText as="p" className="theme-examples__lettering" lang={specimen.lang}>{specimen.body}</FontText>
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
  </ThemeProvider>, [draftTheme, tokens, specimen, t, saved]);

  return <div className="theme-examples">
    <section className="content-section" id="theme-provider">
      <ComponentPlayground code={code} controls={<div className="theme-examples__settings">
        <ThemeSettingsPanel editor={editor} />
        <Button variant="ghost" size="sm" startIcon={<DocsIcon data={resetIcon} size={20} />}
          onClick={() => { editor.resetDraft(defaultThemeSettings, 'light'); setSaved(false); }}>
          {t("恢复默认", "Reset")}
        </Button>
      </div>}>{preview}</ComponentPlayground>
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
