import { Capacitor } from '@capacitor/core';
import { Directory, Filesystem } from '@capacitor/filesystem';
import MD5 from 'crypto-js/md5';
import { getCachedImageSrc } from './imageCache';

jest.mock('@capacitor/core', () => ({
  Capacitor: {
    isNativePlatform: jest.fn(),
    convertFileSrc: jest.fn((uri: string) => `converted:${uri}`),
  },
}));

jest.mock('@capacitor/filesystem', () => ({
  Directory: {
    Cache: 'CACHE',
  },
  Filesystem: {
    stat: jest.fn(),
    mkdir: jest.fn(),
    downloadFile: jest.fn(),
  },
}));

describe('imageCache', () => {
  const remoteUrl = 'https://cdn.example.com/images/course.png';

  beforeEach(() => {
    jest.clearAllMocks();
    (Capacitor.isNativePlatform as jest.Mock).mockReturnValue(true);
  });

  it('returns the original URL for local or web-only paths', async () => {
    (Capacitor.isNativePlatform as jest.Mock).mockReturnValue(false);

    await expect(getCachedImageSrc('/assets/local.png')).resolves.toBe(
      '/assets/local.png',
    );
    expect(Filesystem.stat).not.toHaveBeenCalled();
  });

  it('returns a cached file URI when the image already exists', async () => {
    (Filesystem.stat as jest.Mock).mockResolvedValueOnce({
      uri: 'file:///cache/image_cache/existing.img',
    });

    await expect(getCachedImageSrc(remoteUrl)).resolves.toBe(
      'converted:file:///cache/image_cache/existing.img',
    );

    expect(Filesystem.downloadFile).not.toHaveBeenCalled();
    expect(Capacitor.convertFileSrc).toHaveBeenCalledWith(
      'file:///cache/image_cache/existing.img',
    );
  });

  it('downloads and stores a missing image in the cache directory', async () => {
    const cacheFileName = `${MD5(remoteUrl).toString()}.img`;
    (Filesystem.stat as jest.Mock)
      .mockRejectedValueOnce(new Error('missing'))
      .mockResolvedValueOnce({
        uri: `file:///cache/image_cache/${cacheFileName}`,
      });
    (Filesystem.downloadFile as jest.Mock).mockResolvedValueOnce({});

    await expect(getCachedImageSrc(remoteUrl)).resolves.toBe(
      `converted:file:///cache/image_cache/${cacheFileName}`,
    );

    expect(Filesystem.mkdir).toHaveBeenCalledWith(
      expect.objectContaining({
        path: 'image_cache',
        directory: Directory.Cache,
        recursive: true,
      }),
    );
    expect(Filesystem.downloadFile).toHaveBeenCalledWith(
      expect.objectContaining({
        url: remoteUrl,
        path: `image_cache/${cacheFileName}`,
        directory: Directory.Cache,
      }),
    );
  });

  it('deduplicates simultaneous requests for the same URL', async () => {
    const cacheFileName = `${MD5(remoteUrl).toString()}.img`;
    let resolveDownload: (() => void) | undefined;

    (Filesystem.stat as jest.Mock)
      .mockRejectedValueOnce(new Error('missing'))
      .mockResolvedValueOnce({
        uri: `file:///cache/image_cache/${cacheFileName}`,
      });
    (Filesystem.downloadFile as jest.Mock).mockReturnValueOnce(
      new Promise<void>((resolve) => {
        resolveDownload = resolve;
      }),
    );

    const firstRequest = getCachedImageSrc(remoteUrl);
    const secondRequest = getCachedImageSrc(remoteUrl);

    expect(Filesystem.stat).toHaveBeenCalledTimes(1);
    expect(Filesystem.downloadFile).toHaveBeenCalledTimes(1);

    resolveDownload?.();

    await expect(firstRequest).resolves.toBe(
      `converted:file:///cache/image_cache/${cacheFileName}`,
    );
    await expect(secondRequest).resolves.toBe(
      `converted:file:///cache/image_cache/${cacheFileName}`,
    );
  });
});
