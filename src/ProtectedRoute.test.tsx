import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactElement } from 'react';
import { MemoryRouter, Route, Switch, useLocation } from 'react-router-dom';
import {
  __resetGrowthBookMock,
  __setGrowthBookMock,
} from './tests/__mocks__/@growthbook/growthbook-react';

import ProtectedRoute from './ProtectedRoute';
import { LATEST_TC_VERSION, PAGES } from './common/constants';
import TermsAndConditions from './pages/TermsAndConditions';
import {
  mockApiHandler,
  mockAuthHandler,
} from './tests/__mocks__/serviceConfigMock';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (value: string) => value,
  }),
  Trans: ({
    i18nKey,
    components,
  }: {
    i18nKey: string;
    components?: Record<number, ReactElement>;
  }) => {
    const parts = i18nKey.split(/<1>|<\/1>/);

    return (
      <>
        {parts[0]}
        {components?.[1]}
        {parts[2] ?? ''}
      </>
    );
  },
}));

jest.mock('./utility/util', () => ({
  Util: {
    logEvent: jest.fn(),
  },
}));

describe('ProtectedRoute', () => {
  const ProtectedContent = () => {
    const location = useLocation<{ lessonId?: string } | undefined>();

    return (
      <>
        <div>Protected Content</div>
        <div data-testid="route-path">
          {location.pathname}
          {location.search}
        </div>
        <div data-testid="route-state">{location.state?.lessonId ?? ''}</div>
      </>
    );
  };

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
            <ProtectedContent />
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
            <ProtectedContent />
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

  it('restores search params and location state after closing the terms page', async () => {
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
      <MemoryRouter
        initialEntries={[
          {
            pathname: '/protected',
            search: '?lessonid=lesson-1',
            state: { lessonId: 'lesson-1', from: PAGES.HOME },
          },
        ]}
      >
        <Switch>
          <ProtectedRoute path="/protected">
            <ProtectedContent />
          </ProtectedRoute>
          <Route path={PAGES.TERMS_AND_CONDITIONS}>
            <TermsAndConditions />
          </Route>
        </Switch>
      </MemoryRouter>,
    );

    expect(await screen.findByText(/protected content/i)).toBeInTheDocument();
    expect(screen.getByTestId('route-path')).toHaveTextContent(
      '/protected?lessonid=lesson-1',
    );
    expect(screen.getByTestId('route-state')).toHaveTextContent('lesson-1');

    await user.click(
      screen.getByRole('button', { name: /terms & conditions/i }),
    );
    expect(
      await screen.findByTitle(/terms and conditions/i),
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /close/i }));

    expect(await screen.findByText(/protected content/i)).toBeInTheDocument();
    expect(screen.getByTestId('route-path')).toHaveTextContent(
      '/protected?lessonid=lesson-1',
    );
    expect(screen.getByTestId('route-state')).toHaveTextContent('lesson-1');
  });

  it('defers the T&C modal on gameplay routes', async () => {
    __setGrowthBookMock({
      features: { [LATEST_TC_VERSION]: 3 },
    });
    mockAuthHandler.isUserLoggedIn.mockResolvedValue(true);
    mockAuthHandler.getCurrentUser.mockResolvedValue({
      id: 'parent-1',
      is_tc_accepted: true,
      tc_agreed_version: 1,
    });

    render(
      <MemoryRouter initialEntries={[PAGES.LIDO_PLAYER]}>
        <Switch>
          <ProtectedRoute path={PAGES.LIDO_PLAYER}>
            <ProtectedContent />
          </ProtectedRoute>
        </Switch>
      </MemoryRouter>,
    );

    expect(await screen.findByText(/protected content/i)).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /agree as parent/i }),
    ).not.toBeInTheDocument();
  });
});
