// const path = require("path");

module.exports = {
  webpack: {
    alias: {
      "./workers/node": false, // ⛔ This disables trying to resolve this Node-only module
    },
  },
};
