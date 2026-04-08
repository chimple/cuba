import type { ComponentProps, MutableRefObject } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import StickerBookCompletionModal from './StickerBookCompletionModal';

jest.mock('i18next', () => ({
  t: (value: string) => value,
}));
jest.mock('../../assets/images/camera.svg', () => 'camera.svg');

const sampleSvg = `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 50 30">
    <g data-slot-id="slot-1">
      <rect x="5" y="5" width="20" height="12" fill="#34a853" />
    </g>
  </svg>
`;

describe('StickerBookCompletionModal', () => {
  const buildProps = (
    override: Partial<ComponentProps<typeof StickerBookCompletionModal>> = {},
  ) => ({
    svgMarkup: sampleSvg,
    isSaving: false,
    bookSvgRef: { current: null } as MutableRefObject<SVGSVGElement | null>,
    onClose: jest.fn(),
    onSave: jest.fn(),
    onPaint: jest.fn(),
    ...override,
  });

  test('renders the completion popup shell with the provided svg markup', () => {
    const { container } = render(
      <StickerBookCompletionModal {...buildProps()} />,
    );

    expect(
      container.querySelector('.StickerBookCompletionModal-overlay'),
    ).toBeInTheDocument();
    expect(
      container.querySelector('.StickerBookCompletionModal-wrapper'),
    ).toBeInTheDocument();
    expect(
      container.querySelector('.StickerBookCompletionModal-container'),
    ).toBeInTheDocument();
    expect(
      container.querySelector('.StickerBookCompletionModal-svg-area svg'),
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

  test('renders enabled save and paint actions from the footer', () => {
    const onSave = jest.fn();
    const onPaint = jest.fn();

    render(
      <StickerBookCompletionModal
        {...buildProps({
          onSave,
          onPaint,
        })}
      />,
    );

    expect(screen.getByRole('button', { name: /save/i })).toBeEnabled();
    expect(screen.getByRole('button', { name: /paint/i })).toBeEnabled();
  });

  test('clicking the close button calls onClose', () => {
    const onClose = jest.fn();

    render(<StickerBookCompletionModal {...buildProps({ onClose })} />);

    fireEvent.click(screen.getByTestId('StickerBookPreviewModal-close'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  test('uses translated close label and image alt text', () => {
    render(<StickerBookCompletionModal {...buildProps()} />);

    const closeButton = screen.getByTestId('StickerBookPreviewModal-close');
    const closeImage = screen.getByAltText('Close') as HTMLImageElement;

    expect(closeButton).toHaveAttribute('aria-label', 'Close');
    expect(closeImage.src).toContain('pathwayAssets/menuCross.svg');
  });

  test('clicking the overlay uses onBackdropClose when provided', () => {
    const onClose = jest.fn();
    const onBackdropClose = jest.fn();
    const { container } = render(
      <StickerBookCompletionModal
        {...buildProps({
          onClose,
          onBackdropClose,
        })}
      />,
    );

    fireEvent.click(
      container.querySelector('.StickerBookCompletionModal-overlay')!,
    );

    expect(onBackdropClose).toHaveBeenCalledTimes(1);
    expect(onClose).not.toHaveBeenCalled();
  });

  test('clicking the overlay falls back to onClose when no backdrop handler exists', () => {
    const onClose = jest.fn();
    const { container } = render(
      <StickerBookCompletionModal {...buildProps({ onClose })} />,
    );

    fireEvent.click(
      container.querySelector('.StickerBookCompletionModal-overlay')!,
    );

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  test('clicking inside the wrapper does not trigger backdrop close', () => {
    const onClose = jest.fn();
    const onBackdropClose = jest.fn();
    const { container } = render(
      <StickerBookCompletionModal
        {...buildProps({
          onClose,
          onBackdropClose,
        })}
      />,
    );

    fireEvent.click(
      container.querySelector('.StickerBookCompletionModal-wrapper')!,
    );
    fireEvent.click(
      container.querySelector('.StickerBookCompletionModal-content')!,
    );
    fireEvent.click(
      container.querySelector('.StickerBookCompletionModal-svg-area')!,
    );

    expect(onBackdropClose).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });

  test('save and paint actions flow through the footer', () => {
    const onSave = jest.fn();
    const onPaint = jest.fn();

    render(
      <StickerBookCompletionModal
        {...buildProps({
          onSave,
          onPaint,
        })}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /save/i }));
    fireEvent.click(screen.getByRole('button', { name: /paint/i }));

    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onPaint).toHaveBeenCalledTimes(1);
  });

  test('renders an empty svg area when svgMarkup is null', () => {
    const { container } = render(
      <StickerBookCompletionModal {...buildProps({ svgMarkup: null })} />,
    );

    const svgArea = container.querySelector(
      '.StickerBookCompletionModal-svg-area',
    ) as HTMLDivElement;

    expect(svgArea.innerHTML).toBe('');
  });

  test('updates the rendered svg when svgMarkup changes on rerender', () => {
    const firstSvg =
      '<svg xmlns="http://www.w3.org/2000/svg"><rect width="10" height="10" fill="#111111" /></svg>';
    const nextSvg =
      '<svg xmlns="http://www.w3.org/2000/svg"><circle cx="10" cy="10" r="5" fill="#ff6600" /></svg>';

    const { container, rerender } = render(
      <StickerBookCompletionModal {...buildProps({ svgMarkup: firstSvg })} />,
    );

    expect(
      container.querySelector('.StickerBookCompletionModal-svg-area rect'),
    ).toBeInTheDocument();

    rerender(
      <StickerBookCompletionModal {...buildProps({ svgMarkup: nextSvg })} />,
    );

    expect(
      container.querySelector('.StickerBookCompletionModal-svg-area rect'),
    ).not.toBeInTheDocument();
    expect(
      container.querySelector('.StickerBookCompletionModal-svg-area circle'),
    ).toBeInTheDocument();
  });

  test('keeps the rendered completion svg attached to bookSvgRef', () => {
    const bookSvgRef = {
      current: null,
    } as MutableRefObject<SVGSVGElement | null>;

    const { unmount } = render(
      <StickerBookCompletionModal {...buildProps({ bookSvgRef })} />,
    );

    expect(bookSvgRef.current?.tagName.toLowerCase()).toBe('svg');

    unmount();

    expect(bookSvgRef.current).toBeNull();
  });
});
