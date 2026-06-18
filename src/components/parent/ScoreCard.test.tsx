import { fireEvent, render, waitFor } from '@testing-library/react';
import ScoreCard from './ScoreCard';
import { AudioUtil } from '../../utility/AudioUtil';
import { Util } from '../../utility/util';
import { EVENTS } from '../../common/constants';

jest.mock('../../utility/AudioUtil', () => ({
  AudioUtil: {
    playAudioOrTts: jest.fn(),
    stopAudioUrlOrTtsPlayback: jest.fn(),
  },
}));

jest.mock('../../utility/util', () => ({
  Util: {
    getCurrentStudent: jest.fn(),
    logEvent: jest.fn(),
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
    (Util.getCurrentStudent as jest.Mock).mockReturnValue({
      id: 'student-1',
      name: 'Student One',
      gender: 'female',
      grade_id: 'grade-1',
      stars: 5,
    });
    (AudioUtil.stopAudioUrlOrTtsPlayback as jest.Mock).mockResolvedValue(
      undefined,
    );
  });

  test('autoplays audio and logs goal progress when the dialog is open', async () => {
    render(<ScoreCard {...baseProps} />);

    expect(AudioUtil.playAudioOrTts).toHaveBeenCalledWith(
      expect.objectContaining({
        audioUrl: '/assets/audios/scorecard/victory.mp3',
        delayMs: 300,
        loop: false,
      }),
    );

    await waitFor(() =>
      expect(Util.logEvent).toHaveBeenCalledWith(
        EVENTS.GOAL_PROGRESS,
        expect.objectContaining({
          action: 'shown',
          score: 80,
          student_id: 'student-1',
          student_stars: 5,
          progress_rows_count: 0,
        }),
      ),
    );
  });

  test('stops audio when dialog is rendered closed', () => {
    render(<ScoreCard {...baseProps} showDialogBox={false} />);

    expect(AudioUtil.stopAudioUrlOrTtsPlayback).toHaveBeenCalled();
    expect(AudioUtil.playAudioOrTts).not.toHaveBeenCalled();
  });

  test('calls continue handler immediately from CTA while stopping audio in the background', async () => {
    const onContinueButtonClicked = jest.fn();
    let resolveStopAudio: (() => void) | undefined;
    (AudioUtil.stopAudioUrlOrTtsPlayback as jest.Mock).mockReturnValue(
      new Promise<void>((resolve) => {
        resolveStopAudio = resolve;
      }),
    );
    const { getByRole } = render(
      <ScoreCard
        {...baseProps}
        onContinueButtonClicked={onContinueButtonClicked}
      />,
    );

    fireEvent.click(getByRole('button', { name: 'Continue Playing' }));

    expect(AudioUtil.stopAudioUrlOrTtsPlayback).toHaveBeenCalledTimes(1);
    expect(onContinueButtonClicked).toHaveBeenCalledTimes(1);

    await waitFor(() =>
      expect(Util.logEvent).toHaveBeenCalledWith(
        EVENTS.CLICKS_ANALYTICS,
        expect.objectContaining({
          action: 'continue_click',
          click_identifier: 'noButton',
          click_value: 'Continue Playing',
          action_type: 'click',
        }),
      ),
    );

    resolveStopAudio?.();
  });
});
