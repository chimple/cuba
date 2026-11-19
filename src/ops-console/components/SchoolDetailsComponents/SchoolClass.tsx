import React, { useMemo, useRef, useEffect, useState } from 'react';
import './SchoolClass.css';
import { ServiceConfig } from '../../../services/ServiceConfig';
import ClassDetailsPage from './ClassDetailsPage';
import { t } from 'i18next';
import ClassForm from '../ClassForm';
import FormCard from './FormCard';
import { RoleType } from '../../../interface/modelInterfaces';
import { useAppSelector } from '../../../redux/hooks';
import { RootState } from '../../../redux/store';
import { AuthState } from '../../../redux/slices/auth/authSlice';
import {
  DEFAULT_DATE_RANGE,
  type DateRangeValue,
} from '../../pages/SchoolList.helpers';
import { normalizeSchoolModel } from './SchoolClassMetrics';
import {
  filterByProgramGrades,
  getClassDisplayLabel,
  getExactClassName,
  getProgramAllowedGrades,
} from './ClassDetailsPageUtils';
import SchoolClassTable from './SchoolClassTable';
import SchoolClassHeader from './SchoolClassHeader';
import SchoolClassDeletionControls from './SchoolClassDeletionControls';
import { useSelectedClassDetails } from './useSelectedClassDetails';
import { useSchoolClassAddStudent } from './useSchoolClassAddStudent';
import { useSchoolClassMetrics } from './useSchoolClassMetrics';
import { useSchoolClassDeletion } from './useSchoolClassDeletion';
import type { ClassRow, SchoolDetailsData } from './SchoolClass.types';
import ExistingStudentProfiles from './ExistingStudentProfiles';

