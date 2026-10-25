import { __iconData as linkIcon } from 'lucide-react/dist/esm/icons/link.mjs';
import { PencilText, useLocale } from '../i18n';
import { ApiTable } from './ApiTable';
import { DocsIcon } from './DocsIcon';
import { localizeApiRows, type ApiGroup } from './apiGroupRows';
import './ComponentExample.css';
import './ApiGroups.css';

export function ApiGroups({ component, groups }: { component: string; groups: readonly ApiGroup[] }) {
  const { locale } = useLocale();
  return <div className="component-api-groups">{groups.map(group => {
    const id = `${component}-api-${group.id}`;
    return <section key={group.id} id={id} className="component-api component-api-group" aria-labelledby={`${id}-title`}>
      <h2 id={`${id}-title`}><a className="component-example__anchor" href={`#${encodeURIComponent(id)}`}>
        <PencilText>{group.title}</PencilText>
        <span className="component-example__anchor-icon" aria-hidden="true"><DocsIcon data={linkIcon} size={16} /></span>
      </a></h2>
      <ApiTable component={component} rows={localizeApiRows(group.rows, locale, component)} label={`${group.title} API`} />
    </section>;
  })}</div>;
}
