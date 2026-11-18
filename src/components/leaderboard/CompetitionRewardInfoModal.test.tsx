import { render, screen } from '@testing-library/react';
import CompetitionRewardInfoModal from './CompetitionRewardInfoModal';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

it.each([
  [0, '0 / 10', '0%'],
  [12, '2 / 10', '20%'],
  [14, '2 / 10', '20%'],
  [55, '11 / 10', '100%'],
])(
  'shows full pathways and a progress track for %i lessons',
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
      screen.getByText('competition_homepage_pathways_completed'),
    ).toBeInTheDocument();
    expect(screen.getByText(text)).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toHaveAttribute(
      'aria-valuenow',
      String(parseFloat(width)),
    );
  },
);

it('does not substitute completed lessons for a missing pathway target', () => {
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
    screen.getByText('competition_pathway_target_unavailable'),
  ).toBeInTheDocument();
  expect(screen.queryByText('12 / 12')).not.toBeInTheDocument();
});
