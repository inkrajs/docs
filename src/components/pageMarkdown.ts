// Export documentation, never live form values or playground output.
export function pageMarkdown(article: HTMLElement): string {
  const blocks: string[] = [];
  const text = (node: Element) => (node.textContent ?? '').trim();
  const inline = (node: Element) => text(node).replaceAll('|', '\\|').replaceAll('\n', ' ');
  const visit = (node: Element) => {
    if (node.matches('.page-heading__actions, .preview-controls, .component-example__preview, .preview-stage, .comparison-grid, .playground-toolbar, [role="tablist"], .component-example__disclosure, .page-heading__status, canvas, input, textarea, select, button, output, [role="status"]')) return;
    if (node.hasAttribute('data-doc-code')) {
      const heading = node.querySelector('h2');
      if (heading) blocks.push(`## ${text(heading)}`);
      blocks.push('```tsx\n' + node.getAttribute('data-doc-code') + '\n```');
      return;
    }
    // Modal menus temporarily aria-hide the page; that does not hide its documentation.
    if (node.matches('[hidden]')) return;
    if (/^H[1-6]$/.test(node.tagName)) { blocks.push(`${'#'.repeat(Number(node.tagName[1]))} ${text(node)}`); return; }
    if (node.matches('pre')) { blocks.push('```\n' + text(node) + '\n```'); return; }
    if (node.matches('p, li')) { if (text(node)) blocks.push(`${node.matches('li') ? '- ' : ''}${text(node)}`); return; }
    if (node.matches('table')) {
      const rows = Array.from(node.querySelectorAll('tr')).map(row => Array.from(row.querySelectorAll('th, td')).map(inline));
      if (rows.length) blocks.push([rows[0], rows[0].map(() => '---'), ...rows.slice(1)].map(row => `| ${row.join(' | ')} |`).join('\n'));
      return;
    }
    Array.from(node.children).forEach(visit);
  };
  visit(article);
  return blocks.join('\n\n') + '\n';
}
