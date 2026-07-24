import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useHistory, useLocation, useParams } from 'react-router-dom';
import {
  DEFAULT_PAGE_SIZE,
  PAGES,
  REQUEST_TABS,
  TableTypes,
} from '../../common/constants';
import { Constants } from '../../services/database';
import { ServiceConfig } from '../../services/ServiceConfig';
import logger from '../../utility/logger';

export const useStudentPendingRequestDetails = () => {
  const { id } = useParams<{ id: string }>();
  const history = useHistory();
  const location = useLocation();
  const api = ServiceConfig.getI().apiHandler;
  const { t } = useTranslation();

  const [requestData, setRequestData] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [totalStudents, setTotalStudents] = useState(0);
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [loading, setLoading] = useState(true);
  const [studentDetails, setStudentDetails] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showRejectPopup, setShowRejectPopup] = useState(false);

  const fetchStudents = useCallback(
    async (classId: string, page: number, size: number) => {
      setLoading(true);
      const response = await api.getStudentsAndParentsByClassId(
        classId,
        page,
        size,
      );
      if (requestData?.requested_by) {
        const studentData = await api.getStudentAndParentByStudentId(
          requestData.requested_by,
        );
        setStudentDetails(studentData);
      } else {
        logger.warn(
          'requestData.requested_by was undefined when fetching student details.',
        );
      }
      setStudents(response?.data || []);
      setTotalStudents(response?.total || 0);
      setLoading(false);
    },
    [api, requestData],
  );

  useEffect(() => {
    async function fetchRequest() {
      setLoading(true);
      try {
        const state = location.state as { request?: any } | undefined;
        const authHandler = ServiceConfig.getI().authHandler;
        const respondedBy = await authHandler.getCurrentUser();

        if (state?.request && state.request.request_id === id) {
          state.request.responded_by = respondedBy?.id;
          state.request.respondedBy = respondedBy;
          setRequestData(state.request);
        } else {
          const [pendingRequests, approvedRequests, rejectedRequests] =
            await Promise.all([
              api.getOpsRequests(
                Constants.public.Enums.ops_request_status[0],
                1,
                DEFAULT_PAGE_SIZE,
              ),
              api.getOpsRequests(
                Constants.public.Enums.ops_request_status[2],
                1,
                DEFAULT_PAGE_SIZE,
              ),
              api.getOpsRequests(
                Constants.public.Enums.ops_request_status[1],
                1,
                DEFAULT_PAGE_SIZE,
              ),
            ]);

          const allRequests = [
            ...(pendingRequests?.data || []),
            ...(approvedRequests?.data || []),
            ...(rejectedRequests?.data || []),
          ];
          const req = allRequests.find(
            (r: TableTypes<'ops_requests'> | Record<string, unknown>) =>
              'request_id' in r && r.request_id === id,
          );

          setRequestData(req || null);
        }
      } catch (error) {
        logger.error('Error fetching request data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchRequest();
  }, [id, api, location.state]);

  useEffect(() => {
    if (requestData?.class_id) {
      fetchStudents(requestData.class_id, currentPage, pageSize);
    }
  }, [requestData, currentPage, pageSize, fetchStudents]);

  const handleRadioChange = (studentId: string, checked: boolean) => {
    if (checked) {
      setSelectedStudent(studentId);
    } else {
      setSelectedStudent(null);
    }
  };

  const handlePageChange = (event: unknown, newPage: number) =>
    setCurrentPage(newPage + 1);

  const handleConfirmApprove = async () => {
    const currentRequestId = requestData?.id;
    const currentRequest_Id = requestData?.request_id;
    const currentSelectedStudent = selectedStudent;
    const newStudentUserId =
      requestData?.requested_by || requestData?.requestedBy?.id;
    const isMergeFlow = Boolean(currentSelectedStudent && newStudentUserId);
    const auth = ServiceConfig.getI().authHandler;
    const user = await auth.getCurrentUser();
    if (!user?.id) {
      throw new Error('No logged-in user found. Cannot approve request.');
    }
    const respondedBy = user?.id;

    if (!currentRequestId) {
      logger.error(t('Missing request row ID for approval.'));
      return;
    }

    setLoading(true);
    try {
      if (isMergeFlow) {
        if (!currentSelectedStudent || !newStudentUserId) {
          logger.error(
            t('Missing student identifiers required for merge approval.'),
          );
          return;
        }
        const mergeResult = await api.mergeStudentRequest(
          newStudentUserId,
          currentSelectedStudent,
          currentRequest_Id,
          respondedBy,
        );

        if (!mergeResult?.success) {
          const mergeErrorMessage =
            mergeResult?.message ||
            t('Unable to merge this student request during approval.');
          logger.error(mergeErrorMessage);
          return;
        }
      } else {
        const requestRole = requestData?.request_type;
        await api.approveOpsRequest(currentRequestId, respondedBy, requestRole);
      }

      history.push(
        `${PAGES.SIDEBAR_PAGE}${PAGES.REQUEST_LIST}?tab=${REQUEST_TABS.APPROVED}`,
      );
    } catch (error) {
      logger.error(t('Error approving/merging request:'), error);
    } finally {
      setLoading(false);
    }
  };

  const filteredStudents = students.filter(
    (stu) => stu.user.id !== requestData?.requested_by,
  );
  const filteredTotalStudents =
    totalStudents - (students.length - filteredStudents.length);
  const normalizedSearchTerm = searchTerm.trim().toLowerCase();
  const displayedStudents = filteredStudents.filter((stu) => {
    if (!normalizedSearchTerm) return true;
    const studentName = (stu.user?.name ?? '').toString().toLowerCase();
    const studentId = (stu.user?.student_id ?? '').toString().toLowerCase();
    const phoneNumber = (stu.parent?.phone ?? '').toString().toLowerCase();
    return (
      studentName.includes(normalizedSearchTerm) ||
      studentId.includes(normalizedSearchTerm) ||
      phoneNumber.includes(normalizedSearchTerm)
    );
  });

  return {
    currentPage,
    displayedStudents,
    filteredTotalStudents,
    handleConfirmApprove,
    handlePageChange,
    handleRadioChange,
    history,
    id,
    loading,
    pageSize,
    requestData,
    searchTerm,
    selectedStudent,
    setSearchTerm,
    setShowRejectPopup,
    showRejectPopup,
    studentDetails,
  };
};
