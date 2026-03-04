#!/usr/bin/env node
/**
 * Visual Comparison Tool: Figma Render vs HTML Screenshot
 *
 * Usage:
 *   node tools/visual-compare.js <figma-image-path> <html-file-path> [--threshold=0.1] [--width=1440]
 *
 * Examples:
 *   node tools/visual-compare.js /tmp/figma_frame01.png site/v1/index.html
 *   node tools/visual-compare.js /tmp/figma_frame01.png site/v1/index.html --threshold=0.05 --width=1440
 *
 * Output:
 *   - Diff image saved to tools/diffs/<filename>-diff.png
 *   - Mismatch percentage printed to stdout
 */

const { chromium } = require('playwright');
const { PNG } = require('pngjs');
const pixelmatch = require('pixelmatch');
const fs = require('fs');
const path = require('path');

async function main() {
  const args = process.argv.slice(2);
  if (args.length < 2) {
    console.error('Usage: node tools/visual-compare.js <figma-image> <html-file> [--threshold=0.1] [--width=1440]');
    process.exit(1);
  }

  const figmaImagePath = path.resolve(args[0]);
  const htmlFilePath = path.resolve(args[1]);

  let threshold = 0.1;
  let viewportWidth = 1440;

  for (const arg of args.slice(2)) {
    if (arg.startsWith('--threshold=')) threshold = parseFloat(arg.split('=')[1]);
    if (arg.startsWith('--width=')) viewportWidth = parseInt(arg.split('=')[1]);
  }

  // Validate inputs
  if (!fs.existsSync(figmaImagePath)) {
    console.error(`Figma image not found: ${figmaImagePath}`);
    process.exit(1);
  }
  if (!fs.existsSync(htmlFilePath)) {
    console.error(`HTML file not found: ${htmlFilePath}`);
    process.exit(1);
  }

  // Read Figma reference image
  const figmaData = fs.readFileSync(figmaImagePath);
  const figmaImg = PNG.sync.read(figmaData);
  console.log(`Figma image: ${figmaImg.width}x${figmaImg.height}`);

  // Launch browser and screenshot the HTML
  console.log('Launching browser...');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    viewport: { width: viewportWidth, height: 800 }
  });

  const fileUrl = `file:///${htmlFilePath.replace(/\\/g, '/')}`;
  console.log(`Navigating to: ${fileUrl}`);
  await page.goto(fileUrl, { waitUntil: 'networkidle', timeout: 30000 });

  // Wait for fonts and images to load
  await page.waitForTimeout(2000);

  // Take full-page screenshot
  const screenshotBuffer = await page.screenshot({ fullPage: true });
  await browser.close();

  const htmlImg = PNG.sync.read(screenshotBuffer);
  console.log(`HTML screenshot: ${htmlImg.width}x${htmlImg.height}`);

  // Save the HTML screenshot
  const diffDir = path.resolve(__dirname, 'diffs');
  if (!fs.existsSync(diffDir)) fs.mkdirSync(diffDir, { recursive: true });

  const baseName = path.basename(htmlFilePath, path.extname(htmlFilePath));
  const htmlScreenshotPath = path.join(diffDir, `${baseName}-screenshot.png`);
  fs.writeFileSync(htmlScreenshotPath, screenshotBuffer);
  console.log(`HTML screenshot saved: ${htmlScreenshotPath}`);

  // Resize to match dimensions (use the smaller dimensions)
  const width = Math.min(figmaImg.width, htmlImg.width);
  const height = Math.min(figmaImg.height, htmlImg.height);
  console.log(`Comparing area: ${width}x${height}`);

  // Crop both images to matching size
  const cropImage = (img, w, h) => {
    const cropped = new PNG({ width: w, height: h });
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const srcIdx = (y * img.width + x) * 4;
        const dstIdx = (y * w + x) * 4;
        cropped.data[dstIdx] = img.data[srcIdx];
        cropped.data[dstIdx + 1] = img.data[srcIdx + 1];
        cropped.data[dstIdx + 2] = img.data[srcIdx + 2];
        cropped.data[dstIdx + 3] = img.data[srcIdx + 3];
      }
    }
    return cropped;
  };

  const croppedFigma = cropImage(figmaImg, width, height);
  const croppedHtml = cropImage(htmlImg, width, height);

  // Run pixelmatch
  const diff = new PNG({ width, height });
  const mismatchedPixels = pixelmatch(
    croppedFigma.data, croppedHtml.data, diff.data,
    width, height,
    { threshold, includeAA: true }
  );

  const totalPixels = width * height;
  const mismatchPct = ((mismatchedPixels / totalPixels) * 100).toFixed(2);

  // Save diff image
  const diffPath = path.join(diffDir, `${baseName}-diff.png`);
  fs.writeFileSync(diffPath, PNG.sync.write(diff));

  // Save cropped Figma for side-by-side
  const figmaCroppedPath = path.join(diffDir, `${baseName}-figma.png`);
  fs.writeFileSync(figmaCroppedPath, PNG.sync.write(croppedFigma));

  console.log('');
  console.log('=== VISUAL COMPARISON RESULTS ===');
  console.log(`Mismatched pixels: ${mismatchedPixels.toLocaleString()} / ${totalPixels.toLocaleString()}`);
  console.log(`Mismatch: ${mismatchPct}%`);
  console.log(`Threshold: ${threshold}`);
  console.log(`Diff image: ${diffPath}`);
  console.log(`HTML screenshot: ${htmlScreenshotPath}`);
  console.log(`Figma reference: ${figmaCroppedPath}`);
  console.log('');

  if (parseFloat(mismatchPct) < 5) {
    console.log('PASS: Less than 5% mismatch - close to pixel-perfect');
  } else if (parseFloat(mismatchPct) < 15) {
    console.log('WARN: 5-15% mismatch - minor differences, needs adjustment');
  } else {
    console.log('FAIL: >15% mismatch - significant visual differences');
  }
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
