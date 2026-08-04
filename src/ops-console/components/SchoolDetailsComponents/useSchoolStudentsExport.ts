import { useCallback, useState } from 'react';
import type * as XLSXModule from 'xlsx-js-style';
import {
  OPS_PERFORMANCE_BANDS,
  WHATSAPP_GROUP_STATUS,
  WHATSAPP_GROUP_STATUS_KEYS,
} from '../../../common/constants';
import logger from '../../../utility/logger';
import { Util } from '../../../utility/util';
import {
  applyFreezePanesToWorkbook,
  type FreezePaneConfig,
  XLSX_EXPORT_BORDER_COLOR,
  XLSX_EXPORT_FONT_NAME,
  XLSX_EXPORT_FONT_SIZE,
} from '../../../utility/xlsxExportUtils';
import { runBackgroundWorkerTask } from '../../../workers/backgroundWorkerClient';
import type {
  DisplayStudent,
  WhatsappGroupStatusKey,
} from './SchoolStudents.types';

const EXPORT_SHEET_NAME = 'Students';
const EXPORT_FILE_NAME = 'StudentListing.xlsx';

const STUDENT_EXPORT_HEADERS = [
  'Student ID',
  'Student Name',
  'Gender',
  'Performance',
  'Class',
  'WhatsApp',
] as const;

type XlsxModule = typeof XLSXModule;
type XlsxWorkSheet = XLSXModule.WorkSheet;

let xlsxModulePromise: Promise<XlsxModule> | null = null;

const getXlsx = async (): Promise<XlsxModule> => {
  if (!xlsxModulePromise) {
    xlsxModulePromise = import('xlsx-js-style');
  }
  return xlsxModulePromise;
};

const formatGender = (gender?: string) => {
  if (!gender) return '';
  return gender.charAt(0).toUpperCase() + gender.slice(1).toLowerCase();
};

const getWhatsappExportLabel = (status?: WhatsappGroupStatusKey) => {
  const key = status ?? WHATSAPP_GROUP_STATUS_KEYS.NOT_CHECKED;
  return WHATSAPP_GROUP_STATUS[key] ?? WHATSAPP_GROUP_STATUS.NOT_CHECKED;
};

export const buildSchoolStudentsExportSheetRows = (
  students: DisplayStudent[],
): string[][] => [
  [...STUDENT_EXPORT_HEADERS],
  ...students.map((student) => [
    student.studentIdDisplay ?? '',
    student.name ?? '',
    formatGender(student.gender),
    student.schstudents_performance ?? OPS_PERFORMANCE_BANDS.NOT_DOWNLOADED,
    student.class ?? '',
    getWhatsappExportLabel(student.whatsappGroupStatus),
  ]),
];

const applyCellBorders = (
  xlsx: XlsxModule,
  worksheet: XlsxWorkSheet,
  rowCount: number,
  columnCount: number,
) => {
  for (let rowIndex = 0; rowIndex < rowCount; rowIndex += 1) {
    for (let columnIndex = 0; columnIndex < columnCount; columnIndex += 1) {
      const cellRef = xlsx.utils.encode_cell({ r: rowIndex, c: columnIndex });
      const cell = worksheet[cellRef];
      if (!cell) continue;
      cell.s = {
        ...cell.s,
        font: {
          ...(cell.s?.font ?? {}),
          name: XLSX_EXPORT_FONT_NAME,
          sz: XLSX_EXPORT_FONT_SIZE,
        },
        border: {
          top: { style: 'thin', color: { rgb: XLSX_EXPORT_BORDER_COLOR } },
          bottom: { style: 'thin', color: { rgb: XLSX_EXPORT_BORDER_COLOR } },
          left: { style: 'thin', color: { rgb: XLSX_EXPORT_BORDER_COLOR } },
          right: { style: 'thin', color: { rgb: XLSX_EXPORT_BORDER_COLOR } },
        },
      };
    }
  }
};

