import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined';
import Popover from '@mui/material/Popover';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DateCalendar } from '@mui/x-date-pickers/DateCalendar';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import dayjs, { type Dayjs } from 'dayjs';
import { t } from 'i18next';
import React, { useState } from 'react';
import { formatCampaignMessageReportDateControl } from './CampaignMessageReport.helpers';

interface CampaignMessageReportHeaderProps {
  fromDate: string;
  toDate: string;
  isExporting: boolean;
  invalidDateRange: boolean;
  onClear: () => void;
  onExport: () => void;
  onFromDateChange: (value: string) => void;
  onToDateChange: (value: string) => void;
}
const CampaignMessageReportHeader: React.FC<
  CampaignMessageReportHeaderProps
> = ({
  fromDate,
  toDate,
  isExporting,
  invalidDateRange,
  onClear,
  onExport,
  onFromDateChange,
  onToDateChange,
}) => {
  const [activeDateField, setActiveDateField] = useState<'from' | 'to' | null>(
    null,
  );
  const [datePickerAnchor, setDatePickerAnchor] =
    useState<HTMLButtonElement | null>(null);
  const closeDatePicker = (): void => {
    setActiveDateField(null);
    setDatePickerAnchor(null);
  };
  const toggleDatePicker = (
    field: 'from' | 'to',
    event: React.MouseEvent<HTMLButtonElement>,
  ): void => {
    if (activeDateField === field) {
      closeDatePicker();
      return;
    }
    setActiveDateField(field);
    setDatePickerAnchor(event.currentTarget);
  };
  const handleDateSelection = (value: Dayjs | null): void => {
    if (!value || !activeDateField) return;
    const selectedDate = value.format('YYYY-MM-DD');
    if (activeDateField === 'from') onFromDateChange(selectedDate);
    else onToDateChange(selectedDate);
    closeDatePicker();
  };
  const activeDateValue = activeDateField === 'from' ? fromDate : toDate;
  return (
    <header
      id="campaign-message-report-header"
      className="campaign-message-report-header"
    >
      <h2>{t('Message Performance Report')}</h2>
      <div
        id="campaign-message-report-filters"
        className="campaign-message-report-filters"
      >
        <div
          id="campaign-message-report-date-field"
          className="campaign-message-report-date-field"
        >
          <span>{t('From')}</span>
          <button
            type="button"
            aria-haspopup="dialog"
            aria-label={String(t('From'))}
            aria-expanded={activeDateField === 'from'}
            id="campaign-message-report-date-control"
            className="campaign-message-report-date-control"
            onClick={(event) => toggleDatePicker('from', event)}
          >
            <span
              aria-hidden="true"
              id="campaign-message-report-date-value"
              className="campaign-message-report-date-value"
            >
              {formatCampaignMessageReportDateControl(fromDate)}
            </span>
            <CalendarMonthOutlinedIcon
              aria-hidden="true"
              id="campaign-message-report-calendar-icon"
              className="campaign-message-report-calendar-icon"
            />
          </button>
        </div>
        <div
          id="campaign-message-report-date-field"
          className="campaign-message-report-date-field"
        >
          <span>{t('To')}</span>
          <button
            type="button"
            aria-haspopup="dialog"
            aria-label={String(t('To'))}
            aria-expanded={activeDateField === 'to'}
            id="campaign-message-report-date-control"
            className="campaign-message-report-date-control"
            onClick={(event) => toggleDatePicker('to', event)}
          >
            <span
              aria-hidden="true"
              id="campaign-message-report-date-value"
              className="campaign-message-report-date-value"
            >
              {formatCampaignMessageReportDateControl(toDate)}
            </span>
            <CalendarMonthOutlinedIcon
              aria-hidden="true"
              id="campaign-message-report-calendar-icon"
              className="campaign-message-report-calendar-icon"
            />
          </button>
        </div>
        <div
          id="campaign-message-report-actions"
          className="campaign-message-report-actions"
        >
          <button
            type="button"
            id="campaign-message-report-clear"
            className="campaign-message-report-clear"
            disabled={!fromDate && !toDate}
            onClick={onClear}
          >
            {t('Clear')}
          </button>
          <button
            type="button"
            id="campaign-message-report-export"
            className="campaign-message-report-export"
            disabled={isExporting || invalidDateRange}
            onClick={onExport}
          >
            <FileDownloadOutlinedIcon fontSize="small" aria-hidden="true" />
            {isExporting ? t('Exporting...') : t('Export')}
          </button>
        </div>
      </div>
      {invalidDateRange ? (
        <p
          id="campaign-message-report-validation"
          className="campaign-message-report-validation"
          role="alert"
        >
          {t('From Date cannot be later than To Date.')}
        </p>
      ) : null}
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <Popover
          anchorEl={datePickerAnchor}
          open={Boolean(activeDateField)}
          onClose={closeDatePicker}
          anchorOrigin={{ horizontal: 'left', vertical: 'bottom' }}
        >
          <DateCalendar
            value={activeDateValue ? dayjs(activeDateValue) : null}
            minDate={
              activeDateField === 'to' && fromDate ? dayjs(fromDate) : undefined
            }
            maxDate={
              activeDateField === 'from' && toDate ? dayjs(toDate) : undefined
            }
            onChange={handleDateSelection}
          />
        </Popover>
      </LocalizationProvider>
    </header>
  );
};
export default CampaignMessageReportHeader;
