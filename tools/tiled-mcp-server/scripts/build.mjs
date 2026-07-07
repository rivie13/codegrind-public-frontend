import { copyFile, mkdir } from 'node:fs/promises';

const sourcePath = new URL('../src/index.js', import.meta.url);
const distDir = new URL('../dist/', import.meta.url);
const distPath = new URL('../dist/index.js', import.meta.url);

await mkdir(distDir, { recursive: true });
await copyFile(sourcePath, distPath);

process.stdout.write('Built dist/index.js\n');