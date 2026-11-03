import { render, screen } from '@testing-library/react';
import TeacherLeaderboard from './TeacherLeaderboard';
import { ServiceConfig } from '../../../services/ServiceConfig';

jest.mock('../../../services/ServiceConfig', () => ({
  ServiceConfig: { getI: jest.fn() },
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, values?: Record<string, unknown>) =>
      key.replace(/\{\{(\w+)\}\}/g, (_, name) =>
        String(values?.[name] ?? `{{${name}}}`),
      ),
  }),
}));

const getConfig = (data?: unknown) => {
  (ServiceConfig.getI as jest.Mock).mockReturnValue({
    authHandler: {
      getCurrentUser: jest.fn().mockResolvedValue({ id: 'teacher-1' }),
    },
    apiHandler: { getTeacherLeaderboard: jest.fn().mockResolvedValue(data) },
  });
};

describe('TeacherLeaderboard', () => {
  beforeEach(() => jest.clearAllMocks());

  it('renders a locked leaderboard when the backend returns a locked row', async () => {
    getConfig({
      tier: 'locked',
      block_name: 'North',
      total_teachers_in_block: 0,
    });
    render(<TeacherLeaderboard onAssign={jest.fn()} />);
    expect(await screen.findByText('Leaderboard Locked !')).toBeInTheDocument();
  });

  it('renders the active tier and score from backend data', async () => {
    getConfig({
      tier: 'bronze',
      block_name: 'North',
      final_score: 30,
      total_teachers_in_block: 3,
    });
    render(<TeacherLeaderboard onAssign={jest.fn()} />);
    expect(await screen.findByText('30 points')).toBeInTheDocument();
    expect(screen.getByText('Bronze')).toBeInTheDocument();
    expect(screen.getByText('You are here')).toBeInTheDocument();
  });
});
