import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import ActivationLessonBanner from './ActivationLessonBanner';
import { SOURCE } from '../../common/constants';
import { AudioUtil } from '../../utility/AudioUtil';
import { ServiceConfig } from '../../services/ServiceConfig';

const mockHistoryPush = jest.fn();

jest.mock('react-router', () => ({
  useHistory: () => ({
    push: mockHistoryPush,
    location: { pathname: '/home', search: '' },
  }),
}));

jest.mock('i18next', () => ({
  t: (value: string) => value,
}));

jest.mock('../../utility/AudioUtil', () => ({
  AudioUtil: {
    getAudioLanguageCode: jest.fn().mockResolvedValue('en'),
    playAudioOrTts: jest.fn().mockResolvedValue(undefined),
    stopAudioUrlOrTtsPlayback: jest.fn().mockResolvedValue(undefined),
  },
}));

jest.mock('../../utility/util', () => ({
  Util: {
    getLessonBundleId: jest.fn(() => 'bundle-1'),
  },
}));

const mockApi = {
  getLessonsForChapter: jest.fn(),
};

describe('ActivationLessonBanner', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    jest.spyOn(ServiceConfig, 'getI').mockReturnValue({
      apiHandler: mockApi,
    } as unknown as ReturnType<typeof ServiceConfig.getI>);
    mockApi.getLessonsForChapter.mockResolvedValue([]);
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  test('waits for the banner image before showing countdown content', async () => {
    const { container } = render(
      <ActivationLessonBanner source={SOURCE.INITIAL_ASSESSMENT} />,
    );

    expect(screen.queryByText('Lesson starts in :')).not.toBeInTheDocument();
    expect(AudioUtil.playAudioOrTts).not.toHaveBeenCalled();

    const bannerImage = container.querySelector(
      '.activation-lesson-banner__image',
    );
    expect(bannerImage).not.toBeNull();
    if (!bannerImage) {
      throw new Error('Banner image not rendered');
    }
    fireEvent.load(bannerImage);

    expect(await screen.findByText('Lesson starts in :')).toBeInTheDocument();

    await waitFor(() => {
      expect(AudioUtil.playAudioOrTts).toHaveBeenCalledWith({
        audioUrl: '/assets/audios/common/generic_sound_effect.mp3',
      });
    });
  });
});
