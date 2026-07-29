import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useMediaQuery } from '@mui/material';
import { t } from 'i18next';
import { ServiceConfig } from '../../../services/ServiceConfig';
import { PerformanceLevel, StudentInfo } from '../../../common/constants';
import { ClassRow, SchoolData } from './SchoolClass';
import {
  filterByProgramGrades,
  getProgramAllowedGrades,
  ProgramGradeScopeData,
} from './ClassDetailsPageUtils';
import { RoleType } from '../../../interface/modelInterfaces';
import { useAppSelector } from '../../../redux/hooks';
import { RootState } from '../../../redux/store';
import { AuthState } from '../../../redux/slices/auth/authSlice';
import { useSchoolStudentActions } from './useSchoolStudentActions';
import { useSchoolStudentClassContext } from './useSchoolStudentClassContext';
import { useSchoolStudentFields } from './useSchoolStudentFields';
import { useSchoolStudentsColumns } from './useSchoolStudentsColumns';
import { useSchoolStudentsList } from './useSchoolStudentsList';
import { useSchoolStudentsRows } from './useSchoolStudentsRows';
import { useSchoolStudentsStatus } from './useSchoolStudentsStatus';
import type { ApiStudentData, DisplayStudent } from './SchoolStudents.types';

export interface SchoolStudentsProps {
  data: {
    schoolData?: SchoolData;
    programData?: ProgramGradeScopeData;
    students?: ApiStudentData[];
    totalStudentCount?: number;
    classData?: ClassRow[];
    totalCount?: number;
  };
  isMobile: boolean;
  schoolId: string;
  isTotal?: boolean;
  isFilter?: boolean;
  customTitle?: string;
  optionalClassId?: string;
  optionalGrade?: number | string;
  optionalSection?: string;
}

