import { fireEvent, render, waitFor } from '@testing-library/react';
import ScoreCard from './ScoreCard';
import { AudioUtil } from '../../utility/AudioUtil';

jest.mock('../../utility/AudioUtil', () => ({
  AudioUtil: {
    playAudioOrTts: jest.fn(),
    stopAudioUrlOrTtsPlayback: jest.fn(),
  },
}));

jest.mock('./ScoreCardStarIcons', () => () => (
  <div data-testid="score-stars" />
));
jest.mock('./ScoreCardTitle', () => () => <div data-testid="score-title" />);

describe('ScoreCard', () => {
  const baseProps = {
    showDialogBox: true,
    score: 80,
    message: 'You Completed the Lesson:',
    lessonName: 'Lesson One',
    noText: 'Continue Playing',
    handleClose: jest.fn(),
    onContinueButtonClicked: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (AudioUtil.stopAudioUrlOrTtsPlayback as jest.Mock).mockResolvedValue(
      undefined,
    );
  });

  test('autoplays audio when the dialog is open', () => {
    render(<ScoreCard {...baseProps} />);

    expect(AudioUtil.playAudioOrTts).toHaveBeenCalledWith(
      expect.objectContaining({
        audioUrl: '/assets/audios/scorecard/victory.mp3',
        delayMs: 300,
        loop: false,
      }),
    );
  });

  test('stops audio when dialog is rendered closed', () => {
    render(<ScoreCard {...baseProps} showDialogBox={false} />);

    expect(AudioUtil.stopAudioUrlOrTtsPlayback).toHaveBeenCalled();
    expect(AudioUtil.playAudioOrTts).not.toHaveBeenCalled();
  });

  test('stops audio before calling continue handler from CTA', async () => {
    const onContinueButtonClicked = jest.fn();
    const { getByRole } = render(
      <ScoreCard
        {...baseProps}
        onContinueButtonClicked={onContinueButtonClicked}
      />,
    );

    fireEvent.click(getByRole('button', { name: 'Continue Playing' }));

    await waitFor(() => {
      expect(AudioUtil.stopAudioUrlOrTtsPlayback).toHaveBeenCalled();
      expect(onContinueButtonClicked).toHaveBeenCalledTimes(1);
    });

    expect(
      (AudioUtil.stopAudioUrlOrTtsPlayback as jest.Mock).mock
        .invocationCallOrder[0],
    ).toBeLessThan(onContinueButtonClicked.mock.invocationCallOrder[0]);
  });
});
