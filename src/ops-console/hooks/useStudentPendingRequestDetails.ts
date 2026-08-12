import { useCallback, useEffect, useRef, useState } from 'react';
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
  const normalizedSearchTerm = searchTerm.trim().toLowerCase();
  const studentFetchIdRef = useRef(0);

  const fetchStudents = useCallback(
    async (
      classId: string,
      page: number,
      size: number,
      search: string,
      schoolId?: string,
    ) => {
      const fetchId = ++studentFetchIdRef.current;
      setLoading(true);
      try {
        const trimmedSearch = search.trim();
        const response =
          trimmedSearch && schoolId
            ? await api.searchStudentsInSchool(
                schoolId,
                trimmedSearch,
                page,
                size,
                classId,
                undefined,
                requestData?.requested_by,
              )
            : await api.getStudentsAndParentsByClassId(
                classId,
                page,
                size,
                requestData?.requested_by,
              );
        if (fetchId !== studentFetchIdRef.current) return;

        const studentRows = response?.data || [];
        const total = response?.total || 0;

        if (requestData?.requested_by) {
          const studentData = await api.getStudentAndParentByStudentId(
            requestData.requested_by,
          );
          if (fetchId !== studentFetchIdRef.current) return;

          setStudentDetails(studentData);
        } else {
          logger.warn(
            'requestData.requested_by was undefined when fetching student details.',
          );
        }
        setStudents(studentRows);
        setTotalStudents(total);
      } catch (error) {
        logger.error('Error fetching students:', error);
        if (fetchId !== studentFetchIdRef.current) return;
        setStudents([]);
        setTotalStudents(0);
      } finally {
        if (fetchId === studentFetchIdRef.current) {
          setLoading(false);
        }
      }
    },
    [api, requestData],
  );

  const getRequestSchoolId = useCallback(
    () =>
      String(requestData?.school?.id ?? requestData?.school_id ?? '').trim() ||
      undefined,
    [requestData],
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
    if (!requestData?.class_id) return;
    fetchStudents(
      requestData.class_id,
      currentPage,
      pageSize,
      normalizedSearchTerm,
      getRequestSchoolId(),
    );
  }, [
    requestData,
    currentPage,
    pageSize,
    fetchStudents,
    normalizedSearchTerm,
    getRequestSchoolId,
  ]);

  const handleRadioChange = (studentId: string, checked: boolean) => {
    if (checked) {
      setSelectedStudent(studentId);
    } else {
      setSelectedStudent(null);
    }
  };

  const handlePageChange = (event: unknown, newPage: number) =>
    setCurrentPage(newPage + 1);

  const handleSearchTermChange = useCallback((value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  }, []);

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
  const isServerSearchActive = Boolean(
    normalizedSearchTerm && getRequestSchoolId(),
  );
  const searchedStudents = filteredStudents.filter((stu) => {
    if (!normalizedSearchTerm || isServerSearchActive) return true;
    const studentName = (stu.user?.name ?? '').toString().toLowerCase();
    const studentId = (stu.user?.student_id ?? '').toString().toLowerCase();
    const phoneNumber = (stu.parent?.phone ?? '').toString().toLowerCase();
    return (
      studentName.includes(normalizedSearchTerm) ||
      studentId.includes(normalizedSearchTerm) ||
      phoneNumber.includes(normalizedSearchTerm)
    );
  });
  const displayedStudents = searchedStudents;
  const displayedTotalStudents = !normalizedSearchTerm
    ? filteredTotalStudents
    : isServerSearchActive
      ? filteredTotalStudents
      : searchedStudents.length;

  return {
    currentPage,
    displayedStudents,
    filteredTotalStudents: displayedTotalStudents,
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
    setSearchTerm: handleSearchTermChange,
    setShowRejectPopup,
    showRejectPopup,
    studentDetails,
  };
};
