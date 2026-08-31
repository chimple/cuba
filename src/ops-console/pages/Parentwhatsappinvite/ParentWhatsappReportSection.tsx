import { Alert, Button, TextField, Typography } from '@mui/material';
import { t } from 'i18next';
import React from 'react';
import { useParentWhatsappInvitationPageLogic } from './ParentWhatsappInvitationPageLogic';
import { DataFrameCard, FieldBlock } from './ParentWhatsappInvitationShared';

type ParentWhatsappPageLogic = ReturnType<
  typeof useParentWhatsappInvitationPageLogic
>;

export default function ParentWhatsappReportSection({
  logic,
}: {
  logic: ParentWhatsappPageLogic;
}) {
  const {
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    reportRows,
    reportFeedback,
    isLoadingReport,
    handleFetchReport,
  } = logic;

  return (
    <>
      <div
        id="parent-whatsapp-page-form-grid parent-whatsapp-page-report-grid"
        className="parent-whatsapp-page-form-grid parent-whatsapp-page-report-grid"
      >
        <FieldBlock label={t('Start Date')}>
          <TextField
            fullWidth
            type="date"
            value={startDate}
            onChange={(event) => setStartDate(event.target.value)}
            id="parent-whatsapp-page-input parent-whatsapp-page-date-input"
            className="parent-whatsapp-page-input parent-whatsapp-page-date-input"
            InputLabelProps={{ shrink: true }}
          />
        </FieldBlock>

        <FieldBlock label={t('End Date')}>
          <TextField
            fullWidth
            type="date"
            value={endDate}
            onChange={(event) => setEndDate(event.target.value)}
            id="parent-whatsapp-page-input parent-whatsapp-page-date-input"
            className="parent-whatsapp-page-input parent-whatsapp-page-date-input"
            InputLabelProps={{ shrink: true }}
          />
        </FieldBlock>
      </div>

      <Button
        variant="outlined"
        disabled={isLoadingReport}
        onClick={handleFetchReport}
        id="parent-whatsapp-page-action-button parent-whatsapp-page-report-button"
        className="parent-whatsapp-page-action-button parent-whatsapp-page-report-button"
      >
        {t('Get Report')}
      </Button>

      {reportFeedback ? (
        <Alert
          severity={reportFeedback.severity}
          id="parent-whatsapp-page-alert"
          className="parent-whatsapp-page-alert"
        >
          {reportFeedback.text}
        </Alert>
      ) : null}

      {reportRows.length > 0 || reportFeedback?.severity === 'success' ? (
        <Typography
          id="parent-whatsapp-page-report-count"
          className="parent-whatsapp-page-report-count"
        >
          {t('Total Count')}: {reportRows.length}
        </Typography>
      ) : null}

      <DataFrameCard title={t('MSG91 Report Rows')} rows={reportRows} />
    </>
  );
}
