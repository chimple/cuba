import React from 'react';
import { Button, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import {
  PushNotificationLivePreview,
  type PushNotificationDraft,
} from '../pushNotificationCompose/PushNotificationComposeComponents';
import MessagesReviewAndSendSummary from './MessagesReviewAndSendSummary';
import MessagesReviewAndSendDelivery from './MessagesReviewAndSendDelivery';
import type { DeliveryMode } from './MessagesPage.helpers';
import './MessagesReviewAndSendStep.css';

type SummaryItem = { label: string; value: string };

type MessagesReviewAndSendStepProps = {
  audienceSummaryItems: SummaryItem[];
  deliveryDays: string[];
  deliveryMode: DeliveryMode;
  draft: PushNotificationDraft;
  neverEnds: boolean;
  notificationSummaryItems: SummaryItem[];
  previewBody: string;
  previewTitle: string;
  selectedDays: string[];
  sendTime: string;
  startDate: string;
  endDate: string;
  onEditAudience: () => void;
  onEditNotification: () => void;
  onBack: () => void;
  onSendNow: () => void;
  onScheduleSend: () => void;
  sending?: boolean;
  sendError?: string | null;
  sendSuccess?: boolean;
  endDateError?: string | null;
  recurringDaysError?: string | null;
  canSubmitSchedule?: boolean;
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

const MessagesReviewAndSendStep: React.FC<MessagesReviewAndSendStepProps> = ({
  audienceSummaryItems,
  deliveryDays,
  deliveryMode,
  draft,
  neverEnds,
  notificationSummaryItems,
  previewBody,
  previewTitle,
  selectedDays,
  sendTime,
  startDate,
  endDate,
  onEditAudience,
  onEditNotification,
  onBack,
  onSendNow,
  onScheduleSend,
  sending = false,
  sendError = null,
  sendSuccess = false,
  endDateError = null,
  recurringDaysError = null,
  canSubmitSchedule = true,
  onDeliveryModeChange,
  onSelectedDaysChange,
  onNeverEndsChange,
  onStartDateChange,
  onEndDateChange,
  onSendTimeChange,
}) => {
  const { t } = useTranslation();

  return (
    <>
      <div className="messages-review-send__layout">
        <MessagesReviewAndSendSummary
          audienceSummaryItems={audienceSummaryItems}
          notificationSummaryItems={notificationSummaryItems}
          notificationImageUrl={draft.imageUrl}
          onEditAudience={onEditAudience}
          onEditNotification={onEditNotification}
        />

        <aside className="messages-review-send__preview-column">
          <div className="messages-review-send__preview">
            <PushNotificationLivePreview
              title={previewTitle}
              body={previewBody}
              imageUrl={draft.imageUrl}
            />
          </div>
        </aside>

        <MessagesReviewAndSendDelivery
          deliveryDays={deliveryDays}
          deliveryMode={deliveryMode}
          neverEnds={neverEnds}
          recurringDaysError={recurringDaysError}
          selectedDays={selectedDays}
          sendTime={sendTime}
          startDate={startDate}
          endDate={endDate}
          endDateError={endDateError}
          canSubmitSchedule={canSubmitSchedule}
          onDeliveryModeChange={onDeliveryModeChange}
          onSelectedDaysChange={onSelectedDaysChange}
          onNeverEndsChange={onNeverEndsChange}
          onStartDateChange={onStartDateChange}
          onSendTimeChange={onSendTimeChange}
          onEndDateChange={onEndDateChange}
        />
      </div>

      <div className="messages-review-send__actions">
        <div className="messages-review-send__actions-left">
          <Button
            type="button"
            variant="outlined"
            className="messages-review-send__back-button"
            onClick={onBack}
          >
            {t('Back')}
          </Button>
        </div>
        <div className="messages-review-send__actions-right">
          {sendError && sendError !== recurringDaysError && (
            <Typography
              className="messages-review-send__send-error"
              role="alert"
            >
              {sendError}
            </Typography>
          )}
          <Button
            type="button"
            variant="contained"
            className="messages-review-send__primary-button"
            disabled={
              sending ||
              sendSuccess ||
              (deliveryMode === 'schedule' && !canSubmitSchedule)
            }
            onClick={deliveryMode === 'schedule' ? onScheduleSend : onSendNow}
          >
            {sending
              ? t('Sending...')
              : deliveryMode === 'send_now'
                ? t('Send')
                : deliveryMode === 'schedule'
                  ? t('Schedule')
                  : t('Create Recurring Notification')}
          </Button>
        </div>
      </div>
    </>
  );
};

export default MessagesReviewAndSendStep;
