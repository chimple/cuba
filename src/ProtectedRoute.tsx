import { useEffect, useState } from "react";
import { Redirect, Route } from "react-router-dom";
import { ServiceConfig } from "./services/ServiceConfig";

export default function ProtectedRoute({ children, ...rest }) {
  const [isAuth, setIsAuth] = useState<Boolean | null>(null); // initially undefined
  useEffect(() => {
    const authHandler = ServiceConfig.getI().authHandler;
    authHandler.isUserLoggedIn().then((isUserLoggedIn) => {
      setIsAuth(!!isUserLoggedIn);
    });
  }, []);

  if (isAuth == null) return null;

  return (
    <Route {...rest}>
      {isAuth === true ? (
        children
      ) : (
        <Redirect
          to={{
            pathname: "/login",
          }}
        />
      )}
    </Route>
  );
}
