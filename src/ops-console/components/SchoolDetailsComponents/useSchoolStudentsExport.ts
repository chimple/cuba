import { useCallback, useState } from 'react';
import type { DisplayStudent } from './SchoolStudents.types';
import { buildStudentListExportRows } from './SchoolStudents.export';
import { downloadStudentListPdf } from './SchoolStudents.pdf';

type UseSchoolStudentsExportParams = {
  schoolName?: string;
  students: DisplayStudent[];
};

export const useSchoolStudentsExport = ({
  schoolName,
  students,
}: UseSchoolStudentsExportParams) => {
  const [isExporting, setIsExporting] = useState(false);

  const handleExportStudents = useCallback(() => {
    setIsExporting(true);

    try {
      const rows = buildStudentListExportRows(students);
      downloadStudentListPdf(rows, undefined, schoolName);
    } finally {
      setIsExporting(false);
    }
  }, [schoolName, students]);

  return { handleExportStudents, isExporting };
};
