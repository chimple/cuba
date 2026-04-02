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

  test('renders draggable sticker and pointer hint for drag variant', async () => {
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
        getSlotRectInFrame={() => ({
          x: 80,
          y: 30,
          width: 40,
          height: 40,
        })}
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
      '--sticker-drop-distance': '20px',
    });

    await screen.findByTestId('StickerBookPreviewModal-pointer-hint');
  });

  test('does not render pointer hint until slot guide path is available', () => {
    render(
      <StickerBookPreviewStage
        isDragVariant={true}
        isLoading={false}
        showIntroConfetti={false}
        showDropConfetti={false}
        showPointerHint={true}
        isDragging={false}
        isDropSuccessful={false}
        dragStickerPos={{ x: 10, y: 20 }}
        dragStickerSize={50}
        nextStickerImage="https://example.com/sticker.png"
        nextStickerName="Rocket"
        sceneSvg={buildSvg()}
        bookSvgRef={React.createRef()}
        setFrameElement={jest.fn()}
        getSlotRectInFrame={() => null}
        onDragPointerDown={jest.fn()}
        onDragPointerMove={jest.fn()}
        onDragPointerUp={jest.fn()}
        onDragPointerCancel={jest.fn()}
      />,
    );

    expect(
      screen.queryByTestId('StickerBookPreviewModal-pointer-hint'),
    ).not.toBeInTheDocument();
  });

  test('uses the stabilized slot path instead of an early stale measurement', async () => {
    let callCount = 0;

    render(
      <StickerBookPreviewStage
        isDragVariant={true}
        isLoading={false}
        showIntroConfetti={false}
        showDropConfetti={false}
        showPointerHint={true}
        isDragging={false}
        isDropSuccessful={false}
        dragStickerPos={{ x: 10, y: 20 }}
        dragStickerSize={50}
        nextStickerImage="https://example.com/sticker.png"
        nextStickerName="Rocket"
        sceneSvg={buildSvg()}
        bookSvgRef={React.createRef()}
        setFrameElement={jest.fn()}
        getSlotRectInFrame={() => {
          callCount += 1;
          if (callCount === 1) {
            return { x: 20, y: 20, width: 30, height: 30 };
          }
          return { x: 80, y: 30, width: 40, height: 40 };
        }}
        onDragPointerDown={jest.fn()}
        onDragPointerMove={jest.fn()}
        onDragPointerUp={jest.fn()}
        onDragPointerCancel={jest.fn()}
      />,
    );

    await waitFor(() =>
      expect(
        screen.getByTestId('StickerBookPreviewModal-pointer-hint'),
      ).toHaveStyle({
        left: '66.64px',
        top: '24.240000000000002px',
        '--target-x': '-48.2px',
        '--target-y': '-12.600000000000001px',
      }),
    );
  });

  test('keeps the downward hand pose while guiding to a sticker on the right', async () => {
    render(
      <StickerBookPreviewStage
        isDragVariant={true}
        isLoading={false}
        showIntroConfetti={false}
        showDropConfetti={false}
        showPointerHint={true}
        isDragging={false}
        isDropSuccessful={false}
        dragStickerPos={{ x: 90, y: 40 }}
        dragStickerSize={50}
        nextStickerImage="https://example.com/sticker.png"
        nextStickerName="Rocket"
        sceneSvg={buildSvg()}
        bookSvgRef={React.createRef()}
        setFrameElement={jest.fn()}
        getSlotRectInFrame={() => ({
          x: 20,
          y: 20,
          width: 40,
          height: 40,
        })}
        onDragPointerDown={jest.fn()}
        onDragPointerMove={jest.fn()}
        onDragPointerUp={jest.fn()}
        onDragPointerCancel={jest.fn()}
      />,
    );

    await waitFor(() =>
      expect(
        screen.getByTestId('StickerBookPreviewModal-pointer-hint'),
      ).toHaveStyle({
        left: '40.239999999999995px',
        top: '14.240000000000002px',
        '--target-x': '58.2px',
        '--target-y': '17.4px',
      }),
    );
  });

  test('anchors from the top side when the draggable sticker overlaps a wide placeholder', async () => {
    render(
      <StickerBookPreviewStage
        isDragVariant={true}
        isLoading={false}
        showIntroConfetti={false}
        showDropConfetti={false}
        showPointerHint={true}
        isDragging={false}
        isDropSuccessful={false}
        dragStickerPos={{ x: 120, y: 20 }}
        dragStickerSize={50}
        nextStickerImage="https://example.com/sticker.png"
        nextStickerName="Rocket"
        sceneSvg={buildSvg()}
        bookSvgRef={React.createRef()}
        setFrameElement={jest.fn()}
        getSlotRectInFrame={() => ({
          x: 80,
          y: 40,
          width: 120,
          height: 24,
        })}
        onDragPointerDown={jest.fn()}
        onDragPointerMove={jest.fn()}
        onDragPointerUp={jest.fn()}
        onDragPointerCancel={jest.fn()}
      />,
    );

    await waitFor(() =>
      expect(
        screen.getByTestId('StickerBookPreviewModal-pointer-hint'),
      ).toHaveStyle({
        left: '123.44px',
        top: '17.1976px',
        '--target-x': '5px',
        '--target-y': '-5.557600000000001px',
      }),
    );
  });

  test('shows intro and drop confetti only for drag variant', () => {
    const { rerender } = render(
      <StickerBookPreviewStage
        isDragVariant={true}
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
      screen.getAllByTestId('StickerBookPreviewModal-confetti'),
    ).toHaveLength(2);

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

  test('renders drop confetti after a successful drag', () => {
    render(
      <StickerBookPreviewStage
        isDragVariant={true}
        isLoading={false}
        showIntroConfetti={false}
        showDropConfetti={true}
        showPointerHint={false}
        isDragging={false}
        isDropSuccessful={false}
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
      screen.getByTestId('StickerBookPreviewModal-confetti'),
    ).toBeInTheDocument();
    expect(screen.getByTestId('StickerBookPreviewModal-confetti')).toHaveStyle({
      left: '-47.5px',
      top: '-27.5px',
      width: '165px',
      height: '145px',
    });
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
