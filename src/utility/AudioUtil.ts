import {
  QueueStrategy,
  TextToSpeech,
} from '@capacitor-community/text-to-speech';
import { LANGUAGE, TableTypes } from '../common/constants';
import logger from './logger';
import { Capacitor, CapacitorHttp } from '@capacitor/core';
import { Directory, Filesystem } from '@capacitor/filesystem';
import CryptoJS from 'crypto-js';
import { store } from '../redux/store';
import { ServiceConfig } from '../services/ServiceConfig';

export class AudioUtil {
  private static readonly SUPPORTED_AUDIO_LANGUAGE_CODES = [
    'en',
    'hi',
    'mr',
    'kn',
    'pt',
  ] as const;

  // Runtime-downloaded popup audio is stored in device app storage.
  private static readonly COMMON_AUDIO_CACHE_DIR = 'commonAudioCache';
  // Reuses resolved local file URIs after the first lookup.
  private static cachedAudioUrlMap = new Map<string, string>();
  // Deduplicates concurrent requests for the same remote audio URL.
  private static cachedAudioPromiseMap = new Map<
    string,
    Promise<string | null>
  >();
  // Keeps the current HTML audio instance so replay/close can stop it cleanly.
  private static activeCommonAudioPlayer: HTMLAudioElement | null = null;
  // Serializes shared playback state changes so concurrent callers cannot overlap.
  private static audioPlaybackLock: Promise<void> = Promise.resolve();
  // Newer playback requests invalidate older in-flight ones.
  private static audioPlaybackRequestId = 0;
  // Called when active playback is force-stopped/interrupted by another request.
  private static activePlaybackOnStop: (() => void) | null = null;
  private static readonly TTS_RESTART_DELAY_MS = 80;

  private static getAudioCacheFileName(audioUrl: string): string {
    const fallbackExtension = 'mp3';

    try {
      const parsedUrl = new URL(audioUrl);
      const extension =
        parsedUrl.pathname.split('.').pop()?.toLowerCase() ?? fallbackExtension;
      const sanitizedExtension = extension.replace(/[^a-z0-9]/g, '');

      return `${CryptoJS.SHA256(audioUrl).toString()}.${
        sanitizedExtension || fallbackExtension
      }`;
    } catch {
      return `${CryptoJS.SHA256(audioUrl).toString()}.${fallbackExtension}`;
    }
  }

  private static getCommonAudioCachePath(audioUrl: string): string {
    return `${AudioUtil.COMMON_AUDIO_CACHE_DIR}/${AudioUtil.getAudioCacheFileName(audioUrl)}`;
  }

  private static isRemoteAudioUrl(audioUrl: string): boolean {
    return /^https?:\/\//i.test(audioUrl);
  }

  private static normalizeAudioLanguageCode(
    languageCode?: string | null,
  ): string {
    const baseLanguage = languageCode?.trim().toLowerCase().split('-')[0];

    return AudioUtil.SUPPORTED_AUDIO_LANGUAGE_CODES.includes(
      baseLanguage as (typeof AudioUtil.SUPPORTED_AUDIO_LANGUAGE_CODES)[number],
    )
      ? baseLanguage!
      : 'en';
  }

  private static resolveTtsLanguage(languageCode?: string | null): string {
    const normalizedLanguage =
      (
        languageCode ||
        localStorage.getItem(LANGUAGE) ||
        navigator.language ||
        'en'
      )
        .trim()
        .toLowerCase() || 'en';

    if (normalizedLanguage.includes('-')) {
      return normalizedLanguage;
    }

    const ttsLocaleMap: Record<string, string> = {
      en: 'en-IN',
      hi: 'hi-IN',
      kn: 'kn-IN',
      mr: 'mr-IN',
      pt: 'pt-PT',
    };

    return ttsLocaleMap[normalizedLanguage] || `${normalizedLanguage}-IN`;
  }

  private static async withAudioPlaybackLock<T>(
    callback: () => Promise<T>,
  ): Promise<T> {
    const previousLock = AudioUtil.audioPlaybackLock;
    let releaseLock!: () => void;

    AudioUtil.audioPlaybackLock = new Promise<void>((resolve) => {
      releaseLock = resolve;
    });

    await previousLock;

    try {
      return await callback();
    } finally {
      releaseLock();
    }
  }

  private static isActiveAudioPlaybackRequest(requestId: number): boolean {
    return requestId === AudioUtil.audioPlaybackRequestId;
  }

