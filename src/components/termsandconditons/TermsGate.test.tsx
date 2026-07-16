import { configureStore } from '@reduxjs/toolkit';
import { useFeatureValue } from '@growthbook/growthbook-react';
import { Provider } from 'react-redux';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactElement } from 'react';
import { MemoryRouter, Route, Switch, useLocation } from 'react-router-dom';

import ProtectedRoute from '../../ProtectedRoute';
import {
  EVENTS,
  LATEST_TC_VERSION,
  PAGES,
  TableTypes,
} from '../../common/constants';
import TermsAndConditions from '../../pages/TermsAndConditions';
import authReducer from '../../redux/slices/auth/authSlice';
import growthbookReducer from '../../redux/slices/growthbook/growthbookSlice';
import {
  mockApiHandler,
  mockAuthHandler,
} from '../../tests/__mocks__/serviceConfigMock';
import TermsGate from './TermsGate';

jest.mock('@growthbook/growthbook-react');

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

jest.mock('../../utility/util', () => ({
  Util: {
    logEvent: jest.fn(),
  },
}));

const { Util } = jest.requireMock('../../utility/util') as {
  Util: { logEvent: jest.Mock };
};

const mockGrowthBookFeatures = (features: Record<string, unknown> = {}) => {
  (useFeatureValue as jest.Mock).mockImplementation(
    (key: string, fallback: unknown) =>
      Object.prototype.hasOwnProperty.call(features, key)
        ? features[key]
        : fallback,
  );
};

