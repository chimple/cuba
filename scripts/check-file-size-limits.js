#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const root = process.cwd();
const limits = { '.tsx': 300, '.ts': 600 };
const excludedFiles = new Set([
  'database.ts',
  'import.json',
  'FirebaseApi.ts',
  'OneRosterApi.ts',
]);

const shouldSkip = (file) => {
  const normalized = file.replace(/\\/g, '/');
  const ext = path.extname(file);
  const name = path.basename(file);

  return (
    !limits[ext] ||
    ext === '.json' ||
    name.endsWith('.d.ts') ||
    excludedFiles.has(name) ||
    /\.(test|spec)\.(ts|tsx)$/.test(normalized) ||
    /(^|\/)generated\//i.test(normalized) ||
    /\.(generated|gen)\.(ts|tsx)$/.test(normalized)
  );
};

const gitFiles = (command) =>
  execSync(command, { encoding: 'utf8' }).split(/\r?\n/).filter(Boolean);

const changedFiles = [
  ...gitFiles('git diff --name-only --diff-filter=ACMR'),
  ...gitFiles('git diff --cached --name-only --diff-filter=ACMR'),
];

const countLines = (file) => {
  const content = fs.readFileSync(file, 'utf8').replace(/\r\n|\r|\n$/, '');
  return content ? content.split(/\r\n|\r|\n/).length : 0;
};

const violations = [...new Set(changedFiles)]
  .filter((file) => file.replace(/\\/g, '/').startsWith('src/'))
  .filter((file) => !shouldSkip(file))
  .map((file) => path.join(root, file))
  .filter((file) => fs.existsSync(file) && fs.statSync(file).isFile())
  .map((file) => ({
    file,
    lines: countLines(file),
    max: limits[path.extname(file)],
  }))
  .filter(({ lines, max }) => lines > max)
  .sort((a, b) => b.lines - a.lines);

if (violations.length) {
  console.error('File size limit violations found:\n');
  for (const { file, lines, max } of violations) {
    console.error(`${path.relative(root, file)}: ${lines} lines (max ${max})`);
  }
  process.exit(1);
}

console.log('File size limits passed.');
