import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import MessagesPage from './MessagesPage';

const mockApiHandler = {
  getCampaignSetupOptions: jest.fn(),
  getCampaignAudienceOptions: jest.fn(),
  getCampaignGradesForSchools: jest.fn(),
  getCampaignAudienceSummary: jest.fn(),
  createCampaignAudienceGroup: jest.fn(),
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
    managers: [],
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
  mockApiHandler.getCampaignAudienceOptions.mockResolvedValue({
    blocks: ['Block A'],
    schools: [{ id: 'school-1', name: 'School One', block: 'Block A' }],
    grades: [{ id: 'grade-1', name: 'Grade 1' }],
  });
  mockApiHandler.getCampaignGradesForSchools.mockResolvedValue([
    { id: 'grade-1', name: 'Grade 1' },
  ]);
  mockApiHandler.getCampaignAudienceSummary.mockResolvedValue({
    totalStudents: 10,
    grades: [{ gradeId: 'grade-1', gradeName: 'Grade 1', studentCount: 10 }],
  });
  mockApiHandler.createCampaignAudienceGroup.mockResolvedValue({
    id: 'audience-2',
    name: 'New Group',
    programId: 'program-1',
    isAllSchools: true,
    isAllGrades: true,
    schoolIds: [],
    gradeIds: [],
  });
};

beforeEach(() => {
  jest.clearAllMocks();
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

const openSelectAndChoose = async (triggerText: string, optionText: string) => {
  fireEvent.mouseDown(screen.getByText(triggerText));
  fireEvent.click(await screen.findByRole('option', { name: optionText }));
};

describe('MessagesPage', () => {
  it('blocks duplicate saved audience group names', async () => {
    render(<MessagesPage />);

    await screen.findByRole('heading', { name: 'New Push Notification' });
    await openSelectAndChoose('Select Program', 'Early Learning');

    fireEvent.click(
      screen.getByRole('checkbox', { name: 'Save this group for reuse' }),
    );
    fireEvent.change(screen.getByPlaceholderText('Enter group name'), {
      target: { value: ' reusable   group ' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    expect(
      await screen.findByText('A saved group with this name already exists.'),
    ).toBeInTheDocument();
    expect(mockApiHandler.createCampaignAudienceGroup).not.toHaveBeenCalled();
  });

  it('saves a new audience group and adds it to the dropdown', async () => {
    render(<MessagesPage />);

    await screen.findByRole('heading', { name: 'New Push Notification' });
    await openSelectAndChoose('Select Program', 'Early Learning');

    fireEvent.click(
      screen.getByRole('checkbox', { name: 'Save this group for reuse' }),
    );
    fireEvent.change(screen.getByPlaceholderText('Enter group name'), {
      target: { value: 'New Group' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() =>
      expect(mockApiHandler.createCampaignAudienceGroup).toHaveBeenCalledWith(
        expect.objectContaining({
          programId: 'program-1',
          name: 'New Group',
          isSaved: true,
        }),
      ),
    );
    expect(
      await screen.findByRole('option', { name: 'New Group' }),
    ).toBeInTheDocument();
  });

  it('keeps the audience selection in memory when navigating back and forth', async () => {
    render(<MessagesPage />);

    await screen.findByRole('heading', { name: 'New Push Notification' });
    await openSelectAndChoose('Select Program', 'Early Learning');

    expect(screen.getByDisplayValue('Early Learning')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Next' }));

    expect(
      await screen.findByRole('heading', { name: 'Compose Notification' }),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Back' }));

    expect(
      await screen.findByRole('heading', { name: 'Target Audience' }),
    ).toBeInTheDocument();
    expect(screen.getByDisplayValue('Early Learning')).toBeInTheDocument();
  });

  it('shows compose and review content in later steps', async () => {
    render(<MessagesPage />);

    await screen.findByRole('heading', { name: 'New Push Notification' });
    await openSelectAndChoose('Select Program', 'Early Learning');

    fireEvent.click(screen.getByRole('button', { name: 'Next' }));

    expect(
      await screen.findByRole('heading', { name: 'Compose Notification' }),
    ).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Notification Title'), {
      target: { value: 'System Update' },
    });
    fireEvent.change(screen.getByLabelText('Message'), {
      target: { value: 'Please review the latest update.' },
    });

    expect(
      screen.getByText('Please review the latest update.'),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Next' }));

    expect(
      await screen.findByRole('heading', { name: 'Review & Send' }),
    ).toBeInTheDocument();
    expect(screen.getByText('System Update')).toBeInTheDocument();
    expect(
      screen.getByText('Please review the latest update.'),
    ).toBeInTheDocument();
  });
});
