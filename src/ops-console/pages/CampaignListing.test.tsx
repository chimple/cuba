import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import CampaignListingPage from './CampaignListingPage';
import { RoleType } from '../../interface/modelInterfaces';
import { Column } from '../components/DataTableBody';
import { CampaignTableRow } from '../../services/api/campaignListingHelpers';
import { RootState } from '../../redux/store';
import { AuthState } from '../../redux/slices/auth/authSlice';

jest.mock('@mui/material', () => {
  const actual = jest.requireActual('@mui/material');
  return {
    ...actual,
    useMediaQuery: jest.fn(() => false),
  };
});

jest.mock('i18next', () => ({
  t: (key: string, options?: { name?: string }) =>
    key.replace('{{name}}', options?.name ?? ''),
}));

const mockPush = jest.fn();
const mockUseAppSelector = jest.fn();
const mockUseCampaignListingPageState = jest.fn();

type SearchAndFilterMockProps = {
  searchTerm: string;
  onSearchChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
};

type PaginationMockProps = {
  page: number;
  pageCount: number;
  onPageChange: (page: number) => void;
};

type DataTableBodyMockProps = {
  columns: Column<CampaignTableRow>[];
  rows: CampaignTableRow[];
  orderBy: string;
  order: string;
  onSort: (key: string) => void;
  onRowClick?: (id: string | number, row: CampaignTableRow) => void;
};

jest.mock('react-router', () => ({
  useHistory: () => ({ push: mockPush }),
}));

jest.mock('../../redux/hooks', () => ({
  useAppSelector: (selector: unknown) => mockUseAppSelector(selector),
}));

jest.mock('../../services/ServiceConfig', () => ({
  ServiceConfig: {
    getI: () => ({
      apiHandler: {
        cancelCampaign: jest.fn(),
      },
    }),
  },
}));

jest.mock('./CampaignListing.fetcher', () => ({
  useCampaignListingPageState: (...args: unknown[]) =>
    mockUseCampaignListingPageState(...args),
}));

jest.mock(
  '../components/SearchAndFilter',
  () => (props: SearchAndFilterMockProps) => (
    <input
      aria-label="campaign-search"
      value={props.searchTerm}
      onChange={(event) => props.onSearchChange(event)}
    />
  ),
);

jest.mock(
  '../components/DataTablePagination',
  () => (props: PaginationMockProps) => (
    <div>
      <span>{`page-${props.page}-of-${props.pageCount}`}</span>
      <button onClick={() => props.onPageChange(props.page + 1)}>
        next-page
      </button>
    </div>
  ),
);

jest.mock('../components/DataTableBody', () => ({
  __esModule: true,
  default: (props: DataTableBodyMockProps) => (
    <div>
      <div data-testid="table-order">{`${props.orderBy}:${props.order}`}</div>
      {props.columns.map((column: Column<CampaignTableRow>) => (
        <button
          key={String(column.key)}
          onClick={() => props.onSort(String(column.key))}
        >
          {`sort-${String(column.key)}`}
        </button>
      ))}
      {props.rows.map((row: CampaignTableRow) => (
        <div
          key={row.id}
          data-testid={`row-${row.id}`}
          onClick={() => props.onRowClick?.(row.id, row)}
        >
          <div>{row.campaignName}</div>
          <div>{row.objective}</div>
          <div>{row.manager}</div>
          <div>{row.programName}</div>
          <div>{row.avgWeeklyActiveUsers}</div>
          <div>{row.avgWeeklyEngagementTime}</div>
          <div>{row.startDate}</div>
          <div>{row.endDate}</div>
          <div>{row.status}</div>
          <div>{row.actions}</div>
        </div>
      ))}
    </div>
  ),
}));

const anchorEl = document.createElement('button');
document.body.appendChild(anchorEl);

const createAuthState = (roles: RoleType[]): AuthState => ({
  authUser: null,
  user: null,
  refreshToken: null,
  isOpsUser: false,
  roles,
  loading: false,
  globalLoading: false,
  error: {
    phone: null,
    student: null,
    email: null,
    otp: null,
    general: null,
  },
});

const baseCampaign = {
  campaignId: 'campaign-1',
  campaign: {
    id: 'campaign-1',
    name: 'Summer Vacation Learning',
    objective: 'homework_campaign',
    start_date: '2026-07-01',
    end_date: '2026-07-30',
    is_deleted: false,
    campaign_status: 'active',
    created_at: null,
    updated_at: null,
    manager_id: 'manager-1',
    program_id: 'program-1',
    rewards: null,
    target_audience_id: null,
    target_type: null,
    target_value: null,
    manager: { name: 'Asha Manager' },
    program: { name: 'Literacy Program' },
  },
  dashboardMetrics: null,
  avgWeeklyActiveUsers: 18,
  avgWeeklyEngagementTimeMinutes: 42,
  status: 'In Progress',
};

