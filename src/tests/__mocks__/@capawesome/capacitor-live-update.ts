export const LiveUpdate = {
  getVersionName: jest.fn().mockResolvedValue({ versionName: "0.0.0" }),
  getCurrentBundle: jest.fn().mockResolvedValue({ bundleId: "local" }),
  fetchLatestBundle: jest.fn().mockResolvedValue({}),
};
