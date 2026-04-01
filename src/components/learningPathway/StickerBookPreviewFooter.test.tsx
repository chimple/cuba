import { fireEvent, render, screen } from '@testing-library/react';
import StickerBookPreviewFooter from './StickerBookPreviewFooter';

jest.mock('../../assets/images/camera.svg', () => 'camera.svg');

describe('StickerBookPreviewFooter', () => {
  test('renders completion actions and handles clicks', () => {
    const onSave = jest.fn();
    const onPaint = jest.fn();

    render(
      <StickerBookPreviewFooter
        isCompletionMode={true}
        isDragVariant={false}
        isSaving={false}
        onSave={onSave}
        onPaint={onPaint}
      />,
    );

    const saveButton = screen.getByTestId('StickerBookPreviewModal-save');
    const paintButton = screen.getByTestId('StickerBookPreviewModal-paint');

    fireEvent.click(saveButton);
    fireEvent.click(paintButton);

    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onPaint).toHaveBeenCalledTimes(1);
  });

  test('disables save action while saving', () => {
    const onSave = jest.fn();

    render(
      <StickerBookPreviewFooter
        isCompletionMode={true}
        isDragVariant={false}
        isSaving={true}
        onSave={onSave}
        onPaint={jest.fn()}
      />,
    );

    const saveButton = screen.getByTestId('StickerBookPreviewModal-save');
    expect(saveButton).toBeDisabled();
    fireEvent.click(saveButton);
    expect(onSave).not.toHaveBeenCalled();
  });

  test('renders preview helper text and next sticker info', () => {
    render(
      <StickerBookPreviewFooter
        isCompletionMode={false}
        isDragVariant={false}
        isSaving={false}
        nextStickerImage="https://example.com/rocket.png"
        nextStickerName="Rocket"
        onSave={jest.fn()}
        onPaint={jest.fn()}
      />,
    );

    expect(
      screen.getByTestId('StickerBookPreviewModal-helper-text'),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId('StickerBookPreviewModal-next-image'),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId('StickerBookPreviewModal-next-name'),
    ).toHaveTextContent('Rocket');
  });

  test('hides next sticker preview in drag variant', () => {
    render(
      <StickerBookPreviewFooter
        isCompletionMode={false}
        isDragVariant={true}
        isSaving={false}
        nextStickerImage="https://example.com/rocket.png"
        nextStickerName="Rocket"
        onSave={jest.fn()}
        onPaint={jest.fn()}
      />,
    );

    expect(
      screen.getByTestId('StickerBookPreviewModal-helper-text'),
    ).toBeInTheDocument();
    expect(
      screen.queryByTestId('StickerBookPreviewModal-next-image'),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByTestId('StickerBookPreviewModal-next-name'),
    ).not.toBeInTheDocument();
  });
});
