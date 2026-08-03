import React, { useMemo, useState } from 'react';
import { Button, IconButton, TextField, Typography } from '@mui/material';
import { ArrowBack, Notifications } from '@mui/icons-material';
import MessagesTargetAudienceSection from '../components/campaignSetup/MessagesTargetAudienceSection';
import { useMessagesAudienceSelection } from '../hooks/useMessagesAudienceSelection';
import './MessagesPage.css';

const MESSAGES_BREADCRUMB = ['Messages', 'New Push Notification'] as const;
const MESSAGES_TABS = [
  'Select Audience',
  'Compose Notification',
  'Review & Send',
] as const;

const MessagesPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<(typeof MESSAGES_TABS)[number]>(
    MESSAGES_TABS[0],
  );
  const [isAudienceValid, setIsAudienceValid] = useState(false);
  const [notificationTitle, setNotificationTitle] = useState('');
  const [notificationMessage, setNotificationMessage] = useState('');
  const audience = useMessagesAudienceSelection();
  const activeStepIndex = MESSAGES_TABS.indexOf(activeTab);
  const isFirstStep = activeStepIndex === 0;
  const isLastStep = activeStepIndex === MESSAGES_TABS.length - 1;
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
          aria-label="Back"
        >
          <ArrowBack />
        </IconButton>
        <div className="messages-page__heading-block">
          <h1 id="ops-messages-page-title">New Push Notification</h1>
          <div className="messages-page__breadcrumb" aria-label="Breadcrumb">
            <span>{MESSAGES_BREADCRUMB[0]}</span>
            <span className="messages-page__breadcrumb-separator">▸</span>
            <strong>{MESSAGES_BREADCRUMB[1]}</strong>
          </div>
        </div>
        <IconButton className="messages-page__notification-button">
          <Notifications />
        </IconButton>
      </header>

      <div className="messages-page__stepper" aria-label="Notification steps">
        <div className="messages-page__stepper-wrap">
          {MESSAGES_TABS.map((step, index) => {
            const isActive = index === activeStepIndex;
            const isComplete = index < activeStepIndex;
            return (
              <React.Fragment key={step}>
                <button
                  type="button"
                  className={`messages-page__step ${
                    isActive ? 'messages-page__step--active' : ''
                  } ${isComplete ? 'messages-page__step--complete' : ''}`}
                  onClick={() => setActiveTab(step)}
                  aria-current={isActive ? 'step' : undefined}
                >
                  <span className="messages-page__step-index">{index + 1}</span>
                  <span className="messages-page__step-label">{step}</span>
                </button>
                {index < MESSAGES_TABS.length - 1 && (
                  <span
                    className="messages-page__step-line"
                    aria-hidden="true"
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

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
            <div className="messages-page__composer-card">
              <Typography
                variant="h2"
                className="messages-page__section-heading"
              >
                Compose Notification
              </Typography>
              <Typography className="messages-page__section-copy">
                Draft the push notification content that will be sent to the
                selected audience.
              </Typography>

              <div className="messages-page__composer-grid">
                <TextField
                  fullWidth
                  label="Notification Title"
                  placeholder="Enter notification title"
                  value={notificationTitle}
                  onChange={(event) => setNotificationTitle(event.target.value)}
                  size="small"
                />
                <TextField
                  fullWidth
                  multiline
                  minRows={8}
                  label="Message"
                  placeholder="Write the notification message"
                  value={notificationMessage}
                  onChange={(event) =>
                    setNotificationMessage(event.target.value)
                  }
                />
              </div>

              <div className="messages-page__composer-preview">
                <Typography className="messages-page__composer-preview-label">
                  Live Preview
                </Typography>
                <div className="messages-page__composer-preview-card">
                  <Typography className="messages-page__composer-preview-title">
                    {notificationTitle || 'Notification title preview'}
                  </Typography>
                  <Typography className="messages-page__composer-preview-copy">
                    {notificationMessage ||
                      'Your notification text will appear here.'}
                  </Typography>
                </div>
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
                Review & Send
              </Typography>
              <Typography className="messages-page__section-copy">
                Confirm the audience and content before sending the
                notification.
              </Typography>

              <div className="messages-page__review-grid">
                <div className="messages-page__review-block">
                  <Typography className="messages-page__review-label">
                    Audience
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
                    Saved Target Group
                  </Typography>
                  <Typography className="messages-page__review-value">
                    {audience.selectedSavedGroup?.name ||
                      'No saved group selected'}
                  </Typography>
                </div>

                <div className="messages-page__review-block messages-page__review-block--message">
                  <Typography className="messages-page__review-label">
                    Message
                  </Typography>
                  <Typography className="messages-page__review-value">
                    {notificationTitle || 'Untitled notification'}
                  </Typography>
                  <Typography className="messages-page__review-copy">
                    {notificationMessage || 'No message content added yet.'}
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
              Back
            </Button>
          )}
          <Button
            type="button"
            variant="contained"
            className="messages-page__next-button"
            onClick={isLastStep ? handleSend : handleNext}
            disabled={activeTab === 'Select Audience' && !isAudienceValid}
          >
            {isLastStep ? 'Send' : 'Next'}
          </Button>
        </div>
      </div>
    </main>
  );
};

export default MessagesPage;
