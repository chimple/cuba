import React from 'react';
import { t } from 'i18next';

type FcInteractFooterProps = {
  hasProcessingMedia: boolean;
  isFormValid: boolean;
  isSaving: boolean;
  mediaUploadCount: number;
  onCancel: () => void;
  onSave: () => void;
};

export default function FcInteractFooter({
  hasProcessingMedia,
  isFormValid,
  isSaving,
  mediaUploadCount,
  onCancel,
  onSave,
}: FcInteractFooterProps) {
  const isDisabled =
    !isFormValid || isSaving || (mediaUploadCount > 0 && hasProcessingMedia);

  return (
    <div className="fc-interact-popup-footer" id="fc-footer">
      <button
        className="fc-interact-popup-cancel-btn"
        onClick={onCancel}
        id="fc-cancel-btn"
      >
        {t('Cancel')}
      </button>

      <button
        className={`fc-interact-popup-save-btn ${
          isDisabled ? 'fc-interact-popup-save-disabled' : ''
        }`}
        id="fc-save-btn"
        onClick={onSave}
        disabled={isDisabled}
      >
        {isSaving ? `${t('Saving...')} ` : `${t('Save')}`}
      </button>
    </div>
  );
}
