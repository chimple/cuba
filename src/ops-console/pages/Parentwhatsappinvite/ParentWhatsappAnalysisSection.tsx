import { AssessmentOutlined, SendOutlined } from '@mui/icons-material';
import { Alert, Box, Button, MenuItem, Stack, TextField, Typography } from '@mui/material';
import { t } from 'i18next';
import React from 'react';
import {
  formatProcessedUdiseRows,
  useParentWhatsappInvitationPageLogic,
} from './ParentWhatsappInvitationPageLogic';
import { DataFrameCard, FieldBlock } from './ParentWhatsappInvitationShared';

type ParentWhatsappPageLogic = ReturnType<
  typeof useParentWhatsappInvitationPageLogic
>;

export default function ParentWhatsappAnalysisSection({
  logic,
}: {
  logic: ParentWhatsappPageLogic;
}) {
  const {
    udiseInput,
    setUdiseInput,
    limit,
    setLimit,
    analysisResult,
    analysisFeedback,
    isAnalyzing,
    isSendingSms,
    smsFeedback,
    smsResult,
    inviteLanguages,
    selectedInviteLanguageCode,
    setSelectedInviteLanguageCode,
    handleAnalyze,
    handleSendSmsInvites,
  } = logic;

  return (
    <>
      <div
        id="parent-whatsapp-page-form-area"
        className="parent-whatsapp-page-form-area"
      >
        <FieldBlock label={t('Enter UDISE codes')}>
          <TextField
            multiline
            minRows={4}
            fullWidth
            value={udiseInput}
            onChange={(event) => setUdiseInput(event.target.value)}
            id="parent-whatsapp-page-input"
            className="parent-whatsapp-page-input"
          />
        </FieldBlock>

        <FieldBlock label={t('Message Limit')}>
          <TextField
            type="number"
            fullWidth
            value={limit}
            onChange={(event) => {
              const nextLimit = Number(event.target.value);
              setLimit(
                Number.isFinite(nextLimit) && nextLimit > 0 ? nextLimit : 1,
              );
            }}
            inputProps={{ min: 1 }}
            id="parent-whatsapp-page-input parent-whatsapp-page-input--limit"
            className="parent-whatsapp-page-input parent-whatsapp-page-input--limit"
            InputProps={{
              endAdornment: (
                <Box
                  id="parent-whatsapp-page-limit-stepper"
                  className="parent-whatsapp-page-limit-stepper"
                >
                  <button
                    type="button"
                    id="parent-whatsapp-page-limit-button"
                    className="parent-whatsapp-page-limit-button"
                    onClick={() =>
                      setLimit((currentLimit) =>
                        Math.max(1, currentLimit - 1),
                      )
                    }
                  >
                    -
                  </button>
                  <button
                    type="button"
                    id="parent-whatsapp-page-limit-button"
                    className="parent-whatsapp-page-limit-button"
                    onClick={() => setLimit((currentLimit) => currentLimit + 1)}
                  >
                    +
                  </button>
                </Box>
              ),
            }}
          />
        </FieldBlock>

        <div
          id="parent-whatsapp-page-button-stack"
          className="parent-whatsapp-page-button-stack"
        >
          <Button
            variant="outlined"
            startIcon={<AssessmentOutlined />}
            disabled={isAnalyzing}
            onClick={handleAnalyze}
            id="parent-whatsapp-page-action-button"
            className="parent-whatsapp-page-action-button"
          >
            {t('Run Analysis')}
          </Button>
        </div>

        {analysisFeedback ? (
          <Alert
            severity={analysisFeedback.severity}
            id="parent-whatsapp-page-alert"
            className="parent-whatsapp-page-alert"
          >
            {analysisFeedback.text}
          </Alert>
        ) : null}

        {smsFeedback ? (
          <Alert
            severity={smsFeedback.severity}
            id="parent-whatsapp-page-alert"
            className="parent-whatsapp-page-alert"
          >
            {smsFeedback.text}
          </Alert>
        ) : null}

        {smsResult ? (
          <Stack
            direction="row"
            spacing={1}
            useFlexGap
            flexWrap="wrap"
            id="parent-whatsapp-page-summary"
            className="parent-whatsapp-page-summary"
          >
            <div id="parent-whatsapp-page-summary-pill" className="parent-whatsapp-page-summary-pill">
              {t('Success Count')}: {smsResult.successCount}
            </div>
            <div id="parent-whatsapp-page-summary-pill" className="parent-whatsapp-page-summary-pill">
              {t('Failed Batches')}: {smsResult.failedBatches.length}
            </div>
          </Stack>
        ) : null}
      </div>

      {analysisResult ? (
        <section
          id="parent-whatsapp-page-analysis-output"
          className="parent-whatsapp-page-analysis-output"
        >
          <div
            id="parent-whatsapp-page-processed-block"
            className="parent-whatsapp-page-processed-block"
          >
            <div
              id="parent-whatsapp-page-processed-heading"
              className="parent-whatsapp-page-processed-heading"
            >
              <Typography
                id="parent-whatsapp-page-processed-title"
                className="parent-whatsapp-page-processed-title"
              >
                {t('Processed UDISE')}
              </Typography>
            </div>
            <pre
              id="parent-whatsapp-page-processed-list"
              className="parent-whatsapp-page-processed-list"
            >
              {formatProcessedUdiseRows(analysisResult.processedUdise)}
            </pre>
          </div>

          <div
            id="parent-whatsapp-page-missing-block"
            className="parent-whatsapp-page-missing-block"
          >
            <Typography
              id="parent-whatsapp-page-missing-label"
              className="parent-whatsapp-page-missing-label"
            >
              {t('Total Missing Parents')}
            </Typography>
            <Typography
              id="parent-whatsapp-page-missing-value"
              className="parent-whatsapp-page-missing-value"
            >
              {analysisResult.totalMissing}
            </Typography>
          </div>

          <DataFrameCard
            rows={analysisResult.inviteList}
            columns={[
              { key: 'udise', label: t('UDISE') },
              { key: 'school', label: t('School') },
              { key: 'className', label: t('Class') },
              { key: 'mobile', label: t('Mobile') },
              { key: 'inviteLink', label: t('Invite Link') },
            ]}
            showWhenEmpty
          />

          <TextField
            select
            label={t('Language')}
            value={selectedInviteLanguageCode}
            onChange={(event) =>
              setSelectedInviteLanguageCode(event.target.value)
            }
            id="parent-whatsapp-page-invite-language"
            className="parent-whatsapp-page-invite-language"
          >
            {inviteLanguages.map((language) => (
              <MenuItem key={language.code} value={language.code}>
                {language.name}
              </MenuItem>
            ))}
          </TextField>

          <Button
            variant="outlined"
            startIcon={<SendOutlined />}
            disabled={
              isSendingSms ||
              !analysisResult.inviteList.length ||
              !selectedInviteLanguageCode
            }
            onClick={handleSendSmsInvites}
            id="parent-whatsapp-page-action-button parent-whatsapp-page-analysis-send-button"
            className="parent-whatsapp-page-action-button parent-whatsapp-page-analysis-send-button"
          >
            {t('Send Invitation to Parents')}
          </Button>
        </section>
      ) : null}

      <DataFrameCard
        title={t('Failed Groups')}
        rows={analysisResult?.failedGroups ?? []}
        columns={[
          { key: 'udise', label: t('UDISE') },
          { key: 'school', label: t('School') },
          { key: 'className', label: t('Class') },
          { key: 'groupId', label: t('Group ID') },
          { key: 'error', label: t('Error') },
          { key: 'statusCode', label: t('Status Code') },
        ]}
      />
      <DataFrameCard
        title={t('Failed MSG91 Batches')}
        rows={(smsResult?.failedBatches ?? []).map((failure) => ({
          batchIndex: failure.batchIndex,
          recipients: failure.recipients.join(', '),
          error: failure.error.message,
          statusCode: failure.error.statusCode,
          responseText: failure.error.responseText,
        }))}
        columns={[
          { key: 'batchIndex', label: t('Batch Index') },
          { key: 'recipients', label: t('Recipients') },
          { key: 'error', label: t('Error') },
          { key: 'statusCode', label: t('Status Code') },
          { key: 'responseText', label: t('Response Text') },
        ]}
      />
    </>
  );
}
