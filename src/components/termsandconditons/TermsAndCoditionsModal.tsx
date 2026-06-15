import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
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
  onViewed?: () => void;
  onClose?: () => void;
}

const TermsAndCoditionsModal: React.FC<TermsAndCoditionsModalProps> = ({
  isOpen = true,
  visible,
  isSubmitting = false,
  onAgree,
  onTermsClick,
  onViewed,
}) => {
  const { t } = useTranslation();
  const shouldRender = visible ?? isOpen;
  const appMode = getCurrentTermsAppMode();
  const hasReportedViewRef = useRef(false);
  const termsLabel = String(t('Terms & Conditions'));

  useEffect(() => {
    if (!shouldRender) {
      hasReportedViewRef.current = false;
      return;
    }

    if (hasReportedViewRef.current) {
      return;
    }

    hasReportedViewRef.current = true;
    onViewed?.();
  }, [onViewed, shouldRender]);

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
                  aria-label={termsLabel}
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
                  aria-label={termsLabel}
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
                  aria-label={termsLabel}
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

  const modalContent = (
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

  if (typeof document === 'undefined') {
    return modalContent;
  }

  return createPortal(modalContent, document.body);
};

export default TermsAndCoditionsModal;
