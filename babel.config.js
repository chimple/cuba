const transformImportMetaEnvForJest = () => ({
  name: 'transform-import-meta-env-for-jest',
  visitor: {
    MetaProperty(path) {
      const meta = path.get('meta');
      const property = path.get('property');

      if (!meta.isIdentifier({ name: 'import' })) {
        return;
      }

      if (!property.isIdentifier({ name: 'meta' })) {
        return;
      }

      const memberExpression = path.parentPath;
      if (!memberExpression.isMemberExpression()) {
        return;
      }

      const envProperty = memberExpression.get('property');
      if (!envProperty.isIdentifier({ name: 'env' })) {
        return;
      }

      memberExpression.replaceWithSourceString('process.env');
    },
  },
});

module.exports = {
  presets: [
    ['@babel/preset-env', { targets: { node: 'current' } }],
    ['@babel/preset-react', { runtime: 'automatic' }],
    '@babel/preset-typescript',
  ],
  plugins: [transformImportMetaEnvForJest],
};
