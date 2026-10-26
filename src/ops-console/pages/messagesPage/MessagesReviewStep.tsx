import React from 'react';
import { Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import type { useMessagesAudienceSelection } from '../../hooks/useMessagesAudienceSelection';
import type { PushNotificationDraft } from '../pushNotificationCompose/PushNotificationComposeComponents';

type MessagesReviewStepProps = {
  audience: ReturnType<typeof useMessagesAudienceSelection>;
  audienceSummaryText: string;
  draft: PushNotificationDraft;
};

const MessagesReviewStep: React.FC<MessagesReviewStepProps> = ({
  audience,
  audienceSummaryText,
  draft,
}) => {
  const { t } = useTranslation();

  return (
    <div className="messages-page__review-card">
      <Typography variant="h2" className="messages-page__section-heading">
        {t('Review & Send')}
      </Typography>
      <Typography className="messages-page__section-copy">
        {t('Confirm the audience and content before sending the notification.')}
      </Typography>

      <div className="messages-page__review-grid">
        <div className="messages-page__review-block">
          <Typography className="messages-page__review-label">
            {t('Audience')}
          </Typography>
          <Typography className="messages-page__review-value">
            {audience.selectedProgramName}
          </Typography>
          <Typography className="messages-page__review-meta">
            {audienceSummaryText}
          </Typography>
        </div>

        <div className="messages-page__review-block">
          <Typography className="messages-page__review-label">
            {t('Saved Target Group')}
          </Typography>
          <Typography className="messages-page__review-value">
            {audience.selectedSavedGroup?.name || t('No saved group selected')}
          </Typography>
        </div>

        <div className="messages-page__review-block messages-page__review-block--message">
          <Typography className="messages-page__review-label">
            {t('Message')}
          </Typography>
          <Typography className="messages-page__review-value">
            {draft.title || t('Untitled notification')}
          </Typography>
          <Typography className="messages-page__review-copy">
            {draft.body || t('No message content added yet.')}
          </Typography>
        </div>
      </div>
    </div>
  );
};

export default MessagesReviewStep;
