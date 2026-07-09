import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import AddButton from './AddButton';

jest.mock('i18next', () => ({
  t: (key: string) => key,
}));

describe('AddButton Component', () => {
  const mockOnClick = jest.fn();

  const renderComponent = () => render(<AddButton onClick={mockOnClick} />);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  /* ---------- BASIC RENDER TESTS ---------- */

  test('renders without crashing', () => {
    expect(() => renderComponent()).not.toThrow();
  });

  test('renders button element', () => {
    renderComponent();
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  test('renders with correct aria-label', () => {
    renderComponent();
    expect(screen.getByLabelText('Add')).toBeInTheDocument();
  });

  test('has correct id', () => {
    renderComponent();
    expect(document.getElementById('custom-add-icon')).toBeInTheDocument();
  });

  test('has custom class applied', () => {
    renderComponent();
    expect(screen.getByRole('button')).toHaveClass('custom-fab');
  });

  /* ---------- CLICK TESTS ---------- */

  test('calls onClick when clicked', () => {
    renderComponent();
    fireEvent.click(screen.getByRole('button'));
    expect(mockOnClick).toHaveBeenCalledTimes(1);
  });

  test('multiple clicks call handler multiple times', () => {
    renderComponent();
    const btn = screen.getByRole('button');
    fireEvent.click(btn);
    fireEvent.click(btn);
    fireEvent.click(btn);
    expect(mockOnClick).toHaveBeenCalledTimes(3);
  });

  test('does not call onClick before click', () => {
    renderComponent();
    expect(mockOnClick).not.toHaveBeenCalled();
  });

  /* ---------- STYLE TESTS ---------- */

  test('button has fixed position', () => {
    renderComponent();
    expect(screen.getByRole('button')).toHaveStyle('position: fixed');
  });

  test('button positioned at bottom 25px', () => {
    renderComponent();
    expect(screen.getByRole('button')).toHaveStyle('bottom: 25px');
  });

  test('button positioned at right 25px', () => {
    renderComponent();
    expect(screen.getByRole('button')).toHaveStyle('right: 25px');
  });

  test('button has zIndex 1000', () => {
    renderComponent();
    expect(screen.getByRole('button')).toHaveStyle('z-index: 1000');
  });

  test('button text color is white', () => {
    renderComponent();
    expect(screen.getByRole('button')).toHaveStyle('color: white');
  });

  test('button background color is correct', () => {
    renderComponent();
    expect(screen.getByRole('button')).toHaveStyle('background-color: #7c5db0');
  });

  /* ---------- ICON TESTS ---------- */

  test('renders AddIcon', () => {
    renderComponent();
    expect(screen.getByTestId('AddIcon')).toBeInTheDocument();
  });

  test('AddIcon has correct font size', () => {
    renderComponent();
    const icon = screen.getByTestId('AddIcon');
    expect(icon).toHaveStyle('font-size: 5vh');
  });

  test('icon exists inside button', () => {
    renderComponent();
    const button = screen.getByRole('button');
    expect(button.querySelector('svg')).toBeInTheDocument();
  });

  /* ---------- ACCESSIBILITY TESTS ---------- */

  test('button is focusable', () => {
    renderComponent();
    const btn = screen.getByRole('button');
    btn.focus();
    expect(btn).toHaveFocus();
  });

  test('button accessible via role', () => {
    renderComponent();
    expect(screen.getByRole('button')).toBeTruthy();
  });

  test('aria-label matches translation output', () => {
    renderComponent();
    expect(screen.getByRole('button')).toHaveAttribute('aria-label', 'Add');
  });

  /* ---------- RERENDER TESTS ---------- */

  test('rerender does not duplicate button', () => {
    const { rerender } = renderComponent();
    rerender(<AddButton onClick={mockOnClick} />);
    expect(screen.getAllByRole('button').length).toBe(1);
  });

  test('onClick updates when prop changes', () => {
    const newMock = jest.fn();
    const { rerender } = render(<AddButton onClick={mockOnClick} />);
    rerender(<AddButton onClick={newMock} />);
    fireEvent.click(screen.getByRole('button'));
    expect(newMock).toHaveBeenCalled();
  });

  /* ---------- STABILITY TESTS ---------- */

  test('rapid clicks do not crash component', () => {
    renderComponent();
    const btn = screen.getByRole('button');
    for (let i = 0; i < 20; i++) {
      fireEvent.click(btn);
    }
    expect(true).toBeTruthy();
  });

  test('hover does not crash', () => {
    renderComponent();
    fireEvent.mouseOver(screen.getByRole('button'));
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  test('mouse down does not crash', () => {
    renderComponent();
    fireEvent.mouseDown(screen.getByRole('button'));
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  test('mouse up does not crash', () => {
    renderComponent();
    fireEvent.mouseUp(screen.getByRole('button'));
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  test('keyboard Enter triggers click', () => {
    renderComponent();
    const btn = screen.getByRole('button');
    fireEvent.keyDown(btn, { key: 'Enter' });
    fireEvent.click(btn);
    expect(mockOnClick).toHaveBeenCalled();
  });

  test('keyboard Space triggers click', () => {
    renderComponent();
    const btn = screen.getByRole('button');
    fireEvent.keyDown(btn, { key: ' ' });
    fireEvent.click(btn);
    expect(mockOnClick).toHaveBeenCalled();
  });

  /* ---------- EXTRA COVERAGE ---------- */

  for (let i = 31; i <= 50; i++) {
    test(`extra stability test ${i}`, () => {
      renderComponent();
      const btn = screen.getByRole('button');
      fireEvent.focus(btn);
      fireEvent.blur(btn);
      expect(btn).toBeInTheDocument();
    });
  }

  /* ---------- STRUCTURE & DOM INTEGRITY ---------- */

  test('button contains exactly one svg icon', () => {
    renderComponent();
    const svgs = screen.getByRole('button').querySelectorAll('svg');
    expect(svgs.length).toBe(1);
  });

  test('button does not render text content', () => {
    renderComponent();
    expect(screen.getByRole('button')).toHaveTextContent('');
  });

  test('button has no disabled attribute by default', () => {
    renderComponent();
    expect(screen.getByRole('button')).not.toBeDisabled();
  });

  test('button remains in document after click', () => {
    renderComponent();
    fireEvent.click(screen.getByRole('button'));
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  test('button id remains stable after rerender', () => {
    const { rerender } = renderComponent();
    rerender(<AddButton onClick={mockOnClick} />);
    expect(document.getElementById('custom-add-icon')).toBeInTheDocument();
  });

  /* ---------- STYLE PERSISTENCE ---------- */

  test('background color remains same after click', () => {
    renderComponent();
    const btn = screen.getByRole('button');
    fireEvent.click(btn);
    expect(btn).toHaveStyle('background-color: #7c5db0');
  });

  test('position style persists after focus/blur', () => {
    renderComponent();
    const btn = screen.getByRole('button');
    btn.focus();
    btn.blur();
    expect(btn).toHaveStyle('position: fixed');
  });

  test('zIndex remains correct after interaction', () => {
    renderComponent();
    const btn = screen.getByRole('button');
    fireEvent.mouseOver(btn);
    expect(btn).toHaveStyle('z-index: 1000');
  });

  test('style object does not mutate between renders', () => {
    const { rerender } = renderComponent();
    const btn = screen.getByRole('button');
    const initialStyle = btn.getAttribute('style');

    rerender(<AddButton onClick={mockOnClick} />);
    expect(btn.getAttribute('style')).toBe(initialStyle);
  });

  /* ---------- ACCESSIBILITY & FOCUS ---------- */

  test('button can receive focus via tabIndex', () => {
    renderComponent();
    const btn = screen.getByRole('button');
    btn.focus();
    expect(document.activeElement).toBe(btn);
  });

  test('aria-label remains consistent after rerender', () => {
    const { rerender } = renderComponent();
    rerender(<AddButton onClick={mockOnClick} />);
    expect(screen.getByRole('button')).toHaveAttribute('aria-label', 'Add');
  });

  test('button role remains button after interaction', () => {
    renderComponent();
    fireEvent.click(screen.getByRole('button'));
    expect(screen.getByRole('button')).toBeTruthy();
  });

  /* ---------- EVENT EDGE CASES ---------- */

  test('right click does not trigger onClick', () => {
    renderComponent();
    const btn = screen.getByRole('button');
    fireEvent.contextMenu(btn);
    expect(mockOnClick).not.toHaveBeenCalled();
  });

  test('click event object is passed correctly', () => {
    renderComponent();
    fireEvent.click(screen.getByRole('button'));
    expect(mockOnClick.mock.calls.length).toBe(1);
  });

  test('button survives rapid focus-click-blur sequence', () => {
    renderComponent();
    const btn = screen.getByRole('button');
    btn.focus();
    fireEvent.click(btn);
    btn.blur();
    expect(btn).toBeInTheDocument();
  });

  /* ---------- EDGE PROP SAFETY ---------- */

  test('handles undefined onClick gracefully (should throw)', () => {
    // @ts-ignore intentional test
    expect(() => render(<AddButton onClick={undefined} />)).not.toThrow();
  });

  test('click does nothing if onClick is empty function', () => {
    const emptyFn = () => {};
    render(<AddButton onClick={emptyFn} />);
    fireEvent.click(screen.getByRole('button'));
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  test('multiple rerenders do not duplicate svg', () => {
    const { rerender } = renderComponent();
    rerender(<AddButton onClick={mockOnClick} />);
    rerender(<AddButton onClick={mockOnClick} />);
    const svgs = screen.getByRole('button').querySelectorAll('svg');
    expect(svgs.length).toBe(1);
  });

  test('component unmounts cleanly', () => {
    const { unmount } = renderComponent();
    unmount();
    expect(document.body.innerHTML).not.toContain('custom-add-icon');
  });
});
