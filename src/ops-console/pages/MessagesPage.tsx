import React, { useMemo, useRef, useState } from 'react';
import { useIonToast } from '@ionic/react';
import { ServiceConfig } from '../../services/ServiceConfig';
import { useTranslation } from 'react-i18next';
import { useMessagesAudienceSelection } from '../hooks/useMessagesAudienceSelection';
import logger from '../../utility/logger';
import {
  buildAudienceSummaryItems,
  buildCampaignNotificationPayload,
  buildNotificationSummaryItems,
  DeliveryMode,
  getCurrentLocalDateString,
  getCurrentLocalHourPlusOneString,
  isScheduledTimeInPast,
} from './messagesPage/MessagesPage.helpers';
import { PushNotificationDraft } from './pushNotificationCompose/PushNotificationComposeComponents';
import MessagesPageView from './MessagesPageView';
import { MessagesListing } from './messagesPage/MessagesListing';
import { MessageOverview } from './messagesPage/MessageOverview';
import { useMessagesListingData } from './messagesPage/useMessagesListingData';
import { createImageChangeHandler } from './messagesPage/messagesImage.helpers';
import { useDraftImageCleanup } from './messagesPage/useDraftImageCleanup';
import type { CampaignNotificationListItem } from '../../services/api/ServiceApi';
import {
  getOpsErrorMessage,
  showOpsFailureToast,
  showOpsSuccessToast,
} from '../OpsUtility/OpsToastUtil';
import './MessagesPage.css';
import './PushNotificationComposeForm.css';
import './PushNotificationComposePreview.css';

const emptyDraft: PushNotificationDraft = {
  label: '',
  title: '',
  body: '',
  imageName: '',
  imageUrl: '',
};

const RECURRENT_DAYS_ERROR = 'Please choose one or more delivery days.';
const PUSH_NOTIFICATION_FAILURE_FALLBACK =
  'Failed to send notification. Please try again.';

