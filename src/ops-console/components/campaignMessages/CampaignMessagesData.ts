import { ServiceConfig } from '../../../services/ServiceConfig';
import {
  CampaignMessagingQueryParams,
  CampaignMessagingRow,
} from '../../../services/api/ServiceApi';
import { Json } from '../../../services/database';
import logger from '../../../utility/logger';
import {
  EMPTY_VALUE,
  CampaignMessageApiRow,
  CampaignMessagePoll,
  CampaignMessagesApiData,
  CampaignMessagesData,
  emptyCampaignMessagesData,
} from './CampaignMessagesTypes';

const formatValue = (value?: string | number | boolean | null): string => {
  if (value === null || value === undefined) return EMPTY_VALUE;
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  const text = String(value).trim();
  return text.length > 0 ? text : EMPTY_VALUE;
};

const formatEditableValue = (
  value?: string | number | boolean | null,
): string => {
  const text = formatValue(value);
  return text === EMPTY_VALUE ? '' : text;
};

const formatMultilineValue = (value?: string | null): string => {
  const text = formatValue(value);
  if (text === EMPTY_VALUE) return EMPTY_VALUE;

  return text.replace(/\r\n?/g, '\n').replace(/\n{3,}/g, '\n\n');
};

const formatDate = (dateText?: string | null): string => {
  if (!dateText) return EMPTY_VALUE;
  const date = new Date(dateText);
  if (Number.isNaN(date.getTime())) return EMPTY_VALUE;
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'long',
    timeZone: 'UTC',
  }).format(date);
};

const normalizeUtcDate = (dateText?: string | null): Date | null => {
  if (!dateText) return null;

  const date = new Date(dateText);
  if (Number.isNaN(date.getTime())) return null;

  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
};

const addUtcDays = (date: Date, days: number): Date => {
  const nextDate = new Date(date);
  nextDate.setUTCDate(nextDate.getUTCDate() + days);
  return nextDate;
};

const isUtcSunday = (date: Date): boolean => date.getUTCDay() === 0;

const getCommunicationDayNumber = ({
  firstDateText,
  currentDateText,
  rowOffset,
  rowIndex,
}: {
  firstDateText?: string | null;
  currentDateText?: string | null;
  rowOffset: number;
  rowIndex: number;
}): number => {
  const fallbackDayNumber = rowOffset + rowIndex + 1;
  const firstDate = normalizeUtcDate(firstDateText);
  const currentDate = normalizeUtcDate(currentDateText);

  if (!firstDate || !currentDate || currentDate < firstDate) {
    return fallbackDayNumber;
  }

  let communicationDayCount = 0;
  for (
    let dateCursor = firstDate;
    dateCursor <= currentDate;
    dateCursor = addUtcDays(dateCursor, 1)
  ) {
    if (!isUtcSunday(dateCursor)) {
      communicationDayCount += 1;
    }
  }

  return rowOffset + communicationDayCount;
};

const formatTime = (dateText?: string | null): string => {
  if (!dateText) return EMPTY_VALUE;
  const date = new Date(dateText);
  if (Number.isNaN(date.getTime())) return EMPTY_VALUE;
  return new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    timeZone: 'UTC',
  }).format(date);
};

const formatDateKey = (dateText?: string | null): string | null => {
  if (!dateText) return null;
  const date = new Date(dateText);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString().slice(0, 10);
};

const parseScheduleTimeText = (
  timeText: string,
): { hour: number; minute: number } | null => {
  const match = timeText.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return null;

  const hour = Number(match[1]);
  const minute = Number(match[2]);
  const period = match[3].toUpperCase();

  if (
    Number.isNaN(hour) ||
    Number.isNaN(minute) ||
    hour < 1 ||
    hour > 12 ||
    minute < 0 ||
    minute > 59
  ) {
    return null;
  }

  const normalizedHour = period === 'AM' ? hour % 12 : (hour % 12) + 12;

  return {
    hour: normalizedHour,
    minute,
  };
};

