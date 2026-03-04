#!/usr/bin/env node
/**
 * Fetch Figma Frame Renders
 *
 * Downloads rendered PNG images of all frames from the Figma file.
 * Uses token rotation across 3 PATs to avoid rate limits.
 *
 * Usage:
 *   node tools/fetch-figma-renders.js [--scale=1] [--output-dir=tools/figma-renders]
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const FILE_KEY = process.env.FIGMA_FILE_KEY || 'yezWJ0zJpAj8HwztrnQLck';
const TOKENS = (process.env.FIGMA_TOKENS || '').split(',').filter(Boolean);
if (TOKENS.length === 0) {
  console.error('Set FIGMA_TOKENS env var (comma-separated PATs). Example:');
  console.error('  FIGMA_TOKENS=figd_xxx,figd_yyy node tools/fetch-figma-renders.js');
  process.exit(1);
}

let tokenIdx = 0;
function getToken() {
  const t = TOKENS[tokenIdx % TOKENS.length];
  tokenIdx++;
  return t;
}

function fetchJSONSingle(url, token) {
  return new Promise((resolve, reject) => {
    const options = {
      headers: { 'X-Figma-Token': token },
      timeout: 30000
    };
    https.get(url, options, (res) => {
      if (res.statusCode === 429) {
        reject(new Error('RATE_LIMITED'));
        return;
      }
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch (e) { reject(new Error(`Failed to parse JSON: ${data.slice(0, 200)}`)); }
      });
    }).on('error', reject);
  });
}

async function fetchJSON(url) {
  for (let i = 0; i < TOKENS.length; i++) {
    const token = getToken();
    try {
      const result = await fetchJSONSingle(url, token);
      return result;
    } catch (err) {
      if (err.message === 'RATE_LIMITED' && i < TOKENS.length - 1) {
        console.log(`  Token ${(tokenIdx - 1) % TOKENS.length + 1} rate limited, trying next...`);
        continue;
      }
      throw err;
    }
  }
  throw new Error('All tokens rate limited');
}

function downloadFile(url, destPath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(destPath);
    https.get(url, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        downloadFile(res.headers.location, destPath).then(resolve).catch(reject);
        return;
      }
      res.pipe(file);
      file.on('finish', () => { file.close(); resolve(); });
    }).on('error', reject);
  });
}

async function main() {
  let scale = 1;
  let outputDir = path.resolve(__dirname, 'figma-renders');

  for (const arg of process.argv.slice(2)) {
    if (arg.startsWith('--scale=')) scale = parseFloat(arg.split('=')[1]);
    if (arg.startsWith('--output-dir=')) outputDir = path.resolve(arg.split('=')[1]);
  }

  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

  // Step 1: Get file structure to find top-level frames
  console.log('Fetching file structure...');
  const fileData = await fetchJSON(
    `https://api.figma.com/v1/files/${FILE_KEY}?depth=1`
  );

  const pages = fileData.document.children;
  const frames = [];
  for (const page of pages) {
    if (page.children) {
      for (const frame of page.children) {
        frames.push({
          id: frame.id,
          name: frame.name,
          width: frame.absoluteBoundingBox?.width,
          height: frame.absoluteBoundingBox?.height
        });
      }
    }
  }

  console.log(`Found ${frames.length} frames:`);
  frames.forEach(f => console.log(`  - ${f.name} (${f.id}) ${f.width}x${f.height}`));

  // Step 2: Request renders for all frames
  const nodeIds = frames.map(f => f.id).join(',');
  console.log(`\nRequesting renders at scale=${scale}...`);

  const imageData = await fetchJSON(
    `https://api.figma.com/v1/images/${FILE_KEY}?ids=${encodeURIComponent(nodeIds)}&format=png&scale=${scale}`
  );

  if (imageData.err) {
    console.error('Figma API error:', imageData.err);
    process.exit(1);
  }

  // Step 3: Download each render
  for (const frame of frames) {
    const url = imageData.images[frame.id];
    if (!url) {
      console.log(`  SKIP: No render URL for ${frame.name}`);
      continue;
    }

    const safeName = frame.name.replace(/[^a-zA-Z0-9_-]/g, '-').toLowerCase();
    const destPath = path.join(outputDir, `${safeName}.png`);
    console.log(`  Downloading ${frame.name} -> ${destPath}`);
    await downloadFile(url, destPath);
    console.log(`  Done (${(fs.statSync(destPath).size / 1024).toFixed(0)}KB)`);
  }

  console.log(`\nAll renders saved to: ${outputDir}`);
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
