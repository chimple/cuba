import { fireEvent, render, screen } from '@testing-library/react';
import DailyRewardModal from './DailyRewardModal';
import { AudioUtil } from '../../utility/AudioUtil';

jest.mock('../../utility/AudioUtil', () => ({
  AudioUtil: {
    playAudioOrTts: jest.fn(),
    stopAudioUrlOrTtsPlayback: jest.fn(),
    getLocalizedAudioUrl: jest
      .fn()
      .mockResolvedValue('/assets/audios/dailyReward/en_message.mp3'),
  },
}));

jest.mock('./RewardRive', () => () => <div data-testid="reward-rive" />);

describe('DailyRewardModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('plays the localized reward audio when the speaker button is clicked', async () => {
    render(
      <DailyRewardModal
        text="Test modal text"
        onClose={jest.fn()}
        onPlay={jest.fn()}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Play audio' }));

    expect(AudioUtil.getLocalizedAudioUrl).toHaveBeenCalledWith(
      'dailyReward',
      'message',
    );
  });

  test('stops audio before closing the modal', () => {
    const onClose = jest.fn();

    render(
      <DailyRewardModal
        text="Close text"
        onClose={onClose}
        onPlay={jest.fn()}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /close-icon/i }));

    expect(AudioUtil.stopAudioUrlOrTtsPlayback).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
