const path = require("path");

const reactRefreshRuntime = require.resolve("react-refresh/runtime");

module.exports = {
  webpack: {
    alias: {
      "./workers/node": false, // ignore node-only worker in lido-standalone
    },
    configure: (webpackConfig) => {
      const scopePlugin = webpackConfig.resolve.plugins.find(
        (plugin) => plugin.constructor && plugin.constructor.name === "ModuleScopePlugin"
      );

      if (scopePlugin) {
        scopePlugin.allowedFiles.add(reactRefreshRuntime);
        scopePlugin.allowedPaths.push(path.dirname(reactRefreshRuntime));
      }

      return webpackConfig;
    },
  },
};
