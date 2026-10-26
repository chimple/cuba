import { useMemo } from 'react';
import { StudentInfo } from '../../../common/constants';
import { getClassDisplayLabel } from './ClassDetailsPageUtils';
import type { ClassRow } from './SchoolClass';
import type { ApiStudentData, DisplayStudent } from './SchoolStudents.types';
import { sameSection } from './SchoolStudents.utils';

type UseSchoolStudentClassContextParams = {
  baseStudents: ApiStudentData[];
  classData?: ClassRow[];
  editStudentData: StudentInfo | null;
  issTotal: boolean;
  mergePrimaryStudent: DisplayStudent | null;
  optionalClassId?: string;
  optionalGrade?: number | string;
  optionalSection?: string;
  programScopedClasses: ClassRow[];
};

export const useSchoolStudentClassContext = ({
  baseStudents,
  classData,
  editStudentData,
  issTotal,
  mergePrimaryStudent,
  optionalClassId,
  optionalGrade,
  optionalSection,
  programScopedClasses,
}: UseSchoolStudentClassContextParams) => {
  const classOptions = useMemo(() => {
    if (programScopedClasses.length === 0) return [];
    return programScopedClasses
      .map((classRow) => ({
        value: classRow.id,
        label: getClassDisplayLabel(
          classRow.grade,
          classRow.section,
          classRow.name,
        ),
      }))
      .filter((option) => option.value && option.label)
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [programScopedClasses]);

  const editClassOptions = useMemo(() => {
    const options = [...classOptions];
    const currentClassId = String(
      editStudentData?.classWithidname?.id ?? '',
    ).trim();
    const currentClassLabel = getClassDisplayLabel(
      editStudentData?.grade,
      editStudentData?.classSection,
      editStudentData?.classWithidname?.class_name,
    );

    if (
      currentClassId &&
      currentClassLabel &&
      !options.some((option) => option.value === currentClassId)
    ) {
      options.push({
        value: currentClassId,
        label: currentClassLabel,
      });
    }

    return options.sort((a, b) => a.label.localeCompare(b.label));
  }, [classOptions, editStudentData]);

  const currentClass = useMemo(() => {
    if (!issTotal) {
      const classDataArray = classData || [];
      const scopedClassId = String(optionalClassId ?? '').trim();
      if (classDataArray.length > 0) {
        const classFromData =
          (scopedClassId
            ? classDataArray.find(
                (classRow) =>
                  String(classRow?.id ?? '').trim() === scopedClassId,
              )
            : classDataArray[0]) ?? null;
        if (classFromData?.id && classFromData?.name) {
          return { id: classFromData.id, name: classFromData.name };
        }
      }
      const matchingStudent = baseStudents.find((student: any) => {
        const classInfo = student.classWithidname;
        return (
          (!scopedClassId ||
            String(classInfo?.id ?? '').trim() === scopedClassId ||
            (student.grade === optionalGrade &&
              sameSection(student.classSection, optionalSection))) &&
          classInfo?.id &&
          classInfo?.class_name
        );
      });
      if (matchingStudent?.classWithidname) {
        const classInfo = matchingStudent.classWithidname as any;
        return {
          id: classInfo.id,
          name: classInfo.class_name || classInfo.name,
        };
      }
      return null;
    }
    return null;
  }, [
    issTotal,
    optionalClassId,
    optionalGrade,
    optionalSection,
    baseStudents,
    classData,
  ]);

  const mergeModalClassId = useMemo(() => {
    const scopedClassId = String(optionalClassId ?? '').trim();
    if (scopedClassId) return scopedClassId;

    const primaryStudentClassId = String(
      mergePrimaryStudent?.original?.classWithidname?.id ?? '',
    ).trim();
    if (primaryStudentClassId) return primaryStudentClassId;

    const currentClassId = String(currentClass?.id ?? '').trim();
    return currentClassId;
  }, [optionalClassId, mergePrimaryStudent, currentClass?.id]);

  return {
    classOptions,
    currentClass,
    editClassOptions,
    mergeModalClassId,
  };
};
