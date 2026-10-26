import React from 'react';
import { t } from 'i18next';
import './SchoolCheckInModal.css';
import { IoClose } from 'react-icons/io5';
import type { SchoolCheckInModalProps } from './SchoolCheckInModal.types';
import SchoolCheckInActions from './SchoolCheckInActions';
import SchoolCheckInCards from './SchoolCheckInCards';
import SchoolCheckInCommunityParentsField from './SchoolCheckInCommunityParentsField';
import SchoolCheckInConfirmation from './SchoolCheckInConfirmation';
import SchoolCheckInMap from './SchoolCheckInMap';
import { useSchoolCheckInLocation } from './useSchoolCheckInLocation';

const SchoolCheckInModal: React.FC<SchoolCheckInModalProps> = ({
  open,
  onClose,
  onConfirm,
  status,
  visitType,
  schoolName,
  schoolId,
  schoolLocation,
  schoolAddress,
  onLocationUpdated,
}) => {
  const state = useSchoolCheckInLocation({
    open,
    onConfirm,
    status,
    visitType,
    schoolId,
    schoolLocation,
    schoolAddress,
    onLocationUpdated,
  });

  if (!open) return null;

  const canDismissModal = !state.isSubmittingAction;

  return (
    <div
      id="check-in-modal-overlay"
      className="schoolcheckinmodal check-in-modal-overlay"
      onClick={canDismissModal ? onClose : undefined}
    >
      <div
        id="check-in-modal-container"
        className="check-in-modal-container"
        onClick={(e) => e.stopPropagation()}
      >
        <div id="check-in-modal-header" className="check-in-modal-header">
          <h2 id="check-in-modal-title" className="check-in-modal-title">
            {state.isCheckIn ? t('Confirm Check-In') : t('Confirm Check-Out')}
          </h2>
          <button
            id="check-in-modal-close-btn"
            className="check-in-modal-close"
            onClick={canDismissModal ? onClose : undefined}
            disabled={state.isSubmittingAction}
          >
            <IoClose />
          </button>
        </div>

        <div id="check-in-modal-content" className="check-in-modal-content">
          {state.showCommunityVisitParentsField && (
            <SchoolCheckInCommunityParentsField
              communityVisitParentsError={state.communityVisitParentsError}
              communityVisitParentsValue={state.communityVisitParentsValue}
              setCommunityVisitParentsError={
                state.setCommunityVisitParentsError
              }
              setCommunityVisitParentsValue={
                state.setCommunityVisitParentsValue
              }
              visitType={visitType}
            />
          )}

          <SchoolCheckInCards
            currentDate={state.currentDate}
            distance={state.distance}
            handleRetryLocation={state.handleRetryLocation}
            isInsidePremises={state.isInsidePremises}
            isLoadingLocation={state.isLoadingLocation}
            isPermissionDenied={state.isPermissionDenied}
            locationError={state.locationError}
            targetLocation={state.targetLocation}
            userAddress={state.userAddress}
            userLocation={state.userLocation}
          />

          {state.isSchoolLocationMissing && state.isCheckIn && (
            <SchoolCheckInConfirmation
              isConfirmedInSchool={state.isConfirmedInSchool}
              setIsConfirmedInSchool={state.setIsConfirmedInSchool}
            />
          )}

          <SchoolCheckInMap
            isSchoolLocationMissing={state.isSchoolLocationMissing}
            targetLocation={state.targetLocation}
            userLocation={state.userLocation}
          />
        </div>

        <SchoolCheckInActions
          canDismissModal={canDismissModal}
          isCheckIn={state.isCheckIn}
          isConfirmDisabled={state.isConfirmDisabled}
          isLoadingLocation={state.isLoadingLocation}
          isSubmittingAction={state.isSubmittingAction}
          isUpdatingLocation={state.isUpdatingLocation}
          onClose={onClose}
          onConfirmAction={state.onConfirmAction}
        />
      </div>
    </div>
  );
};

export default SchoolCheckInModal;
