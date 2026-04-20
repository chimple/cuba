export const Filesystem = {
  mkdir: jest.fn().mockResolvedValue({}),
  getUri: jest.fn().mockResolvedValue({ uri: 'file:///mock.svg' }),
  stat: jest.fn().mockResolvedValue({}),
  readFile: jest.fn().mockResolvedValue({ data: '' }),
  writeFile: jest.fn().mockResolvedValue({}),
};

export const Directory = {
  Cache: 'CACHE',
  Data: 'DATA',
  External: 'EXTERNAL',
};

export const Encoding = {
  UTF8: 'utf8',
};
