export const Device = {
  getInfo: jest.fn().mockResolvedValue({
    platform: "web",
    model: "jest",
    operatingSystem: "web",
    osVersion: "0",
    manufacturer: "jest",
  }),
};
