import React from 'react';
import {
  Box,
  Radio,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import {
  Autorenew,
  CalendarMonthOutlined,
  EventNote,
  AccessTimeOutlined,
  SendOutlined,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import {
  formatLocalDisplayDate,
  type DeliveryMode,
} from './MessagesPage.helpers';
import MessagesReviewAndSendTimePicker from './MessagesReviewAndSendTimePicker';

type MessagesReviewAndSendDeliveryProps = {
  deliveryDays: string[];
  deliveryMode: DeliveryMode;
  neverEnds: boolean;
  recurringDaysError: string | null;
  selectedDays: string[];
  sendTime: string;
  startDate: string;
  endDate: string;
  endDateError: string | null;
  canSubmitSchedule: boolean;
  onDeliveryModeChange: (
    event: React.MouseEvent<HTMLElement>,
    nextMode: DeliveryMode | null,
  ) => void;
  onSelectedDaysChange: React.Dispatch<React.SetStateAction<string[]>>;
  onNeverEndsChange: React.Dispatch<React.SetStateAction<boolean>>;
  onStartDateChange: React.Dispatch<React.SetStateAction<string>>;
  onSendTimeChange: React.Dispatch<React.SetStateAction<string>>;
  onEndDateChange: React.Dispatch<React.SetStateAction<string>>;
};

const MessagesReviewAndSendDelivery: React.FC<
  MessagesReviewAndSendDeliveryProps
> = (props) => {
  const { t } = useTranslation();
  const [openTimePicker, setOpenTimePicker] = React.useState(false);
  const [timeAnchorEl, setTimeAnchorEl] = React.useState<HTMLElement | null>(
    null,
  );
  const [selectedHour, selectedPeriod] = React.useMemo(() => {
    const match = props.sendTime
      .trim()
      .match(/^(\d{1,2}):(?:\d{2})\s?(AM|PM)$/i);
    if (!match) return ['09', 'AM'] as const;
    return [match[1].padStart(2, '0'), match[2].toUpperCase() as 'AM' | 'PM'];
  }, [props.sendTime]);
  const displayTime = `${selectedHour.replace(/^0/, '')} ${selectedPeriod}`;
  const todayLocalDate = React.useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }, []);
  const scheduleDate =
    props.startDate && props.startDate >= todayLocalDate
      ? props.startDate
      : todayLocalDate;
  const timePickerDate =
    props.deliveryMode === 'schedule' ? scheduleDate : null;

  return (
    <section className="messages-review-send__delivery-section">
      <Typography variant="h2" className="messages-review-send__card-heading">
        {t('Delivery Options')}
      </Typography>
      <ToggleButtonGroup
        className="messages-review-send__delivery-toggle"
        exclusive
        value={props.deliveryMode}
        onChange={props.onDeliveryModeChange}
        aria-label={String(t('Delivery options'))}
      >
        <ToggleButton value="send_now">
          <SendOutlined className="messages-review-send__toggle-icon" />
          {t('Send')}
        </ToggleButton>
        <ToggleButton value="schedule">
          <EventNote className="messages-review-send__toggle-icon" />
          {t('Schedule')}
        </ToggleButton>
        <ToggleButton value="recurring">
          <Autorenew className="messages-review-send__toggle-icon" />
          {t('Recurring')}
        </ToggleButton>
      </ToggleButtonGroup>

      {props.deliveryMode === 'recurring' ? (
        <Box className="messages-review-send__recurring-panel">
          <div className="messages-review-send__recurring-card">
            <Typography className="messages-review-send__recurring-title">
              {t('Day of the Week')}
            </Typography>
            <div className="messages-review-send__day-pills">
              {props.deliveryDays.map((day) => (
                <button
                  key={day}
                  type="button"
                  className={`messages-review-send__day-pill ${props.selectedDays.includes(day) ? 'messages-review-send__day-pill--active' : ''}`}
                  onClick={() =>
                    props.onSelectedDaysChange((current) =>
                      current.includes(day)
                        ? current.filter((value) => value !== day)
                        : [...current, day],
                    )
                  }
                >
                  {t(day)}
                </button>
              ))}
            </div>
            {props.recurringDaysError && (
              <Typography
                className="messages-review-send__delivery-error"
                variant="caption"
                component="p"
                role="alert"
              >
                {props.recurringDaysError}
              </Typography>
            )}
            <div className="messages-review-send__schedule-grid">
              <label className="messages-review-send__schedule-field">
                <span>{t('Start Date')}</span>
                <div className="messages-review-send__date-field">
                  <div className="messages-review-send__date-display">
                    <span>{formatLocalDisplayDate(scheduleDate)}</span>
                    <CalendarMonthOutlined
                      className="messages-review-send__date-icon"
                      fontSize="small"
                    />
                  </div>
                  <input
                    type="date"
                    min={todayLocalDate}
                    value={scheduleDate}
                    onChange={(event) =>
                      props.onStartDateChange(event.target.value)
                    }
                    aria-label={String(t('Start Date'))}
                  />
                </div>
              </label>
              <div className="messages-review-send__schedule-field">
                <span>{t('Time')}</span>
                <button
                  type="button"
                  className="messages-review-send__time-button"
                  aria-label={String(t('Time'))}
                  aria-expanded={openTimePicker}
                  onClick={(event) => {
                    setTimeAnchorEl(event.currentTarget);
                    setOpenTimePicker(true);
                  }}
                >
                  <span>{displayTime}</span>
                  <AccessTimeOutlined fontSize="small" />
                </button>
              </div>
            </div>
            <div className="messages-review-send__ends-row">
              <Typography className="messages-review-send__ends-title">
                {t('Ends')}
              </Typography>
              <div className="messages-review-send__ends-options">
                <label>
                  <Radio
                    checked={props.neverEnds}
                    onChange={() => props.onNeverEndsChange(true)}
                  />
                  {t('Never')}
                </label>
                <label>
                  <Radio
                    checked={!props.neverEnds}
                    onChange={() => props.onNeverEndsChange(false)}
                  />
                  {t('End On Date')}
                </label>
              </div>
            </div>
            {!props.neverEnds && (
              <div className="messages-review-send__end-date-row">
                <label className="messages-review-send__schedule-field">
                  <span>{t('End on Date')}</span>
                  <div className="messages-review-send__date-field">
                    <div className="messages-review-send__date-display">
                      <span>{formatLocalDisplayDate(props.endDate)}</span>
                      <CalendarMonthOutlined
                        className="messages-review-send__date-icon"
                        fontSize="small"
                      />
                    </div>
                    <input
                      type="date"
                      min={todayLocalDate}
                      value={props.endDate}
                      onChange={(event) =>
                        props.onEndDateChange(event.target.value)
                      }
                      aria-label={String(t('End on Date'))}
                    />
                  </div>
                </label>
                <Typography className="messages-review-send__end-date-hint">
                  {t(
                    'The recurring notification will stop after the selected date.',
                  )}
                </Typography>
              </div>
            )}
          </div>
        </Box>
      ) : props.deliveryMode === 'schedule' ? (
        <Box className="messages-review-send__schedule-panel">
          <Typography className="messages-review-send__section-copy">
            {t(
              'Choose the exact date and time when this notification should be sent.',
            )}
          </Typography>
          <div className="messages-review-send__schedule-grid">
            <label className="messages-review-send__schedule-field">
              <span>{t('Date')}</span>
              <div className="messages-review-send__date-field">
                <div className="messages-review-send__date-display">
                  <span>{formatLocalDisplayDate(scheduleDate)}</span>
                  <CalendarMonthOutlined
                    className="messages-review-send__date-icon"
                    fontSize="small"
                  />
                </div>
                <input
                  type="date"
                  min={todayLocalDate}
                  value={scheduleDate}
                  onChange={(event) =>
                    props.onStartDateChange(event.target.value)
                  }
                  aria-label={String(t('Date'))}
                />
              </div>
            </label>
            <div className="messages-review-send__schedule-field">
              <span>{t('Time')}</span>
              <button
                type="button"
                className="messages-review-send__time-button"
                aria-label={String(t('Time'))}
                aria-expanded={openTimePicker}
                onClick={(event) => openTimeMenu(event.currentTarget)}
              >
                <span>{displayTime}</span>
                <AccessTimeOutlined fontSize="small" />
              </button>
            </div>
          </div>
        </Box>
      ) : (
        <Box className="messages-review-send__delivery-card">
          <Typography className="messages-review-send__section-copy">
            {t(
              'This notification will be sent immediately after confirmation.',
            )}
          </Typography>
        </Box>
      )}

      <MessagesReviewAndSendTimePicker
        open={openTimePicker}
        anchorEl={timeAnchorEl}
        date={timePickerDate}
        selectedHour={selectedHour}
        selectedPeriod={selectedPeriod}
        onClose={() => setOpenTimePicker(false)}
        onSelectTime={(hour, period) => {
          props.onSendTimeChange(`${hour}:00 ${period}`);
          setOpenTimePicker(false);
        }}
      />
    </section>
  );
};

export default MessagesReviewAndSendDelivery;