describe('TermsGate', () => {
  const renderWithStore = (ui: ReactElement, userVersion = 1) => {
    const store = createStore(userVersion);

    return render(<Provider store={store}>{ui}</Provider>);
  };

  const createStore = (userVersion = 1) =>
    configureStore({
      reducer: { auth: authReducer, growthbook: growthbookReducer },
      middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({ serializableCheck: false }),
      preloadedState: {
        auth: {
          authUser: { id: 'parent-1' },
          user: {
            id: 'parent-1',
            is_tc_accepted: true,
            tc_agreed_version: userVersion,
          } as TableTypes<'user'>,
          refreshToken: null,
          isOpsUser: false,
          roles: [],
          loading: false,
          globalLoading: false,
          error: {
            phone: null,
            student: null,
            email: null,
            otp: null,
            general: null,
          },
        },
        growthbook: {
          attributes: {},
          featureValues: {},
        },
      },
    });

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
    jest.clearAllMocks();
    mockGrowthBookFeatures();
    mockAuthHandler.isUserLoggedIn.mockResolvedValue(true);
    mockAuthHandler.getCurrentUser.mockResolvedValue({
      id: 'parent-1',
      is_tc_accepted: true,
      tc_agreed_version: 1,
    });
    localStorage.removeItem('currentMode');
  });

  it('dismisses the modal immediately after agree without waiting for API completion', async () => {
    mockGrowthBookFeatures({ [LATEST_TC_VERSION]: 3 });
    mockApiHandler.updateTcAgreedVersion.mockReturnValue(new Promise(() => {}));

    const user = userEvent.setup();

    renderWithStore(
      <MemoryRouter initialEntries={['/protected']}>
        <TermsGate />
        <Switch>
          <ProtectedRoute path="/protected">
            <ProtectedContent />
          </ProtectedRoute>
        </Switch>
      </MemoryRouter>,
      1,
    );

    expect(await screen.findByText(/protected content/i)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /agree as parent/i }));

    expect(mockApiHandler.updateTcAgreedVersion).toHaveBeenCalledWith(
      'parent-1',
      3,
    );
    expect(
      screen.queryByRole('button', { name: /agree as parent/i }),
    ).not.toBeInTheDocument();
  });

  it('rolls back the optimistic agreement and skips TC_AGREED analytics on persistence failure', async () => {
    mockGrowthBookFeatures({ [LATEST_TC_VERSION]: 3 });
    mockApiHandler.updateTcAgreedVersion.mockRejectedValue(
      new Error('persist failed'),
    );

    const user = userEvent.setup();

    renderWithStore(
      <MemoryRouter initialEntries={['/protected']}>
        <TermsGate />
        <Switch>
          <ProtectedRoute path="/protected">
            <ProtectedContent />
          </ProtectedRoute>
        </Switch>
      </MemoryRouter>,
      1,
    );

    expect(await screen.findByText(/protected content/i)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /agree as parent/i }));

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /agree as parent/i }),
      ).toBeInTheDocument();
    });

    expect(
      Util.logEvent.mock.calls.some(
        ([eventName]: [string]) => eventName === EVENTS.TC_AGREED,
      ),
    ).toBe(false);
  });

  it('renders only one modal even when nested protected routes are mounted', async () => {
    mockGrowthBookFeatures({ [LATEST_TC_VERSION]: 3 });

    renderWithStore(
      <MemoryRouter initialEntries={['/outer/inner']}>
        <TermsGate />
        <Switch>
          <ProtectedRoute path="/outer">
            <Switch>
              <ProtectedRoute path="/outer/inner">
                <ProtectedContent />
              </ProtectedRoute>
            </Switch>
          </ProtectedRoute>
        </Switch>
      </MemoryRouter>,
      1,
    );

    expect(await screen.findByText(/protected content/i)).toBeInTheDocument();
    expect(
      screen.getAllByRole('button', { name: /agree as parent/i }),
    ).toHaveLength(1);
  });

  it('restores search params and route state after closing the terms page', async () => {
    mockGrowthBookFeatures({ [LATEST_TC_VERSION]: 3 });

    const user = userEvent.setup();

    renderWithStore(
      <MemoryRouter
        initialEntries={[
          {
            pathname: '/protected',
            search: '?lessonid=lesson-1',
            state: { lessonId: 'lesson-1', from: PAGES.HOME },
          },
        ]}
      >
        <TermsGate />
        <Switch>
          <ProtectedRoute path="/protected">
            <ProtectedContent />
          </ProtectedRoute>
          <Route path={PAGES.TERMS_AND_CONDITIONS}>
            <TermsAndConditions />
          </Route>
        </Switch>
      </MemoryRouter>,
      1,
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

    await waitFor(() => {
      expect(screen.getByText(/protected content/i)).toBeInTheDocument();
    });
    expect(screen.getByTestId('route-path')).toHaveTextContent(
      '/protected?lessonid=lesson-1',
    );
    expect(screen.getByTestId('route-state')).toHaveTextContent('lesson-1');
  });

  it('does not show the modal on deferred gameplay routes', async () => {
    mockGrowthBookFeatures({ [LATEST_TC_VERSION]: 3 });

    renderWithStore(
      <MemoryRouter initialEntries={[PAGES.LIDO_PLAYER]}>
        <TermsGate />
        <Switch>
          <ProtectedRoute path={PAGES.LIDO_PLAYER}>
            <ProtectedContent />
          </ProtectedRoute>
        </Switch>
      </MemoryRouter>,
      1,
    );

    expect(await screen.findByText(/protected content/i)).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /agree as parent/i }),
    ).not.toBeInTheDocument();
  });

  it('retries auth checks for recoverable resume-time storage errors instead of redirecting to login', async () => {
    jest.useFakeTimers();
    try {
      mockGrowthBookFeatures({ [LATEST_TC_VERSION]: 1 });

      mockAuthHandler.isUserLoggedIn
        .mockRejectedValueOnce(new Error('database is locked'))
        .mockResolvedValue(true);
      mockAuthHandler.getCurrentUser.mockResolvedValue({
        id: 'parent-1',
        is_tc_accepted: true,
        tc_agreed_version: 1,
      });

      renderWithStore(
        <MemoryRouter initialEntries={['/protected']}>
          <TermsGate />
          <Switch>
            <ProtectedRoute path="/protected">
              <ProtectedContent />
            </ProtectedRoute>
            <Route path={PAGES.LOGIN}>
              <div>Login Screen</div>
            </Route>
          </Switch>
        </MemoryRouter>,
        1,
      );

      await act(async () => {
        jest.advanceTimersByTime(500);
      });

      expect(await screen.findByText(/protected content/i)).toBeInTheDocument();
      expect(screen.queryByText(/login screen/i)).not.toBeInTheDocument();
    } finally {
      jest.useRealTimers();
    }
  });
});
