const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const postcss = require('postcss');
const ts = require('typescript');

const runGit = (args) => execFileSync('git', args, { encoding: 'utf8' }).trimEnd();

const getChangedLinesFromDiff = (diff) => {
  const addedLines = new Set();
  const changedLines = new Set();
  const removedIdentityLines = new Set();
  let newLine = 0;
  let inHunk = false;

  for (const line of diff.split(/\r?\n/)) {
    const hunk = line.match(/^@@ -\d+(?:,\d+)? \+(\d+)(?:,\d+)? @@/);
    if (hunk) {
      inHunk = true;
      newLine = Number(hunk[1]);
    } else if (!inHunk && (line.startsWith('+++') || line.startsWith('---'))) {
      continue;
    } else if (line.startsWith('+')) {
      addedLines.add(newLine);
      changedLines.add(newLine++);
    } else if (line.startsWith('-')) {
      changedLines.add(newLine);
      if (newLine > 1) changedLines.add(newLine - 1);
      if (/(?:^|\s)(?:className|id|onClick|onPress|role)\s*=/.test(line.slice(1))) {
        removedIdentityLines.add(newLine);
        if (newLine > 1) removedIdentityLines.add(newLine - 1);
      }
    } else if (line.startsWith(' ')) {
      newLine++;
    }
  }

  return { addedLines, changedLines, removedIdentityLines };
};

const getChangedLines = (file) =>
  getChangedLinesFromDiff(
    runGit(['diff', '--cached', '--unified=0', '--', file]),
  );

const getAttribute = (node, sourceFile, name) =>
  node.attributes.properties.find(
    (attribute) => ts.isJsxAttribute(attribute) && attribute.name.getText(sourceFile) === name,
  );

const getStringValue = (attribute) => {
  if (!attribute || !attribute.initializer) return null;
  return ts.isStringLiteral(attribute.initializer) ? attribute.initializer.text : null;
};

const isButtonOrCard = (node, sourceFile) => {
  const tagName = node.tagName.getText(sourceFile);
  const attributes = node.attributes.properties.filter(ts.isJsxAttribute);
  return (
    tagName === 'button' ||
    tagName === 'a' ||
    /Button$|Card$/.test(tagName) ||
    attributes.some((attribute) => {
      const name = attribute.name.getText(sourceFile);
      return name === 'onClick' || name === 'onPress' || (name === 'role' && getStringValue(attribute) === 'button');
    })
  );
};

const hasChangedIdentity = (
  node,
  sourceFile,
  addedLines,
  removedIdentityLines,
) => {
  const openingLine = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile)).line + 1;
  if (addedLines.has(openingLine)) return true;

  const closingLine = sourceFile.getLineAndCharacterOfPosition(node.getEnd()).line + 1;
  if (
    [...removedIdentityLines].some(
      (line) => line >= openingLine && line <= closingLine,
    )
  ) {
    return true;
  }

  const attributes = node.attributes.properties.filter(ts.isJsxAttribute);
  return attributes.some((attribute) => {
    const name = attribute.name.getText(sourceFile);
    if (!['className', 'id', 'onClick', 'onPress', 'role'].includes(name)) {
      return false;
    }
    const start = sourceFile.getLineAndCharacterOfPosition(attribute.getStart(sourceFile)).line + 1;
    const end = sourceFile.getLineAndCharacterOfPosition(attribute.getEnd()).line + 1;
    for (let line = start; line <= end; line++) {
      if (addedLines.has(line)) return true;
    }
    return false;
  });
};

const isSingleMatchingIdentity = (className, id) =>
  typeof className === 'string' && /^[A-Za-z_][A-Za-z0-9_-]*$/.test(className) && id === className;

const getInteractiveNodes = (file, source) => {
  const sourceFile = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const nodes = [];

  const visit = (node) => {
    if ((ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) && isButtonOrCard(node, sourceFile)) {
      nodes.push({ node, sourceFile, file });
    }
    ts.forEachChild(node, visit);
  };

  visit(sourceFile);
  return nodes;
};

const walk = (directory) =>
  fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) return walk(fullPath);
    return fullPath.endsWith('.tsx') && !fullPath.endsWith('.test.tsx') ? [fullPath] : [];
  });

