import { t } from 'i18next';
import { CampaignAssignmentDraft } from './campaignAssignmentUtils';
import { CampaignSetupFormState } from './types';

export type CampaignCommunicationRowState = {
  message: string;
  mediaLink: string;
  pollQuestion: string;
  pollOptions: string[];
};

export type CampaignCommunicationState = {
  messageTime: string;
  pollTime: string;
  rows: Record<string, CampaignCommunicationRowState>;
};

export type CampaignCommunicationValidation = {
  errors: Record<string, string>;
  hasConfiguredDay: boolean;
  isValid: boolean;
};

export type CampaignMessagingPollPayload = {
  question: string;
  options: string[];
};

export type CampaignMessagingRowPayload = {
  campaign_id: string;
  scheduled_date: string;
  message_time: string | null;
  poll_time: string | null;
  message: string | null;
  media_link: string | null;
  poll: CampaignMessagingPollPayload | null;
  message_status: 'pending';
  poll_status: 'pending';
  is_deleted: false;
};

export const createEmptyCommunicationRow =
  (): CampaignCommunicationRowState => ({
    message: '',
    mediaLink: '',
    pollQuestion: '',
    pollOptions: ['', ''],
  });

export const buildCommunicationTimelineDates = (
  assignmentDrafts: CampaignAssignmentDraft[],
): string[] =>
  Array.from(new Set(assignmentDrafts.map((draft) => draft.startsAt)))
    .filter(Boolean)
    .sort();

export const getCampaignDurationDays = (
  startDate: string,
  endDate: string,
): number => {
  if (!startDate || !endDate) return 0;
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diff = end.getTime() - start.getTime();
  if (Number.isNaN(diff) || diff < 0) return 0;
  return Math.round(diff / (1000 * 60 * 60 * 24)) + 1;
};

const formatDateValue = (value: string) =>
  new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
  }).format(new Date(value));

const getOrdinalSuffix = (value: number) => {
  const mod10 = value % 10;
  const mod100 = value % 100;
  if (mod10 === 1 && mod100 !== 11) return 'st';
  if (mod10 === 2 && mod100 !== 12) return 'nd';
  if (mod10 === 3 && mod100 !== 13) return 'rd';
  return 'th';
};

export const formatTimelineDayLabel = (value: string, index: number) => {
  const day = index + 1;
  return `Day ${day} (${day}${getOrdinalSuffix(day)} · ${formatDateValue(
    value,
  )})`;
};

export const formatTimelineDateLabel = (value: string) =>
  formatDateValue(value);

export const buildTimeOptions = (): string[] => {
  const options: string[] = [];
  for (let hour = 0; hour < 24; hour += 1) {
    const suffix = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 === 0 ? 12 : hour % 12;
    options.push(`${String(displayHour).padStart(2, '0')}:00 ${suffix}`);
  }
  return options;
};

export const formatTimeForDatabase = (value: string): string | null => {
  const trimmed = value.trim();
  if (!trimmed) return null;

  const match = trimmed.match(/^(\d{1,2}):(\d{2})\s?(AM|PM)$/i);
  if (!match) return null;

  const hourValue = Number(match[1]);
  const minuteValue = Number(match[2]);
  const meridiem = match[3].toUpperCase();

  if (
    Number.isNaN(hourValue) ||
    Number.isNaN(minuteValue) ||
    hourValue < 1 ||
    hourValue > 12 ||
    minuteValue < 0 ||
    minuteValue > 59
  ) {
    return null;
  }

  const normalizedHour =
    meridiem === 'AM' ? hourValue % 12 : (hourValue % 12) + 12;

  return `${String(normalizedHour).padStart(2, '0')}:${String(
    minuteValue,
  ).padStart(2, '0')}:00`;
};

export const isCommunicationRowConfigured = (
  row: CampaignCommunicationRowState | undefined,
) => {
  if (!row) return false;
  return (
    row.message.trim() !== '' ||
    row.mediaLink.trim() !== '' ||
    row.pollQuestion.trim() !== '' ||
    row.pollOptions.some((option) => option.trim() !== '')
  );
};

const isValidUrl = (value: string) => {
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
};

export const getCampaignCommunicationValidation = (
  state: CampaignCommunicationState,
  timelineDates: string[],
): CampaignCommunicationValidation => {
  const errors: Record<string, string> = {};

  if (!state.messageTime) {
    errors.messageTime = t('Message time is required.');
  }
  if (!state.pollTime) {
    errors.pollTime = t('Poll time is required.');
  }

  let hasConfiguredDay = false;

  timelineDates.forEach((date) => {
    const row = state.rows[date];
    if (!isCommunicationRowConfigured(row)) return;

    hasConfiguredDay = true;

    if (row.mediaLink.trim() && !isValidUrl(row.mediaLink.trim())) {
      errors[`rows.${date}.mediaLink`] = t('Enter a valid media URL.');
    }

    const hasPollContent =
      row.pollQuestion.trim() !== '' ||
      row.pollOptions.some((option) => option.trim() !== '');

    if (hasPollContent) {
      if (!row.pollQuestion.trim()) {
        errors[`rows.${date}.pollQuestion`] = t('Poll question is required.');
      }
      if (!row.pollOptions[0]?.trim()) {
        errors[`rows.${date}.pollOptions.0`] = t(
          'Option 1 is required when poll is configured.',
        );
      }
      if (!row.pollOptions[1]?.trim()) {
        errors[`rows.${date}.pollOptions.1`] = t(
          'Option 2 is required when poll is configured.',
        );
      }
    }
  });

  if (!hasConfiguredDay) {
    errors.rows = t('Configure at least one day to continue to the Summary.');
  }

  return {
    errors,
    hasConfiguredDay,
    isValid: Object.keys(errors).length === 0,
  };
};

export const buildCampaignDurationLabel = (form: CampaignSetupFormState) => {
  if (!form.startDate || !form.endDate) return t('Campaign: --');
  return t('Campaign: {{startDate}} -> {{endDate}} · {{days}} days', {
    startDate: form.startDate,
    endDate: form.endDate,
    days: getCampaignDurationDays(form.startDate, form.endDate),
  });
};

export const buildCampaignMessagingPayload = ({
  campaignId,
  timelineDates,
  communicationState,
}: {
  campaignId: string;
  timelineDates: string[];
  communicationState: CampaignCommunicationState;
}): CampaignMessagingRowPayload[] =>
  timelineDates
    .map((date) => {
      const row = communicationState.rows[date];
      if (!isCommunicationRowConfigured(row)) return null;

      const pollOptions =
        row?.pollOptions
          .map((option) => option.trim())
          .filter((option) => option !== '') ?? [];
      const pollQuestion = row?.pollQuestion.trim() ?? '';

      return {
        campaign_id: campaignId,
        scheduled_date: date,
        message_time: formatTimeForDatabase(communicationState.messageTime),
        poll_time: formatTimeForDatabase(communicationState.pollTime),
        message: row?.message.trim() || null,
        media_link: row?.mediaLink.trim() || null,
        poll:
          pollQuestion || pollOptions.length > 0
            ? {
                question: pollQuestion,
                options: pollOptions,
              }
            : null,
        message_status: 'pending' as const,
        poll_status: 'pending' as const,
        is_deleted: false as const,
      };
    })
    .filter((row): row is CampaignMessagingRowPayload => row !== null);
