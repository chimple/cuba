const path = require('path');

const LOG_METHODS = new Set(['debug', 'info', 'warn', 'error']);
const METADATA_KEYS = new Set(['file_name', 'line_number', 'function_name']);
const shouldInjectSourceLocation = (filePath) =>
  !/[/\\]src[/\\]utility[/\\]/.test(filePath);

const hasMetadataKey = (node, t) =>
  t.isObjectProperty(node) &&
  ((t.isIdentifier(node.key) && METADATA_KEYS.has(node.key.name)) ||
    (t.isStringLiteral(node.key) && METADATA_KEYS.has(node.key.value)));

const getFunctionName = (pathRef, t) => {
  const fn = pathRef.getFunctionParent();
  if (!fn) return undefined;

  if (fn.isFunctionDeclaration() && fn.node.id?.name) {
    return fn.node.id.name;
  }

  if (
    (fn.isFunctionExpression() || fn.isArrowFunctionExpression()) &&
    fn.node.id?.name
  ) {
    return fn.node.id.name;
  }

  const parent = fn.parentPath;
  if (parent?.isVariableDeclarator() && t.isIdentifier(parent.node.id)) {
    return parent.node.id.name;
  }

  if (parent?.isObjectProperty()) {
    if (t.isIdentifier(parent.node.key)) return parent.node.key.name;
    if (t.isStringLiteral(parent.node.key)) return parent.node.key.value;
  }

  if (parent?.isClassMethod() || parent?.isObjectMethod()) {
    if (t.isIdentifier(parent.node.key)) return parent.node.key.name;
    if (t.isStringLiteral(parent.node.key)) return parent.node.key.value;
  }

  return undefined;
};

const isTargetLoggerCall = (node, t) =>
  t.isMemberExpression(node.callee) &&
  t.isIdentifier(node.callee.object, { name: 'logger' }) &&
  t.isIdentifier(node.callee.property) &&
  LOG_METHODS.has(node.callee.property.name);

module.exports = function loggerMetadataPlugin({ types: t }) {
  return {
    name: 'logger-metadata-plugin',
    visitor: {
      CallExpression(pathRef, state) {
        if (!isTargetLoggerCall(pathRef.node, t)) return;

        const filePath = state.file.opts.filename || '';
        const fileName = path.basename(filePath);
        const lineNumber = pathRef.node.loc?.start?.line;
        const functionName = getFunctionName(pathRef, t);

        const metadataProperties = [];

        if (shouldInjectSourceLocation(filePath)) {
          metadataProperties.push(
            t.objectProperty(
              t.identifier('file_name'),
              t.stringLiteral(fileName),
            ),
          );
        }

        if (
          shouldInjectSourceLocation(filePath) &&
          typeof lineNumber === 'number'
        ) {
          metadataProperties.push(
            t.objectProperty(
              t.identifier('line_number'),
              t.numericLiteral(lineNumber),
            ),
          );
        }

        if (functionName) {
          metadataProperties.push(
            t.objectProperty(
              t.identifier('function_name'),
              t.stringLiteral(functionName),
            ),
          );
        }

        const args = pathRef.node.arguments;
        const lastArg = args.at(-1);

        if (lastArg && t.isObjectExpression(lastArg)) {
          const existingKeys = new Set(
            lastArg.properties
              .filter((property) => hasMetadataKey(property, t))
              .map((property) => {
                if (
                  t.isObjectProperty(property) &&
                  t.isIdentifier(property.key)
                ) {
                  return property.key.name;
                }
                if (
                  t.isObjectProperty(property) &&
                  t.isStringLiteral(property.key)
                ) {
                  return property.key.value;
                }
                return undefined;
              })
              .filter(Boolean),
          );

          metadataProperties.forEach((property) => {
            if (
              t.isIdentifier(property.key) &&
              !existingKeys.has(property.key.name)
            ) {
              lastArg.properties.push(property);
            }
          });
          return;
        }

        args.push(t.objectExpression(metadataProperties));
      },
    },
  };
};
