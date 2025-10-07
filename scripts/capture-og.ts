/*
  Node script: boots Next dev server and uses Playwright to capture
  a 1200x630 screenshot of /og-capture into public/og.png
*/
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';

async function ensurePlaywright() {
  try {
    await import('playwright');
    return;
  } catch {
    console.error('Playwright is not installed. Run: pnpm add -D playwright');
    process.exit(1);
  }
}

async function waitForServer(url: string, tries = 50) {
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(url, { cache: 'no-store' });
      if (res.ok) return true;
    } catch {}
    await delay(200);
  }
  return false;
}

async function main() {
  await ensurePlaywright();
  const { chromium } = await import('playwright');

  const port = process.env.OG_PORT || process.env.PORT || '3030';
  const baseUrl = `http://localhost:${port}`;
  let dev: ReturnType<typeof spawn> | null = null;
  let ok = await waitForServer(`${baseUrl}/`);
  if (!ok) {
    dev = spawn(process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm', ['dev'], {
      env: { ...process.env, PORT: port },
      stdio: 'inherit',
    });
    ok = await waitForServer(`${baseUrl}/`);
    if (!ok) {
      console.error('Dev server did not start in time');
      dev?.kill();
      process.exit(1);
    }
  }

  const browser = await chromium.launch();
  const page = await browser.newPage({
    viewport: { width: 1400, height: 900 },
  });
  await page.goto(`${baseUrl}/`, { waitUntil: 'networkidle' });
  // Upload dummy.jpg into the real UI
  const input = await page.locator('input[type="file"]').first();
  await input.setInputFiles(resolve(process.cwd(), 'public/dummy.jpg'));
  // Ensure the paper container (full stage + chrome) is visible and capture that
  const paper = page.locator('[data-og-paper]').first();
  await paper.waitFor({ state: 'visible' });
  const outPath = resolve(process.cwd(), 'public/og.png');
  await paper.screenshot({ path: outPath, type: 'png' });
  await browser.close();
  dev?.kill();
  if (existsSync(outPath)) {
    console.log('Saved OG image to', outPath);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
