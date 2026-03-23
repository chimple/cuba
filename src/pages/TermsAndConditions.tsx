import React, { useEffect } from 'react';
import { ServiceConfig } from '../services/ServiceConfig';
import { useHistory } from 'react-router';
import { PAGES } from '../common/constants';
import { t } from 'i18next';
import '../pages/TermsAndConditions.css';

const TermsAndConditions: React.FC = () => {
  const history = useHistory();

  useEffect(() => {
    checkAuth();
  }, []);
  const checkAuth = async () => {
    try {
      const authHandler = ServiceConfig.getI()?.authHandler;
      const currentUser = await authHandler?.getCurrentUser();
      if (!!currentUser) {
        if (!!currentUser?.is_tc_accepted) {
          history.replace(PAGES.SELECT_MODE);
        }
      } else {
        history.replace(PAGES.LOGIN);
      }
    } catch (error) {}
  };

  const handleAgreeButtonClick = async () => {
    const currentUser = await ServiceConfig.getI().authHandler.getCurrentUser();
    if (currentUser) {
      await ServiceConfig.getI().apiHandler.updateTcAccept(currentUser.id);
      history.replace(PAGES.SELECT_MODE);
    }
  };

  return (
    <div>
      <div className="tc-content">
        <iframe
          src="assets/termsandconditions/TermsandConditionsofChimple.html"
          title="Web Page"
          allowFullScreen={true}
          style={{ height: '80vh', width: '100%', border: 'none' }}
        />
      </div>
      <div className="button-content">
        <div className="tc-agree-button" onClick={handleAgreeButtonClick}>
          <p className="agree-text">{t('Agree')}</p>
        </div>
      </div>
    </div>
  );
};

export default TermsAndConditions;
