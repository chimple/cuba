import { useMemo } from 'react';
import { t } from 'i18next';
import { AGE_OPTIONS, GENDER, StudentInfo } from '../../../common/constants';
import type { FieldConfig } from './FormCard';

type SelectOption = {
  value: string;
  label: string;
};

type UseSchoolStudentFieldsParams = {
  classOptions: SelectOption[];
  editClassOptions: SelectOption[];
  editStudentData: StudentInfo | null;
  isAtSchool: boolean;
  issTotal: boolean;
};

const getAgeOptions = () => [
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
];

const genderOptions = () => [
  { label: t('GIRL'), value: GENDER.GIRL },
  { label: t('BOY'), value: GENDER.BOY },
  {
    label: t('UNSPECIFIED'),
    value: GENDER.OTHER,
  },
];

export const useSchoolStudentFields = ({
  classOptions,
  editClassOptions,
  editStudentData,
  isAtSchool,
  issTotal,
}: UseSchoolStudentFieldsParams) => {
  const addStudentFields: FieldConfig[] = useMemo(() => {
    const fields: FieldConfig[] = [
      {
        name: 'studentName',
        label: 'Student Name',
        kind: 'text',
        required: true,
        placeholder: 'Enter Student Name',
        column: issTotal ? 2 : 0,
      },
      {
        name: 'studentID',
        label: 'Student ID',
        kind: 'text',
        placeholder: 'Enter Student ID',
        column: issTotal ? 0 : 1,
      },
      {
        name: 'gender',
        label: 'Gender',
        kind: 'select',
        column: issTotal ? 1 : 0,
        options: genderOptions(),
      },
      ...(issTotal
        ? [
            {
              name: 'class',
              label: 'Class',
              kind: 'select' as const,
              required: true,
              column: 0 as const,
              options: classOptions,
            },
          ]
        : []),
      {
        name: 'ageGroup',
        label: 'Age',
        kind: 'select',
        placeholder: 'Select Age Group',
        column: issTotal ? 1 : 1,
        options: getAgeOptions(),
      },
    ];
    if (!isAtSchool) {
      fields.push({
        name: 'phone',
        label: 'Phone Number',
        kind: 'phone',
        required: true,
        placeholder: 'Enter phone number',
        column: 2,
      });
    }
    return fields;
  }, [issTotal, classOptions, isAtSchool]);

  const hasContact =
    !!editStudentData?.parent?.phone || !!editStudentData?.parent?.email;

  const editStudentFields: FieldConfig[] = [
    {
      name: 'studentName',
      label: 'Student Name',
      kind: 'text',
      required: true,
      column: 2,
    },
    {
      name: 'studentID',
      label: 'Student ID',
      kind: 'text',
      column: 0,
      disabled: true,
    },
    {
      name: 'gender',
      label: 'Gender',
      kind: 'select',
      required: true,
      column: 1,
      options: [
        { label: t('FEMALE'), value: GENDER.GIRL },
        { label: t('MALE'), value: GENDER.BOY },
        { label: t('UNSPECIFIED'), value: GENDER.OTHER },
      ],
    },
    {
      name: 'classAndSection',
      label: 'Class And Section',
      kind: 'select',
      required: true,
      suppressPlaceholderOption: true,
      column: 0,
      options: editClassOptions,
    },
    {
      name: 'ageGroup',
      label: 'Age',
      kind: 'select',
      required: true,
      column: 1,
      options: Object.values(AGE_OPTIONS).map((v) => ({
        value: v,
        label: v,
      })),
    },
    {
      name: 'phone',
      label: hasContact ? 'Phone / Email' : 'Phone Number',
      kind: !isAtSchool && !hasContact ? 'phone' : 'chips',
      column: 2,
      required: !hasContact,
    },
  ];

  return { addStudentFields, editStudentFields };
};
