import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import CampaignAssignmentTab from './CampaignAssignmentTab';
import { ServiceConfig } from '../../services/ServiceConfig';

jest.mock('i18next', () => ({
  t: (key: string) => key,
}));

jest.mock('../../utility/logger', () => ({
  __esModule: true,
  default: {
    error: jest.fn(),
  },
}));

jest.mock('../../services/ServiceConfig', () => ({
  ServiceConfig: {
    getI: jest.fn(),
  },
}));

jest.mock('../components/DataTableBody', () => ({
  __esModule: true,
  default: ({
    rows,
  }: {
    rows: Array<{ lessonName?: string; assignmentDate?: string }>;
  }) => (
    <div data-testid="data-table">
      {rows.map((row, index) => (
        <div key={index}>
          <span>{row.assignmentDate}</span>
          <span>{row.lessonName}</span>
        </div>
      ))}
    </div>
  ),
}));

jest.mock('../components/DataTablePagination', () => ({
  __esModule: true,
  default: ({
    page,
    pageCount,
    onPageChange,
  }: {
    page: number;
    pageCount: number;
    onPageChange: (page: number) => void;
  }) => (
    <button
      type="button"
      data-testid="pagination"
      onClick={() => onPageChange(page + 1)}
    >
      page:{page} count:{pageCount}
    </button>
  ),
}));

