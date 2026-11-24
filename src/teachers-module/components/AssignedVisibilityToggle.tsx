import React from 'react';
import { t } from 'i18next';
import AssignedBadgeIcon from './AssignedBadgeIcon';
import { getTrackableProps, TRACKABLE_IDS } from '../../analytics/trackable';
import './AssignedVisibilityToggle.css';

type AssignedVisibilityToggleProps = {
  showAssigned: boolean;
  onChange: (showAssigned: boolean) => void;
  disabled?: boolean;
  className?: string;
};

const AssignedVisibilityToggle: React.FC<AssignedVisibilityToggleProps> = ({
  showAssigned,
  onChange,
  disabled = false,
  className = '',
}) => {
  const assignedLabel = t('Assigned') || 'Assigned';
  const showLabel = t('Show') || 'Show';
  const hideLabel = t('Hide') || 'Hide';

  return (
    <div className={`assigned-visibility-toggle ${className}`.trim()}>
      <span className="assigned-visibility-toggle-label">
        <AssignedBadgeIcon
          className="assigned-visibility-toggle-icon"
          ariaLabel={assignedLabel}
        />
        {assignedLabel}
      </span>
      <span className="assigned-visibility-toggle-actions">
        <button
          type="button"
          id={TRACKABLE_IDS.TEACHER_SHOW_ASSIGNED_BUTTON}
          {...getTrackableProps(TRACKABLE_IDS.TEACHER_SHOW_ASSIGNED_BUTTON)}
          className={`assigned-visibility-toggle-button show-assigned-button${
            showAssigned ? ' is-active' : ''
          }`}
          onClick={() => onChange(true)}
          disabled={disabled}
          aria-pressed={showAssigned}
        >
          {showLabel}
        </button>
        <button
          type="button"
          id={TRACKABLE_IDS.TEACHER_HIDE_ASSIGNED_BUTTON}
          {...getTrackableProps(TRACKABLE_IDS.TEACHER_HIDE_ASSIGNED_BUTTON)}
          className={`assigned-visibility-toggle-button hide-assigned-button${
            !showAssigned ? ' is-active' : ''
          }`}
          onClick={() => onChange(false)}
          disabled={disabled}
          aria-pressed={!showAssigned}
        >
          {hideLabel}
        </button>
      </span>
    </div>
  );
};

export default AssignedVisibilityToggle;
