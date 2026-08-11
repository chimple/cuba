import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import HomeworkCompleteModal from './HomeworkCompleteModal';
import { AudioUtil } from '../../utility/AudioUtil';

jest.mock('../../utility/AudioUtil', () => ({
  AudioUtil: {
    playAudioOrTts: jest.fn(),
    stopAudioUrlOrTtsPlayback: jest.fn(),
    getLocalizedAudioUrl: jest
      .fn()
      .mockResolvedValue('/assets/audios/allHwComplete/en_all_hw_done.mp3'),
  },
}));

jest.mock('../learningPathway/ChimpleRiveMascot', () => () => (
  <div data-testid="chimple-rive-mascot" />
));

describe('HomeworkCompleteModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (AudioUtil.getLocalizedAudioUrl as jest.Mock).mockResolvedValue(
      '/assets/audios/allHwComplete/en_all_hw_done.mp3',
    );
  });

  test('autoplays popup audio on open', async () => {
    render(
      <HomeworkCompleteModal
        text="All Math lessons have been completed. Kindly select other subjects."
        onClose={jest.fn()}
        onPlayMore={jest.fn()}
        borderImageSrc="/assets/backgrounds/homework-popup.svg"
      />,
    );

    await waitFor(() =>
      expect(AudioUtil.getLocalizedAudioUrl).toHaveBeenCalledWith(
        'allHwComplete',
        'all_hw_done',
      ),
    );
    await waitFor(() =>
      expect(AudioUtil.playAudioOrTts).toHaveBeenCalledWith(
        expect.objectContaining({
          audioUrl: '/assets/audios/allHwComplete/en_all_hw_done.mp3',
          delayMs: 300,
          text: 'All Math lessons have been completed. Kindly select other subjects.',
        }),
      ),
    );
  });

  test('replays popup audio when the speaker button is clicked', async () => {
    render(
      <HomeworkCompleteModal
        text="Replay text"
        onClose={jest.fn()}
        onPlayMore={jest.fn()}
        borderImageSrc="/assets/backgrounds/homework-popup.svg"
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Play audio' }));

    await waitFor(() =>
      expect(AudioUtil.playAudioOrTts).toHaveBeenLastCalledWith(
        expect.objectContaining({
          audioUrl: '/assets/audios/allHwComplete/en_all_hw_done.mp3',
          text: 'Replay text',
        }),
      ),
    );
  });

  test('does not close when clicking banner backdrop', () => {
    const onClose = jest.fn();

    const { container } = render(
      <HomeworkCompleteModal
        text="Close text"
        onClose={onClose}
        onPlayMore={jest.fn()}
        borderImageSrc="/assets/backgrounds/homework-popup.svg"
      />,
    );

    fireEvent.click(
      container.querySelector('.homework-completed-banner') as HTMLElement,
    );

    expect(onClose).not.toHaveBeenCalled();
  });
});
