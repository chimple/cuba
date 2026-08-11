import { act, fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import StickerBookSaveModal from './StickerBookSaveModal';
import { AudioUtil } from '../../utility/AudioUtil';

jest.mock('../../utility/AudioUtil', () => ({
  AudioUtil: {
    playAudioOrTts: jest.fn().mockResolvedValue(true),
    stopAudioUrlOrTtsPlayback: jest.fn().mockResolvedValue(undefined),
  },
}));

describe('StickerBookSaveModal', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    act(() => {
      jest.runOnlyPendingTimers();
    });
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  test('does not render when closed', () => {
    const { container } = render(
      <StickerBookSaveModal open={false} onClose={jest.fn()} />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  test('renders the saved svg markup and branding when open', () => {
    render(
      <StickerBookSaveModal
        open={true}
        svgMarkup={'<svg><circle cx="5" cy="5" r="5" /></svg>'}
        onClose={jest.fn()}
      />,
    );

    expect(
      screen.getByRole('img', { name: 'Sticker Book Saved' }),
    ).toBeInTheDocument();
    expect(
      document.getElementById('sticker-book-save-modal-svg-overlay')?.innerHTML,
    ).toContain('<circle');
    expect(
      screen.getByRole('img', { name: 'Chimple Learning' }),
    ).toBeInTheDocument();
  });

  test('ignores backdrop clicks until the animation finishes', () => {
    const onClose = jest.fn();
    render(<StickerBookSaveModal open={true} onClose={onClose} />);

    fireEvent.click(screen.getByRole('img', { name: 'Sticker Book Saved' }));
    fireEvent.click(
      document.getElementById('sticker-book-save-modal-overlay') as HTMLElement,
    );

    expect(onClose).not.toHaveBeenCalled();
  });

  test('triggers the flash animation, then auto closes', () => {
    const onClose = jest.fn();
    const onAnimationComplete = jest.fn();

    render(
      <StickerBookSaveModal
        open={true}
        onClose={onClose}
        onAnimationComplete={onAnimationComplete}
      />,
    );

    act(() => {
      jest.advanceTimersByTime(700);
    });

    expect(AudioUtil.playAudioOrTts).toHaveBeenCalledWith({
      audioUrl: '/assets/audios/stickerBookSave/camera_flash.mp3',
      delayMs: 300,
    });

    expect(
      document
        .getElementById('sticker-book-save-star-left')
        ?.className.includes('visible'),
    ).toBe(true);
    expect(
      document
        .getElementById('sticker-book-save-blink-overlay')
        ?.className.includes('active'),
    ).toBe(true);

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(onAnimationComplete).toHaveBeenCalledTimes(1);

    fireEvent.click(
      document.getElementById('sticker-book-save-modal-overlay') as HTMLElement,
    );

    expect(
      document
        .getElementById('sticker-book-save-modal-overlay')
        ?.className.includes('stickerBook-save-modal-overlay-closing'),
    ).toBe(true);
    expect(
      document
        .getElementById('sticker-book-save-modal-content')
        ?.className.includes('stickerBook-save-modal-content-closing'),
    ).toBe(true);
    expect(onClose).not.toHaveBeenCalled();

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  test('clears pending timers when the modal closes before the animation completes', () => {
    const onAnimationComplete = jest.fn();
    const { rerender } = render(
      <StickerBookSaveModal
        open={true}
        onClose={jest.fn()}
        onAnimationComplete={onAnimationComplete}
      />,
    );

    rerender(
      <StickerBookSaveModal
        open={false}
        onClose={jest.fn()}
        onAnimationComplete={onAnimationComplete}
      />,
    );

    act(() => {
      jest.advanceTimersByTime(1700);
    });

    expect(onAnimationComplete).not.toHaveBeenCalled();
  });

  test('stops active audio when the modal unmounts', () => {
    const { unmount } = render(
      <StickerBookSaveModal open={true} onClose={jest.fn()} />,
    );

    unmount();

    expect(AudioUtil.stopAudioUrlOrTtsPlayback).toHaveBeenCalledTimes(1);
  });
});
