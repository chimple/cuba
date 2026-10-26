import React from 'react';
import { Box, Popover } from '@mui/material';
import { useTranslation } from 'react-i18next';
import {
  hasFutureTimesForPeriod,
  isTimeOptionInPast,
} from './MessagesPage.helpers';

type Props = {
  open: boolean;
  anchorEl: HTMLElement | null;
  date: string | null;
  selectedHour: string;
  selectedPeriod: 'AM' | 'PM';
  onClose: () => void;
  onSelectTime: (hour: string, period: 'AM' | 'PM') => void;
};

const MessagesReviewAndSendTimePicker: React.FC<Props> = ({
  open,
  anchorEl,
  date,
  selectedHour,
  selectedPeriod,
  onClose,
  onSelectTime,
}) => {
  const { t } = useTranslation();
  const hourOptions = Array.from({ length: 12 }, (_, index) =>
    String(index + 1).padStart(2, '0'),
  );
  const periodOptions = ['AM', 'PM'] as const;

  return (
    <Popover
      open={open}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      transformOrigin={{ vertical: 'top', horizontal: 'left' }}
      PaperProps={{ className: 'messages-review-send__time-picker' }}
    >
      <Box role="listbox" aria-label={String(t('Time picker'))}>
        <Box className="messages-review-send__time-picker-column">
          {hourOptions.map((hour) => {
            const isDisabled = date
              ? isTimeOptionInPast(date, hour, selectedPeriod)
              : false;
            const isSelected = hour === selectedHour && !isDisabled;
            return (
              <button
                key={hour}
                type="button"
                role="option"
                aria-selected={isSelected}
                disabled={isDisabled}
                aria-disabled={isDisabled}
                className="messages-review-send__time-picker-option"
                onClick={() => {
                  if (!isDisabled) onSelectTime(hour, selectedPeriod);
                }}
              >
                {hour}
              </button>
            );
          })}
        </Box>
        <Box className="messages-review-send__time-picker-column messages-review-send__time-picker-period-column">
          {periodOptions.map((period) => {
            const isDisabled = date
              ? !hasFutureTimesForPeriod(date, period)
              : false;
            const isSelected = period === selectedPeriod && !isDisabled;
            return (
              <button
                key={period}
                type="button"
                role="option"
                aria-selected={isSelected}
                disabled={isDisabled}
                aria-disabled={isDisabled}
                className="messages-review-send__time-picker-option"
                onClick={() => {
                  if (!isDisabled) onSelectTime(selectedHour, period);
                }}
              >
                {period}
              </button>
            );
          })}
        </Box>
      </Box>
    </Popover>
  );
};

export default MessagesReviewAndSendTimePicker;