const applyScheduleTimeToDate = (
  dateValue: string,
  scheduleTime: string,
): string | null => {
  const parsedTime = parseScheduleTimeText(scheduleTime);
  if (!parsedTime) return null;

  const date = new Date(`${dateValue}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) return null;

  date.setUTCHours(parsedTime.hour, parsedTime.minute, 0, 0);
  return date.toISOString();
};

const getTodayDateKey = (): string => {
  const today = new Date();
  const year = today.getUTCFullYear();
  const month = String(today.getUTCMonth() + 1).padStart(2, '0');
  const day = String(today.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const isCampaignDateEditable = (dateKey?: string | null): boolean =>
  Boolean(dateKey && dateKey.localeCompare(getTodayDateKey()) > 0);

export const isSundayDateKey = (dateKey: string): boolean => {
  const date = new Date(`${dateKey}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) return false;
  return date.getUTCDay() === 0;
};

const formatJsonText = (value: Json | undefined): string | null => {
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  return null;
};

const parseCampaignMessagePoll = (
  poll: CampaignMessagePoll | Json | null,
): CampaignMessagePoll | null => {
  if (!poll || typeof poll !== 'object' || Array.isArray(poll)) return null;

  const pollRecord = poll as CampaignMessagePoll & {
    question?: Json;
    options?: Json;
  };

  const options = Array.isArray(pollRecord.options)
    ? pollRecord.options
        .map((option) => {
          if (typeof option === 'string') return option;
          return formatJsonText(option as Json | undefined);
        })
        .filter((option): option is string => option !== null)
    : [];

  return {
    question:
      typeof pollRecord.question === 'string'
        ? pollRecord.question
        : formatJsonText(pollRecord.question),
    options,
  };
};

const mapCampaignMessagingRow = (
  row: CampaignMessagingRow,
): CampaignMessageApiRow => ({
  id: row.id,
  message_time: row.message_time,
  poll_time: row.poll_time,
  message: row.message,
  media_link: row.media_link,
  poll: parseCampaignMessagePoll(row.poll),
  message_status: row.message_status,
  poll_status: row.poll_status,
});

const getMessages = (
  data?: CampaignMessagesApiData | null,
): CampaignMessageApiRow[] => data?.messages ?? [];

const getDateKeyForRow = (row: CampaignMessageApiRow): string | null =>
  formatDateKey(row.message_time) ?? formatDateKey(row.poll_time);

