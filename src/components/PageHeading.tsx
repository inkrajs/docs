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

export function PageHeading({ title, description, showActions = true, titleId }: {
  title: string;
  description?: string | { zh: string; en: string };
  showActions?: boolean;
  titleId?: string;
}) {
  const { locale, t } = useLocale();
  const en = locale !== 'zh-CN';
  const header = useRef<HTMLElement>(null);
  const menu = useRef<HTMLButtonElement>(null);
  const [markdown, setMarkdown] = useState<string | null>(null);
  const [status, setStatus] = useState('');
  const sourceIntro = description ?? componentIntroductions[title];
  const intro = typeof sourceIntro === 'string' ? t(sourceIntro) : sourceIntro && t(sourceIntro.zh, sourceIntro.en);
  const content = () => {
    const article = header.current?.closest('article');
    const view = article?.querySelector('.page-tabs [aria-selected="true"]')?.textContent?.trim();
    return article ? pageMarkdown(article) + (view ? `\n${t("当前视图", "View")}: ${view}\n` : '') : '';
  };
  const copy = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setStatus(t("已复制", "Copied"));
    } catch {
      setStatus(t("复制失败，可在 Markdown 视图中选择文字复制。", "Copy failed. Select the Markdown text to copy manually."));
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
      setStatus(t("剪贴板不可用，请在 Markdown 视图中选择并复制。", "Clipboard unavailable. Select the Markdown and copy it manually."));
      setMarkdown(source);
    });
  };
  return <header className="page-heading" ref={header}>
    <div className="page-heading__row">
      <div className="page-heading__title">
        <DocsIcon data={navigationIcon(title)} size={32} />
        <PencilText as="h1" id={titleId} seed={`${title}-title`}>{title}</PencilText>
      </div>
      {showActions && <ButtonGroup className="page-heading__actions" aria-label={t("页面操作", "Page actions")} variant="outline">
        <Button startIcon={<DocsIcon data={copyIcon} />} onClick={() => void copy(content())}>{t("复制页面", "Copy page")}</Button>
        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild><Button ref={menu} size="icon" aria-label={t("更多页面操作", "More page actions")} title={t("更多页面操作", "More page actions")}><DocsIcon data={chevronDownIcon} size={26} /></Button></DropdownMenu.Trigger>
          <DropdownMenu.Portal><DropdownMenu.Content align="end">
            <DropdownMenu.Item icon={<DocsIcon data={fileTextIcon} />} onSelect={() => setMarkdown(content())}>{t("查看 Markdown", "View as Markdown")}</DropdownMenu.Item>
            {assistantServices.map(service => <DropdownMenu.Item key={service.name} icon={<DocsIcon data={externalLinkIcon} />}
              aria-label={en ? `Open in ${service.name} (opens in a new tab)` : `在 ${service.name} 中打开（新标签页打开）`}
              onSelect={() => openAssistant(service)}>{en ? `Open in ${service.name}` : `在 ${service.name} 中打开`}</DropdownMenu.Item>)}
            <DropdownMenu.Separator />
            <DropdownMenu.Item icon={<DocsIcon data={downloadIcon} />} onSelect={download}>{t("下载 Markdown", "Download Markdown")}</DropdownMenu.Item>
            <DropdownMenu.Item icon={<DocsIcon data={linkIcon} />} onSelect={() => void copy(window.location.href)}>{t("复制页面链接", "Copy page link")}</DropdownMenu.Item>
          </DropdownMenu.Content></DropdownMenu.Portal>
        </DropdownMenu.Root>
      </ButtonGroup>}
    </div>
    {intro && <PencilText as="p" seed={`${title}-description`}>{intro}</PencilText>}
    {showActions && <span className="page-heading__status" role="status">{status}</span>}
    <PencilLine className="page-heading__divider" seed={`${title}-divider`} />
    {showActions && <Overlay.Root open={markdown !== null} onOpenChange={open => { if (!open) setMarkdown(null); }}>
      <Overlay.Portal><Overlay.Backdrop /><Overlay.Content layout="sections" aria-describedby={undefined}
        onCloseAutoFocus={event => { event.preventDefault(); menu.current?.focus(); }}>
        <Overlay.Header closeLabel={t("关闭", "Close")}><Overlay.Title>{`${title} · Markdown`}</Overlay.Title></Overlay.Header>
        <Overlay.Body><pre className="page-markdown">{markdown}</pre></Overlay.Body>
        <Overlay.Footer><Button startIcon={<DocsIcon data={copyIcon} />} onClick={() => void copy(markdown ?? '')}>{t("复制", "Copy")}</Button></Overlay.Footer>
      </Overlay.Content></Overlay.Portal>
    </Overlay.Root>}
  </header>;
}
