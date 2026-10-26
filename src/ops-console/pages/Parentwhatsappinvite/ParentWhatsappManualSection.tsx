import {
  ForumOutlined,
  SendOutlined,
} from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  LinearProgress,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { t } from 'i18next';
import React from 'react';
import { useParentWhatsappInvitationPageLogic } from './ParentWhatsappInvitationPageLogic';
import { DataFrameCard, FieldBlock } from './ParentWhatsappInvitationShared';
import ParentWhatsappUploadField from './ParentWhatsappUploadField';

type ParentWhatsappPageLogic = ReturnType<
  typeof useParentWhatsappInvitationPageLogic
>;

export default function ParentWhatsappManualSection({
  logic,
}: {
  logic: ParentWhatsappPageLogic;
}) {
  const {
    phoneInput,
    setPhoneInput,
    whatsappPhoneLimit,
    isWhatsappPhoneLimitInvalid,
    handleWhatsappPhoneLimitChange,
    handleWhatsappPhoneLimitFocus,
    handleWhatsappPhoneLimitBlur,
    templateName,
    setTemplateName,
    templateLang,
    setTemplateLang,
    messageType,
    setMessageType,
    manualValidation,
    manualFeedback,
    isSendingWhatsapp,
    whatsappProgress,
    manualSendSummary,
    handleSendWhatsapp,
  } = logic;

  return (
    <>
      <div
        id="parent-whatsapp-page-section-heading"
        className="parent-whatsapp-page-section-heading"
      >
        <ForumOutlined
          id="parent-whatsapp-page-section-icon"
          className="parent-whatsapp-page-section-icon"
        />
        <Typography
          id="parent-whatsapp-page-section-title-main"
          className="parent-whatsapp-page-section-title-main"
        >
          {t('Send WhatsApp messages to parents')}
        </Typography>
      </div>

      <div
        id="parent-whatsapp-page-info-banner"
        className="parent-whatsapp-page-info-banner"
      >
        {t('Send WhatsApp template messages with optional header media.')}
      </div>

      <div
        id="parent-whatsapp-page-form-area"
        className="parent-whatsapp-page-form-area"
      >
        <FieldBlock
          label={t('Enter phone numbers (one per line or comma-separated)')}
        >
          <TextField
            multiline
            minRows={4}
            fullWidth
            value={phoneInput}
            onChange={(event) => setPhoneInput(event.target.value)}
            id="parent-whatsapp-page-input"
            className="parent-whatsapp-page-input"
          />
        </FieldBlock>

        <FieldBlock label={t('Phone Number Limit')}>
          <TextField
            type="number"
            fullWidth
            value={whatsappPhoneLimit}
            error={isWhatsappPhoneLimitInvalid}
            onChange={(event) =>
              handleWhatsappPhoneLimitChange(event.target.value)
            }
            onFocus={handleWhatsappPhoneLimitFocus}
            onBlur={handleWhatsappPhoneLimitBlur}
            id="parent-whatsapp-page-input"
            className="parent-whatsapp-page-input"
            inputProps={{ min: 0 }}
          />
        </FieldBlock>

        <FieldBlock label={t('Template Name')}>
          <TextField
            fullWidth
            value={templateName}
            onChange={(event) => setTemplateName(event.target.value)}
            id="parent-whatsapp-page-input"
            className="parent-whatsapp-page-input"
          />
        </FieldBlock>

        <FieldBlock label={t('Template Language Code (hi/en/kn)')}>
          <TextField
            fullWidth
            value={templateLang}
            onChange={(event) => setTemplateLang(event.target.value)}
            id="parent-whatsapp-page-input"
            className="parent-whatsapp-page-input"
          />
        </FieldBlock>

        <FieldBlock label={t('Message Type')}>
          <TextField
            select
            fullWidth
            value={messageType}
            onChange={(event) =>
              setMessageType(event.target.value as 'utility' | 'marketing')
            }
            id="parent-whatsapp-page-input"
            className="parent-whatsapp-page-input"
          >
            <MenuItem value="utility">{t('utility')}</MenuItem>
            <MenuItem value="marketing">{t('marketing')}</MenuItem>
          </TextField>
        </FieldBlock>

        <ParentWhatsappUploadField logic={logic} />
      </div>

      <Button
        variant="outlined"
        startIcon={<SendOutlined />}
        disabled={isSendingWhatsapp}
        onClick={handleSendWhatsapp}
        id="parent-whatsapp-page-action-button"
        className="parent-whatsapp-page-action-button"
      >
        {t('Send WhatsApp Message')}
      </Button>

      {isSendingWhatsapp || whatsappProgress > 0 ? (
        <Box id="parent-whatsapp-page-progress" className="parent-whatsapp-page-progress">
          <LinearProgress variant="determinate" value={whatsappProgress} />
          <Typography
            id="parent-whatsapp-page-progress-text"
            className="parent-whatsapp-page-progress-text"
          >
            {t('{{value}}% complete', { value: whatsappProgress })}
          </Typography>
        </Box>
      ) : null}

      {manualFeedback ? (
        <Alert
          severity={manualFeedback.severity}
          id="parent-whatsapp-page-alert"
          className="parent-whatsapp-page-alert"
        >
          {manualFeedback.text}
        </Alert>
      ) : null}

      {manualSendSummary ? (
        <Stack
          direction="row"
          spacing={1}
          useFlexGap
          flexWrap="wrap"
          id="parent-whatsapp-page-summary"
          className="parent-whatsapp-page-summary"
        >
          <div id="parent-whatsapp-page-summary-pill" className="parent-whatsapp-page-summary-pill">
            {t('Attempted')}: {manualSendSummary.attempted}
          </div>
          <div id="parent-whatsapp-page-summary-pill" className="parent-whatsapp-page-summary-pill">
            {t('Success')}: {manualSendSummary.successCount}
          </div>
          <div id="parent-whatsapp-page-summary-pill" className="parent-whatsapp-page-summary-pill">
            {t('Failed')}: {manualSendSummary.failed.length}
          </div>
        </Stack>
      ) : null}

      <DataFrameCard
        title={t('Invalid Numbers')}
        rows={manualValidation.invalid.map((value) => ({ number: value }))}
        columns={[{ key: 'number', label: t('Number') }]}
      />
      <DataFrameCard
        title={t('Duplicate Numbers')}
        rows={manualValidation.duplicates.map((value) => ({ number: value }))}
        columns={[{ key: 'number', label: t('Number') }]}
      />
      <DataFrameCard
        title={t('WhatsApp Failures')}
        rows={(manualSendSummary?.failed ?? []).map((failure) => ({
          mobile: failure.mobile,
          reason: failure.error.message,
          statusCode: failure.error.statusCode,
          responseText: failure.error.responseText,
        }))}
        columns={[
          { key: 'mobile', label: t('Mobile') },
          { key: 'reason', label: t('Reason') },
          { key: 'statusCode', label: t('Status Code') },
          { key: 'responseText', label: t('Response Text') },
        ]}
      />
    </>
  );
}
