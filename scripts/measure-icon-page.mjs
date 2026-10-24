import { chromium } from 'playwright';

const browser = await chromium.launch();
try {
  for (let run = 0; run < 3; run++) {
    const context = await browser.newContext({ viewport: { width: 1305, height: 954 } });
    const page = await context.newPage();
    await page.addInitScript(() => {
      window.iconLongTasks = [];
      new PerformanceObserver(list => {
        window.iconLongTasks.push(...list.getEntries().map(entry => ({ start: entry.startTime, duration: entry.duration })));
      }).observe({ type: 'longtask', buffered: true });
    });
    const cdp = await context.newCDPSession(page);
    await cdp.send('Performance.enable');
    await page.goto('http://127.0.0.1:4180/docs/components/icon#preview', { waitUntil: 'domcontentloaded' });
    await page.locator('.icon-examples__grid').waitFor();
    await page.waitForTimeout(2000);
    const measures = await page.evaluate(() => ({
      buttons: document.querySelectorAll('.icon-examples__grid button').length,
      catalogCanvases: document.querySelectorAll('.icon-examples__grid canvas').length,
      totalCanvases: document.querySelectorAll('canvas').length,
      longTasks: window.iconLongTasks.length,
      blockingMs: Math.round(window.iconLongTasks.reduce((sum, task) => sum + Math.max(0, task.duration - 50), 0)),
      longestTaskMs: Math.round(Math.max(0, ...window.iconLongTasks.map(task => task.duration))),
    }));
    const { metrics } = await cdp.send('Performance.getMetrics');
    measures.taskDurationMs = Math.round(metrics.find(metric => metric.name === 'TaskDuration').value * 1000);
    console.log(JSON.stringify({ run, ...measures }));
    await context.close();
  }
} finally {
  await browser.close();
}
