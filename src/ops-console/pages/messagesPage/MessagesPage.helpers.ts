import type { CampaignNotificationPayload } from '../../../services/api/ServiceApi';
import type { PushNotificationDraft } from '../pushNotificationCompose/PushNotificationComposeComponents';

export type DeliveryMode = 'send_now' | 'schedule' | 'recurring';

const getLocalIsoDateString = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const getCurrentLocalDateString = () => getLocalIsoDateString();

export const getCurrentLocalTimeString = () =>
  new Date().toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

export const getCurrentLocalHourString = () => {
  const now = new Date();
  const hour = now.getHours();
  const period = hour >= 12 ? 'PM' : 'AM';
  const normalizedHour = hour % 12 === 0 ? 12 : hour % 12;
  return `${String(normalizedHour).padStart(2, '0')}:00 ${period}`;
};

export const getCurrentLocalHourPlusOneString = () => {
  const now = new Date();
  const nextHour = (now.getHours() + 1) % 24;
  const period = nextHour >= 12 ? 'PM' : 'AM';
  const normalizedHour = nextHour % 12 === 0 ? 12 : nextHour % 12;
  return `${String(normalizedHour).padStart(2, '0')}:00 ${period}`;
};

export const getCurrentLocalTimePlusOneMinuteString = () => {
  const nextMinute = new Date(Date.now() + 60 * 1000);
  return nextMinute.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
};

export const formatLocalDisplayDate = (value: string) => {
  if (!value) return '';
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  const day = String(date.getDate()).padStart(2, '0');
  const month = date.toLocaleString('en-US', { month: 'short' });
  const year = date.getFullYear();
  return `${day} ${month} ${year}`;
};

const parseLocalTimeToMinutes = (time: string) => {
  const match = time.trim().match(/^(\d{1,2}):(\d{2})\s?(AM|PM)$/i);
  if (!match) return null;
  let hour = Number(match[1]);
  const minute = Number(match[2]);
  const period = match[3].toUpperCase();

  if (hour < 1 || hour > 12 || minute < 0 || minute > 59) return null;
  if (period === 'AM') {
    hour = hour === 12 ? 0 : hour;
  } else {
    hour = hour === 12 ? 12 : hour + 12;
  }

  return hour * 60 + minute;
};

const isDateToday = (dateString: string) =>
  dateString === getCurrentLocalDateString();

export const isScheduledTimeInPast = (
  dateString: string,
  timeString: string,
) => {
  if (!isDateToday(dateString)) return false;

  const selectedMinutes = parseLocalTimeToMinutes(timeString);
  if (selectedMinutes == null) return false;

  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  return selectedMinutes <= currentMinutes;
};

export const isTimeOptionInPast = (
  dateString: string,
  hour: string,
  period: 'AM' | 'PM',
) => {
  if (!isDateToday(dateString)) return false;

  const parsedHour = Number(hour);
  if (Number.isNaN(parsedHour) || parsedHour < 1 || parsedHour > 12) {
    return false;
  }

  let normalizedHour = parsedHour;
  if (period === 'AM') {
    normalizedHour = parsedHour === 12 ? 0 : parsedHour;
  } else {
    normalizedHour = parsedHour === 12 ? 12 : parsedHour + 12;
  }

  const selectedMinutes = normalizedHour * 60;
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  return selectedMinutes <= currentMinutes;
};

export const hasFutureTimesForPeriod = (
  dateString: string,
  period: 'AM' | 'PM',
) => {
  if (!isDateToday(dateString)) return true;
  return Array.from({ length: 12 }, (_, index) =>
    String(index + 1).padStart(2, '0'),
  ).some((hour) => !isTimeOptionInPast(dateString, hour, period));
};

