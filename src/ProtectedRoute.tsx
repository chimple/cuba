import { useEffect, useState } from "react";
import { Redirect, Route } from "react-router-dom";
import Auth from "./models/auth";

export default function ProtectedRoute({ children, ...rest }) {
  const [isAuth, setIsAuth] = useState<Boolean | null>(null); // initially undefined
  useEffect(() => {
    const isUserLogedIn = Auth.i.isUserLoggedIn();
    setIsAuth(isUserLogedIn);
    // setIsAuth(await Auth.i.isUserLoggedIn());
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