const getChangedCssSelectors = (file, source, changedLines) => {
  const selectors = new Set();
  const root = postcss.parse(source, { from: file });

  root.walkRules((rule) => {
    const startLine = rule.source.start.line;
    const endLine = rule.source.end.line;
    if (![...changedLines].some((line) => line >= startLine && line <= endLine)) {
      return;
    }

    for (const match of rule.selector.matchAll(/([.#])([A-Za-z_][A-Za-z0-9_-]*)/g)) {
      selectors.add(`${match[1]}${match[2]}`);
    }
  });

  return selectors;
};

const validate = () => {
  const stagedFiles = runGit(['diff', '--cached', '--name-only', '--diff-filter=ACMR']).split(/\r?\n/).filter(Boolean);
  const errors = [];

  for (const file of stagedFiles.filter((item) => item.endsWith('.tsx'))) {
    const source = runGit(['show', `:${file}`]);
    const sourceFile = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
    const { addedLines, removedIdentityLines } = getChangedLines(file);

    const visit = (node) => {
      if (
        (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) &&
        isButtonOrCard(node, sourceFile) &&
        hasChangedIdentity(node, sourceFile, addedLines, removedIdentityLines)
      ) {
        const className = getStringValue(getAttribute(node, sourceFile, 'className'));
        const id = getStringValue(getAttribute(node, sourceFile, 'id'));
        if (!isSingleMatchingIdentity(className, id)) {
          const line = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile)).line + 1;
          errors.push(`${file}:${line}: button/card className and id must be the same single CSS name.`);
        }
      }
      ts.forEachChild(node, visit);
    };

    visit(sourceFile);
  }

  for (const file of stagedFiles.filter((item) => item.endsWith('.css'))) {
    const { changedLines } = getChangedLines(file);
    const source = runGit(['show', `:${file}`]);
    const changedSelectors = getChangedCssSelectors(file, source, changedLines);

    const interactiveNodes = walk('src').flatMap((sourcePath) =>
      getInteractiveNodes(sourcePath, fs.readFileSync(sourcePath, 'utf8')),
    );
    for (const selector of changedSelectors) {
      for (const { node, sourceFile, file: sourcePath } of interactiveNodes) {
        const className = getStringValue(getAttribute(node, sourceFile, 'className'));
        const id = getStringValue(getAttribute(node, sourceFile, 'id'));
        const selectorName = selector.slice(1);
        const matches =
          selector[0] === '.'
            ? className?.split(/\s+/).includes(selectorName)
            : id === selectorName;
        if (matches && !isSingleMatchingIdentity(className, id)) {
          const line = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile)).line + 1;
          errors.push(
            `${sourcePath}:${line}: CSS selector ${selector} on a button/card needs the same single className and id.`,
          );
        }
      }
    }
  }

  if (errors.length) {
    process.stderr.write(`${errors.join('\n')}\n`);
    process.exitCode = 1;
  }
};

if (process.argv.includes('--self-test')) {
  const assert = require('assert');
  assert.strictEqual(isSingleMatchingIdentity('save-button', 'save-button'), true);
  assert.strictEqual(isSingleMatchingIdentity('save-button active', 'save-button active'), false);
  assert.strictEqual(isSingleMatchingIdentity('save-button', 'save-action'), false);
  const jsxSource = ts.createSourceFile(
    'Button.tsx',
    '<button\n  className="save-button"\n/>',
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );
  const jsxNode = jsxSource.statements[0].expression;
  const change = getChangedLinesFromDiff(
    [
      'diff --git a/Button.tsx b/Button.tsx',
      '--- a/Button.tsx',
      '+++ b/Button.tsx',
      '@@ -1,4 +1,3 @@',
      ' <button',
      '   className="save-button"',
      '-  id="save-button"',
      ' />',
    ].join('\n'),
  );
  assert.strictEqual(
    hasChangedIdentity(
      jsxNode,
      jsxSource,
      change.addedLines,
      change.removedIdentityLines,
    ),
    true,
  );
  assert.deepStrictEqual(
    [...getChangedCssSelectors('Button.css', '.save-button {\n  color: red;\n}\n', new Set([2]))],
    ['.save-button'],
  );
  assert.deepStrictEqual(
    [...getChangedCssSelectors('Button.css', '#save-button:disabled {\n  color: red;\n}\n', new Set([2]))],
    ['#save-button'],
  );
  const customPropertyDeletion = getChangedLinesFromDiff(
    [
      'diff --git a/Button.css b/Button.css',
      '--- a/Button.css',
      '+++ b/Button.css',
      '@@ -2 +1,0 @@',
      '---color: red;',
    ].join('\n'),
  );
  assert.strictEqual(customPropertyDeletion.changedLines.has(1), true);
} else {
  validate();
}
