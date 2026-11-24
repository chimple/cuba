const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const postcss = require('postcss');
const ts = require('typescript');

const runGit = (args) =>
  execFileSync('git', args, { encoding: 'utf8' }).trimEnd();

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
      const removedLine = line.slice(1);
      if (
        /(?:^|\s)(?:className|id|onClick|onPress|role|data-trackable-id|trackableId)\s*=/.test(
          removedLine,
        ) ||
        removedLine.includes('getTrackableProps')
      ) {
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
    (attribute) =>
      ts.isJsxAttribute(attribute) &&
      attribute.name.getText(sourceFile) === name,
  );

const getStringValue = (attribute) => {
  if (!attribute || !attribute.initializer) return null;
  return ts.isStringLiteral(attribute.initializer)
    ? attribute.initializer.text
    : null;
};

const getClassNameTokens = (attribute) => {
  if (!attribute || !attribute.initializer) return null;
  const initializer = attribute.initializer;
  if (ts.isStringLiteral(initializer)) {
    return initializer.text.trim().split(/\s+/).filter(Boolean);
  }
  if (!ts.isJsxExpression(initializer) || !initializer.expression) return null;

  const expression = initializer.expression;
  if (
    ts.isStringLiteral(expression) ||
    ts.isNoSubstitutionTemplateLiteral(expression)
  ) {
    return expression.text.trim().split(/\s+/).filter(Boolean);
  }
  if (!ts.isTemplateExpression(expression)) return null;

  const templateParts = [expression.head.text];
  for (const span of expression.templateSpans) {
    if (ts.isIdentifier(span.expression)) {
      templateParts.push(`__dynamic_${span.expression.text}`);
    }
    templateParts.push(span.literal.text);
  }
  return templateParts.join(' ').trim().split(/\s+/).filter(Boolean);
};

const isButtonOrCard = (node, sourceFile) => {
  const tagName = node.tagName.getText(sourceFile);
  const attributes = node.attributes.properties.filter(ts.isJsxAttribute);
  return (
    tagName === 'button' ||
    tagName === 'a' ||
    tagName === 'BottomNavigationAction' ||
    tagName === 'CommonToggle' ||
    /Button$|Card$/.test(tagName) ||
    attributes.some((attribute) => {
      const name = attribute.name.getText(sourceFile);
      return (
        name === 'onClick' ||
        name === 'onPress' ||
        (name === 'role' && getStringValue(attribute) === 'button')
      );
    })
  );
};

const hasChangedIdentity = (
  node,
  sourceFile,
  addedLines,
  removedIdentityLines,
) => {
  const openingLine =
    sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile)).line +
    1;
  if (addedLines.has(openingLine)) return true;

  const closingLine =
    sourceFile.getLineAndCharacterOfPosition(node.getEnd()).line + 1;
  if (
    [...removedIdentityLines].some(
      (line) => line >= openingLine && line <= closingLine,
    )
  ) {
    return true;
  }

  const attributes = node.attributes.properties;
  return attributes.some((attribute) => {
    if (ts.isJsxSpreadAttribute(attribute)) {
      if (
        !/getTrackableProps|trackableId/.test(
          attribute.expression.getText(sourceFile),
        )
      ) {
        return false;
      }
    } else {
      const name = attribute.name.getText(sourceFile);
      if (
        ![
          'className',
          'id',
          'onClick',
          'onPress',
          'role',
          'data-trackable-id',
          'trackableId',
        ].includes(name)
      ) {
        return false;
      }
    }
    const start =
      sourceFile.getLineAndCharacterOfPosition(attribute.getStart(sourceFile))
        .line + 1;
    const end =
      sourceFile.getLineAndCharacterOfPosition(attribute.getEnd()).line + 1;
    for (let line = start; line <= end; line++) {
      if (addedLines.has(line)) return true;
    }
    return false;
  });
};

