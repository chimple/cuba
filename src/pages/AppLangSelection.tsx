import { IonPage } from "@ionic/react";
import { useEffect } from "react";
import { useHistory } from "react-router-dom";
import { LANGUAGE, LANG, PAGES } from "../common/constants";
import i18n from "../i18n";
import Loading from "../components/Loading";

const AppLangSelection: React.FC = () => {
  const history = useHistory();

  useEffect(() => {
    async function setLangAndRedirect() {
      // Set the language to English automatically
      localStorage.setItem(LANGUAGE, LANG.ENGLISH);
      await i18n.changeLanguage(LANG.ENGLISH);
      // Navigate directly to the next page (e.g., the login page)
      history.replace(PAGES.LOGIN);
    }
    setLangAndRedirect();
  }, [history]);

  return (
    <IonPage>
      {/* Optionally, display a loading indicator while redirecting */}
      <Loading isLoading={true} />
    </IonPage>
  );
};

export default AppLangSelection;
