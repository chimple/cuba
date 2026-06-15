import React from 'react';
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { getTodayDateValue } from '../hooks/campaignSetupFormHelpers';
import CampaignSetupPage from './CampaignSetupPage';
import { buildCampaignRewardsPayload } from '../hooks/campaignSetupFormHelpers';

const mockGoBack = jest.fn();
const mockTranslate = (
  key: string,
  options?: Record<string, string | number>,
): string =>
  options
    ? key.replace(/{{(\w+)}}/g, (_match, token: string) =>
        String(options[token] ?? ''),
      )
    : key;

jest.setTimeout(30000);

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: mockTranslate,
  }),
}));

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useHistory: () => ({
    goBack: mockGoBack,
  }),
  useLocation: () => ({
    search: '',
  }),
}));

const mockApiHandler = {
  getCampaignSetupOptions: jest.fn(),
  getCampaignAudienceOptions: jest.fn(),
  getCampaignAudienceSummary: jest.fn(),
  createCampaignAudienceGroup: jest.fn(),
  createCampaignSetup: jest.fn(),
  launchCampaign: jest.fn(),
  getCampaignAssignmentOptions: jest.fn(),
  getParentWhatsappClassesBySchoolId: jest.fn(),
  getParentWhatsappParentPhonesByClassId: jest.fn(),
};
const mockAuthHandler = {
  getCurrentUser: jest.fn(),
};

let mockAssignmentComplete = false;

