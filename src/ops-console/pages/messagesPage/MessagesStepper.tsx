import React from 'react';
import { useTranslation } from 'react-i18next';

export const MESSAGES_TABS = [
  'Select Audience',
  'Compose Notification',
  'Review & Send',
] as const;

type MessagesStepperProps = {
  activeStepIndex: number;
  onStepClick: (step: (typeof MESSAGES_TABS)[number]) => void;
  isStepDisabled?: (
    step: (typeof MESSAGES_TABS)[number],
    index: number,
  ) => boolean;
};

const MessagesStepper: React.FC<MessagesStepperProps> = ({
  activeStepIndex,
  onStepClick,
  isStepDisabled,
}) => {
  const { t } = useTranslation();

  return (
    <div
      className="messages-page__stepper"
      aria-label={String(t('Notification steps'))}
    >
      <div className="messages-page__stepper-wrap">
        {MESSAGES_TABS.map((step, index) => {
          const isActive = index === activeStepIndex;
          const isComplete = index < activeStepIndex;
          const disabled = isStepDisabled?.(step, index) ?? false;
          return (
            <React.Fragment key={step}>
              <button
                type="button"
                className={`messages-page__step ${
                  isActive ? 'messages-page__step--active' : ''
                } ${isComplete ? 'messages-page__step--complete' : ''}`}
                onClick={() => {
                  if (!disabled) onStepClick(step);
                }}
                disabled={disabled}
                aria-current={isActive ? 'step' : undefined}
              >
                <span className="messages-page__step-index">{index + 1}</span>
                <span className="messages-page__step-label">{t(step)}</span>
              </button>
              {index < MESSAGES_TABS.length - 1 && (
                <span className="messages-page__step-line" aria-hidden="true" />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

export default MessagesStepper;
