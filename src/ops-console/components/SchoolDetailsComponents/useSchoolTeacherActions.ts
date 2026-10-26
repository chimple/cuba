import { useCallback, useEffect, useState } from 'react';
import { t } from 'i18next';
import { TeacherInfo } from '../../../common/constants';
import { RoleType } from '../../../interface/modelInterfaces';
import logger from '../../../utility/logger';
import { emailRegex, normalizePhone10 } from '../../pages/NewUserPageOps';
import DeleteIcon from '../../assets/icons/deleteicon.svg';
import type { MessageConfig } from './FormCard';
import {
  getClassDisplayLabel,
  getExactClassName,
} from './ClassDetailsPageUtils';
import {
  getTeacherClassAssignmentDiff,
  normalizeClassIds,
  parseClassIdsFromCsv,
} from './TeacherClassAssignmentUtils';
import type {
  DisplayTeacher,
  EditTeacherAssignmentState,
} from './SchoolTeachers.types';

type UseSchoolTeacherActionsProps = {
  api: any;
  fetchTeachers: (
    currentPage: number,
    search: string,
    silent?: boolean,
  ) => void;
  getTeacherInfo: (userId: string, classId: string) => TeacherInfo | null;
  page: number;
  schoolId: string;
  searchTerm: string;
  setPage: (page: number) => void;
  teachers: TeacherInfo[];
};