const secondCampaign = {
  ...baseCampaign,
  campaignId: 'campaign-2',
  campaign: {
    ...baseCampaign.campaign,
    id: 'campaign-2',
    name: 'Monsoon Prep',
    objective: 'homepage_learning_pathway_campaign',
    start_date: '2026-08-01',
    end_date: '2026-08-21',
  },
  avgWeeklyActiveUsers: null,
  avgWeeklyEngagementTimeMinutes: null,
  status: 'Cancelled',
};

const createBaseHookState = (overrides = {}) => ({
  campaigns: [baseCampaign, secondCampaign],
  total: 16,
  isLoading: false,
  page: 1,
  pageCount: 2,
  sortBy: 'startDate',
  sortOrder: 'desc',
  searchTerm: '',
  menuAnchorEl: null,
  cancelDialogCampaignId: null,
  cancelReason: '',
  cancelReasonTouched: false,
  isCancellingCampaign: false,
  selectedCampaign: baseCampaign,
  setPage: jest.fn(),
  setCancelReason: jest.fn(),
  setCancelReasonTouched: jest.fn(),
  handleSort: jest.fn(),
  handleSearchChange: jest.fn(),
  handleOpenMenu: jest.fn(),
  handleCloseMenu: jest.fn(),
  handleOpenCancelDialog: jest.fn(),
  handleCloseCancelDialog: jest.fn(),
  handleConfirmCancel: jest.fn(),
  ...overrides,
});

const renderPage = ({
  roles = [RoleType.SUPER_ADMIN],
  hookState = createBaseHookState(),
} = {}) => {
  mockUseAppSelector.mockImplementation(
    (selector: (state: Pick<RootState, 'auth'>) => string[]) =>
      selector({
        auth: createAuthState(roles),
      }),
  );
  mockUseCampaignListingPageState.mockReturnValue(hookState);
  return {
    hookState,
    ...render(<CampaignListingPage />),
  };
};

