import { fireEvent, render, screen } from '@testing-library/react';
import TeacherScoreDetails, { TeacherScoreDay } from './TeacherScoreDetails';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, values?: Record<string, unknown>) =>
      key.replace(/\{\{(\w+)\}\}/g, (_, name) =>
        String(values?.[name] ?? `{{${name}}}`),
      ),
  }),
}));

const dateForDaysAgo = (daysAgo: number) => {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() - daysAgo);
  return date.toISOString().slice(0, 10);
};

const scoreHistory = (scores: number[]): TeacherScoreDay[] =>
  scores.map((score, index) => ({
    date: dateForDaysAgo(6 - index),
    score,
  }));

describe('TeacherScoreDetails', () => {
  it('renders seven daily scores and the increase message', () => {
    render(
      <TeacherScoreDetails
        currentScore={74}
        scoreHistory={scoreHistory([62, 68, 70, 71, 70, 70, 74])}
        onClose={jest.fn()}
      />,
    );

    expect(
      screen.getByText('Your Score today is 74 points'),
    ).toBeInTheDocument();
    expect(screen.getByText('4↑')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Your score has increased by 4 points. Keep it up! Motivate your students to stay strong on the leaderboard! 👍',
      ),
    ).toBeInTheDocument();
    expect(screen.getByText('Today')).toBeInTheDocument();
  });

  it('renders the decrease message and closes from the close button', () => {
    const onClose = jest.fn();
    render(
      <TeacherScoreDetails
        currentScore={70}
        scoreHistory={scoreHistory([62, 68, 70, 71, 70, 74, 70])}
        onClose={onClose}
      />,
    );

    expect(screen.getByText('4↓')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Your score has decreased by 4 points. Motivate students to move into the green band and climb the leaderboard! 👍',
      ),
    ).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole('button', { name: 'Close score details' }),
    );
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
