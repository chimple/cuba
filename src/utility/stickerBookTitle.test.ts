import i18n from '../i18n';
import { resolveStickerBookTitle } from './stickerBookTitle';

jest.mock('../i18n', () => ({
  __esModule: true,
  default: {
    language: 'hi',
    exists: jest.fn((key: string) => key === 'Existing Book'),
    t: jest.fn((key: string) =>
      key === 'Existing Book' ? 'पुरानी पुस्तक' : key,
    ),
  },
}));

describe('resolveStickerBookTitle', () => {
  beforeEach(() => {
    (i18n.exists as jest.Mock).mockImplementation(
      (key: string) => key === 'Existing Book',
    );
    (i18n.t as jest.Mock).mockImplementation((key: string) =>
      key === 'Existing Book' ? 'पुरानी पुस्तक' : key,
    );
  });

  it('uses the database translation for the active language', () => {
    expect(resolveStickerBookTitle('Book 3', '{"hi":"बुक 3"}', 'hi-IN')).toBe(
      'बुक 3',
    );
  });

  it('normalizes regional language codes for database translations', () => {
    expect(
      resolveStickerBookTitle('Tiny Friends', '{"pt":"Amiguinhos"}', 'pt-BR'),
    ).toBe('Amiguinhos');
  });

  it('falls back to the bundled translation when the database value is absent', () => {
    expect(resolveStickerBookTitle('Existing Book', null, 'hi')).toBe(
      'पुरानी पुस्तक',
    );
  });

  it('uses an uppercase legacy locale key for a title-case database title', () => {
    (i18n.exists as jest.Mock).mockImplementation(
      (key: string) => key === 'CHIRPY BUDS',
    );
    (i18n.t as jest.Mock).mockImplementation((key: string) =>
      key === 'CHIRPY BUDS' ? 'चहचहाती कलियाँ' : key,
    );

    expect(resolveStickerBookTitle('Chirpy Buds', null, 'hi')).toBe(
      'चहचहाती कलियाँ',
    );
  });

  it('falls back to the English title for missing or invalid translations', () => {
    expect(resolveStickerBookTitle('Book 4', '{invalid}', 'hi')).toBe('Book 4');
  });
});
