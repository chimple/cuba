import { useCallback, useState } from 'react';
import type { DisplayStudent } from './SchoolStudents.types';
import { buildStudentListExportRows } from './SchoolStudents.export';
import { Util } from '../../../utility/util';

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
      const { buildStudentListPdfBlob } = await import('./SchoolStudents.pdf');
      const pdfBlob = buildStudentListPdfBlob(rows, schoolName);
      await Util.handleBlobDownloadAndSave(
        pdfBlob,
        'StudentsListing.pdf',
        'application/pdf',
      );
    } finally {
      setIsExporting(false);
    }
  }, [schoolName, students]);

  return { handleExportStudents, isExporting };
};
