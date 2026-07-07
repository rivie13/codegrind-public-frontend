import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { chromium } from 'playwright';
import v8ToIstanbul from 'v8-to-istanbul';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const packageRoot = path.resolve(__dirname, '..');

const parseArgs = (argv) => {
  const args = {
    url: 'http://localhost:5173',
    routes: ['/'],
    includePrefixes: ['/src/'],
    outputDir: 'coverage/runtime',
    waitMs: 1500,
    timeoutMs: 30000,
    headless: true,
    help: false,
  };

  const parsedRoutes = [];
  const parsedPrefixes = [];

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];

    if (token === '--help' || token === '-h') {
      args.help = true;
      continue;
    }

    if (token === '--headed') {
      args.headless = false;
      continue;
    }

    if (token === '--url') {
      args.url = argv[index + 1] || args.url;
      index += 1;
      continue;
    }

    if (token === '--route') {
      const routeValue = argv[index + 1];
      if (routeValue) {
        parsedRoutes.push(routeValue);
      }
      index += 1;
      continue;
    }

    if (token === '--include-prefix') {
      const prefixValue = argv[index + 1];
      if (prefixValue) {
        parsedPrefixes.push(prefixValue);
      }
      index += 1;
      continue;
    }

    if (token === '--output-dir') {
      args.outputDir = argv[index + 1] || args.outputDir;
      index += 1;
      continue;
    }

    if (token === '--wait-ms') {
      args.waitMs = Number.parseInt(argv[index + 1] || `${args.waitMs}`, 10);
      index += 1;
      continue;
    }

    if (token === '--timeout-ms') {
      args.timeoutMs = Number.parseInt(argv[index + 1] || `${args.timeoutMs}`, 10);
      index += 1;
    }
  }

  if (parsedRoutes.length) {
    args.routes = parsedRoutes;
  }

  if (parsedPrefixes.length) {
    args.includePrefixes = parsedPrefixes;
  }

  return args;
};

const helpText = `Capture browser-driven runtime coverage for the frontend.

Usage:
  npm run runtime:coverage -- --url http://localhost:5173 --route / --route /games

Options:
  --url <base-url>            Base URL to visit. Default: http://localhost:5173
  --route <path>              Route to visit. Repeatable. Default: /
  --include-prefix <prefix>   Only convert scripts whose pathname starts with this prefix. Repeatable. Default: /src/
  --output-dir <path>         Output directory relative to codegrind-frontend/. Default: coverage/runtime
  --wait-ms <ms>              Extra wait after each navigation. Default: 1500
  --timeout-ms <ms>           Navigation timeout. Default: 30000
  --headed                    Run Chromium headed instead of headless
  --help, -h                  Show this help text
`;

const escapeHtml = (value) => String(value ?? '')
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#39;');

const normalizeFilePath = (filePath) => filePath.split(path.sep).join('/');

const isAppScript = (entry, baseUrl, includePrefixes) => {
  try {
    const parsedUrl = new URL(entry.url);
    const parsedBase = new URL(baseUrl);
    return parsedUrl.origin === parsedBase.origin
      && includePrefixes.some((prefix) => parsedUrl.pathname.startsWith(prefix));
  } catch {
    return false;
  }
};

