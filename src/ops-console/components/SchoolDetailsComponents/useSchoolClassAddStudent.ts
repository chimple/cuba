import { useEffect, useMemo, useRef, useState } from 'react';
import { t } from 'i18next';
import { AGE_OPTIONS, GENDER } from '../../../common/constants';
import logger from '../../../utility/logger';
import {
  DUPLICATE_STUDENT_PROFILE_MESSAGE,
  parseStudentProfileContact,
} from '../../utils/studentProfileContact';
import type { FieldConfig, MessageConfig } from './FormCard';
import type { ClassRow } from './SchoolClass.types';

type UseSchoolClassAddStudentParams = {
  api: any;
  isAtSchool: boolean;
  schoolId: string;
  refreshClasses?: () => void;
};

export function useSchoolClassAddStudent({
  api,
  isAtSchool,
  schoolId,
  refreshClasses,
}: UseSchoolClassAddStudentParams) {
  const [isAddStudentModalOpen, setIsAddStudentModalOpen] = useState(false);
  const [studentErrorMessage, setStudentErrorMessage] = useState<
    MessageConfig | undefined
  >();
  const [isStudentSubmitting, setIsStudentSubmitting] = useState(false);
  const [classForStudent, setClassForStudent] = useState<ClassRow | null>(null);
  const [studentProfileContact, setStudentProfileContact] = useState('');
  const [selectedExistingStudentId, setSelectedExistingStudentId] = useState<
    string | null
  >(null);
  const modalSession = useRef(0);
  const successCloseTimer = useRef<number | null>(null);

  const addStudentFields: FieldConfig[] = useMemo(() => {
    const fields: FieldConfig[] = [];
    if (!isAtSchool) {
      fields.push({
        name: 'contact',
        label: 'Phone Number / Email',
        kind: 'contact' as const,
        required: true,
        placeholder: 'Enter phone number or email address',
        column: 2 as const,
      });
    }
    fields.push(
      {
        name: 'studentName',
        label: 'Student Name',
        kind: 'text' as const,
        required: true,
        placeholder: 'Enter Student Name',
        column: 2 as const,
      },
      {
        name: 'studentID',
        label: 'Student ID',
        kind: 'text' as const,
        placeholder: 'Enter Student ID',
        column: 2 as const,
      },
      {
        name: 'gender',
        label: 'Gender',
        kind: 'select' as const,
        column: 0 as const,
        options: [
          { label: t('GIRL'), value: GENDER.GIRL },
          { label: t('BOY'), value: GENDER.BOY },
          { label: t('UNSPECIFIED'), value: GENDER.OTHER },
        ],
      },
      {
        name: 'ageGroup',
        label: 'Age',
        kind: 'select' as const,
        placeholder: 'Select Age Group',
        column: 1 as const,
        options: [
          {
            value: AGE_OPTIONS.LESS_THAN_EQUAL_4,
            label: `${t('Up to')} ${t('4 years')}`,
          },
          { value: AGE_OPTIONS.FIVE, label: t('5 years') },
          { value: AGE_OPTIONS.SIX, label: t('6 years') },
          { value: AGE_OPTIONS.SEVEN, label: t('7 years') },
          { value: AGE_OPTIONS.EIGHT, label: t('8 years') },
          { value: AGE_OPTIONS.NINE, label: t('9 years') },
          {
            value: AGE_OPTIONS.GREATER_THAN_EQUAL_10,
            label: `${t('10 years')}+`,
          },
        ],
      },
    );
    return fields;
  }, [isAtSchool]);

  const clearSuccessCloseTimer = () => {
    if (successCloseTimer.current !== null) {
      window.clearTimeout(successCloseTimer.current);
      successCloseTimer.current = null;
    }
  };

  const handleCloseAddStudentModal = () => {
    modalSession.current += 1;
    clearSuccessCloseTimer();
    setIsAddStudentModalOpen(false);
    setStudentErrorMessage(undefined);
    setIsStudentSubmitting(false);
    setClassForStudent(null);
    setStudentProfileContact('');
    setSelectedExistingStudentId(null);
  };

  const closeModalAfterSuccess = (delay: number, session: number) => {
    clearSuccessCloseTimer();
    successCloseTimer.current = window.setTimeout(() => {
      successCloseTimer.current = null;
      if (modalSession.current === session) handleCloseAddStudentModal();
    }, delay);
  };

  useEffect(
    () => () => {
      if (successCloseTimer.current !== null) {
        window.clearTimeout(successCloseTimer.current);
      }
    },
    [],
  );

  const handleAddStudentFieldChange = (name: string, value: string) => {
    if (name === 'contact') {
      setStudentProfileContact(value);
      setSelectedExistingStudentId(null);
    }
  };

  const handleSelectExistingStudent = (studentId: string | null) => {
    setSelectedExistingStudentId(studentId);
  };

  const handleSetClassForStudent = (classRow: ClassRow | null) => {
    modalSession.current += 1;
    clearSuccessCloseTimer();
    setClassForStudent(classRow);
    setStudentProfileContact('');
    setSelectedExistingStudentId(null);
    setStudentErrorMessage(undefined);
    setIsStudentSubmitting(false);
  };

  const handleLinkExistingStudent = async (
    studentId: string,
    contact: string,
  ) => {
    if (!classForStudent || isStudentSubmitting) return;
    const session = modalSession.current;
    const classId = classForStudent.id;
    setIsStudentSubmitting(true);
    setStudentErrorMessage(undefined);
    let succeeded = false;
    try {
      const linked = await api.linkExistingStudentToClass(
        studentId,
        classId,
        contact,
      );
      if (modalSession.current !== session) {
        if (linked) refreshClasses?.();
        return;
      }
      if (!linked) {
        setStudentErrorMessage({
          text: 'This student is already linked or is no longer available.',
          type: 'error',
        });
        return;
      }
      setStudentErrorMessage({
        text: 'Student linked successfully.',
        type: 'success',
      });
      succeeded = true;
      closeModalAfterSuccess(1800, session);
      refreshClasses?.();
    } catch (error) {
      logger.error('Error linking existing student:', error);
      if (modalSession.current === session && !succeeded) {
        setStudentErrorMessage({
          text: 'An unexpected error occurred. Please try again.',
          type: 'error',
        });
      }
    } finally {
      if (!succeeded && modalSession.current === session) {
        setIsStudentSubmitting(false);
      }
    }
  };

  const handleSubmitAddStudentModal = async (
    formValues: Record<string, string>,
  ) => {
    if (!classForStudent) return;
    const session = modalSession.current;
    const classId = classForStudent.id;
    setIsStudentSubmitting(true);
    setStudentErrorMessage(undefined);
    let succeeded = false;

    const rawContact = formValues.contact ?? '';
    const parsedContact = parseStudentProfileContact(rawContact);
    if (!parsedContact || (!isAtSchool && !parsedContact.value)) {
      setStudentErrorMessage({
        text: 'Please enter a valid phone number or email address.',
        type: 'error',
      });
      setIsStudentSubmitting(false);
      return;
    }
    const studentName = (formValues.studentName ?? '').trim();
    if (!studentName) {
      setStudentErrorMessage({
        text: 'Student Name is required.',
        type: 'error',
      });
      setIsStudentSubmitting(false);
      return;
    }
    try {
      if (
        parsedContact.phone &&
        (await api.hasDuplicateStudentProfile(
          studentName,
          parsedContact.phone,
          classId,
        ))
      ) {
        if (modalSession.current !== session) return;
        setStudentErrorMessage({
          text: DUPLICATE_STUDENT_PROFILE_MESSAGE,
          type: 'error',
        });
        return;
      }
      if (modalSession.current !== session) return;
      const payload = {
        phone: parsedContact.phone,
        email: parsedContact.email,
        name: studentName,
        gender: formValues.gender || '',
        age: formValues.ageGroup || null,
        classId,
        schoolId: schoolId,
        studentID: formValues.studentID || '',
        atSchool: isAtSchool,
      };
      const result = await api.addStudentWithParentValidation(payload);
      if (modalSession.current !== session) {
        if (result.success) refreshClasses?.();
        return;
      }
      if (result.success) {
        setStudentErrorMessage({
          text: 'Student added successfully.',
          type: 'success',
        });
        closeModalAfterSuccess(2000, session);
        succeeded = true;
        refreshClasses?.();
      } else {
        setStudentErrorMessage({ text: result.message, type: 'error' });
      }
    } catch (error) {
      logger.error('Error adding student:', error);
      if (modalSession.current === session && !succeeded) {
        setStudentErrorMessage({
          text: 'An unexpected error occurred. Please try again.',
          type: 'error',
        });
      }
    } finally {
      if (!succeeded && modalSession.current === session) {
        setIsStudentSubmitting(false);
      }
    }
  };

  return {
    addStudentFields,
    classForStudent,
    handleAddStudentFieldChange,
    handleCloseAddStudentModal,
    handleLinkExistingStudent,
    handleSubmitAddStudentModal,
    isAddStudentModalOpen,
    isStudentSubmitting,
    selectedExistingStudentId,
    handleSelectExistingStudent,
    setClassForStudent: handleSetClassForStudent,
    setIsAddStudentModalOpen,
    studentProfileContact,
    studentErrorMessage,
  };
}
