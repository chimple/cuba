import {
  ensureLocalStickerBookSvgUri,
  fetchStickerBookSvgText,
  resolveStickerBookSvgUrl,
} from './stickerBookAssets';
import { Capacitor } from '@capacitor/core';
import { Directory, Encoding, Filesystem } from '@capacitor/filesystem';

const getExpectedCachePath = (url: string) =>
  `stickerBookAssetCache/${encodeURIComponent(resolveStickerBookSvgUrl(url)).replace(/%/g, '_')}.svg`;

describe('stickerBookAssets', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (Capacitor.convertFileSrc as jest.Mock).mockImplementation(
      (uri: string) => uri,
    );
    (Capacitor.isNativePlatform as jest.Mock).mockReturnValue(false);
    Object.defineProperty(window.navigator, 'onLine', {
      configurable: true,
      value: true,
    });
  });

  test('normalizes sticker book svg urls', () => {
    expect(resolveStickerBookSvgUrl('')).toBe(
      '/assets/icons/StickerBookBoard.svg',
    );
    expect(resolveStickerBookSvgUrl('books/a.svg')).toBe('/books/a.svg');
    expect(resolveStickerBookSvgUrl('/books/a.svg')).toBe('/books/a.svg');
    expect(resolveStickerBookSvgUrl('https://cdn.example.com/a.svg')).toBe(
      'https://cdn.example.com/a.svg',
    );
  });

  test('returns local uri when native cache exists', async () => {
    (Capacitor.isNativePlatform as jest.Mock).mockReturnValue(true);
    (Filesystem.stat as jest.Mock).mockResolvedValue({});
    (Filesystem.getUri as jest.Mock).mockResolvedValue({
      uri: 'file:///cached-book.svg',
    });

    await expect(ensureLocalStickerBookSvgUri('books/a.svg')).resolves.toBe(
      'file:///cached-book.svg',
    );
    expect(Filesystem.getUri).toHaveBeenCalledWith({
      path: getExpectedCachePath('books/a.svg'),
      directory: Directory.External,
    });
  });

  test('downloads and resolves local uri when native cache misses', async () => {
    (Capacitor.isNativePlatform as jest.Mock).mockReturnValue(true);
    (Filesystem.stat as jest.Mock)
      .mockRejectedValueOnce(new Error('missing'))
      .mockResolvedValue({});
    (Filesystem.mkdir as jest.Mock).mockResolvedValue({});
    (Filesystem.writeFile as jest.Mock).mockResolvedValue({});
    (Filesystem.getUri as jest.Mock).mockResolvedValue({
      uri: 'file:///downloaded-book.svg',
    });
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      text: jest.fn().mockResolvedValue('<svg>remote</svg>'),
    }) as jest.Mock;

    await expect(ensureLocalStickerBookSvgUri('books/a.svg')).resolves.toBe(
      'file:///downloaded-book.svg',
    );

    expect(global.fetch).toHaveBeenCalledWith('/books/a.svg');
    expect(Filesystem.writeFile).toHaveBeenCalledWith({
      path: getExpectedCachePath('books/a.svg'),
      data: '<svg>remote</svg>',
      directory: Directory.External,
      encoding: Encoding.UTF8,
      recursive: true,
    });
  });

  test('fetches svg content from cached local uri on native', async () => {
    (Capacitor.isNativePlatform as jest.Mock).mockReturnValue(true);
    (Filesystem.stat as jest.Mock).mockResolvedValue({});
    (Filesystem.getUri as jest.Mock).mockResolvedValue({
      uri: 'file:///cached-book.svg',
    });
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      text: jest.fn().mockResolvedValue('<svg>remote</svg>'),
    }) as jest.Mock;

    await expect(fetchStickerBookSvgText('books/a.svg')).resolves.toBe(
      '<svg>remote</svg>',
    );
    expect(global.fetch).toHaveBeenCalledWith('file:///cached-book.svg');
  });

  test('does not touch native cache helpers on web fetch', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      text: jest.fn().mockResolvedValue('<svg>web</svg>'),
    }) as jest.Mock;

    await expect(fetchStickerBookSvgText('books/web.svg')).resolves.toBe(
      '<svg>web</svg>',
    );
    expect(Filesystem.readFile).not.toHaveBeenCalled();
    expect(Filesystem.writeFile).not.toHaveBeenCalled();
  });

  test('caches svg text with utf8 encoding on native', async () => {
    (Capacitor.isNativePlatform as jest.Mock).mockReturnValue(true);
    (Filesystem.stat as jest.Mock)
      .mockRejectedValueOnce(new Error('missing'))
      .mockResolvedValue({});
    (Filesystem.mkdir as jest.Mock).mockResolvedValue({});
    (Filesystem.writeFile as jest.Mock).mockResolvedValue({});
    (Filesystem.getUri as jest.Mock).mockResolvedValue({
      uri: 'file:///downloaded-book.svg',
    });
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      text: jest.fn().mockResolvedValue('<svg>b</svg>'),
    }) as jest.Mock;

    await ensureLocalStickerBookSvgUri('/books/b.svg');

    expect(Filesystem.writeFile).toHaveBeenCalledWith({
      path: getExpectedCachePath('/books/b.svg'),
      data: '<svg>b</svg>',
      directory: Directory.External,
      encoding: Encoding.UTF8,
      recursive: true,
    });
  });
});
