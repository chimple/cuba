import { useFeatureValue } from '@growthbook/growthbook-react';
import CloseIcon from '@mui/icons-material/Close';
import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useHistory, useLocation } from 'react-router';

import { PAGES, TC_HTML_URL } from '../common/constants';
import { ServiceConfig } from '../services/ServiceConfig';
import {
  buildTermsUrl,
  getCurrentTermsAppMode,
  getEnglishTermsUrl,
  getTermsLanguageCode,
  resolveTermsBaseUrl,
} from '../utility/termsAndConditions';
import './TermsAndConditions.css';

type TermsPageLocationState = {
  from?: string;
  returnLocation?: {
    pathname: string;
    search?: string;
    hash?: string;
    state?: unknown;
  };
};

const LEGACY_TERMS_URL =
  'assets/termsandconditions/TermsandConditionsofChimple.html';
const CLOSE_ICON_SRC = '/assets/loginAssets/TermsConditionsClose.svg';

const TermsAndConditions: React.FC = () => {
  const history = useHistory();
  const location = useLocation<TermsPageLocationState>();
  const { t } = useTranslation();
  const tcHtmlUrlFeature = useFeatureValue<string>(TC_HTML_URL, '');
  const [iframeSrc, setIframeSrc] = useState(LEGACY_TERMS_URL);
  const appMode = getCurrentTermsAppMode();

  const redirectTarget = location.state?.from || PAGES.SELECT_MODE;
  const returnLocation = location.state?.returnLocation;
  const baseTermsUrl = useMemo(
    () => resolveTermsBaseUrl(tcHtmlUrlFeature),
    [tcHtmlUrlFeature],
  );
  const localizedTermsUrl = useMemo(() => {
    if (!baseTermsUrl) {
      return LEGACY_TERMS_URL;
    }

    return buildTermsUrl(baseTermsUrl, getTermsLanguageCode());
  }, [baseTermsUrl]);

  useEffect(() => {
    void loadCurrentUser();
  });

  useEffect(() => {
    setIframeSrc(localizedTermsUrl || LEGACY_TERMS_URL);
  }, [localizedTermsUrl]);

  const loadCurrentUser = async () => {
    const authHandler = ServiceConfig.getI()?.authHandler;
    const user = await authHandler?.getCurrentUser();
    if (!user) {
      history.replace(PAGES.LOGIN);
      return;
    }
  };

  const handleIframeError = () => {
    if (!baseTermsUrl) {
      setIframeSrc(LEGACY_TERMS_URL);
      return;
    }

    const englishTermsUrl = getEnglishTermsUrl(baseTermsUrl);
    if (iframeSrc !== englishTermsUrl) {
      setIframeSrc(englishTermsUrl);
    }
  };

  const handleClose = () => {
    if (returnLocation?.pathname) {
      history.replace(
        `${returnLocation.pathname}${returnLocation.search ?? ''}${returnLocation.hash ?? ''}`,
        returnLocation.state,
      );
      return;
    }

    history.replace(redirectTarget);
  };

  return (
    <div className="terms-and-conditions-page">
      <div className="terms-and-conditions-header">
        <button
          type="button"
          className={`terms-and-conditions-close-button ${
            appMode === 'ops' ? 'terms-and-conditions-close-button--ops' : ''
          }`}
          onClick={handleClose}
          aria-label={String(t('Close'))}
        >
          {appMode === 'ops' ? (
            <CloseIcon aria-hidden="true" />
          ) : (
            <img
              src={CLOSE_ICON_SRC}
              alt=""
              aria-hidden="true"
              style={
                appMode === 'teacher'
                  ? { filter: 'brightness(0) saturate(100%)' }
                  : undefined
              }
            />
          )}
        </button>
      </div>

      <div className="terms-and-conditions-content">
        <iframe
          className="terms-and-conditions-frame"
          src={iframeSrc}
          title="Terms and Conditions"
          allowFullScreen={true}
          onError={handleIframeError}
          style={{ width: '100%', border: 'none' }}
        />
      </div>
    </div>
  );
};

export default TermsAndConditions;
