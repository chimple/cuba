import { useCallback, useMemo } from 'react';
import { useMediaQuery } from '@mui/material';
import { ServiceConfig } from '../../../services/ServiceConfig';
import { RoleType } from '../../../interface/modelInterfaces';
import { useAppSelector } from '../../../redux/hooks';
import { RootState } from '../../../redux/store';
import { AuthState } from '../../../redux/slices/auth/authSlice';
import {
  filterByProgramGrades,
  getProgramAllowedGrades,
} from './ClassDetailsPageUtils';
import { ROWS_PER_PAGE } from './SchoolTeachers.utils';
import type {
  DisplayTeacher,
  SchoolTeachersProps,
} from './SchoolTeachers.types';
import { useSchoolTeacherActions } from './useSchoolTeacherActions';
import { useSchoolTeachersColumns } from './useSchoolTeachersColumns';
import { useSchoolTeachersFields } from './useSchoolTeachersFields';
import { useSchoolTeachersList } from './useSchoolTeachersList';
import { useSchoolTeachersPerformance } from './useSchoolTeachersPerformance';
import { useSchoolTeachersWhatsapp } from './useSchoolTeachersWhatsapp';

export const useSchoolTeachersController = ({
  data,
  schoolId,
}: SchoolTeachersProps) => {
  const isSmallScreen = useMediaQuery('(max-width: 768px)');
  const { roles } = useAppSelector(
    (state: RootState) => state.auth as AuthState,
  );
  const userRoles = roles || [];
  const isExternalUser = userRoles.includes(RoleType.EXTERNAL_USER);
  const allowedGrades = useMemo(
    () => getProgramAllowedGrades(data.programData),
    [data.programData],
  );
  const programScopedClasses = useMemo(
    () => filterByProgramGrades(data.classData, allowedGrades),
    [data.classData, allowedGrades],
  );
  const programScopedClassIds = useMemo(() => {
    if (!allowedGrades) return undefined;
    return programScopedClasses
      .map((classRow) => String(classRow.id ?? '').trim())
      .filter((classId) => classId !== '');
  }, [allowedGrades, programScopedClasses]);

  const api = ServiceConfig.getI().apiHandler;
  const {
    classFilterOptions,
    fetchTeachers,
    filters,
    handleApplyFilters,
    handleCancelFilters,
    handleClearFilters,
    handleDeleteAppliedFilter,
    handleFilterIconClick,
    handlePageChange,
    handleSearchChange,
    handleSliderFilterChange,
    handleSort,
    isFilterSliderOpen,
    isLoading,
    order,
    orderBy,
    page,
    programFilteredTeachers,
    searchTerm,
    setIsFilterSliderOpen,
    setPage,
    sortedTeachers,
    teachers,
    tempFilters,
    totalCount,
  } = useSchoolTeachersList({
    allowedGrades,
    data,
    programScopedClassIds,
    schoolId,
  });

  const getTeacherInfo = useCallback(
    (userId: string, classId: string) => {
      if (!Array.isArray(teachers)) return null;

      return (
        teachers.find(
          (teacher) =>
            teacher.user?.id === userId &&
            teacher.classWithidname.id === classId,
        ) || null
      );
    },
    [teachers],
  );

  const { getWhatsappGroupStatus } = useSchoolTeachersWhatsapp({
    api,
    bot: data?.schoolData?.whatsapp_bot_number ?? undefined,
    programScopedClasses,
  });

  const { teachersWithPerformance, teachersWithWhatsappStatus } =
    useSchoolTeachersPerformance({
      getWhatsappGroupStatus,
      sortedTeachers,
    });

  const actions = useSchoolTeacherActions({
    api,
    fetchTeachers,
    getTeacherInfo,
    page,
    schoolId,
    searchTerm,
    setPage,
    teachers,
  });

  const { editTeacherFields, editTeacherInitialValues, teacherFormFields } =
    useSchoolTeachersFields({
      editTeacherState: actions.editTeacherState,
      programScopedClasses,
    });

  const columns = useSchoolTeachersColumns({
    getTeacherInfo,
    handleOpenEditTeacherModal: actions.handleOpenEditTeacherModal,
    isExternalUser,
    setDeleteTargetTeacher: actions.setDeleteTargetTeacher,
    setIsDeleteModalOpen: actions.setIsDeleteModalOpen,
    setOpenPopup: actions.setOpenPopup,
    setTeacherStatus: actions.setTeacherStatus,
    setcurrentTeachers: actions.setcurrentTeachers,
    teachersWithPerformance,
  });

  const pageCount = useMemo(() => {
    if (searchTerm || filters.class.length > 0) {
      return Math.ceil(programFilteredTeachers.length / ROWS_PER_PAGE);
    }
    return Math.ceil(totalCount / ROWS_PER_PAGE);
  }, [totalCount, filters, searchTerm, programFilteredTeachers.length]);

  const isDataPresent = teachersWithWhatsappStatus.length > 0;
  const isFilteringOrSearching =
    searchTerm.trim() !== '' ||
    Object.values(filters).some((filter) => filter.length > 0);

  return {
    contentProps: {
      classFilterOptions,
      columns,
      filterConfigsForTeachers: [{ key: 'class', label: 'Class' }],
      filters,
      handleAddNewTeacher: actions.handleAddNewTeacher,
      handleApplyFilters,
      handleCancelFilters,
      handleClearFilters,
      handleDeleteAppliedFilter,
      handleFilterIconClick,
      handlePageChange,
      handleSearchChange,
      handleSliderFilterChange,
      handleSort,
      isDataPresent,
      isExternalUser,
      isFilterSliderOpen,
      isFilteringOrSearching,
      isLoading,
      isSmallScreen,
      order,
      orderBy,
      page,
      pageCount,
      searchTerm,
      setIsFilterSliderOpen,
      teachersWithWhatsappStatus:
        teachersWithWhatsappStatus as DisplayTeacher[],
      tempFilters,
      totalCount,
    },
    dialogsProps: {
      currentTeachers: actions.currentTeachers,
      deleteClassDisplay: actions.deleteClassDisplay,
      deleteContactDisplay: actions.deleteContactDisplay,
      deleteTargetTeacher: actions.deleteTargetTeacher,
      editTeacherFields,
      editTeacherInitialValues,
      editTeacherMessage: actions.editTeacherMessage,
      errorMessage: actions.errorMessage,
      handleCloseAddTeacherModal: actions.handleCloseAddTeacherModal,
      handleCloseEditTeacherModal: actions.handleCloseEditTeacherModal,
      handleConfirmDelete: actions.handleConfirmDelete,
      handleEditTeacherSubmit: actions.handleEditTeacherSubmit,
      handleTeacherSubmit: actions.handleTeacherSubmit,
      isAddTeacherModalOpen: actions.isAddTeacherModalOpen,
      isDeleting: actions.isDeleting,
      isDeleteModalOpen: actions.isDeleteModalOpen,
      isEditTeacherModalOpen: actions.isEditTeacherModalOpen,
      isSubmitting: actions.isSubmitting,
      isUpdatingClassAssignment: actions.isUpdatingClassAssignment,
      openPopup: actions.openPopup,
      popup: actions.popup,
      schoolId,
      setIsDeleteModalOpen: actions.setIsDeleteModalOpen,
      setOpenPopup: actions.setOpenPopup,
      setPopup: actions.setPopup,
      teacherFormFields,
      teacherStatus: actions.teacherStatus,
    },
  };
};
