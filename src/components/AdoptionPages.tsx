import { Button, Markdown } from '@inkra/react';
import { useLocale } from '../i18n';
import type { RoutePath } from '../routes';
import { PageHeading } from './PageHeading';
import { adoptionMessages } from './adoptionMessages';
import { skillOnboardingMessages } from './skillOnboardingMessages';

export function AiGuidePage() {
  const { locale, t } = useLocale();
  const copy = adoptionMessages[locale];
  const skills = skillOnboardingMessages[locale];
  const source = [
    skills.followUp,
    `## ${copy.everyday}`, `> ${copy.example}`,
    `## ${copy.skills}`, skills.routing,
    `- **inkra** — ${copy.entry}\n- **inkra-docs** — ${skills.docs}\n- **inkra-design** — ${skills.design}`,
    `## ${copy.install}`, skills.install,
    '```bash\nnpx skills add inkrajs/inkra --skill inkra\n```', copy.scope,
    `### ${copy.archives}`, skills.manualInstall,
    '[inkra ZIP](/skills/inkra.zip) · [inkra-docs ZIP](/skills/inkra-docs.zip) · [inkra-design ZIP](/skills/inkra-design.zip)',
    copy.directories, copy.persistence,
    `## ${copy.versions}`, copy.versionNote,
    `[${skills.catalog}](/skills/registry.json) · [${skills.readableDocs}](/llms.txt)`,
  ].join('\n\n');
  return <article className="documentation">
    <PageHeading title="与 AI 一起开发" description="用自然语言接入、组合与设计" />
    <section className="content-section">
      <Markdown labels={{ copy: t('复制代码'), copied: t('已复制代码'), copyFailed: t('复制失败，请手动选择代码') }}>{source}</Markdown>
    </section>
  </article>;
}

export function InstallationPage({ onNavigate }: { onNavigate: (path: RoutePath) => void }) {
  const { locale, t } = useLocale();
  const copy = adoptionMessages[locale];
  const { button } = skillOnboardingMessages[locale];
  const example = `import { Button } from '@inkra/react';\n\nexport function App() {\n  return <Button>${button}</Button>;\n}`;
  const source = [
    `## ${copy.package}`, '```bash\nnpm install @inkra/react\n```',
    `## ${copy.styles}`, "```tsx\nimport '@inkra/react/styles.css';\n```", copy.fontNote,
    `## ${copy.firstComponent}`, `\`\`\`tsx\n${example}\n\`\`\``,
  ].join('\n\n');
  return <article className="documentation">
    <PageHeading title="手动接入" description="安装组件库、导入样式并开始使用" />
    <section className="content-section">
      <Markdown labels={{ copy: t('复制代码'), copied: t('已复制代码'), copyFailed: t('复制失败，请手动选择代码') }}>{source}</Markdown>
      <Button onClick={() => onNavigate('/components/button')} seed="manual-button-documentation">{t('查看 Button')}</Button>
    </section>
  </article>;
}
