import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  STUDENT_EXPORT_COLUMNS,
  type StudentExportRow,
} from './SchoolStudents.export';

export const buildStudentListPdfBlob = (
  rows: StudentExportRow[],
  schoolName?: string,
) => {
  const document = new jsPDF({ orientation: 'landscape' });
  const pageWidth = document.internal.pageSize.getWidth();
  const tableWidth = 260;
  const tableMargin = Math.max(14, (pageWidth - tableWidth) / 2);
  const resolvedSchoolName = schoolName?.trim() || 'School';

  document.setFontSize(16);
  document.text(resolvedSchoolName, pageWidth / 2, 16, { align: 'center' });
  document.setFontSize(13);
  document.text('Students List', pageWidth / 2, 24, { align: 'center' });
  document.setFontSize(9);
  document.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 32);

  autoTable(document, {
    head: [Array.from(STUDENT_EXPORT_COLUMNS)],
    body: rows,
    startY: 38,
    tableWidth,
    margin: {
      left: tableMargin,
      right: tableMargin,
    },
    theme: 'grid',
    styles: {
      fontSize: 9,
      cellPadding: 3,
      textColor: [31, 41, 55],
    },
    headStyles: {
      fillColor: [37, 99, 235],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    columnStyles: {
      0: { cellWidth: 35 },
      1: { cellWidth: 75 },
      2: { cellWidth: 75 },
      3: { cellWidth: 75 },
    },
    didDrawPage: (hookData) => {
      document.setFontSize(8);
      document.text(
        `Page ${hookData.pageNumber}`,
        document.internal.pageSize.getWidth() - 20,
        document.internal.pageSize.getHeight() - 8,
        { align: 'right' },
      );
    },
  });

  return document.output('blob') as Blob;
};
