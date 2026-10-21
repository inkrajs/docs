import assert from 'node:assert/strict';

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const browser = await chromium.launch();
try {
  for (const width of [1305, 390]) {
    const page = await browser.newPage({ viewport: { width, height: 954 } });
    for (const route of ['components/input#preview', 'components/button#preview', 'components/select#api', 'getting-started', 'design-standard']) {
      await page.goto(`http://127.0.0.1:4180/${route}`);
      await page.locator('.documentation > .page-heading').waitFor();
      const spacing = await page.evaluate(() => {
        const article = document.querySelector('.documentation');
        const heading = article.querySelector('.page-heading');
        const section = article.querySelector('.content-section');
        const tabs = article.querySelector('.page-tabs');
        const examples = article.querySelector('.component-examples');
        const style = getComputedStyle(article);
        return {
          padding: [style.paddingTop, style.paddingRight, style.paddingBottom, style.paddingLeft],
          heading: getComputedStyle(heading).paddingBottom,
          content: getComputedStyle(section).paddingTop,
          tabs: tabs && getComputedStyle(tabs).marginBottom,
          gap: examples && getComputedStyle(examples).rowGap,
          overflow: document.documentElement.scrollWidth > innerWidth,
        };
      });
      assert.deepEqual(spacing.padding, ['20px', '20px', '20px', '20px'], route);
      assert.equal(spacing.heading, '20px', route);
      assert.equal(spacing.content, '20px', route);
      if (spacing.tabs) assert.equal(spacing.tabs, '20px', route);
      if (spacing.gap) assert.equal(spacing.gap, '20px', route);
      assert.equal(spacing.overflow, false, route);
      console.log(`PASS ${route} at ${width}px: page spacing 20px`);
    }
    await page.close();
  }
} finally {
  await browser.close();
}
