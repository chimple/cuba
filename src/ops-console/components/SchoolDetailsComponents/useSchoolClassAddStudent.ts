import { useMemo, useState } from 'react';
import { t } from 'i18next';
import { AGE_OPTIONS, GENDER } from '../../../common/constants';
import logger from '../../../utility/logger';
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

  const addStudentFields: FieldConfig[] = useMemo(() => {
    const fields: FieldConfig[] = [
      {
        name: 'studentName',
        label: 'Student Name',
        kind: 'text' as const,
        required: true,
        placeholder: 'Enter Student Name',
        column: 0 as const,
      },
      {
        name: 'studentID',
        label: 'Student ID',
        kind: 'text' as const,
        placeholder: 'Enter Student ID',
        column: 1 as const,
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
    ];
    if (!isAtSchool) {
      fields.push({
        name: 'phone',
        label: 'Phone Number',
        kind: 'phone' as const,
        required: true,
        placeholder: 'Enter phone number',
        column: 2 as const,
      });
    }
    return fields;
  }, [isAtSchool]);

  const handleCloseAddStudentModal = () => {
    setIsAddStudentModalOpen(false);
    setStudentErrorMessage(undefined);
    setIsStudentSubmitting(false);
    setClassForStudent(null);
  };

  const handleSubmitAddStudentModal = async (
    formValues: Record<string, string>,
  ) => {
    if (!classForStudent) return;
    setIsStudentSubmitting(true);
    setStudentErrorMessage(undefined);

    const rawPhone = (formValues.phone ?? '').toString();
    let digits = rawPhone.replace(/\D/g, '');
    if (digits === '' || digits === '91') {
      digits = '';
    }
    if (digits.length === 12 && digits.startsWith('91'))
      digits = digits.slice(2);
    if (digits.length === 11 && digits.startsWith('0'))
      digits = digits.slice(1);
    if (!isAtSchool) {
      if (digits.length !== 10) {
        setStudentErrorMessage({
          text: 'Phone number must be 10 digits.',
          type: 'error',
        });
        setIsStudentSubmitting(false);
        return;
      }
    } else {
      if (digits.length !== 0 && digits.length !== 10) {
        setStudentErrorMessage({
          text: 'Phone number must be 10 digits when provided.',
          type: 'error',
        });
        setIsStudentSubmitting(false);
        return;
      }
    }

    const normalizedPhone = digits.length === 10 ? digits : undefined;
    try {
      const payload: any = {
        phone: normalizedPhone,
        name: formValues.studentName || '',
        gender: formValues.gender || '',
        age: formValues.ageGroup || '',
        classId: classForStudent.id,
        schoolId: schoolId,
        studentID: formValues.studentID || '',
        atSchool: isAtSchool,
      };
      const result = await api.addStudentWithParentValidation(payload);
      if (result.success) {
        setStudentErrorMessage({
          text: 'Student added successfully.',
          type: 'success',
        });
        setTimeout(() => {
          setIsAddStudentModalOpen(false);
          setStudentErrorMessage(undefined);
        }, 2000);
        refreshClasses?.();
      } else {
        setStudentErrorMessage({ text: result.message, type: 'error' });
      }
    } catch (error) {
      logger.error('Error adding student:', error);
      setStudentErrorMessage({
        text: 'An unexpected error occurred. Please try again.',
        type: 'error',
      });
    } finally {
      setIsStudentSubmitting(false);
    }
  };

  return {
    addStudentFields,
    classForStudent,
    handleCloseAddStudentModal,
    handleSubmitAddStudentModal,
    isAddStudentModalOpen,
    isStudentSubmitting,
    setClassForStudent,
    setIsAddStudentModalOpen,
    studentErrorMessage,
  };
}
