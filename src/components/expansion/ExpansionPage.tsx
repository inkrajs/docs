import { PencilLine } from '@inkra/react';
import type { ExpansionComponent } from '../../componentRoutes';
import { useLocale } from '../../i18n';
import { ComponentPageTabs, type ComponentPageTab } from '../ComponentPageTabs';
import { PageHeading } from '../PageHeading';
import { ApiTable } from '../ApiTable';
import { ApiGroups } from '../ApiGroups';
import { localizeApiRows } from '../apiGroupRows';
import { feedbackDocs } from './FeedbackExamples';
import { overlaysDocs } from './OverlaysExamples';
import { datesDocs } from './DatesExamples';
import { navigationDocs } from './NavigationExamples';
import { dataDocs } from './DataExamples';
import { flowsDocs } from './FlowsExamples';
import { layoutDocs } from './LayoutExamples';
import { inventoryGridDoc } from './InventoryGridExamples';
import type { ExpansionDoc } from './types';
import { GuidanceMarkdown } from '../GuidanceMarkdown';

const pages: Record<string, ExpansionDoc> = {
  ...feedbackDocs, ...overlaysDocs, ...datesDocs, ...navigationDocs, ...dataDocs, ...flowsDocs, ...layoutDocs,
  'inventory-grid': inventoryGridDoc,
};

export default function ExpansionPage({ component, activeTab, onTabChange }: {
  component: ExpansionComponent;
  activeTab: ComponentPageTab;
  onTabChange: (value: ComponentPageTab) => void;
}) {
  const { locale } = useLocale();
  const doc = pages[component];
  const language = locale === 'zh-CN' ? 'zh' : 'en';
  const Examples = doc.Examples;
  return <article className="documentation">
    <PageHeading title={doc.name} description={doc.intro} />
    <ComponentPageTabs name={doc.name} id={component} value={activeTab} onChange={onTabChange} />
    <PencilLine className="section-divider" />
    <section className="content-section component-examples" role="tabpanel" id={`${component}-panel-${activeTab}`} aria-labelledby={`${component}-tab-${activeTab}`}>
      {activeTab === 'preview' && <Examples />}
      {activeTab === 'api' && (doc.apiGroups?.length ? <ApiGroups component={component} groups={doc.apiGroups} /> : <section className="component-api">
        <ApiTable rows={localizeApiRows(doc.api ?? [], locale, component)} component={component} label={`${doc.name} API`} />
      </section>)}
      {activeTab === 'accessibility' && <section className="component-api">
        <GuidanceMarkdown source={doc.a11y[language]} />
      </section>}
    </section>
  </article>;
}