const resolveLocalSourcePath = (entryUrl) => {
  const parsedUrl = new URL(entryUrl);
  const relativePath = parsedUrl.pathname.replace(/^\//, '');
  return path.join(packageRoot, relativePath);
};

const mergeCoverageMaps = (targetMap, incomingMap) => {
  for (const [filePath, incomingEntry] of Object.entries(incomingMap)) {
    const existingEntry = targetMap[filePath];

    if (!existingEntry) {
      targetMap[filePath] = incomingEntry;
      continue;
    }

    for (const [statementKey, count] of Object.entries(incomingEntry.s || {})) {
      existingEntry.s[statementKey] = (existingEntry.s[statementKey] || 0) + count;
    }

    for (const [functionKey, count] of Object.entries(incomingEntry.f || {})) {
      existingEntry.f[functionKey] = (existingEntry.f[functionKey] || 0) + count;
    }

    for (const [branchKey, counts] of Object.entries(incomingEntry.b || {})) {
      const previousCounts = existingEntry.b[branchKey] || new Array(counts.length).fill(0);
      existingEntry.b[branchKey] = counts.map((count, index) => previousCounts[index] + count);
    }
  }

  return targetMap;
};

const summarizeCoverageMap = (coverageMap) => {
  const files = Object.values(coverageMap);
  let statementsTotal = 0;
  let statementsCovered = 0;
  let functionsTotal = 0;
  let functionsCovered = 0;
  let branchesTotal = 0;
  let branchesCovered = 0;

  for (const file of files) {
    for (const count of Object.values(file.s || {})) {
      statementsTotal += 1;
      if (count > 0) {
        statementsCovered += 1;
      }
    }

    for (const count of Object.values(file.f || {})) {
      functionsTotal += 1;
      if (count > 0) {
        functionsCovered += 1;
      }
    }

    for (const counts of Object.values(file.b || {})) {
      for (const count of counts) {
        branchesTotal += 1;
        if (count > 0) {
          branchesCovered += 1;
        }
      }
    }
  }

  const ratio = (covered, total) => (total > 0 ? Number(((covered / total) * 100).toFixed(1)) : 0);

  return {
    files: files.length,
    statements: { covered: statementsCovered, total: statementsTotal, pct: ratio(statementsCovered, statementsTotal) },
    functions: { covered: functionsCovered, total: functionsTotal, pct: ratio(functionsCovered, functionsTotal) },
    branches: { covered: branchesCovered, total: branchesTotal, pct: ratio(branchesCovered, branchesTotal) },
  };
};

const summarizeCssCoverage = (cssCoverage) => {
  let stylesheets = 0;
  let bytesTotal = 0;
  let bytesUsed = 0;

  for (const entry of cssCoverage) {
    stylesheets += 1;
    const textLength = entry.text?.length || 0;
    bytesTotal += textLength;
    bytesUsed += (entry.ranges || []).reduce((sum, range) => sum + Math.max(range.end - range.start, 0), 0);
  }

  const percentUsed = bytesTotal > 0 ? Number(((bytesUsed / bytesTotal) * 100).toFixed(1)) : 0;

  return {
    stylesheets,
    bytesTotal,
    bytesUsed,
    percentUsed,
  };
};

const renderHtml = ({ config, summary, outputFiles }) => `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Frontend Runtime Coverage Capture</title>
  <style>
    :root {
      color-scheme: light;
      --bg: #f5f1e8;
      --panel: #fffaf2;
      --ink: #1e2924;
      --muted: #5f6d64;
      --accent: #0e6a5a;
      --warn: #94671a;
      --border: #cdbfa8;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: "Segoe UI", Tahoma, sans-serif;
      background: linear-gradient(180deg, #faf6ef 0%, var(--bg) 100%);
      color: var(--ink);
    }
    main {
      width: min(1080px, calc(100vw - 28px));
      margin: 0 auto;
      padding: 28px 0 48px;
    }
    section {
      margin-top: 18px;
      padding: 22px;
      border-radius: 18px;
      border: 1px solid var(--border);
      background: var(--panel);
      box-shadow: 0 10px 28px rgba(54, 40, 16, 0.09);
    }
    h1, h2, h3, p { margin-top: 0; }
    .eyebrow {
      text-transform: uppercase;
      letter-spacing: 0.14em;
      font-size: 12px;
      color: var(--accent);
      font-weight: 700;
    }
    .metric-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 12px;
    }
    .metric {
      border: 1px solid var(--border);
      border-left: 6px solid var(--accent);
      border-radius: 14px;
      padding: 14px;
      background: #fffdf8;
    }
    .metric.warn { border-left-color: var(--warn); }
    .label {
      margin: 0;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      font-size: 12px;
      color: var(--muted);
      font-weight: 700;
    }
    .value {
      margin: 8px 0 0;
      font-size: 30px;
      font-weight: 800;
    }
    ul { line-height: 1.6; }
    code {
      font-family: "Cascadia Mono", Consolas, monospace;
      font-size: 13px;
    }
    .file-links a {
      display: inline-block;
      margin-right: 14px;
      margin-bottom: 8px;
    }
  </style>
</head>
<body>
  <main>
    <section>
      <p class="eyebrow">CodeGrind frontend runtime coverage</p>
      <h1>Runtime Coverage Capture</h1>
      <p>This page summarizes one local Playwright-driven browser coverage capture. The JS artifact is written in Istanbul format so Fallow can ingest it with <code>--runtime-coverage</code>.</p>
    </section>
    <section>
      <h2>Capture summary</h2>
      <div class="metric-grid">
        <article class="metric">
          <p class="label">Visited routes</p>
          <p class="value">${escapeHtml(summary.routesVisited.length)}</p>
        </article>
        <article class="metric">
          <p class="label">Covered source files</p>
          <p class="value">${escapeHtml(summary.js.files)}</p>
        </article>
        <article class="metric">
          <p class="label">Function coverage</p>
          <p class="value">${escapeHtml(summary.js.functions.pct)}%</p>
        </article>
        <article class="metric warn">
          <p class="label">CSS bytes used</p>
          <p class="value">${escapeHtml(summary.css.percentUsed)}%</p>
        </article>
      </div>
    </section>
    <section>
      <h2>Visited routes</h2>
      <ul>${summary.routesVisited.map((route) => `<li><code>${escapeHtml(route)}</code></li>`).join('')}</ul>
    </section>
    <section>
      <h2>Artifacts</h2>
      <p class="file-links">
        <a href="${escapeHtml(outputFiles.runtimeCoverageJson)}">runtime-coverage-final.json</a>
        <a href="${escapeHtml(outputFiles.cssCoverageJson)}">css-coverage.json</a>
        <a href="${escapeHtml(outputFiles.summaryJson)}">summary.json</a>
      </p>
      <p>Analyze this with Fallow:</p>
      <p><code>npx fallow health --runtime-coverage coverage/runtime/runtime-coverage-final.json --format json --summary</code></p>
    </section>
    <section>
      <h2>Capture config</h2>
      <ul>
        <li><code>base URL:</code> ${escapeHtml(config.url)}</li>
        <li><code>wait ms:</code> ${escapeHtml(config.waitMs)}</li>
        <li><code>include prefixes:</code> ${escapeHtml(config.includePrefixes.join(', '))}</li>
      </ul>
    </section>
  </main>
</body>
</html>
`;

const main = async () => {
  const config = parseArgs(process.argv.slice(2));

  if (config.help) {
    console.log(helpText);
    return;
  }

  const outputDir = path.resolve(packageRoot, config.outputDir);
  await fs.mkdir(outputDir, { recursive: true });

  const browser = await chromium.launch({ headless: config.headless });
  const context = await browser.newContext({ serviceWorkers: 'block' });
  const page = await context.newPage();

  page.setDefaultNavigationTimeout(config.timeoutMs);
  page.setDefaultTimeout(config.timeoutMs);

  await page.coverage.startJSCoverage({ resetOnNavigation: false, reportAnonymousScripts: false });
  await page.coverage.startCSSCoverage({ resetOnNavigation: false });

  const routesVisited = [];

  try {
    for (const route of config.routes) {
      const targetUrl = new URL(route, config.url).toString();
      await page.goto(targetUrl, { waitUntil: 'networkidle', timeout: config.timeoutMs });
      await page.waitForTimeout(config.waitMs);
      routesVisited.push(targetUrl);
    }

    const jsCoverage = await page.coverage.stopJSCoverage();
    const cssCoverage = await page.coverage.stopCSSCoverage();

    const appEntries = jsCoverage.filter((entry) => isAppScript(entry, config.url, config.includePrefixes));
    const runtimeCoverageMap = {};

    for (const entry of appEntries) {
      const localSourcePath = resolveLocalSourcePath(entry.url);
      const converter = v8ToIstanbul(localSourcePath, 0, { source: entry.source });
      await converter.load();
      converter.applyCoverage(entry.functions);
      mergeCoverageMaps(runtimeCoverageMap, converter.toIstanbul());
    }

    const summary = {
      capturedAt: new Date().toISOString(),
      routesVisited,
      js: summarizeCoverageMap(runtimeCoverageMap),
      css: summarizeCssCoverage(cssCoverage),
      rawScriptEntries: jsCoverage.length,
      convertedScriptEntries: appEntries.length,
      includePrefixes: config.includePrefixes,
      baseUrl: config.url,
    };

    const runtimeCoveragePath = path.join(outputDir, 'runtime-coverage-final.json');
    const cssCoveragePath = path.join(outputDir, 'css-coverage.json');
    const summaryPath = path.join(outputDir, 'summary.json');
    const htmlPath = path.join(outputDir, 'index.html');

    await Promise.all([
      fs.writeFile(runtimeCoveragePath, `${JSON.stringify(runtimeCoverageMap, null, 2)}\n`, 'utf8'),
      fs.writeFile(cssCoveragePath, `${JSON.stringify(cssCoverage, null, 2)}\n`, 'utf8'),
      fs.writeFile(summaryPath, `${JSON.stringify(summary, null, 2)}\n`, 'utf8'),
      fs.writeFile(htmlPath, `${renderHtml({
        config,
        summary,
        outputFiles: {
          runtimeCoverageJson: 'runtime-coverage-final.json',
          cssCoverageJson: 'css-coverage.json',
          summaryJson: 'summary.json',
        },
      })}\n`, 'utf8'),
    ]);

    console.log(`Runtime coverage written to ${normalizeFilePath(outputDir)}`);
    console.log(` - ${normalizeFilePath(runtimeCoveragePath)}`);
    console.log(` - ${normalizeFilePath(cssCoveragePath)}`);
    console.log(` - ${normalizeFilePath(summaryPath)}`);
    console.log(` - ${normalizeFilePath(htmlPath)}`);
  } finally {
    await context.close();
    await browser.close();
  }
};

await main();