const MessagesPage: React.FC = () => {
  const { t } = useTranslation();
  const [presentToast] = useIonToast();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [activeTab, setActiveTab] = useState<
    'Select Audience' | 'Compose Notification' | 'Review & Send'
  >('Select Audience');
  const [isAudienceValid, setIsAudienceValid] = useState(false);
  const [draft, setDraft] = useState<PushNotificationDraft>(emptyDraft);
  const [deliveryMode, setDeliveryMode] = useState<DeliveryMode>('send_now');
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [startDate, setStartDate] = useState(getCurrentLocalDateString());
  const [endDate, setEndDate] = useState(getCurrentLocalDateString());
  const [sendTime, setSendTime] = useState(getCurrentLocalHourPlusOneString());
  const [neverEnds, setNeverEnds] = useState(true);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [sendSuccess, setSendSuccess] = useState(false);
  const [view, setView] = useState<'list' | 'compose' | 'overview'>('list');
  const [selectedMessage, setSelectedMessage] =
    useState<CampaignNotificationListItem | null>(null);
  const {
    labelOptions,
    loadingLabels,
    loadMessages,
    messages,
    messagesLoading,
  } = useMessagesListingData();
  const audience = useMessagesAudienceSelection();
  const activeStepIndex = [
    'Select Audience',
    'Compose Notification',
    'Review & Send',
  ].indexOf(activeTab);
  const isFirstStep = activeStepIndex === 0;
  const isLastStep = activeStepIndex === 2;
  const isComposeValid = Boolean(
    draft.label && draft.title.trim() && draft.body.trim(),
  );
  const previewTitle = draft.title.trim() || t('Notification Title');
  const previewBody =
    draft.body.trim() || t('Notification body text will appear here.');
  const recurringEndDateError = useMemo(() => {
    if (
      deliveryMode === 'recurring' &&
      !neverEnds &&
      startDate &&
      endDate &&
      new Date(endDate).getTime() < new Date(startDate).getTime()
    ) {
      return 'End date must be on or after the start date.';
    }
    return null;
  }, [deliveryMode, endDate, neverEnds, startDate]);
  const recurringDaysError =
    deliveryMode === 'recurring' && selectedDays.length === 0
      ? RECURRENT_DAYS_ERROR
      : null;
  const todayLocalDate = getCurrentLocalDateString();
  const scheduleTimeError =
    deliveryMode === 'schedule' &&
    startDate &&
    sendTime &&
    startDate === todayLocalDate &&
    isScheduledTimeInPast(startDate, sendTime);
  const audienceSummaryItems = useMemo(
    () => buildAudienceSummaryItems(audience),
    [audience],
  );
  const notificationSummaryItems = useMemo(
    () => buildNotificationSummaryItems(draft),
    [draft],
  );
  const deliveryDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  useDraftImageCleanup(draft.imageUrl);

  const handleNext = () => {
    if (!isLastStep)
      setActiveTab(
        (['Select Audience', 'Compose Notification', 'Review & Send'] as const)[
          activeStepIndex + 1
        ],
      );
  };

  const handleBack = () => {
    if (!isFirstStep)
      setActiveTab(
        (['Select Audience', 'Compose Notification', 'Review & Send'] as const)[
          activeStepIndex - 1
        ],
      );
  };

  const handleDeliveryModeChange = (
    _event: React.MouseEvent<HTMLElement>,
    nextMode: DeliveryMode | null,
  ) => {
    if (!nextMode) return;
    setDeliveryMode(nextMode);
    if (nextMode === 'schedule') {
      setSendTime(getCurrentLocalHourPlusOneString());
      setStartDate((current) =>
        current && current >= getCurrentLocalDateString()
          ? current
          : getCurrentLocalDateString(),
      );
    }
    if (nextMode === 'recurring') {
      setStartDate((current) =>
        current && current >= getCurrentLocalDateString()
          ? current
          : getCurrentLocalDateString(),
      );
      setEndDate((current) =>
        current && current >= getCurrentLocalDateString()
          ? current
          : getCurrentLocalDateString(),
      );
    }
  };

  const handleImageChange = createImageChangeHandler(setImageFile, setDraft);

  const handleSendAction = async () => {
    setSendError(null);
    setSending(true);
    try {
      const payload = await buildCampaignNotificationPayload({
        audience,
        draft,
        deliveryMode,
        imageFile,
        selectedDays,
        startDate,
        sendTime,
        endDate,
        neverEnds,
        isComposeValid,
        recurringEndDateError,
        uploadPushNotificationImage:
          ServiceConfig.getI().apiHandler.uploadPushNotificationImage.bind(
            ServiceConfig.getI().apiHandler,
          ),
      });
      const notificationId =
        await ServiceConfig.getI().apiHandler.sendCampaignNotification(payload);
      if (!notificationId || !notificationId.trim()) {
        throw new Error(PUSH_NOTIFICATION_FAILURE_FALLBACK);
      }
      const successMessage =
        deliveryMode === 'send_now'
          ? t('The Notification has been sent successfully.')
          : t('The Notification has been scheduled successfully.');
      setSendSuccess(true);
      setView('list');
      await loadMessages();
      await showOpsSuccessToast(presentToast, successMessage);
    } catch (error) {
      logger.error('Failed to send campaign notification:', error);
      const message = getOpsErrorMessage(
        error,
        PUSH_NOTIFICATION_FAILURE_FALLBACK,
      );
      if (message !== RECURRENT_DAYS_ERROR) {
        setSendError(message);
        await showOpsFailureToast(presentToast, message);
      }
    } finally {
      setSending(false);
    }
  };

  if (view === 'list') {
    return (
      <MessagesListing
        messages={messages}
        loading={messagesLoading}
        onCreate={() => {
          setSendSuccess(false);
          setActiveTab('Select Audience');
          setView('compose');
        }}
        onOpen={(message) => {
          setSelectedMessage(message);
          setView('overview');
        }}
      />
    );
  }

  if (view === 'overview' && selectedMessage) {
    return (
      <MessageOverview
        message={selectedMessage}
        onBack={() => setView('list')}
      />
    );
  }

  return (
    <MessagesPageView
      activeTab={activeTab}
      audience={audience}
      audienceSummaryItems={audienceSummaryItems}
      deliveryDays={deliveryDays}
      deliveryMode={deliveryMode}
      draft={draft}
      endDate={endDate}
      endDateError={recurringEndDateError}
      fileInputRef={fileInputRef}
      imageFile={imageFile}
      isAudienceValid={isAudienceValid}
      isComposeValid={isComposeValid}
      isFirstStep={isFirstStep}
      isLastStep={isLastStep}
      labelOptions={labelOptions}
      loadingLabels={loadingLabels}
      neverEnds={neverEnds}
      notificationSummaryItems={notificationSummaryItems}
      previewBody={previewBody}
      previewTitle={previewTitle}
      recurringDaysError={recurringDaysError}
      selectedDays={selectedDays}
      sendError={sendError}
      sendSuccess={sendSuccess}
      sendTime={sendTime}
      sending={sending}
      startDate={startDate}
      canSubmitSchedule={!scheduleTimeError}
      onBack={() => (isFirstStep ? setView('list') : handleBack())}
      onDeliveryModeChange={handleDeliveryModeChange}
      onDraftChange={setDraft}
      onEditAudience={() => setActiveTab('Select Audience')}
      onEditNotification={() => setActiveTab('Compose Notification')}
      onEndDateChange={setEndDate}
      onImageChange={handleImageChange}
      onNext={handleNext}
      onNeverEndsChange={setNeverEnds}
      onScheduleSend={handleSendAction}
      onSelectedDaysChange={setSelectedDays}
      onSendNow={handleSendAction}
      onSendTimeChange={setSendTime}
      onStartDateChange={setStartDate}
      onStepClick={setActiveTab}
      onValidityChange={setIsAudienceValid}
    />
  );
};

export default MessagesPage;
