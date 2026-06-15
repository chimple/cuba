import { ReactNode, useEffect, useState } from 'react';
import { Redirect, Route, RouteProps } from 'react-router-dom';

import { PAGES } from './common/constants';
import Loading from './components/Loading';
import { ServiceConfig } from './services/ServiceConfig';
import { logAuthDebug } from './utility/authDebug';
import { isRecoverableStorageError } from './utility/recoverableStorageError';

type ProtectedRouteProps = RouteProps & {
  children: ReactNode;
};

export default function ProtectedRoute({
  children,
  ...rest
}: ProtectedRouteProps) {
  const [isAuth, setIsAuth] = useState<boolean | null>(null); // initially undefined

  useEffect(() => {
    const lifecycle: { cancelled: boolean; timeoutId?: number } = {
      cancelled: false,
    };
    void checkAuth(lifecycle);
    return () => {
      lifecycle.cancelled = true;
      if (lifecycle.timeoutId !== undefined) {
        window.clearTimeout(lifecycle.timeoutId);
      }
    };
  }, []);

  const checkAuth = async (
    lifecycle: { cancelled: boolean; timeoutId?: number },
    attempt = 1,
  ) => {
    if (lifecycle.cancelled) return;
    try {
      const authHandler = ServiceConfig.getI()?.authHandler;
      const isUserLoggedIn = await authHandler?.isUserLoggedIn();
      if (lifecycle.cancelled) return;
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
        isRecoverableStorageError(error)
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
        lifecycle.timeoutId = window.setTimeout(() => {
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