export const useSchoolStudentsController = ({
  data,
  schoolId,
  isTotal,
  isFilter,
  customTitle,
  optionalClassId,
  optionalGrade,
  optionalSection,
}: SchoolStudentsProps) => {
  const { roles } = useAppSelector(
    (state: RootState) => state.auth as AuthState,
  );
  const userRoles = roles || [];
  const isExternalUser = userRoles.includes(RoleType.EXTERNAL_USER);
  const isSmallScreen = useMediaQuery('(max-width: 768px)');
  // Derives the active program grade scope before loading student rows.
  const allowedGrades = useMemo(
    () => getProgramAllowedGrades(data.programData),
    [data.programData],
  );
  const programScopedClasses = useMemo(
    () => filterByProgramGrades(data.classData, allowedGrades),
    [data.classData, allowedGrades],
  );
  // Converts scoped classes to IDs for server-side student filtering.
  const programScopedClassIds = useMemo(() => {
    if (!allowedGrades) return undefined;
    return programScopedClasses
      .map((classRow) => String(classRow.id ?? '').trim())
      .filter((classId) => classId !== '');
  }, [allowedGrades, programScopedClasses]);
  const hasProgramClassScope = allowedGrades !== null;
  const hasCompletePrefetchedStudents =
    !hasProgramClassScope &&
    Array.isArray(data?.students) &&
    data.students.length > 0 &&
    typeof data.totalStudentCount === 'number' &&
    data.students.length >= data.totalStudentCount;

  const {
    baseStudents,
    classFilterOptions,
    debouncedSearchTerm,
    fetchStudents,
    filters,
    handleApplyFilters,
    handleDeleteAppliedFilter,
    handlePageChange,
    handleSearchChange,
    handleSort,
    invalidateStudentListCache,
    isFilterSliderOpen,
    isLoading,
    normalizedStudents,
    order,
    orderBy,
    page,
    searchTerm,
    setFilters,
    setIsFilterSliderOpen,
    setPage,
    setTempFilters,
    students,
    sortedStudents,
    tempFilters,
    totalCount,
  } = useSchoolStudentsList({
    allowedGrades,
    data,
    hasCompletePrefetchedStudents,
    optionalClassId,
    optionalGrade,
    optionalSection,
    programScopedClassIds,
    schoolId,
  });

  const issTotal = isTotal ?? true;
  const issFilter = isFilter ?? true;
  const custoomTitle = customTitle ?? 'Students';
  const api = ServiceConfig.getI().apiHandler;
  const currentClassRef = useRef<{ id: string; name: string } | null>(null);
  const isAtSchool = useMemo(() => {
    const raw = (data?.schoolData?.model ?? '').toString();
    const norm = raw
      .trim()
      .toLowerCase()
      .replace(/[\s-]+/g, '_');
    return norm === 'at_school';
  }, [data?.schoolData?.model]);
  const [performanceFilter, setPerformanceFilter] = useState<PerformanceLevel>(
    PerformanceLevel.ALL,
  );

  // Resolve the opened class instead of defaulting its status lookup to the first class.
  const classDataRef = data.classData?.find(
    (classRow) => !optionalClassId || classRow.id === optionalClassId,
  );

  const {
    getWhatsappGroupStatus,
    isPerformanceLoading,
    studentPerformanceMap,
  } = useSchoolStudentsStatus({
    api,
    classDataRef,
    data,
    issTotal,
    normalizedStudents,
    programScopedClasses,
    sortedStudents,
  });

  const getStudentInfoById = useCallback(
    (id: string): StudentInfo | null => {
      if (!Array.isArray(students)) return null;
      return students.find((stu) => stu.user?.id === id) || null;
    },
    [students],
  );

  const getDeleteTargetStudent = useCallback(
    (student: DisplayStudent): StudentInfo => {
      const source = student.original as StudentInfo & {
        classId?: string;
        class_id?: string;
        class_name?: string;
      };

      const resolvedClassId =
        source.classWithidname?.id || source.classId || source.class_id || '';
      const resolvedClassName =
        source.classWithidname?.class_name || source.class_name || '';

      return {
        ...source,
        classWithidname: resolvedClassId
          ? {
              id: resolvedClassId,
              class_name: resolvedClassName,
            }
          : source.classWithidname,
      };
    },
    [],
  );

  const {
    handleCancelFilters,
    handleClearFilters,
    handleFilterIconClick,
    handlePerformanceFilterChange,
    handleSliderFilterChange,
    hideFilterUI,
    isDataPresent,
    isFilteringOrSearching,
    pageCount,
    studentsForCurrentPage,
  } = useSchoolStudentsRows({
    classDataRefId: classDataRef?.id,
    filters,
    getWhatsappGroupStatus,
    isLoading,
    issTotal,
    page,
    performanceFilter,
    searchTerm,
    setFilters,
    setIsFilterSliderOpen,
    setPage,
    setPerformanceFilter,
    setTempFilters,
    sortedStudents,
    studentPerformanceMap,
    tempFilters,
    totalCount,
  });

  const {
    deleteTargetStudent,
    editStudentData,
    errorMessage,
    handleAddNewStudent,
    handleCloseAddStudentModal,
    handleConfirmDelete,
    handleEditSubmit,
    handleInteractClick,
    handleMergeStudents,
    handleSubmitAddStudentModal,
    isAddStudentModalOpen,
    isDeleting,
    isDeleteModalOpen,
    isEditStudentModalOpen,
    isMergeStudentModalOpen,
    isMergingStudent,
    isSubmitting,
    mergePrimaryStudent,
    openPopup,
    popup,
    setDeleteTargetStudent,
    setEditStudentData,
    setIsDeleteModalOpen,
    setIsEditStudentModalOpen,
    setIsMergeStudentModalOpen,
    setMergePrimaryStudent,
    setOpenPopup,
    setPopup,
    studentData,
    studentStatus,
  } = useSchoolStudentActions({
    api,
    currentClassRef,
    debouncedSearchTerm,
    fetchStudents,
    getStudentInfoById,
    invalidateStudentListCache,
    isAtSchool,
    issTotal,
    schoolId,
    setPage,
  });

  const columns = useSchoolStudentsColumns({
    getDeleteTargetStudent,
    getStudentInfoById,
    handleInteractClick,
    isExternalUser,
    issTotal,
    setDeleteTargetStudent,
    setEditStudentData,
    setIsDeleteModalOpen,
    setIsEditStudentModalOpen,
    setIsMergeStudentModalOpen,
    setMergePrimaryStudent,
  });

  const { classOptions, currentClass, editClassOptions, mergeModalClassId } =
    useSchoolStudentClassContext({
      baseStudents,
      classData: data.classData,
      editStudentData,
      issTotal,
      mergePrimaryStudent,
      optionalClassId,
      optionalGrade,
      optionalSection,
      programScopedClasses,
    });

  useEffect(() => {
    currentClassRef.current = currentClass;
  }, [currentClass, currentClassRef]);

  const { addStudentFields, editStudentFields } = useSchoolStudentFields({
    classOptions,
    editClassOptions,
    editStudentData,
    isAtSchool,
    issTotal,
  });

  const filterConfigsForSchool = [{ key: 'class', label: 'Class' }];

  const performanceFilters = [
    { key: PerformanceLevel.ALL, label: t('All') },
    { key: PerformanceLevel.NEED_HELP, label: t('Not Active') },
    { key: PerformanceLevel.DOING_GOOD, label: t('High Engagement') },
    { key: PerformanceLevel.STILL_LEARNING, label: t('Medium Engagement') },
    { key: PerformanceLevel.NOT_TRACKED, label: t('Not Downloaded') },
  ];
  return {
    contentProps: {
      classFilterOptions,
      columns,
      custoomTitle,
      filterConfigsForSchool,
      filters,
      handleAddNewStudent,
      handleApplyFilters,
      handleCancelFilters,
      handleClearFilters,
      handleDeleteAppliedFilter,
      handleFilterIconClick,
      handlePageChange,
      handlePerformanceFilterChange,
      handleSearchChange,
      handleSliderFilterChange,
      handleSort,
      hideFilterUI,
      isDataPresent,
      isExternalUser,
      isFilterSliderOpen,
      isFilteringOrSearching,
      isLoading,
      isPerformanceLoading,
      isSmallScreen,
      issFilter,
      issTotal,
      optionalGrade,
      optionalSection,
      order,
      orderBy,
      page,
      pageCount,
      performanceFilter,
      performanceFilters,
      searchTerm,
      setIsFilterSliderOpen,
      studentsForCurrentPage,
      tempFilters,
      totalCount,
    },
    dialogsProps: {
      addStudentFields,
      currentClass,
      deleteTargetStudent,
      editStudentData,
      editStudentFields,
      errorMessage,
      handleCloseAddStudentModal,
      handleConfirmDelete,
      handleEditSubmit,
      handleMergeStudents,
      handleSubmitAddStudentModal,
      isAddStudentModalOpen,
      isDeleting,
      isDeleteModalOpen,
      isEditStudentModalOpen,
      isMergeStudentModalOpen,
      isMergingStudent,
      isSubmitting,
      issTotal,
      mergeModalClassId,
      mergePrimaryStudent,
      openPopup,
      popup,
      schoolId,
      setDeleteTargetStudent,
      setEditStudentData,
      setIsDeleteModalOpen,
      setIsEditStudentModalOpen,
      setIsMergeStudentModalOpen,
      setMergePrimaryStudent,
      setOpenPopup,
      setPopup,
      studentData,
      studentStatus,
    },
  };
};