export const buildCampaignMessagesData = (
  data?: CampaignMessagesApiData | null,
  timelineDates: readonly string[] = [],
  rowOffset = 0,
): CampaignMessagesData => {
  const messages = getMessages(data);
  const activeTimelineDates = timelineDates.filter(
    (date) => !isSundayDateKey(date),
  );
  const firstMessageTime =
    messages.find((row) =>
      isCampaignDateEditable(formatDateKey(row.message_time)),
    )?.message_time ?? messages.find((row) => row.message_time)?.message_time;
  const firstPollTime =
    messages.find((row) => isCampaignDateEditable(formatDateKey(row.poll_time)))
      ?.poll_time ?? messages.find((row) => row.poll_time)?.poll_time;

  if (activeTimelineDates.length > 0) {
    const messagesByDate = new Map<string, CampaignMessageApiRow>();
    messages.forEach((row) => {
      const dateKey = getDateKeyForRow(row);
      if (!dateKey || messagesByDate.has(dateKey)) return;
      messagesByDate.set(dateKey, row);
    });

    const firstMessageSchedule = formatTime(firstMessageTime);
    const firstPollSchedule = formatTime(firstPollTime);
    const rows = activeTimelineDates.map((date, index) => {
      const matchedRow = messagesByDate.get(date);
      const poll = parseCampaignMessagePoll(matchedRow?.poll ?? null);
      const placeholderIso = `${date}T00:00:00.000Z`;
      const rowMessageTimeIso =
        matchedRow?.message_time ??
        applyScheduleTimeToDate(date, firstMessageSchedule) ??
        placeholderIso;
      const rowPollTimeIso =
        matchedRow?.poll_time ??
        applyScheduleTimeToDate(date, firstPollSchedule) ??
        placeholderIso;
      const isEditable = isCampaignDateEditable(date);

      return {
        id:
          matchedRow?.id ||
          `${date}-${index + rowOffset + 1}`.replace(/\s+/g, '-'),
        scheduledDate: date,
        dayLabel: `Day ${rowOffset + index + 1}`,
        dateLabel: formatDate(date),
        message: matchedRow ? formatMultilineValue(matchedRow.message) : '',
        mediaLink: matchedRow ? formatEditableValue(matchedRow.media_link) : '',
        messageTimeIso: rowMessageTimeIso,
        pollTimeIso: rowPollTimeIso,
        pollQuestion: matchedRow ? formatEditableValue(poll?.question) : '',
        pollOptions: matchedRow
          ? (poll?.options ?? []).map((option) => formatEditableValue(option))
          : [],
        messageStatus: matchedRow ? formatValue(matchedRow.message_status) : '',
        pollStatus: matchedRow ? formatValue(matchedRow.poll_status) : '',
        messageEditable: isEditable,
        pollEditable: isEditable,
        isEditable,
        isPersisted: Boolean(matchedRow),
      };
    });

    return {
      messageTime: firstMessageSchedule,
      pollTime: firstPollSchedule,
      total: activeTimelineDates.length,
      rows,
    };
  }

  const filteredMessages = messages.filter(
    (row) => row.message_time || row.poll_time || row.message || row.poll,
  );
  const firstDatedMessage =
    messages.find((row) => row.message_time || row.poll_time) ?? null;
  const firstMessageDateText =
    firstDatedMessage?.message_time ?? firstDatedMessage?.poll_time ?? null;

  return {
    messageTime: formatTime(firstMessageTime),
    pollTime: formatTime(firstPollTime),
    total: filteredMessages.length,
    rows: filteredMessages.map((row, index) => {
      const dateValue = row.message_time || row.poll_time;
      const dateKey = formatDateKey(dateValue);
      const poll = parseCampaignMessagePoll(row.poll ?? null);
      const isEditable = isCampaignDateEditable(dateKey);

      return {
        id: row.id || `${dateValue || 'message'}-${index}`,
        scheduledDate: dateKey ?? '',
        // Communication day numbers skip Sundays even when persisted rows span calendar gaps.
        dayLabel: `Day ${getCommunicationDayNumber({
          firstDateText: firstMessageDateText,
          currentDateText: dateValue,
          rowOffset,
          rowIndex: index,
        })}`,
        dateLabel: formatDate(dateValue),
        message: formatMultilineValue(row.message),
        mediaLink: formatEditableValue(row.media_link),
        messageTimeIso: row.message_time ?? null,
        pollTimeIso: row.poll_time ?? null,
        pollQuestion: formatEditableValue(poll?.question),
        pollOptions: (poll?.options ?? []).map((option) =>
          formatEditableValue(option),
        ),
        messageStatus: formatValue(row.message_status),
        pollStatus: formatValue(row.poll_status),
        messageEditable: isEditable,
        pollEditable: isEditable,
        isEditable,
        isPersisted: true,
      };
    }),
  };
};

export const loadCampaignMessagesData = async (
  campaignId: string,
  timelineDates: readonly string[] = [],
  params?: CampaignMessagingQueryParams,
): Promise<CampaignMessagesData> => {
  try {
    const activeTimelineDates = timelineDates.filter(
      (date) => !isSundayDateKey(date),
    );
    const response = await ServiceConfig.getI().apiHandler.getCampaignMessaging(
      campaignId,
      params,
    );

    return {
      ...buildCampaignMessagesData(
        {
          messages: response.data.map(mapCampaignMessagingRow),
        },
        activeTimelineDates,
        (response.page - 1) * response.pageSize,
      ),
      total:
        activeTimelineDates.length > 0
          ? activeTimelineDates.length
          : response.total,
    };
  } catch (error) {
    logger.error('Failed to load campaign messages:', error);
    return emptyCampaignMessagesData;
  }
};
