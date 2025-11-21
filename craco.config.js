// craco.config.js
const webpack = require("webpack");

module.exports = {
  webpack: {
    alias: {
      "./workers/node": false,
      "process/browser": require.resolve("process/browser"),
    },
    configure: (config) => {
      config.resolve = config.resolve || {};

      config.resolve.fallback = {
        ...(config.resolve.fallback || {}),
        crypto: require.resolve("crypto-browserify"),
        stream: require.resolve("stream-browserify"),
        buffer: require.resolve("buffer"),
        path: require.resolve("path-browserify"),
        vm: require.resolve("vm-browserify"),
        os: require.resolve("os-browserify/browser"),
        assert: require.resolve("assert"),
        http: require.resolve("stream-http"),
        https: require.resolve("https-browserify"),
        url: require.resolve("url"),
        zlib: require.resolve("browserify-zlib"),
        process: require.resolve("process/browser"),

        // Modules you definitely don’t have in the browser
        fs: false,
        net: false,
        tls: false,
      };

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
