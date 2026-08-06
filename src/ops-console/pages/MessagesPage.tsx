import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ServiceConfig } from '../../services/ServiceConfig';
import { useTranslation } from 'react-i18next';
import logger from '../../utility/logger';
import { useMessagesAudienceSelection } from '../hooks/useMessagesAudienceSelection';
import MessagesPageView from './MessagesPageView';
import {
  buildAudienceSummaryItems,
  buildCampaignNotificationPayload,
  buildNotificationSummaryItems,
  DeliveryMode,
  getCurrentLocalDateString,
  getCurrentLocalTimePlusOneMinuteString,
  isScheduledTimeInPast,
} from './messagesPage/MessagesPage.helpers';
import { PushNotificationDraft } from './pushNotificationCompose/PushNotificationComposeComponents';

const emptyDraft: PushNotificationDraft = {
  label: '',
  title: '',
  body: '',
  imageName: '',
  imageUrl: '',
};

const RECURRENT_DAYS_ERROR = 'Please choose one or more delivery days.';

const MessagesPage: React.FC = () => {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [activeTab, setActiveTab] = useState<
    'Select Audience' | 'Compose Notification' | 'Review & Send'
  >('Select Audience');
  const [isAudienceValid, setIsAudienceValid] = useState(false);
  const [draft, setDraft] = useState<PushNotificationDraft>(emptyDraft);
  const [labelOptions, setLabelOptions] = useState<string[]>([]);
  const [loadingLabels, setLoadingLabels] = useState(false);
  const [deliveryMode, setDeliveryMode] = useState<DeliveryMode>('recurring');
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [startDate, setStartDate] = useState(getCurrentLocalDateString());
  const [endDate, setEndDate] = useState(getCurrentLocalDateString());
  const [sendTime, setSendTime] = useState(
    getCurrentLocalTimePlusOneMinuteString(),
  );
  const [neverEnds, setNeverEnds] = useState(true);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [sendSuccess, setSendSuccess] = useState(false);
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

  useEffect(() => {
    let active = true;
    setLoadingLabels(true);
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
      setSendTime(getCurrentLocalTimePlusOneMinuteString());
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

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    const nextImageUrl = URL.createObjectURL(file);
    setDraft((current) => {
      if (current.imageUrl) URL.revokeObjectURL(current.imageUrl);
      return { ...current, imageUrl: nextImageUrl, imageName: file.name };
    });
  };

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
      await ServiceConfig.getI().apiHandler.sendCampaignNotification(payload);
      setSendSuccess(true);
    } catch (error) {
      logger.error('Failed to send campaign notification:', error);
      const message = error instanceof Error ? error.message : String(error);
      if (message !== RECURRENT_DAYS_ERROR) setSendError(message);
    } finally {
      setSending(false);
    }
  };

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
      onBack={handleBack}
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
