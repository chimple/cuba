import { IonIcon } from '@ionic/react';
import { t } from 'i18next';
import { chevronForward } from 'ionicons/icons';
import './NextButton.css';
import React from 'react';
import { getTrackableProps, type TrackableId } from '../../analytics/trackable';

interface NextButtonProps {
  onClicked: React.MouseEventHandler<HTMLButtonElement>;
  disabled: boolean;
  children?: React.ReactNode;
  trackableId?: TrackableId;
}

const NextButton: React.FC<NextButtonProps> = ({
  onClicked,
  disabled,
  children,
  trackableId,
}) => {
  return (
    <button
      id="common-next-button"
      disabled={disabled}
      onClick={onClicked}
      {...(trackableId ? getTrackableProps(trackableId) : {})}
    >
      {children}
      {t('Next')}
      <IonIcon
        className="arrow-icon"
        slot="end"
        icon={chevronForward}
      ></IonIcon>
    </button>
  );
};

export default NextButton;
