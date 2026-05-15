import React from 'react';
import { Trans, useTranslation } from 'react-i18next';

import {
  getCurrentTermsAppMode,
  getTermsAgreeLabelKey,
} from '../../utility/termsAndConditions';
import './TermsAndCoditionsModal.css';

interface TermsAndCoditionsModalProps {
  isOpen?: boolean;
  visible?: boolean;
  isSubmitting?: boolean;
  onAgree: () => void;
  onTermsClick: () => void;
  onClose?: () => void;
}

const TermsAndCoditionsModal: React.FC<TermsAndCoditionsModalProps> = ({
  isOpen = true,
  visible,
  isSubmitting = false,
  onAgree,
  onTermsClick,
}) => {
  const { t } = useTranslation();
  const shouldRender = visible ?? isOpen;
  const appMode = getCurrentTermsAppMode();

  if (!shouldRender) {
    return null;
  }

  const renderTeacherModal = () => (
    <div className="terms-update-modal-card-teacher">
      <div className="terms-update-modal-copy-teacher">
        <h2
          id="terms-update-modal-title"
          className="terms-update-modal-title-teacher"
        >
          <Trans
            i18nKey="We have updated our <1>Terms & Conditions</1>."
            components={{
              1: (
                <button
                  type="button"
                  className="terms-update-modal-link-teacher"
                  onClick={onTermsClick}
                />
              ),
            }}
          />
        </h2>

        <p className="terms-update-modal-body-teacher">
          {t(
            'To keep your data safe and comply with privacy regulations, please review and agree to continue.',
          )}
        </p>
      </div>

      <button
        type="button"
        className="terms-update-modal-button-teacher"
        onClick={onAgree}
        disabled={isSubmitting}
      >
        {t('Agree as Teacher')}
      </button>
    </div>
  );

  const renderOpsModal = () => (
    <div className="terms-update-modal-card-ops">
      <div className="terms-update-modal-copy-ops">
        <h2
          id="terms-update-modal-title"
          className="terms-update-modal-title-ops"
        >
          <Trans
            i18nKey="We have updated our <1>Terms & Conditions</1>."
            components={{
              1: (
                <button
                  type="button"
                  className="terms-update-modal-link-ops"
                  onClick={onTermsClick}
                />
              ),
            }}
          />
        </h2>

        <p className="terms-update-modal-body-ops">
          {t(
            'To keep your data safe and comply with privacy regulations, please review and agree to continue.',
          )}
        </p>
      </div>

      <button
        type="button"
        className="terms-update-modal-button-ops"
        onClick={onAgree}
        disabled={isSubmitting}
      >
        {t('Agree as OPS User')}
      </button>
    </div>
  );

  const renderKidsModal = () => (
    <div className="terms-update-modal-card">
      <div className="terms-update-modal-copy">
        <h2 id="terms-update-modal-title" className="terms-update-modal-title">
          <Trans
            i18nKey="We have updated our <1>Terms & Conditions</1>."
            components={{
              1: (
                <button
                  type="button"
                  className="terms-update-modal-link"
                  onClick={onTermsClick}
                />
              ),
            }}
          />
        </h2>

        <p className="terms-update-modal-body">
          {t(
            'To keep your data safe and comply with privacy regulations, please review and agree to continue.',
          )}
        </p>
      </div>

      <button
        type="button"
        className="terms-update-modal-button"
        onClick={onAgree}
        disabled={isSubmitting}
      >
        {t(getTermsAgreeLabelKey(appMode))}
      </button>
    </div>
  );

  return (
    <div
      className="terms-update-modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="terms-update-modal-title"
    >
      {appMode === 'teacher'
        ? renderTeacherModal()
        : appMode === 'ops'
          ? renderOpsModal()
          : renderKidsModal()}
    </div>
  );
};

export default TermsAndCoditionsModal;