export type {
  ClassRow,
  SchoolData,
  SchoolDetailsData,
} from './SchoolClass.types';
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
  const classDeletion = useSchoolClassDeletion({ api, refreshClasses });

  const allDataRef = useRef<SchoolDetailsData>(data);
  useEffect(() => {
    allDataRef.current = data;
  }, [data]);

  const allowedGrades = useMemo(
    () => getProgramAllowedGrades(data.programData),
    [data.programData],
  );
  const safeClasses: ClassRow[] = useMemo(() => {
    return filterByProgramGrades(data.classData, allowedGrades).filter(
      (classRow) => !classDeletion.deletedClassIds.has(classRow.id),
    );
  }, [data.classData, allowedGrades, classDeletion.deletedClassIds]);
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

  const schoolModel = useMemo(
    () => normalizeSchoolModel(data?.schoolData?.model),
    [data?.schoolData?.model],
  );
  const isAtSchool = schoolModel === 'at_school';
  const shouldShowClassCode =
    schoolModel === 'at_home' || schoolModel === 'hybrid';

  const {
    classMetrics,
    classMetricsLoading,
    codes,
    handleGenerateCode,
    loadingIds,
  } = useSchoolClassMetrics({
    api,
    schoolId,
    selectedDateRange,
    safeClasses,
    shouldShowClassCode,
    isExternalUser,
    onGenerateCode,
  });

  const {
    addStudentFields,
    classForStudent,
    handleAddStudentFieldChange,
    handleCloseAddStudentModal,
    handleSelectExistingStudent,
    handleLinkExistingStudent,
    handleSubmitAddStudentModal,
    isAddStudentModalOpen,
    isStudentSubmitting,
    setClassForStudent,
    setIsAddStudentModalOpen,
    studentProfileContact,
    selectedExistingStudentId,
    studentErrorMessage,
  } = useSchoolClassAddStudent({
    api,
    isAtSchool,
    schoolId,
    refreshClasses,
  });

  const selectedRow = useMemo(
    () =>
      selectedClassId
        ? (effectiveClasses.find((c) => c.id === selectedClassId) ?? null)
        : null,
    [selectedClassId, effectiveClasses],
  );
  const classDetailsById = useSelectedClassDetails(
    api,
    selectedClassId,
    selectedRow,
  );
  const selectedClassRow = selectedClassId
    ? (classDetailsById[selectedClassId] ?? selectedRow)
    : selectedRow;

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
    const fromRow =
      selectedClassRow?.code == null ? null : String(selectedClassRow.code);
    return (fromCodes || fromMetrics || fromRow) === null
      ? undefined
      : String(fromCodes || fromMetrics || fromRow);
  }, [selectedClassId, codes, classMetrics, selectedClassRow]);

  const selectedTotalStudents = useMemo(() => {
    if (!selectedClassId || !selectedClassRow) return undefined;
    const fromMetrics = classMetrics[selectedClassId]?.onboarded_students;
    const fromRow = selectedClassRow.studentCount;
    return Number.isFinite(fromRow)
      ? Number(fromRow)
      : Number.isFinite(fromMetrics)
        ? Number(fromMetrics)
        : undefined;
  }, [selectedClassId, selectedClassRow, classMetrics]);

  const handleEditClass = (classRow: ClassRow) => {
    setMode('edit');
    setEditingClass(classRow);
    setShowForm(true);
  };

  const handleAddStudent = (classRow: ClassRow) => {
    setClassForStudent(classRow);
    setIsAddStudentModalOpen(true);
  };

  const totalCount = safeClasses.length;

  return selectedClassId ? (
    <ClassDetailsPage
      data={data}
      schoolId={schoolId}
      classId={selectedClassId}
      classRow={selectedClassRow}
      classCodeOverride={selectedClassCode}
      totalStudentsOverride={selectedTotalStudents}
      onGroupLinked={handleGroupLinked}
      onBack={() => setSelectedClassId(null)}
    />
  ) : (
    <div className="schoolclass-pageContainer">
      <SchoolClassHeader
        isExternalUser={isExternalUser}
        onCreateClass={() => {
          setMode('create');
          setShowForm(true);
        }}
        selectedDateRange={selectedDateRange}
        setSelectedDateRange={setSelectedDateRange}
        totalCount={totalCount}
      />

      {showForm && (
        <ClassForm
          mode={mode}
          classData={editingClass ?? undefined}
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
        submitLabel={
          selectedExistingStudentId
            ? t('Link to this class')
            : isStudentSubmitting
              ? t('Adding...')
              : t('Create New Profile')
        }
        fields={addStudentFields}
        onClose={handleCloseAddStudentModal}
        onSubmit={(values) => {
          if (selectedExistingStudentId) {
            void handleLinkExistingStudent(
              selectedExistingStudentId,
              studentProfileContact,
            );
            return;
          }
          void handleSubmitAddStudentModal(values);
        }}
        onFieldChange={handleAddStudentFieldChange}
        selectedExistingStudentId={selectedExistingStudentId}
        message={studentErrorMessage}
        disabled={isStudentSubmitting}
      >
        <ExistingStudentProfiles
          api={api}
          classId={classForStudent?.id ?? ''}
          contact={studentProfileContact}
          disabled={isStudentSubmitting}
          selectedStudentId={selectedExistingStudentId}
          onSelectStudent={handleSelectExistingStudent}
          open={isAddStudentModalOpen}
        />
      </FormCard>

      <SchoolClassTable
        classMetrics={classMetrics}
        classMetricsLoading={classMetricsLoading}
        codes={codes}
        effectiveClasses={effectiveClasses}
        handleGenerateCode={handleGenerateCode}
        isExternalUser={isExternalUser}
        loadingIds={loadingIds}
        onAddStudent={handleAddStudent}
        onDeleteClass={classDeletion.handleDeleteClass}
        onEditClass={handleEditClass}
        onSelectClass={setSelectedClassId}
        shouldShowClassCode={shouldShowClassCode}
      />
      <SchoolClassDeletionControls deletion={classDeletion} />
    </div>
  );
};

export default SchoolClasses;
