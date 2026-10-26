import { useMemo } from 'react';
import { t } from 'i18next';
import type { FieldConfig } from './FormCard';
import type { ClassRow } from './SchoolClass';
import type { EditTeacherAssignmentState } from './SchoolTeachers.types';
import { toClassIdsCsv } from './TeacherClassAssignmentUtils';

type UseSchoolTeachersFieldsProps = {
  editTeacherState: EditTeacherAssignmentState | null;
  programScopedClasses: ClassRow[];
};

export const useSchoolTeachersFields = ({
  editTeacherState,
  programScopedClasses,
}: UseSchoolTeachersFieldsProps) => {
  const classOptions = useMemo(() => {
    if (programScopedClasses.length === 0) return [];
    return programScopedClasses
      .map((classRow) => ({
        value: classRow.id,
        label:
          typeof classRow.name === 'string'
            ? classRow.name
            : String(classRow.name ?? ''),
      }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [programScopedClasses]);

  const teacherFormFields: FieldConfig[] = useMemo(
    () => [
      {
        name: 'name',
        label: 'Teacher Name',
        kind: 'text',
        required: true,
        placeholder: 'Enter teacher name',
        column: 2,
      },
      {
        name: 'class',
        label: 'Class',
        kind: 'select',
        required: true,
        column: 0,
        options: classOptions,
        multi: true,
      },
      {
        name: 'phoneNumber',
        label: 'Phone Number',
        kind: 'phone',
        placeholder: 'Enter phone number',
        column: 2,
      },
      {
        name: 'email',
        label: 'Email',
        kind: 'email',
        placeholder: 'Enter email address',
        column: 2,
      },
    ],
    [classOptions],
  );

  const editTeacherFields: FieldConfig[] = useMemo(
    () => [
      {
        name: 'name',
        label: 'Teacher Name',
        kind: 'text',
        required: true,
        column: 2,
        disabled: true,
      },
      {
        name: 'class',
        label: 'Class',
        kind: 'select',
        required: true,
        column: 0,
        options: classOptions,
        multi: true,
      },
      {
        name: 'phoneNumber',
        label: 'Phone Number',
        kind: 'text',
        column: 2,
        disabled: true,
      },
      {
        name: 'email',
        label: 'Email Address',
        kind: 'text',
        column: 2,
        disabled: true,
      },
    ],
    [classOptions],
  );

  const editTeacherInitialValues = useMemo(() => {
    if (!editTeacherState) {
      return undefined;
    }

    return {
      name: editTeacherState.teacher.user?.name ?? '',
      class: toClassIdsCsv(editTeacherState.assignedClassIds),
      phoneNumber: editTeacherState.teacher.user?.phone ?? '',
      email: editTeacherState.teacher.user?.email ?? '',
    };
  }, [editTeacherState]);

  return {
    editTeacherFields,
    editTeacherInitialValues,
    teacherFormFields,
  };
};