const applyHeaderRowFormatting = (
  xlsx: XlsxModule,
  worksheet: XlsxWorkSheet,
  headerCount: number,
) => {
  for (let columnIndex = 0; columnIndex < headerCount; columnIndex += 1) {
    const cellRef = xlsx.utils.encode_cell({ r: 0, c: columnIndex });
    const cell = worksheet[cellRef];
    if (!cell) continue;
    cell.s = {
      ...cell.s,
      font: {
        ...(cell.s?.font ?? {}),
        name: XLSX_EXPORT_FONT_NAME,
        sz: XLSX_EXPORT_FONT_SIZE,
        bold: true,
        color: { rgb: 'FFFFFF' },
      },
      fill: {
        patternType: 'solid',
        fgColor: { rgb: '1A71F6' },
        bgColor: { rgb: '1A71F6' },
      },
      alignment: {
        ...(cell.s?.alignment ?? {}),
        vertical: 'center',
      },
    };
  }
};

const applyHeaderColumnWidths = (
  worksheet: XlsxWorkSheet,
  sheetRows: string[][],
) => {
  worksheet['!cols'] = STUDENT_EXPORT_HEADERS.map((header, columnIndex) => {
    const maxCellLength = sheetRows.reduce(
      (maxLength, row) =>
        Math.max(maxLength, String(row[columnIndex] ?? '').length),
      header.length,
    );
    return { wch: Math.max(12, Math.min(maxCellLength + 2, 40)) };
  });
};

const buildExportWorkbook = async (sheetRows: string[][]) => {
  const sheetFreeze = {
    [EXPORT_SHEET_NAME]: {
      xSplit: 0,
      ySplit: 1,
      topLeftCell: 'A2',
      activePane: 'bottomLeft',
    } satisfies FreezePaneConfig,
  };

  try {
    const builtWorkbook = await runBackgroundWorkerTask('BUILD_XLSX_FILE', {
      sheetNames: [EXPORT_SHEET_NAME],
      sheets: {
        [EXPORT_SHEET_NAME]: sheetRows,
      },
      sheetFormats: {
        [EXPORT_SHEET_NAME]: 'aoa',
      },
      sheetFreeze,
    });
    return builtWorkbook.fileBuffer;
  } catch (workerError) {
    logger.warn(
      'Student listing export worker failed, falling back to main thread workbook generation.',
      workerError,
    );
    const XLSX = await getXlsx();
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.aoa_to_sheet(sheetRows);
    applyCellBorders(
      XLSX,
      worksheet,
      sheetRows.length,
      STUDENT_EXPORT_HEADERS.length,
    );
    applyHeaderRowFormatting(XLSX, worksheet, STUDENT_EXPORT_HEADERS.length);
    applyHeaderColumnWidths(worksheet, sheetRows);
    XLSX.utils.book_append_sheet(workbook, worksheet, EXPORT_SHEET_NAME);
    const output = XLSX.write(workbook, {
      bookType: 'xlsx',
      type: 'array',
    }) as ArrayBuffer;
    return applyFreezePanesToWorkbook(output, [EXPORT_SHEET_NAME], sheetFreeze);
  }
};

export const useSchoolStudentsExport = ({
  isLoading,
  isPerformanceLoading,
  students,
}: {
  isLoading: boolean;
  isPerformanceLoading: boolean;
  students: DisplayStudent[];
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const isExportDisabled =
    isLoading || isPerformanceLoading || isExporting || students.length === 0;

  const handleExportStudents = useCallback(async () => {
    if (isExportDisabled) return;

    setIsExporting(true);
    try {
      const sheetRows = buildSchoolStudentsExportSheetRows(students);
      const output = await buildExportWorkbook(sheetRows);
      const blob = new Blob([output], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });

      await Util.handleBlobDownloadAndSave(blob, EXPORT_FILE_NAME);
    } catch (error) {
      logger.error('Failed to export student listing', error);
    } finally {
      setIsExporting(false);
    }
  }, [isExportDisabled, students]);

  return {
    handleExportStudents,
    isExportDisabled,
    isExporting,
  };
};
