export const TextToSpeech = {
  speak: jest.fn(),
  stop: jest.fn(),
  getSupportedLanguages: jest.fn().mockResolvedValue({ languages: ['en-IN'] }),
  getSupportedVoices: jest.fn().mockResolvedValue({ voices: [] }),
  isLanguageSupported: jest.fn().mockResolvedValue({ supported: true }),
  openInstall: jest.fn(),
  addListener: jest.fn(),
};

export const QueueStrategy = {
  Flush: 0,
  Add: 1,
};
