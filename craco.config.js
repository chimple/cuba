// craco.config.js
const webpack = require("webpack");

module.exports = {
  webpack: {
    alias: {
      "./workers/node": false, // your existing alias for lido-standalone
    },
    configure: (config) => {
      // Ensure resolve exists
      config.resolve = config.resolve || {};

      // Webpack 5: provide fallbacks for Node core modules
      config.resolve.fallback = {
        ...(config.resolve.fallback || {}),
        crypto: require.resolve("crypto-browserify"),
        path: require.resolve("path-browserify"),
        stream: require.resolve("stream-browserify"),
        buffer: require.resolve("buffer"),
        fs: false, // no fs in browser
      };

      // Provide process & Buffer globals for libs that expect them
      config.plugins = [
        ...(config.plugins || []),
        new webpack.ProvidePlugin({
          process: "process/browser",
          Buffer: ["buffer", "Buffer"],
        }),
      ];

      return config;
    },
  },
};
