import { useCallback, useState } from 'react';
import type React from 'react';
import { t } from 'i18next';
import {
  AVATARS,
  EnumType,
  OPS_PERFORMANCE_BANDS,
  OpsSupportLevelMap,
  StudentInfo,
} from '../../../common/constants';
import logger from '../../../utility/logger';
import { normalizePhone10 } from '../../pages/NewUserPageOps';
import verifiedIcon from '../../assets/icons/verifiedicon.svg';
import ErrorIcon from '../../assets/icons/erroricon.svg';
import DeleteIcon from '../../assets/icons/deleteicon.svg';
import type { MessageConfig } from './FormCard';
import type { DisplayStudent } from './SchoolStudents.types';

type UseSchoolStudentActionsParams = {
  api: any;
  currentClassRef: React.RefObject<{ id: string; name: string } | null>;
  debouncedSearchTerm: string;
  fetchStudents: (search: string, silent?: boolean) => Promise<void>;
  getStudentInfoById: (id: string) => StudentInfo | null;
  invalidateStudentListCache: () => void;
  isAtSchool: boolean;
  issTotal: boolean;
  schoolId: string;
  setPage: (page: number) => void;
};

export const useSchoolStudentActions = ({
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
}: UseSchoolStudentActionsParams) => {
  const [openPopup, setOpenPopup] = useState(false);
  const [isAddStudentModalOpen, setIsAddStudentModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<MessageConfig | undefined>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [studentData, setStudentData] = useState<StudentInfo>();
  const [studentStatus, setStudentStatus] =
    useState<EnumType<'fc_support_level'>>();
  const [isEditStudentModalOpen, setIsEditStudentModalOpen] = useState(false);
  const [isMergeStudentModalOpen, setIsMergeStudentModalOpen] = useState(false);
  const [editStudentData, setEditStudentData] = useState<StudentInfo | null>(
    null,
  );
  const [mergePrimaryStudent, setMergePrimaryStudent] =
    useState<DisplayStudent | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteTargetStudent, setDeleteTargetStudent] =
    useState<StudentInfo | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isMergingStudent, setIsMergingStudent] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [popup, setPopup] = useState({
    open: false,
    image: '',
    heading: '',
    text: '',
    autoCloseSeconds: 0,
  });

  const getRandomAvatar = () => {
    if (AVATARS.length === 0) return '';
    const randomIndex = Math.floor(Math.random() * AVATARS.length);
    return AVATARS[randomIndex];
  };

  const handleInteractClick = useCallback(
    (student: DisplayStudent) => {
      const fullStudent = getStudentInfoById(student.id) ?? student.original;
      if (!fullStudent) return;

      const mappedType = student.schstudents_performance
        ? OpsSupportLevelMap[
            student.schstudents_performance as keyof typeof OpsSupportLevelMap
          ]
        : null;

      setStudentData(fullStudent);
      setStudentStatus(
        mappedType ?? OpsSupportLevelMap[OPS_PERFORMANCE_BANDS.NOT_DOWNLOADED],
      );
      setOpenPopup(true);
    },
    [getStudentInfoById],
  );

  const handleAddNewStudent = useCallback(() => {
    setIsAddStudentModalOpen(true);
    setErrorMessage(undefined);
  }, []);

  const handleEditSubmit = async (values: Record<string, string>) => {
    if (!editStudentData) return;

    const user = editStudentData.user;
    const selectedClassId = String(values.classAndSection ?? '').trim();
    const avatarToSend =
      user.avatar && user.avatar.trim() !== ''
        ? user.avatar
        : getRandomAvatar();

    if (!selectedClassId) {
      logger.error('Selected class ID missing for student');
      return;
    }

    const baseArgs = [
      user,
      values.studentName,
      Number(values.ageGroup),
      values.gender,
      avatarToSend,
      user.image || '',
      user.curriculum_id || user.curriculum_id!,
      user.grade_id || user.grade_id!,
      user.language_id || user.language_id!,
    ] as const;

    await api.updateStudentFromSchoolMode(
      ...baseArgs,
      user.student_id || user.student_id!,
      selectedClassId,
      normalizePhone10(values.phone),
    );

    setIsEditStudentModalOpen(false);
    fetchStudents(debouncedSearchTerm);
  };

  const handleCloseAddStudentModal = useCallback(() => {
    setIsAddStudentModalOpen(false);
    setErrorMessage(undefined);
    setIsSubmitting(false);
  }, []);

  const handleSubmitAddStudentModal = useCallback(
    async (formValues: Record<string, string>) => {
      if (isSubmitting) return;

      setIsSubmitting(true);
      setErrorMessage(undefined);

      const fail = (text: string) => {
        setErrorMessage({ text, type: 'error' });
        setIsSubmitting(false);
      };

      const rawPhone = (formValues.phone ?? '').toString();
      let digits = rawPhone.replace(/\D/g, '');
      if (digits === '' || digits === '91') digits = '';
      if (digits.length === 12 && digits.startsWith('91'))
        digits = digits.slice(2);
      if (digits.length === 11 && digits.startsWith('0'))
        digits = digits.slice(1);
      if (!isAtSchool) {
        if (digits.length !== 10)
          return fail('Phone number must be 10 digits.');
      } else if (digits.length !== 0 && digits.length !== 10) {
        return fail('Phone number must be 10 digits when provided.');
      }
      const classId = issTotal ? formValues.class : currentClassRef.current?.id;
      if (!classId) return fail('Please select a class.');
      const normalizedPhone = digits.length === 10 ? digits : undefined;
      try {
        const payload: any = {
          phone: normalizedPhone,
          name: formValues.studentName || '',
          gender: formValues.gender || '',
          age: formValues.ageGroup || '',
          classId: classId,
          schoolId: schoolId,
          studentID: formValues.studentID || '',
          atSchool: isAtSchool,
        };
        const result = await api.addStudentWithParentValidation(payload);
        if (result.success) {
          handleCloseAddStudentModal();
          setPage(1);
          fetchStudents(debouncedSearchTerm);
        } else {
          setErrorMessage({ text: result.message, type: 'error' });
        }
      } catch (error) {
        logger.error('Error adding student:', error);
        setErrorMessage({
          text: 'An unexpected error occurred. Please try again.',
          type: 'error',
        });
      } finally {
        setIsSubmitting(false);
      }
    },
    [
      api,
      isAtSchool,
      isSubmitting,
      issTotal,
      currentClassRef,
      schoolId,
      fetchStudents,
      debouncedSearchTerm,
      handleCloseAddStudentModal,
      setPage,
    ],
  );

  const handleConfirmDelete = async () => {
    if (!deleteTargetStudent) return;

    try {
      setIsDeleting(true);
      const studentId =
        deleteTargetStudent.user?.id ||
        (deleteTargetStudent as { id?: string }).id ||
        '';
      const classId =
        deleteTargetStudent.classWithidname?.id ||
        (deleteTargetStudent as { classId?: string }).classId ||
        (deleteTargetStudent as { class_id?: string }).class_id ||
        '';
      if (!studentId || !classId) {
        logger.error('Missing studentId or classId');
        return;
      }
      const studentName = deleteTargetStudent?.user?.name;
      const message = t(
        "{{studentName}}'s profile has been deleted and is no longer available.",
        { studentName: studentName ?? '' },
      );
      const res = await api.deleteUserFromClass(studentId, classId);
      if (res) {
        setPopup({
          open: true,
          image: DeleteIcon,
          heading: 'Profile Deleted Successfully',
          text: message,
          autoCloseSeconds: 5,
        });
      } else {
      }
      setIsDeleteModalOpen(false);
      setDeleteTargetStudent(null);
      fetchStudents(debouncedSearchTerm);
    } catch (error) {
      logger.error('Delete failed:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  async function handleMergeStudents(student: any): Promise<void> {
    try {
      if (!mergePrimaryStudent) return;
      const oldId = student?.user?.id;
      const newId = mergePrimaryStudent.id;
      const fromName = student?.user?.fullName || student?.user?.name;
      const toName = mergePrimaryStudent.name;
      if (!oldId || !newId) {
        logger.error('Invalid student IDs');
        return;
      }
      if (oldId === newId) {
        logger.error('Cannot merge same student');
        return;
      }

      setIsMergingStudent(true);
      const mergeResult = await api.mergeStudentRequest(oldId, newId);
      if (mergeResult.success) {
        const mergeMessage = t(
          "{{fromName}}\nhas been merged into {{toName}}'s profile",
          { fromName: fromName ?? '', toName: toName ?? '' },
        );
        setPopup({
          open: true,
          image: verifiedIcon,
          heading: 'Successfully Merged',
          text: mergeMessage,
          autoCloseSeconds: 5,
        });
        invalidateStudentListCache();
        await fetchStudents(debouncedSearchTerm);
      } else {
        setPopup({
          open: true,
          image: ErrorIcon,
          heading: 'Something went wrong',
          text: mergeResult.message || t('Failed to merge student profile.'),
          autoCloseSeconds: 5,
        });
      }
      setShowSuccessPopup(true);
      setIsMergeStudentModalOpen(false);
      setMergePrimaryStudent(null);
    } catch (error: any) {
      logger.error('Merge failed:', error);
      setPopup({
        open: true,
        image: ErrorIcon,
        heading: 'Something went wrong',
        text: error?.message || t('Unexpected error while merging.'),
        autoCloseSeconds: 5,
      });
      setShowSuccessPopup(true);
      setIsMergeStudentModalOpen(false);
      setMergePrimaryStudent(null);
    } finally {
      setIsMergingStudent(false);
    }
  }

  return {
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
    showSuccessPopup,
    studentData,
    studentStatus,
  };
};
