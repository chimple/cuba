import { useCallback, useEffect, useRef, useState } from 'react';
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
import {
  formatIndianStudentPhone,
  getStudentContactEntries,
} from '../../utils/studentContactNumbers';
import {
  DUPLICATE_STUDENT_PROFILE_EMAIL_MESSAGE,
  DUPLICATE_STUDENT_PROFILE_MESSAGE,
  parseStudentProfileContact,
} from '../../utils/studentProfileContact';

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
  const [studentProfileContact, setStudentProfileContact] = useState('');
  const [studentProfileClassId, setStudentProfileClassId] = useState('');
  const [selectedExistingStudentId, setSelectedExistingStudentId] = useState<
    string | null
  >(null);
  const modalSession = useRef(0);
  const successCloseTimer = useRef<number | null>(null);
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
    modalSession.current += 1;
    if (successCloseTimer.current !== null) {
      window.clearTimeout(successCloseTimer.current);
      successCloseTimer.current = null;
    }
    setStudentProfileContact('');
    setStudentProfileClassId(currentClassRef.current?.id ?? '');
    setSelectedExistingStudentId(null);
    setIsSubmitting(false);
    setIsAddStudentModalOpen(true);
    setErrorMessage(undefined);
  }, [currentClassRef]);

  const handleEditSubmit = async (values: Record<string, string>) => {
    if (!editStudentData) return;

    const user = editStudentData.user;
    const selectedClassId = String(values.classAndSection ?? '').trim();
    const selectedConnectivity = values.studentConnectivity || null;
    const currentContacts = getStudentContactEntries(editStudentData)
      .map((contact) =>
        contact.type === 'phone'
          ? formatIndianStudentPhone(contact.value)
          : contact.value,
      )
      .join(' / ');
    const connectivityOnly =
      selectedConnectivity !== (user.student_connectivity ?? null) &&
      values.studentName === (user.name ?? '') &&
      Number(values.ageGroup) === (user.age ?? 0) &&
      values.gender === (user.gender ?? '') &&
      selectedClassId === String(editStudentData.classWithidname?.id ?? '') &&
      String(values.phone ?? '') === currentContacts;
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
      selectedConnectivity,
      connectivityOnly,
    );

    setIsEditStudentModalOpen(false);
    fetchStudents(debouncedSearchTerm);
  };

  const handleCloseAddStudentModal = useCallback(() => {
    modalSession.current += 1;
    if (successCloseTimer.current !== null) {
      window.clearTimeout(successCloseTimer.current);
      successCloseTimer.current = null;
    }
    setIsAddStudentModalOpen(false);
    setErrorMessage(undefined);
    setIsSubmitting(false);
    setStudentProfileContact('');
    setStudentProfileClassId('');
    setSelectedExistingStudentId(null);
  }, []);

  const closeModalAfterSuccess = useCallback(
    (delay: number, session: number) => {
      if (successCloseTimer.current !== null) {
        window.clearTimeout(successCloseTimer.current);
      }
      successCloseTimer.current = window.setTimeout(() => {
        successCloseTimer.current = null;
        if (modalSession.current === session) handleCloseAddStudentModal();
      }, delay);
    },
    [handleCloseAddStudentModal],
  );

  useEffect(
    () => () => {
      if (successCloseTimer.current !== null) {
        window.clearTimeout(successCloseTimer.current);
      }
    },
    [],
  );

  const handleAddStudentFieldChange = useCallback(
    (fieldName: string, value: string) => {
      if (fieldName === 'contact') setStudentProfileContact(value);
      if (fieldName === 'class') setStudentProfileClassId(value);
      if (fieldName === 'contact' || fieldName === 'class') {
        setSelectedExistingStudentId(null);
      }
    },
    [],
  );

  const handleSelectExistingStudent = useCallback(
    (studentId: string | null) => {
      setSelectedExistingStudentId(studentId);
    },
    [],
  );

  const handleLinkExistingStudent = useCallback(
    async (studentId: string, contact: string) => {
      const classId =
        (issTotal ? studentProfileClassId : currentClassRef.current?.id) ?? '';
      if (!classId) {
        setErrorMessage({ text: 'Please select a class.', type: 'error' });
        return;
      }
      if (isSubmitting) return;

      const session = modalSession.current;
      setIsSubmitting(true);
      setErrorMessage(undefined);
      let succeeded = false;
      try {
        const linked = await api.linkExistingStudentToClass(
          studentId,
          classId,
          contact,
        );
        if (modalSession.current !== session) {
          if (linked) fetchStudents(debouncedSearchTerm);
          return;
        }
        if (!linked) {
          setErrorMessage({
            text: 'This student is already linked or is no longer available.',
            type: 'error',
          });
          return;
        }
        setErrorMessage({
          text: 'Student linked successfully.',
          type: 'success',
        });
        succeeded = true;
        fetchStudents(debouncedSearchTerm);
        closeModalAfterSuccess(1800, session);
      } catch (error) {
        logger.error('Error linking existing student:', error);
        if (modalSession.current === session && !succeeded) {
          setErrorMessage({
            text: 'An unexpected error occurred. Please try again.',
            type: 'error',
          });
        }
      } finally {
        if (!succeeded && modalSession.current === session) {
          setIsSubmitting(false);
        }
      }
    },
    [
      api,
      currentClassRef,
      debouncedSearchTerm,
      fetchStudents,
      closeModalAfterSuccess,
      isSubmitting,
      issTotal,
      studentProfileClassId,
    ],
  );

  const handleSubmitAddStudentModal = useCallback(
    async (formValues: Record<string, string>) => {
      if (isSubmitting) return;

      const session = modalSession.current;
      setIsSubmitting(true);
      setErrorMessage(undefined);

      const fail = (text: string) => {
        if (modalSession.current !== session) return;
        setErrorMessage({ text, type: 'error' });
        setIsSubmitting(false);
      };

      const rawContact = formValues.contact ?? '';
      const parsedContact = parseStudentProfileContact(rawContact);
      if (!parsedContact || (!isAtSchool && !parsedContact.value)) {
        return fail('Please enter a valid phone number or email address.');
      }
      const studentName = (formValues.studentName ?? '').trim();
      if (!studentName) return fail('Student Name is required.');
      const classId = issTotal
        ? formValues.class
        : studentProfileClassId || currentClassRef.current?.id;
      if (!classId) return fail('Please select a class.');
      let created = false;
      try {
        if (
          parsedContact.value &&
          (await api.hasDuplicateStudentProfile(
            studentName,
            parsedContact.value,
            classId,
          ))
        ) {
          if (modalSession.current !== session) return;
          return fail(
            parsedContact.email
              ? DUPLICATE_STUDENT_PROFILE_EMAIL_MESSAGE
              : DUPLICATE_STUDENT_PROFILE_MESSAGE,
          );
        }
        if (modalSession.current !== session) return;
        const payload = {
          phone: parsedContact.phone,
          email: parsedContact.email,
          name: studentName,
          gender: formValues.gender || '',
          age: formValues.ageGroup || null,
          classId: classId,
          schoolId: schoolId,
          studentID: formValues.studentID || '',
          atSchool: isAtSchool,
        };
        const result = await api.addStudentWithParentValidation(payload);
        if (modalSession.current !== session) {
          if (result.success) fetchStudents(debouncedSearchTerm);
          return;
        }
        if (result.success) {
          created = true;
          setErrorMessage({
            text: 'Student added successfully.',
            type: 'success',
          });
          setPage(1);
          fetchStudents(debouncedSearchTerm);
          closeModalAfterSuccess(2000, session);
        } else {
          setErrorMessage({ text: result.message, type: 'error' });
        }
      } catch (error) {
        logger.error('Error adding student:', error);
        if (modalSession.current === session && !created) {
          setErrorMessage({
            text: 'An unexpected error occurred. Please try again.',
            type: 'error',
          });
        }
      } finally {
        if (!created && modalSession.current === session) {
          setIsSubmitting(false);
        }
      }
    },
    [
      api,
      isAtSchool,
      isSubmitting,
      issTotal,
      currentClassRef,
      studentProfileClassId,
      schoolId,
      fetchStudents,
      debouncedSearchTerm,
      closeModalAfterSuccess,
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
    handleAddStudentFieldChange,
    handleCloseAddStudentModal,
    handleConfirmDelete,
    handleEditSubmit,
    handleInteractClick,
    handleMergeStudents,
    handleLinkExistingStudent,
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
    studentProfileClassId,
    studentProfileContact,
    selectedExistingStudentId,
    handleSelectExistingStudent,
  };
};
