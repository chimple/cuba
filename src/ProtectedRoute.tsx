import { ReactNode, useEffect, useState } from 'react';
import { Redirect, Route, RouteProps } from 'react-router-dom';

import { PAGES } from './common/constants';
import Loading from './components/Loading';
import { ServiceConfig } from './services/ServiceConfig';
import { logAuthDebug } from './utility/authDebug';

type ProtectedRouteProps = RouteProps & {
  children: ReactNode;
};

export default function ProtectedRoute({
  children,
  ...rest
}: ProtectedRouteProps) {
  const [isAuth, setIsAuth] = useState<boolean | null>(null); // initially undefined

  useEffect(() => {
    const lifecycle = { cancelled: false };
    void checkAuth(lifecycle);
    return () => {
      lifecycle.cancelled = true;
    };
  }, []);

  const isRecoverableAuthError = (error: unknown) => {
    const message = String(
      (error as { message?: string })?.message ?? error ?? '',
    ).toLowerCase();

    return (
      message.includes('database is locked') ||
      message.includes('not opened') ||
      message.includes('connection pool') ||
      message.includes('pragma journal_mode') ||
      message.includes('open: error in creating the database')
    );
  };

  const checkAuth = async (lifecycle: { cancelled: boolean }, attempt = 1) => {
    try {
      const authHandler = ServiceConfig.getI()?.authHandler;
      const isUserLoggedIn = await authHandler?.isUserLoggedIn();
      const user = await authHandler?.getCurrentUser();
      if (lifecycle.cancelled) return;
      setIsAuth(!!isUserLoggedIn && !!user);
      if (!isUserLoggedIn || !user) {
        logAuthDebug('ProtectedRoute redirecting to login.', {
          source: 'ProtectedRoute.checkAuth',
          reason: !isUserLoggedIn
            ? 'is_user_logged_in_false'
            : 'current_user_missing',
          from_page: window.location.pathname,
          to_page: PAGES.LOGIN,
        });
      }
    } catch (error) {
      if (
        !lifecycle.cancelled &&
        attempt < 4 &&
        isRecoverableAuthError(error)
      ) {
        // If SQLite is still reopening after screen-on, retry briefly instead
        // of treating that transient storage error as a real logout.
        logAuthDebug(
          'ProtectedRoute retrying after recoverable auth dependency error.',
          {
            source: 'ProtectedRoute.checkAuth',
            reason: 'recoverable_auth_dependency_error',
            attempt,
            from_page: window.location.pathname,
          },
        );
        window.setTimeout(() => {
          void checkAuth(lifecycle, attempt + 1);
        }, 400 * attempt);
        return;
      }
      logAuthDebug('ProtectedRoute redirecting to login after auth error.', {
        source: 'ProtectedRoute.checkAuth',
        reason: 'auth_check_exception',
        from_page: window.location.pathname,
        to_page: PAGES.LOGIN,
      });
      if (lifecycle.cancelled) return;
      setIsAuth(false);
    }
  };

  if (isAuth == null) return <Loading isLoading />;

  return (
    <Route {...rest}>
      {isAuth === true ? (
        children
      ) : (
        <Redirect
          to={{
            pathname: PAGES.LOGIN,
          }}
        />
      )}
    </Route>
  );
}
