import { useEffect, useState, useRef } from "react";
import { Redirect, Route } from "react-router-dom";
import { ServiceConfig } from "./services/ServiceConfig";
import { PAGES } from "./common/constants";
import Loading from "./components/Loading";
import { useHandleLessonClick } from "./utility/lessonUtils";

export default function ProtectedRoute({ children, ...rest }) {
  const [isAuth, setIsAuth] = useState<Boolean | null>(null); // initially undefined
  const [isTcAccept, setTcAccept] = useState<any>();
  const handleLessonClick = useHandleLessonClick();
  const DEEPLINK_PENDING_KEY = "deeplinkPending";

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    // Check for deeplink pending flag after authentication state changes
    if (isAuth === true && localStorage.getItem(DEEPLINK_PENDING_KEY) === "true") {
      handleLessonClick(null, true, undefined, true);
      localStorage.removeItem(DEEPLINK_PENDING_KEY);
    }
  }, [isAuth]);

  const checkAuth = async () => {
    try {
      const authHandler = ServiceConfig.getI()?.authHandler;
      const isUserLoggedIn = await authHandler?.isUserLoggedIn();
      const currentUser = await authHandler?.getCurrentUser();
      setIsAuth(!!isUserLoggedIn);
      setTcAccept(currentUser?.is_tc_accepted ?? false);
    } catch (error) {
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
          <Redirect to={{ pathname: PAGES.TERMS_AND_CONDITIONS }} />
        )
      ) : (
        <Redirect to={{ pathname: PAGES.LOGIN }} />
      )}
    </Route>
  );
}
