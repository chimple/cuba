import { fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import ScoreCalculationPopup from './ScoreCalculationPopup';

jest.mock('i18next', () => ({ t: (key: string) => key }));

describe('ScoreCalculationPopup', () => {
  it('shows zones, base score, all movements, and the final formula', () => {
    render(<ScoreCalculationPopup isOpen onClose={jest.fn()} />);

    expect(screen.getByText('Gold')).toBeInTheDocument();
    expect(screen.getByText(/Middle/)).toBeInTheDocument();
    expect(
      screen.getByText(/Avg. time spent by Green-band/),
    ).toBeInTheDocument();
    expect(screen.getByText('Movement & Points System')).toBeInTheDocument();
    expect(screen.getAllByText('Grey')).toHaveLength(2);
    expect(screen.getByText('-15', { exact: false })).toBeInTheDocument();
    expect(
      screen.getByText('Final Score = Base Score + Bonus / Penalty'),
    ).toBeInTheDocument();
  });

  it('closes from the close control', () => {
    const onClose = jest.fn();
    render(<ScoreCalculationPopup isOpen onClose={onClose} />);
    fireEvent.click(screen.getByLabelText('Close score calculation'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('renders nothing while closed', () => {
    render(<ScoreCalculationPopup isOpen={false} onClose={jest.fn()} />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
