import { useRef, useState, type ReactNode } from 'react';
import { PencilLine, PencilSurface } from '@inkra/react';
import { __iconData as codeIcon } from 'lucide-react/dist/esm/icons/code-xml.mjs';
import { __iconData as chevronDownIcon } from 'lucide-react/dist/esm/icons/chevron-down.mjs';
import { DocsIcon } from './DocsIcon';
import { PencilText, useLocale } from '../i18n';
import './ComponentExample.css';

export function ComponentExample({ title, code, children }: { title: string; code: string; children: ReactNode }) {
  const [expanded, setExpanded] = useState(false);
  const { t } = useLocale();
  const documentationCode = useRef(code).current;
  return <section className="component-example" data-doc-code={documentationCode}>
    <PencilSurface variant="paper" radius={8} className="component-example__frame">
      <header className="component-example__header"><PencilText as="h2">{title}</PencilText><PencilLine /></header>
      <div className="component-example__preview">{children}</div>
      <PencilLine />
      <button type="button" className="component-example__disclosure" aria-expanded={expanded} onClick={() => setExpanded(!expanded)}>
        <DocsIcon data={codeIcon} size={20} />
        <PencilText>{t(expanded ? '隐藏源码' : '查看源码')}</PencilText>
        <span style={{ transform: expanded ? 'rotate(180deg)' : undefined }}><DocsIcon data={chevronDownIcon} size={16} /></span>
      </button>
      {expanded && <pre className="component-example__code"><code>{code}</code></pre>}
    </PencilSurface>
  </section>;
}
