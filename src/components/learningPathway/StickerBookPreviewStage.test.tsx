import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import StickerBookPreviewStage from './StickerBookPreviewStage';
import type { ParsedSvg } from '../common/SvgHelpers';

jest.mock('i18next', () => ({
  t: (value: string) => value,
}));

const buildSvg = (): ParsedSvg => ({
  inner: '<rect x="0" y="0" width="10" height="10" />',
  attrs: {
    viewBox: '0 0 100 100',
    xmlns: 'http://www.w3.org/2000/svg',
  },
});

describe('StickerBookPreviewStage', () => {
  test('renders loading state when isLoading is true', () => {
    render(
      <StickerBookPreviewStage
        isDragVariant={false}
        isLoading={true}
        showIntroConfetti={false}
        showDropConfetti={false}
        showPointerHint={false}
        isDragging={false}
        isDropSuccessful={false}
        dragStickerPos={null}
        dragStickerSize={0}
        sceneSvg={null}
        bookSvgRef={React.createRef()}
        setFrameElement={jest.fn()}
        onDragPointerDown={jest.fn()}
        onDragPointerMove={jest.fn()}
        onDragPointerUp={jest.fn()}
        onDragPointerCancel={jest.fn()}
      />,
    );

    expect(
      screen.getByTestId('StickerBookPreviewModal-loading'),
    ).toBeInTheDocument();
  });

  test('renders inline svg with attributes when loaded', async () => {
    const bookSvgRef = React.createRef<SVGSVGElement>();

    render(
      <StickerBookPreviewStage
        isDragVariant={false}
        isLoading={false}
        showIntroConfetti={false}
        showDropConfetti={false}
        showPointerHint={false}
        isDragging={false}
        isDropSuccessful={false}
        dragStickerPos={null}
        dragStickerSize={0}
        sceneSvg={buildSvg()}
        bookSvgRef={bookSvgRef}
        setFrameElement={jest.fn()}
        onDragPointerDown={jest.fn()}
        onDragPointerMove={jest.fn()}
        onDragPointerUp={jest.fn()}
        onDragPointerCancel={jest.fn()}
      />,
    );

    await screen.findByTestId('StickerBookPreviewModal-book');

    await waitFor(() => expect(bookSvgRef.current).not.toBeNull());

    await waitFor(() =>
      expect(bookSvgRef.current?.getAttribute('viewBox')).toBe('0 0 100 100'),
    );

    expect(bookSvgRef.current?.getAttribute('width')).toBe('100%');
    expect(bookSvgRef.current?.getAttribute('height')).toBe('100%');
    expect(bookSvgRef.current?.getAttribute('preserveAspectRatio')).toBe(
      'xMidYMid slice',
    );
  });

  test('renders draggable sticker and pointer hint for drag variant', () => {
    render(
      <StickerBookPreviewStage
        isDragVariant={true}
        isLoading={false}
        showIntroConfetti={false}
        showDropConfetti={false}
        showPointerHint={true}
        isDragging={true}
        isDropSuccessful={false}
        dragStickerPos={{ x: 10, y: 20 }}
        dragStickerSize={50}
        nextStickerImage="https://example.com/sticker.png"
        nextStickerName="Rocket"
        sceneSvg={buildSvg()}
        bookSvgRef={React.createRef()}
        setFrameElement={jest.fn()}
        onDragPointerDown={jest.fn()}
        onDragPointerMove={jest.fn()}
        onDragPointerUp={jest.fn()}
        onDragPointerCancel={jest.fn()}
      />,
    );

    const draggable = screen.getByTestId(
      'StickerBookPreviewModal-draggable-sticker',
    );
    expect(draggable).toHaveClass(
      'StickerBookPreviewModal-draggable-sticker--active',
    );
    expect(draggable).toHaveStyle({
      width: '50px',
      height: '50px',
      transform: 'translate(10px, 20px) scale(1.06)',
    });

    expect(
      screen.getByTestId('StickerBookPreviewModal-pointer-hint'),
    ).toBeInTheDocument();
  });

  test('shows confetti only for drag variant', () => {
    const { rerender } = render(
      <StickerBookPreviewStage
        isDragVariant={true}
        isLoading={false}
        showIntroConfetti={false}
        showDropConfetti={true}
        showPointerHint={false}
        isDragging={false}
        isDropSuccessful={false}
        dragStickerPos={null}
        dragStickerSize={0}
        sceneSvg={buildSvg()}
        bookSvgRef={React.createRef()}
        setFrameElement={jest.fn()}
        onDragPointerDown={jest.fn()}
        onDragPointerMove={jest.fn()}
        onDragPointerUp={jest.fn()}
        onDragPointerCancel={jest.fn()}
      />,
    );

    expect(
      screen.getByTestId('StickerBookPreviewModal-confetti'),
    ).toBeInTheDocument();

    rerender(
      <StickerBookPreviewStage
        isDragVariant={false}
        isLoading={false}
        showIntroConfetti={true}
        showDropConfetti={true}
        showPointerHint={false}
        isDragging={false}
        isDropSuccessful={false}
        dragStickerPos={null}
        dragStickerSize={0}
        sceneSvg={buildSvg()}
        bookSvgRef={React.createRef()}
        setFrameElement={jest.fn()}
        onDragPointerDown={jest.fn()}
        onDragPointerMove={jest.fn()}
        onDragPointerUp={jest.fn()}
        onDragPointerCancel={jest.fn()}
      />,
    );

    expect(
      screen.queryByTestId('StickerBookPreviewModal-confetti'),
    ).not.toBeInTheDocument();
  });

  test('does not render draggable sticker after successful drop', () => {
    render(
      <StickerBookPreviewStage
        isDragVariant={true}
        isLoading={false}
        showIntroConfetti={false}
        showDropConfetti={false}
        showPointerHint={false}
        isDragging={false}
        isDropSuccessful={true}
        dragStickerPos={{ x: 10, y: 20 }}
        dragStickerSize={50}
        sceneSvg={buildSvg()}
        bookSvgRef={React.createRef()}
        setFrameElement={jest.fn()}
        onDragPointerDown={jest.fn()}
        onDragPointerMove={jest.fn()}
        onDragPointerUp={jest.fn()}
        onDragPointerCancel={jest.fn()}
      />,
    );

    expect(
      screen.queryByTestId('StickerBookPreviewModal-draggable-sticker'),
    ).not.toBeInTheDocument();
  });
});
