import { Capacitor, CapacitorHttp } from '@capacitor/core';
import { Directory, Filesystem } from '@capacitor/filesystem';
import { TextToSpeech } from '@capacitor-community/text-to-speech';
import { AudioUtil } from './AudioUtil';
import { store } from '../redux/store';
import { ServiceConfig } from '../services/ServiceConfig';
import { LANGUAGE } from '../common/constants';
import logger from './logger';

jest.mock('@capacitor/core');
jest.mock('@capacitor/filesystem');
jest.mock('@capacitor-community/text-to-speech');
jest.mock('./logger', () => ({
  __esModule: true,
  default: {
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
  },
}));

describe('AudioUtil common audio helpers', () => {
  const originalAudio = global.Audio;

  const createMockAudioInstance = ({
    src,
    play = jest.fn().mockResolvedValue(undefined),
    pause = jest.fn(),
    volume = 1,
    currentTime = 0,
    duration = Number.POSITIVE_INFINITY,
  }: {
    src: string;
    play?: jest.Mock;
    pause?: jest.Mock;
    volume?: number;
    currentTime?: number;
    duration?: number;
  }) => ({
    src,
    preload: '',
    currentTime,
    duration,
    volume,
    pause,
    play,
    onended: null,
    onerror: null,
    onloadedmetadata: null,
    ontimeupdate: null,
  });

  const flushMicrotasks = async () => {
    await Promise.resolve();
    await Promise.resolve();
  };

  beforeEach(async () => {
    jest.useRealTimers();
    jest.clearAllMocks();
    localStorage.clear();
    (Capacitor.isNativePlatform as jest.Mock).mockReturnValue(false);
    (Capacitor.convertFileSrc as jest.Mock).mockImplementation(
      (uri: string) => `converted:${uri}`,
    );
    (TextToSpeech.stop as jest.Mock).mockResolvedValue(undefined);
    (TextToSpeech.speak as jest.Mock).mockResolvedValue(undefined);

    await AudioUtil.stopAudioUrlOrTtsPlayback();
  });

  afterAll(() => {
    global.Audio = originalAudio;
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.restoreAllMocks();
    jest.useRealTimers();
  });

  test('returns the original audio url on web', async () => {
    await expect(
      AudioUtil.getCachedAudioUrl('https://cdn.example.com/audio-web.mp3'),
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
      AudioUtil.getCachedAudioUrl(
        'https://cdn.example.com/audio-native-hit.mp3',
      ),
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
      AudioUtil.getCachedAudioUrl(
        'https://cdn.example.com/audio-native-miss.mp3',
      ),
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
    let audioInstance: any;

    global.Audio = jest.fn().mockImplementation((src: string) => {
      audioInstance = createMockAudioInstance({
        src,
        play,
        pause,
      });

      return audioInstance;
    }) as unknown as typeof Audio;

    await expect(
      AudioUtil.playAudioOrTts({
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

  test('calls onComplete when audio playback finishes', async () => {
    const play = jest.fn().mockResolvedValue(undefined);
    const pause = jest.fn();
    let audioInstance: any;
    const onComplete = jest.fn();

    global.Audio = jest.fn().mockImplementation((src: string) => {
      audioInstance = createMockAudioInstance({
        src,
        play,
        pause,
      });

      return audioInstance;
    }) as unknown as typeof Audio;

    await expect(
      AudioUtil.playAudioOrTts({
        audioUrl: 'https://cdn.example.com/audio-complete.mp3',
        onComplete,
      }),
    ).resolves.toBe(true);

    audioInstance.onended?.();

    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  test('waits before starting delayed audio playback', async () => {
    jest.useFakeTimers();
    const play = jest.fn().mockResolvedValue(undefined);
    const pause = jest.fn();

    global.Audio = jest.fn().mockImplementation((src: string) =>
      createMockAudioInstance({
        src,
        play,
        pause,
      }),
    ) as unknown as typeof Audio;

    const playbackPromise = AudioUtil.playAudioOrTts({
      audioUrl: 'https://cdn.example.com/audio-delayed.mp3',
      delayMs: 300,
    });

    await flushMicrotasks();
    expect(global.Audio).not.toHaveBeenCalled();

    jest.advanceTimersByTime(299);
    await flushMicrotasks();
    expect(global.Audio).not.toHaveBeenCalled();

    jest.advanceTimersByTime(1);
    await flushMicrotasks();
    await flushMicrotasks();

    await expect(playbackPromise).resolves.toBe(true);
    expect(global.Audio).toHaveBeenCalledWith(
      'https://cdn.example.com/audio-delayed.mp3',
    );
    expect(play).toHaveBeenCalledTimes(1);
  });

  test('delays onComplete when configured for audio playback', async () => {
    jest.useFakeTimers();
    const play = jest.fn().mockResolvedValue(undefined);
    const pause = jest.fn();
    let audioInstance: any;
    const onComplete = jest.fn();

    global.Audio = jest.fn().mockImplementation((src: string) => {
      audioInstance = createMockAudioInstance({
        src,
        play,
        pause,
      });

      return audioInstance;
    }) as unknown as typeof Audio;

    await expect(
      AudioUtil.playAudioOrTts({
        audioUrl: 'https://cdn.example.com/audio-oncomplete-delay.mp3',
        onComplete,
        onCompleteDelayMs: 300,
      }),
    ).resolves.toBe(true);

    audioInstance.onended?.();
    await flushMicrotasks();

    expect(onComplete).not.toHaveBeenCalled();

    jest.advanceTimersByTime(299);
    await flushMicrotasks();
    expect(onComplete).not.toHaveBeenCalled();

    jest.advanceTimersByTime(1);
    await flushMicrotasks();
    await flushMicrotasks();
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  test('falls back to TTS when localized audio fails after playback starts', async () => {
    localStorage.setItem(LANGUAGE, 'hi');
    const play = jest.fn().mockResolvedValue(undefined);
    const pause = jest.fn();
    let audioInstance: any;
    const onComplete = jest.fn();

    global.Audio = jest.fn().mockImplementation((src: string) => {
      audioInstance = createMockAudioInstance({
        src,
        play,
        pause,
      });

      return audioInstance;
    }) as unknown as typeof Audio;

    await expect(
      AudioUtil.playAudioOrTts({
        audioUrl: '/assets/audios/dailyReward/hi_message.mp3',
        text: 'नमस्ते',
        onComplete,
      }),
    ).resolves.toBe(true);

    audioInstance.onerror?.();
    await new Promise((resolve) => setTimeout(resolve, 120));

    expect(TextToSpeech.speak).toHaveBeenCalledWith(
      expect.objectContaining({
        text: 'नमस्ते',
        lang: 'hi-IN',
        queueStrategy: 0,
      }),
    );
    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(logger.warn).toHaveBeenCalledWith(
      '[CommonAudio] Audio playback failed; falling back to TTS',
      expect.any(Error),
    );
  });

  test('treats pause-interrupted audio playback as a benign interruption', async () => {
    const interruptionError = new Error(
      'The play() request was interrupted by a call to pause().',
    );
    const play = jest.fn().mockRejectedValue(interruptionError);
    const pause = jest.fn();
    const onComplete = jest.fn();

    global.Audio = jest.fn().mockImplementation((src: string) =>
      createMockAudioInstance({
        src,
        play,
        pause,
      }),
    ) as unknown as typeof Audio;

    await expect(
      AudioUtil.playAudioOrTts({
        audioUrl: 'https://cdn.example.com/audio-interrupted.mp3',
        onComplete,
      }),
    ).resolves.toBe(false);

    expect(onComplete).not.toHaveBeenCalled();
    expect(logger.warn).toHaveBeenCalledWith(
      '[CommonAudio] Audio playback was interrupted by a newer request',
      interruptionError,
    );
    expect(logger.error).not.toHaveBeenCalledWith(
      '[CommonAudio] Audio playback failed',
      interruptionError,
    );
  });

  test('falls back to TTS when audio url is missing', async () => {
    localStorage.setItem('language', 'hi');
    const onComplete = jest.fn();

    await expect(
      AudioUtil.playAudioOrTts({
        text: 'नमस्ते',
        onComplete,
      }),
    ).resolves.toBe(true);

    expect(TextToSpeech.speak).toHaveBeenCalledWith(
      expect.objectContaining({
        text: 'नमस्ते',
        lang: 'hi-IN',
        rate: 0.9,
        pitch: 1,
        volume: 1,
        queueStrategy: 0,
      }),
    );
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  test('starts a newer TTS request without waiting for the previous one to finish', async () => {
    let resolveFirstSpeak!: () => void;
    const firstSpeakPromise = new Promise<void>((resolve) => {
      resolveFirstSpeak = resolve;
    });

    (TextToSpeech.speak as jest.Mock)
      .mockImplementationOnce(() => firstSpeakPromise)
      .mockImplementationOnce(() => Promise.resolve());

    const firstPromise = AudioUtil.playAudioOrTts({
      text: 'first prompt',
    });

    await new Promise((resolve) => setTimeout(resolve, 120));

    const secondPromise = AudioUtil.playAudioOrTts({
      text: 'second prompt',
    });

    await expect(secondPromise).resolves.toBe(true);

    expect(TextToSpeech.speak).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ text: 'first prompt', queueStrategy: 0 }),
    );
    expect(TextToSpeech.speak).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ text: 'second prompt', queueStrategy: 0 }),
    );

    resolveFirstSpeak();
    await expect(firstPromise).resolves.toBe(false);
  });

  test('allows only the latest parallel playback request to start', async () => {
    const play = jest.fn().mockResolvedValue(undefined);
    const pause = jest.fn();

    global.Audio = jest.fn().mockImplementation((src: string) =>
      createMockAudioInstance({
        src,
        play,
        pause,
      }),
    ) as unknown as typeof Audio;

    await expect(
      Promise.all([
        AudioUtil.playAudioOrTts({
          audioUrl: 'https://cdn.example.com/audio-first.mp3',
        }),
        AudioUtil.playAudioOrTts({
          audioUrl: 'https://cdn.example.com/audio-second.mp3',
        }),
      ]),
    ).resolves.toEqual([false, true]);

    expect(global.Audio).toHaveBeenCalledTimes(1);
    expect(global.Audio).toHaveBeenCalledWith(
      'https://cdn.example.com/audio-second.mp3',
    );
    expect(play).toHaveBeenCalledTimes(1);
  });

  test('returns normalized audio language from localStorage when present', async () => {
    localStorage.setItem(LANGUAGE, 'mr-IN');

    await expect(AudioUtil.getAudioLanguageCode()).resolves.toBe('mr');
  });

  test('returns audio language from user profile when localStorage is empty', async () => {
    jest.spyOn(store, 'getState').mockReturnValue({
      auth: {
        user: {
          language_id: 'lang-hi',
        },
      },
    } as any);
    jest.spyOn(ServiceConfig, 'getI').mockReturnValue({
      apiHandler: {
        getLanguageWithId: jest.fn().mockResolvedValue({ code: 'hi-IN' }),
      },
    } as any);

    await expect(AudioUtil.getAudioLanguageCode()).resolves.toBe('hi');
  });

  test('builds localized audio urls from folder and clip name', async () => {
    localStorage.setItem(LANGUAGE, 'kn-IN');

    await expect(
      AudioUtil.getLocalizedAudioUrl('dailyReward', 'message'),
    ).resolves.toBe('/assets/audios/dailyReward/kn_message.mp3');
  });
});
