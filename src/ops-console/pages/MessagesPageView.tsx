import React from 'react';
import { Button, IconButton } from '@mui/material';
import { ArrowBack, Notifications } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import MessagesTargetAudienceSection from '../components/campaignSetup/MessagesTargetAudienceSection';
import type { useMessagesAudienceSelection } from '../hooks/useMessagesAudienceSelection';
import MessagesStepper, { MESSAGES_TABS } from './messagesPage/MessagesStepper';
import MessagesReviewAndSendStep from './messagesPage/MessagesReviewAndSendStep';
import {
  PushNotificationLivePreview,
  type PushNotificationDraft,
} from './pushNotificationCompose/PushNotificationComposeComponents';
import { PushNotificationFields } from './pushNotificationCompose/PushNotificationComposeForm';
import type { DeliveryMode } from './messagesPage/MessagesPage.helpers';
import './MessagesPage.css';
import './PushNotificationComposeForm.css';
import './PushNotificationComposePreview.css';

const MESSAGES_BREADCRUMB = ['Messages', 'New Push Notification'] as const;

type MessagesPageViewProps = {
  activeTab: (typeof MESSAGES_TABS)[number];
  audience: ReturnType<typeof useMessagesAudienceSelection>;
  audienceSummaryItems: Array<{ label: string; value: string }>;
  deliveryDays: string[];
  deliveryMode: DeliveryMode;
  draft: PushNotificationDraft;
  endDate: string;
  endDateError: string | null;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  imageFile: File | null;
  isAudienceValid: boolean;
  isComposeValid: boolean;
  isFirstStep: boolean;
  isLastStep: boolean;
  labelOptions: string[];
  loadingLabels: boolean;
  neverEnds: boolean;
  notificationSummaryItems: Array<{ label: string; value: string }>;
  previewBody: string;
  previewTitle: string;
  recurringDaysError: string | null;
  selectedDays: string[];
  sendError: string | null;
  sendSuccess: boolean;
  sendTime: string;
  sending: boolean;
  startDate: string;
  canSubmitSchedule: boolean;
  onBack: () => void;
  onDeliveryModeChange: (
    event: React.MouseEvent<HTMLElement>,
    nextMode: DeliveryMode | null,
  ) => void;
  onDraftChange: React.Dispatch<React.SetStateAction<PushNotificationDraft>>;
  onEditAudience: () => void;
  onEditNotification: () => void;
  onEndDateChange: React.Dispatch<React.SetStateAction<string>>;
  onImageChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onNext: () => void;
  onNeverEndsChange: React.Dispatch<React.SetStateAction<boolean>>;
  onScheduleSend: () => void;
  onSelectedDaysChange: React.Dispatch<React.SetStateAction<string[]>>;
  onSendNow: () => void;
  onSendTimeChange: React.Dispatch<React.SetStateAction<string>>;
  onStartDateChange: React.Dispatch<React.SetStateAction<string>>;
  onStepClick: (step: (typeof MESSAGES_TABS)[number]) => void;
  onValidityChange: React.Dispatch<React.SetStateAction<boolean>>;
};