export const useSchoolTeacherActions = ({
  api,
  fetchTeachers,
  getTeacherInfo,
  page,
  schoolId,
  searchTerm,
  setPage,
  teachers,
}: UseSchoolTeacherActionsProps) => {
  const [isAddTeacherModalOpen, setIsAddTeacherModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<MessageConfig | undefined>();
  const [openPopup, setOpenPopup] = useState(false);
  const [currentTeachers, setcurrentTeachers] = useState<TeacherInfo>();
  const [teacherStatus, setTeacherStatus] =
    useState<
      import('../../../common/constants').EnumType<'fc_support_level'>
    >();
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteTargetTeacher, setDeleteTargetTeacher] =
    useState<TeacherInfo | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditTeacherModalOpen, setIsEditTeacherModalOpen] = useState(false);
  const [editTeacherState, setEditTeacherState] =
    useState<EditTeacherAssignmentState | null>(null);
  const [editTeacherMessage, setEditTeacherMessage] = useState<
    MessageConfig | undefined
  >();
  const [isUpdatingClassAssignment, setIsUpdatingClassAssignment] =
    useState(false);
  const [popup, setPopup] = useState({
    open: false,
    image: '',
    heading: '',
    text: '',
    autoCloseSeconds: 0,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isAddTeacherModalOpen) {
      setErrorMessage({
        text: t(
          '*    Provide at least one contact method (phone number or email address) for the teacher.',
        ),
        type: 'error',
      });
    } else {
      setErrorMessage(undefined);
    }
  }, [isAddTeacherModalOpen]);

  const handleAddNewTeacher = useCallback(() => {
    setErrorMessage(undefined);
    setIsAddTeacherModalOpen(true);
  }, []);

  const handleCloseAddTeacherModal = () => {
    setIsAddTeacherModalOpen(false);
    setErrorMessage(undefined);
  };

  const handleTeacherSubmit = useCallback(
    async (values: Record<string, string>) => {
      try {
        const name = (values.name ?? '').toString().trim();
        const classIdsString = (values.class ?? '').toString().trim();
        const rawPhone = (values.phoneNumber ?? '').toString();

        if (!name) {
          setErrorMessage({
            text: t('Teacher name is required.'),
            type: 'error',
          });
          return;
        }
        if (!classIdsString) {
          setErrorMessage({
            text: t('At least one class is required.'),
            type: 'error',
          });
          return;
        }

        const classIds = classIdsString
          .split(',')
          .map((id) => id.trim())
          .filter(Boolean);

        if (classIds.length === 0) {
          setErrorMessage({
            text: t('At least one class is required.'),
            type: 'error',
          });
          return;
        }

        const email = (values.email ?? '').toString().trim().toLowerCase();
        const hasEmail = !!email;
        const hasPhone =
          (values.phoneNumber ?? '').toString().replace(/\D/g, '').length > 2;
        const normalizedPhone = normalizePhone10(rawPhone);
        const digitsOnly = rawPhone.replace(/\D/g, '');
        const isValidPhone = digitsOnly.length == 12;
        const localPhone = isValidPhone ? digitsOnly.slice(-10) : '';
        let finalEmail = '';
        let finalPhone = '';

        if (hasPhone) {
          if (!isValidPhone && localPhone.length !== 10) {
            setErrorMessage({
              text: t('Phone number must be 10 digits.'),
              type: 'error',
            });
            return;
          }
          finalPhone = normalizedPhone;
        }

        if (hasEmail) {
          if (!emailRegex.test(email)) {
            setErrorMessage({
              text: t('Please enter a valid email address.'),
              type: 'error',
            });
            return;
          }
          finalEmail = email;
        }

        setIsSubmitting(true);
        setErrorMessage(undefined);

        await api.getOrcreateschooluser({
          name,
          phoneNumber: finalPhone || undefined,
          email: finalEmail.trim() === '' ? undefined : finalEmail,
          role: RoleType.TEACHER,
          classId: classIds,
          schoolId: schoolId,
        });

        setErrorMessage({
          text: t('Teacher added successfully'),
          type: 'success',
        });
        setTimeout(() => {
          setIsAddTeacherModalOpen(false);
          setPage(1);
          fetchTeachers(1, '');
        }, 2000);
      } catch (error: any) {
        const message = error instanceof Error ? error.message : String(error);
        setErrorMessage({ text: message, type: 'error' });
        logger.error('Failed to add teacher:', error);
      } finally {
        setIsSubmitting(false);
      }
    },
    [schoolId, fetchTeachers, api, setPage],
  );

  const handleCloseEditTeacherModal = useCallback(() => {
    setIsEditTeacherModalOpen(false);
    setEditTeacherState(null);
    setEditTeacherMessage(undefined);
    setIsUpdatingClassAssignment(false);
  }, []);

  const getTeacherAssignedClassIds = useCallback(
    async (teacher: TeacherInfo): Promise<string[]> => {
      const teacherId = teacher.user?.id?.trim() ?? '';
      if (!teacherId) return [];

      const fallbackClassIds = normalizeClassIds(
        teachers
          .filter((teacherItem) => teacherItem.user?.id === teacherId)
          .map((teacherItem) => teacherItem.classWithidname?.id ?? ''),
      );

      try {
        const assignedClasses = await api.getClassesForSchool(
          schoolId,
          teacherId,
        );
        const assignedClassIds = normalizeClassIds(
          assignedClasses.map(
            (assignedClass: { id?: string }) => assignedClass.id,
          ),
        );

        return assignedClassIds.length > 0
          ? assignedClassIds
          : fallbackClassIds;
      } catch (error) {
        logger.error('Failed to fetch teacher assigned classes:', error);
        return fallbackClassIds;
      }
    },
    [api, schoolId, teachers],
  );

  const handleOpenEditTeacherModal = useCallback(
    async (row: DisplayTeacher) => {
      const teacher =
        row.interactPayload ?? getTeacherInfo(row.id, row.classId);
      if (!teacher?.user?.id) return;

      const assignedClassIds = await getTeacherAssignedClassIds(teacher);
      setEditTeacherState({
        teacher,
        assignedClassIds,
      });
      setEditTeacherMessage(undefined);
      setIsEditTeacherModalOpen(true);
    },
    [getTeacherAssignedClassIds, getTeacherInfo],
  );

  const handleEditTeacherSubmit = useCallback(
    async (values: Record<string, string>) => {
      if (!editTeacherState) return;

      const teacherId = editTeacherState.teacher.user?.id?.trim() ?? '';
      if (!teacherId) {
        setEditTeacherMessage({
          text: t(
            'Failed to update teacher class assignments. Please try again.',
          ),
          type: 'error',
        });
        return;
      }

      const selectedClassIds = parseClassIdsFromCsv(values.class ?? '');
      const { classIdsToAdd, classIdsToRemove, hasChanges } =
        getTeacherClassAssignmentDiff(
          editTeacherState.assignedClassIds,
          selectedClassIds,
        );

      if (!hasChanges) return;

      try {
        setIsUpdatingClassAssignment(true);
        setEditTeacherMessage(undefined);

        for (const classId of classIdsToAdd) {
          await api.addTeacherToClass(
            schoolId,
            classId,
            editTeacherState.teacher.user,
          );
        }

        for (const classId of classIdsToRemove) {
          await api.deleteUserFromClass(teacherId, classId);
        }

        handleCloseEditTeacherModal();
        fetchTeachers(page, searchTerm);
      } catch (error) {
        logger.error('Failed to update teacher class assignments:', error);
        setEditTeacherMessage({
          text: t(
            'Failed to update teacher class assignments. Please try again.',
          ),
          type: 'error',
        });
      } finally {
        setIsUpdatingClassAssignment(false);
      }
    },
    [
      api,
      editTeacherState,
      fetchTeachers,
      handleCloseEditTeacherModal,
      page,
      schoolId,
      searchTerm,
    ],
  );

  const handleConfirmDelete = async () => {
    if (!deleteTargetTeacher) return;

    try {
      setIsDeleting(true);

      const teacherId =
        deleteTargetTeacher.user?.id ||
        (deleteTargetTeacher as { id?: string }).id ||
        '';
      const classId =
        deleteTargetTeacher.classWithidname?.id ||
        (deleteTargetTeacher as { classId?: string }).classId ||
        (deleteTargetTeacher as { class_id?: string }).class_id ||
        '';
      const teacherName = deleteTargetTeacher.user.name;
      if (!teacherId || !classId) {
        logger.error('Missing teacherId or classId');
        return;
      }

      const res = await api.deleteUserFromClass(teacherId, classId);
      if (res) {
        const message = t(
          "{{teacherName}}'s profile has been deleted and is no longer available.",
          { teacherName: teacherName ?? '' },
        );
        setPopup({
          open: true,
          image: DeleteIcon,
          heading: 'Profile Deleted Successfully',
          text: message,
          autoCloseSeconds: 5,
        });
      }
      setIsDeleteModalOpen(false);
      setDeleteTargetTeacher(null);
      fetchTeachers(page, searchTerm);
    } catch (error) {
      logger.error('Delete teacher failed:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const deleteClassDisplay = deleteTargetTeacher
    ? getClassDisplayLabel(
        deleteTargetTeacher.grade,
        deleteTargetTeacher.classSection,
        getExactClassName(deleteTargetTeacher.classWithidname),
      )
    : '';
  const deleteContactDisplay = deleteTargetTeacher
    ? deleteTargetTeacher.user?.phone?.trim() ||
      deleteTargetTeacher.user?.email?.trim() ||
      'N/A'
    : 'N/A';

  return {
    currentTeachers,
    deleteClassDisplay,
    deleteContactDisplay,
    deleteTargetTeacher,
    editTeacherMessage,
    editTeacherState,
    errorMessage,
    handleAddNewTeacher,
    handleCloseAddTeacherModal,
    handleCloseEditTeacherModal,
    handleConfirmDelete,
    handleEditTeacherSubmit,
    handleOpenEditTeacherModal,
    handleTeacherSubmit,
    isAddTeacherModalOpen,
    isDeleting,
    isDeleteModalOpen,
    isEditTeacherModalOpen,
    isSubmitting,
    isUpdatingClassAssignment,
    openPopup,
    popup,
    setDeleteTargetTeacher,
    setIsDeleteModalOpen,
    setOpenPopup,
    setPopup,
    setTeacherStatus,
    setcurrentTeachers,
    teacherStatus,
  };
};