describe('CampaignAssignmentTab', () => {
  const api = {
    getAllGrades: jest.fn(),
    getCampaignAssignments: jest.fn(),
  };

  const defaultGrades = [
    { id: '1', name: 'Grade 1' },
    { id: '2', name: 'Grade 2' },
  ];

  const defaultSubjects = [
    { id: '11', name: 'Math' },
    { id: '12', name: 'Science' },
  ];

  const defaultAssignments = [
    {
      assignmentDate: '2026-05-25',
      gradeName: 'Grade 1',
      subjectName: 'Math',
      lessonName: 'Lesson Alpha',
    },
  ];

  const defaultUniqueSubjects = defaultSubjects;

  const renderTab = (campaignId?: string) =>
    render(<CampaignAssignmentTab campaignId={campaignId} />);

  const primeApi = ({
    grades = defaultGrades,
    assignments = defaultAssignments,
    uniqueSubjects = defaultUniqueSubjects,
    total = 1,
    gradeError = null,
    assignmentError = null,
  }: {
    grades?: Array<{ id: string; name: string }>;
    assignments?: Array<{
      assignmentDate: string;
      gradeName: string;
      subjectName: string;
      lessonName: string;
    }>;
    uniqueSubjects?: Array<{ id: string; name: string }>;
    total?: number;
    gradeError?: Error | null;
    assignmentError?: Error | null;
  } = {}) => {
    api.getAllGrades.mockImplementation(() =>
      gradeError ? Promise.reject(gradeError) : Promise.resolve(grades),
    );
    api.getCampaignAssignments.mockImplementation(() =>
      assignmentError
        ? Promise.reject(assignmentError)
        : Promise.resolve({ assignments, uniqueSubjects, total }),
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (ServiceConfig.getI as jest.Mock).mockReturnValue({
      apiHandler: api,
    });
  });

  it('loads filters and assignments for the provided campaign id', async () => {
    primeApi();

    renderTab('campaign-1');

    await waitFor(() =>
      expect(api.getCampaignAssignments).toHaveBeenCalledWith('campaign-1', {
        page: 1,
        pageSize: 20,
      }),
    );

    expect(api.getAllGrades).toHaveBeenCalledTimes(1);
    expect(await screen.findByTestId('data-table')).toBeInTheDocument();
    expect(screen.getByText('Lesson Alpha')).toBeInTheDocument();
  });

  it('renders the fetched assignment date text', async () => {
    primeApi();

    renderTab('campaign-1');

    expect(await screen.findByText('2026-05-25')).toBeInTheDocument();
  });

  it('shows empty state when assignments are empty', async () => {
    primeApi({ assignments: [], total: 0 });

    renderTab('campaign-1');

    expect(await screen.findByText('No Assignments Found')).toBeInTheDocument();
  });

  it('does not call APIs when campaign id is missing', async () => {
    renderTab();

    expect(await screen.findByText('No Assignments Found')).toBeInTheDocument();
    expect(api.getAllGrades).not.toHaveBeenCalled();
    expect(api.getCampaignAssignments).not.toHaveBeenCalled();
  });

  it('falls back to the empty state when assignment loading fails', async () => {
    primeApi({ assignmentError: new Error('assignment failed'), total: 0 });

    renderTab('campaign-1');

    expect(await screen.findByText('No Assignments Found')).toBeInTheDocument();
    expect(api.getCampaignAssignments).toHaveBeenCalled();
  });

  it('still loads assignments when filter loading fails', async () => {
    primeApi({ gradeError: new Error('grade failed') });

    renderTab('campaign-1');

    await waitFor(() =>
      expect(api.getCampaignAssignments).toHaveBeenCalledWith('campaign-1', {
        page: 1,
        pageSize: 20,
      }),
    );
  });

  it('refetches when the campaign id changes', async () => {
    primeApi();

    const { rerender } = render(
      <CampaignAssignmentTab campaignId="campaign-1" />,
    );

    await waitFor(() =>
      expect(api.getCampaignAssignments).toHaveBeenCalledWith('campaign-1', {
        page: 1,
        pageSize: 20,
      }),
    );

    rerender(<CampaignAssignmentTab campaignId="campaign-2" />);

    await waitFor(() =>
      expect(api.getCampaignAssignments).toHaveBeenLastCalledWith(
        'campaign-2',
        {
          page: 1,
          pageSize: 20,
        },
      ),
    );
  });

  it('advances to page 2 when pagination is clicked once', async () => {
    primeApi({ total: 41 });

    renderTab('campaign-1');

    await screen.findByTestId('pagination');
    fireEvent.click(screen.getByTestId('pagination'));

    await waitFor(() =>
      expect(api.getCampaignAssignments).toHaveBeenLastCalledWith(
        'campaign-1',
        {
          page: 2,
          pageSize: 20,
        },
      ),
    );
  });

  it('advances to page 3 when pagination is clicked twice', async () => {
    primeApi({ total: 41 });

    renderTab('campaign-1');

    await screen.findByTestId('pagination');
    fireEvent.click(screen.getByTestId('pagination'));
    await waitFor(() =>
      expect(screen.getByTestId('pagination')).toHaveTextContent('page:2'),
    );
    fireEvent.click(screen.getByTestId('pagination'));

    await waitFor(() =>
      expect(api.getCampaignAssignments).toHaveBeenLastCalledWith(
        'campaign-1',
        {
          page: 3,
          pageSize: 20,
        },
      ),
    );
  });

  it('shows the loading spinner while requests are pending', () => {
    api.getAllGrades.mockImplementation(() => new Promise(() => undefined));
    api.getCampaignAssignments.mockImplementation(
      () => new Promise(() => undefined),
    );

    renderTab('campaign-1');

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('renders the default grade filter value', async () => {
    primeApi();

    renderTab('campaign-1');

    expect(await screen.findByText('All grades')).toBeInTheDocument();
  });

  it('renders the default subject filter value', async () => {
    primeApi();

    renderTab('campaign-1');

    expect(await screen.findByText('All subjects')).toBeInTheDocument();
  });

  it('renders both filter comboboxes', async () => {
    primeApi();

    renderTab('campaign-1');

    expect(await screen.findAllByRole('combobox')).toHaveLength(2);
  });

  it('keeps the grade and subject labels visible after load', async () => {
    primeApi();

    renderTab('campaign-1');

    expect(await screen.findByText('Grade')).toBeInTheDocument();
    expect(await screen.findByText('Subject')).toBeInTheDocument();
  });

  it('keeps the filter bar visible alongside the assignments table', async () => {
    primeApi();

    renderTab('campaign-1');

    expect(await screen.findByTestId('data-table')).toBeInTheDocument();
    expect(await screen.findByTestId('pagination')).toBeInTheDocument();
  });

  it.each([
    [0, 'page:1 count:1'],
    [1, 'page:1 count:1'],
    [20, 'page:1 count:1'],
    [21, 'page:1 count:2'],
    [41, 'page:1 count:3'],
  ])('calculates pagination for total %s', async (total, expected) => {
    primeApi({ total, assignments: defaultAssignments });

    renderTab('campaign-1');

    expect(await screen.findByTestId('pagination')).toHaveTextContent(
      expected as string,
    );
  });
});
