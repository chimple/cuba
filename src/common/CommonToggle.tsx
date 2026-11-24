import React from 'react';
import { IonLabel, IonToggle } from '@ionic/react';
import './CommonToggle.css';
import { t } from 'i18next';
import { getTrackableProps } from '../analytics/trackable';
import type { TrackableId } from '../analytics/trackable';

interface CommonToggleProps {
  checked?: boolean;
  onChange: (event: CustomEvent) => void;
  label?: string;
  id?: string;
  className?: string;
  trackableId?: TrackableId;
}

const CommonToggle: React.FC<CommonToggleProps> = ({
  checked,
  onChange,
  label,
  id,
  className,
  trackableId,
}) => {
  return (
    <div className="rounded-toggle-container">
      {label && (
        <IonLabel className="common-toggle-toggle-label">{t(label)}</IonLabel>
      )}
      <IonToggle
        className={`common-toggle-custom-rounded-toggle ${className ?? ''}`.trim()}
        id={id ?? 'toggle'}
        {...(trackableId ? getTrackableProps(trackableId) : {})}
        checked={checked}
        onIonChange={onChange}
      />
    </div>
  );
};

export default CommonToggle;
