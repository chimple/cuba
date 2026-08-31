import { useEffect, useState } from 'react';
import { useHistory, useLocation, useParams } from 'react-router-dom';
import {
  PAGES,
  REQUEST_TABS,
  RequestTypes,
  STATUS,
  TableTypes,
} from '../../common/constants';
import { Constants } from '../../services/database';
import { ServiceConfig } from '../../services/ServiceConfig';
import { RoleType } from '../../interface/modelInterfaces';
import logger from '../../utility/logger';
import { t } from 'i18next';

export const usePrincipalTeacherPendingRequest = () => {
  const [gradeOptions, setGradeOptions] = useState<
    { label: string; value: string }[]
  >([]);
  const { id } = useParams<{ id: string }>();
  const history = useHistory();
  const location = useLocation();
  const api = ServiceConfig.getI().apiHandler;

  const [isEditing, setIsEditing] = useState(false);
  const [editableRequestType, setEditableRequestType] = useState<
    RequestTypes | ''
  >('');
  const [roleOptions, setRoleOptions] = useState<
    { label: string; value: string }[]
  >([]);
  const [selectedGradeId, setSelectedGradeId] = useState<string>('');
  const [requestData, setRequestData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showRejectPopup, setShowRejectPopup] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string>('');

  const resetEditState = () => {
    setIsEditing(false);
    setEditableRequestType('');
    setSelectedGradeId('');
  };

  const editClicked = async () => {
    const options = Object.values(RequestTypes)
      .filter(
        (type) =>
          type === RequestTypes.TEACHER || type === RequestTypes.PRINCIPAL,
      )
      .map((type) => ({
        label: type.charAt(0).toUpperCase() + type.slice(1),
        value: type,
      }));
    setRoleOptions(options);
    const schoolId = requestData?.school?.id || requestData?.school_id;
    const requestType = requestData?.request_type ?? '';
    const classId = requestData?.class_id ?? '';

    setEditableRequestType(requestType);
    setSelectedGradeId(classId);

    if (schoolId) {
      try {
        const response = await api.getClassesBySchoolId(schoolId);
        const classes = Array.isArray(response) ? response : [response];
        const gradeOpts = classes.map((cls: any) => ({
          label: cls.name,
          value: cls.id,
        }));

        setGradeOptions(gradeOpts);
      } catch (err) {
        logger.error('Error fetching classes for school:', err);
      }
    }

    setIsEditing(true);
  };

  useEffect(() => {
    async function fetchRequest() {
      setLoading(true);
      try {
        const state = location.state as { request?: any } | undefined;
        if (state?.request && state.request.request_id === id) {
          setRequestData(state.request);
        } else {
          const [pendingRequests, approvedRequests, rejectedRequests] =
            await Promise.all([
              api.getOpsRequests(
                Constants.public.Enums.ops_request_status[0],
                1,
                1000,
              ),
              api.getOpsRequests(
                Constants.public.Enums.ops_request_status[2],
                1,
                1000,
              ),
              api.getOpsRequests(
                Constants.public.Enums.ops_request_status[1],
                1,
                1000,
              ),
            ]);

          const allRequests = [
            ...(pendingRequests?.data || []),
            ...(approvedRequests?.data || []),
            ...(rejectedRequests?.data || []),
          ];
          const req = allRequests.find(
            (request: TableTypes<'ops_requests'> | Record<string, unknown>) =>
              'request_id' in request && request.request_id === id,
          );

          setRequestData(req || null);
        }
      } finally {
        setLoading(false);
      }
    }
    fetchRequest();
  }, [id, api, location.state]);

  const handleApproveClick = async () => {
    if (!requestData?.id && !requestData?.request_id) {
      return;
    }

    let requestRowId: string | undefined;
    let requestPrimaryId: string | undefined;
    let respondedBy = '';

    try {
      requestRowId = requestData?.id || requestData?.request_id;
      requestPrimaryId = requestData?.id;
      const role = (
        isEditing && editableRequestType
          ? editableRequestType
          : requestData.request_type
      )?.toLowerCase?.() as RequestTypes;
      const requestedByUser =
        requestData?.requestedBy ||
        (requestData?.requested_by ? { id: requestData.requested_by } : null);

      const schoolId =
        requestData?.school?.id || requestData?.school_id || undefined;

      const classId =
        role === RequestTypes.TEACHER || role === RequestTypes.STUDENT
          ? (isEditing ? selectedGradeId : requestData?.class_id) ||
            requestData?.class_id ||
            undefined
          : undefined;

      const auth = ServiceConfig.getI().authHandler;
      const user = await auth.getCurrentUser();
      if (!user?.id) {
        throw new Error('No logged-in user found. Cannot approve request.');
      }
      respondedBy = user?.id;

      if (!requestRowId) {
        throw new Error('Request row id is missing. Cannot approve request.');
      }
      if (!requestedByUser?.id) {
        throw new Error('Requested user is missing. Cannot approve request.');
      }
      if (
        (role === RequestTypes.TEACHER || role === RequestTypes.STUDENT) &&
        !classId
      ) {
        throw new Error('Class is required for teacher/student approval.');
      }

      if (schoolId) {
        if (role === RequestTypes.PRINCIPAL) {
          await api.addUserToSchool(
            schoolId,
            requestedByUser,
            RoleType.PRINCIPAL,
          );
        } else if (role === RequestTypes.TEACHER) {
          await api.addTeacherToClass(schoolId, classId, requestedByUser);
        }
      }

      const approvedRequest = await api.approveOpsRequest(
        requestRowId,
        respondedBy,
        role,
        schoolId,
        classId,
      );
      if (!approvedRequest) {
        throw new Error('Approve request update failed.');
      }

      history.push(
        `${PAGES.SIDEBAR_PAGE}${PAGES.REQUEST_LIST}?tab=${REQUEST_TABS.APPROVED}`,
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error ?? '');
      const isRoleConflictError =
        errorMessage.includes(
          'cannot be made Principal for the same school.',
        ) ||
        errorMessage.includes(
          'cannot be added as Teacher for the same school.',
        );

      if (
        isRoleConflictError &&
        respondedBy &&
        (requestPrimaryId || requestRowId)
      ) {
        const rejectRequestId = requestPrimaryId || requestRowId;
        if (!rejectRequestId) {
          logger.error(
            'Request id missing while auto-rejecting a role conflict error.',
          );
          logger.error('Error approving request:', error);
          return;
        }
        const rejectedRequest = await api.respondToSchoolRequest(
          rejectRequestId,
          respondedBy,
          STATUS.REJECTED,
          String(t('Verification Failed')),
          errorMessage,
        );
        if (rejectedRequest) {
          history.push(
            `${PAGES.SIDEBAR_PAGE}${PAGES.REQUEST_LIST}?tab=${REQUEST_TABS.REJECTED}`,
          );
          return;
        }
      }

      logger.error('Error approving request:', error);
    }
  };

  const handleRejectClick = async () => {
    const auth = ServiceConfig.getI().authHandler;
    const user = await auth.getCurrentUser();
    if (!user?.id) {
      logger.error('No logged-in user found. Cannot reject request.');
      return;
    }
    const userId = user?.id;
    setCurrentUserId(userId ?? '');
    setShowRejectPopup(true);
  };

  return {
    currentUserId,
    editClicked,
    editableRequestType,
    gradeOptions,
    handleApproveClick,
    handleRejectClick,
    history,
    id,
    isEditing,
    loading,
    requestData,
    resetEditState,
    roleOptions,
    selectedGradeId,
    setEditableRequestType,
    setSelectedGradeId,
    setShowRejectPopup,
    showRejectPopup,
  };
};
