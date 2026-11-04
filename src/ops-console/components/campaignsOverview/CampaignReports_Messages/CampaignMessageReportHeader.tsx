import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';
import { FormControl, MenuItem, Select } from '@mui/material';
import { t } from 'i18next';
import React from 'react';
import { formatCampaignMessageReportDateControl } from './CampaignMessageReport.helpers';

interface CampaignMessageReportHeaderProps {
  fromDate: string;
  toDate: string;
  reportDays: 1 | 3 | 7;
  isExporting: boolean;
  invalidDateRange: boolean;
  onReportDaysChange: (value: 1 | 3 | 7) => void;
  onExport: () => void;
}
const CampaignMessageReportHeader: React.FC<
  CampaignMessageReportHeaderProps
> = ({
  fromDate,
  toDate,
  reportDays,
  isExporting,
  invalidDateRange,
  onReportDaysChange,
  onExport,
}) => {
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
          <span>{t('Date Range')}</span>
          <FormControl
            size="small"
            id="campaign-message-report-range-control"
            className="campaign-message-report-range-control"
          >
            <Select
              value={reportDays}
              inputProps={{ 'aria-label': String(t('Date Range')) }}
              onChange={(event) =>
                onReportDaysChange(Number(event.target.value) as 1 | 3 | 7)
              }
              MenuProps={{
                PaperProps: {
                  sx: {
                    fontFamily: 'BalooRegular',
                    '& .MuiMenuItem-root': {
                      minHeight: 30,
                      padding: '6px 12px',
                      fontFamily: 'inherit',
                      fontSize: 13,
                      '&:hover': { backgroundColor: '#f0f4fa' },
                      '&.Mui-selected': {
                        backgroundColor: '#e8f1ff',
                        color: '#1a71f6',
                      },
                    },
                  },
                },
              }}
            >
              <MenuItem value={1}>{t('Last 1 day')}</MenuItem>
              <MenuItem value={3}>{t('Last 3 days')}</MenuItem>
              <MenuItem value={7}>{t('Last 7 days')}</MenuItem>
            </Select>
          </FormControl>
          <span>
            {formatCampaignMessageReportDateControl(fromDate)} –{' '}
            {formatCampaignMessageReportDateControl(toDate)}
          </span>
        </div>
        <div
          id="campaign-message-report-actions"
          className="campaign-message-report-actions"
        >
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
    </header>
  );
};
export default CampaignMessageReportHeader;
