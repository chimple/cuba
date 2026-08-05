import type { DisplayStudent } from './SchoolStudents.types';

export const STUDENT_EXPORT_COLUMNS = [
  'Class',
  'Student Name',
  'Performance',
  'WhatsApp',
] as const;

export type StudentExportRow = [string, string, string, string];

const missingValue = '--';

const getClassSortParts = (className: string) => {
  const normalized = className.trim().toUpperCase();
  const match = normalized.match(/^(\d+)\s*(.*)$/);

  return {
    grade: match ? Number(match[1]) : Number.MAX_SAFE_INTEGER,
    section: match?.[2]?.trim() ?? normalized,
    normalized,
  };
};

export const compareStudentClasses = (
  firstClass: string,
  secondClass: string,
) => {
  const first = getClassSortParts(firstClass);
  const second = getClassSortParts(secondClass);

  if (first.grade !== second.grade) return first.grade - second.grade;
  return first.section.localeCompare(second.section, undefined, {
    numeric: true,
    sensitivity: 'base',
  });
};

export const buildStudentListExportRows = (
  students: DisplayStudent[],
): StudentExportRow[] =>
  [...students]
    .sort((first, second) => {
      const classResult = compareStudentClasses(first.class, second.class);
      if (classResult !== 0) return classResult;

      return first.name.localeCompare(second.name, undefined, {
        sensitivity: 'base',
      });
    })
    .map((student) => [
      student.class || missingValue,
      student.name || missingValue,
      student.schstudents_performance || missingValue,
      student.whatsappGroupStatus || missingValue,
    ]);