describe('CampaignListingPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders campaign rows and summary values', () => {
    renderPage();

    expect(screen.getByText('Campaigns')).toBeInTheDocument();
    expect(screen.getByText('Summer Vacation Learning')).toBeInTheDocument();
    expect(screen.getByText('Homework Campaign')).toBeInTheDocument();
    expect(screen.getAllByText('Asha Manager').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Literacy Program').length).toBeGreaterThan(0);
    expect(screen.getByText('18')).toBeInTheDocument();
    expect(screen.getByText('42m')).toBeInTheDocument();
    expect(screen.getByText('Cancelled')).toBeInTheDocument();
  });

  it('shows the new campaign button for write-access roles', () => {
    renderPage({ roles: [RoleType.PROGRAM_MANAGER] });
    expect(
      screen.getByRole('button', { name: 'New Campaign' }),
    ).toBeInTheDocument();
  });

  it('hides the new campaign button for field coordinators', () => {
    renderPage({ roles: [RoleType.FIELD_COORDINATOR] });
    expect(
      screen.queryByRole('button', { name: 'New Campaign' }),
    ).not.toBeInTheDocument();
  });

  it('navigates to the campaign setup page when new campaign is clicked', () => {
    renderPage({ roles: [RoleType.SUPER_ADMIN] });

    fireEvent.click(screen.getByRole('button', { name: 'New Campaign' }));

    expect(mockPush).toHaveBeenCalled();
    expect(String(mockPush.mock.calls[0][0])).toContain('/campaigns/new');
  });

  it('navigates to the campaign overview page when a campaign row is clicked', () => {
    renderPage();

    fireEvent.click(screen.getByTestId('row-campaign-1'));

    expect(mockPush).toHaveBeenCalledWith(
      expect.objectContaining({
        pathname: '/admin-home-page/campaigns/campaign-1',
        state: expect.objectContaining({
          campaignOverviewData: expect.objectContaining({
            data: expect.objectContaining({
              campaignId: 'campaign-1',
              status: 'In Progress',
            }),
          }),
        }),
      }),
    );
  });

  it('passes the search input changes to the listing state hook', () => {
    const hookState = createBaseHookState({
      handleSearchChange: jest.fn(),
      searchTerm: 'abc',
    });
    renderPage({ hookState });

    fireEvent.change(screen.getByLabelText('campaign-search'), {
      target: { value: 'growth' },
    });

    expect(hookState.handleSearchChange).toHaveBeenCalled();
  });

  it('shows the empty state when no campaigns are available', () => {
    renderPage({
      hookState: createBaseHookState({
        campaigns: [],
        total: 0,
      }),
    });

    expect(screen.getByText('No campaigns found')).toBeInTheDocument();
    expect(
      screen.getByText('Try a different search term or create a new campaign.'),
    ).toBeInTheDocument();
  });

  it('renders pagination using hook page data', () => {
    renderPage({
      hookState: createBaseHookState({
        page: 2,
        pageCount: 5,
      }),
    });

    expect(screen.getByText('page-2-of-5')).toBeInTheDocument();
  });

  it('changes page through the pagination component callback', () => {
    const hookState = createBaseHookState({ setPage: jest.fn() });
    renderPage({ hookState });

    fireEvent.click(screen.getByRole('button', { name: 'next-page' }));

    expect(hookState.setPage).toHaveBeenCalledWith(2);
  });

  it('passes sortable header clicks to the page state hook', () => {
    const hookState = createBaseHookState({ handleSort: jest.fn() });
    renderPage({ hookState });

    fireEvent.click(screen.getByRole('button', { name: 'sort-manager' }));

    expect(hookState.handleSort).toHaveBeenCalledWith('manager', true);
  });

  it('uses the current sort info from hook state', () => {
    renderPage({
      hookState: createBaseHookState({
        sortBy: 'manager',
        sortOrder: 'asc',
      }),
    });

    expect(screen.getByTestId('table-order')).toHaveTextContent('manager:asc');
  });

  it('shows row action buttons only when the user can manage campaigns', () => {
    renderPage({ roles: [RoleType.SUPER_ADMIN] });

    expect(
      screen.getByLabelText('More actions for Summer Vacation Learning'),
    ).toBeInTheDocument();
    expect(
      screen.queryByLabelText('More actions for Monsoon Prep'),
    ).not.toBeInTheDocument();
  });

  it('does not show row action buttons for field coordinators', () => {
    renderPage({ roles: [RoleType.FIELD_COORDINATOR] });

    expect(
      screen.queryByLabelText('More actions for Summer Vacation Learning'),
    ).not.toBeInTheDocument();
  });

  it('passes row action clicks to the hook', () => {
    const hookState = createBaseHookState({ handleOpenMenu: jest.fn() });
    renderPage({ hookState });

    fireEvent.click(
      screen.getByLabelText('More actions for Summer Vacation Learning'),
    );

    expect(hookState.handleOpenMenu).toHaveBeenCalled();
  });

  it('shows the cancel campaign menu item when the menu is open', () => {
    const hookState = createBaseHookState({
      menuAnchorEl: anchorEl,
    });
    renderPage({ hookState });

    expect(screen.getByText('Cancel Campaign')).toBeInTheDocument();
  });

  it('closes the menu through the supplied hook handler', () => {
    const hookState = createBaseHookState({
      menuAnchorEl: anchorEl,
      handleCloseMenu: jest.fn(),
    });
    renderPage({ hookState });

    fireEvent.keyDown(screen.getByText('Cancel Campaign'), { key: 'Escape' });

    expect(hookState.handleCloseMenu).toHaveBeenCalledTimes(1);
  });

  it('opens the cancel dialog flow from the menu item', () => {
    const hookState = createBaseHookState({
      menuAnchorEl: anchorEl,
      handleOpenCancelDialog: jest.fn(),
    });
    renderPage({ hookState });

    fireEvent.click(screen.getByText('Cancel Campaign'));

    expect(hookState.handleOpenCancelDialog).toHaveBeenCalledTimes(1);
  });

  it('renders the cancel dialog title and subtitle from selected campaign data', () => {
    renderPage({
      hookState: createBaseHookState({
        cancelDialogCampaignId: 'campaign-1',
        selectedCampaign: baseCampaign,
      }),
    });

    expect(
      screen.getByText('Cancel (Summer Vacation Learning) Campaign'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Please provide a reason for cancelling this campaign'),
    ).toBeInTheDocument();
  });

  it('binds the cancel reason text field to hook state', () => {
    const hookState = createBaseHookState({
      cancelDialogCampaignId: 'campaign-1',
      selectedCampaign: baseCampaign,
      setCancelReason: jest.fn(),
    });
    renderPage({ hookState });

    fireEvent.change(
      screen.getByPlaceholderText(
        'Write the reason for cancelling this campaign...',
      ),
      {
        target: { value: 'Need to stop the rollout' },
      },
    );

    expect(hookState.setCancelReason).toHaveBeenCalledWith(
      'Need to stop the rollout',
    );
  });

  it('marks the cancel reason as touched when the field blurs', () => {
    const hookState = createBaseHookState({
      cancelDialogCampaignId: 'campaign-1',
      selectedCampaign: baseCampaign,
      setCancelReasonTouched: jest.fn(),
    });
    renderPage({ hookState });

    fireEvent.blur(
      screen.getByPlaceholderText(
        'Write the reason for cancelling this campaign...',
      ),
    );

    expect(hookState.setCancelReasonTouched).toHaveBeenCalledWith(true);
  });

  it('disables the confirm cancel button when the reason is empty', () => {
    renderPage({
      hookState: createBaseHookState({
        cancelDialogCampaignId: 'campaign-1',
        selectedCampaign: baseCampaign,
        cancelReason: '',
      }),
    });

    const confirmButton = screen.getAllByRole('button', {
      name: 'Cancel Campaign',
    })[0];

    expect(confirmButton).toBeDisabled();
  });

  it('enables the confirm cancel button when the reason is provided', () => {
    renderPage({
      hookState: createBaseHookState({
        cancelDialogCampaignId: 'campaign-1',
        selectedCampaign: baseCampaign,
        cancelReason: 'Program changed',
      }),
    });

    const confirmButton = screen.getAllByRole('button', {
      name: 'Cancel Campaign',
    })[0];

    expect(confirmButton).not.toBeDisabled();
  });

  it('shows cancelling copy while a cancellation is in progress', () => {
    renderPage({
      hookState: createBaseHookState({
        cancelDialogCampaignId: 'campaign-1',
        selectedCampaign: baseCampaign,
        cancelReason: 'Program changed',
        isCancellingCampaign: true,
      }),
    });

    expect(
      screen.getByRole('button', { name: 'Cancelling...' }),
    ).toBeDisabled();
  });

  it('submits cancellation through the hook confirm handler', () => {
    const hookState = createBaseHookState({
      cancelDialogCampaignId: 'campaign-1',
      selectedCampaign: baseCampaign,
      cancelReason: 'Program changed',
      handleConfirmCancel: jest.fn(),
    });
    renderPage({ hookState });

    fireEvent.click(screen.getByRole('button', { name: 'Cancel Campaign' }));

    expect(hookState.handleConfirmCancel).toHaveBeenCalledTimes(1);
  });

  it('closes the dialog through the hook close handler', () => {
    const hookState = createBaseHookState({
      cancelDialogCampaignId: 'campaign-1',
      selectedCampaign: baseCampaign,
      handleCloseCancelDialog: jest.fn(),
    });
    renderPage({ hookState });

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(hookState.handleCloseCancelDialog).toHaveBeenCalledTimes(1);
  });

  it('shows validation helper copy when the reason was touched but left blank', () => {
    renderPage({
      hookState: createBaseHookState({
        cancelDialogCampaignId: 'campaign-1',
        selectedCampaign: baseCampaign,
        cancelReason: '',
        cancelReasonTouched: true,
      }),
    });

    expect(
      screen.getByText('Reason for cancellation is required.'),
    ).toBeInTheDocument();
  });

  it('renders the dialog even when the selected campaign has no name fallback', () => {
    renderPage({
      hookState: createBaseHookState({
        cancelDialogCampaignId: 'missing-id',
        selectedCampaign: null,
      }),
    });

    expect(screen.getByText('Cancel () Campaign')).toBeInTheDocument();
  });

  it('keeps the search box value in sync with hook state', () => {
    renderPage({
      hookState: createBaseHookState({
        searchTerm: 'summer',
      }),
    });

    expect(screen.getByLabelText('campaign-search')).toHaveValue('summer');
  });

  it('renders average metric fallback values coming from prebuilt rows', () => {
    renderPage();

    expect(screen.getAllByText('-').length).toBeGreaterThan(0);
  });

  it('supports super admin role access exactly as required', () => {
    renderPage({ roles: [RoleType.SUPER_ADMIN] });
    expect(
      screen.getByRole('button', { name: 'New Campaign' }),
    ).toBeInTheDocument();
  });

  it('supports operational director role access exactly as required', () => {
    renderPage({ roles: [RoleType.OPERATIONAL_DIRECTOR] });
    expect(
      screen.getByRole('button', { name: 'New Campaign' }),
    ).toBeInTheDocument();
  });

  it('supports program manager role access exactly as required', () => {
    renderPage({ roles: [RoleType.PROGRAM_MANAGER] });
    expect(
      screen.getByRole('button', { name: 'New Campaign' }),
    ).toBeInTheDocument();
  });

  it('supports field coordinator access exactly as required', () => {
    renderPage({ roles: [RoleType.FIELD_COORDINATOR] });
    expect(
      screen.queryByRole('button', { name: 'New Campaign' }),
    ).not.toBeInTheDocument();
    expect(screen.queryByText('Cancel Campaign')).not.toBeInTheDocument();
  });
});
