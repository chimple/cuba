// craco.config.js
const webpack = require("webpack");

module.exports = {
  webpack: {
    alias: {
      // your existing alias
      "./workers/node": false,

      // make 'process/browser' resolve to the actual JS file
      "process/browser": require.resolve("process/browser"),
    },

    configure: (config) => {
      config.resolve = config.resolve || {};

      // Node core module fallbacks for Webpack 5
      config.resolve.fallback = {
        ...(config.resolve.fallback || {}),
        crypto: require.resolve("crypto-browserify"),
        path: require.resolve("path-browserify"),
        stream: require.resolve("stream-browserify"),
        buffer: require.resolve("buffer"),
        process: require.resolve("process/browser"),
        fs: false, // no fs in the browser
      };

      // Provide global process/Buffer for libs that expect them
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
