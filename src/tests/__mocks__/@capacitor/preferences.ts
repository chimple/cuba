export const Preferences = {
  keys: jest.fn().mockResolvedValue({ keys: [] }),
  get: jest.fn().mockResolvedValue({ value: null }),
  set: jest.fn().mockResolvedValue(undefined),
  remove: jest.fn().mockResolvedValue(undefined),
  clear: jest.fn().mockResolvedValue(undefined),
};
