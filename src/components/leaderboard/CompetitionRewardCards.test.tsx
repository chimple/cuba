import { fireEvent, render, screen } from '@testing-library/react';
import CompetitionRewardCards from './CompetitionRewardCards';
import type { CompetitionReward } from './CompetitionRewardCards';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));
jest.mock('../../utility/util', () => ({
  Util: {
    getCurrentStudent: () => ({ id: 'child', name: 'Student' }),
    logEvent: jest.fn(),
  },
}));
jest.mock('../campaignCertificate/campaignCertificateAnalytics', () => ({
  buildCampaignAnalyticsContext: () => ({}),
  logCampaignCertificateEvent: jest.fn(),
}));

const completed: CompetitionReward = {
  campaign_id: 'completed',
  campaign_name: 'Completed campaign',
  student_id: 'child',
  start_date: '2000-01-01',
  end_date: '2000-01-31',
  lessons_completed_count: 1,
  status: 'missed',
  rank_achieved: null,
};

it('hides ended unranked rewards and their certificates while retaining ongoing campaigns', () => {
  render(
    <CompetitionRewardCards
      rewards={[
        completed,
        {
          ...completed,
          campaign_id: 'zero',
          campaign_name: 'Zero lessons',
          status: 'won',
          rank_achieved: 1,
          lessons_completed_count: 0,
        },
        {
          ...completed,
          campaign_id: 'invalid',
          campaign_name: 'Invalid rank',
          status: 'won',
          rank_achieved: 4,
        },
        {
          ...completed,
          campaign_id: 'ongoing',
          campaign_name: 'Ongoing campaign',
          end_date: '2099-01-31',
          status: 'in_progress',
        },
      ]}
    />,
  );
  expect(screen.queryByText('Completed campaign')).not.toBeInTheDocument();
  expect(screen.queryByText('Zero lessons')).not.toBeInTheDocument();
  expect(screen.queryByText('Invalid rank')).not.toBeInTheDocument();
  expect(screen.getByText('Ongoing campaign')).toBeInTheDocument();
  expect(
    screen.queryByText('competition_completed_title'),
  ).not.toBeInTheDocument();
  expect(
    screen.queryByRole('button', { name: 'Share competition reward' }),
  ).not.toBeInTheDocument();
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
});

it.each([1, 2, 3])(
  'retains the completed rank %i card and certificate',
  (rank) => {
    render(
      <CompetitionRewardCards
        rewards={[{ ...completed, status: 'won', rank_achieved: String(rank) }]}
      />,
    );
    expect(screen.getByText('Completed campaign')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Competition information' }),
    ).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole('button', { name: 'Share competition reward' }),
    );
    expect(
      screen.getByRole('dialog', { name: 'Competition certificate' }),
    ).toBeInTheDocument();
  },
);
