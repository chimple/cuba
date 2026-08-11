import { fireEvent, render, screen } from '@testing-library/react';
import StickerBookCompletionFooter from './StickerBookCompletionFooter';

jest.mock('../../assets/images/camera.svg', () => 'camera.svg');
jest.mock('i18next', () => ({
  t: (value: string) => value,
}));

describe('StickerBookCompletionFooter', () => {
  test('renders the footer root and both action buttons', () => {
    const { container } = render(
      <StickerBookCompletionFooter
        isSaving={false}
        onSave={jest.fn()}
        onPaint={jest.fn()}
      />,
    );

    expect(
      container.querySelector('.StickerBookCompletionFooter-root'),
    ).toBeInTheDocument();
    expect(
      container.querySelector('#sticker-book-actions-root'),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', {
        name: /save/i,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', {
        name: /paint/i,
      }),
    ).toBeInTheDocument();
  });

  test('clicking save and paint triggers the provided callbacks', () => {
    const onSave = jest.fn();
    const onPaint = jest.fn();

    render(
      <StickerBookCompletionFooter
        isSaving={false}
        onSave={onSave}
        onPaint={onPaint}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /save/i }));
    fireEvent.click(screen.getByRole('button', { name: /paint/i }));

    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onPaint).toHaveBeenCalledTimes(1);
  });

  test('disables save while saving and keeps paint enabled', () => {
    const onSave = jest.fn();
    const onPaint = jest.fn();

    render(
      <StickerBookCompletionFooter
        isSaving={true}
        onSave={onSave}
        onPaint={onPaint}
      />,
    );

    const saveButton = screen.getByRole('button', { name: /save/i });
    const paintButton = screen.getByRole('button', { name: /paint/i });

    expect(saveButton).toBeDisabled();
    expect(paintButton).toBeEnabled();

    fireEvent.click(saveButton);
    fireEvent.click(paintButton);

    expect(onSave).not.toHaveBeenCalled();
    expect(onPaint).toHaveBeenCalledTimes(1);
  });

  test('updates the save button disabled state on rerender', () => {
    const { rerender } = render(
      <StickerBookCompletionFooter
        isSaving={false}
        onSave={jest.fn()}
        onPaint={jest.fn()}
      />,
    );

    expect(screen.getByRole('button', { name: /save/i })).toBeEnabled();

    rerender(
      <StickerBookCompletionFooter
        isSaving={true}
        onSave={jest.fn()}
        onPaint={jest.fn()}
      />,
    );

    expect(screen.getByRole('button', { name: /save/i })).toBeDisabled();
  });

  test('uses the latest handlers after rerender', () => {
    const firstOnSave = jest.fn();
    const firstOnPaint = jest.fn();
    const nextOnSave = jest.fn();
    const nextOnPaint = jest.fn();

    const { rerender } = render(
      <StickerBookCompletionFooter
        isSaving={false}
        onSave={firstOnSave}
        onPaint={firstOnPaint}
      />,
    );

    rerender(
      <StickerBookCompletionFooter
        isSaving={false}
        onSave={nextOnSave}
        onPaint={nextOnPaint}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /save/i }));
    fireEvent.click(screen.getByRole('button', { name: /paint/i }));

    expect(firstOnSave).not.toHaveBeenCalled();
    expect(firstOnPaint).not.toHaveBeenCalled();
    expect(nextOnSave).toHaveBeenCalledTimes(1);
    expect(nextOnPaint).toHaveBeenCalledTimes(1);
  });
});