const hasMatchingIdentityToken = (className, id) => {
  if (
    !Array.isArray(className) ||
    !className.length ||
    typeof id !== 'string'
  ) {
    return false;
  }
  if (/^[A-Za-z_][A-Za-z0-9_-]*$/.test(id)) return className.includes(id);

  // Keep existing controls whose id is the complete class list unchanged.
  return className.join(' ') === id.trim().split(/\s+/).join(' ');
};

const getTrackableIdValues = (file, source) => {
  const sourceFile = ts.createSourceFile(
    file,
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );
  const values = new Map();
  const visit = (node) => {
    if (
      ts.isVariableDeclaration(node) &&
      ts.isIdentifier(node.name) &&
      node.name.text === 'TRACKABLE_IDS' &&
      node.initializer &&
      ts.isObjectLiteralExpression(node.initializer)
    ) {
      for (const property of node.initializer.properties) {
        if (
          ts.isPropertyAssignment(property) &&
          property.initializer &&
          ts.isStringLiteral(property.initializer)
        ) {
          values.set(
            property.name.getText(sourceFile),
            property.initializer.text,
          );
        }
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(sourceFile);
  return values;
};

const getStaticTrackableId = (expression, sourceFile, trackableIdValues) => {
  if (!expression) return null;
  if (ts.isStringLiteral(expression)) return expression.text;
  if (ts.isIdentifier(expression)) return `__dynamic_${expression.text}`;
  if (
    ts.isPropertyAccessExpression(expression) &&
    expression.expression.getText(sourceFile) === 'TRACKABLE_IDS'
  ) {
    return trackableIdValues.get(expression.name.text) ?? null;
  }
  return null;
};

const getIdentityId = (attribute, sourceFile, trackableIdValues) => {
  if (!attribute || !attribute.initializer) return null;
  const initializer = attribute.initializer;
  const expression = ts.isJsxExpression(initializer)
    ? initializer.expression
    : initializer;
  return getStaticTrackableId(expression, sourceFile, trackableIdValues);
};

const getTrackableIdDetails = (node, sourceFile, trackableIdValues) => {
  let present = false;
  let value = null;
  const attributes = node.attributes.properties;

  for (const attribute of attributes.filter(ts.isJsxAttribute)) {
    const name = attribute.name.getText(sourceFile);
    if (!['data-trackable-id', 'trackableId'].includes(name)) continue;
    present = true;
    const initializer = attribute.initializer;
    const expression =
      initializer && ts.isJsxExpression(initializer)
        ? initializer.expression
        : initializer;
    value = getStaticTrackableId(expression, sourceFile, trackableIdValues);
    if (value) return { present, value };
  }

  const findTrackableProps = (expression) => {
    if (
      ts.isCallExpression(expression) &&
      ts.isIdentifier(expression.expression) &&
      expression.expression.text === 'getTrackableProps'
    ) {
      present = true;
      return getStaticTrackableId(
        expression.arguments[0],
        sourceFile,
        trackableIdValues,
      );
    }
    let found = null;
    ts.forEachChild(expression, (child) => {
      if (!found) found = findTrackableProps(child);
    });
    return found;
  };

  for (const attribute of attributes.filter(ts.isJsxSpreadAttribute)) {
    value = findTrackableProps(attribute.expression);
    if (value) return { present, value };
  }

  return { present, value };
};

const getInteractiveNodes = (file, source) => {
  const sourceFile = ts.createSourceFile(
    file,
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );
  const nodes = [];

  const visit = (node) => {
    if (
      (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) &&
      isButtonOrCard(node, sourceFile)
    ) {
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
    return fullPath.endsWith('.tsx') && !fullPath.endsWith('.test.tsx')
      ? [fullPath]
      : [];
  });

const getChangedCssSelectors = (file, source, changedLines) => {
  const selectors = new Set();
  const root = postcss.parse(source, { from: file });

  root.walkRules((rule) => {
    const startLine = rule.source.start.line;
    const endLine = rule.source.end.line;
    if (
      ![...changedLines].some((line) => line >= startLine && line <= endLine)
    ) {
      return;
    }

    for (const match of rule.selector.matchAll(
      /([.#])([A-Za-z_][A-Za-z0-9_-]*)/g,
    )) {
      selectors.add(`${match[1]}${match[2]}`);
    }
  });

  return selectors;
};

const validate = () => {
  const stagedFiles = runGit([
    'diff',
    '--cached',
    '--name-only',
    '--diff-filter=ACMR',
  ])
    .split(/\r?\n/)
    .filter(Boolean);
  const errors = [];
  const stagedFileSet = new Set(stagedFiles);
  const readSource = (file) =>
    stagedFileSet.has(file)
      ? runGit(['show', `:${file}`])
      : fs.readFileSync(file, 'utf8');
  const trackableIdValues = getTrackableIdValues(
    'src/analytics/trackable.ts',
    readSource('src/analytics/trackable.ts'),
  );

  const trackableIdLocations = new Map();
  for (const file of walk('src')) {
    const source = readSource(file);
    for (const { node, sourceFile } of getInteractiveNodes(file, source)) {
      const { value } = getTrackableIdDetails(
        node,
        sourceFile,
        trackableIdValues,
      );
      // Runtime IDs can be unique even when the checker sees the same variable name.
      if (!value || value.startsWith('__dynamic_')) continue;
      const line =
        sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile))
          .line + 1;
      const location = `${file}:${line}`;
      const firstLocation = trackableIdLocations.get(value);
      if (firstLocation) {
        errors.push(
          `${location}: data-trackable-id "${value}" is already used by ${firstLocation}.`,
        );
      } else {
        trackableIdLocations.set(value, location);
      }
    }
  }

  for (const file of stagedFiles.filter((item) => item.endsWith('.tsx'))) {
    const source = readSource(file);
    const sourceFile = ts.createSourceFile(
      file,
      source,
      ts.ScriptTarget.Latest,
      true,
      ts.ScriptKind.TSX,
    );
    const { addedLines, removedIdentityLines } = getChangedLines(file);

    const visit = (node) => {
      if (
        (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) &&
        isButtonOrCard(node, sourceFile) &&
        hasChangedIdentity(node, sourceFile, addedLines, removedIdentityLines)
      ) {
        const className = getClassNameTokens(
          getAttribute(node, sourceFile, 'className'),
        );
        const id = getIdentityId(
          getAttribute(node, sourceFile, 'id'),
          sourceFile,
          trackableIdValues,
        );
        const trackableId = getTrackableIdDetails(
          node,
          sourceFile,
          trackableIdValues,
        );
        if (!hasMatchingIdentityToken(className, id) || !trackableId.present) {
          const line =
            sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile))
              .line + 1;
          errors.push(
            `${file}:${line}: button/card needs a GrowthBook tracking ID, an id, and a matching className token.`,
          );
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
        const className = getClassNameTokens(
          getAttribute(node, sourceFile, 'className'),
        );
        const id = getIdentityId(
          getAttribute(node, sourceFile, 'id'),
          sourceFile,
          trackableIdValues,
        );
        const selectorName = selector.slice(1);
        const matches =
          selector[0] === '.'
            ? className?.includes(selectorName)
            : id === selectorName;
        if (matches && !hasMatchingIdentityToken(className, id)) {
          const line =
            sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile))
              .line + 1;
          errors.push(
            `${sourcePath}:${line}: CSS selector ${selector} on a button/card needs a className token matching its id.`,
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
  assert.strictEqual(
    hasMatchingIdentityToken(['save-button'], 'save-button'),
    true,
  );
  assert.strictEqual(
    hasMatchingIdentityToken(['save-button', 'active'], 'save-button'),
    true,
  );
  assert.strictEqual(
    hasMatchingIdentityToken(['save-button'], 'save-action'),
    false,
  );
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
    [
      ...getChangedCssSelectors(
        'Button.css',
        '.save-button {\n  color: red;\n}\n',
        new Set([2]),
      ),
    ],
    ['.save-button'],
  );
  assert.deepStrictEqual(
    [
      ...getChangedCssSelectors(
        'Button.css',
        '#save-button:disabled {\n  color: red;\n}\n',
        new Set([2]),
      ),
    ],
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
