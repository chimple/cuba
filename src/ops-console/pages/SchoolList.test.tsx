import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PAGES } from '../../common/constants';
import { RoleType } from '../../interface/modelInterfaces';
import { useAppSelector } from '../../redux/hooks';
import { RootState } from '../../redux/store';
import { AuthState } from '../../redux/slices/auth/authSlice';
import SchoolList from './SchoolList';

jest.mock('i18next', () => ({
  t: (key: string) => key,
}));

const mockPush = jest.fn();
const mockReplace = jest.fn();

jest.mock('react-router', () => ({
  ...jest.requireActual('react-router'),
  useHistory: () => ({
    push: mockPush,
    replace: mockReplace,
  }),
  useLocation: () => ({
    search: '',
  }),
}));

jest.mock('../../redux/hooks', () => ({
  useAppSelector: jest.fn(),
}));

const mockApiHandler = {
  getSchoolFilterOptionsForSchoolListing: jest.fn(),
  getFilteredSchoolsForSchoolListing: jest.fn(),
};

jest.mock('../../services/ServiceConfig', () => ({
  ServiceConfig: {
    getI: () => ({
      apiHandler: mockApiHandler,
    }),
  },
}));

jest.mock('../components/DataTableBody', () => {
  return function MockDataTableBody() {
    return <div data-testid="data-table-body">table</div>;
  };
});

jest.mock('../components/DataTablePagination', () => {
  return function MockPagination() {
    return <div data-testid="pagination">pagination</div>;
  };
});

type MockSearchAndFilterProps = {
  onFilterClick?: () => void;
};

jest.mock('../components/SearchAndFilter', () => {
  return function MockSearchAndFilter({
    onFilterClick,
  }: MockSearchAndFilterProps) {
    return (
      <div data-testid="search-filter">
        <button type="button" onClick={onFilterClick}>
          filter
        </button>
      </div>
    );
  };
});

jest.mock('../components/FilterSlider', () => {
  return function MockFilterSlider() {
    return <div data-testid="filter-slider" />;
  };
});

jest.mock('../components/SelectedFilters', () => {
  return function MockSelectedFilters() {
    return <div data-testid="selected-filters" />;
  };
});

jest.mock('../components/FileUpload', () => {
  return function MockFileUpload() {
    return <div data-testid="file-upload">upload page</div>;
  };
});

const mockUseAppSelector = useAppSelector as jest.MockedFunction<
  typeof useAppSelector
>;

const renderPage = (roles: RoleType[] = [RoleType.SUPER_ADMIN]) => {
  const authState = {
    roles,
  } as AuthState;

  mockUseAppSelector.mockImplementation((selector) =>
    selector({
      auth: authState,
    } as RootState),
  );
  render(<SchoolList />);
};

const openActionsMenu = async () => {
  const user = userEvent.setup();
  await user.click(screen.getByRole('button', { name: 'Actions' }));
  return user;
};

beforeEach(() => {
  jest.clearAllMocks();

  mockApiHandler.getSchoolFilterOptionsForSchoolListing.mockResolvedValue({
    programType: [],
    partner: [],
    programManager: [],
    fieldCoordinator: [],
    state: [],
    district: [],
    block: [],
    cluster: [],
  });
  mockApiHandler.getFilteredSchoolsForSchoolListing.mockResolvedValue({
    data: [],
    total: 0,
  });
});

describe('SchoolList actions menu', () => {
  it('shows migrate, upload and add school actions for privileged users', async () => {
    renderPage();

    await waitFor(() =>
      expect(
        mockApiHandler.getFilteredSchoolsForSchoolListing,
      ).toHaveBeenCalled(),
    );

    await openActionsMenu();

    expect(
      screen.getByRole('menuitem', { name: 'Migrate' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('menuitem', { name: 'Upload' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('menuitem', { name: 'Add School' }),
    ).toBeInTheDocument();
  });

  it('navigates to migrate schools from the actions menu', async () => {
    const user = userEvent.setup();
    renderPage();

    await waitFor(() =>
      expect(
        mockApiHandler.getFilteredSchoolsForSchoolListing,
      ).toHaveBeenCalled(),
    );

    await user.click(screen.getByRole('button', { name: 'Actions' }));
    await user.click(screen.getByRole('menuitem', { name: 'Migrate' }));

    expect(mockPush).toHaveBeenCalledWith(
      `${PAGES.SIDEBAR_PAGE}${PAGES.SCHOOL_LIST}${PAGES.MIGRATE_SCHOOLS_PAGE}`,
    );
    await waitFor(() =>
      expect(
        screen.queryByRole('menuitem', { name: 'Migrate' }),
      ).not.toBeInTheDocument(),
    );
  });

  it('navigates to add school and closes the menu after selection', async () => {
    const user = userEvent.setup();
    renderPage();

    await waitFor(() =>
      expect(
        mockApiHandler.getFilteredSchoolsForSchoolListing,
      ).toHaveBeenCalled(),
    );

    await user.click(screen.getByRole('button', { name: 'Actions' }));
    await user.click(screen.getByRole('menuitem', { name: 'Add School' }));

    expect(mockPush).toHaveBeenCalledWith({
      pathname: `${PAGES.SIDEBAR_PAGE}${PAGES.SCHOOL_LIST}${PAGES.ADD_SCHOOL_PAGE}`,
    });
    await waitFor(() =>
      expect(
        screen.queryByRole('menuitem', { name: 'Add School' }),
      ).not.toBeInTheDocument(),
    );
  });

  it('opens the upload flow from the actions menu', async () => {
    const user = userEvent.setup();
    renderPage();

    await waitFor(() =>
      expect(
        mockApiHandler.getFilteredSchoolsForSchoolListing,
      ).toHaveBeenCalled(),
    );

    await user.click(screen.getByRole('button', { name: 'Actions' }));
    await user.click(screen.getByRole('menuitem', { name: 'Upload' }));

    expect(screen.getByTestId('file-upload')).toBeInTheDocument();
    expect(
      screen.queryByRole('menuitem', { name: 'Upload' }),
    ).not.toBeInTheDocument();
  });

  it('closes the actions menu when clicking outside', async () => {
    const user = userEvent.setup();
    renderPage();

    await waitFor(() =>
      expect(
        mockApiHandler.getFilteredSchoolsForSchoolListing,
      ).toHaveBeenCalled(),
    );

    await user.click(screen.getByRole('button', { name: 'Actions' }));
    expect(
      screen.getByRole('menuitem', { name: 'Upload' }),
    ).toBeInTheDocument();

    const backdrop = document.querySelector('.MuiBackdrop-root');
    expect(backdrop).toBeTruthy();

    await user.click(backdrop as HTMLElement);

    await waitFor(() =>
      expect(
        screen.queryByRole('menuitem', { name: 'Upload' }),
      ).not.toBeInTheDocument(),
    );
  });
});
