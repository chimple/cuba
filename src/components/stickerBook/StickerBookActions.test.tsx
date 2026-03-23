import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import StickerBookActions from './StickerBookActions';

/* ---------------- MOCK I18N ---------------- */

jest.mock('i18next', () => ({
  t: (key: string) => key,
}));

/* ---------------- MOCK SVG ---------------- */

jest.mock('../../assets/images/camera.svg', () => 'camera.svg');

/* ---------------- TEST HELPER ---------------- */

const renderActions = (props: any = {}) => {
  const defaultProps = {
    showPaint: true,
    onSave: jest.fn(),
    onPaint: jest.fn(),
    saveDisabled: false,
    paintDisabled: false,
    isStickerBookSaveEnabled: true,
    isBookCompleted: true,
  };

  const merged = { ...defaultProps, ...props };

  render(<StickerBookActions {...merged} />);
  return merged;
};

describe('StickerBookActions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  /* ---------- ROOT ---------- */

  test('renders root container', () => {
    renderActions();

    expect(
      document.getElementById('sticker-book-actions-root'),
    ).toBeInTheDocument();
  });

  test('root container has correct class', () => {
    renderActions();

    const root = document.getElementById('sticker-book-actions-root');

    expect(root).toHaveClass('StickerBookActions-root');
  });

  /* ---------- SAVE BUTTON ---------- */

  test('renders save button', () => {
    renderActions();

    expect(
      document.getElementById('sticker-book-actions-save'),
    ).toBeInTheDocument();
  });

  test('save button text appears', () => {
    renderActions();

    expect(screen.getByText('Save')).toBeInTheDocument();
  });

  test('save button has correct class', () => {
    renderActions();

    const btn = document.getElementById('sticker-book-actions-save');

    expect(btn).toHaveClass('StickerBookActions-save');
  });

  test('save button type is button', () => {
    renderActions();

    const btn = document.getElementById('sticker-book-actions-save');

    expect(btn).toHaveAttribute('type', 'button');
  });

  test('save button triggers onSave', () => {
    const props = renderActions();

    fireEvent.click(screen.getByText('Save'));

    expect(props.onSave).toHaveBeenCalled();
  });

  test('save button handles multiple clicks', () => {
    const props = renderActions();

    const btn = screen.getByText('Save');

    fireEvent.click(btn);
    fireEvent.click(btn);
    fireEvent.click(btn);

    expect(props.onSave).toHaveBeenCalledTimes(3);
  });

  test('save button disabled state works', () => {
    renderActions({ saveDisabled: true });

    const btn = document.getElementById('sticker-book-actions-save');

    expect(btn).toBeDisabled();
  });

  test('save button enabled by default', () => {
    renderActions();

    const btn = document.getElementById('sticker-book-actions-save');

    expect(btn).not.toBeDisabled();
  });

  test('save button hidden when sticker book save feature is disabled', () => {
    renderActions({ isStickerBookSaveEnabled: false });

    expect(
      document.getElementById('sticker-book-actions-save'),
    ).not.toBeInTheDocument();
    expect(screen.queryByText('Save')).not.toBeInTheDocument();
  });

  test('save button hidden when book is not completed', () => {
    renderActions({ isBookCompleted: false });

    expect(
      document.getElementById('sticker-book-actions-save'),
    ).not.toBeInTheDocument();
    expect(screen.queryByText('Save')).not.toBeInTheDocument();
  });

  /* ---------- SAVE ICON ---------- */

  test('save button contains icon', () => {
    renderActions();

    const img = screen.getByRole('img', { name: 'Save' });

    expect(img).toBeInTheDocument();
  });

  test('save icon src correct', () => {
    renderActions();

    const img = screen.getByRole('img', { name: 'Save' });

    expect(img).toHaveAttribute('src', 'camera.svg');
  });

  /* ---------- PAINT BUTTON ---------- */

  test('paint button appears when showPaint true', () => {
    renderActions({ showPaint: true });

    expect(screen.getByText('Paint')).toBeInTheDocument();
  });

  test('paint button hidden when showPaint false', () => {
    renderActions({ showPaint: false });

    expect(screen.queryByText('Paint')).not.toBeInTheDocument();
  });

  test('paint button has correct id', () => {
    renderActions();

    expect(
      document.getElementById('sticker-book-actions-paint'),
    ).toBeInTheDocument();
  });

  test('paint button has correct class', () => {
    renderActions();

    const btn = document.getElementById('sticker-book-actions-paint');

    expect(btn).toHaveClass('StickerBookActions-paint');
  });

  test('paint button type button', () => {
    renderActions();

    const btn = document.getElementById('sticker-book-actions-paint');

    expect(btn).toHaveAttribute('type', 'button');
  });

  test('paint button triggers onPaint', () => {
    const props = renderActions();

    fireEvent.click(screen.getByText('Paint'));

    expect(props.onPaint).toHaveBeenCalled();
  });

  test('paint button handles multiple clicks', () => {
    const props = renderActions();

    const btn = screen.getByText('Paint');

    fireEvent.click(btn);
    fireEvent.click(btn);

    expect(props.onPaint).toHaveBeenCalledTimes(2);
  });

  test('paint button disabled works', () => {
    renderActions({ paintDisabled: true });

    const btn = document.getElementById('sticker-book-actions-paint');

    expect(btn).toBeDisabled();
  });

  test('paint button enabled by default', () => {
    renderActions();

    const btn = document.getElementById('sticker-book-actions-paint');

    expect(btn).not.toBeDisabled();
  });

  /* ---------- PAINT ICON ---------- */

  test('paint button has icon', () => {
    renderActions();

    const img = screen.getByRole('img', { name: 'Paint' });

    expect(img).toBeInTheDocument();
  });

  test('paint icon src correct', () => {
    renderActions();

    const img = screen.getByRole('img', { name: 'Paint' });

    expect(img).toHaveAttribute('src', '/assets/icons/PaintBucket.svg');
  });

  /* ---------- BUTTON COUNT ---------- */

  test('two buttons when paint visible', () => {
    renderActions();

    const buttons = screen.getAllByRole('button');

    expect(buttons.length).toBe(2);
  });

  test('one button when paint hidden', () => {
    renderActions({ showPaint: false });

    const buttons = screen.getAllByRole('button');

    expect(buttons.length).toBe(1);
  });

  /* ---------- STRUCTURE ---------- */

  test('root contains save button', () => {
    renderActions();

    const root = document.getElementById('sticker-book-actions-root');
    const save = document.getElementById('sticker-book-actions-save');

    expect(root).toContainElement(save);
  });

  test('root contains paint button', () => {
    renderActions();

    const root = document.getElementById('sticker-book-actions-root');
    const paint = document.getElementById('sticker-book-actions-paint');

    expect(root).toContainElement(paint);
  });

  test('component renders without crashing', () => {
    renderActions();

    expect(true).toBe(true);
  });

  /* ---------- RERENDER TEST ---------- */

  test('rerender updates paint visibility', () => {
    const { rerender } = render(
      <StickerBookActions
        showPaint={false}
        onSave={() => {}}
        onPaint={() => {}}
        isStickerBookSaveEnabled={true}
        isBookCompleted={true}
      />,
    );

    rerender(
      <StickerBookActions
        showPaint={true}
        onSave={() => {}}
        onPaint={() => {}}
        isStickerBookSaveEnabled={true}
        isBookCompleted={true}
      />,
    );

    expect(screen.getByText('Paint')).toBeInTheDocument();
  });

  test('save button remains after rerender', () => {
    const { rerender } = render(
      <StickerBookActions
        showPaint={true}
        onSave={() => {}}
        onPaint={() => {}}
        isStickerBookSaveEnabled={true}
        isBookCompleted={true}
      />,
    );

    rerender(
      <StickerBookActions
        showPaint={true}
        onSave={() => {}}
        onPaint={() => {}}
        isStickerBookSaveEnabled={true}
        isBookCompleted={true}
      />,
    );

    expect(screen.getByText('Save')).toBeInTheDocument();
  });

  /* ---------- EDGE CASES ---------- */

  test('clicking icon triggers save', () => {
    const props = renderActions();

    const img = screen.getByRole('img', { name: 'Save' });

    fireEvent.click(img);

    expect(props.onSave).toHaveBeenCalled();
  });

  test('paint icon click triggers paint', () => {
    const props = renderActions();

    const img = screen.getByRole('img', { name: 'Paint' });

    fireEvent.click(img);

    expect(props.onPaint).toHaveBeenCalled();
  });

  test('buttons remain visible after click', () => {
    const props = renderActions();

    const save = screen.getByText('Save');

    fireEvent.click(save);

    expect(save).toBeVisible();
    expect(props.onSave).toHaveBeenCalled();
  });

  test('paint button remains after click', () => {
    const props = renderActions();

    const paint = screen.getByText('Paint');

    fireEvent.click(paint);

    expect(paint).toBeVisible();
    expect(props.onPaint).toHaveBeenCalled();
  });
});
