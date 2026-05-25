import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import CampaignSetupPage from './CampaignSetupPage';

const mockGoBack = jest.fn();
jest.setTimeout(10000);

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
  getCampaignAssignmentOptions: jest.fn(),
};

jest.mock('../../services/ServiceConfig', () => ({
  ServiceConfig: {
    getI: () => ({
      apiHandler: mockApiHandler,
    }),
  },
}));

jest.mock('../components/CampaignSetupSections', () => {
  const React = jest.requireActual('react');
  const actual = jest.requireActual('../components/CampaignSetupSections');

  return {
    ...actual,
    CampaignAssignmentStep: ({
      onAssignmentsChange,
      onCompletionChange,
    }: {
      onAssignmentsChange: (assignments: unknown[]) => void;
      onCompletionChange: (isComplete: boolean) => void;
    }) => {
      React.useEffect(() => {
        onAssignmentsChange([]);
        onCompletionChange(false);
      }, [onAssignmentsChange, onCompletionChange]);

      return <div>Assignment Configuration</div>;
    },
  };
});

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
  mockApiHandler.getCampaignAssignmentOptions.mockResolvedValue({
    grades: [
      {
        gradeId: 'grade-1',
        subjects: [],
      },
    ],
  });
};

const openSelectAndChoose = async (triggerText: string, optionText: string) => {
  fireEvent.mouseDown(screen.getByText(triggerText));
  fireEvent.click(await screen.findByRole('option', { name: optionText }));
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
    render(<CampaignSetupPage />);

    await screen.findByRole('heading', { name: 'New Campaign' });
    expect(screen.getByText('Target Type')).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole('button', {
        name: /Homepage Learning Pathway Campaign/i,
      }),
    );

    expect(screen.getByText('Number of Learning Paths')).toBeInTheDocument();
    expect(screen.queryByText('Target Type')).not.toBeInTheDocument();
  });

  it('submits setup payload without showing a success toast on next', async () => {
    render(<CampaignSetupPage />);

    await screen.findByRole('heading', { name: 'New Campaign' });

    fireEvent.change(screen.getByLabelText('Target Value'), {
      target: { value: '90' },
    });
    fireEvent.change(screen.getByLabelText('Campaign Name'), {
      target: { value: 'ABCD' },
    });
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

    expect(await screen.findByText('Students:')).toBeInTheDocument();
    expect(await screen.findByText(/Grade 1/)).toBeInTheDocument();
    fireEvent.change(screen.getByPlaceholderText('Enter group name'), {
      target: { value: 'Group A' },
    });

    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Next' })).toBeEnabled(),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));

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
          isAllGrades: true,
          gradeIds: [],
        }),
      ),
    );
    expect(screen.queryByText('Campaign setup saved.')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled();
  });
});
