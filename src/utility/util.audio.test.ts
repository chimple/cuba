import { Capacitor, CapacitorHttp } from '@capacitor/core';
import { Directory, Filesystem } from '@capacitor/filesystem';
import { TextToSpeech } from '@capacitor-community/text-to-speech';
import { Util } from './util';

jest.mock('@capacitor/core');
jest.mock('@capacitor/filesystem');
jest.mock('@capacitor-community/text-to-speech');

describe('Util common audio helpers', () => {
  const originalAudio = global.Audio;

  beforeEach(async () => {
    jest.clearAllMocks();
    localStorage.clear();
    (Capacitor.isNativePlatform as jest.Mock).mockReturnValue(false);
    (Capacitor.convertFileSrc as jest.Mock).mockImplementation(
      (uri: string) => `converted:${uri}`,
    );
    (TextToSpeech.stop as jest.Mock).mockResolvedValue(undefined);
    (TextToSpeech.speak as jest.Mock).mockResolvedValue(undefined);

    await Util.stopAudioUrlOrTtsPlayback();
  });

  afterAll(() => {
    global.Audio = originalAudio;
  });

  test('returns the original audio url on web', async () => {
    await expect(
      Util.getCachedAudioUrl('https://cdn.example.com/audio-web.mp3'),
    ).resolves.toBe('https://cdn.example.com/audio-web.mp3');

    expect(Filesystem.stat).not.toHaveBeenCalled();
    expect(CapacitorHttp.get).not.toHaveBeenCalled();
  });

  test('returns converted local uri when native cache already exists', async () => {
    (Capacitor.isNativePlatform as jest.Mock).mockReturnValue(true);
    (Filesystem.stat as jest.Mock).mockResolvedValue({});
    (Filesystem.getUri as jest.Mock).mockResolvedValue({
      uri: 'file:///cached-audio.mp3',
    });

    await expect(
      Util.getCachedAudioUrl('https://cdn.example.com/audio-native-hit.mp3'),
    ).resolves.toBe('converted:file:///cached-audio.mp3');

    expect(Filesystem.stat).toHaveBeenCalledWith({
      path: expect.stringContaining('commonAudioCache'),
      directory: Directory.Data,
    });
    expect(CapacitorHttp.get).not.toHaveBeenCalled();
  });

  test('downloads and caches remote audio on native cache miss', async () => {
    (Capacitor.isNativePlatform as jest.Mock).mockReturnValue(true);
    (Filesystem.stat as jest.Mock).mockRejectedValueOnce(new Error('missing'));
    (Filesystem.mkdir as jest.Mock).mockResolvedValue({});
    (Filesystem.writeFile as jest.Mock).mockResolvedValue({});
    (Filesystem.getUri as jest.Mock).mockResolvedValue({
      uri: 'file:///downloaded-audio.mp3',
    });
    (CapacitorHttp.get as jest.Mock).mockResolvedValue({
      status: 200,
      data: 'YmFzZTY0QXVkaW8=',
    });

    await expect(
      Util.getCachedAudioUrl('https://cdn.example.com/audio-native-miss.mp3'),
    ).resolves.toBe('converted:file:///downloaded-audio.mp3');

    expect(CapacitorHttp.get).toHaveBeenCalledWith(
      expect.objectContaining({
        url: 'https://cdn.example.com/audio-native-miss.mp3',
        responseType: 'blob',
      }),
    );
    expect(Filesystem.writeFile).toHaveBeenCalledWith(
      expect.objectContaining({
        directory: Directory.Data,
        data: 'YmFzZTY0QXVkaW8=',
        recursive: true,
      }),
    );
  });

  test('plays audio url when present', async () => {
    const play = jest.fn().mockResolvedValue(undefined);
    const pause = jest.fn();

    global.Audio = jest.fn().mockImplementation((src: string) => ({
      src,
      preload: '',
      currentTime: 0,
      pause,
      play,
      onended: null,
      onerror: null,
    })) as unknown as typeof Audio;

    await expect(
      Util.playAudioOrTts({
        audioUrl: 'https://cdn.example.com/audio-playback.mp3',
        text: 'fallback text',
      }),
    ).resolves.toBe(true);

    expect(global.Audio).toHaveBeenCalledWith(
      'https://cdn.example.com/audio-playback.mp3',
    );
    expect(play).toHaveBeenCalledTimes(1);
    expect(TextToSpeech.speak).not.toHaveBeenCalled();
  });

  test('falls back to TTS when audio url is missing', async () => {
    localStorage.setItem('language', 'hi');

    await expect(
      Util.playAudioOrTts({
        text: 'नमस्ते',
      }),
    ).resolves.toBe(true);

    expect(TextToSpeech.speak).toHaveBeenCalledWith(
      expect.objectContaining({
        text: 'नमस्ते',
        lang: 'hi-IN',
        rate: 0.9,
        pitch: 1,
        volume: 1,
      }),
    );
  });
});
