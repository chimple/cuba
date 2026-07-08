import React, { useMemo, useRef, useEffect, useState } from 'react';
import DataTableBody from '../DataTableBody';
import {
  Button as MuiButton,
  Box,
  Typography,
  useMediaQuery,
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import EditOutlined from '@mui/icons-material/EditOutlined';
import PersonAddAlt1Outlined from '@mui/icons-material/PersonAddAlt1Outlined';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import './SchoolClass.css';
import ActionMenu from './ActionMenu';
import { ServiceConfig } from '../../../services/ServiceConfig';
import ClassDetailsPage from './ClassDetailsPage';
import { t } from 'i18next';
import ClassForm from '../ClassForm';
import { ClassWithDetails, SchoolStats } from '../../pages/SchoolDetailsPage';
import { TableTypes, AGE_OPTIONS, GENDER } from '../../../common/constants';
import FormCard, { FieldConfig, MessageConfig } from './FormCard';
import logger from '../../../utility/logger';
import { RoleType } from '../../../interface/modelInterfaces';
import { useAppSelector } from '../../../redux/hooks';
import { RootState } from '../../../redux/store';
import { AuthState } from '../../../redux/slices/auth/authSlice';
import type { ClassMetricsForClassListingRow } from '../../../services/api/ServiceApi';
import SchoolListDateRangeDropdown from '../SchoolListDateRangeDropdown';
import {
  DEFAULT_DATE_RANGE,
  type DateRangeValue,
} from '../../pages/SchoolList.helpers';
import {
  getClassMetricValues,
  normalizeSchoolModel,
  renderClassPerformanceCell,
  renderNumberCell,
  renderNumberWithPercentCell,
} from './SchoolClassMetrics';
import {
  filterByProgramGrades,
  getClassDisplayLabel,
  getExactClassName,
  getProgramAllowedGrades,
  ProgramGradeScopeData,
} from './ClassDetailsPageUtils';

export type SchoolDetailsData = {
  schoolData?: SchoolData;
  programData?: ProgramGradeScopeData;
  programManagers?: any[];
  principals?: any[];
  totalPrincipalCount?: number;
  coordinators?: any[];
  totalCoordinatorCount?: number;
  teachers?: any[];
  students?: any[];
  totalTeacherCount?: number;
  totalStudentCount?: number;
  schoolStats?: SchoolStats;
  classData?: ClassRow[];
  totalClassCount?: number;
};

export type SchoolData = TableTypes<'school'> & {
  whatsapp_bot_number?: string | null;
};

export type ClassRow = ClassWithDetails & {
  code?: string | number | null;
  grade?: number | string;
  section?: string;
  whatsapp_connected?: boolean;
};

type TableRowData = {
  id: string;
  _raw: ClassRow;
  class: { render: React.ReactNode };
  code?: string | { render: React.ReactNode };
  classPerformance: { render: React.ReactNode };
  onboardedStudents: { render: React.ReactNode };
  activatedStudents: { render: React.ReactNode };
  activeStudents: { render: React.ReactNode };
  avgTimeSpent: { render: React.ReactNode };
  activeTeachers: { render: React.ReactNode };
  activitiesAssigned: { render: React.ReactNode };
  avgAssignmentsCompleted: { render: React.ReactNode };
  avgActivitiesCompleted: { render: React.ReactNode };
  actions: { render: React.ReactNode };
};

type ColumnDef = {
  key: keyof TableRowData;
  label: string;
  align?: 'left' | 'right' | 'center' | 'justify' | 'inherit';
  headerAlign?: 'left' | 'center' | 'right';
  sortable?: boolean;
  width?: string | number;
};

interface Props {
  data: SchoolDetailsData;
  schoolId: string;
  isMobile?: boolean;
  onGenerateCode?: (classId: string) => void;
  refreshClasses?: () => void;
}
const SchoolClasses: React.FC<Props> = ({
  data,
  schoolId,
  isMobile,
  onGenerateCode,
  refreshClasses,
}) => {
  const isSmall = useMediaQuery('(max-width: 768px)');
  const api = ServiceConfig.getI().apiHandler;
  const { roles } = useAppSelector(
    (state: RootState) => state.auth as AuthState,
  );
  const userRoles = roles || [];
  const isExternalUser = userRoles.includes(RoleType.EXTERNAL_USER);
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [mode, setMode] = useState<'create' | 'edit'>('edit');
  const [showForm, setShowForm] = useState<boolean>(false);
  const [groupIdOverrides, setGroupIdOverrides] = useState<
    Record<string, string>
  >({});
  const [editingClass, setEditingClass] = useState<ClassRow | null>(null);
  const [selectedDateRange, setSelectedDateRange] =
    useState<DateRangeValue>(DEFAULT_DATE_RANGE);
  const [classMetrics, setClassMetrics] = useState<
    Record<string, ClassMetricsForClassListingRow>
  >({});
  const [classMetricsLoading, setClassMetricsLoading] = useState(false);
  const [codes, setCodes] = useState<Record<string, string | null>>({});
  const [loadingIds, setLoadingIds] = useState<Record<string, boolean>>({});

  // Add Student Modal State
  const [isAddStudentModalOpen, setIsAddStudentModalOpen] = useState(false);
  const [studentErrorMessage, setStudentErrorMessage] = useState<
    MessageConfig | undefined
  >();
  const [isStudentSubmitting, setIsStudentSubmitting] = useState(false);
  const [classForStudent, setClassForStudent] = useState<ClassRow | null>(null);

  const allDataRef = useRef<SchoolDetailsData>(data);
  useEffect(() => {
    allDataRef.current = data;
  }, [data]);

  const getAll = (): SchoolDetailsData => allDataRef.current;
  // Limits the class tab to the grades configured on the current program.
  const allowedGrades = useMemo(
    () => getProgramAllowedGrades(data.programData),
    [data.programData],
  );
  const safeClasses: ClassRow[] = useMemo(() => {
    return filterByProgramGrades(data.classData, allowedGrades);
  }, [data.classData, allowedGrades]);
  const effectiveClasses = useMemo(
    () =>
      safeClasses.map((classRow) => {
        const groupIdOverride = groupIdOverrides[classRow.id];
        if (!groupIdOverride || groupIdOverride === classRow.group_id) {
          return classRow;
        }
        return { ...classRow, group_id: groupIdOverride };
      }),
    [safeClasses, groupIdOverrides],
  );

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setClassMetricsLoading(true);
      try {
        const metricRows = await api.getClassMetricsForClassListing({
          schoolId,
          date_range: selectedDateRange,
        });
        if (cancelled) return;

        const nextMetrics: Record<string, ClassMetricsForClassListingRow> = {};
        const nextCodes: Record<string, string | null> = {};
        for (const row of metricRows ?? []) {
          if (!row?.class_id) continue;
          nextMetrics[row.class_id] = row;
          if (row.class_code !== null && row.class_code !== undefined) {
            nextCodes[row.class_id] = String(row.class_code);
          }
        }
        setClassMetrics(nextMetrics);
        if (Object.keys(nextCodes).length > 0) {
          setCodes((prev) => ({ ...nextCodes, ...prev }));
        }
      } catch (error) {
        logger.error('Failed to fetch class listing metrics:', error);
        if (!cancelled) setClassMetrics({});
      } finally {
        if (!cancelled) setClassMetricsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [api, schoolId, selectedDateRange]);

  const schoolModel = useMemo(
    () => normalizeSchoolModel(data?.schoolData?.model),
    [data?.schoolData?.model],
  );
  const isAtSchool = schoolModel === 'at_school';
  const shouldShowClassCode =
    schoolModel === 'at_home' || schoolModel === 'hybrid';

  useEffect(() => {
    if (!shouldShowClassCode) {
      setCodes({});
      return;
    }

    let cancelled = false;
    (async () => {
      const seeded: Record<string, string | null> = {};
      for (const c of safeClasses) {
        const v = c.code == null ? null : String(c.code);
        if (v) seeded[c.id] = v;
      }
      const missingIds = safeClasses
        .map((c) => c.id)
        .filter((id) => !(id in seeded));
      if (missingIds.length === 0) {
        if (!cancelled)
          setCodes((prev) => ({
            ...missingIds.reduce(
              (m, id) => ({ ...m, [id]: prev[id] ?? null }),
              {},
            ),
            ...seeded,
            ...prev,
          }));
        return;
      }
      try {
        const lookups = await Promise.all(
          missingIds.map(async (id) => {
            try {
              const val = await api.getClassCodeById(id);
              return [id, val == null ? null : String(val)] as const;
            } catch {
              return [id, null] as const;
            }
          }),
        );
        if (!cancelled) {
          const fetched: Record<string, string | null> = {};
          for (const [id, code] of lookups) fetched[id] = code;
          setCodes((prev) => ({ ...fetched, ...seeded, ...prev }));
        }
      } catch {
        if (!cancelled) setCodes((prev) => ({ ...seeded, ...prev }));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [api, safeClasses, shouldShowClassCode]);

  const handleGenerateCode = async (classId: string) => {
    try {
      if (isExternalUser) return;
      onGenerateCode?.(classId);
      setLoadingIds((s) => ({ ...s, [classId]: true }));
      const newCode = await api.createClassCode(classId);
      setCodes((prev) => ({ ...prev, [classId]: String(newCode) }));
    } catch (err) {
      logger.error('Failed to create class code:', err);
    } finally {
      setLoadingIds((s) => ({ ...s, [classId]: false }));
    }
  };

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
        required: true,
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
        required: true,
        placeholder: 'Select Age Group',
        column: 1 as const,
        options: [
          { value: AGE_OPTIONS.LESS_THAN_EQUAL_4, label: `≤${t('4 years')}` },
          { value: AGE_OPTIONS.FIVE, label: t('5 years') },
          { value: AGE_OPTIONS.SIX, label: t('6 years') },
          { value: AGE_OPTIONS.SEVEN, label: t('7 years') },
          { value: AGE_OPTIONS.EIGHT, label: t('8 years') },
          { value: AGE_OPTIONS.NINE, label: t('9 years') },
          {
            value: AGE_OPTIONS.GREATER_THAN_EQUAL_10,
            label: `≥${t('10 years')}`,
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

  const rows = useMemo<TableRowData[]>(() => {
    return effectiveClasses.map((c) => {
      const classLabel = typeof c.name === 'string' ? c.name.trim() : '';
      const metrics = classMetrics[c.id];
      const metricValues = getClassMetricValues(metrics, c.studentCount);

      const rawCodeVal = codes[c.id] ?? metrics?.class_code ?? null;
      const codeVal =
        rawCodeVal === null || rawCodeVal === undefined
          ? null
          : String(rawCodeVal);
      const hasCode = typeof codeVal === 'string' && codeVal.trim().length > 0;
      const isLoading = !!loadingIds[c.id];
      const codeCell = hasCode
        ? codeVal
        : isExternalUser
          ? t('Not Generated')
          : {
              render: (
                <MuiButton
                  variant="outlined"
                  size="small"
                  disabled={isLoading}
                  sx={{
                    borderRadius: '9999px',
                    textTransform: 'none',
                    px: 1.5,
                    py: 0.25,
                    height: 28,
                    fontWeight: 700,
                    boxShadow:
                      '0 1px 1px rgba(0,0,0,0.08), 0 2px 4px rgba(0,0,0,0.06)',
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleGenerateCode(c.id);
                  }}
                >
                  {isLoading ? t('Generating...') : t('Generate')}
                </MuiButton>
              ),
            };

      const baseRow: TableRowData = {
        id: c.id,
        _raw: c,
        class: { render: <strong>{classLabel}</strong> },
        classPerformance: renderClassPerformanceCell(metrics),
        onboardedStudents: renderNumberCell(metricValues.onboardedStudents),
        activatedStudents: renderNumberWithPercentCell(
          metricValues.activatedStudents,
          metricValues.activatedPercent,
        ),
        activeStudents: renderNumberWithPercentCell(
          metricValues.activeStudents,
          metricValues.activePercent,
        ),
        avgTimeSpent: renderNumberCell(metricValues.avgTimeSpent, 'm', {
          maxFractionDigits: 0,
        }),
        activeTeachers: renderNumberWithPercentCell(
          metricValues.activeTeachers,
          metricValues.activeTeachersPercent,
        ),
        activitiesAssigned: renderNumberCell(metricValues.activitiesAssigned),
        avgAssignmentsCompleted: renderNumberCell(
          metricValues.avgAssignmentsCompleted,
          '',
          {
            maxFractionDigits: 1,
          },
        ),
        avgActivitiesCompleted: renderNumberCell(
          metricValues.avgActivitiesCompleted,
          '',
          {
            maxFractionDigits: 1,
          },
        ),
        actions: {
          render: isExternalUser ? null : (
            <div
              onClick={(e) => e.stopPropagation()}
              style={{ display: 'flex', justifyContent: 'center' }}
            >
              <ActionMenu
                items={[
                  {
                    name: t('Edit Class'),
                    icon: <EditOutlined fontSize="small" />,
                    onClick: () => {
                      setMode('edit');
                      setEditingClass(c);
                      setShowForm(true);
                    },
                  },
                  {
                    name: t('Add Student'),
                    icon: <PersonAddAlt1Outlined fontSize="small" />,
                    onClick: () => {
                      setClassForStudent(c);
                      setIsAddStudentModalOpen(true);
                    },
                  },
                ]}
                renderTrigger={(open, isOpen) => (
                  <MuiButton
                    size="medium"
                    onClick={(e) => {
                      e.stopPropagation();
                      open(e);
                    }}
                    endIcon={
                      isOpen ? (
                        <KeyboardArrowUpIcon
                          fontSize="medium"
                          sx={{ color: 'black' }}
                        />
                      ) : (
                        <KeyboardArrowDownIcon
                          fontSize="medium"
                          sx={{ color: 'black' }}
                        />
                      )
                    }
                    sx={{
                      minWidth: 0,
                      borderRadius: '8px',
                      textTransform: 'none',
                    }}
                  />
                )}
              />
            </div>
          ),
        },
      };
      if (shouldShowClassCode) {
        baseRow.code = codeCell;
      }

      return baseRow;
    });
  }, [
    effectiveClasses,
    isExternalUser,
    codes,
    loadingIds,
    classMetrics,
    shouldShowClassCode,
  ]);

  const selectedRow = useMemo(
    () =>
      selectedClassId
        ? (effectiveClasses.find((c) => c.id === selectedClassId) ?? null)
        : null,
    [selectedClassId, effectiveClasses],
  );

  const handleGroupLinked = (classId: string, groupId: string) => {
    const classIdValue = String(classId ?? '').trim();
    const groupIdValue = String(groupId ?? '').trim();
    if (!classIdValue || !groupIdValue) return;

    setGroupIdOverrides((prev) => ({ ...prev, [classIdValue]: groupIdValue }));
  };

  const selectedClassCode = useMemo(() => {
    if (!selectedClassId) return undefined;
    const fromCodes = codes[selectedClassId] ?? null;
    const fromMetrics = classMetrics[selectedClassId]?.class_code;
    const fromRow = selectedRow?.code == null ? null : String(selectedRow.code);
    return (fromCodes || fromMetrics || fromRow) === null
      ? undefined
      : String(fromCodes || fromMetrics || fromRow);
  }, [selectedClassId, codes, classMetrics, selectedRow]);

  const selectedTotalStudents = useMemo(() => {
    if (!selectedRow) return undefined;
    return Number.isFinite(selectedRow.studentCount)
      ? Number(selectedRow.studentCount)
      : undefined;
  }, [selectedRow]);

  const columns = useMemo<ColumnDef[]>(() => {
    const cols: ColumnDef[] = [
      {
        key: 'class',
        label: t('Class'),
        sortable: false,
        width: 120,
        align: 'left',
        headerAlign: 'left',
      },
    ];
    if (shouldShowClassCode) {
      cols.push({
        key: 'code',
        label: t('Class Code'),
        sortable: false,
        align: 'center',
        headerAlign: 'center',
      });
    }
    cols.push(
      {
        key: 'classPerformance',
        label: t('Class Performance'),
        sortable: false,
        align: 'center',
        headerAlign: 'center',
      },
      {
        key: 'onboardedStudents',
        label: t('Onboarded Students'),
        sortable: false,
        align: 'center',
        headerAlign: 'center',
      },
      {
        key: 'activatedStudents',
        label: t('Activated Students'),
        sortable: false,
        align: 'center',
        headerAlign: 'center',
      },
      {
        key: 'activeStudents',
        label: t('Active Students'),
        sortable: false,
        align: 'center',
        headerAlign: 'center',
      },
      {
        key: 'avgTimeSpent',
        label: t('Avg Time Spent'),
        sortable: false,
        align: 'center',
        headerAlign: 'center',
      },
      {
        key: 'activeTeachers',
        label: t('Active Teachers'),
        sortable: false,
        align: 'center',
        headerAlign: 'center',
      },
      {
        key: 'activitiesAssigned',
        label: t('Activities Assigned'),
        sortable: false,
        align: 'center',
        headerAlign: 'center',
      },
      {
        key: 'avgAssignmentsCompleted',
        label: t('Avg Assignments Completed'),
        sortable: false,
        align: 'center',
        headerAlign: 'center',
      },
      {
        key: 'avgActivitiesCompleted',
        label: t('Avg Activities Completed'),
        sortable: false,
        align: 'center',
        headerAlign: 'center',
      },
    );
    if (!isExternalUser) {
      cols.push({
        key: 'actions',
        label: t('Actions'),
        align: 'center',
        headerAlign: 'center',
        sortable: false,
      });
    }
    return cols;
  }, [isExternalUser, shouldShowClassCode]);

  const totalCount = safeClasses.length;

  return selectedClassId ? (
    <ClassDetailsPage
      data={data}
      schoolId={schoolId}
      classId={selectedClassId}
      classRow={selectedRow}
      classCodeOverride={selectedClassCode}
      totalStudentsOverride={selectedTotalStudents}
      onGroupLinked={handleGroupLinked}
      onBack={() => setSelectedClassId(null)}
    />
  ) : (
    <div className="schoolclass-pageContainer">
      <Box className="schoolclass-headerActionsRow">
        <Box className="schoolclass-titleArea">
          <Typography variant="h5" className="schoolclass-titleHeading">
            {t('Classes')}
          </Typography>
          <Typography variant="body2" className="schoolclass-totalText">
            {t('Total: ')}
            {totalCount}
            {t(' classes')}
          </Typography>
        </Box>

        <Box className="schoolclass-actionsGroup">
          {!isExternalUser && (
            <MuiButton
              variant="outlined"
              onClick={() => {
                setMode('create');
                setShowForm(true);
              }}
              className="schoolclass-newStudentButton-outlined"
            >
              <AddIcon className="schoolclass-newStudentButton-outlined-icon" />
              {!isSmall && t('New Class')}
            </MuiButton>
          )}
          <SchoolListDateRangeDropdown
            value={selectedDateRange}
            onChange={setSelectedDateRange}
          />
        </Box>
      </Box>

      {showForm && (
        <ClassForm
          mode={mode}
          classData={editingClass}
          schoolId={schoolId}
          whatspAppBotNumber={data.schoolData?.whatsapp_bot_number || ''}
          onSaved={refreshClasses}
          onClose={() => setShowForm(false)}
        />
      )}

      <FormCard
        open={isAddStudentModalOpen}
        title={
          classForStudent
            ? `${t('Add New Student')} - ${getClassDisplayLabel(
                classForStudent.grade,
                classForStudent.section,
                getExactClassName(classForStudent),
              )}`
            : t('Add New Student')
        }
        submitLabel={isStudentSubmitting ? t('Adding...') : t('Add Student')}
        fields={addStudentFields}
        onClose={handleCloseAddStudentModal}
        onSubmit={handleSubmitAddStudentModal}
        message={studentErrorMessage}
      />

      <div className="schoolclass-table-container">
        <DataTableBody
          columns={columns}
          rows={rows}
          orderBy={'class' as const}
          order={'asc' as const}
          onSort={() => {}}
          onRowClick={(id) => setSelectedClassId(String(id))}
          loading={classMetricsLoading}
          tableMinWidth={shouldShowClassCode ? 1380 : 1260}
          headerAlign="center"
          headerNoEllipsis
        />
      </div>
    </div>
  );
};

export default SchoolClasses;
