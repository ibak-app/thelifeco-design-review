#!/usr/bin/env node
/**
 * Section-by-Section Visual Comparison
 *
 * Slices both the Figma render and HTML screenshot into horizontal strips
 * and compares each strip independently, reporting per-section mismatch.
 *
 * Usage:
 *   node tools/section-compare.js <figma-image> <html-file> [--strip-height=500] [--width=1440]
 *
 * Output:
 *   - Per-strip diff images in tools/diffs/sections/
 *   - Per-strip mismatch percentage
 *   - Identifies which sections need the most work
 */

const { chromium } = require('playwright');
const { PNG } = require('pngjs');
const pixelmatch = require('pixelmatch');
const fs = require('fs');
const path = require('path');

async function main() {
  const args = process.argv.slice(2);
  if (args.length < 2) {
    console.error('Usage: node tools/section-compare.js <figma-image> <html-file> [--strip-height=500] [--width=1440]');
    process.exit(1);
  }

  const figmaImagePath = path.resolve(args[0]);
  const htmlFilePath = path.resolve(args[1]);

  let stripHeight = 500;
  let viewportWidth = 1440;

  for (const arg of args.slice(2)) {
    if (arg.startsWith('--strip-height=')) stripHeight = parseInt(arg.split('=')[1]);
    if (arg.startsWith('--width=')) viewportWidth = parseInt(arg.split('=')[1]);
  }

  if (!fs.existsSync(figmaImagePath)) {
    console.error(`Figma image not found: ${figmaImagePath}`);
    process.exit(1);
  }
  if (!fs.existsSync(htmlFilePath)) {
    console.error(`HTML file not found: ${htmlFilePath}`);
    process.exit(1);
  }

  // Read Figma image
  const figmaImg = PNG.sync.read(fs.readFileSync(figmaImagePath));
  console.log(`Figma: ${figmaImg.width}x${figmaImg.height}`);

  // Screenshot HTML
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: viewportWidth, height: 800 } });
  await page.goto(`file:///${htmlFilePath.replace(/\\/g, '/')}`, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(2000);
  const screenshotBuffer = await page.screenshot({ fullPage: true });
  await browser.close();

  const htmlImg = PNG.sync.read(screenshotBuffer);
  console.log(`HTML:  ${htmlImg.width}x${htmlImg.height}`);

  const width = Math.min(figmaImg.width, htmlImg.width);
  const maxHeight = Math.min(figmaImg.height, htmlImg.height);
  const numStrips = Math.ceil(maxHeight / stripHeight);

  // Setup output dir
  const baseName = path.basename(htmlFilePath, path.extname(htmlFilePath));
  const sectDir = path.resolve(__dirname, 'diffs', 'sections', baseName);
  if (!fs.existsSync(sectDir)) fs.mkdirSync(sectDir, { recursive: true });

  console.log(`\nComparing ${numStrips} sections (${stripHeight}px strips, ${width}px wide)\n`);
  console.log('Section | Y Range        | Mismatch | Status');
  console.log('--------|----------------|----------|-------');

  const results = [];

  for (let i = 0; i < numStrips; i++) {
    const yStart = i * stripHeight;
    const yEnd = Math.min(yStart + stripHeight, maxHeight);
    const h = yEnd - yStart;

    // Extract strips
    const extractStrip = (img) => {
      const strip = new PNG({ width, height: h });
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < width; x++) {
          const srcIdx = ((yStart + y) * img.width + x) * 4;
          const dstIdx = (y * width + x) * 4;
          strip.data[dstIdx] = img.data[srcIdx];
          strip.data[dstIdx + 1] = img.data[srcIdx + 1];
          strip.data[dstIdx + 2] = img.data[srcIdx + 2];
          strip.data[dstIdx + 3] = img.data[srcIdx + 3];
        }
      }
      return strip;
    };

    const figmaStrip = extractStrip(figmaImg);
    const htmlStrip = extractStrip(htmlImg);
    const diff = new PNG({ width, height: h });

    const mismatched = pixelmatch(
      figmaStrip.data, htmlStrip.data, diff.data,
      width, h,
      { threshold: 0.1, includeAA: true }
    );

    const pct = ((mismatched / (width * h)) * 100).toFixed(1);
    const status = pct < 5 ? 'PASS' : pct < 15 ? 'WARN' : 'FAIL';
    const padded = String(i + 1).padStart(2, ' ');
    const range = `${yStart}-${yEnd}`.padEnd(14);
    console.log(`   ${padded}   | ${range} | ${pct.padStart(6)}%  | ${status}`);

    // Save diff strip
    fs.writeFileSync(path.join(sectDir, `strip-${String(i + 1).padStart(2, '0')}-diff.png`), PNG.sync.write(diff));
    fs.writeFileSync(path.join(sectDir, `strip-${String(i + 1).padStart(2, '0')}-figma.png`), PNG.sync.write(figmaStrip));
    fs.writeFileSync(path.join(sectDir, `strip-${String(i + 1).padStart(2, '0')}-html.png`), PNG.sync.write(htmlStrip));

    results.push({ section: i + 1, yStart, yEnd, mismatch: parseFloat(pct), status });
  }

  console.log('\n=== WORST SECTIONS (need most work) ===');
  results.sort((a, b) => b.mismatch - a.mismatch);
  results.slice(0, 5).forEach(r => {
    console.log(`  Section ${r.section} (y:${r.yStart}-${r.yEnd}): ${r.mismatch}% mismatch`);
  });

  const avgMismatch = (results.reduce((s, r) => s + r.mismatch, 0) / results.length).toFixed(1);
  console.log(`\nOverall average mismatch: ${avgMismatch}%`);
  console.log(`Output directory: ${sectDir}`);
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
