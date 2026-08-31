import React from 'react';
import { AccessTimeOutlined } from '@mui/icons-material';
import { Box, InputAdornment, Popover, TextField } from '@mui/material';

type TimeParts = {
  hour: string;
  minute: string;
  meridiem: string;
};

type CompactTimePickerFieldProps = {
  label: string;
  value: string;
  error?: string;
  onChange: (value: string) => void;
};

const hours = Array.from({ length: 12 }, (_, index) =>
  String(index + 1).padStart(2, '0'),
);
const minutes = Array.from({ length: 60 }, (_, index) =>
  String(index).padStart(2, '0'),
);
const meridiems = ['AM', 'PM'];

const parseTimeValue = (value: string): TimeParts => {
  const match = value.match(/^(\d{1,2}):(\d{2})\s?(AM|PM)$/i);

  if (!match) {
    return { hour: '09', minute: '00', meridiem: 'AM' };
  }

  return {
    hour: match[1].padStart(2, '0'),
    minute: match[2],
    meridiem: match[3].toUpperCase(),
  };
};

const buildTimeValue = ({ hour, minute, meridiem }: TimeParts) =>
  `${hour}:${minute} ${meridiem}`;

export const CompactTimePickerField: React.FC<CompactTimePickerFieldProps> = ({
  label,
  value,
  error,
  onChange,
}) => {
  const [anchorEl, setAnchorEl] = React.useState<HTMLElement | null>(null);
  const [draftTime, setDraftTime] = React.useState<TimeParts>(() =>
    parseTimeValue(value),
  );
  const open = Boolean(anchorEl);
  const selectedTime = open ? draftTime : parseTimeValue(value);

  const updateTime = (nextTime: Partial<TimeParts>) => {
    const updatedTime = { ...selectedTime, ...nextTime };
    setDraftTime(updatedTime);
    onChange(buildTimeValue(updatedTime));
  };

  const openPicker = (anchorElement: HTMLElement) => {
    setDraftTime(parseTimeValue(value));
    setAnchorEl(anchorElement);
  };

  const renderColumn = (
    values: string[],
    selectedValue: string,
    ariaPrefix: string,
    onSelect: (value: string) => void,
    closeAfterSelect = false,
  ) => (
    <Box className="campaign-communication-time-picker-column">
      {values.map((item) => (
        <Box
          key={item}
          component="button"
          type="button"
          role="option"
          aria-label={`${ariaPrefix} ${item}`.trim()}
          aria-selected={item === selectedValue}
          className="campaign-communication-time-picker-option"
          onClick={() => {
            onSelect(item);
            if (closeAfterSelect) setAnchorEl(null);
          }}
        >
          {item}
        </Box>
      ))}
    </Box>
  );

  return (
    <>
      <TextField
        fullWidth
        size="small"
        inputProps={{
          'aria-label': label,
          readOnly: true,
        }}
        value={value}
        onClick={(event) => {
          openPicker(event.currentTarget);
        }}
        onKeyDown={(event) => {
          if (event.key === ' ' || event.key === 'Enter') {
            event.preventDefault();
            openPicker(event.currentTarget);
          }
        }}
        error={!!error}
        helperText={error}
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              <AccessTimeOutlined fontSize="small" />
            </InputAdornment>
          ),
        }}
      />
      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        PaperProps={{
          className: 'campaign-communication-time-picker',
        }}
      >
        <Box role="listbox" aria-label={`${label} picker`}>
          {renderColumn(hours, selectedTime.hour, 'Hour', (hour) =>
            updateTime({ hour }),
          )}
          {renderColumn(minutes, selectedTime.minute, 'Minute', (minute) =>
            updateTime({ minute }),
          )}
          {renderColumn(
            meridiems,
            selectedTime.meridiem,
            '',
            (meridiem) => updateTime({ meridiem }),
            true,
          )}
        </Box>
      </Popover>
    </>
  );
};
