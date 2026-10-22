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

export function LayoutViewport({ children }: { children: ReactNode }) {
  const { locale } = useLocale();
  const zh = locale === 'zh-CN';
  const name = useId();
  const [width, setWidth] = useState(() => window.innerWidth <= 480 ? '390' : '1024');
  const [fit, setFit] = useState(true);
  const [size, setSize] = useState({ available: 0, height: 560 });
  const viewport = useRef<HTMLDivElement>(null);
  const frame = useRef<HTMLIFrameElement>(null);
  const [mount, setMount] = useState<HTMLElement | null>(null);
  useLayoutEffect(() => {
    if (!mount) return;
    const target = mount.ownerDocument;
    const sync = () => {
      for (const attribute of [...target.documentElement.attributes]) target.documentElement.removeAttribute(attribute.name);
      for (const attribute of [...document.documentElement.attributes]) target.documentElement.setAttribute(attribute.name, attribute.value);
      target.head.querySelectorAll('[data-preview-style]').forEach(node => node.remove());
      document.head.querySelectorAll('style, link[rel="stylesheet"]').forEach(node => {
        const copy = node.cloneNode(true) as HTMLElement;
        copy.dataset.previewStyle = '';
        target.head.append(copy);
      });
    };
    sync();
    const observer = new MutationObserver(sync);
    observer.observe(document.documentElement, { attributes: true });
    observer.observe(document.head, { childList: true, subtree: true, characterData: true });
    return () => observer.disconnect();
  }, [mount]);
  useLayoutEffect(() => {
    if (!mount) return;
    const observer = new ResizeObserver(() => {
      const available = viewport.current?.clientWidth ?? 0;
      const height = mount.offsetHeight;
      if (available && height) setSize(previous => previous.available === available && previous.height === height ? previous : { available, height });
    });
    observer.observe(viewport.current!);
    observer.observe(mount);
    return () => observer.disconnect();
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
          onLoad={() => setMount(frame.current?.contentDocument?.getElementById('layout-preview-root') ?? null)}
          style={{ width: Number(width), height: size.height, transform: `scale(${scale})` }} />
      </div>
    </div>
    {mount && createPortal(children, mount)}
  </div>;
}
