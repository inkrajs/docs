import { ButtonLink, Empty } from '@inkra/react';
import { useLocale } from '../i18n';
import { PageHeading } from './PageHeading';
import './EcosystemPage.css';

export function EcosystemPage() {
  const { t } = useLocale();

  return <main id="main-content" className="ecosystem-page site-page" aria-labelledby="ecosystem-page-title">
    <PageHeading title="生态" titleId="ecosystem-page-title" showActions={false} description={{
      zh: '用 Inkra 做出的作品，以及可以带走的模板与资源。',
      en: 'Things made with Inkra, and templates and resources to make your own.',
    }} />

    <Empty.Root size="lg" className="ecosystem-page__empty" aria-labelledby="ecosystem-empty-title">
      <Empty.Icon illustration="folder" />
      <Empty.Title as="h2" id="ecosystem-empty-title">{t('还没有收录内容', 'Nothing here just yet')}</Empty.Title>
      <Empty.Description>{t('作品与资源准备好后，会陆续放到这里。', 'We will add projects and resources here as they become available.')}</Empty.Description>
      <Empty.Actions>
        <ButtonLink href="/docs/components/button" variant="outline">{t('先看看组件', 'Explore the components')}</ButtonLink>
      </Empty.Actions>
    </Empty.Root>
  </main>;
}
