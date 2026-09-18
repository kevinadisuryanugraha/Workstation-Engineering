const { chromium } = require('playwright-core');
const fs = require('fs');
const EXE = '/home/smod-dev/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome';
const BASE = 'https://workstation.zamzami.or.id';
const PAGES = [
  ['01-overview', 'Global Overview'],
  ['02-project360', 'Project 360°'],
  ['03-workitems', 'Work Items & Sprints'],
  ['04-ticketing', 'Ticketing & ITSM'],
  ['05-incident', 'Incident Room'],
  ['06-git', 'Git Intelligence'],
  ['07-deployments', 'Deployments'],
  ['08-infrastructure', 'Infrastructure (Nodes)'],
  ['09-ai', 'AI Codebase Intel'],
  ['10-security', 'Security & RBAC'],
  ['11-reports', 'Reports & Daily Logs'],
  ['12-laporan', 'Laporan Manajemen (ID)'],
  ['13-blueprint', 'Blueprint 01–21 (Specs)'],
  ['14-knowledge', 'Knowledge Base'],
  ['15-audit', 'Event Bus & Audit'],
];
(async () => {
  const browser = await chromium.launch({ executablePath: EXE, args: ['--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage'] });
  const ctx = await browser.newContext({ viewport: { width: 1366, height: 850 } });
  const page = await ctx.newPage();
  const log = [];
  page.on('console', m => { if (m.type() === 'error') log.push({ type: 'console-error', page: page.url().slice(-30), text: m.text().slice(0, 180) }); });
  page.on('pageerror', e => log.push({ type: 'page-error', page: page.url().slice(-30), text: String(e).slice(0, 180) }));
  await page.goto(BASE, { waitUntil: 'networkidle', timeout: 30000 }).catch(e => log.push({ type: 'goto-fail', text: e.message.slice(0, 150) }));
  await page.fill('input[type=email]', 'vibelab.kd@gmail.com');
  await page.fill('input[type=password]', 'Jonggol100.');
  await page.click('button[type=submit]');
  await page.waitForTimeout(3500);
  for (const [name, label] of PAGES) {
    try {
      await page.locator('button', { hasText: label }).first().click({ timeout: 8000 });
      await page.waitForTimeout(1800);
      await page.screenshot({ path: `.pi/ui-audit/${name}.png` });
      log.push({ type: 'shot', page: name, ok: true });
    } catch (e) {
      log.push({ type: 'shot', page: name, ok: false, err: String(e).slice(0, 140) });
      await page.screenshot({ path: `.pi/ui-audit/${name}-ERROR.png` }).catch(() => {});
    }
  }
  fs.writeFileSync('.pi/ui-audit/runtime-log.json', JSON.stringify(log, null, 2));
  const ok = log.filter(l => l.type === 'shot' && l.ok).length;
  console.log(`screenshot OK: ${ok}/${PAGES.length}`);
  console.log(`console/page errors: ${log.filter(l => l.type === 'console-error' || l.type === 'page-error').length}`);
  await browser.close();
})();
