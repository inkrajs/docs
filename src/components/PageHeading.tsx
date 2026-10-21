import { useRef, useState } from 'react';
import { Button, ButtonGroup, DropdownMenu, Overlay, PencilLine } from '@inkra/react';
import { __iconData as copyIcon } from 'lucide-react/dist/esm/icons/copy.mjs';
import { __iconData as chevronDownIcon } from 'lucide-react/dist/esm/icons/chevron-down.mjs';
import { __iconData as fileTextIcon } from 'lucide-react/dist/esm/icons/file-text.mjs';
import { __iconData as downloadIcon } from 'lucide-react/dist/esm/icons/download.mjs';
import { __iconData as linkIcon } from 'lucide-react/dist/esm/icons/link.mjs';
import { __iconData as externalLinkIcon } from 'lucide-react/dist/esm/icons/external-link.mjs';
import { PencilText, useLocale } from '../i18n';
import { DocsIcon } from './DocsIcon';
import { navigationIcon } from './iconCatalog';
import { componentIntroductions } from './componentIntroductions';
import { pageMarkdown } from './pageMarkdown';
import { assistantServices, assistantUrl } from './assistantLinks';

export function PageHeading({ title, description }: { title: string; description?: string }) {
  const { locale } = useLocale();
  const en = locale === 'en';
  const header = useRef<HTMLElement>(null);
  const menu = useRef<HTMLButtonElement>(null);
  const [markdown, setMarkdown] = useState<string | null>(null);
  const [status, setStatus] = useState('');
  const intro = description ?? componentIntroductions[title]?.[en ? 'en' : 'zh'];
  const content = () => {
    const article = header.current?.closest('article');
    const view = article?.querySelector('.page-tabs [aria-selected="true"]')?.textContent?.trim();
    return article ? pageMarkdown(article) + (view ? `\n${en ? 'View' : '当前视图'}: ${view}\n` : '') : '';
  };
  const copy = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setStatus(en ? 'Copied' : '已复制');
    } catch {
      setStatus(en ? 'Copy failed. Select the Markdown text to copy manually.' : '复制失败，可在 Markdown 视图中选择文字复制。');
      setMarkdown(value);
    }
  };
  const download = () => {
    const url = URL.createObjectURL(new Blob([content()], { type: 'text/markdown;charset=utf-8' }));
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${title.replaceAll(/[^a-zA-Z0-9\u4e00-\u9fff-]/g, '-')}.md`;
    anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  const openAssistant = (service: typeof assistantServices[number]) => {
    const source = content();
    // Open within the click gesture; clipboard permission may resolve asynchronously.
    window.open(assistantUrl(service, title, en), '_blank', 'noopener,noreferrer');
    void Promise.resolve().then(() => navigator.clipboard.writeText(source)).then(() => {
      setStatus(en ? `Documentation copied. Paste it into ${service.name}.` : `文档已复制，请粘贴到 ${service.name}。`);
    }).catch(() => {
      setStatus(en ? 'Clipboard unavailable. Select the Markdown and copy it manually.' : '剪贴板不可用，请在 Markdown 视图中选择并复制。');
      setMarkdown(source);
    });
  };
  return <header className="page-heading" ref={header}>
    <div className="page-heading__row">
      <div className="page-heading__title">
        <DocsIcon data={navigationIcon(title)} size={32} />
        <PencilText as="h1" seed={`${title}-title`}>{title}</PencilText>
      </div>
      <ButtonGroup className="page-heading__actions" aria-label={en ? 'Page actions' : '页面操作'} variant="outline">
        <Button startIcon={<DocsIcon data={copyIcon} />} onClick={() => void copy(content())}>{en ? 'Copy page' : '复制页面'}</Button>
        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild><Button ref={menu} size="icon" aria-label={en ? 'More page actions' : '更多页面操作'} title={en ? 'More page actions' : '更多页面操作'}><DocsIcon data={chevronDownIcon} size={26} /></Button></DropdownMenu.Trigger>
          <DropdownMenu.Portal><DropdownMenu.Content align="end">
            <DropdownMenu.Item icon={<DocsIcon data={fileTextIcon} />} onSelect={() => setMarkdown(content())}>{en ? 'View as Markdown' : '查看 Markdown'}</DropdownMenu.Item>
            {assistantServices.map(service => <DropdownMenu.Item key={service.name} icon={<DocsIcon data={externalLinkIcon} />}
              aria-label={en ? `Open in ${service.name} (opens in a new tab)` : `在 ${service.name} 中打开（新标签页打开）`}
              onSelect={() => openAssistant(service)}>{en ? `Open in ${service.name}` : `在 ${service.name} 中打开`}</DropdownMenu.Item>)}
            <DropdownMenu.Separator />
            <DropdownMenu.Item icon={<DocsIcon data={downloadIcon} />} onSelect={download}>{en ? 'Download Markdown' : '下载 Markdown'}</DropdownMenu.Item>
            <DropdownMenu.Item icon={<DocsIcon data={linkIcon} />} onSelect={() => void copy(window.location.href)}>{en ? 'Copy page link' : '复制页面链接'}</DropdownMenu.Item>
          </DropdownMenu.Content></DropdownMenu.Portal>
        </DropdownMenu.Root>
      </ButtonGroup>
    </div>
    {intro && <PencilText as="p" seed={`${title}-description`}>{intro}</PencilText>}
    <span className="page-heading__status" role="status">{status}</span>
    <PencilLine className="page-heading__divider" seed={`${title}-divider`} />
    <Overlay.Root open={markdown !== null} onOpenChange={open => { if (!open) setMarkdown(null); }}>
      <Overlay.Portal><Overlay.Backdrop /><Overlay.Content layout="sections" aria-describedby={undefined}
        onCloseAutoFocus={event => { event.preventDefault(); menu.current?.focus(); }}>
        <Overlay.Header closeLabel={en ? 'Close' : '关闭'}><Overlay.Title>{`${title} · Markdown`}</Overlay.Title></Overlay.Header>
        <Overlay.Body><pre className="page-markdown">{markdown}</pre></Overlay.Body>
        <Overlay.Footer><Button startIcon={<DocsIcon data={copyIcon} />} onClick={() => void copy(markdown ?? '')}>{en ? 'Copy' : '复制'}</Button></Overlay.Footer>
      </Overlay.Content></Overlay.Portal>
    </Overlay.Root>
  </header>;
}
