import { useEffect, useState } from 'react';
import { useParams, useHistory, useLocation } from 'react-router-dom';
import {
  PAGES,
  DEFAULT_PAGE_SIZE,
  REQUEST_TABS,
  RequestTypes,
  STATUS,
  TableTypes,
} from '../../common/constants';
import { useTranslation } from 'react-i18next';
import { ServiceConfig } from '../../services/ServiceConfig';
import logger from '../../utility/logger';

export function useOpsFlaggedRequestDetails() {
  const { id } = useParams<{ id: string }>();
  const history = useHistory();
  const location = useLocation();
  const api = ServiceConfig.getI().apiHandler;
  const { t } = useTranslation();
  const [requestDetails, setRequestDetails] =
    useState<TableTypes<'ops_requests'> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRequestType, setSelectedRequestType] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedSchoolUdise, setSelectedSchoolUdise] = useState('');
  const [selectedSchoolId, setSelectedSchoolId] = useState('');
  const [selectedSchoolName, setSelectedSchoolName] = useState('');
  const [schoolInputValue, setSchoolInputValue] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [selectedState, setSelectedState] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('');
  const [requestTypeOptions, setRequestTypeOptions] = useState<string[]>([]);
  const [classOptions, setClassOptions] = useState<
    Array<{ id: string; name: string }>
  >([]);
  const [schoolOptions, setSchoolOptions] = useState<
    Array<{ id: string; name: string; udise?: string }>
  >([]);
  const [isLoadingDropdowns, setIsLoadingDropdowns] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [validationErrors, setValidationErrors] = useState<{
    [key: string]: string;
  }>({});
  const [isFetchingSchool, setIsFetchingSchool] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [initialUdiseSet, setInitialUdiseSet] = useState(false);

  const resetSchoolFields = () => {
    setSelectedSchoolId('');
    setSelectedSchoolName('');
    setSchoolInputValue('');
    setSelectedDistrict('');
    setSelectedState('');
    setSelectedCountry('');
    setClassOptions([]);
    setSelectedClassId('');
    setSelectedClass('');
  };

  const fetchClasses = async (schoolId: string, preserveClassId?: string) => {
    try {
      const classes = await api.getClassesBySchoolId(schoolId);
      const mappedClasses = classes.map((c) => ({ id: c.id, name: c.name }));
      setClassOptions(mappedClasses);
      if (preserveClassId && preserveClassId.trim() !== '') {
        const selectedClassItem = mappedClasses.find(
          (c) => c.id === preserveClassId,
        );
        if (selectedClassItem) {
          setSelectedClassId(preserveClassId);
          setSelectedClass(selectedClassItem.name);
        }
      }
    } catch (e) {
      logger.error('Error fetching classes:', e);
    }
  };

  const initializeFormFields = (req: any) => {
    setSelectedRequestType(req.request_type || '');
    setSelectedSchoolId(req.school_id || '');
    setSelectedSchoolUdise(req.school?.udise || '');
    setSelectedSchoolName(req.school?.name || '');
    setSchoolInputValue(req.school?.name || '');
    setSelectedDistrict(req.school?.group2 || '');
    setSelectedState(req.school?.group1 || '');
    setSelectedCountry(req.school?.country || '');
    const initialClassId = req.class_id || '';
    setSelectedClassId(initialClassId);
    if (req.school_id) {
      fetchClasses(req.school_id, initialClassId);
    }
  };

  const fetchRequestDetails = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const state = location.state as { request?: any } | undefined;
      if (state?.request && state.request.request_id === id) {
        const req = state.request;
        setRequestDetails(req);
        initializeFormFields(req);
      } else {
        const flaggedRequests = await api.getOpsRequests(
          'flagged',
          1,
          DEFAULT_PAGE_SIZE,
        );
        const req = flaggedRequests?.data?.find(
          (
            r: TableTypes<'ops_requests'> | Record<string, unknown>,
          ): r is TableTypes<'ops_requests'> =>
            'request_id' in r &&
            typeof r.request_id === 'string' &&
            r.request_id === id,
        );
        if (req) {
          setRequestDetails(req);
          initializeFormFields(req);
        } else {
          setError(t('Request not found'));
        }
      }
    } catch (e) {
      logger.error('Error fetching flagged request:', e);
      setError(t('Failed to load request details. Please try again.'));
    } finally {
      setIsLoading(false);
    }
  };

  const fetchDropdownOptions = async () => {
    setIsLoadingDropdowns(true);
    try {
      const types = Object.values(RequestTypes).filter(
        (type) =>
          type === RequestTypes.TEACHER || type === RequestTypes.PRINCIPAL,
      );
      setRequestTypeOptions(types);
    } catch (e) {
      logger.error('Error fetching dropdown options:', e);
    } finally {
      setIsLoadingDropdowns(false);
    }
  };

  const handleSchoolSearch = async (searchTerm: string) => {
    if (!searchTerm || searchTerm.length < 3) {
      setSchoolOptions([]);
      return;
    }
    try {
      const result = await api.searchSchools({
        p_search_text: searchTerm,
        p_page_limit: 20,
        p_page_offset: 0,
      });
      setSchoolOptions(
        result.schools.map((s) => ({
          id: s.id,
          name: s.name,
          udise: s.udise || undefined,
        })),
      );
    } catch (e) {
      logger.error('Error searching schools:', e);
    }
  };

  const fetchFullSchoolDetails = async (schoolId: string) => {
    try {
      const school = await api.getSchoolById(schoolId);
      if (school) {
        setSelectedDistrict(school.group2 || '');
        setSelectedState(school.group1 || '');
        setSelectedCountry(school.country || 'India');
      }
    } catch (e) {
      logger.error('Error fetching full school details:', e);
    }
  };

  const handleSchoolSelect = (
    school: { id: string; name: string; udise?: string } | null,
  ) => {
    if (school) {
      setIsInitialLoad(false);
      setSelectedSchoolId(school.id);
      setSelectedSchoolName(school.name);
      setSchoolInputValue(school.name);
      setSelectedSchoolUdise(school.udise || '');
      setSelectedClassId('');
      setSelectedClass('');
      fetchClasses(school.id);
      fetchFullSchoolDetails(school.id);
    } else {
      setSelectedSchoolUdise('');
      resetSchoolFields();
    }
  };

  const fetchSchoolByUdise = async (udiseCode: string) => {
    setIsFetchingSchool(true);
    try {
      const validation = await api.validateSchoolUdiseCode(udiseCode);
      if (validation.status === 'success') {
        const result = await api.searchSchools({
          p_search_text: udiseCode,
          p_page_limit: 1,
          p_page_offset: 0,
        });
        if (result.schools.length > 0) {
          const school = result.schools[0];
          setSelectedSchoolId(school.id);
          setSelectedSchoolName(school.name);
          setSchoolInputValue(school.name);
          setSelectedDistrict(school.group2 || '');
          setSelectedState(school.group1 || '');
          setSelectedCountry(school.country || '');
          setSelectedClassId('');
          setSelectedClass('');
          fetchClasses(school.id);
          setValidationErrors({ ...validationErrors, udise: '' });
        } else {
          setValidationErrors({
            ...validationErrors,
            udise: t('School not found for this UDISE code'),
          });
        }
      } else {
        setValidationErrors({
          ...validationErrors,
          udise: t('Invalid UDISE code'),
        });
      }
    } catch (e) {
      logger.error('Error fetching school by UDISE:', e);
      setValidationErrors({
        ...validationErrors,
        udise: t('Failed to fetch school details'),
      });
    } finally {
      setIsFetchingSchool(false);
    }
  };

  useEffect(() => {
    fetchRequestDetails();
    fetchDropdownOptions();
  }, [id]);

  useEffect(() => {
    if (isInitialLoad) return;
    if (!initialUdiseSet) {
      setInitialUdiseSet(true);
      return;
    }
    const handler = setTimeout(() => {
      if (selectedSchoolUdise && selectedSchoolUdise.length >= 3) {
        fetchSchoolByUdise(selectedSchoolUdise);
      } else if (!selectedSchoolUdise || selectedSchoolUdise.length === 0) {
        resetSchoolFields();
      }
    }, 800);
    return () => {
      clearTimeout(handler);
    };
  }, [selectedSchoolUdise, isInitialLoad]);

  useEffect(() => {
    if (selectedRequestType === RequestTypes.PRINCIPAL) {
      setSelectedClassId('');
      setSelectedClass('');
    }
  }, [selectedRequestType]);

  const validateFields = (): boolean => {
    const errors: { [key: string]: string } = {};
    if (!selectedRequestType) {
      errors.requestType = t('Request Type is required');
    }
    if (selectedRequestType === RequestTypes.TEACHER) {
      if (selectedSchoolId && classOptions.length > 0 && !selectedClassId) {
        errors.class = t('Class is required');
      }
    }
    if (!selectedSchoolUdise) {
      errors.udise = t('UDISE Code is required');
    }
    if (!selectedSchoolName) {
      errors.schoolName = t('School Name is required');
    }
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleApprove = async () => {
    if (!validateFields()) return;
    setIsApproving(true);
    let currentUserId = '';
    try {
      const currentUser =
        await ServiceConfig.getI().authHandler.getCurrentUser();
      if (!currentUser) {
        setError(t('User not authenticated'));
        return;
      }
      currentUserId = currentUser.id;
      if (!requestDetails?.id) {
        setError(t('Request ID not found'));
        return;
      }
      const role = selectedRequestType as any;
      const requestedByUser = (requestDetails as any)?.requestedBy;
      if (!requestedByUser || !requestedByUser.id) {
        setError(t('User information not found. Cannot approve request.'));
        return;
      }
      if (selectedSchoolId) {
        if (role === RequestTypes.PRINCIPAL) {
          await api.addUserToSchool(selectedSchoolId, requestedByUser, role);
        } else if (role === RequestTypes.TEACHER && selectedClassId) {
          await api.addTeacherToClass(
            selectedSchoolId,
            selectedClassId,
            requestedByUser,
          );
        }
      }
      await api.approveOpsRequest(
        requestDetails.id,
        currentUser.id,
        role,
        selectedSchoolId,
        selectedClassId || undefined,
      );
      history.push({
        pathname: PAGES.SIDEBAR_PAGE + PAGES.REQUEST_LIST,
        search: `?tab=${REQUEST_TABS.APPROVED}`,
      });
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : String(e ?? '');
      const isRoleConflictError =
        errorMessage.includes(
          'cannot be made Principal for the same school.',
        ) ||
        errorMessage.includes(
          'cannot be added as Teacher for the same school.',
        );
      if (isRoleConflictError && requestDetails?.id && currentUserId) {
        const rejectedRequest = await api.respondToSchoolRequest(
          requestDetails.id,
          currentUserId,
          STATUS.REJECTED,
          String(t('Verification Failed')),
          errorMessage,
        );
        if (rejectedRequest) {
          history.push({
            pathname: PAGES.SIDEBAR_PAGE + PAGES.REQUEST_LIST,
            search: `?tab=${REQUEST_TABS.REJECTED}`,
          });
          return;
        }
      }
      logger.error('Error approving request:', e);
      setError(t('Failed to approve request. Please try again.'));
    } finally {
      setIsApproving(false);
    }
  };

  const handleCancel = () => {
    history.push({
      pathname: PAGES.SIDEBAR_PAGE + PAGES.REQUEST_LIST,
      search: `?tab=${REQUEST_TABS.FLAGGED}`,
    });
  };

  return {
    classOptions,
    error,
    handleApprove,
    handleCancel,
    handleSchoolSearch,
    handleSchoolSelect,
    history,
    id,
    initialUdiseSet,
    isApproving,
    isFetchingSchool,
    isInitialLoad,
    isLoading,
    isLoadingDropdowns,
    requestDetails,
    requestTypeOptions,
    resetSchoolFields,
    schoolInputValue,
    schoolOptions,
    selectedClassId,
    selectedCountry,
    selectedDistrict,
    selectedRequestType,
    selectedSchoolId,
    selectedSchoolName,
    selectedSchoolUdise,
    selectedState,
    setClassOptions,
    setInitialUdiseSet,
    setIsInitialLoad,
    setSchoolInputValue,
    setSelectedClass,
    setSelectedClassId,
    setSelectedCountry,
    setSelectedDistrict,
    setSelectedRequestType,
    setSelectedSchoolId,
    setSelectedSchoolName,
    setSelectedSchoolUdise,
    setSelectedState,
    setValidationErrors,
    validationErrors,
  };
}
