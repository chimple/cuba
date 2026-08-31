import {
  CampaignMessageRow,
  CampaignMessageSavePayload,
  CampaignMessagesScheduleTimeParts,
  CampaignMessagesTimePeriod,
  DEFAULT_POLL_OPTIONS,
  EMPTY_VALUE,
} from './CampaignMessagesTypes';

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

// Missing timeline dates are display placeholders and must not create time-only records.
const hasConfiguredContent = (row: CampaignMessageRow): boolean =>
  normalizeText(row.message).length > 0 ||
  normalizeText(row.mediaLink).length > 0 ||
  normalizeText(row.pollQuestion).length > 0 ||
  normalizePollOptions(row.pollOptions).length > 0;

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
    .filter((row) => row.isPersisted || hasConfiguredContent(row))
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

export const getReadonlyText = (value: string): string =>
  value.trim().length > 0 ? value : EMPTY_VALUE;

export const getPollOptionsForEdit = (row: CampaignMessageRow): string[] =>
  row.pollOptions.length > 0 ? row.pollOptions : [...DEFAULT_POLL_OPTIONS];

export const getEditableScheduleTime = (timeText: string): string =>
  timeText === EMPTY_VALUE ? '' : timeText;

export const getScheduleTimeParts = (
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

export const buildScheduleTimeText = ({
  hour,
  period,
}: CampaignMessagesScheduleTimeParts): string => `${hour}:00 ${period}`;

export const getIsoWithScheduleTime = (
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
