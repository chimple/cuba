import React from 'react';
import { Box, Button, Typography } from '@mui/material';
import { ArrowBack, ChevronRight, Notifications } from '@mui/icons-material';
import { t } from 'i18next';

export const PUSH_NOTIFICATION_STEPS = [
  'Select Audience',
  'Compose Notification',
  'Review & Send',
];
export const TITLE_LIMIT = 60;
export const BODY_LIMIT = 180;

export type PushNotificationDraft = {
  label: string;
  title: string;
  body: string;
  imageUrl: string;
  imageName: string;
};

export const getStepFromSearch = (search: string) => {
  const step = Number(new URLSearchParams(search).get('step') ?? 2);
  return Number.isInteger(step) && step >= 1 && step <= 3 ? step : 2;
};

export const PushNotificationHeader = ({ onBack }: { onBack: () => void }) => (
  <Box className="push-notification-header">
    <Button
      className="push-notification-header-back"
      startIcon={<ArrowBack />}
      onClick={onBack}
    >
      {t('Campaigns')}
    </Button>
    <Box>
      <Typography variant="h4" className="push-notification-title">
        {t('New Push Notification')}
      </Typography>
      <Box className="push-notification-breadcrumb">
        <span>{t('Campaigns')}</span>
        <ChevronRight className="push-notification-breadcrumb-icon" />
        <strong>{t('New Push Notification')}</strong>
      </Box>
    </Box>
    <Notifications className="push-notification-bell" />
  </Box>
);

export const PushNotificationLivePreview = ({
  body,
  imageUrl,
  title,
}: {
  body: string;
  imageUrl: string;
  title: string;
}) => (
  <Box className="push-notification-preview-card">
    <Box className="push-notification-device">
      <Box className="push-notification-card">
        <Box className="push-notification-device-status">
          <span>9:41</span>
          <span>••••</span>
        </Box>
        <Box className="push-notification-content">
          <Box className="push-notification-app-row">
            <span className="push-notification-app-icon">
              <img
                alt=""
                data-testid="push-notification-preview-app-icon"
                src="/assets/icons/ChimpLogo.png"
              />
            </span>
            <span>{t('Chimple')}</span>
            <small>{t('now')}</small>
          </Box>
          <Box className="push-notification-preview-copy">
            <strong>{title}</strong>
            <p>{body}</p>
            {imageUrl ? (
              <img
                className="push-notification-preview-image"
                src={imageUrl}
                alt={String(t('Image Preview'))}
              />
            ) : (
              <Box
                className="push-notification-preview-image-placeholder"
                data-testid="push-notification-preview-image-placeholder"
              />
            )}
          </Box>
        </Box>
      </Box>
    </Box>
    <Typography className="push-notification-preview-title">
      {t('Live Preview')}
    </Typography>
    <Typography className="push-notification-preview-note">
      {t(
        'Preview is illustrative. Final appearance may vary depending on the device and operating system.',
      )}
    </Typography>
  </Box>
);

export const PushNotificationStepPlaceholder = ({
  draft,
  step,
}: {
  draft: PushNotificationDraft;
  step: 1 | 3;
}) => (
  <Box className="push-notification-placeholder-step">
    <Typography className="push-notification-placeholder-title">
      {t(step === 1 ? 'Select Audience' : 'Review & Send')}
    </Typography>
    <Typography className="push-notification-placeholder-copy">
      {t(
        step === 1
          ? 'Audience selection will connect here.'
          : 'Review screen placeholder for checking step navigation.',
      )}
    </Typography>
    {step === 3 && (
      <Box className="push-notification-review-card">
        <strong>{draft.label || t('No label selected')}</strong>
        <span>{draft.title || t('Notification Title')}</span>
        <p>{draft.body || t('Notification body text will appear here.')}</p>
      </Box>
    )}
  </Box>
);
