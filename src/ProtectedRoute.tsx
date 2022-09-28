import { useEffect, useState } from "react";
import { Redirect, Route } from "react-router-dom";

export default function ProtectedRoute({ children, ...rest }) {
  const [isAuth, setIsAuth] = useState<Boolean | null>(null); // initially undefined
  useEffect(() => {
    const isUserLogedIn = localStorage.getItem("isUserLogedIn");
    setIsAuth(isUserLogedIn != null && isUserLogedIn == "true");
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