export const buildAudienceSummaryItems = (audience: {
  selectedProgramName: string;
  selectedBlocks: string[];
  selectedGrades: Array<{ id: string; name: string }>;
  summarySchoolCount: number;
  userType: string;
  activityRecency: 'all' | 'active_7days' | 'inactive_7days';
  displayRecipientCount: number | null;
}) => [
  { label: 'Program', value: audience.selectedProgramName || '-' },
  {
    label: 'Selected Blocks',
    value:
      audience.selectedBlocks.length > 0
        ? `${audience.selectedBlocks.length} Selected`
        : '-',
  },
  { label: 'Number of Schools', value: String(audience.summarySchoolCount) },
  {
    label: 'Selected Grades',
    value:
      audience.selectedGrades.length > 0
        ? audience.selectedGrades.map((grade) => grade.name).join(', ')
        : '-',
  },
  { label: 'User Type', value: audience.userType },
  {
    label: 'Activity Recency',
    value:
      audience.activityRecency === 'active_7days'
        ? 'Active within last 7 days'
        : audience.activityRecency === 'inactive_7days'
          ? 'Inactive within last 7 days'
          : 'All activity',
  },
  {
    label: 'Estimated Recipient Count',
    value: String(audience.displayRecipientCount ?? 0),
  },
];

export const buildNotificationSummaryItems = (draft: PushNotificationDraft) => [
  { label: 'Label', value: draft.label || '-' },
  { label: 'Notification Title', value: draft.title || '-' },
  { label: 'Notification Body', value: draft.body || '-' },
  {
    label: 'Attached Image',
    value: draft.imageUrl ? 'Attached' : 'Not attached',
  },
];

export const buildCampaignNotificationPayload = async ({
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
  uploadPushNotificationImage,
}: {
  audience: {
    programId: string;
    userType: 'principal' | 'teacher' | 'student';
    activityRecency: 'all' | 'active_7days' | 'inactive_7days';
    isAllSchools: boolean;
    selectedSchools: Array<{ id: string }>;
    isAllGrades: boolean;
    selectedGrades: Array<{ id: string }>;
  };
  draft: PushNotificationDraft;
  deliveryMode: DeliveryMode;
  imageFile: File | null;
  selectedDays: string[];
  startDate: string;
  sendTime: string;
  endDate: string;
  neverEnds: boolean;
  isComposeValid: boolean;
  recurringEndDateError: string | null;
  uploadPushNotificationImage: (file: File) => Promise<string>;
}): Promise<CampaignNotificationPayload> => {
  if (!audience.programId) throw new Error('Program is required.');
  if (!isComposeValid) throw new Error('Notification content is incomplete.');
  if (deliveryMode === 'schedule' && !startDate) {
    throw new Error('Please choose a send date.');
  }
  if (deliveryMode !== 'send_now' && !`${startDate}`.trim()) {
    throw new Error('Please choose a send time.');
  }
  if (
    deliveryMode !== 'send_now' &&
    isScheduledTimeInPast(startDate, sendTime)
  ) {
    throw new Error('Please choose a future time.');
  }
  if (deliveryMode === 'recurring' && selectedDays.length === 0) {
    throw new Error('Please choose one or more delivery days.');
  }
  if (recurringEndDateError) throw new Error(recurringEndDateError);

  const uploadedImageUrl = imageFile
    ? await uploadPushNotificationImage(imageFile)
    : null;

  return {
    label: draft.label.trim(),
    title: draft.title.trim(),
    message: draft.body.trim(),
    userType: audience.userType,
    activityRecency: audience.activityRecency,
    imageUrl: uploadedImageUrl,
    programId: audience.programId,
    schoolIds: audience.isAllSchools
      ? []
      : audience.selectedSchools.map((school) => school.id),
    gradeIds: audience.isAllGrades
      ? []
      : audience.selectedGrades.map((grade) => grade.id),
    isAllSchools: audience.isAllSchools,
    isAllGrades: audience.isAllGrades,
    deliveryMode,
    startDate:
      deliveryMode === 'send_now' ? getCurrentLocalDateString() : startDate,
    sendTime:
      deliveryMode === 'send_now'
        ? getCurrentLocalTimeString()
        : deliveryMode === 'schedule'
          ? sendTime
          : sendTime,
    endDate: deliveryMode === 'recurring' && !neverEnds ? endDate : undefined,
    recurringDays: deliveryMode === 'recurring' ? selectedDays : undefined,
  };
};
