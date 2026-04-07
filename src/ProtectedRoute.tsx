import { useEffect, useState } from 'react';
import { Redirect, Route } from 'react-router-dom';
import { ServiceConfig } from './services/ServiceConfig';
import { PAGES } from './common/constants';
import Loading from './components/Loading';
import { RouteProps } from 'react-router-dom';
import { ReactNode } from 'react';
import { logAuthDebug } from './utility/authDebug';

type ProtectedRouteProps = RouteProps & {
  children: ReactNode;
};

export default function ProtectedRoute({
  children,
  ...rest
}: ProtectedRouteProps) {
  const [isAuth, setIsAuth] = useState<boolean | null>(null); // initially undefined
  const [isTcAccept, setTcAccept] = useState<boolean | number>(false);
  useEffect(() => {
    checkAuth();
  }, []);
  const checkAuth = async () => {
    try {
      const authHandler = ServiceConfig.getI()?.authHandler;
      const isUserLoggedIn = await authHandler?.isUserLoggedIn();
      const currentUser = await authHandler?.getCurrentUser();
      setIsAuth(!!isUserLoggedIn);
      setTcAccept(currentUser?.is_tc_accepted ?? false);
      if (!isUserLoggedIn) {
        logAuthDebug('ProtectedRoute redirecting to login.', {
          source: 'ProtectedRoute.checkAuth',
          reason: 'is_user_logged_in_false',
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
        isTcAccept === true || isTcAccept === 1 ? (
          children
        ) : (
          <Redirect
            to={{
              pathname: PAGES.TERMS_AND_CONDITIONS,
            }}
          />
        )
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
