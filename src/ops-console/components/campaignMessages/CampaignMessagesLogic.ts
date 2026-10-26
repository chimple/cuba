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
import { CampaignFrequency } from '../../../services/api/ServiceApi';
import { hasCampaignWriteAccess } from '../../../services/api/campaignListingHelpers';
import {
  buildFrequencyTimelineDates,
  DEFAULT_FREQUENCY,
} from '../campaignSetup/campaignAssignmentUtils';
import { buildCampaignDurationTimelineDates } from '../campaignSetup/campaignCommunicationUtils';
import { useAppSelector } from '../../../redux/hooks';
import { AuthState } from '../../../redux/slices/auth/authSlice';
import { RootState } from '../../../redux/store';
import {
  buildCampaignMessagesData,
  isSundayDateKey,
  loadCampaignMessagesData,
} from './CampaignMessagesData';
import {
  buildCampaignMessageSavePayload,
  buildScheduleTimeText,
  getEditableScheduleTime,
  getIsoWithScheduleTime,
  getPollOptionsForEdit,
  getReadonlyText,
  getScheduleTimeParts,
} from './CampaignMessagesSave';
import {
  CAMPAIGN_MESSAGES_NO_CHANGES_TOAST,
  CAMPAIGN_MESSAGES_PAGE_SIZE,
  CampaignMessageRow,
  CampaignMessagesData,
  CampaignMessagesController,
  CampaignMessagesScheduleTimeParts,
  CampaignMessagesScheduleType,
  CampaignMessagesTimePart,
  DEFAULT_POLL_OPTIONS,
  emptyCampaignMessagesData,
} from './CampaignMessagesTypes';

export {
  buildCampaignMessagesData,
  loadCampaignMessagesData,
} from './CampaignMessagesData';
export { buildCampaignMessageSavePayload } from './CampaignMessagesSave';
export {
  CAMPAIGN_MESSAGES_EDIT_ICON_SRC,
  CAMPAIGN_MESSAGES_NO_CHANGES_TOAST,
  HOUR_OPTIONS,
  PERIOD_OPTIONS,
  emptyCampaignMessagesData,
} from './CampaignMessagesTypes';
export type {
  CampaignMessageRow,
  CampaignMessagesController,
  CampaignMessagesData,
  CampaignMessagesScheduleTimeParts,
  CampaignMessagesScheduleType,
  CampaignMessagesTimePart,
  CampaignMessagesTimePeriod,
} from './CampaignMessagesTypes';

interface UseCampaignMessagesControllerParams {
  campaignId?: string;
  campaignStartDate?: string;
  campaignEndDate?: string;
  campaignFrequency?: CampaignFrequency;
  isCampaignCancelled?: boolean;
  translate: (key: string) => string;
}

export const useCampaignMessagesController = ({
  campaignId,
  campaignStartDate,
  campaignEndDate,
  campaignFrequency = DEFAULT_FREQUENCY,
  isCampaignCancelled = false,
  translate,
}: UseCampaignMessagesControllerParams): CampaignMessagesController => {
  const { roles } = useAppSelector(
    (state: RootState) => state.auth as AuthState,
  );
  // A cancelled campaign must become read-only even when the user's role
  // normally grants campaign write access.
  const canEdit = !isCampaignCancelled && hasCampaignWriteAccess(roles || []);
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
        ? buildFrequencyTimelineDates(
            campaignStartDate,
            campaignEndDate,
            campaignFrequency,
          )
        : [],
    [campaignEndDate, campaignFrequency, campaignStartDate],
  );
  const campaignRangeDates = useMemo(
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
      // Fetch the full calendar range so persisted Sunday rows cannot displace
      // later non-Sunday campaign dates from the paginated response.
      const pageSize =
        campaignRangeDates.length > 0
          ? campaignRangeDates.length
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
  }, [campaignId, campaignRangeDates.length, displayTimelineDates]);

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
            campaignRangeDates.length > 0
              ? campaignRangeDates.length
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
