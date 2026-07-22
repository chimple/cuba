import {
  type Dispatch,
  type MutableRefObject,
  type SetStateAction,
} from 'react';
import { CampaignFrequency } from '../../../services/api/ServiceApi';
import { Json } from '../../../services/database';

export const EMPTY_VALUE = '--';
export const DEFAULT_POLL_OPTIONS = ['', ''];
export const CAMPAIGN_MESSAGES_PAGE_SIZE = 20;

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
  campaignFrequency?: CampaignFrequency;
  isCampaignCancelled?: boolean;
  translate: (key: string) => string;
}

export interface CampaignMessageSavePayload {
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

export interface CampaignMessagePoll {
  question?: string | null;
  options?: readonly (string | null)[] | null;
}

export interface CampaignMessageApiRow {
  id?: string | null;
  message_time?: string | null;
  poll_time?: string | null;
  message?: string | null;
  media_link?: string | null;
  poll?: CampaignMessagePoll | Json | null;
  message_status?: string | null;
  poll_status?: string | null;
}

export interface CampaignMessagesApiData {
  messages?: CampaignMessageApiRow[] | null;
}

export const emptyCampaignMessagesData: CampaignMessagesData = {
  messageTime: EMPTY_VALUE,
  pollTime: EMPTY_VALUE,
  rows: [],
  total: 0,
};
