import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CampaignSetupPage from './CampaignSetupPage';

const mockGoBack = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useHistory: () => ({
    goBack: mockGoBack,
  }),
}));

const mockApiHandler = {
  getCampaignSetupOptions: jest.fn(),
  getCampaignAudienceOptions: jest.fn(),
  getCampaignAudienceSummary: jest.fn(),
  createCampaignAudienceGroup: jest.fn(),
  createCampaignSetup: jest.fn(),
};

jest.mock('../../services/ServiceConfig', () => ({
  ServiceConfig: {
    getI: () => ({
      apiHandler: mockApiHandler,
    }),
  },
}));

const setupApiMocks = () => {
  mockApiHandler.getCampaignSetupOptions.mockResolvedValue({
    programs: [{ id: 'program-1', name: 'Early Learning' }],
    managers: [{ id: 'manager-1', name: 'Raj Patel' }],
    savedGroups: [],
  });
  mockApiHandler.getCampaignAudienceOptions.mockResolvedValue({
    blocks: ['Block A'],
    schools: [{ id: 'school-1', name: 'School One', block: 'Block A' }],
    grades: [{ id: 'grade-1', name: 'Grade 1' }],
  });
  mockApiHandler.getCampaignAudienceSummary.mockResolvedValue({
    totalStudents: 10,
    grades: [{ gradeId: 'grade-1', gradeName: 'Grade 1', studentCount: 10 }],
  });
  mockApiHandler.createCampaignAudienceGroup.mockResolvedValue({
    id: 'audience-1',
    name: 'Reusable Group',
    programId: 'program-1',
    isAllSchools: true,
    isAllGrades: true,
    schoolIds: [],
    gradeIds: [],
  });
  mockApiHandler.createCampaignSetup.mockResolvedValue({
    campaignId: 'campaign-1',
    targetAudienceId: 'audience-1',
  });
};

const openSelectAndChoose = async (triggerText: string, optionText: string) => {
  fireEvent.mouseDown(screen.getByText(triggerText));
  await userEvent.click(
    await screen.findByRole('option', { name: optionText }),
  );
};

beforeEach(() => {
  jest.clearAllMocks();
  setupApiMocks();
});

describe('CampaignSetupPage', () => {
  it('renders setup sections and keeps next disabled until mandatory fields are complete', async () => {
    render(<CampaignSetupPage />);

    expect(
      await screen.findByRole('heading', { name: 'New Campaign' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Objective & Goal')).toBeInTheDocument();
    expect(screen.getByText('Campaign Details')).toBeInTheDocument();
    expect(screen.getByText('Target Audience')).toBeInTheDocument();
    expect(screen.getByText('Save this group for reuse')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled();
  });

  it('switches dynamic objective fields when homepage pathway campaign is selected', async () => {
    const user = userEvent.setup();
    render(<CampaignSetupPage />);

    await screen.findByRole('heading', { name: 'New Campaign' });
    expect(screen.getByText('Target Type')).toBeInTheDocument();

    await user.click(
      screen.getByRole('button', {
        name: /Homepage Learning Pathway Campaign/i,
      }),
    );

    expect(screen.getByText('Number of Learning Paths')).toBeInTheDocument();
    expect(screen.queryByText('Target Type')).not.toBeInTheDocument();
  });

  it('submits setup payload without showing a success toast on next', async () => {
    const user = userEvent.setup();
    render(<CampaignSetupPage />);

    await screen.findByRole('heading', { name: 'New Campaign' });

    await user.type(screen.getByLabelText('Target Value'), '90');
    await user.type(screen.getByLabelText('Campaign Name'), 'ABCD');
    await openSelectAndChoose('Select Campaign Manager', 'Raj Patel');

    fireEvent.change(screen.getByLabelText('Start Date'), {
      target: { value: '2026-05-01' },
    });
    fireEvent.change(screen.getByLabelText('End Date'), {
      target: { value: '2026-05-31' },
    });

    await openSelectAndChoose('Select Program', 'Early Learning');
    await waitFor(() =>
      expect(mockApiHandler.getCampaignAudienceOptions).toHaveBeenCalledWith(
        'program-1',
      ),
    );

    await user.click(screen.getByPlaceholderText('Select Grade'));
    await user.click(await screen.findByRole('option', { name: 'Grade 1' }));
    await user.type(screen.getByPlaceholderText('Enter group name'), 'Group A');

    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Next' })).toBeEnabled(),
    );
    await user.click(screen.getByRole('button', { name: 'Next' }));

    await waitFor(() =>
      expect(mockApiHandler.createCampaignSetup).toHaveBeenCalledWith(
        expect.objectContaining({
          campaignName: 'ABCD',
          managerId: 'manager-1',
          objective: 'homework_campaign',
          programId: 'program-1',
          targetType: 'percentage_completion',
          targetValue: 90,
          startDate: '2026-05-01',
          endDate: '2026-05-31',
        }),
      ),
    );
    expect(screen.queryByText('Campaign setup saved.')).not.toBeInTheDocument();
  });
});
