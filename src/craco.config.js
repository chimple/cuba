module.exports = {
  webpack: {
    alias: {
      "./workers/node": false, // This ignores the Node-only worker in lido-standalone
    },
  },
};
