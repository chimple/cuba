import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Switch } from 'react-router-dom';
import {
  __resetGrowthBookMock,
  __setGrowthBookMock,
} from './tests/__mocks__/@growthbook/growthbook-react';

import ProtectedRoute from './ProtectedRoute';
import { LATEST_TC_VERSION, PAGES } from './common/constants';
import {
  mockApiHandler,
  mockAuthHandler,
} from './tests/__mocks__/serviceConfigMock';

jest.mock('./utility/util', () => ({
  Util: {
    logEvent: jest.fn(),
  },
}));

describe('ProtectedRoute', () => {
  beforeEach(() => {
    __resetGrowthBookMock();
    jest.clearAllMocks();
  });

  it('redirects to login when user is not authenticated', async () => {
    mockAuthHandler.isUserLoggedIn.mockResolvedValue(false);
    mockAuthHandler.getCurrentUser.mockResolvedValue(null);

    render(
      <MemoryRouter initialEntries={['/protected']}>
        <Switch>
          <ProtectedRoute path="/protected">
            <div>Protected Content</div>
          </ProtectedRoute>

          <Route path={PAGES.LOGIN}>
            <div>Login Page</div>
          </Route>
        </Switch>
      </MemoryRouter>,
    );

    expect(await screen.findByText(/login page/i)).toBeInTheDocument();
  });

  it('renders children without popup when user is up to date with T&C version', async () => {
    __setGrowthBookMock({
      features: { [LATEST_TC_VERSION]: 2 },
    });
    mockAuthHandler.isUserLoggedIn.mockResolvedValue(true);
    mockAuthHandler.getCurrentUser.mockResolvedValue({
      id: 'parent-1',
      is_tc_accepted: true,
      tc_agreed_version: 2,
    });

    render(
      <MemoryRouter initialEntries={['/protected']}>
        <Switch>
          <ProtectedRoute path="/protected">
            <div>Protected Content</div>
          </ProtectedRoute>
        </Switch>
      </MemoryRouter>,
    );

    expect(await screen.findByText(/protected content/i)).toBeInTheDocument();
    expect(screen.queryByText(/agree as parent/i)).not.toBeInTheDocument();
  });

  it('shows the T&C modal for outdated users and updates the agreed version', async () => {
    __setGrowthBookMock({
      features: { [LATEST_TC_VERSION]: 3 },
    });
    mockAuthHandler.isUserLoggedIn.mockResolvedValue(true);
    mockAuthHandler.getCurrentUser.mockResolvedValue({
      id: 'parent-1',
      is_tc_accepted: true,
      tc_agreed_version: 1,
    });

    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={['/protected']}>
        <Switch>
          <ProtectedRoute path="/protected">
            <div>Protected Content</div>
          </ProtectedRoute>
        </Switch>
      </MemoryRouter>,
    );

    expect(await screen.findByText(/protected content/i)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /agree as parent/i }));

    await waitFor(() => {
      expect(mockApiHandler.updateTcAgreedVersion).toHaveBeenCalledWith(
        'parent-1',
        3,
      );
    });
    await waitFor(() => {
      expect(
        screen.queryByRole('button', { name: /agree as parent/i }),
      ).not.toBeInTheDocument();
    });
  });
});
