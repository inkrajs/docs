import { useId, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Button, RadioGroup, RadioGroupItem } from '@inkra/react';
import { __iconData as phoneIcon } from 'lucide-react/dist/esm/icons/smartphone.mjs';
import { __iconData as tabletIcon } from 'lucide-react/dist/esm/icons/tablet.mjs';
import { __iconData as monitorIcon } from 'lucide-react/dist/esm/icons/monitor.mjs';
import { __iconData as expandIcon } from 'lucide-react/dist/esm/icons/expand.mjs';
import { __iconData as shrinkIcon } from 'lucide-react/dist/esm/icons/shrink.mjs';
import { DocsIcon } from '../DocsIcon';
import { PencilText, useLocale } from '../../i18n';
import { waitForPreviewReadiness } from './layoutPreviewReadiness';
import { collectPreviewStyleSources, isPreviewStyleSource, reconcilePreviewStyleOrder, type PreviewStyleSource } from './layoutStyleMirror';

export function LayoutViewport({ children }: { children: ReactNode }) {
  const { locale } = useLocale();
  const zh = locale === 'zh-CN';
  const name = useId();
  const [width, setWidth] = useState(() => window.innerWidth <= 480 ? '390' : '1024');
  const [fit, setFit] = useState(true);
  const [size, setSize] = useState({ available: 0, height: 560 });
  const viewport = useRef<HTMLDivElement>(null);
  const frame = useRef<HTMLIFrameElement>(null);
  const resizeFrame = useRef(0);
  const [mount, setMount] = useState<HTMLElement | null>(null);
  const [styleReady, setStyleReady] = useState(false);
  useLayoutEffect(() => {
    if (!mount) return;
    setStyleReady(false);
    const target = mount.ownerDocument;
    const mirroredStyles = new Map<Element, HTMLElement>();
    const mirroredLinkCleanups = new Map<Element, () => void>();
    const pendingStyles = new Set<Element>();
    const styleAnchor = target.createElement('meta');
    styleAnchor.dataset.previewStyleAnchor = '';
    target.head.append(styleAnchor);
    const previewAttributes = ['data-theme', 'data-inkra-theme', 'dir', 'lang'] as const;
    let mirroredTokenNames = new Set<string>();
    let attributeFrame = 0;
    let styleFrame = 0;
    let resourceRevision = 0;
    let portalMounted = false;
    let disposed = false;
    const invalidateAppearance = () => {
      if (!portalMounted) return;
      resourceRevision += 1;
      target.documentElement.style.setProperty('--inkra-preview-resource-revision', String(resourceRevision));
    };
    const syncAttributes = () => {
      for (const name of previewAttributes) {
        const value = document.documentElement.getAttribute(name);
        if (value === null) target.documentElement.removeAttribute(name);
        else if (target.documentElement.getAttribute(name) !== value) target.documentElement.setAttribute(name, value);
      }
      const nextTokenNames = new Set<string>();
      const sourceStyle = document.documentElement.style;
      const targetStyle = target.documentElement.style;
      for (let index = 0; index < sourceStyle.length; index += 1) {
        const name = sourceStyle.item(index);
        if (!name.startsWith('--inkra-')) continue;
        nextTokenNames.add(name);
        const value = sourceStyle.getPropertyValue(name);
        const priority = sourceStyle.getPropertyPriority(name);
        if (targetStyle.getPropertyValue(name) !== value || targetStyle.getPropertyPriority(name) !== priority) {
          targetStyle.setProperty(name, value, priority);
        }
      }
      for (const name of mirroredTokenNames) {
        if (!nextTokenNames.has(name)) targetStyle.removeProperty(name);
      }
      mirroredTokenNames = nextTokenNames;
    };
    const mirrorStyle = (source: Element) => {
      if (!source.isConnected || !document.head.contains(source) || !isPreviewStyleSource(source)) {
        mirroredLinkCleanups.get(source)?.();
        mirroredLinkCleanups.delete(source);
        mirroredStyles.get(source)?.remove();
        mirroredStyles.delete(source);
        return;
      }
      let copy = mirroredStyles.get(source);
      if (!copy) {
        copy = source.cloneNode(true) as HTMLElement;
        copy.dataset.previewStyle = '';
        mirroredStyles.set(source, copy);
        if (copy.tagName === 'LINK') {
          const onLoad = () => invalidateAppearance();
          copy.addEventListener('load', onLoad);
          mirroredLinkCleanups.set(source, () => copy?.removeEventListener('load', onLoad));
        }
        target.head.insertBefore(copy, styleAnchor);
        return;
      }
      for (const attribute of [...copy.attributes]) {
        if (attribute.name !== 'data-preview-style' && !source.hasAttribute(attribute.name)) copy.removeAttribute(attribute.name);
      }
      for (const attribute of [...source.attributes]) {
        if (copy.getAttribute(attribute.name) !== attribute.value) copy.setAttribute(attribute.name, attribute.value);
      }
      if (source.tagName === 'STYLE') {
        const sourceStyle = source as HTMLStyleElement;
        const copyStyle = copy as HTMLStyleElement;
        if (copyStyle.textContent !== sourceStyle.textContent) copyStyle.textContent = sourceStyle.textContent;
        copyStyle.disabled = sourceStyle.disabled;
        return;
      }
      if (source.tagName === 'LINK') {
        const sourceLink = source as HTMLLinkElement;
        const copyLink = copy as HTMLLinkElement;
        if (copyLink.href !== sourceLink.href) copyLink.href = sourceLink.href;
        copyLink.disabled = sourceLink.disabled;
      }
    };
    const flushStyles = () => {
      styleFrame = 0;
      for (const source of pendingStyles) mirrorStyle(source);
      pendingStyles.clear();
      reconcilePreviewStyleOrder(
        [...document.head.querySelectorAll<PreviewStyleSource>('style, link[rel="stylesheet"]')],
        mirroredStyles,
        target.head,
        styleAnchor,
      );
      invalidateAppearance();
    };
    const queueStyle = (source: Element) => {
      pendingStyles.add(source);
      if (!styleFrame) styleFrame = requestAnimationFrame(flushStyles);
    };
    const queueAttributes = () => {
      if (!attributeFrame) attributeFrame = requestAnimationFrame(() => {
        attributeFrame = 0;
        syncAttributes();
      });
    };
    syncAttributes();
    document.head.querySelectorAll('style, link[rel="stylesheet"]').forEach(mirrorStyle);
    reconcilePreviewStyleOrder(
      [...document.head.querySelectorAll<PreviewStyleSource>('style, link[rel="stylesheet"]')],
      mirroredStyles,
      target.head,
      styleAnchor,
    );
    const readinessController = new AbortController();
    const targetWindow = target.defaultView;
    void waitForPreviewReadiness({
      links: [...mirroredStyles.values()].filter(node => node.tagName === 'LINK') as HTMLLinkElement[],
      fonts: target.fonts,
      signal: readinessController.signal,
      requestFrame: targetWindow?.requestAnimationFrame.bind(targetWindow),
      cancelFrame: targetWindow?.cancelAnimationFrame.bind(targetWindow),
    }).then(result => {
      if (disposed || result.styles === 'aborted' || result.fonts === 'aborted' || result.frames === 'aborted') return;
      if (frame.current) frame.current.dataset.previewReadiness = `${result.styles}/${result.fonts}/${result.frames}`;
      portalMounted = true;
      setStyleReady(true);
    });
    const attributeObserver = new MutationObserver(queueAttributes);
    const styleObserver = new MutationObserver(records => {
      for (const record of records) {
        if (record.type === 'childList') {
          for (const node of record.removedNodes) {
            if (node instanceof Element) {
              if (mirroredStyles.has(node)) queueStyle(node);
              for (const source of collectPreviewStyleSources(node)) {
                if (mirroredStyles.has(source)) queueStyle(source);
              }
            }
          }
          for (const node of record.addedNodes) {
            if (node instanceof Element) {
              for (const source of collectPreviewStyleSources(node)) queueStyle(source);
            }
          }
        }
        const targetElement = record.target instanceof Element ? record.target : record.target.parentElement;
        const owner = targetElement && (mirroredStyles.has(targetElement) || isPreviewStyleSource(targetElement))
          ? targetElement
          : targetElement?.closest('style, link[rel="stylesheet"]');
        if (owner) queueStyle(owner);
      }
    });
    attributeObserver.observe(document.documentElement, { attributeFilter: [...previewAttributes, 'style'], attributes: true });
    styleObserver.observe(document.head, { attributes: true, childList: true, subtree: true, characterData: true });
    return () => {
      disposed = true;
      readinessController.abort();
      attributeObserver.disconnect();
      styleObserver.disconnect();
      if (attributeFrame) cancelAnimationFrame(attributeFrame);
      if (styleFrame) cancelAnimationFrame(styleFrame);
      pendingStyles.clear();
      for (const cleanup of mirroredLinkCleanups.values()) cleanup();
      mirroredLinkCleanups.clear();
      for (const copy of mirroredStyles.values()) copy.remove();
      mirroredStyles.clear();
      styleAnchor.remove();
      target.documentElement.style.removeProperty('--inkra-preview-resource-revision');
      if (frame.current) delete frame.current.dataset.previewReadiness;
    };
  }, [mount]);
  useLayoutEffect(() => {
    if (!mount) return;
    const measure = () => {
      resizeFrame.current = 0;
      const available = Math.round(viewport.current?.clientWidth ?? 0);
      const measuredHeight = mount.getBoundingClientRect().height;
      if (!available || measuredHeight < 1) return;
      const height = Math.ceil(measuredHeight);
      setSize(previous =>
        Math.abs(previous.available - available) < 1 && Math.abs(previous.height - height) < 1
          ? previous
          : { available, height });
    };
    const observer = new ResizeObserver(() => {
      if (!resizeFrame.current) resizeFrame.current = requestAnimationFrame(measure);
    });
    observer.observe(viewport.current!);
    observer.observe(mount);
    measure();
    return () => {
      observer.disconnect();
      if (resizeFrame.current) cancelAnimationFrame(resizeFrame.current);
      resizeFrame.current = 0;
    };
  }, [mount]);
  const scale = fit && size.available ? Math.min(1, size.available / Number(width)) : 1;
  const zoomLabel = fit ? (zh ? '原尺寸查看' : 'Actual size') : (zh ? '适应宽度' : 'Fit to width');
  return <div className="layout-viewport">
    <div className="layout-viewport__toolbar">
      <RadioGroup name={name} className="layout-viewport__sizes" aria-label={zh ? '预览容器宽度' : 'Preview container width'}
        variant="segmented" orientation="horizontal" value={width} onValueChange={setWidth}>
        <RadioGroupItem value="390" label="390" icon={<DocsIcon data={phoneIcon} size={20} />} />
        <RadioGroupItem value="768" label="768" icon={<DocsIcon data={tabletIcon} size={20} />} />
        <RadioGroupItem value="1024" label="1024" icon={<DocsIcon data={monitorIcon} size={20} />} />
      </RadioGroup>
      <Button variant="ghost" size="icon" aria-label={zoomLabel} data-tooltip={zoomLabel} aria-pressed={!fit} onClick={() => setFit(value => !value)}>
        <DocsIcon data={fit ? expandIcon : shrinkIcon} />
      </Button>
      <PencilText as="output" className="layout-viewport__dimensions" aria-live="polite">{`${width} px · ${Math.round(scale * 100)}%`}</PencilText>
    </div>
    <div ref={viewport} className="layout-viewport__scroll" tabIndex={0} role="region" aria-label={zh ? '布局预览' : 'Layout preview'}>
      <div className="layout-viewport__extent" style={{ width: Number(width) * scale, height: size.height * scale }}>
        <iframe ref={frame} className="layout-viewport__canvas" data-preview-width={width}
          title={zh ? '笔记工作台尺寸预览' : 'Notebook size preview'}
          srcDoc={'<!doctype html><html><head><meta charset="utf-8"></head><body style="margin:0;min-height:0"><div id="layout-preview-root"></div></body></html>'}
          onLoad={() => {
            setStyleReady(false);
            setMount(frame.current?.contentDocument?.getElementById('layout-preview-root') ?? null);
          }}
          style={{ width: Number(width), height: size.height, transform: `scale(${scale})` }} />
      </div>
    </div>
    {mount && styleReady && createPortal(children, mount)}
  </div>;
}
