import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import PaintTopBar from './PaintTopBar';

/* ---------------- MOCK I18NEXT ---------------- */

jest.mock('i18next', () => ({
  t: (key: string) => key,
}));

/* ---------------- TEST HELPER ---------------- */

const renderBar = (onExit = jest.fn()) => {
  render(<PaintTopBar onExit={onExit} />);
  return { onExit };
};

/* ================================================= */
/* ===================== TESTS ===================== */
/* ================================================= */

describe('PaintTopBar', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  /* ---------- RENDER ---------- */

  test('renders top bar container', () => {
    renderBar();

    const container = document.querySelector('.paint-topbar');

    expect(container).toBeInTheDocument();
  });

  test('renders exit button', () => {
    renderBar();

    const button = screen.getByRole('button');

    expect(button).toBeInTheDocument();
  });

  test('exit button has correct class', () => {
    renderBar();

    const button = screen.getByRole('button');

    expect(button).toHaveClass('exit-btn');
  });

  test('renders exit icon image', () => {
    renderBar();

    const img = screen.getByRole('img');

    expect(img).toBeInTheDocument();
  });

  test('image has correct src', () => {
    renderBar();

    const img = screen.getByRole('img');

    expect(img).toHaveAttribute('src', '/assets/icons/PaintExitIcon.svg');
  });

  test('image has alt text', () => {
    renderBar();

    const img = screen.getByRole('img');

    expect(img).toHaveAttribute('alt', 'Close');
  });

  /* ---------- CLICK EVENTS ---------- */

  test('clicking exit button triggers onExit', () => {
    const { onExit } = renderBar();

    const button = screen.getByRole('button');

    fireEvent.click(button);

    expect(onExit).toHaveBeenCalledTimes(1);
  });

  test('multiple clicks trigger multiple exits', () => {
    const { onExit } = renderBar();

    const button = screen.getByRole('button');

    fireEvent.click(button);
    fireEvent.click(button);
    fireEvent.click(button);

    expect(onExit).toHaveBeenCalledTimes(3);
  });

  test('exit handler receives click event', () => {
    const onExit = jest.fn();

    render(<PaintTopBar onExit={onExit} />);

    const button = screen.getByRole('button');

    fireEvent.click(button);

    expect(onExit).toHaveBeenCalled();
  });

  /* ---------- IMAGE VALIDATION ---------- */

  test('image element exists inside button', () => {
    renderBar();

    const button = screen.getByRole('button');

    const img = button.querySelector('img');

    expect(img).toBeInTheDocument();
  });

  test('image alt attribute not empty', () => {
    renderBar();

    const img = screen.getByRole('img');

    expect(img.getAttribute('alt')).not.toBe('');
  });

  /* ---------- STRUCTURE ---------- */

  test('container contains button', () => {
    renderBar();

    const container = document.querySelector('.paint-topbar');

    const button = screen.getByRole('button');

    expect(container).toContainElement(button);
  });

  test('button contains icon', () => {
    renderBar();

    const button = screen.getByRole('button');

    const img = screen.getByRole('img');

    expect(button).toContainElement(img);
  });

  test('component renders without crashing', () => {
    renderBar();

    expect(true).toBe(true);
  });

  /* ---------- ACCESSIBILITY ---------- */

  test('button is accessible by role', () => {
    renderBar();

    expect(screen.getByRole('button')).toBeVisible();
  });

  test('image accessible via role', () => {
    renderBar();

    expect(screen.getByRole('img')).toBeVisible();
  });

  test('button clickable via fireEvent', () => {
    const { onExit } = renderBar();

    const button = screen.getByRole('button');

    fireEvent.click(button);

    expect(onExit).toHaveBeenCalled();
  });

  /* ---------- RERENDER TEST ---------- */

  test('rerender preserves button', () => {
    const { rerender } = render(<PaintTopBar onExit={() => {}} />);

    rerender(<PaintTopBar onExit={() => {}} />);

    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  test('rerender keeps icon intact', () => {
    const { rerender } = render(<PaintTopBar onExit={() => {}} />);

    rerender(<PaintTopBar onExit={() => {}} />);

    expect(screen.getByRole('img')).toBeInTheDocument();
  });

  /* ---------- DOM VALIDATION ---------- */

  test('only one button exists', () => {
    renderBar();

    const buttons = screen.getAllByRole('button');

    expect(buttons.length).toBe(1);
  });

  test('only one image exists', () => {
    renderBar();

    const images = screen.getAllByRole('img');

    expect(images.length).toBe(1);
  });

  test('button does not disappear after click', () => {
    const { onExit } = renderBar();

    const button = screen.getByRole('button');

    fireEvent.click(button);

    expect(button).toBeInTheDocument();
    expect(onExit).toHaveBeenCalled();
  });

  /* ---------- EDGE CASES ---------- */

  test('clicking icon triggers exit through button', () => {
    const { onExit } = renderBar();

    const img = screen.getByRole('img');

    fireEvent.click(img);

    expect(onExit).toHaveBeenCalled();
  });

  test('button remains visible after multiple interactions', () => {
    const { onExit } = renderBar();

    const button = screen.getByRole('button');

    fireEvent.click(button);
    fireEvent.click(button);

    expect(button).toBeVisible();
    expect(onExit).toHaveBeenCalledTimes(2);
  });

  test('icon remains visible after interactions', () => {
    const { onExit } = renderBar();

    const img = screen.getByRole('img');

    fireEvent.click(img);

    expect(img).toBeVisible();
    expect(onExit).toHaveBeenCalled();
  });
});
