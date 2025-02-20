const webpack = require('webpack');

module.exports = function override(config, env) {
  config.resolve.fallback = {
    http: require.resolve('stream-http'),
    https: require.resolve('https-browserify'),
    os: require.resolve('os-browserify/browser'),
    ...config.resolve.fallback,
    querystring: false,
  };
  
  config.plugins.push(
    new webpack.ProvidePlugin({
      process: 'process/browser',
      Buffer: ['buffer', 'Buffer'],
    })
  );
  return config;
};