const MessagesPageView: React.FC<MessagesPageViewProps> = ({
  activeTab,
  audience,
  audienceSummaryItems,
  deliveryDays,
  deliveryMode,
  draft,
  endDate,
  endDateError,
  fileInputRef,
  imageFile,
  isAudienceValid,
  isComposeValid,
  isFirstStep,
  isLastStep,
  labelOptions,
  loadingLabels,
  neverEnds,
  notificationSummaryItems,
  previewBody,
  previewTitle,
  recurringDaysError,
  selectedDays,
  sendError,
  sendSuccess,
  sendTime,
  sending,
  startDate,
  canSubmitSchedule,
  onBack,
  onDeliveryModeChange,
  onDraftChange,
  onEditAudience,
  onEditNotification,
  onEndDateChange,
  onImageChange,
  onNext,
  onNeverEndsChange,
  onScheduleSend,
  onSelectedDaysChange,
  onSendNow,
  onSendTimeChange,
  onStartDateChange,
  onStepClick,
  onValidityChange,
}) => {
  const { t } = useTranslation();

  return (
    <main
      id="ops-messages-page"
      className="ops-campaigns-overview messages-page"
      aria-labelledby="ops-messages-page-title"
    >
      <header className="messages-page__header">
        <IconButton
          className="messages-page__mobile-back-button"
          onClick={onBack}
          aria-label={String(t('Back'))}
        >
          <ArrowBack />
        </IconButton>
        <div className="messages-page__heading-block">
          <h1 id="ops-messages-page-title">{t('New Push Notification')}</h1>
          <div
            className="messages-page__breadcrumb"
            aria-label={String(t('Breadcrumb'))}
          >
            <span>{t(MESSAGES_BREADCRUMB[0])}</span>
            <span
              className="messages-page__breadcrumb-separator"
              aria-hidden="true"
            />
            <strong>{t(MESSAGES_BREADCRUMB[1])}</strong>
          </div>
        </div>
        <IconButton className="messages-page__notification-button">
          <Notifications />
        </IconButton>
      </header>

      <MessagesStepper
        activeStepIndex={MESSAGES_TABS.indexOf(activeTab)}
        onStepClick={onStepClick}
      />

      <div className="ops-campaigns-overview-content messages-page__content">
        <div className="messages-page__shell">
          <section
            className="messages-page__tab-panel"
            aria-hidden={activeTab !== 'Select Audience'}
            hidden={activeTab !== 'Select Audience'}
          >
            <MessagesTargetAudienceSection
              audience={audience}
              onValidityChange={onValidityChange}
            />
          </section>

          <section
            className="messages-page__tab-panel"
            aria-hidden={activeTab !== 'Compose Notification'}
            hidden={activeTab !== 'Compose Notification'}
          >
            <div className="messages-page__compose-shell">
              <div className="messages-page__compose-grid">
                <PushNotificationFields
                  draft={draft}
                  fileInputRef={fileInputRef}
                  labelOptions={labelOptions}
                  loadingLabels={loadingLabels}
                  onDraftChange={onDraftChange}
                  onImageChange={onImageChange}
                />
                <PushNotificationLivePreview
                  title={previewTitle}
                  body={previewBody}
                  imageUrl={draft.imageUrl}
                />
              </div>
            </div>
          </section>

          <section
            className="messages-page__tab-panel"
            aria-hidden={activeTab !== 'Review & Send'}
            hidden={activeTab !== 'Review & Send'}
          >
            <MessagesReviewAndSendStep
              audienceSummaryItems={audienceSummaryItems}
              deliveryDays={deliveryDays}
              deliveryMode={deliveryMode}
              draft={draft}
              neverEnds={neverEnds}
              notificationSummaryItems={notificationSummaryItems}
              previewBody={previewBody}
              previewTitle={previewTitle}
              selectedDays={selectedDays}
              sendTime={sendTime}
              startDate={startDate}
              endDate={endDate}
              sending={sending}
              sendError={sendError}
              sendSuccess={sendSuccess}
              endDateError={endDateError}
              recurringDaysError={recurringDaysError}
              canSubmitSchedule={canSubmitSchedule}
              onEditAudience={onEditAudience}
              onEditNotification={onEditNotification}
              onBack={onBack}
              onSendNow={onSendNow}
              onScheduleSend={onScheduleSend}
              onDeliveryModeChange={onDeliveryModeChange}
              onSelectedDaysChange={onSelectedDaysChange}
              onNeverEndsChange={onNeverEndsChange}
              onStartDateChange={onStartDateChange}
              onEndDateChange={onEndDateChange}
              onSendTimeChange={onSendTimeChange}
            />
          </section>
        </div>
        {!isLastStep && (
          <div className="messages-page__actions">
            {!isFirstStep && (
              <Button
                type="button"
                variant="outlined"
                className="messages-page__back-button"
                onClick={onBack}
              >
                {t('Back')}
              </Button>
            )}
            <Button
              type="button"
              variant="contained"
              className="messages-page__next-button"
              onClick={onNext}
              disabled={
                (activeTab === 'Select Audience' && !isAudienceValid) ||
                (activeTab === 'Compose Notification' && !isComposeValid)
              }
            >
              {t('Next')}
            </Button>
          </div>
        )}
      </div>
    </main>
  );
};

export default MessagesPageView;
