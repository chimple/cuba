import { render, screen } from '@testing-library/react';
import CompetitionRewardInfoModal from './CompetitionRewardInfoModal';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

it.each([
  [0, '0 / 50', '0%'],
  [12, '12 / 50', '24%'],
  [14, '14 / 50', '28%'],
  [55, '55 / 50', '100%'],
])(
  'shows completed lessons against the pathway lesson target for %i lessons',
  (lessons, text, width) => {
    render(
      <CompetitionRewardInfoModal
        reward={{
          campaign_id: 'home',
          objective: 'homepage_learning_pathway_campaign',
          target_value: 10,
          lessons_completed_count: lessons,
          lessons_target_count: 50,
        }}
        onClose={jest.fn()}
      />,
    );
    expect(
      screen.getByText('competition_homepage_lessons_completed'),
    ).toBeInTheDocument();
    expect(screen.getByText(text)).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toHaveAttribute(
      'aria-valuenow',
      String(parseFloat(width)),
    );
  },
);

it('shows an empty progress row when the pathway target is missing', () => {
  render(
    <CompetitionRewardInfoModal
      reward={{
        campaign_id: 'home',
        objective: 'homepage_learning_pathway_campaign',
        lessons_completed_count: 12,
        lessons_target_count: 12,
      }}
      onClose={jest.fn()}
    />,
  );
  expect(
    screen.getByText('competition_homepage_lessons_completed'),
  ).toBeInTheDocument();
  expect(screen.getByText('0 / 0')).toBeInTheDocument();
  expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '0');
});
