import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Switch, useLocation } from 'react-router-dom';

import ProtectedRoute from './ProtectedRoute';
import { PAGES } from './common/constants';
import { mockAuthHandler } from './tests/__mocks__/serviceConfigMock';

describe('ProtectedRoute', () => {
  const ProtectedContent = () => {
    const location = useLocation();

    return <div>{`Protected Content: ${location.pathname}`}</div>;
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('redirects to login when user is not authenticated', async () => {
    mockAuthHandler.isUserLoggedIn.mockResolvedValue(false);
    mockAuthHandler.getCurrentUser.mockResolvedValue(null);

    render(
      <MemoryRouter initialEntries={['/protected']}>
        <Switch>
          <ProtectedRoute path="/protected">
            <ProtectedContent />
          </ProtectedRoute>
          <Route path={PAGES.LOGIN}>
            <div>Login Page</div>
          </Route>
        </Switch>
      </MemoryRouter>,
    );

    expect(await screen.findByText(/login page/i)).toBeInTheDocument();
  });

  it('renders children when user is authenticated', async () => {
    mockAuthHandler.isUserLoggedIn.mockResolvedValue(true);
    mockAuthHandler.getCurrentUser.mockResolvedValue({
      id: 'parent-1',
      tc_agreed_version: 1,
    });

    render(
      <MemoryRouter initialEntries={['/protected']}>
        <Switch>
          <ProtectedRoute path="/protected">
            <ProtectedContent />
          </ProtectedRoute>
        </Switch>
      </MemoryRouter>,
    );

    expect(
      await screen.findByText(/protected content: \/protected/i),
    ).toBeInTheDocument();
  });
});
