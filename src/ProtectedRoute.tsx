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
    void checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const authHandler = ServiceConfig.getI()?.authHandler;
      const isUserLoggedIn = await authHandler?.isUserLoggedIn();
      const user = await authHandler?.getCurrentUser();
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
      logAuthDebug('ProtectedRoute redirecting to login after auth error.', {
        source: 'ProtectedRoute.checkAuth',
        reason: 'auth_check_exception',
        from_page: window.location.pathname,
        to_page: PAGES.LOGIN,
      });
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
