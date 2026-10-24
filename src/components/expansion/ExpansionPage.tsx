import { PencilLine } from '@inkra/react';
import type { ExpansionComponent } from '../../componentRoutes';
import { useLocale } from '../../i18n';
import { ComponentPageTabs, type ComponentPageTab } from '../ComponentPageTabs';
import { PageHeading } from '../PageHeading';
import { ApiTable } from '../ApiTable';
import { feedbackDocs } from './FeedbackExamples';
import { overlaysDocs } from './OverlaysExamples';
import { datesDocs } from './DatesExamples';
import { navigationDocs } from './NavigationExamples';
import { dataDocs } from './DataExamples';
import { flowsDocs } from './FlowsExamples';
import { layoutDocs } from './LayoutExamples';
import type { ExpansionDoc } from './types';
import { GuidanceMarkdown } from '../GuidanceMarkdown';

const pages: Record<string, ExpansionDoc> = {
  ...feedbackDocs, ...overlaysDocs, ...datesDocs, ...navigationDocs, ...dataDocs, ...flowsDocs, ...layoutDocs,
};

export default function ExpansionPage({ component, activeTab, onTabChange }: {
  component: ExpansionComponent;
  activeTab: ComponentPageTab;
  onTabChange: (value: ComponentPageTab) => void;
}) {
  const { locale } = useLocale();
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
        <ApiTable rows={doc.api.map(row => row.length === 4 ? [row[0], row[1], row[language === 'zh' ? 2 : 3]] : row)} component={component} label={`${doc.name} API`} />
      </section>}
      {activeTab === 'accessibility' && <section className="component-api">
        <GuidanceMarkdown source={doc.a11y[language]} />
      </section>}
    </section>
  </article>;
}
