import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const base = process.env.INKRA_DOCS_URL || 'http://127.0.0.1:4180';
const source = [
  '# Document title', '## Section title', '### Small heading',
  'Paragraph with **strong**, *emphasis*, ~~deleted~~, `inline code` and a [link](#section).',
  'Baseline [Baseline](#baseline) Baseline',
  '文字基线 [文字基线](#baseline-zh) 文字基线',
  '`ABC` `DEF` `ABC`',
  '- Ordinary item\n- [x] Completed task\n- [ ] Remaining task',
  '7. Seventh item\n8. Eighth item\n\n    3. Nested third\n    4. Nested fourth',
  'Ordered tasks\n\n1. [x] Ordered complete\n2. [ ] Ordered pending',
  'Large ordinals\n\n99. Last two-digit item\n100. First three-digit item',
  '~~' + 'Wrapped deleted text remains readable. '.repeat(7).trimEnd() + '~~',
  '> Quoted **content**\n>\n> - A nested list',
  '```\nconst longLine = "' + 'abcdefghij'.repeat(18) + '";\n```',
  '```js\nconst answer = 42;\n```',
  '    const indented = true;',
  '| Name | Status |\n| :--- | ---: |\n| Short | Ready |',
  '| Wide data | Value |\n| --- | --- |\n| `' + 'x'.repeat(150) + '` | 123 |',
  '---', '![Pencil artwork](/favicon.png)',
  '[unsafe](javascript:alert(1))\n\n![blocked image](data:text/html,unsafe)\n\n<script>window.markdownUnsafe = true</script>',
].join('\n\n');
const browser = await chromium.launch();
try {
  for (const [width, theme] of [[1305, 'light'], [390, 'dark'], [320, 'light']]) {
    const page = await browser.newPage({ viewport: { width, height: 954 }, reducedMotion: 'reduce' });
    page.setDefaultTimeout(15000);
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(`${base}/docs/components/markdown#preview`);
    await page.evaluate(async ({ source, theme }) => {
      const { React: R, ReactDOM, ReactDOMClient, Markdown } = await import('/scripts/fixtures/markdown.mjs');
      document.getElementById('root').style.display = 'none';
      document.documentElement.dataset.inkraTheme = theme;
      const host = document.createElement('main');
      host.id = 'markdown-fixture';
      Object.assign(host.style, { padding: '20px', maxWidth: '780px', margin: '0 auto' });
      document.body.prepend(host);
      const root = ReactDOMClient.createRoot(host);
      window.renderMarkdown = (props = {}) => ReactDOM.flushSync(() => root.render(R.createElement(Markdown, {
        labels: { code: 'Code sample', table: 'Data table', taskChecked: 'Completed', taskUnchecked: 'Pending' },
        ...props,
      }, source)));
      window.renderMarkdown();
    }, { source, theme });
    const markdown = page.locator('#markdown-fixture .inkra-markdown');
    await page.evaluate(() => document.fonts.ready);
    const washHashes = await markdown.locator('code[data-inline]').evaluateAll(nodes => nodes.filter(node => ['ABC', 'DEF'].includes(node.textContent)).map(node => node.querySelector('.inkra-markdown__code-wash canvas').toDataURL()));
    assert.equal(washHashes.length, 3);
    assert.equal(washHashes[0], washHashes[2], 'equal content has equal deterministic wash');
    assert.notEqual(washHashes[0], washHashes[1], 'equal-sized different content has different wash');
    for (const href of ['#baseline', '#baseline-zh']) {
      const baselineLink = markdown.locator(`a[href="${href}"]`);
      await baselineLink.scrollIntoViewIfNeeded();
      for (const state of ['normal', 'hover', 'focus']) {
        if (state === 'hover') await baselineLink.hover();
        if (state === 'focus') await baselineLink.focus();
        const geometry = await baselineLink.evaluate(link => {
          const paragraph = link.closest('p');
          const text = [...paragraph.querySelectorAll('.inkra-pencil-text__source')].map(node => {
            const range = document.createRange();
            range.selectNodeContents(node);
            return range.getBoundingClientRect().top;
          });
          const line = link.querySelector('.inkra-markdown__link-line');
          const height = paragraph.getBoundingClientRect().height;
          line.style.display = 'none';
          const undecoratedHeight = paragraph.getBoundingClientRect().height;
          line.style.display = '';
          return { text, height, undecoratedHeight, position: getComputedStyle(line).position };
        });
        assert(Math.max(...geometry.text) - Math.min(...geometry.text) < 1, `link preserves surrounding text baseline (${width}, ${href}, ${state}): ${JSON.stringify(geometry)}`);
        assert.equal(geometry.height, geometry.undecoratedHeight, 'underline never changes line height');
        assert.equal(geometry.position, 'absolute');
      }
    }
    assert.equal(await markdown.locator('h1').textContent(), 'Document title');
    assert.equal(await markdown.locator('h2').textContent(), 'Section title');
    assert.equal(await markdown.locator('strong').count(), 2);
    assert.equal(await markdown.locator('em, del').count(), 3);
    assert.equal(await markdown.locator('pre').count(), 3, 'all fenced and indented code are blocks');
    assert.deepEqual(await markdown.locator('.inkra-markdown__code-language').allTextContents(), ['Plain text', 'JavaScript', 'Plain text']);
    assert.equal(await markdown.locator('.inkra-card.inkra-markdown__code-frame').count(), 3);
    const frame = markdown.locator('.inkra-markdown__code-frame').nth(1);
    await page.evaluate(() => Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async value => { window.copiedMarkdown = value; } } }));
    await frame.getByRole('button', { name: 'Copy code', exact: true }).click();
    await frame.getByRole('button', { name: 'Code copied', exact: true }).waitFor();
    assert.equal(await page.evaluate(() => window.copiedMarkdown), 'const answer = 42;\n', 'copy excludes the language header and preserves the original source');
    await page.evaluate(() => Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async () => { throw new Error('Denied'); } } }));
    await frame.getByRole('button', { name: 'Code copied', exact: true }).click();
    await frame.getByRole('button', { name: 'Copy failed. Select the code to copy it manually.', exact: true }).waitFor();
    assert.equal(await frame.locator('pre').textContent(), 'const answer = 42;\n');
    assert(await markdown.locator('pre').first().evaluate(node => node.scrollWidth > node.clientWidth), 'long code scrolls locally');
    assert(await markdown.locator('pre > code').evaluateAll(nodes => nodes.every(node => getComputedStyle(node).backgroundColor === 'rgba(0, 0, 0, 0)')));
    assert.equal(await markdown.locator('ol[start="7"] > li').count(), 2);
    assert.equal(await markdown.locator('ol[start="3"] > li').count(), 2);
    assert.equal(await markdown.locator('input[type="checkbox"]').count(), 4);
    assert.equal(await markdown.locator('.inkra-checkbox input[type="checkbox"]').count(), 4, 'tasks use the actual Checkbox');
    assert(await markdown.locator('.inkra-markdown__task-row').evaluateAll(nodes => nodes.every(node => {
      const checkbox = node.querySelector('.inkra-checkbox').getBoundingClientRect();
      const text = node.querySelector('.inkra-markdown__task-content').getBoundingClientRect();
      return text.left - checkbox.right >= 7;
    })), 'checkbox and text occupy distinct columns');
    assert(await markdown.locator('input[type="checkbox"]').evaluateAll(nodes => nodes.every(node => node.disabled)));
    assert.equal(await markdown.getByRole('link', { name: 'unsafe', exact: true }).count(), 0);
    assert.equal(await markdown.locator('script, [onerror], img[src^="data:"]').count(), 0);
    assert.equal(await page.evaluate(() => window.markdownUnsafe), undefined);
    const orderedColumns = await markdown.locator('ol[start="99"] > li > .inkra-markdown__list-content').evaluateAll(nodes => nodes.map(node => node.getBoundingClientRect().left));
    assert.equal(orderedColumns[0], orderedColumns[1], '99 and 100 share a hanging content column');
    const deletion = markdown.locator('del').last();
    await deletion.scrollIntoViewIfNeeded();
    await deletion.locator('.inkra-markdown__strike').first().waitFor();
    assert(await deletion.locator('.inkra-markdown__strike').count() >= 2, 'wrapped deletion gets one pencil strike per line');
    assert(await deletion.evaluate(node => {
      const box = node.getBoundingClientRect();
      return [...node.querySelectorAll('.inkra-markdown__strike')].every(line => {
        const rect = line.getBoundingClientRect();
        return rect.left >= box.left - 1 && rect.right <= box.right + 1 && rect.top >= box.top && rect.bottom <= box.bottom;
      });
    }), 'strikes remain inside their real text block');
    await deletion.screenshot({ path: `/tmp/inkra-markdown-deletion-${width}.png` });
    const image = markdown.getByRole('img', { name: 'Pencil artwork' });
    await image.scrollIntoViewIfNeeded();
    await page.waitForFunction(node => node.complete && node.naturalWidth > 0, await image.elementHandle());
    const link = markdown.getByRole('link', { name: 'link', exact: true });
    await link.focus();
    await page.evaluate(() => {
      window.oldMarkdownLink = document.querySelector('#markdown-fixture a');
      window.renderMarkdown({ 'data-render': 'second' });
    });
    assert(await link.evaluate(node => node === window.oldMarkdownLink && node === document.activeElement), 'ordinary rerenders retain link DOM and focus');
    assert.deepEqual(await markdown.locator('code[data-inline]').evaluateAll(nodes => nodes.filter(node => ['ABC', 'DEF'].includes(node.textContent)).map(node => node.querySelector('.inkra-markdown__code-wash canvas').toDataURL())), washHashes, 'rerenders do not randomize inline code');
    const code = markdown.locator('pre').first();
    await code.focus();
    await code.press('End');
    await code.press('ArrowRight');
    await page.waitForFunction(node => node.scrollLeft > 0, await code.elementHandle());
    assert.equal(await markdown.locator('pre').nth(1).textContent(), 'const answer = 42;\n', 'highlighting preserves exact source');
    const tables = markdown.locator('.inkra-markdown__table');
    assert.equal(await tables.count(), 2);
    assert(await tables.first().evaluate(node => node.scrollWidth <= node.clientWidth + 1), 'small table needs no arbitrary minimum width');
    for (const table of await tables.all()) {
      await table.focus();
      assert(await table.evaluate(node => document.activeElement === node), 'table can be reached for keyboard scrolling');
    }
    await markdown.scrollIntoViewIfNeeded();
    await page.evaluate(() => scrollTo(0, 0));
    await page.screenshot({ path: `/tmp/inkra-markdown-${width}.png`, fullPage: true, animations: 'disabled' });
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'no page overflow');
    const pixels = await markdown.locator('canvas').evaluateAll(nodes => nodes.some(node => {
      const context = node.getContext('2d');
      if (!context || !node.width || !node.height) return false;
      const data = context.getImageData(0, 0, node.width, node.height).data;
      return data.some((value, index) => index % 4 === 3 && value > 0);
    }));
    assert(pixels, 'pencil layers have painted pixels');
    for (const media of [{ forcedColors: 'active' }, { forcedColors: 'none', media: 'print' }]) {
      await page.emulateMedia(media);
      const fallback = await markdown.locator('ul > li:not(.task-list-item), ol > li:not(.task-list-item)').evaluateAll(nodes => nodes.map(node => ({ display: getComputedStyle(node).display, marker: getComputedStyle(node).listStyleType })));
      assert(fallback.every(item => item.display === 'list-item' && item.marker !== 'none'), JSON.stringify(fallback));
      assert(await markdown.locator('input[type="checkbox"]').evaluateAll(nodes => nodes.every(node => node.getBoundingClientRect().width >= 15)), 'task state remains visible without canvases');
      assert(await deletion.locator('.inkra-pencil-text').evaluateAll(nodes => nodes.every(node => getComputedStyle(node).textDecorationLine.includes('line-through'))), 'deletion retains native fallback');
    }
    assert.deepEqual(errors, []);
    console.log(`PASS Markdown semantics, all formats, stable focus, safety, scrolling, pixels and fallbacks: ${width}px ${theme}`);
    await page.close();
  }
  for (const [width, locale] of [[1305, 'zh-CN'], [390, 'en']]) {
    const page = await browser.newPage({ viewport: { width, height: 954 }, reducedMotion: 'reduce' });
    await page.addInitScript(locale => localStorage.setItem('inkra-docs-locale', locale), locale);
    await page.goto(`${base}/docs/components/button#accessibility`);
    const guidance = page.locator('#button-panel-accessibility .inkra-markdown');
    await guidance.waitFor();
    assert.equal(await guidance.locator('ul > li').count(), 6);
    assert(await guidance.locator('code').count() > 5);
    assert.equal(await guidance.locator('a[href="/docs/components/tooltip#accessibility"]').count(), 1);
    assert.equal(await page.locator('#button-panel-accessibility > ul.guidance-list').count(), 0);
    await guidance.scrollIntoViewIfNeeded();
    await page.screenshot({ path: `/tmp/inkra-button-guidance-${width}.png`, animations: 'disabled' });
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    console.log(`PASS real Button Markdown guidance: ${width}px ${locale}`);
    await page.goto(`${base}/docs/components/markdown#preview`);
    const examples = page.locator('.markdown-examples .component-example');
    await examples.nth(3).waitFor();
    if (width > 1000) {
      const navigation = page.locator('.nav-link[aria-current="page"][href$="/components/markdown"]');
      await navigation.scrollIntoViewIfNeeded();
      const icon = navigation.locator('.docs-pencil-icon[data-pencil-icon-ready="true"]');
      await icon.waitFor();
      assert(await icon.evaluate(canvas => canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data.some((value, index) => index % 4 === 3 && value > 0)), 'dedicated sidebar icon is painted');
      await navigation.screenshot({ path: '/tmp/inkra-markdown-navigation.png' });
    }
    for (const [index, name] of [[1, 'typography'], [2, 'tasks'], [3, 'code']]) {
      const example = examples.nth(index);
      await example.scrollIntoViewIfNeeded();
      await page.evaluate(async () => { await document.fonts.ready; await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))); });
      await example.screenshot({ path: `/tmp/inkra-markdown-docs-${name}-${width}.png`, animations: 'disabled' });
    }
    assert.equal(await examples.nth(2).locator('.inkra-checkbox').count(), 2);
    assert(await examples.nth(1).locator('strong em, em strong').count() > 0);
    assert(await examples.nth(3).locator('pre .inkra-pencil-text').count() > 0);
    assert.equal(await examples.nth(3).locator('.inkra-markdown__code-language').textContent(), 'TSX');
    assert.equal(await examples.nth(3).getByRole('button', { name: locale === 'en' ? 'Copy code' : '复制代码', exact: true }).count(), 1);
    await page.close();
  }
} finally { await browser.close(); }
