import React, { useEffect, useRef, useState } from 'react';
import { ServiceConfig } from '../services/ServiceConfig'
import { Redirect, Route, useHistory } from 'react-router';
import { PAGES } from '../common/constants';
import { t } from "i18next";
import "../pages/TermsAndConditions.css";
import { REMOTE_CONFIG_KEYS, RemoteConfig } from '../services/RemoteConfig';


const TermsAndConditions: React.FC = () => {
  const history = useHistory();
  // const [iframeSrc, setIframeSrc] = useState('');
  // const setIframeSrcAsync = async () => {
  //   try {
  //     const tcUrl = await RemoteConfig.getString(
  //       REMOTE_CONFIG_KEYS.TERMS_AND_CONDITIONS_URL
  //     );
  //     setIframeSrc(tcUrl);
  //   } catch (error) {
  //     console.error('Error fetching URL:', error);
  //   }
  // };

  useEffect(() => {
    checkAuth();
    // setIframeSrcAsync();
  }, []);
  const checkAuth = async () => {
    try {
      const authHandler = ServiceConfig.getI()?.authHandler;
      const currentUser = await authHandler?.getCurrentUser();
      console.log("currentUser", currentUser)
      if (!!currentUser) {
        if (!!currentUser.tcAccept) {
          history.replace(PAGES.SELECT_MODE)
        }
      }
      else {
        history.replace(PAGES.LOGIN)
      }

    } catch (error) {
      console.log("Error:", error);

    }
  };

  const handleAgreeButtonClick = async () => {

    const currentUser = await ServiceConfig.getI().authHandler.getCurrentUser();
    console.log("current user", currentUser);
    if (currentUser) {
      await ServiceConfig.getI().apiHandler.updateTcAccept(currentUser, true);
      history.replace(PAGES.SELECT_MODE);
    }
  };



  return (
    <div>
      <div className='tc-content'>
        <iframe
          src="assets/termsandconditions/TermsandConditionsofChimple.html"
          title="Web Page"
          allowFullScreen={true}
          style={{ height: "80vh", width: "100%", border: "none" }}
        />
      </div>
      <div className='button-content'>
        <div className='tc-agree-button'
          onClick={handleAgreeButtonClick}
        ><p className='agree-text'>{t('Agree')}</p></div>
      </div>
    </div>

  );
};

export default TermsAndConditions;
