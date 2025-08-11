const path = require("path");

module.exports = {
  webpack: {
    alias: {
      "./workers/node": false, // ignore node-only worker in lido-standalone
    },
  },
};