  private static async blobToBase64(data: string | Blob): Promise<string> {
    if (typeof data === 'string') {
      return data;
    }

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result?.toString() ?? '';
        resolve(result.split(',')[1] || '');
      };
      reader.onerror = reject;
      reader.readAsDataURL(data);
    });
  }

  private static wait(ms: number): Promise<void> {
    return new Promise((resolve) => {
      window.setTimeout(resolve, ms);
    });
  }

  private static releaseTrackedAudioPlayer(audio: HTMLAudioElement): void {
    if (AudioUtil.activeCommonAudioPlayer === audio) {
      AudioUtil.activeCommonAudioPlayer = null;
    }
  }

  private static isInterruptedAudioPlaybackError(error: unknown): boolean {
    const message =
      error instanceof Error
        ? error.message
        : typeof error === 'string'
          ? error
          : '';

    const normalizedMessage = message.toLowerCase();
    return (
      normalizedMessage.includes('interrupted by a call to pause') ||
      normalizedMessage.includes('the play() request was interrupted')
    );
  }

  private static stopAndResetAudio(audio: HTMLAudioElement): void {
    audio.pause();
    audio.currentTime = 0;
    AudioUtil.releaseTrackedAudioPlayer(audio);
  }

  private static async stopActiveAudioPlayback(): Promise<void> {
    const onStop = AudioUtil.activePlaybackOnStop;
    AudioUtil.activePlaybackOnStop = null;

    // Popup audio and popup TTS share a single playback lane.
    try {
      await TextToSpeech.stop();
    } catch (error) {
      logger.error('[CommonAudio] Failed to stop TTS playback', error);
    }

    try {
      if (AudioUtil.activeCommonAudioPlayer) {
        AudioUtil.stopAndResetAudio(AudioUtil.activeCommonAudioPlayer);
      }
    } catch (error) {
      logger.error('[CommonAudio] Failed to stop HTML audio playback', error);
    }

    try {
      onStop?.();
    } catch (error) {
      logger.error(
        '[CommonAudio] Failed to run playback onStop callback',
        error,
      );
    }
  }

  private static async playTts({
    text,
    languageCode,
    rate,
    pitch,
    volume,
    onCompleteDelayMs = 0,
    requestId,
    onComplete,
  }: {
    text?: string | null;
    languageCode?: string | null;
    rate: number;
    pitch: number;
    volume: number;
    onCompleteDelayMs?: number;
    requestId: number;
    onComplete?: () => void;
  }): Promise<boolean> {
    const normalizedText = text?.trim();

    if (!normalizedText || !AudioUtil.isActiveAudioPlaybackRequest(requestId)) {
      logger.warn('[CommonAudio] No audio/text provided for playback');
      if (AudioUtil.isActiveAudioPlaybackRequest(requestId)) {
        onComplete?.();
      }
      return false;
    }

    try {
      await AudioUtil.wait(AudioUtil.TTS_RESTART_DELAY_MS);

      if (!AudioUtil.isActiveAudioPlaybackRequest(requestId)) {
        return false;
      }

      // Text is only spoken when no playable audio URL is available.
      await TextToSpeech.speak({
        text: normalizedText,
        lang: AudioUtil.resolveTtsLanguage(languageCode),
        rate,
        pitch,
        volume,
        queueStrategy: QueueStrategy.Flush,
        category: 'ambient',
      });

      await AudioUtil.triggerOnComplete({
        requestId,
        onComplete,
        delayMs: onCompleteDelayMs,
      });

      return AudioUtil.isActiveAudioPlaybackRequest(requestId);
    } catch (error) {
      logger.error('[CommonAudio] TTS playback failed', error);
      return false;
    }
  }

  private static async triggerOnComplete({
    requestId,
    onComplete,
    delayMs = 0,
  }: {
    requestId: number;
    onComplete?: () => void;
    delayMs?: number;
  }): Promise<void> {
    if (!onComplete || !AudioUtil.isActiveAudioPlaybackRequest(requestId)) {
      return;
    }

    if (delayMs > 0) {
      await AudioUtil.wait(delayMs);
    }

    if (AudioUtil.isActiveAudioPlaybackRequest(requestId)) {
      onComplete();
    }
  }

  // Stops whichever popup audio source is currently active before replay or close.
  public static async stopAudioUrlOrTtsPlayback(): Promise<void> {
    AudioUtil.audioPlaybackRequestId += 1;
    await AudioUtil.withAudioPlaybackLock(async () => {
      await AudioUtil.stopActiveAudioPlayback();
    });
  }

  // Resolves a remote audio URL to a reusable local device file on native platforms.
  public static async getCachedAudioUrl(
    audioUrl?: string | null,
  ): Promise<string | null> {
    const normalizedAudioUrl = audioUrl?.trim();
    if (!normalizedAudioUrl) {
      return null;
    }

    if (
      !Capacitor.isNativePlatform() ||
      !AudioUtil.isRemoteAudioUrl(normalizedAudioUrl)
    ) {
      return normalizedAudioUrl;
    }

    const cachedSrc = AudioUtil.cachedAudioUrlMap.get(normalizedAudioUrl);
    if (cachedSrc) {
      return cachedSrc;
    }

    const inFlightRequest =
      AudioUtil.cachedAudioPromiseMap.get(normalizedAudioUrl);
    if (inFlightRequest) {
      return inFlightRequest;
    }

    const downloadPromise = (async () => {
      const path = AudioUtil.getCommonAudioCachePath(normalizedAudioUrl);

      try {
        // Reuse the local copy if this URL was already downloaded earlier.
        await Filesystem.stat({
          path,
          directory: Directory.Data,
        });
      } catch {
        try {
          await Filesystem.mkdir({
            path: AudioUtil.COMMON_AUDIO_CACHE_DIR,
            directory: Directory.Data,
            recursive: true,
          });
        } catch (error) {
          logger.error('[CommonAudio] Cache directory creation skipped', error);
        }

        try {
          // First use downloads the remote asset into app-local storage.
          const response = await CapacitorHttp.get({
            url: normalizedAudioUrl,
            responseType: 'blob',
            readTimeout: 15000,
            connectTimeout: 15000,
          });

          if (!response?.data || response.status !== 200) {
            logger.warn(
              '[CommonAudio] Audio download failed with empty response',
              normalizedAudioUrl,
            );
            return null;
          }

          const base64Audio =
            typeof response.data === 'string'
              ? response.data
              : await AudioUtil.blobToBase64(response.data as Blob);

          await Filesystem.writeFile({
            path,
            data: base64Audio,
            directory: Directory.Data,
            recursive: true,
          });
        } catch (error) {
          logger.error('[CommonAudio] Failed to download audio', error);
          return null;
        }
      }

      try {
        // Native file URIs must be converted before browser audio can play them.
        const localAudioUri = await Filesystem.getUri({
          path,
          directory: Directory.Data,
        });
        const resolvedSrc = Capacitor.convertFileSrc(localAudioUri.uri);
        AudioUtil.cachedAudioUrlMap.set(normalizedAudioUrl, resolvedSrc);
        return resolvedSrc;
      } catch (error) {
        logger.error('[CommonAudio] Failed to resolve local audio uri', error);
        return null;
      }
    })();

    AudioUtil.cachedAudioPromiseMap.set(normalizedAudioUrl, downloadPromise);

    try {
      return await downloadPromise;
    } finally {
      AudioUtil.cachedAudioPromiseMap.delete(normalizedAudioUrl);
    }
  }

  // Plays downloaded URL audio when available, otherwise falls back to TTS text.
  public static async playAudioOrTts({
    audioUrl,
    text,
    languageCode,
    delayMs = 0,
    onCompleteDelayMs = 0,
    rate = 0.9,
    pitch = 1,
    volume = 1,
    loop = false,
    onStop,
    onComplete,
  }: {
    audioUrl?: string | null;
    text?: string | null;
    languageCode?: string | null;
    delayMs?: number;
    onCompleteDelayMs?: number;
    rate?: number;
    pitch?: number;
    volume?: number;
    loop?: boolean;
    onStop?: () => void;
    onComplete?: () => void;
  }): Promise<boolean> {
    const requestId = ++AudioUtil.audioPlaybackRequestId;

    let playbackTask: Promise<boolean> = Promise.resolve(false);

    await AudioUtil.withAudioPlaybackLock(async () => {
      if (!AudioUtil.isActiveAudioPlaybackRequest(requestId)) {
        playbackTask = Promise.resolve(false);
        return;
      }

      if (delayMs > 0) {
        await AudioUtil.wait(delayMs);
      }

      if (!AudioUtil.isActiveAudioPlaybackRequest(requestId)) {
        playbackTask = Promise.resolve(false);
        return;
      }

      // Replay always restarts from the beginning instead of overlapping audio.
      await AudioUtil.stopActiveAudioPlayback();

      if (!AudioUtil.isActiveAudioPlaybackRequest(requestId)) {
        playbackTask = Promise.resolve(false);
        return;
      }

      const resolvedAudioUrl = await AudioUtil.getCachedAudioUrl(audioUrl);

      if (!AudioUtil.isActiveAudioPlaybackRequest(requestId)) {
        playbackTask = Promise.resolve(false);
        return;
      }

      if (resolvedAudioUrl) {
        const audio = new Audio(resolvedAudioUrl);
        audio.preload = 'auto';
        audio.loop = loop;
        let didFallbackToTts = false;

        const handleAudioEnded = () => {
          AudioUtil.releaseTrackedAudioPlayer(audio);
          AudioUtil.activePlaybackOnStop = null;

          void AudioUtil.triggerOnComplete({
            requestId,
            onComplete,
            delayMs: onCompleteDelayMs,
          });
        };

        const fallbackToTts = async (
          error?: unknown,
          logAsError: boolean = false,
        ): Promise<boolean> => {
          AudioUtil.releaseTrackedAudioPlayer(audio);

          if (didFallbackToTts) {
            return false;
          }

          didFallbackToTts = true;

          if (AudioUtil.isInterruptedAudioPlaybackError(error)) {
            logger.warn(
              '[CommonAudio] Audio playback was interrupted by a newer request',
              error,
            );
            return false;
          }

          const logMessage =
            '[CommonAudio] Audio playback failed; falling back to TTS';

          if (logAsError) {
            logger.error(logMessage, error);
          } else {
            logger.warn(logMessage, error);
          }

          return AudioUtil.playTts({
            text,
            languageCode,
            rate,
            pitch,
            volume,
            onCompleteDelayMs,
            requestId,
            onComplete,
          });
        };

        const handleAudioError = () => {
          AudioUtil.activePlaybackOnStop = null;
          void fallbackToTts(
            new Error(`Failed to load audio asset: ${resolvedAudioUrl}`),
          );
        };

        audio.onended = handleAudioEnded;
        audio.onerror = handleAudioError;

        if (!AudioUtil.isActiveAudioPlaybackRequest(requestId)) {
          playbackTask = Promise.resolve(false);
          return;
        }

        AudioUtil.activeCommonAudioPlayer = audio;
        AudioUtil.activePlaybackOnStop = onStop ?? null;
        playbackTask = audio
          .play()
          .then(() => {
            if (!AudioUtil.isActiveAudioPlaybackRequest(requestId)) {
              AudioUtil.stopAndResetAudio(audio);
              return false;
            }

            return true;
          })
          .catch((error) => {
            return fallbackToTts(error, true);
          });
        return;
      }

      AudioUtil.activePlaybackOnStop = onStop ?? null;
      playbackTask = AudioUtil.playTts({
        text,
        languageCode,
        rate,
        pitch,
        volume,
        onCompleteDelayMs,
        requestId,
        onComplete,
      });
    });

    return playbackTask;
  }

  // returns language code from localStorage if fails fetches from user info
  public static async getAudioLanguageCode(): Promise<string> {
    try {
      const selectedLanguage = localStorage.getItem(LANGUAGE);

      if (selectedLanguage) {
        return AudioUtil.normalizeAudioLanguageCode(selectedLanguage);
      }

      const user = store.getState()?.auth?.user as TableTypes<'user'>;
      const languageId = user?.language_id;
      const apiHandler = ServiceConfig.getI()?.apiHandler;

      if (languageId && apiHandler) {
        const language = await apiHandler.getLanguageWithId(languageId);
        if (language?.code) {
          return AudioUtil.normalizeAudioLanguageCode(language.code);
        }
      }

      return AudioUtil.normalizeAudioLanguageCode(navigator.language);
    } catch (e) {
      logger.error('Error in fetching language code', e);
      return 'en';
    }
  }

  public static async getLocalizedAudioUrl(
    folder: string,
    clipName: string,
    extension: string = 'mp3',
  ): Promise<string> {
    const languageCode = await AudioUtil.getAudioLanguageCode();
    return `/assets/audios/${folder}/${languageCode}_${clipName}.${extension}`;
  }
}
