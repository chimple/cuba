const path = require('path');

// Allowed logger methods that this plugin will process
const LOG_METHODS = new Set(['debug', 'info', 'warn', 'error']);

// Metadata keys that may be injected into the logger call
const METADATA_KEYS = new Set(['file_name', 'line_number', 'function_name']);

// Determine if source location metadata should be injected
// (skip files inside src/utility)
const shouldInjectSourceLocation = (filePath) =>
  !/[/\\]src[/\\]utility[/\\]/.test(filePath);

// Check if an object property already contains a metadata key
// This prevents duplicate metadata insertion
const hasMetadataKey = (node, t) =>
  t.isObjectProperty(node) &&
  ((t.isIdentifier(node.key) && METADATA_KEYS.has(node.key.name)) ||
    (t.isStringLiteral(node.key) && METADATA_KEYS.has(node.key.value)));

// Extract the function name where the logger call is located
// Supports multiple function types
const getFunctionName = (pathRef, t) => {
  const fn = pathRef.getFunctionParent();
  if (!fn) return undefined;

  // Handle function declarations
  if (fn.isFunctionDeclaration() && fn.node.id?.name) {
    return fn.node.id.name;
  }

  // Handle named function expressions and arrow functions
  if (
    (fn.isFunctionExpression() || fn.isArrowFunctionExpression()) &&
    fn.node.id?.name
  ) {
    return fn.node.id.name;
  }

  // Handle functions assigned to variables
  const parent = fn.parentPath;
  if (parent?.isVariableDeclarator() && t.isIdentifier(parent.node.id)) {
    return parent.node.id.name;
  }

  // Handle functions inside objects
  if (parent?.isObjectProperty()) {
    if (t.isIdentifier(parent.node.key)) return parent.node.key.name;
    if (t.isStringLiteral(parent.node.key)) return parent.node.key.value;
  }

  // Handle class methods and object methods
  if (parent?.isClassMethod() || parent?.isObjectMethod()) {
    if (t.isIdentifier(parent.node.key)) return parent.node.key.name;
    if (t.isStringLiteral(parent.node.key)) return parent.node.key.value;
  }

  return undefined;
};

// Check if the call expression is a logger call
// Example: logger.debug(), logger.info(), logger.warn(), logger.error()
const isTargetLoggerCall = (node, t) =>
  t.isMemberExpression(node.callee) &&
  t.isIdentifier(node.callee.object, { name: 'logger' }) &&
  t.isIdentifier(node.callee.property) &&
  LOG_METHODS.has(node.callee.property.name);

// Babel plugin definition
module.exports = function loggerMetadataPlugin({ types: t }) {
  return {
    name: 'logger-metadata-plugin',

    visitor: {
      // Visit every CallExpression in the AST
      CallExpression(pathRef, state) {
        // Ignore calls that are not logger.* methods
        if (!isTargetLoggerCall(pathRef.node, t)) return;

        // Get the current file path
        const filePath = state.file.opts.filename || '';

        // Extract only the file name
        const fileName = path.basename(filePath);

        // Get the line number of the logger call
        const lineNumber = pathRef.node.loc?.start?.line;

        // Determine the function name where the logger call exists
        const functionName = getFunctionName(pathRef, t);

        const metadataProperties = [];

        // Inject file_name metadata (unless file is inside src/utility)
        if (shouldInjectSourceLocation(filePath)) {
          metadataProperties.push(
            t.objectProperty(
              t.identifier('file_name'),
              t.stringLiteral(fileName),
            ),
          );
        }

        // Inject line_number metadata
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

        // Inject function_name metadata if available
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

        // If the last argument is already an object,
        // append metadata without overwriting existing values
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

          // Add only missing metadata properties
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

        // If no metadata object exists,
        // create a new object and append it as the last argument
        args.push(t.objectExpression(metadataProperties));
      },
    },
  };
};
