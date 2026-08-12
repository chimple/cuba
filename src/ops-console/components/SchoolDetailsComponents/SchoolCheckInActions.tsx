import { t } from 'i18next';

type SchoolCheckInActionsProps = {
  canDismissModal: boolean;
  isCheckIn: boolean;
  isConfirmDisabled: boolean;
  isLoadingLocation: boolean;
  isSubmittingAction: boolean;
  isUpdatingLocation: boolean;
  onClose: () => void;
  onConfirmAction: () => void;
};

export default function SchoolCheckInActions({
  canDismissModal,
  isCheckIn,
  isConfirmDisabled,
  isLoadingLocation,
  isSubmittingAction,
  isUpdatingLocation,
  onClose,
  onConfirmAction,
}: SchoolCheckInActionsProps) {
  return (
    <div id="check-in-modal-actions" className="check-in-modal-actions">
      <button
        id="check-in-cancel-btn"
        className="check-in-btn btn-cancel"
        onClick={canDismissModal ? onClose : undefined}
        disabled={isSubmittingAction}
      >
        {t('Cancel')}
      </button>
      <button
        id="check-in-confirm-btn"
        className={`check-in-btn btn-confirm ${!isCheckIn ? 'btn-checkout' : ''} ${isConfirmDisabled ? 'disabled' : ''}`}
        onClick={isConfirmDisabled ? undefined : onConfirmAction}
        disabled={isConfirmDisabled}
      >
        {isLoadingLocation || isUpdatingLocation
          ? t('Locating...')
          : isCheckIn
            ? t('Confirm Check-In')
            : t('Confirm Check-Out')}
      </button>
    </div>
  );
}
