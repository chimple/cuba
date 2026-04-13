import { fireEvent, render, screen } from '@testing-library/react';
import PathwayModal from './PathwayModal';
import { AudioUtil } from '../../utility/AudioUtil';

jest.mock('../../utility/AudioUtil', () => ({
  AudioUtil: {
    playAudioOrTts: jest.fn(),
    stopAudioUrlOrTtsPlayback: jest.fn(),
    getLocalizedAudioUrl: jest
      .fn()
      .mockResolvedValue('/assets/audios/lessonLocked/en_lesson_locked.mp3'),
  },
}));

describe('PathwayModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('autoplays audio on open', () => {
    render(
      <PathwayModal
        text="Inactive lesson popup text"
        onClose={jest.fn()}
        onConfirm={jest.fn()}
      />,
    );

    expect(AudioUtil.playAudioOrTts).toHaveBeenCalledWith(
      expect.objectContaining({
        delayMs: 300,
        text: 'Inactive lesson popup text',
      }),
    );
  });

  test('replays localized audio from the speaker button when audio keys are provided', () => {
    render(
      <PathwayModal
        text="Replay pathway text"
        onClose={jest.fn()}
        onConfirm={jest.fn()}
        audioFolder="lessonLocked"
        audioClipName="lesson_locked"
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Play audio' }));

    expect(AudioUtil.getLocalizedAudioUrl).toHaveBeenCalledWith(
      'lessonLocked',
      'lesson_locked',
    );
  });

  test('stops audio before closing', () => {
    const onClose = jest.fn();

    render(
      <PathwayModal
        text="Close pathway text"
        onClose={onClose}
        onConfirm={jest.fn()}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /close-icon/i }));

    expect(AudioUtil.stopAudioUrlOrTtsPlayback).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