jest.mock('../../services/ServiceConfig', () => ({
  ServiceConfig: {
    getI: () => ({
      apiHandler: mockApiHandler,
      authHandler: mockAuthHandler,
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
        onAssignmentsChange(
          mockAssignmentComplete
            ? [
                {
                  batchId: 'campaign-1',
                  gradeId: 'grade-1',
                  schoolIds: ['school-1'],
                  courseId: 'course-1',
                  chapterId: 'chapter-1',
                  lessonId: 'lesson-1',
                  lessonName: 'Lesson 1',
                  subjectName: 'Math',
                  startsAt: '2099-05-01',
                  endsAt: null,
                  type: 'homework',
                  source: 'campaign',
                  setNumber: 1,
                },
              ]
            : [],
        );
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
  mockApiHandler.launchCampaign.mockResolvedValue(undefined);
  mockAuthHandler.getCurrentUser.mockResolvedValue({ id: 'user-1' });
  mockApiHandler.getCampaignAssignmentOptions.mockResolvedValue({
    grades: [
      {
        gradeId: 'grade-1',
        subjects: [],
      },
    ],
  });
  mockApiHandler.getParentWhatsappClassesBySchoolId.mockResolvedValue([]);
  mockApiHandler.getParentWhatsappParentPhonesByClassId.mockResolvedValue([]);
};

const openSelectAndChoose = async (triggerText: string, optionText: string) => {
  fireEvent.mouseDown(screen.getByText(triggerText));
  fireEvent.click(await screen.findByRole('option', { name: optionText }));
};

const getDateValueDaysFromToday = (daysFromToday: number) => {
  const date = new Date();
  date.setDate(date.getDate() + daysFromToday);
  return getTodayDateValue(date);
};

beforeEach(() => {
  jest.clearAllMocks();
  mockAssignmentComplete = false;
  setupApiMocks();
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  });
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
    target: { value: getDateValueDaysFromToday(1) },
  });
  fireEvent.change(screen.getByLabelText('End Date'), {
    target: { value: getDateValueDaysFromToday(30) },
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

  it('blocks campaign setup when selected target audience has no students', async () => {
    mockApiHandler.getCampaignAudienceSummary.mockResolvedValue({
      totalStudents: 0,
      grades: [{ gradeId: 'grade-1', gradeName: 'Grade 1', studentCount: 0 }],
    });

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
      target: { value: getDateValueDaysFromToday(1) },
    });
    fireEvent.change(screen.getByLabelText('End Date'), {
      target: { value: getDateValueDaysFromToday(30) },
    });
    await openSelectAndChoose('Select Program', 'Early Learning');
    fireEvent.change(screen.getByPlaceholderText('Enter group name'), {
      target: { value: 'Group A' },
    });

    expect(
      await screen.findByText(
        'Unable to proceed. The selected Target Audience has 0 students.',
      ),
    ).toBeInTheDocument();
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

  it('keeps setup next local-only and advances to assignments', async () => {
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

    expect(
      await screen.findByText('Assignment Configuration'),
    ).toBeInTheDocument();
    expect(mockApiHandler.createCampaignSetup).not.toHaveBeenCalled();
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
    fireEvent.keyDown(screen.getByRole('listbox'), {
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

  it('builds rewards payload locally and advances to campaign communication timeline', async () => {
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
      screen.getByRole('heading', { name: 'Campaign Communication Timeline' }),
    ).toBeInTheDocument();
  });

  it('requires at least one configured communication day before proceeding to summary', async () => {
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
      target: { value: 'Gold Reward' },
    });
    fireEvent.change(screen.getByLabelText('2nd Reward'), {
      target: { value: 'Silver Reward' },
    });
    fireEvent.change(screen.getByLabelText('3rd Reward'), {
      target: { value: 'Bronze Reward' },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Next' }));

    expect(
      screen.getByRole('heading', { name: 'Campaign Communication Timeline' }),
    ).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole('button', { name: 'Continue to Summary' }),
    );

    expect(
      await screen.findAllByText(
        'Configure at least one day to continue to the Summary.',
      ),
    ).toHaveLength(1);

    fireEvent.mouseDown(screen.getByLabelText('Message Time'));
    fireEvent.click(await screen.findByRole('option', { name: '09:00 AM' }));
    fireEvent.mouseDown(screen.getByLabelText('Poll Time'));
    fireEvent.click(await screen.findByRole('option', { name: '05:00 PM' }));
    fireEvent.change(screen.getByPlaceholderText('Enter daily message'), {
      target: { value: "Complete today's campaign task." },
    });

    fireEvent.click(
      screen.getByRole('button', { name: 'Continue to Summary' }),
    );

    expect(
      screen.getByRole('heading', { name: 'Campaign Summary' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Campaign Overview')).toBeInTheDocument();
    expect(screen.getByText('Communication')).toBeInTheDocument();
    expect(screen.getByText('Launch Campaign')).toBeInTheDocument();
    expect(screen.queryByText('Save as Draft')).not.toBeInTheDocument();

    fireEvent.click(screen.getByText('Launch Campaign'));

    await waitFor(() =>
      expect(mockApiHandler.createCampaignSetup).toHaveBeenCalledWith(
        expect.objectContaining({
          campaignName: 'ABCD',
          managerId: 'manager-1',
          programId: 'program-1',
          rewards: expect.objectContaining({
            type: 'digital_rewards',
          }),
          startDate: expect.any(String),
          endDate: expect.any(String),
        }),
      ),
    );
    await waitFor(() =>
      expect(mockApiHandler.launchCampaign).toHaveBeenCalledWith(
        expect.objectContaining({
          campaignId: 'campaign-1',
          currentUserId: 'user-1',
          messagingRows: [
            expect.objectContaining({
              messageTime: expect.any(String),
              pollTime: expect.any(String),
            }),
          ],
        }),
      ),
    );
  });

  it('uses lesson criteria for homepage learning pathway rewards', async () => {
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
      target: { value: getDateValueDaysFromToday(1) },
    });
    fireEvent.change(screen.getByLabelText('End Date'), {
      target: { value: getDateValueDaysFromToday(30) },
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
    await screen.findByText('Rewards Configuration');

    expect(screen.getAllByText('Number of Lessons').length).toBeGreaterThan(0);
  });

  it('hides save-group controls when an existing saved group is selected and restores them when cleared', async () => {
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
    expect(screen.getByText('Save this group for reuse')).toBeInTheDocument();

    await openSelectAndChoose('Select a saved group', 'Reusable Group');

    await waitFor(() =>
      expect(
        screen.queryByText('Save this group for reuse'),
      ).not.toBeInTheDocument(),
    );
    expect(
      screen.queryByPlaceholderText('Enter group name'),
    ).not.toBeInTheDocument();

    const savedGroupSelect = screen
      .getAllByRole('combobox')
      .find((element) => element.textContent === 'Reusable Group');
    fireEvent.mouseDown(savedGroupSelect as HTMLElement);
    fireEvent.click(
      await screen.findByRole('option', { name: 'Select a saved group' }),
    );

    expect(
      await screen.findByText('Save this group for reuse'),
    ).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter group name')).toBeInTheDocument();
    expect(await screen.findByText('Select Program')).toBeInTheDocument();
  });

  it('hides audience helper copy after manual selection', async () => {
    render(<CampaignSetupPage />);

    await screen.findByRole('heading', { name: 'New Campaign' });
    await openSelectAndChoose('Select Program', 'Early Learning');

    expect(
      await screen.findByText(
        'all blocks under selected program are included.',
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText('all schools under selected blocks are included.'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('all grades under selected schools are included.'),
    ).toBeInTheDocument();

    const blockField = screen
      .getByText('Block')
      .closest('.campaign-setup-field') as HTMLElement | null;
    const blockSelect = blockField
      ? within(blockField).getByRole('combobox')
      : null;
    fireEvent.mouseDown(blockSelect as HTMLElement);
    fireEvent.click(await screen.findByRole('option', { name: 'Block A' }));
    fireEvent.keyDown(screen.getByRole('listbox'), {
      key: 'Escape',
      code: 'Escape',
    });

    await waitFor(() =>
      expect(
        screen.queryByText('all blocks under selected program are included.'),
      ).not.toBeInTheDocument(),
    );
  });

  it('does not show audience helper copy before a program is selected', async () => {
    render(<CampaignSetupPage />);

    await screen.findByRole('heading', { name: 'New Campaign' });

    expect(
      screen.queryByText('all blocks under selected program are included.'),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText('all schools under selected blocks are included.'),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText('all grades under selected schools are included.'),
    ).not.toBeInTheDocument();
  });

  it('does not show all-included helper copy for partially selected saved groups', async () => {
    mockApiHandler.getCampaignSetupOptions.mockResolvedValueOnce({
      programs: [{ id: 'program-1', name: 'Early Learning' }],
      managers: [{ id: 'manager-1', name: 'Raj Patel' }],
      savedGroups: [
        {
          id: 'audience-1',
          name: 'Partial Group',
          programId: 'program-1',
          isAllSchools: false,
          isAllGrades: false,
          schoolIds: ['school-1'],
          gradeIds: ['grade-1'],
        },
      ],
    });

    render(<CampaignSetupPage />);

    await screen.findByRole('heading', { name: 'New Campaign' });
    await openSelectAndChoose('Select a saved group', 'Partial Group');

    await waitFor(() =>
      expect(mockApiHandler.getCampaignAudienceOptions).toHaveBeenCalledWith(
        'program-1',
      ),
    );

    expect(
      screen.queryByText('all blocks under selected program are included.'),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText('all schools under selected blocks are included.'),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText('all grades under selected schools are included.'),
    ).not.toBeInTheDocument();
  });

  it('preserves manual audience edits after clearing a saved group selection', async () => {
    mockApiHandler.getCampaignSetupOptions.mockResolvedValueOnce({
      programs: [{ id: 'program-1', name: 'Early Learning' }],
      managers: [{ id: 'manager-1', name: 'Raj Patel' }],
      savedGroups: [
        {
          id: 'audience-1',
          name: 'Partial Group',
          programId: 'program-1',
          isAllSchools: false,
          isAllGrades: false,
          schoolIds: ['school-1'],
          gradeIds: ['grade-1'],
        },
      ],
    });
    mockApiHandler.getCampaignAudienceOptions.mockResolvedValueOnce({
      blocks: ['Block A'],
      schools: [
        { id: 'school-1', name: 'School One', block: 'Block A' },
        { id: 'school-2', name: 'School Two', block: 'Block A' },
      ],
      grades: [
        { id: 'grade-1', name: 'Grade 1' },
        { id: 'grade-2', name: 'Grade 2' },
      ],
    });

    render(<CampaignSetupPage />);

    await screen.findByRole('heading', { name: 'New Campaign' });
    await openSelectAndChoose('Select a saved group', 'Partial Group');

    await waitFor(() =>
      expect(mockApiHandler.getCampaignAudienceOptions).toHaveBeenCalledTimes(
        1,
      ),
    );

    const schoolField = screen
      .getByText('School')
      .closest('.campaign-setup-field') as HTMLElement | null;
    const schoolSelect = schoolField
      ? within(schoolField).getByRole('combobox')
      : null;

    fireEvent.mouseDown(schoolSelect as HTMLElement);
    fireEvent.click(await screen.findByRole('option', { name: 'School Two' }));
    fireEvent.keyDown(screen.getByRole('listbox'), {
      key: 'Escape',
      code: 'Escape',
    });

    await waitFor(() =>
      expect(mockApiHandler.getCampaignAudienceOptions).toHaveBeenCalledTimes(
        1,
      ),
    );

    expect(
      screen.queryByText('School One, School Two'),
    ).not.toBeInTheDocument();
  });

  it('uses the header back button to move to the previous step before leaving the page', async () => {
    mockAssignmentComplete = true;
    render(<CampaignSetupPage />);

    await screen.findByRole('heading', { name: 'New Campaign' });
    await completeSetupStep();
    expect(screen.getByText('Assignment Configuration')).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText('Back'));

    expect(await screen.findByText('Objective & Goal')).toBeInTheDocument();
    expect(mockGoBack).not.toHaveBeenCalled();
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
