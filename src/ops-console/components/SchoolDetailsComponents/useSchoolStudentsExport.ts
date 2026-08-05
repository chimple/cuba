import { useCallback, useState } from 'react';
import type { DisplayStudent } from './SchoolStudents.types';
import { buildStudentListExportRows } from './SchoolStudents.export';

type UseSchoolStudentsExportParams = {
  schoolName?: string;
  students: DisplayStudent[];
};

export const useSchoolStudentsExport = ({
  schoolName,
  students,
}: UseSchoolStudentsExportParams) => {
  const [isExporting, setIsExporting] = useState(false);

  const handleExportStudents = useCallback(async () => {
    if (students.length === 0) return;

    setIsExporting(true);

    try {
      const rows = buildStudentListExportRows(students);
      const { downloadStudentListPdf } = await import('./SchoolStudents.pdf');
      downloadStudentListPdf(rows, undefined, schoolName);
    } finally {
      setIsExporting(false);
    }
  }, [schoolName, students]);

  return { handleExportStudents, isExporting };
};
