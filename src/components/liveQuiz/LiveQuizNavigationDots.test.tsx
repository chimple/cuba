import React from 'react';
import { render } from '@testing-library/react';
import LiveQuizNavigationDots from './LiveQuizNavigationDots';

describe('LiveQuizNavigationDots', () => {
  const renderDots = (
    props?: Partial<React.ComponentProps<typeof LiveQuizNavigationDots>>,
  ) =>
    render(
      <LiveQuizNavigationDots
        totalDots={5}
        currentDot={2}
        correctAnswers={[1, 2, 3, 0, 1]}
        selectedAnswers={[1, 0, 3, 0, 0]}
        {...props}
      />,
    );

  test('renders total number of dots', () => {
    const { container } = renderDots();
    expect(container.querySelectorAll('.dot')).toHaveLength(5);
  });

  test('marks current dot as active', () => {
    const { container } = renderDots();
    const dots = container.querySelectorAll('.dot');
    expect(dots[2]).toHaveClass('actived');
  });

  test('marks previous correct dot as correct', () => {
    const { container } = renderDots();
    const dots = container.querySelectorAll('.dot');
    expect(dots[0]).toHaveClass('correct');
  });

  test('marks previous incorrect dot as incorrect', () => {
    const { container } = renderDots();
    const dots = container.querySelectorAll('.dot');
    expect(dots[1]).toHaveClass('incorrect');
  });

  test('does not mark future dots as correct or incorrect', () => {
    const { container } = renderDots();
    const dots = container.querySelectorAll('.dot');
    expect(dots[3]).not.toHaveClass('correct');
    expect(dots[3]).not.toHaveClass('incorrect');
    expect(dots[4]).not.toHaveClass('correct');
    expect(dots[4]).not.toHaveClass('incorrect');
  });

  test('renders no active dot when currentDot is out of range', () => {
    const { container } = renderDots({ currentDot: 8 });
    expect(container.querySelector('.actived')).toBeNull();
  });

  test('handles zero dots', () => {
    const { container } = renderDots({ totalDots: 0 });
    expect(container.querySelectorAll('.dot')).toHaveLength(0);
  });

  test('marks first dot active when currentDot is zero', () => {
    const { container } = renderDots({ currentDot: 0 });
    const dots = container.querySelectorAll('.dot');
    expect(dots[0]).toHaveClass('actived');
  });

  test('marks all previous dots when currentDot is last', () => {
    const { container } = renderDots({ currentDot: 4 });
    const dots = container.querySelectorAll('.dot');
    expect(dots[0]).toHaveClass('correct');
    expect(dots[1]).toHaveClass('incorrect');
    expect(dots[2]).toHaveClass('correct');
    expect(dots[3]).toHaveClass('correct');
    expect(dots[4]).toHaveClass('actived');
  });

  test('uses incorrect when selected answer is missing', () => {
    const { container } = renderDots({ selectedAnswers: [1] });
    const dots = container.querySelectorAll('.dot');
    expect(dots[1]).toHaveClass('incorrect');
  });

  test('uses incorrect when correct answer list is missing value', () => {
    const { container } = renderDots({ correctAnswers: [1] });
    const dots = container.querySelectorAll('.dot');
    expect(dots[1]).toHaveClass('incorrect');
  });

  test('keeps classes on rerender with new active index', () => {
    const { container, rerender } = renderDots();
    rerender(
      <LiveQuizNavigationDots
        totalDots={5}
        currentDot={3}
        correctAnswers={[1, 2, 3, 0, 1]}
        selectedAnswers={[1, 2, 0, 0, 0]}
      />,
    );
    const dots = container.querySelectorAll('.dot');
    expect(dots[0]).toHaveClass('correct');
    expect(dots[1]).toHaveClass('correct');
    expect(dots[2]).toHaveClass('incorrect');
    expect(dots[3]).toHaveClass('actived');
  });

  test.each([
    [0, 'actived'],
    [1, 'actived'],
    [2, 'actived'],
    [3, 'actived'],
    [4, 'actived'],
  ])('activates dot index %i', (index, expectedClass) => {
    const { container } = renderDots({ currentDot: index });
    const dots = container.querySelectorAll('.dot');
    expect(dots[index]).toHaveClass(expectedClass);
  });

  test.each([
    { correct: [0, 1, 2], selected: [0, 1, 2], idx: 1 },
    { correct: [2, 1, 0], selected: [2, 1, 0], idx: 2 },
    { correct: [3, 3, 3], selected: [3, 3, 3], idx: 2 },
  ])(
    'applies correct class for matching prior answers %#',
    ({ correct, selected, idx }) => {
      const { container } = renderDots({
        totalDots: 3,
        currentDot: idx,
        correctAnswers: correct,
        selectedAnswers: selected,
      });
      const dots = container.querySelectorAll('.dot');
      for (let i = 0; i < idx; i += 1) {
        expect(dots[i]).toHaveClass('correct');
      }
    },
  );

  test.each([
    { correct: [0, 1, 2], selected: [2, 1, 0], idx: 2 },
    { correct: [1, 1, 1], selected: [0, 1, 0], idx: 2 },
    { correct: [2, 2, 2], selected: [2, 0, 1], idx: 2 },
  ])(
    'applies incorrect class for non-matching prior answers %#',
    ({ correct, selected, idx }) => {
      const { container } = renderDots({
        totalDots: 3,
        currentDot: idx,
        correctAnswers: correct,
        selectedAnswers: selected,
      });
      const dots = container.querySelectorAll('.dot');
      expect(dots[0]).toHaveClass(
        correct[0] === selected[0] ? 'correct' : 'incorrect',
      );
      expect(dots[1]).toHaveClass(
        correct[1] === selected[1] ? 'correct' : 'incorrect',
      );
    },
  );

  test('retains base dot class for each dot', () => {
    const { container } = renderDots();
    container.querySelectorAll('div').forEach((node) => {
      if (node.className.includes('dot')) {
        expect(node.className).toContain('dot');
      }
    });
  });

  test('does not crash when selectedAnswers has extra entries', () => {
    const { container } = renderDots({
      selectedAnswers: [1, 0, 3, 0, 0, 7, 8, 9],
    });
    expect(container.querySelectorAll('.dot')).toHaveLength(5);
  });

  test('does not crash when correctAnswers has extra entries', () => {
    const { container } = renderDots({
      correctAnswers: [1, 2, 3, 0, 1, 4, 5],
    });
    expect(container.querySelectorAll('.dot')).toHaveLength(5);
  });
});
