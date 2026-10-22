import { PencilLine } from '@inkra/react';
import type { ExpansionComponent } from '../../componentRoutes';
import { PencilText, useLocale } from '../../i18n';
import { ComponentPageTabs, type ComponentPageTab } from '../ComponentPageTabs';
import { PageHeading } from '../PageHeading';
import { feedbackDocs } from './FeedbackExamples';
import { overlaysDocs } from './OverlaysExamples';
import { datesDocs } from './DatesExamples';
import { navigationDocs } from './NavigationExamples';
import { dataDocs } from './DataExamples';
import { flowsDocs } from './FlowsExamples';
import type { ExpansionDoc } from './types';

const pages: Record<string, ExpansionDoc> = {
  ...feedbackDocs, ...overlaysDocs, ...datesDocs, ...navigationDocs, ...dataDocs, ...flowsDocs,
};

export default function ExpansionPage({ component, activeTab, onTabChange }: {
  component: ExpansionComponent;
  activeTab: ComponentPageTab;
  onTabChange: (value: ComponentPageTab) => void;
}) {
  const { locale, t } = useLocale();
  const doc = pages[component];
  const language = locale === 'en' ? 'en' : 'zh';
  const Examples = doc.Examples;
  return <article className="documentation">
    <PageHeading title={doc.name} description={doc.intro[language]} />
    <ComponentPageTabs name={doc.name} id={component} value={activeTab} onChange={onTabChange} />
    <PencilLine className="section-divider" />
    <section className="content-section component-examples" role="tabpanel" id={`${component}-panel-${activeTab}`} aria-labelledby={`${component}-tab-${activeTab}`}>
      {activeTab === 'preview' && <Examples />}
      {activeTab === 'api' && <section className="component-api">
        <PencilText as="h2">API</PencilText>
        <table><thead><tr><th>{t('属性')}</th><th>{t('类型')}</th></tr></thead>
          <tbody>{doc.api.map(([name, contract]) => <tr key={name}><td><code>{name}</code></td><td><code>{contract}</code></td></tr>)}</tbody>
        </table>
      </section>}
      {activeTab === 'accessibility' && <section className="component-api">
        <PencilText as="h2">无障碍</PencilText><PencilText as="p">{doc.a11y[language]}</PencilText>
      </section>}
    </section>
  </article>;
}
