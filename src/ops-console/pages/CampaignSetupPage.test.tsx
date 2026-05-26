import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { getTodayDateValue } from '../hooks/campaignSetupFormHelpers';
import CampaignSetupPage from './CampaignSetupPage';
import { buildCampaignRewardsPayload } from '../hooks/campaignSetupFormHelpers';

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

let mockAssignmentComplete = false;

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
        onCompletionChange(mockAssignmentComplete);
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
  mockAssignmentComplete = false;
  setupApiMocks();
});

const completeSetupStep = async () => {
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
  await screen.findByText('Assignment Configuration');
};

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

  it('opens date pickers and restricts campaign dates to today onward', async () => {
    render(<CampaignSetupPage />);

    await screen.findByRole('heading', { name: 'New Campaign' });

    const startDateInput = screen.getByLabelText(
      'Start Date',
    ) as HTMLInputElement;
    const endDateInput = screen.getByLabelText('End Date') as HTMLInputElement;
    const startDatePicker = jest.fn();
    const endDatePicker = jest.fn();

    startDateInput.showPicker = startDatePicker;
    endDateInput.showPicker = endDatePicker;

    expect(startDateInput).toHaveAttribute('min', getTodayDateValue());
    expect(endDateInput).toHaveAttribute('min', getTodayDateValue());

    fireEvent.click(screen.getByLabelText('Open start date picker'));
    fireEvent.click(screen.getByLabelText('Open end date picker'));

    expect(startDatePicker).toHaveBeenCalledTimes(1);
    expect(endDatePicker).toHaveBeenCalledTimes(1);

    fireEvent.change(startDateInput, {
      target: { value: '2099-05-01' },
    });

    expect(endDateInput).toHaveAttribute('min', '2099-05-01');
  });

  it('does not save duplicate audience group names', async () => {
    mockApiHandler.getCampaignSetupOptions.mockResolvedValueOnce({
      programs: [{ id: 'program-1', name: 'Early Learning' }],
      managers: [{ id: 'manager-1', name: 'Raj Patel' }],
      savedGroups: [
        {
          id: 'audience-1',
          name: 'Reusable Group',
          programId: 'program-1',
          isAllSchools: true,
          isAllGrades: true,
          schoolIds: [],
          gradeIds: [],
        },
      ],
    });

    render(<CampaignSetupPage />);

    await screen.findByRole('heading', { name: 'New Campaign' });
    await openSelectAndChoose('Select Program', 'Early Learning');
    fireEvent.change(screen.getByPlaceholderText('Enter group name'), {
      target: { value: ' reusable   group ' },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    expect(
      await screen.findAllByText(
        'A saved group with this name already exists.',
      ),
    ).toHaveLength(2);
    expect(mockApiHandler.createCampaignAudienceGroup).not.toHaveBeenCalled();
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
      target: { value: '2099-05-01' },
    });
    fireEvent.change(screen.getByLabelText('End Date'), {
      target: { value: '2099-05-31' },
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
          startDate: '2099-05-01',
          endDate: '2099-05-31',
          isAllGrades: true,
          gradeIds: [],
        }),
      ),
    );
    expect(screen.queryByText('Campaign setup saved.')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled();
  });

  it('renders rewards configuration and validates mandatory rank fields', async () => {
    mockAssignmentComplete = true;
    render(<CampaignSetupPage />);

    await screen.findByRole('heading', { name: 'New Campaign' });
    await completeSetupStep();

    fireEvent.click(screen.getByRole('button', { name: 'Next' }));

    expect(screen.getByText('Rewards Configuration')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Completion is calculated based on assignments completed.',
      ),
    ).toBeInTheDocument();
    expect(
      screen.getAllByText('Minimum Completion (%)').length,
    ).toBeGreaterThan(0);
    fireEvent.mouseDown(screen.getByText('Select Reward Type'));
    expect(
      await screen.findByRole('option', { name: 'Digital Rewards' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('option', { name: 'Physical Rewards' }),
    ).toBeInTheDocument();
    fireEvent.keyDown(document.activeElement || document.body, {
      key: 'Escape',
      code: 'Escape',
    });

    fireEvent.click(screen.getByRole('button', { name: 'Next' }));

    expect(
      await screen.findByText('Reward type is required.'),
    ).toBeInTheDocument();
    expect(screen.getAllByText('Minimum completion is required.')).toHaveLength(
      3,
    );
    expect(screen.getAllByText('Reward is required.')).toHaveLength(3);
  });

  it('prevents overlapping reward ranking ranges', async () => {
    mockAssignmentComplete = true;
    render(<CampaignSetupPage />);

    await screen.findByRole('heading', { name: 'New Campaign' });
    await completeSetupStep();

    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    await openSelectAndChoose('Select Reward Type', 'Digital Rewards');
    fireEvent.change(screen.getByLabelText('1st Minimum Completion (%)'), {
      target: { value: '70' },
    });
    fireEvent.change(screen.getByLabelText('2nd Minimum Completion (%)'), {
      target: { value: '90' },
    });
    fireEvent.change(screen.getByLabelText('3rd Minimum Completion (%)'), {
      target: { value: '50' },
    });
    fireEvent.change(screen.getByLabelText('1st Reward'), {
      target: { value: 'Gold' },
    });
    fireEvent.change(screen.getByLabelText('2nd Reward'), {
      target: { value: 'Silver' },
    });
    fireEvent.change(screen.getByLabelText('3rd Reward'), {
      target: { value: 'Bronze' },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Next' }));

    expect(
      await screen.findByText(
        'Ranking criteria must be highest for 1st rank, then decrease for each rank.',
      ),
    ).toBeInTheDocument();
  });

  it('builds rewards payload locally and advances to messaging step', async () => {
    mockAssignmentComplete = true;
    render(<CampaignSetupPage />);

    await screen.findByRole('heading', { name: 'New Campaign' });
    await completeSetupStep();

    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    await openSelectAndChoose('Select Reward Type', 'Digital Rewards');

    fireEvent.change(screen.getByLabelText('1st Minimum Completion (%)'), {
      target: { value: '90' },
    });
    fireEvent.change(screen.getByLabelText('2nd Minimum Completion (%)'), {
      target: { value: '70' },
    });
    fireEvent.change(screen.getByLabelText('3rd Minimum Completion (%)'), {
      target: { value: '50' },
    });
    fireEvent.change(screen.getByLabelText('1st Reward'), {
      target: { value: 'Certificate of Excellence' },
    });
    fireEvent.change(screen.getByLabelText('2nd Reward'), {
      target: { value: 'Certificate of Merit' },
    });
    fireEvent.change(screen.getByLabelText('3rd Reward'), {
      target: { value: 'Certificate of Achievement' },
    });

    expect(
      screen.getByText('Students with >=90% completion qualify for 1st rank'),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'Students with 70% - 89% completion qualify for 2nd rank',
      ),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    expect(
      screen.getByRole('heading', { name: 'Messaging' }),
    ).toBeInTheDocument();
  });

  it('uses lesson criteria for homepage learning pathway rewards', async () => {
    mockAssignmentComplete = true;
    render(<CampaignSetupPage />);

    await screen.findByRole('heading', { name: 'New Campaign' });
    fireEvent.click(
      screen.getByRole('button', {
        name: /Homepage Learning Pathway Campaign/i,
      }),
    );
    fireEvent.change(screen.getByLabelText('Number of Learning Paths'), {
      target: { value: '5' },
    });
    fireEvent.change(screen.getByLabelText('Campaign Name'), {
      target: { value: 'Pathway Campaign' },
    });
    await openSelectAndChoose('Select Campaign Manager', 'Raj Patel');
    fireEvent.change(screen.getByLabelText('Start Date'), {
      target: { value: '2026-05-01' },
    });
    fireEvent.change(screen.getByLabelText('End Date'), {
      target: { value: '2026-05-31' },
    });
    await openSelectAndChoose('Select Program', 'Early Learning');
    expect(await screen.findByText('Students:')).toBeInTheDocument();
    fireEvent.change(screen.getByPlaceholderText('Enter group name'), {
      target: { value: 'Group A' },
    });

    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Next' })).toBeEnabled(),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    await screen.findByText('Assignment Configuration');
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));

    expect(screen.getAllByText('Number of Lessons').length).toBeGreaterThan(0);
  });

  it('builds rewards payload in the next-step format', () => {
    expect(
      buildCampaignRewardsPayload({
        objective: 'homework_campaign',
        targetType: 'percentage_completion',
        targetValue: '90',
        learningPathCount: '',
        campaignName: 'Campaign',
        managerId: 'manager-1',
        startDate: '2026-05-01',
        endDate: '2026-05-31',
        programId: 'program-1',
        groupName: 'Group A',
        rewardType: 'digital_rewards',
        rewardRanks: [
          {
            rank: 1,
            criteriaValue: '90',
            reward: 'Certificate of Excellence',
          },
          { rank: 2, criteriaValue: '70', reward: 'Certificate of Merit' },
          {
            rank: 3,
            criteriaValue: '50',
            reward: 'Certificate of Achievement',
          },
        ],
      }),
    ).toEqual({
      type: 'digital_rewards',
      rules: [
        { rank: 1, min: 90, reward: 'Certificate of Excellence' },
        { rank: 2, min: 70, reward: 'Certificate of Merit' },
        { rank: 3, min: 50, reward: 'Certificate of Achievement' },
      ],
    });
  });
});
