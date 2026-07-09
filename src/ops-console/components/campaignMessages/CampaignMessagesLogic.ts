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
import { useAppSelector } from '../../../redux/hooks';
import { AuthState } from '../../../redux/slices/auth/authSlice';
import { RootState } from '../../../redux/store';
import logger from '../../../utility/logger';

const EMPTY_VALUE = '--';
const PENDING_STATUS = 'pending';
const DEFAULT_POLL_OPTIONS = ['', ''];
const CAMPAIGN_MESSAGES_PAGE_SIZE = 20;
export const CAMPAIGN_MESSAGES_NO_CHANGES_TOAST = 'No changes made.';
export const CAMPAIGN_MESSAGES_EDIT_ICON_SRC =
  '/assets/ops-campaign-message-edit.svg';
export const HOUR_OPTIONS = Array.from({ length: 12 }, (_, index) =>
  String(index + 1).padStart(2, '0'),
);
export const PERIOD_OPTIONS = ['AM', 'PM'] as const;
const NON_EDITABLE_STATUS_VALUES = new Set([
  'sent',
  'delivered',
  'failed',
  'processing',
  'completed',
  'cancelled',
  'canceled',
]);

export type CampaignMessagesScheduleType = 'message' | 'poll';
export type CampaignMessagesTimePeriod = (typeof PERIOD_OPTIONS)[number];
export type CampaignMessagesTimePart = 'hour' | 'period';

export type CampaignMessagesScheduleTimeParts = {
  hour: string;
  period: CampaignMessagesTimePeriod;
};

export interface CampaignMessageRow {
  id: string;
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
  isEditable: boolean;
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
  translate: (key: string) => string;
}

interface CampaignMessageSavePayload {
  id: string;
  message: string;
  mediaLink: string;
  messageTime: string | null;
  pollTime: string | null;
  pollQuestion: string;
  pollOptions: string[];
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

const isPendingStatus = (status?: string | null): boolean =>
  String(status ?? '')
    .trim()
    .toLowerCase() === PENDING_STATUS;

const isNonEditableStatus = (status?: string | null): boolean =>
  NON_EDITABLE_STATUS_VALUES.has(
    String(status ?? '')
      .trim()
      .toLowerCase(),
  );

const isEditableCampaignMessage = (row: CampaignMessageApiRow): boolean => {
  const messageStatus = String(row.message_status ?? '')
    .trim()
    .toLowerCase();
  const pollStatus = String(row.poll_status ?? '')
    .trim()
    .toLowerCase();
  const statuses = [messageStatus, pollStatus].filter(Boolean);

  if (statuses.length === 0) return false;
  if (statuses.some(isNonEditableStatus)) return false;

  return statuses.every(isPendingStatus);
};

export const buildCampaignMessagesData = (
  data?: CampaignMessagesApiData | null,
  rowOffset = 0,
): CampaignMessagesData => {
  const messages = getMessages(data).filter(
    (row) => row.message_time || row.poll_time || row.message || row.poll,
  );
  const firstDatedMessage =
    messages.find((row) => row.message_time || row.poll_time) ?? null;
  const firstMessageDateText =
    firstDatedMessage?.message_time ?? firstDatedMessage?.poll_time ?? null;

  return {
    messageTime: formatTime(messages[0]?.message_time),
    pollTime: formatTime(messages[0]?.poll_time),
    total: messages.length,
    rows: messages.map((row, index) => {
      const dateValue = row.message_time || row.poll_time;
      const poll = parseCampaignMessagePoll(row.poll ?? null);

      return {
        id: row.id || `${dateValue || 'message'}-${index}`,
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
        isEditable: isEditableCampaignMessage(row),
      };
    }),
  };
};

export const loadCampaignMessagesData = async (
  campaignId: string,
  params?: CampaignMessagingQueryParams,
): Promise<CampaignMessagesData> => {
  try {
    const response = await ServiceConfig.getI().apiHandler.getCampaignMessaging(
      campaignId,
      params,
    );

    return {
      ...buildCampaignMessagesData(
        {
          messages: response.data.map(mapCampaignMessagingRow),
        },
        (response.page - 1) * response.pageSize,
      ),
      total: response.total,
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
      id: row.id,
      message: normalizeText(row.message),
      mediaLink: normalizeText(row.mediaLink),
      messageTime: row.messageTimeIso ?? null,
      pollTime: row.pollTimeIso ?? null,
      pollQuestion: normalizeText(row.pollQuestion),
      pollOptions: normalizePollOptions(row.pollOptions),
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
  scheduleTime: string,
): string | null => {
  if (!isoValue) return null;

  const date = new Date(isoValue);
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
      const loadedMessagesData = await loadCampaignMessagesData(campaignId, {
        page,
        pageSize: CAMPAIGN_MESSAGES_PAGE_SIZE,
      });

      if (isMounted) {
        setMessagesData(loadedMessagesData);
        setIsLoading(false);
      }
    };

    void loadMessages();

    return () => {
      isMounted = false;
    };
  }, [campaignId, page]);

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
    () => messagesData.rows.length > 0,
    [messagesData.rows.length],
  );

  const displayedRows = useMemo(
    () =>
      isEditMode
        ? messagesData.rows.map((row) => editedRowsById[row.id] ?? row)
        : messagesData.rows,
    [editedRowsById, isEditMode, messagesData.rows],
  );

  const pageCount = useMemo(
    () => Math.ceil(messagesData.total / CAMPAIGN_MESSAGES_PAGE_SIZE),
    [messagesData.total],
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
    if (!canEdit || isSaving) return;

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
        editedMessageTime,
      ),
      pollTimeIso: getIsoWithScheduleTime(row.pollTimeIso, editedPollTime),
      pollOptions: row.pollOptions.filter((option) => option.trim().length > 0),
    }));

    const rowsToUpdate = buildCampaignMessageSavePayload(
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

      const savedRowsById = nextRows.reduce<Record<string, CampaignMessageRow>>(
        (rowsById, row) => ({
          ...rowsById,
          [row.id]: row,
        }),
        {},
      );

      setMessagesData((currentData) => ({
        ...currentData,
        messageTime:
          editedMessageTime.trim().length > 0
            ? editedMessageTime
            : currentData.messageTime,
        pollTime:
          editedPollTime.trim().length > 0
            ? editedPollTime
            : currentData.pollTime,
        rows: currentData.rows.map((row) => {
          const savedRow = savedRowsById[row.id] ?? row;

          return {
            ...savedRow,
            messageTimeIso: getIsoWithScheduleTime(
              savedRow.messageTimeIso,
              editedMessageTime,
            ),
            pollTimeIso: getIsoWithScheduleTime(
              savedRow.pollTimeIso,
              editedPollTime,
            ),
          };
        }),
      }));
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
