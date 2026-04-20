export const Capacitor = {
  convertFileSrc: jest.fn((uri: string) => uri),
  isNativePlatform: jest.fn(() => false),
  getPlatform: jest.fn(() => 'web'),
};

export const CapacitorHttp = {
  get: jest.fn(),
};

export const registerPlugin = jest.fn(() => ({}));
