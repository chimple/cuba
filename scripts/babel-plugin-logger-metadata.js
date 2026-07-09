const path = require('path');

const LOG_METHODS = new Set(['debug', 'info', 'warn', 'error']);
const METADATA_KEYS = new Set(['file_name', 'line_number', 'function_name']);

/**
 * Skip metadata injection for files inside src/utility.
 * (logger.ts itself lives there — avoids self-injection)
 */
const shouldInjectSourceLocation = (filePath) =>
  !/[/\\]src[/\\]utility[/\\]/.test(filePath);

/**
 * Check if an object property already has a metadata key.
 * Prevents duplicate injection on re-runs.
 */
const hasMetadataKey = (node, t) =>
  t.isObjectProperty(node) &&
  ((t.isIdentifier(node.key) && METADATA_KEYS.has(node.key.name)) ||
    (t.isStringLiteral(node.key) && METADATA_KEYS.has(node.key.value)));

/**
 * Extract the key name from an object property node.
 * Returns undefined if the key is not an identifier or string literal.
 */
const getPropertyKeyName = (property, t) => {
  if (!t.isObjectProperty(property)) return undefined;
  if (t.isIdentifier(property.key)) return property.key.name;
  if (t.isStringLiteral(property.key)) return property.key.value;
  return undefined;
};

/**
 * Walk up the AST to find the nearest enclosing function name.
 * Supports: function declarations, function expressions,
 * arrow functions, variable declarators, object methods, class methods.
 */
const getFunctionName = (pathRef, t) => {
  const fn = pathRef.getFunctionParent();
  if (!fn) return undefined;

  // Named function declaration: function foo() {}
  if (fn.isFunctionDeclaration() && fn.node.id?.name) return fn.node.id.name;

  // Named function expression: const x = function foo() {}
  if (
    (fn.isFunctionExpression() || fn.isArrowFunctionExpression()) &&
    fn.node.id?.name
  )
    return fn.node.id.name;

  const parent = fn.parentPath;

  // Arrow or anonymous function assigned to variable: const foo = () => {}
  if (parent?.isVariableDeclarator() && t.isIdentifier(parent.node.id))
    return parent.node.id.name;

  // Function as object property: { foo: () => {} }
  if (parent?.isObjectProperty()) {
    if (t.isIdentifier(parent.node.key)) return parent.node.key.name;
    if (t.isStringLiteral(parent.node.key)) return parent.node.key.value;
  }

  // Class method or object method: class A { foo() {} }
  if (parent?.isClassMethod() || parent?.isObjectMethod()) {
    if (t.isIdentifier(parent.node.key)) return parent.node.key.name;
    if (t.isStringLiteral(parent.node.key)) return parent.node.key.value;
  }

  return undefined;
};

/**
 * Returns true if the call expression is a logger.* call
 * where the method is one of: debug, info, warn, error.
 */
const isTargetLoggerCall = (node, t) =>
  t.isMemberExpression(node.callee) &&
  t.isIdentifier(node.callee.object, { name: 'logger' }) &&
  t.isIdentifier(node.callee.property) &&
  LOG_METHODS.has(node.callee.property.name);

/**
 * Babel plugin that automatically injects source metadata
 * (file_name, line_number, function_name) into every logger call.
 *
 * If the last argument is already an object, metadata is merged in.
 * If not, a new metadata object is appended as the last argument.
 * Existing metadata keys are never overwritten.
 * Files inside src/utility are skipped to avoid self-injection.
 */
module.exports = function loggerMetadataPlugin({ types: t }) {
  return {
    name: 'logger-metadata-plugin',

    visitor: {
      CallExpression(pathRef, state) {
        if (!isTargetLoggerCall(pathRef.node, t)) return;

        const filePath = state.file.opts.filename || '';
        const injectSource = shouldInjectSourceLocation(filePath);

        // Build metadata properties only when needed
        const metadataProperties = [];

        if (injectSource) {
          // Cache basename — avoid repeated path.basename calls
          const fileName = path.basename(filePath);
          const lineNumber = pathRef.node.loc?.start?.line;

          metadataProperties.push(
            t.objectProperty(
              t.identifier('file_name'),
              t.stringLiteral(fileName),
            ),
          );

          if (typeof lineNumber === 'number') {
            metadataProperties.push(
              t.objectProperty(
                t.identifier('line_number'),
                t.numericLiteral(lineNumber),
              ),
            );
          }
        }

        const functionName = getFunctionName(pathRef, t);
        if (functionName) {
          metadataProperties.push(
            t.objectProperty(
              t.identifier('function_name'),
              t.stringLiteral(functionName),
            ),
          );
        }

        // Nothing to inject — exit early
        if (metadataProperties.length === 0) return;

        const args = pathRef.node.arguments;
        const lastArg = args.at(-1);

        if (lastArg && t.isObjectExpression(lastArg)) {
          // Collect existing metadata keys in one pass
          const existingKeys = new Set(
            lastArg.properties
              .map((p) =>
                hasMetadataKey(p, t) ? getPropertyKeyName(p, t) : undefined,
              )
              .filter(Boolean),
          );

          // Merge only missing metadata keys
          for (const property of metadataProperties) {
            if (
              t.isIdentifier(property.key) &&
              !existingKeys.has(property.key.name)
            ) {
              lastArg.properties.push(property);
            }
          }
          return;
        }

        // No existing object — append new metadata object as last arg
        args.push(t.objectExpression(metadataProperties));
      },
    },
  };
};
