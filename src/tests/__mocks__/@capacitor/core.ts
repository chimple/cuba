export const Capacitor = {
  isNativePlatform: jest.fn(() => false),
  getPlatform: jest.fn(() => 'web'),
};

export const registerPlugin = jest.fn(() => ({}));
