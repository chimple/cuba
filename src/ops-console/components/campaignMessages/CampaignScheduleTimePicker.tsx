import React from 'react';
import {
  HOUR_OPTIONS,
  PERIOD_OPTIONS,
  type CampaignMessagesController,
  type CampaignMessagesScheduleType,
} from './CampaignMessagesLogic';

interface CampaignScheduleTimePickerProps {
  controller: CampaignMessagesController;
  label: string;
  scheduleType: CampaignMessagesScheduleType;
  wrapperRefs: React.MutableRefObject<
    Partial<Record<CampaignMessagesScheduleType, HTMLDivElement | null>>
  >;
}

const CampaignScheduleTimePicker: React.FC<CampaignScheduleTimePickerProps> = ({
  controller,
  label,
  scheduleType,
  wrapperRefs,
}) => {
  const currentTime =
    scheduleType === 'message'
      ? controller.editedMessageTime
      : controller.editedPollTime;
  const currentParts = controller.getScheduleTimeParts(currentTime);
  const isPickerOpen = controller.openSchedulePicker === scheduleType;
  const isTimeEditable = currentParts !== null;

  return (
    <div
      className="campaign-messages-time-picker-wrapper"
      ref={(element) => {
        wrapperRefs.current[scheduleType] = element;
      }}
    >
      <button
        className="campaign-messages-time campaign-messages-time-button campaign-messages-time-editable"
        type="button"
        aria-label={label}
        aria-expanded={isPickerOpen}
        disabled={!isTimeEditable}
        onClick={() =>
          controller.setOpenSchedulePicker((currentPicker) =>
            currentPicker === scheduleType ? null : scheduleType,
          )
        }
      >
        {currentTime}
      </button>

      {isPickerOpen && isTimeEditable && (
        <div
          className="campaign-messages-time-picker"
          role="group"
          aria-label={label}
        >
          <div className="campaign-messages-time-picker-column">
            {HOUR_OPTIONS.map((hour) => (
              <button
                className="campaign-messages-time-picker-option"
                type="button"
                aria-selected={currentParts?.hour === hour}
                key={`${scheduleType}-hour-${hour}`}
                ref={(element) => {
                  controller.hourOptionRefs.current[
                    `${scheduleType}-hour-${hour}`
                  ] = element;
                }}
                onClick={() => {
                  controller.updateScheduleTime(scheduleType, 'hour', hour);
                  controller.setOpenSchedulePicker(null);
                }}
              >
                {hour}
              </button>
            ))}
          </div>
          <div className="campaign-messages-time-picker-column campaign-messages-time-picker-period-column">
            {PERIOD_OPTIONS.map((period) => (
              <button
                className="campaign-messages-time-picker-option"
                type="button"
                aria-selected={currentParts?.period === period}
                key={`${scheduleType}-period-${period}`}
                ref={(element) => {
                  controller.periodOptionRefs.current[
                    `${scheduleType}-period-${period}`
                  ] = element;
                }}
                onClick={() => {
                  controller.updateScheduleTime(scheduleType, 'period', period);
                  controller.setOpenSchedulePicker(null);
                }}
              >
                {period}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CampaignScheduleTimePicker;
