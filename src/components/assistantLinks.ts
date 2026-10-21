// Same prompt entrypoints as shadcn's docs menu. No localhost URL or form data is sent.
export const assistantServices = [
  { name: 'v0', url: 'https://v0.dev' },
  { name: 'ChatGPT', url: 'https://chatgpt.com' },
  { name: 'Claude', url: 'https://claude.ai/new' },
  { name: 'Scira', url: 'https://scira.ai/' },
] as const;

export function assistantUrl(service: typeof assistantServices[number], title: string, english: boolean): string {
  const url = new URL(service.url);
  url.searchParams.set('q', english
    ? `Help me use Inkra's ${title} documentation. I will paste the Markdown copied from my local docs. Please wait for that content before explaining it or suggesting code.`
    : `请帮我理解和使用 Inkra 的 ${title} 文档。我会粘贴从本地文档页复制的 Markdown，请等我贴出内容后，再基于它解释用法或编写代码。`);
  return url.href;
}
