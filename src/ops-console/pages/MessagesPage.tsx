import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Button, IconButton, Typography } from '@mui/material';
import { ArrowBack, Notifications } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { ServiceConfig } from '../../services/ServiceConfig';
import MessagesTargetAudienceSection from '../components/campaignSetup/MessagesTargetAudienceSection';
import { useMessagesAudienceSelection } from '../hooks/useMessagesAudienceSelection';
import MessagesStepper, { MESSAGES_TABS } from './messagesPage/MessagesStepper';
import {
  PushNotificationLivePreview,
  type PushNotificationDraft,
} from './pushNotificationCompose/PushNotificationComposeComponents';
import { PushNotificationFields } from './pushNotificationCompose/PushNotificationComposeForm';
import './MessagesPage.css';
import './PushNotificationComposeForm.css';
import './PushNotificationComposePreview.css';

const MESSAGES_BREADCRUMB = ['Messages', 'New Push Notification'] as const;

const emptyDraft: PushNotificationDraft = {
  label: '',
  title: '',
  body: '',
  imageName: '',
  imageUrl: '',
};

const MessagesPage: React.FC = () => {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [activeTab, setActiveTab] = useState<(typeof MESSAGES_TABS)[number]>(
    MESSAGES_TABS[0],
  );
  const [isAudienceValid, setIsAudienceValid] = useState(false);
  const [draft, setDraft] = useState<PushNotificationDraft>(emptyDraft);
  const [labelOptions, setLabelOptions] = useState<string[]>([]);
  const [loadingLabels, setLoadingLabels] = useState(false);
  const audience = useMessagesAudienceSelection();
  const activeStepIndex = MESSAGES_TABS.indexOf(activeTab);
  const isFirstStep = activeStepIndex === 0;
  const isLastStep = activeStepIndex === MESSAGES_TABS.length - 1;
  const isComposeValid = Boolean(
    draft.label && draft.title.trim() && draft.body.trim(),
  );
  const previewTitle = draft.title.trim() || t('Notification Title');
  const previewBody =
    draft.body.trim() || t('Notification body text will appear here.');
  const audienceSummaryText = useMemo(() => {
    const schoolCount = audience.summarySchoolCount;
    const blockCount = audience.summaryBlockCount;
    const recipientCount = audience.displayRecipientCount;
    return `${blockCount} blocks, ${schoolCount} schools, ${recipientCount} recipients`;
  }, [
    audience.displayRecipientCount,
    audience.summaryBlockCount,
    audience.summarySchoolCount,
  ]);

  useEffect(() => {
    let active = true;
    setLoadingLabels(true);
    // Labels are sourced from previously created campaign notifications.
    const loadLabels = async () => {
      try {
        const labels =
          await ServiceConfig.getI().apiHandler.getCampaignNotificationLabels();
        if (active) setLabelOptions(labels);
      } catch {
        if (active) setLabelOptions([]);
      } finally {
        if (active) setLoadingLabels(false);
      }
    };
    void loadLabels();
    return () => {
      active = false;
    };
  }, []);

  useEffect(
    () => () => {
      if (draft.imageUrl) URL.revokeObjectURL(draft.imageUrl);
    },
    [draft.imageUrl],
  );

  const handleNext = () => {
    if (!isLastStep) {
      setActiveTab(MESSAGES_TABS[activeStepIndex + 1]);
    }
  };

  const handleBack = () => {
    if (!isFirstStep) {
      setActiveTab(MESSAGES_TABS[activeStepIndex - 1]);
    }
  };

  const handleSend = () => {
    setActiveTab(MESSAGES_TABS[MESSAGES_TABS.length - 1]);
  };

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const nextImageUrl = URL.createObjectURL(file);
    setDraft((current) => {
      if (current.imageUrl) URL.revokeObjectURL(current.imageUrl);
      return { ...current, imageUrl: nextImageUrl, imageName: file.name };
    });
  };

  return (
    <main
      id="ops-messages-page"
      className="ops-campaigns-overview messages-page"
      aria-labelledby="ops-messages-page-title"
    >
      <header className="messages-page__header">
        <IconButton
          className="messages-page__mobile-back-button"
          onClick={handleBack}
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
        activeStepIndex={activeStepIndex}
        onStepClick={setActiveTab}
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
              onValidityChange={setIsAudienceValid}
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
                  onDraftChange={setDraft}
                  onImageChange={handleImageChange}
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
            <div className="messages-page__review-card">
              <Typography
                variant="h2"
                className="messages-page__section-heading"
              >
                {t('Review & Send')}
              </Typography>
              <Typography className="messages-page__section-copy">
                {t(
                  'Confirm the audience and content before sending the notification.',
                )}
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
                    {audience.selectedSavedGroup?.name ||
                      t('No saved group selected')}
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
          </section>
        </div>
        <div className="messages-page__actions">
          {!isFirstStep && (
            <Button
              type="button"
              variant="outlined"
              className="messages-page__back-button"
              onClick={handleBack}
            >
              {t('Back')}
            </Button>
          )}
          <Button
            type="button"
            variant="contained"
            className="messages-page__next-button"
            onClick={isLastStep ? handleSend : handleNext}
            disabled={
              (activeTab === 'Select Audience' && !isAudienceValid) ||
              (activeTab === 'Compose Notification' && !isComposeValid)
            }
          >
            {isLastStep ? t('Send') : t('Next')}
          </Button>
        </div>
      </div>
    </main>
  );
};

export default MessagesPage;
