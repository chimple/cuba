import { useEffect, useState } from "react";
import { Redirect, Route } from "react-router-dom";
import { ServiceConfig } from "./services/ServiceConfig";
import { PAGES } from "./common/constants";
import Loading from "./components/Loading";
import { use } from "i18next";

export default function ProtectedRoute({ children, ...rest }) {
  const [isAuth, setIsAuth] = useState<Boolean | null>(null); // initially undefined
  const [isTcAccept, setTcAccept] = useState<any>();
  useEffect(() => {
    checkAuth();
  }, []);
  const checkAuth = async () => {
    try {
      console.log("const checkAuth = async () => { ");

      const authHandler = ServiceConfig.getI()?.authHandler;
      const isUserLoggedIn = await authHandler?.isUserLoggedIn();
      const currentUser = await authHandler?.getCurrentUser();
      console.log("const currentUser => { ", !!isUserLoggedIn);
      setIsAuth(!!isUserLoggedIn);
      setTcAccept(currentUser?.is_tc_accepted ?? false);
    } catch (error) {
      console.log("} catch (error) { ", error);
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
