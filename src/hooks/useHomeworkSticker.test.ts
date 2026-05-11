import { act, renderHook } from '@testing-library/react';
import { useHomeworkSticker } from './useHomeworkSticker';
import { ServiceConfig } from '../services/ServiceConfig';
import { Util } from '../utility/util';
import { AudioUtil } from '../utility/AudioUtil';
import { setPendingFinalHomeworkStickerFlow } from '../utility/homeworkStickerFlow';

jest.mock('../services/ServiceConfig');
jest.mock('../utility/util');
jest.mock('../utility/AudioUtil', () => ({
  AudioUtil: {
    getAudioLanguageCode: jest.fn(),
    playAudioOrTts: jest.fn(),
  },
}));
jest.mock('@growthbook/growthbook-react', () => ({
  useFeatureIsOn: jest.fn(() => false),
  useFeatureValue: jest.fn((_key: string, fallback: string) => fallback),
}));
jest.mock('../growthbook/Growthbook', () => ({
  setCachedGrowthBookFeatureValue: jest.fn(),
}));
jest.mock('../redux/hooks', () => ({
  useAppSelector: jest.fn(() => ({})),
}));
jest.mock('../utility/logger', () => ({
  __esModule: true,
  default: {
    error: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
  },
}));

describe('useHomeworkSticker', () => {
  const mockApi = {
    getCurrentStickerBookWithProgress: jest.fn(),
  };
  const originalRequestAnimationFrame = window.requestAnimationFrame;
  const originalCancelAnimationFrame = window.cancelAnimationFrame;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    localStorage.clear();
    sessionStorage.clear();

    jest.spyOn(ServiceConfig, 'getI').mockReturnValue({
      apiHandler: mockApi,
    } as unknown as ReturnType<typeof ServiceConfig.getI>);

    (Util.getCurrentStudent as jest.Mock).mockReturnValue({ id: 'student-1' });
    (Util.logEvent as jest.Mock).mockImplementation(() => {});
    (AudioUtil.getAudioLanguageCode as jest.Mock).mockResolvedValue('en');

    window.requestAnimationFrame = jest.fn((callback: FrameRequestCallback) => {
      callback(0);
      return 1;
    }) as typeof window.requestAnimationFrame;
    window.cancelAnimationFrame =
      jest.fn() as typeof window.cancelAnimationFrame;
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  afterAll(() => {
    window.requestAnimationFrame = originalRequestAnimationFrame;
    window.cancelAnimationFrame = originalCancelAnimationFrame;
  });

  test('waits for sticker audio stop before completing final homework flow', async () => {
    const container = document.createElement('div');
    const reloadHomeworkPathway = jest.fn();
    const onFinalHomeworkStickerComplete = jest.fn();
    let capturedPlaybackStop: (() => void) | undefined;

    const playMascotAudioFromLocalPath = jest.fn(
      async (
        _localAudioPath: string,
        _stateConfig?: {
          stateMachine?: string;
          inputName?: string;
          stateValue?: number;
          animationName?: string;
        },
        playbackOptions?: {
          onPlaybackStop?: () => void;
        },
      ) => {
        capturedPlaybackStop = playbackOptions?.onPlaybackStop;
        return true;
      },
    );

    const { result, rerender } = renderHook(
      ({ riveContainer }: { riveContainer: HTMLDivElement | null }) =>
        useHomeworkSticker({
          containerRef: { current: container },
          riveContainer,
          currentMascotStateValue: 1,
          reloadHomeworkPathway,
          onFinalHomeworkStickerComplete,
          playMascotAudioFromLocalPath,
          playRewardAudio: jest.fn().mockResolvedValue(undefined),
        }),
      {
        initialProps: { riveContainer: document.createElement('div') },
      },
    );

    act(() => {
      result.current.openStickerCompletion({
        source: 'homework_pathway',
        stickerBookId: 'book-1',
        stickerBookTitle: 'Sticker Book',
        stickerBookSvgUrl: '',
        collectedStickerIds: ['sticker-1'],
        totalStickerCount: 1,
      });
      setPendingFinalHomeworkStickerFlow('student-1');
      result.current.closeStickerCompletion('close_button');
    });

    await act(async () => {
      jest.runOnlyPendingTimers();
    });

    expect(reloadHomeworkPathway).toHaveBeenCalledTimes(1);

    await act(async () => {
      rerender({ riveContainer: document.createElement('div') });
      await Promise.resolve();
    });

    expect(playMascotAudioFromLocalPath).toHaveBeenCalledTimes(1);

    await act(async () => {
      jest.advanceTimersByTime(4000);
    });

    expect(onFinalHomeworkStickerComplete).not.toHaveBeenCalled();

    act(() => {
      capturedPlaybackStop?.();
    });

    expect(onFinalHomeworkStickerComplete).toHaveBeenCalledTimes(1);
  });
});
