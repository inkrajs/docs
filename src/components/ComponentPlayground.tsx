import { useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { PencilLine, PencilSurface } from '@inkra/react';
import { __iconData as monitorIcon } from 'lucide-react/dist/esm/icons/monitor.mjs';
import { __iconData as codeIcon } from 'lucide-react/dist/esm/icons/code-xml.mjs';
import { __iconData as copyIcon } from 'lucide-react/dist/esm/icons/copy.mjs';
import { DocsIcon } from './DocsIcon';
import { CodeBlock } from './CodeBlock';
import { PencilText, useLocale } from '../i18n';
import './ComponentExample.css';

export function ComponentPlayground({ code, controls, children }: { code: string; controls: ReactNode; children: ReactNode }) {
  const { t } = useLocale();
  const id = useId();
  const documentationCode = useRef(code).current;
  const [view, setView] = useState<'preview' | 'code'>('preview');
  const [announcement, setAnnouncement] = useState('');
  const [compact, setCompact] = useState(() => window.matchMedia('(max-width: 64rem)').matches);
  useEffect(() => {
    const query = window.matchMedia('(max-width: 64rem)');
    const update = () => setCompact(query.matches);
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);
  function navigateTabs(event: KeyboardEvent<HTMLDivElement>) {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const next = event.key === 'Home' ? 'preview' : event.key === 'End' ? 'code' : view === 'preview' ? 'code' : 'preview';
    setView(next);
    document.getElementById(`${id}-tab-${next}`)?.focus();
  }
  async function copyCode() {
    try {
      await navigator.clipboard.writeText(code);
      setAnnouncement(t('示例代码已复制'));
    } catch {
      setAnnouncement(t('复制失败，请手动选择代码'));
    }
  }
  return <PencilSurface className="playground component-playground" variant="paper" radius={8} data-doc-code={documentationCode}>
    <div className="playground-toolbar">
      <div className="view-tabs" role="tablist" aria-label={t('示例视图')} onKeyDown={navigateTabs}>
        {([['preview', '预览', monitorIcon], ['code', '代码', codeIcon]] as const).map(([value, label, icon]) => <button key={value} type="button" className="view-tab" role="tab" id={`${id}-tab-${value}`} aria-controls={`${id}-panel-${value}`} aria-selected={view === value} tabIndex={view === value ? 0 : -1} onClick={() => setView(value)}>
          {view === value && <PencilSurface aria-hidden="true" className="selection-backdrop" variant="selection" seed={`${id}-selection-${value}`} />}
          <span className="selection-control-content"><DocsIcon data={icon} active={view === value} size={26} /><PencilText>{label}</PencilText></span>
        </button>)}
      </div>
      {view === 'code' && <button className="icon-button" type="button" aria-label={t('复制代码')} data-tooltip={t('复制代码')} onClick={() => void copyCode()}><DocsIcon data={copyIcon} size={22} /></button>}
    </div>
    <PencilLine className="tool-divider" />
    <div className="preview-workspace">
      <div className="preview-display">
        <div className="preview-stage" role="tabpanel" tabIndex={0} id={`${id}-panel-preview`} aria-labelledby={`${id}-tab-preview`} hidden={view !== 'preview'}>{children}</div>
        <div className="code-panel" role="tabpanel" tabIndex={0} id={`${id}-panel-code`} aria-labelledby={`${id}-tab-code`} hidden={view !== 'code'}>{view === 'code' && <CodeBlock code={code} />}</div>
      </div>
      <PencilLine className="preview-controls-divider" orientation={compact ? 'horizontal' : 'vertical'} />
      <div className="preview-controls" role="group" aria-label={t('属性')}>{controls}</div>
    </div>
    <span role="status" className="visually-hidden">{announcement}</span>
  </PencilSurface>;
}
