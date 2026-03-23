import { act, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import StickerBookToast from './StickerBookToast';

describe('StickerBookToast', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  test('does not render when it starts closed', () => {
    const { container } = render(
      <StickerBookToast isOpen={false} text="Saved" onClose={jest.fn()} />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  test('renders the text and optional image while open', () => {
    render(
      <StickerBookToast
        isOpen={true}
        text="Saved"
        image="/assets/icons/Confirmation.svg"
        imageAlt="Confirmation"
        onClose={jest.fn()}
      />,
    );

    expect(screen.getByRole('status')).toHaveTextContent('Saved');
    expect(screen.getByRole('img', { name: 'Confirmation' })).toHaveAttribute(
      'src',
      '/assets/icons/Confirmation.svg',
    );
  });

  test('calls onClose after the configured duration', () => {
    const onClose = jest.fn();
    render(
      <StickerBookToast
        isOpen={true}
        text="Saved"
        duration={1200}
        onClose={onClose}
      />,
    );

    act(() => {
      jest.advanceTimersByTime(1200);
    });

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  test('plays the closing animation before unmounting', () => {
    const { rerender } = render(
      <StickerBookToast isOpen={true} text="Saved" onClose={jest.fn()} />,
    );

    rerender(
      <StickerBookToast isOpen={false} text="Saved" onClose={jest.fn()} />,
    );

    expect(screen.getByRole('status')).toHaveClass(
      'sticker-book-toast--closing',
    );

    act(() => {
      jest.advanceTimersByTime(320);
    });

    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });
});
