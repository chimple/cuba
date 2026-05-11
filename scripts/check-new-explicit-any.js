const { execFileSync } = require('node:child_process');

const pattern =
  /:\s*any\b|\bas\s+any\b|<\s*any\s*>|\bArray<\s*any\s*>\b|\bPromise<\s*any\s*>\b|\bReadonlyArray<\s*any\s*>\b|\bany\[\]/;
const ignoredFiles = new Set(['scripts/check-new-explicit-any.js']);

function getStagedDiff() {
  try {
    return execFileSync(
      'git',
      [
        'diff',
        '--cached',
        '--unified=0',
        '--',
        '*.ts',
        '*.tsx',
        '*.js',
        '*.jsx',
      ],
      { encoding: 'utf8' },
    );
  } catch (error) {
    if (
      typeof error === 'object' &&
      error !== null &&
      'stdout' in error &&
      typeof error.stdout === 'string'
    ) {
      return error.stdout;
    }

    throw error;
  }
}

const diff = getStagedDiff();

function getFindings(diffText) {
  const findings = [];
  const lines = diffText.split('\n');
  let currentFile = null;
  let nextLineNumber = 0;

  for (const line of lines) {
    if (line.startsWith('diff --git ')) {
      const match = line.match(/^diff --git a\/(.+) b\/(.+)$/);
      currentFile = match ? match[2] : null;
      nextLineNumber = 0;
      continue;
    }

    if (!currentFile || ignoredFiles.has(currentFile)) {
      continue;
    }

    if (line.startsWith('@@')) {
      const match = line.match(/^\@\@ -\d+(?:,\d+)? \+(\d+)/);
      nextLineNumber = match ? Number(match[1]) : 0;
      continue;
    }

    if (line.startsWith('+++') || line.startsWith('---')) {
      continue;
    }

    if (line.startsWith('+')) {
      const content = line.slice(1);

      if (pattern.test(content)) {
        findings.push({
          file: currentFile,
          line: nextLineNumber,
          snippet: content.trim(),
        });
      }

      nextLineNumber += 1;
      continue;
    }

    if (line.startsWith(' ')) {
      nextLineNumber += 1;
    }
  }

  return findings;
}

const findings = getFindings(diff);

if (findings.length > 0) {
  const details = findings
    .map(
      ({ file, line, snippet }) =>
        `  - ${file}:${line} ${snippet.slice(0, 120)}`,
    )
    .join('\n');

  process.stderr.write('[lint-staged] New explicit any usages were found:\n');
  process.stderr.write(`${details}\n`);
  process.exit(1);
}
