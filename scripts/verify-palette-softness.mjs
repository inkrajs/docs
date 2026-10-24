import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1305, height: 954 }, reducedMotion: 'reduce' });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('http://127.0.0.1:4180/docs/design-standard');
  await page.locator('.color-palette__applications').waitFor();
  const tokenNames = ['--inkra-accent', '--inkra-accent-soft', '--inkra-accent-strong',
    '--inkra-on-accent', '--inkra-selection-pigment', '--inkra-selection-foreground'];
  for (const palette of ['玄墨', '沧浪', '朱砂', '松青']) {
    await page.getByRole('button', { name: palette, exact: true }).click();
    for (const theme of ['light', 'dark']) {
      const application = page.locator('.color-palette__application[data-preview-theme="' + theme + '"]');
      await application.scrollIntoViewIfNeeded();
      await application.locator('[data-pencil-ready="true"]').first().waitFor();
      const group = application.locator('fieldset.theme-control');
      await group.getByRole('radio', { name: '浅色主题', exact: true }).check();
      assert(await group.getByRole('radio', { name: '浅色主题', exact: true }).isChecked());
      await page.waitForTimeout(300);
      const samples = await application.evaluate(node => {
        const rgb = color => {
          const canvas = document.createElement('canvas');
          canvas.width = canvas.height = 1;
          const context = canvas.getContext('2d');
          context.fillStyle = color;
          context.fillRect(0, 0, 1, 1);
          return [...context.getImageData(0, 0, 1, 1).data].slice(0, 3);
        };
        const luminance = values => values.map(value => {
          const v = value / 255;
          return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
        }).reduce((sum, value, index) => sum + value * [0.2126, 0.7152, 0.0722][index], 0);
        return ['action', 'selection'].map(variant => {
          const surface = variant === 'action'
            ? node.querySelector('.color-palette__paper.inkra-pencil-surface--action')
            : node.querySelector('[data-checked="true"] .inkra-pencil-surface--selection');
          const canvas = surface.querySelector('canvas');
          const style = getComputedStyle(surface);
          const paper = rgb(style.getPropertyValue('--inkra-paper'));
          const foreground = luminance(rgb(style.getPropertyValue(
            variant === 'action' ? '--inkra-on-accent' : '--inkra-selection-foreground')));
          const { data } = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height);
          let minimumContrast = Infinity;
          const colors = new Set();
          for (let y = Math.ceil(canvas.height * 0.2); y < canvas.height * 0.8; y += 2) {
            for (let x = Math.ceil(canvas.width * 0.2); x < canvas.width * 0.8; x += 2) {
              const index = (y * canvas.width + x) * 4;
              const alpha = data[index + 3] / 255;
              const color = paper.map((value, channel) => data[index + channel] * alpha + value * (1 - alpha));
              const background = luminance(color);
              minimumContrast = Math.min(minimumContrast, (Math.max(foreground, background) + 0.05) / (Math.min(foreground, background) + 0.05));
              colors.add(color.map(Math.round).join(','));
            }
          }
          return { variant, minimumContrast, colors: colors.size };
        });
      });
      for (const sample of samples) {
        assert(sample.minimumContrast >= 4.5, JSON.stringify({ palette, theme, ...sample }));
        assert(sample.colors > 10, 'pencil texture remains non-uniform');
      }
      console.log('PASS palette contrast and texture: ' + palette + ' / ' + theme);
    }
    await page.screenshot({ path: '/tmp/inkra-palette-' + palette + '.png' });
  }
  await page.getByRole('button', { name: '玄墨', exact: true }).click();
  const expected = await page.locator('[data-preview-theme="light"]').first().evaluate((node, tokens) =>
    Object.fromEntries(tokens.map(token => [token, getComputedStyle(node).getPropertyValue(token).trim()])), tokenNames);
  const actual = await page.locator('html').evaluate((node, tokens) =>
    Object.fromEntries(tokens.map(token => [token, getComputedStyle(node).getPropertyValue(token).trim()])), tokenNames);
  assert.deepEqual(actual, expected, 'document defaults match the palette preview');
  for (const theme of ['light', 'dark']) {
    await page.evaluate(theme => localStorage.setItem('inkra-docs-theme', theme), theme);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.reload();
    const application = page.locator('.color-palette__application:visible');
    await application.waitFor();
    assert.equal(await application.getAttribute('data-preview-theme'), theme);
    await application.scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    await page.screenshot({ path: '/tmp/inkra-palette-mobile-' + theme + '.png' });
  }
  assert.deepEqual(errors, []);
} finally {
  await browser.close();
}
