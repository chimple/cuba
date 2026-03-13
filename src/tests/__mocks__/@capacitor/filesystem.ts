export const Filesystem = {
  mkdir: jest.fn().mockResolvedValue({}),
  stat: jest.fn().mockResolvedValue({}),
  writeFile: jest.fn().mockResolvedValue({}),
};

export const Directory = {
  Cache: "CACHE",
  External: "EXTERNAL",
};
