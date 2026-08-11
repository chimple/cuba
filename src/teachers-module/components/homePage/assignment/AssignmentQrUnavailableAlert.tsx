import React from 'react';
import { IonAlert } from '@ionic/react';
import { t } from 'i18next';
import './AssignmentQrUnavailableAlert.css';

const UNAVAILABLE_QR_MESSAGE =
  'This QR code is not available in the Chimple app. Please try scanning another QR code.';

type AssignmentQrUnavailableAlertProps = {
  isOpen: boolean;
  onDismiss: () => void;
};

const AssignmentQrUnavailableAlert: React.FC<
  AssignmentQrUnavailableAlertProps
> = ({ isOpen, onDismiss }) => {
  const okLabel = t('OK') || 'OK';

  return (
    <IonAlert
      isOpen={isOpen}
      onDidDismiss={onDismiss}
      cssClass="assignment-qr-unavailable-alert"
      message={t(UNAVAILABLE_QR_MESSAGE) || UNAVAILABLE_QR_MESSAGE}
      buttons={[
        {
          text: okLabel,
          role: 'cancel',
          cssClass: 'assignment-qr-unavailable-alert-ok',
        },
      ]}
    />
  );
};

export default AssignmentQrUnavailableAlert;
