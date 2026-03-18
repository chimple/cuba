import { render, screen } from '@testing-library/react';
import StickerBookConfetti from './StickerBookConfetti';

describe('StickerBookConfetti', () => {
  test('renders all confetti pieces and clouds', () => {
    const { container } = render(
      <StickerBookConfetti isDropConfetti={false} />,
    );

    const clouds = container.querySelectorAll(
      '.StickerBookPreviewModal-confetti-cloud',
    );
    const pieces = container.querySelectorAll(
      '.StickerBookPreviewModal-confetti-piece',
    );

    expect(
      screen.getByTestId('StickerBookPreviewModal-confetti'),
    ).toBeInTheDocument();
    expect(clouds.length).toBe(5);
    expect(pieces.length).toBe(26);
  });

  test('adds drop modifier class when isDropConfetti is true', () => {
    const { container } = render(<StickerBookConfetti isDropConfetti={true} />);

    const confetti = container.querySelector(
      '.StickerBookPreviewModal-confetti',
    );
    expect(confetti).toHaveClass('StickerBookPreviewModal-confetti--drop');
  });

  test('does not add drop modifier class when isDropConfetti is false', () => {
    const { container } = render(
      <StickerBookConfetti isDropConfetti={false} />,
    );

    const confetti = container.querySelector(
      '.StickerBookPreviewModal-confetti',
    );
    expect(confetti).not.toHaveClass('StickerBookPreviewModal-confetti--drop');
  });
});
