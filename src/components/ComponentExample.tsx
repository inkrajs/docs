import { useRef, useState, type ReactNode } from 'react';
import { PencilLine, PencilSurface } from '@inkra/react';
import { __iconData as codeIcon } from 'lucide-react/dist/esm/icons/code-xml.mjs';
import { __iconData as chevronDownIcon } from 'lucide-react/dist/esm/icons/chevron-down.mjs';
import { __iconData as linkIcon } from 'lucide-react/dist/esm/icons/link.mjs';
import { DocsIcon } from './DocsIcon';
import { CodeBlock } from './CodeBlock';
import { PencilText, useLocale } from '../i18n';
import './ComponentExample.css';

export function ComponentExample({ id, title, code, codeActions, children }: {
  id: string; title: string; code: string; codeActions?: ReactNode; children: ReactNode;
}) {
  const [expanded, setExpanded] = useState(false);
  const { t } = useLocale();
  const documentationCode = useRef(code).current;
  return <section id={id} className="component-example" aria-labelledby={`${id}-title`} data-doc-code={documentationCode}>
    <PencilSurface variant="paper" radius={8} className="component-example__frame">
      <header className="component-example__header">
        <h2 id={`${id}-title`}><a className="component-example__anchor" href={`#${encodeURIComponent(id)}`}>
          <PencilText>{title}</PencilText>
          <span className="component-example__anchor-icon" aria-hidden="true"><DocsIcon data={linkIcon} size={16} /></span>
        </a></h2>
        <PencilLine />
      </header>
      <div className="component-example__preview">{children}</div>
      <PencilLine />
      <footer className="component-example__footer">
      <button type="button" className="component-example__disclosure"
        aria-expanded={expanded} aria-controls={`${id}-code`} onClick={() => setExpanded(!expanded)}>
        <DocsIcon data={codeIcon} size={20} />
        <PencilText>{t(expanded ? '隐藏源码' : '查看源码')}</PencilText>
        <span style={{ transform: expanded ? 'rotate(180deg)' : undefined }}><DocsIcon data={chevronDownIcon} size={16} /></span>
      </button>
      {expanded && codeActions && <span className="component-example__code-actions">{codeActions}</span>}
      </footer>
      <div id={`${id}-code`} hidden={!expanded}>
        {expanded && <CodeBlock className="component-example__code" code={code} />}
      </div>
    </PencilSurface>
  </section>;
}
