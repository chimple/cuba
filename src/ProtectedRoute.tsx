import { useEffect, useState } from "react";
import { Redirect, Route } from "react-router-dom";
import { ServiceConfig } from "./services/ServiceConfig";
import { PAGES } from "./common/constants";
import Loading from "./components/Loading";

export default function ProtectedRoute({ children, ...rest }) {
  const [isAuth, setIsAuth] = useState<Boolean | null>(null); // initially undefined
  useEffect(() => {
    checkAuth();
  }, []);
  const checkAuth = async () => {
    try {
      const authHandler = ServiceConfig.getI()?.authHandler;
      const isUserLoggedIn = await authHandler?.isUserLoggedIn();
      setIsAuth(!!isUserLoggedIn);
    } catch (error) {
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
