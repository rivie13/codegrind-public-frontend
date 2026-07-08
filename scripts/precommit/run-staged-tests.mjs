// Pre-commit staged test runner for codegrind-frontend.
// Runs the full test suite when src/ files are staged.

import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '../..');

const stagedOutput = execSync('git diff --cached --name-only --diff-filter=ACMR', {
  encoding: 'utf8',
});

const stagedFiles = stagedOutput.split('\n').map((f) => f.trim()).filter(Boolean);
const hasSrcChanges = stagedFiles.some((f) => f.startsWith('src/'));

if (hasSrcChanges) {
  console.log('[pre-commit] src/ changes detected — running full test suite...');
  execSync('npm test', { stdio: 'inherit', cwd: repoRoot, shell: true });
  console.log('[pre-commit] All tests passed.');
} else {
  console.log('[pre-commit] No src/ staged changes. Nothing to check.');
}

console.log('[pre-commit] Pre-commit checks passed.');
