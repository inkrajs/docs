import { useId, useLayoutEffect, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { Button, PencilLine, PencilSurface } from '@inkra/react';
import { __iconData as monitorIcon } from 'lucide-react/dist/esm/icons/monitor.mjs';
import { __iconData as codeIcon } from 'lucide-react/dist/esm/icons/code-xml.mjs';
import { __iconData as copyIcon } from 'lucide-react/dist/esm/icons/copy.mjs';
import { __iconData as settingsIcon } from 'lucide-react/dist/esm/icons/settings-2.mjs';
import { DocsIcon } from './DocsIcon';
import { CodeBlock } from './CodeBlock';
import { PencilText, useLocale } from '../i18n';
import { usePlaygroundMotion } from './usePlaygroundMotion';
import { DocsControlContext } from './DocsControlContext';
import './ComponentExample.css';

export function ComponentPlayground({ code, controls, children }: { code: string; controls: ReactNode; children: ReactNode }) {
  const { t } = useLocale();
  const id = useId();
  const documentationCode = useRef(code).current;
  const [view, setView] = useState<'preview' | 'code'>('preview');
  const [announcement, setAnnouncement] = useState('');
  const rootRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const displayRef = useRef<HTMLDivElement>(null);
  const controlsRef = useRef<HTMLDivElement>(null);
  const [layout, setLayout] = useState<'wide' | 'overlay' | 'full'>('full');
  const [controlsChoice, setControlsChoice] = useState<boolean>();
  const controlsOpen = controlsChoice ?? layout === 'wide';
  const overlayOpen = controlsOpen && layout !== 'wide';
  const controlsPresent = usePlaygroundMotion({ rootRef, displayRef, controlsRef, controlsOpen, explicitChoice: controlsChoice !== undefined, layout, view });
  const [controlsMounted, setControlsMounted] = useState(false);
  useLayoutEffect(() => {
    // First mount in a measurable panel; keep fields mounted after later closes.
    if (controlsPresent) setControlsMounted(true);
  }, [controlsPresent]);
  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const update = (width: number) => setLayout(width >= 840 ? 'wide' : width >= 480 ? 'overlay' : 'full');
    update(root.clientWidth);
    const observer = new ResizeObserver(entries => update(entries[0].contentRect.width));
    observer.observe(root);
    return () => observer.disconnect();
  }, []);
  useLayoutEffect(() => {
    if ((overlayOpen && displayRef.current?.contains(document.activeElement))
      || (!controlsOpen && controlsRef.current?.contains(document.activeElement))) toggleRef.current?.focus();
  }, [controlsOpen, overlayOpen]);
  function closeControls(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key !== 'Escape' || !controlsOpen || event.defaultPrevented) return;
    event.preventDefault();
    event.stopPropagation();
    setControlsChoice(false);
    toggleRef.current?.focus();
  }
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
  return <PencilSurface ref={rootRef} className="playground component-playground" variant="paper" radius={8} data-doc-code={documentationCode} data-controls-layout={layout} data-controls-open={controlsOpen} data-controls-present={controlsPresent} onKeyDown={closeControls}>
    <div className="playground-toolbar">
      <div className="view-tabs" role="tablist" aria-label={t('示例视图')} onKeyDown={navigateTabs}>
        {([['preview', '预览', monitorIcon], ['code', '代码', codeIcon]] as const).map(([value, label, icon]) => <button key={value} type="button" className="view-tab" role="tab" id={`${id}-tab-${value}`} aria-controls={`${id}-panel-${value}`} aria-selected={view === value} tabIndex={view === value ? 0 : -1} onClick={() => setView(value)}>
          {view === value && <PencilSurface aria-hidden="true" className="selection-backdrop" variant="selection" seed={`${id}-selection-${value}`} />}
          <span className="selection-control-content"><DocsIcon data={icon} active={view === value} size={26} /><PencilText>{label}</PencilText></span>
        </button>)}
      </div>
      <div className="playground-toolbar__actions">
        {view === 'code' && <Button variant="ghost" size="icon" className="icon-button" aria-label={t('复制代码')} data-tooltip={t('复制代码')} onClick={() => void copyCode()}><DocsIcon data={copyIcon} size={22} /></Button>}
        <Button ref={toggleRef} variant="ghost" size="icon" className="icon-button playground-config-toggle" aria-label={t(controlsOpen ? '收起属性配置' : '展开属性配置')} data-tooltip={t(controlsOpen ? '收起属性配置' : '展开属性配置')} aria-controls={`${id}-properties`} aria-expanded={controlsOpen} onClick={() => setControlsChoice(!controlsOpen)}><DocsIcon data={settingsIcon} active={controlsOpen} size={22} /></Button>
      </div>
    </div>
    <PencilLine className="tool-divider" />
    <div className="preview-workspace">
      <div ref={displayRef} className="preview-display" inert={overlayOpen} aria-hidden={overlayOpen || undefined}>
        <div className="preview-stage" role="tabpanel" tabIndex={0} id={`${id}-panel-preview`} aria-labelledby={`${id}-tab-preview`} aria-hidden={view !== 'preview'} inert={view !== 'preview'}>{children}</div>
        <div className="code-panel" role="tabpanel" tabIndex={0} id={`${id}-panel-code`} aria-labelledby={`${id}-tab-code`} hidden={view !== 'code'}>{view === 'code' && <CodeBlock code={code} />}</div>
      </div>
      <PencilLine className="preview-controls-divider" orientation="vertical" />
      <div ref={controlsRef} className="preview-controls" role="group" id={`${id}-properties`} aria-label={t('属性')} hidden={!controlsPresent} inert={!controlsOpen} aria-hidden={!controlsOpen || undefined}>
        <PencilSurface className="preview-controls__paper" variant="full" aria-hidden="true" />
        <DocsControlContext.Provider value={true}>{controlsMounted ? controls : null}</DocsControlContext.Provider>
      </div>
    </div>
    <span role="status" className="visually-hidden">{announcement}</span>
  </PencilSurface>;
}
