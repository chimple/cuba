import { useEffect, useState } from "react";
import { Redirect, Route } from "react-router-dom";
import { ServiceConfig } from "./services/ServiceConfig";
import { PAGES } from "./common/constants";
import Loading from "./components/Loading";
import { use } from "i18next";
import { useHandleLessonClick } from "./utility/lessonUtils";

export default function ProtectedRoute({ children, ...rest }) {
  const [isAuth, setIsAuth] = useState<Boolean | null>(null); // initially undefined
  const [isTcAccept, setTcAccept] = useState<any>();
  const handleLessonClick = useHandleLessonClick();

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    // Listen for the "sendLaunch" event triggered by Java
    document.addEventListener("sendLaunch", sendLaunch);

    return () => {
      document.removeEventListener("sendLaunch", sendLaunch);
    };
  }, []);
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

      const sendLaunch = async (event?: Event) => {
        console.log("Calling received from Java:", event);
          handleLessonClick(null, true, undefined, true);
        
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
