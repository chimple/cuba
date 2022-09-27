import { useEffect, useState } from "react";
import { Redirect } from "react-router-dom";
import Home from "./pages/Home";

export default function ProtectedRoute() {
  const [isAuth, setIsAuth] = useState<Boolean | null>(null); // initially undefined
  useEffect(() => {
    const isUserLogedIn = localStorage.getItem("isUserLogedIn");
    setIsAuth(isUserLogedIn != null && isUserLogedIn == "true");
  }, []);

  if (isAuth == null) return null;

  return isAuth ? <Home /> : <Redirect to={"/login"} />;
}
