import { Button } from '@inkra/react';
import { PencilText, useLocale } from '../i18n';
import type { RoutePath } from '../routes';
import { PageHeading } from './PageHeading';
import { CodeSample } from './CodeSample';

export function GettingStartedPage({ onNavigate }: { onNavigate: (path: RoutePath) => void }) {
  const { t } = useLocale();
  return (
    <article className="documentation">
      <PageHeading title="快速开始" description="先放一个按钮，别急着写整个应用。" />
      <section className="content-section getting-started-content">
        <PencilText as="h2" seed="install-heading">安装与样式</PencilText>
        <CodeSample seed="install-command" language="bash" code="npm install @inkra/react" />
        <CodeSample seed="install-code" code={`import '@inkra/react/tokens.css';\nimport '@inkra/react/styles.css';\nimport { Button } from '@inkra/react';`} />
        <PencilText as="p" seed="font-note">文档站默认使用小赖字体，可在主题定制中切换字体并调整各自的笔触参数。</PencilText>
        <Button onClick={() => onNavigate('/components/button')} seed="start-button">{t("查看 Button")}</Button>
      </section>
    </article>
  );
}

