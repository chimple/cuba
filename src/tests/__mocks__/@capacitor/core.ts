export const Capacitor = {
  isNativePlatform: () => false,
  getPlatform: () => "web",
};

export const registerPlugin = jest.fn(() => ({}));
