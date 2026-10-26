import { IonPage } from '@ionic/react';
import { useEffect, useState } from 'react';
import './AppLangSelection.css';
import { useHistory } from 'react-router-dom';
import { LANGUAGE, LANG, PAGES } from '../common/constants';
import Loading from '../components/Loading';
import i18n from '../i18n';
import NextButton from '../components/common/NextButton';
import DropDown from '../components/DropDown';
import { logAuthDebug } from '../utility/authDebug';

const PORTUGUESE_LANGUAGE_OPTIONS = [
  { id: LANG.PORTUGUESE, displayName: 'Português' },
];

const AppLangSelection: React.FC = () => {
  const history = useHistory();
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    getLangList();
  }, []);

  async function getLangList() {
    setIsLoading(true);
    // This app build is Portuguese-only. Override any old saved app language.
    localStorage.setItem(LANGUAGE, LANG.PORTUGUESE);
    await i18n.changeLanguage(LANG.PORTUGUESE);
    setIsLoading(false);
  }

  const handleNextClick = async () => {
    localStorage.setItem(LANGUAGE, LANG.PORTUGUESE);
    await i18n.changeLanguage(LANG.PORTUGUESE);
    logAuthDebug('Navigating to login from language selection screen.', {
      source: 'AppLangSelection.handleNextClick',
      reason: 'language_selected_continue_to_login',
      from_page: window.location.pathname,
      to_page: PAGES.LOGIN,
    });
    history.replace(PAGES.LOGIN);
  };

  return (
    <IonPage id="app-lang">
      {!isLoading ? (
        <div className="app-container">
          <div className="top-right">
            <div id="App-lang-nextButton">
              <NextButton disabled={false} onClicked={handleNextClick} />
            </div>
          </div>
          <div className="middle-content">
            <img
              id="app-lang-chimple-logo"
              alt="Chimple Brand Logo"
              src="assets/icons/ChimpleBrandLogo.svg"
            />
            <div id="app-lang-element">
              <p id="app-lang-text">{i18n.t('Choose your language')}</p>
              <DropDown
                placeholder=""
                optionList={PORTUGUESE_LANGUAGE_OPTIONS}
                currentValue={LANG.PORTUGUESE}
                width="26vw"
                onValueChange={async () => {
                  localStorage.setItem(LANGUAGE, LANG.PORTUGUESE);
                  await i18n.changeLanguage(LANG.PORTUGUESE);
                }}
              />
            </div>
          </div>
        </div>
      ) : null}
      <Loading isLoading={isLoading} />
    </IonPage>
  );
};

export default AppLangSelection;
