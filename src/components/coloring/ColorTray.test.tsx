import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import ColorTray from './ColorTray';

/* ---------------- MOCK UTIL ---------------- */

const mockLogEvent = jest.fn();

jest.mock('../../utility/util', () => ({
  Util: {
    logEvent: (...args: any[]) => mockLogEvent(...args),
    getCurrentStudent: () => ({ id: 'student1' }),
  },
}));

/* ---------------- MOCK CONSTANTS ---------------- */

jest.mock('../../common/constants', () => ({
  EVENTS: {
    PAINT_COLOR_TAP: 'paint_color_tap',
  },
}));

/* ---------------- COLORS ---------------- */

const COLORS = [
  '#FF2E88',
  '#0DB14B',
  '#FF4A1C',
  '#1AB7B5',
  '#FFD600',
  '#B066D1',
  '#66D9E8',
  '#79D70F',
];

/* ---------------- TEST HELPER ---------------- */

const renderTray = (selected = '', onSelect = jest.fn()) => {
  render(<ColorTray selected={selected} onSelect={onSelect} />);
  return { onSelect };
};

/* ================================================= */
/* ===================== TESTS ===================== */
/* ================================================= */

describe('ColorTray', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  /* ---------- RENDER ---------- */

  test('renders tray container', () => {
    renderTray();

    expect(document.querySelector('.color-tray-div')).toBeInTheDocument();
  });

  test('renders all color buttons', () => {
    renderTray();

    const buttons = document.querySelectorAll('.color-tray-color-box');

    expect(buttons.length).toBe(8);
  });

  test('each button is a button element', () => {
    renderTray();

    const buttons = screen.getAllByRole('button');

    expect(buttons.length).toBe(8);
  });

  /* ---------- COLOR STYLES ---------- */

  test('each color button has correct background', () => {
    renderTray();

    const buttons = screen.getAllByRole('button');

    buttons.forEach((btn, index) => {
      expect(btn).toHaveStyle(`background: ${COLORS[index]}`);
    });
  });

  test('buttons contain expected colors', () => {
    renderTray();

    const buttons = screen.getAllByRole('button');

    COLORS.forEach((color, i) => {
      expect(buttons[i]).toHaveStyle(`background: ${color}`);
    });
  });

  /* ---------- SELECTED STATE ---------- */

  test('applies selected class to chosen color', () => {
    renderTray('#FF2E88');

    const first = screen.getAllByRole('button')[0];

    expect(first).toHaveClass('selected');
  });

  test('only one color is selected', () => {
    renderTray('#FF2E88');

    const selected = document.querySelectorAll('.selected');

    expect(selected.length).toBe(1);
  });

  test('no selected class if no color selected', () => {
    renderTray('');

    const selected = document.querySelectorAll('.selected');

    expect(selected.length).toBe(0);
  });

  test('correct button becomes selected', () => {
    renderTray('#FFD600');

    const buttons = screen.getAllByRole('button');

    expect(buttons[4]).toHaveClass('selected');
  });

  /* ---------- CLICK HANDLING ---------- */

  test('clicking a color triggers onSelect', () => {
    const { onSelect } = renderTray();

    const button = screen.getAllByRole('button')[2];

    fireEvent.click(button);

    expect(onSelect).toHaveBeenCalled();
  });

  test('onSelect receives correct color', () => {
    const { onSelect } = renderTray();

    const button = screen.getAllByRole('button')[3];

    fireEvent.click(button);

    expect(onSelect).toHaveBeenCalledWith(COLORS[3]);
  });

  test('multiple clicks trigger onSelect multiple times', () => {
    const { onSelect } = renderTray();

    const button = screen.getAllByRole('button')[0];

    fireEvent.click(button);
    fireEvent.click(button);
    fireEvent.click(button);

    expect(onSelect).toHaveBeenCalledTimes(3);
  });

  test('clicking different colors triggers different values', () => {
    const { onSelect } = renderTray();

    const buttons = screen.getAllByRole('button');

    fireEvent.click(buttons[1]);
    fireEvent.click(buttons[2]);

    expect(onSelect).toHaveBeenNthCalledWith(1, COLORS[1]);
    expect(onSelect).toHaveBeenNthCalledWith(2, COLORS[2]);
  });

  /* ---------- ANALYTICS ---------- */

  test('logs analytics event on click', () => {
    renderTray();

    const button = screen.getAllByRole('button')[0];

    fireEvent.click(button);

    expect(mockLogEvent).toHaveBeenCalled();
  });

  test('logs correct analytics event name', () => {
    renderTray();

    const button = screen.getAllByRole('button')[0];

    fireEvent.click(button);

    expect(mockLogEvent).toHaveBeenCalledWith(
      'paint_color_tap',
      expect.any(Object),
    );
  });

  test('logs correct color in analytics', () => {
    renderTray();

    const button = screen.getAllByRole('button')[2];

    fireEvent.click(button);

    expect(mockLogEvent).toHaveBeenCalledWith(
      'paint_color_tap',
      expect.objectContaining({
        color: COLORS[2],
      }),
    );
  });

  test('logs user id in analytics', () => {
    renderTray();

    const button = screen.getAllByRole('button')[0];

    fireEvent.click(button);

    expect(mockLogEvent).toHaveBeenCalledWith(
      'paint_color_tap',
      expect.objectContaining({
        user_id: 'student1',
      }),
    );
  });

  test('logs page path in analytics', () => {
    renderTray();

    const button = screen.getAllByRole('button')[0];

    fireEvent.click(button);

    expect(mockLogEvent).toHaveBeenCalledWith(
      'paint_color_tap',
      expect.objectContaining({
        page_path: window.location.pathname,
      }),
    );
  });

  /* ---------- STRUCTURE ---------- */

  test('all buttons have correct class', () => {
    renderTray();

    const buttons = screen.getAllByRole('button');

    buttons.forEach((btn) => {
      expect(btn).toHaveClass('color-tray-color-box');
    });
  });

  test('buttons have unique keys', () => {
    renderTray();

    const buttons = screen.getAllByRole('button');

    expect(buttons.length).toBe(new Set(COLORS).size);
  });

  test('buttons use type button', () => {
    renderTray();

    const buttons = screen.getAllByRole('button');

    buttons.forEach((btn) => {
      expect(btn).toHaveAttribute('type', 'button');
    });
  });

  test('tray container remains stable after clicks', () => {
    renderTray();

    const container = document.querySelector('.color-tray-div');

    const button = screen.getAllByRole('button')[0];

    fireEvent.click(button);

    expect(container).toBeInTheDocument();
  });

  test('clicking selected color still triggers event', () => {
    const { onSelect } = renderTray('#FF2E88');

    const button = screen.getAllByRole('button')[0];

    fireEvent.click(button);

    expect(onSelect).toHaveBeenCalled();
  });

  test('component renders without crashing', () => {
    renderTray();

    expect(true).toBe(true);
  });
});
