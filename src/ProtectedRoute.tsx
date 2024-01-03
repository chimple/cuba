import { useEffect, useState } from "react";
import { Redirect, Route } from "react-router-dom";
import { ServiceConfig } from "./services/ServiceConfig";
import { PAGES } from "./common/constants";
import Loading from "./components/Loading";
import { use } from "i18next";

export default function ProtectedRoute({ children, ...rest }) {
  const [isAuth, setIsAuth] = useState<Boolean | null>(null); // initially undefined
  const [isTcAccept, setTcAccept] = useState<Boolean>();
  useEffect(() => {
    checkAuth();
  }, []);
  const checkAuth = async () => {
    try {
      const authHandler = ServiceConfig.getI()?.authHandler;
      const isUserLoggedIn = await authHandler?.isUserLoggedIn();
      const currentUser = await authHandler?.getCurrentUser();
      console.log("currentUser", currentUser, children)
      setIsAuth(!!isUserLoggedIn);
      setTcAccept(currentUser?.tcAccept);
      console.log("tcAccept", !!currentUser?.tcAccept);

    } catch (error) {
      setIsAuth(false);
    }
  };

  if (isAuth == null) return <Loading isLoading />;
  return (
    <Route {...rest}>
      {isAuth === true ? (
        isTcAccept === true ? (
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
