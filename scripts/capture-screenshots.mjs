import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const OUT_DIR = path.resolve('docs/screenshots');

if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function capture() {
  console.log('🚀 Launching Chrome via puppeteer-core...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    defaultViewport: {
      width: 1920,
      height: 1080,
      deviceScaleFactor: 2, // Ultra-sharp Retina 2x screenshot
    },
    args: ['--no-sandbox', '--disable-gpu'],
  });

  const page = await browser.newPage();

  // 1. Homepage
  console.log('📸 1/4: Capturing Homepage...');
  await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
  await sleep(5000); // Wait for Cinemeta & Letterboxd rows to render
  await page.screenshot({ path: path.join(OUT_DIR, 'preview-home.png'), fullPage: false });
  console.log('  ✓ Saved preview-home.png');

  // 2. Movie Detail (Inception)
  console.log('📸 2/4: Capturing Movie Detail Page...');
  await page.goto('http://localhost:3000/title/movie/tt1375666', { waitUntil: 'domcontentloaded' });
  await sleep(5000); // Wait for Cinemeta metadata and background to load
  await page.screenshot({ path: path.join(OUT_DIR, 'preview-detail.png'), fullPage: false });
  console.log('  ✓ Saved preview-detail.png');

  // 3. Browse Page
  console.log('📸 3/4: Capturing Browse Page...');
  await page.goto('http://localhost:3000/browse?type=movie', { waitUntil: 'domcontentloaded' });
  await sleep(5000); // Wait for catalog rows to render
  await page.screenshot({ path: path.join(OUT_DIR, 'preview-browse.png'), fullPage: false });
  console.log('  ✓ Saved preview-browse.png');

  // 4. Player Page
  console.log('📸 4/4: Capturing Player Page with Stream Drawer...');
  await page.goto('http://localhost:3000/player?type=movie&id=tt1375666', { waitUntil: 'domcontentloaded' });
  await sleep(4000);
  // Open the stream drawer to show multi-addon streams
  try {
    const streamButtons = await page.$$('button');
    for (const btn of streamButtons) {
      const text = await page.evaluate((el) => el.innerText, btn);
      if (text && text.includes('Streams')) {
        await btn.click();
        break;
      }
    }
  } catch {}
  await sleep(2000);
  await page.screenshot({ path: path.join(OUT_DIR, 'preview-player.png'), fullPage: false });
  console.log('  ✓ Saved preview-player.png');

  await browser.close();
  console.log('🎉 All 4 screenshots captured successfully!');
}

capture().catch((err) => {
  console.error('Screenshot capture failed:', err);
  process.exit(1);
});
