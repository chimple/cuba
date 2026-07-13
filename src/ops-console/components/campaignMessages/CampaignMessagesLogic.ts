import {
  type Dispatch,
  type MutableRefObject,
  type SetStateAction,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { ServiceConfig } from '../../../services/ServiceConfig';
import {
  CampaignMessagingQueryParams,
  CampaignMessagingRow,
} from '../../../services/api/ServiceApi';
import { hasCampaignWriteAccess } from '../../../services/api/campaignListingHelpers';
import { Json } from '../../../services/database';
import { buildCampaignDurationTimelineDates } from '../campaignSetup/campaignCommunicationUtils';
import { useAppSelector } from '../../../redux/hooks';
import { AuthState } from '../../../redux/slices/auth/authSlice';
import { RootState } from '../../../redux/store';
import logger from '../../../utility/logger';

const EMPTY_VALUE = '--';
const DEFAULT_POLL_OPTIONS = ['', ''];
const CAMPAIGN_MESSAGES_PAGE_SIZE = 20;
export const CAMPAIGN_MESSAGES_NO_CHANGES_TOAST = 'No changes made.';
export const CAMPAIGN_MESSAGES_EDIT_ICON_SRC =
  '/assets/ops-campaign-message-edit.svg';
export const HOUR_OPTIONS = Array.from({ length: 12 }, (_, index) =>
  String(index + 1).padStart(2, '0'),
);
export const PERIOD_OPTIONS = ['AM', 'PM'] as const;
export type CampaignMessagesScheduleType = 'message' | 'poll';
export type CampaignMessagesTimePeriod = (typeof PERIOD_OPTIONS)[number];
export type CampaignMessagesTimePart = 'hour' | 'period';

export type CampaignMessagesScheduleTimeParts = {
  hour: string;
  period: CampaignMessagesTimePeriod;
};

export interface CampaignMessageRow {
  id: string;
  scheduledDate: string;
  dayLabel: string;
  dateLabel: string;
  message: string;
  mediaLink: string;
  messageTimeIso: string | null;
  pollTimeIso: string | null;
  pollQuestion: string;
  pollOptions: string[];
  messageStatus: string;
  pollStatus: string;
  messageEditable: boolean;
  pollEditable: boolean;
  isEditable: boolean;
  isPersisted: boolean;
}

export interface CampaignMessagesData {
  messageTime: string;
  pollTime: string;
  rows: CampaignMessageRow[];
  total: number;
}

export interface CampaignMessagesController {
  messagesData: CampaignMessagesData;
  canEdit: boolean;
  isLoading: boolean;
  isEditMode: boolean;
  page: number;
  pageCount: number;
  displayedRows: CampaignMessageRow[];
  hasEditableRows: boolean;
  isSaving: boolean;
  editedMessageTime: string;
  editedPollTime: string;
  openSchedulePicker: CampaignMessagesScheduleType | null;
  toastMessage: string;
  collapsedRowIds: Record<string, boolean>;
  originalOptionCountByRowId: Record<string, number>;
  hourOptionRefs: MutableRefObject<Record<string, HTMLButtonElement | null>>;
  periodOptionRefs: MutableRefObject<Record<string, HTMLButtonElement | null>>;
  getPollOptionsForEdit: (row: CampaignMessageRow) => string[];
  getReadonlyText: (value: string) => string;
  getScheduleTimeParts: (
    timeText: string,
  ) => CampaignMessagesScheduleTimeParts | null;
  updateScheduleTime: (
    scheduleType: CampaignMessagesScheduleType,
    part: CampaignMessagesTimePart,
    value: string,
  ) => void;
  setOpenSchedulePicker: Dispatch<
    SetStateAction<CampaignMessagesScheduleType | null>
  >;
  setPage: Dispatch<SetStateAction<number>>;
  updateRowField: (
    rowId: string,
    field: keyof Pick<
      CampaignMessageRow,
      'message' | 'mediaLink' | 'pollQuestion'
    >,
    value: string,
  ) => void;
  updatePollOption: (rowId: string, optionIndex: number, value: string) => void;
  addPollOption: (rowId: string) => void;
  removePollOption: (rowId: string, optionIndex: number) => void;
  clearRow: (rowId: string) => void;
  toggleRowCollapsed: (rowId: string) => void;
  handleEdit: () => void;
  handleCancel: () => void;
  handleSave: () => Promise<void>;
}

interface UseCampaignMessagesControllerParams {
  campaignId?: string;
  campaignStartDate?: string;
  campaignEndDate?: string;
  translate: (key: string) => string;
}

interface CampaignMessageSavePayload {
  campaignId: string;
  id?: string;
  message: string;
  mediaLink: string;
  messageTime: string | null;
  pollTime: string | null;
  pollQuestion: string;
  pollOptions: string[];
  messageStatus?: string | null;
  pollStatus?: string | null;
}

interface CampaignMessagePoll {
  question?: string | null;
  options?: readonly (string | null)[] | null;
}

interface CampaignMessageApiRow {
  id?: string | null;
  message_time?: string | null;
  poll_time?: string | null;
  message?: string | null;
  media_link?: string | null;
  poll?: CampaignMessagePoll | Json | null;
  message_status?: string | null;
  poll_status?: string | null;
}

interface CampaignMessagesApiData {
  messages?: CampaignMessageApiRow[] | null;
}

export const emptyCampaignMessagesData: CampaignMessagesData = {
  messageTime: EMPTY_VALUE,
  pollTime: EMPTY_VALUE,
  rows: [],
  total: 0,
};

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

const isBeforeToday = (dateKey: string): boolean =>
  dateKey.localeCompare(getTodayDateKey()) < 0;

const isSundayDateKey = (dateKey: string): boolean => {
  const date = new Date(`${dateKey}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) return false;
  return date.getUTCDay() === 0;
};

const isDateTimeExpired = (dateTimeIso?: string | null): boolean => {
  if (!dateTimeIso) return false;

  const date = new Date(dateTimeIso);
  if (Number.isNaN(date.getTime())) return false;

  return date.getTime() <= Date.now();
};

const NON_EDITABLE_STATUS_VALUES = new Set([
  'sent',
  'delivered',
  'failed',
  'processing',
  'completed',
  'cancelled',
  'canceled',
]);

const isNonEditableStatus = (status?: string | null): boolean =>
  NON_EDITABLE_STATUS_VALUES.has(
    String(status ?? '')
      .trim()
      .toLowerCase(),
  );

const isMessageLocked = (row: {
  dateKey?: string;
  messageStatus?: string | null;
  messageTimeIso?: string | null;
  isTimelineRow?: boolean;
}): boolean => {
  if (isNonEditableStatus(row.messageStatus)) return true;
  if (row.isTimelineRow && row.dateKey && isBeforeToday(row.dateKey))
    return true;
  if (row.dateKey && row.dateKey === getTodayDateKey()) {
    return isDateTimeExpired(row.messageTimeIso);
  }
  return false;
};

const isPollLocked = (row: {
  dateKey?: string;
  pollStatus?: string | null;
  pollTimeIso?: string | null;
  isTimelineRow?: boolean;
}): boolean => {
  if (isNonEditableStatus(row.pollStatus)) return true;
  if (row.isTimelineRow && row.dateKey && isBeforeToday(row.dateKey))
    return true;
  if (row.dateKey && row.dateKey === getTodayDateKey()) {
    return isDateTimeExpired(row.pollTimeIso);
  }
  return false;
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

  if (activeTimelineDates.length > 0) {
    const messagesByDate = new Map<string, CampaignMessageApiRow>();
    messages.forEach((row) => {
      const dateKey = getDateKeyForRow(row);
      if (!dateKey || messagesByDate.has(dateKey)) return;
      messagesByDate.set(dateKey, row);
    });

    const firstMessage = messages[0];
    const firstMessageSchedule = formatTime(firstMessage?.message_time);
    const firstPollSchedule = formatTime(firstMessage?.poll_time);
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
      const messageEditable = !isMessageLocked({
        dateKey: date,
        messageStatus: matchedRow?.message_status ?? null,
        messageTimeIso: rowMessageTimeIso,
        isTimelineRow: true,
      });
      const pollEditable = !isPollLocked({
        dateKey: date,
        pollStatus: matchedRow?.poll_status ?? null,
        pollTimeIso: rowPollTimeIso,
        isTimelineRow: true,
      });

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
        messageEditable,
        pollEditable,
        isEditable: messageEditable || pollEditable,
        isPersisted: Boolean(matchedRow),
      };
    });

    return {
      messageTime: formatTime(firstMessage?.message_time),
      pollTime: formatTime(firstMessage?.poll_time),
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
    messageTime: formatTime(filteredMessages[0]?.message_time),
    pollTime: formatTime(filteredMessages[0]?.poll_time),
    total: filteredMessages.length,
    rows: filteredMessages.map((row, index) => {
      const dateValue = row.message_time || row.poll_time;
      const dateKey = formatDateKey(dateValue);
      const poll = parseCampaignMessagePoll(row.poll ?? null);

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
        messageEditable: !isMessageLocked({
          dateKey: dateKey ?? undefined,
          messageStatus: row.message_status,
          messageTimeIso: row.message_time ?? null,
        }),
        pollEditable: !isPollLocked({
          dateKey: dateKey ?? undefined,
          pollStatus: row.poll_status,
          pollTimeIso: row.poll_time ?? null,
        }),
        isEditable:
          !isMessageLocked({
            dateKey: dateKey ?? undefined,
            messageStatus: row.message_status,
            messageTimeIso: row.message_time ?? null,
          }) ||
          !isPollLocked({
            dateKey: dateKey ?? undefined,
            pollStatus: row.poll_status,
            pollTimeIso: row.poll_time ?? null,
          }),
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

const normalizeText = (value: string): string => value.trim();

const normalizeIsoText = (value: string | null): string | null => {
  if (!value) return null;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toISOString();
};

const normalizePollOptions = (options: string[]): string[] =>
  options.map((option) => option.trim()).filter((option) => option.length > 0);

const areStringArraysEqual = (
  left: readonly string[],
  right: readonly string[],
): boolean =>
  left.length === right.length &&
  left.every((value, index) => value === right[index]);

const areCampaignMessageRowsEqual = (
  currentRow: CampaignMessageRow,
  nextRow: CampaignMessageRow,
): boolean =>
  normalizeText(currentRow.message) === normalizeText(nextRow.message) &&
  normalizeText(currentRow.mediaLink) === normalizeText(nextRow.mediaLink) &&
  normalizeText(currentRow.pollQuestion) ===
    normalizeText(nextRow.pollQuestion) &&
  normalizeIsoText(currentRow.messageTimeIso) ===
    normalizeIsoText(nextRow.messageTimeIso) &&
  normalizeIsoText(currentRow.pollTimeIso) ===
    normalizeIsoText(nextRow.pollTimeIso) &&
  areStringArraysEqual(
    normalizePollOptions(currentRow.pollOptions),
    normalizePollOptions(nextRow.pollOptions),
  );

export const buildCampaignMessageSavePayload = (
  campaignId: string,
  currentRows: readonly CampaignMessageRow[],
  nextRows: readonly CampaignMessageRow[],
): CampaignMessageSavePayload[] => {
  const currentRowsById = currentRows.reduce<
    Record<string, CampaignMessageRow>
  >(
    (rowsById, row) => ({
      ...rowsById,
      [row.id]: row,
    }),
    {},
  );

  return nextRows
    .filter((row) => row.isEditable && row.id.trim().length > 0)
    .filter((row) => {
      const currentRow = currentRowsById[row.id];
      if (!currentRow) return true;
      return !areCampaignMessageRowsEqual(currentRow, row);
    })
    .map((row) => ({
      campaignId,
      id: row.isPersisted ? row.id : undefined,
      message: normalizeText(row.message),
      mediaLink: normalizeText(row.mediaLink),
      messageTime: row.messageTimeIso ?? null,
      pollTime: row.pollTimeIso ?? null,
      pollQuestion: normalizeText(row.pollQuestion),
      pollOptions: normalizePollOptions(row.pollOptions),
      messageStatus: row.messageStatus || null,
      pollStatus: row.pollStatus || null,
    }));
};

const getReadonlyText = (value: string): string =>
  value.trim().length > 0 ? value : EMPTY_VALUE;

const getPollOptionsForEdit = (row: CampaignMessageRow): string[] =>
  row.pollOptions.length > 0 ? row.pollOptions : [...DEFAULT_POLL_OPTIONS];

const getEditableScheduleTime = (timeText: string): string =>
  timeText === EMPTY_VALUE ? '' : timeText;

const getScheduleTimeParts = (
  timeText: string,
): CampaignMessagesScheduleTimeParts | null => {
  const normalizedTimeText = timeText.trim().toUpperCase();
  const match = normalizedTimeText.match(/^(\d{1,2})(?::\d{2})?\s*(AM|PM)$/);

  if (!match) return null;

  const hourNumber = Number(match[1]);
  const safeHour = Math.min(Math.max(hourNumber, 1), 12);

  return {
    hour: String(safeHour).padStart(2, '0'),
    period: match[2] as CampaignMessagesTimePeriod,
  };
};

const buildScheduleTimeText = ({
  hour,
  period,
}: CampaignMessagesScheduleTimeParts): string => `${hour}:00 ${period}`;

const getIsoWithScheduleTime = (
  isoValue: string | null,
  scheduledDate: string,
  scheduleTime: string,
): string | null => {
  const dateValue = isoValue || `${scheduledDate}T00:00:00.000Z`;

  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return isoValue;

  const scheduleTimeParts = getScheduleTimeParts(scheduleTime);
  if (!scheduleTimeParts) return isoValue;

  const { hour, period } = scheduleTimeParts;
  const hourNumber = Number(hour);
  const hour24 =
    period === 'AM'
      ? hourNumber === 12
        ? 0
        : hourNumber
      : hourNumber === 12
        ? 12
        : hourNumber + 12;

  date.setUTCHours(hour24, 0, 0, 0);
  return date.toISOString();
};

export const useCampaignMessagesController = ({
  campaignId,
  campaignStartDate,
  campaignEndDate,
  translate,
}: UseCampaignMessagesControllerParams): CampaignMessagesController => {
  const { roles } = useAppSelector(
    (state: RootState) => state.auth as AuthState,
  );
  const canEdit = hasCampaignWriteAccess(roles || []);
  const [messagesData, setMessagesData] = useState<CampaignMessagesData>(
    () => emptyCampaignMessagesData,
  );
  const [isLoading, setIsLoading] = useState(Boolean(campaignId));
  const [isEditMode, setIsEditMode] = useState(false);
  const [page, setPage] = useState(1);
  const [editedRowsById, setEditedRowsById] = useState<
    Record<string, CampaignMessageRow>
  >({});
  const [originalOptionCountByRowId, setOriginalOptionCountByRowId] = useState<
    Record<string, number>
  >({});
  const [isSaving, setIsSaving] = useState(false);
  const [editedMessageTime, setEditedMessageTime] = useState(() =>
    getEditableScheduleTime(messagesData.messageTime),
  );
  const [editedPollTime, setEditedPollTime] = useState(() =>
    getEditableScheduleTime(messagesData.pollTime),
  );
  const [openSchedulePicker, setOpenSchedulePicker] =
    useState<CampaignMessagesScheduleType | null>(null);
  const [toastMessage, setToastMessage] = useState('');
  const [collapsedRowIds, setCollapsedRowIds] = useState<
    Record<string, boolean>
  >({});
  const timelineDates = useMemo(
    () =>
      campaignStartDate && campaignEndDate
        ? buildCampaignDurationTimelineDates(campaignStartDate, campaignEndDate)
        : [],
    [campaignEndDate, campaignStartDate],
  );
  const displayTimelineDates = useMemo(
    () => timelineDates.filter((date) => !isSundayDateKey(date)),
    [timelineDates],
  );
  const hourOptionRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const periodOptionRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const toastTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    setPage(1);
    setIsEditMode(false);
    setEditedRowsById({});
    setOriginalOptionCountByRowId({});
    setEditedMessageTime('');
    setEditedPollTime('');
    setOpenSchedulePicker(null);
    setCollapsedRowIds({});
  }, [campaignId]);

  useEffect(() => {
    let isMounted = true;

    const loadMessages = async (): Promise<void> => {
      if (!campaignId) {
        setMessagesData(emptyCampaignMessagesData);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      const pageSize =
        displayTimelineDates.length > 0
          ? displayTimelineDates.length
          : CAMPAIGN_MESSAGES_PAGE_SIZE;
      const loadedMessagesData = await loadCampaignMessagesData(
        campaignId,
        displayTimelineDates,
        {
          page: 1,
          pageSize,
        },
      );

      if (isMounted) {
        setMessagesData(loadedMessagesData);
        setIsLoading(false);
      }
    };

    void loadMessages();

    return () => {
      isMounted = false;
    };
  }, [campaignId, displayTimelineDates, timelineDates.length]);

  useEffect(
    () => () => {
      if (toastTimeoutRef.current !== null) {
        window.clearTimeout(toastTimeoutRef.current);
      }
    },
    [],
  );

  useEffect(() => {
    if (canEdit) return;

    setEditedRowsById({});
    setOriginalOptionCountByRowId({});
    setOpenSchedulePicker(null);
    setIsEditMode(false);
  }, [canEdit]);

  useEffect(() => {
    if (!isEditMode) return;

    setOriginalOptionCountByRowId((currentCounts) => {
      const nextCounts = { ...currentCounts };

      messagesData.rows.forEach((row) => {
        if (nextCounts[row.id] === undefined) {
          nextCounts[row.id] = Math.max(row.pollOptions.length, 2);
        }
      });

      return nextCounts;
    });
  }, [isEditMode, messagesData.rows]);

  useEffect(() => {
    setCollapsedRowIds((currentRowIds) => {
      const nextRowIds = { ...currentRowIds };

      messagesData.rows.forEach((row) => {
        if (nextRowIds[row.id] === undefined) {
          nextRowIds[row.id] = true;
        }
      });

      return nextRowIds;
    });
  }, [messagesData.rows]);

  useEffect(() => {
    if (isEditMode) return;

    setEditedMessageTime(getEditableScheduleTime(messagesData.messageTime));
    setEditedPollTime(getEditableScheduleTime(messagesData.pollTime));
  }, [isEditMode, messagesData.messageTime, messagesData.pollTime]);

  useEffect(() => {
    if (!openSchedulePicker) return;

    const currentTime =
      openSchedulePicker === 'message' ? editedMessageTime : editedPollTime;
    const currentParts = getScheduleTimeParts(currentTime);
    if (!currentParts) return;

    window.setTimeout(() => {
      hourOptionRefs.current[
        `${openSchedulePicker}-hour-${currentParts.hour}`
      ]?.scrollIntoView({ block: 'center' });
      periodOptionRefs.current[
        `${openSchedulePicker}-period-${currentParts.period}`
      ]?.scrollIntoView({ block: 'nearest' });
    }, 0);
  }, [editedMessageTime, editedPollTime, openSchedulePicker]);

  const hasEditableRows = useMemo(
    () => messagesData.rows.some((row) => row.isEditable),
    [messagesData.rows],
  );

  const displayedRows = useMemo(() => {
    const rows = isEditMode
      ? messagesData.rows.map((row) => editedRowsById[row.id] ?? row)
      : messagesData.rows;
    if (displayTimelineDates.length === 0) return rows;

    const startIndex = (page - 1) * CAMPAIGN_MESSAGES_PAGE_SIZE;
    return rows.slice(startIndex, startIndex + CAMPAIGN_MESSAGES_PAGE_SIZE);
  }, [
    editedRowsById,
    isEditMode,
    messagesData.rows,
    page,
    displayTimelineDates.length,
  ]);

  const pageCount = useMemo(
    () =>
      displayTimelineDates.length > 0
        ? Math.ceil(displayTimelineDates.length / CAMPAIGN_MESSAGES_PAGE_SIZE)
        : Math.ceil(messagesData.total / CAMPAIGN_MESSAGES_PAGE_SIZE),
    [messagesData.total, displayTimelineDates.length],
  );

  useEffect(() => {
    if (pageCount > 0 && page > pageCount) {
      setPage(pageCount);
    }
  }, [page, pageCount]);

  const updateScheduleTime = (
    scheduleType: CampaignMessagesScheduleType,
    part: CampaignMessagesTimePart,
    value: string,
  ): void => {
    const currentTime =
      scheduleType === 'message' ? editedMessageTime : editedPollTime;
    const currentParts = getScheduleTimeParts(currentTime);
    if (!currentParts) return;

    const nextParts = {
      ...currentParts,
      [part]: value,
    } as CampaignMessagesScheduleTimeParts;
    const nextTime = buildScheduleTimeText(nextParts);

    if (scheduleType === 'message') {
      setEditedMessageTime(nextTime);
      return;
    }

    setEditedPollTime(nextTime);
  };

  const updateRow = (
    rowId: string,
    updater: (row: CampaignMessageRow) => CampaignMessageRow,
  ): void => {
    setEditedRowsById((currentRowsById) => {
      const sourceRow =
        currentRowsById[rowId] ??
        messagesData.rows.find((row) => row.id === rowId);

      if (!sourceRow) return currentRowsById;

      return {
        ...currentRowsById,
        [rowId]: updater(sourceRow),
      };
    });
  };

  const updateRowField = (
    rowId: string,
    field: keyof Pick<
      CampaignMessageRow,
      'message' | 'mediaLink' | 'pollQuestion'
    >,
    value: string,
  ): void => {
    updateRow(rowId, (row) => ({ ...row, [field]: value }));
  };

  const updatePollOption = (
    rowId: string,
    optionIndex: number,
    value: string,
  ): void => {
    updateRow(rowId, (row) => ({
      ...row,
      pollOptions: getPollOptionsForEdit(row).map((option, index) =>
        index === optionIndex ? value : option,
      ),
    }));
  };

  const addPollOption = (rowId: string): void => {
    updateRow(rowId, (row) => ({
      ...row,
      pollOptions: [...getPollOptionsForEdit(row), ''],
    }));
  };

  const removePollOption = (rowId: string, optionIndex: number): void => {
    updateRow(rowId, (row) => ({
      ...row,
      pollOptions: getPollOptionsForEdit(row).filter(
        (_, index) => index !== optionIndex,
      ),
    }));
  };

  const clearRow = (rowId: string): void => {
    updateRow(rowId, (row) => ({
      ...row,
      message: '',
      mediaLink: '',
      pollQuestion: '',
      pollOptions: [...DEFAULT_POLL_OPTIONS],
    }));
  };

  const toggleRowCollapsed = (rowId: string): void => {
    setCollapsedRowIds((currentRowIds) => ({
      ...currentRowIds,
      [rowId]: !currentRowIds[rowId],
    }));
  };

  const handleEdit = (): void => {
    if (!canEdit || !hasEditableRows) return;
    setEditedMessageTime(getEditableScheduleTime(messagesData.messageTime));
    setEditedPollTime(getEditableScheduleTime(messagesData.pollTime));
    setOpenSchedulePicker(null);
    setIsEditMode(true);
  };

  const handleCancel = (): void => {
    setEditedRowsById({});
    setOriginalOptionCountByRowId({});
    setEditedMessageTime(getEditableScheduleTime(messagesData.messageTime));
    setEditedPollTime(getEditableScheduleTime(messagesData.pollTime));
    setOpenSchedulePicker(null);
    setIsEditMode(false);
  };

  const showToastMessage = (message: string): void => {
    if (toastTimeoutRef.current !== null) {
      window.clearTimeout(toastTimeoutRef.current);
    }

    setToastMessage(message);
    toastTimeoutRef.current = window.setTimeout(() => {
      setToastMessage('');
      toastTimeoutRef.current = null;
    }, 2500);
  };

  const handleSave = async (): Promise<void> => {
    if (!canEdit || isSaving || !campaignId) return;

    const rowsForSaveById = [
      ...messagesData.rows.filter((row) => row.isEditable),
      ...Object.values(editedRowsById),
    ].reduce<Record<string, CampaignMessageRow>>(
      (rowsById, row) => ({
        ...rowsById,
        [row.id]: row,
      }),
      {},
    );
    const nextRows = Object.values(rowsForSaveById).map((row) => ({
      ...row,
      messageTimeIso: getIsoWithScheduleTime(
        row.messageTimeIso,
        row.scheduledDate,
        editedMessageTime,
      ),
      pollTimeIso: getIsoWithScheduleTime(
        row.pollTimeIso,
        row.scheduledDate,
        editedPollTime,
      ),
      pollOptions: row.pollOptions.filter((option) => option.trim().length > 0),
    }));

    const rowsToUpdate = buildCampaignMessageSavePayload(
      campaignId,
      messagesData.rows,
      nextRows,
    );

    if (rowsToUpdate.length === 0) {
      showToastMessage(translate(CAMPAIGN_MESSAGES_NO_CHANGES_TOAST));
      setEditedRowsById({});
      setOriginalOptionCountByRowId({});
      setOpenSchedulePicker(null);
      setIsEditMode(false);
      return;
    }

    setIsSaving(true);

    try {
      const isUpdated =
        await ServiceConfig.getI().apiHandler.updateCampaignMessaging(
          rowsToUpdate,
        );

      if (!isUpdated) {
        window.alert(
          translate(
            'Unable to save changes. Please check whether these campaign messages are still pending and try again.',
          ),
        );
        return;
      }

      const refreshedData = await loadCampaignMessagesData(
        campaignId,
        displayTimelineDates,
        {
          page: 1,
          pageSize:
            displayTimelineDates.length > 0
              ? displayTimelineDates.length
              : CAMPAIGN_MESSAGES_PAGE_SIZE,
        },
      );

      setMessagesData({
        ...refreshedData,
        messageTime:
          editedMessageTime.trim().length > 0
            ? editedMessageTime
            : refreshedData.messageTime,
        pollTime:
          editedPollTime.trim().length > 0
            ? editedPollTime
            : refreshedData.pollTime,
      });
      setEditedRowsById({});
      setOriginalOptionCountByRowId({});
      setOpenSchedulePicker(null);
      setIsEditMode(false);
    } catch {
      window.alert(translate('Unable to save changes. Please try again.'));
    } finally {
      setIsSaving(false);
    }
  };

  return {
    messagesData,
    canEdit,
    isLoading,
    isEditMode,
    page,
    pageCount,
    displayedRows,
    hasEditableRows,
    isSaving,
    editedMessageTime,
    editedPollTime,
    openSchedulePicker,
    toastMessage,
    collapsedRowIds,
    originalOptionCountByRowId,
    hourOptionRefs,
    periodOptionRefs,
    getPollOptionsForEdit,
    getReadonlyText,
    getScheduleTimeParts,
    updateScheduleTime,
    setOpenSchedulePicker,
    setPage,
    updateRowField,
    updatePollOption,
    addPollOption,
    removePollOption,
    clearRow,
    toggleRowCollapsed,
    handleEdit,
    handleCancel,
    handleSave,
  };
};
