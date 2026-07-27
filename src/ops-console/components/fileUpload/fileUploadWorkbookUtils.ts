import { runBackgroundWorkerTask } from '../../../workers/backgroundWorkerClient';
import logger from '../../../utility/logger';
import type { FileUploadRow, StyledCell } from './fileUploadTypes';

type XlsxModule = typeof import('xlsx-js-style');

let xlsxModulePromise: Promise<XlsxModule> | null = null;

const getXlsx = async (): Promise<XlsxModule> => {
  if (!xlsxModulePromise) {
    xlsxModulePromise = import('xlsx-js-style').catch((error) => {
      xlsxModulePromise = null;
      throw error;
    });
  }
  return xlsxModulePromise;
};

export const createStyledCell = (
  message: string,
  isError: boolean,
): StyledCell => {
  const color = isError ? 'FF0000' : '00A000';
  return {
    v: message,
    t: 's',
    s: {
      font: {
        color: { rgb: color },
        bold: true,
      },
      alignment: {
        horizontal: 'left',
        vertical: 'center',
        wrapText: true,
      },
      border: {
        top: { style: 'thin', color: { rgb: color } },
        bottom: { style: 'thin', color: { rgb: color } },
        left: { style: 'thin', color: { rgb: color } },
        right: { style: 'thin', color: { rgb: color } },
      },
    },
  };
};

export const normalizeWhatsappBotNumber = (value: unknown): string => {
  const raw = value?.toString().trim() || '';
  if (!raw) return '';
  if (/^\d+$/.test(raw)) return raw;
  if (/^\d+\.0+$/.test(raw)) {
    return raw.replace(/\.0+$/, '');
  }
  if (/^\d+(\.\d+)?e[+-]?\d+$/i.test(raw)) {
    const numericValue = Number(raw);
    if (Number.isFinite(numericValue)) {
      return Math.trunc(numericValue).toString();
    }
  }
  return raw;
};

export const normalizeSheetRows = (rows: FileUploadRow[]): FileUploadRow[] =>
  rows.map((row) =>
    Object.fromEntries(
      Object.entries(row).map(([key, value]) => [
        key.trim(),
        typeof value === 'string' ? value.trim() : value,
      ]),
    ),
  );

export const parseWorkbookSheets = async (fileBuffer: ArrayBuffer) => {
  try {
    const parsedWorkbook = await runBackgroundWorkerTask('PARSE_XLSX_SHEETS', {
      fileBuffer,
    });
    return {
      workbookSheetNames: parsedWorkbook.sheetNames as string[],
      workbookSheets: parsedWorkbook.sheets as Record<string, FileUploadRow[]>,
    };
  } catch (workerError) {
    logger.warn(
      'XLSX parsing failed in worker, falling back to main thread parsing.',
      workerError,
    );
    const XLSX = await getXlsx();
    const workbook = XLSX.read(fileBuffer, { type: 'array' });
    const workbookSheets: Record<string, FileUploadRow[]> = {};
    for (const sheetName of workbook.SheetNames) {
      const worksheet = workbook.Sheets[sheetName];
      workbookSheets[sheetName] = XLSX.utils.sheet_to_json(worksheet, {
        raw: false,
        defval: '',
      }) as FileUploadRow[];
    }
    return { workbookSheetNames: workbook.SheetNames, workbookSheets };
  }
};

export const buildProcessedWorkbook = async (
  workbookSheetNames: string[],
  processedSheetsForExport: Record<string, FileUploadRow[]>,
): Promise<ArrayBuffer> => {
  try {
    const builtWorkbook = await runBackgroundWorkerTask('BUILD_XLSX_FILE', {
      sheetNames: workbookSheetNames,
      sheets: processedSheetsForExport,
    });
    return builtWorkbook.fileBuffer;
  } catch (workerError) {
    logger.warn(
      'XLSX generation failed in worker, falling back to main thread generation.',
      workerError,
    );
    const XLSX = await getXlsx();
    const fallbackWorkbook = XLSX.utils.book_new();
    for (const sheetName of workbookSheetNames) {
      const rows = processedSheetsForExport[sheetName] ?? [];
      const sheetData = XLSX.utils.json_to_sheet(rows);
      XLSX.utils.book_append_sheet(fallbackWorkbook, sheetData, sheetName);
    }
    return XLSX.write(fallbackWorkbook, {
      bookType: 'xlsx',
      type: 'array',
    }) as ArrayBuffer;
  }
};

export const prepareBulkUploadPayload = async (validatedSheets: {
  school: any[];
  class: any[];
  teacher: any[];
  student: any[];
}) => {
  try {
    return await runBackgroundWorkerTask('PREPARE_BULK_UPLOAD_PAYLOAD', {
      schoolData: validatedSheets.school,
      classData: validatedSheets.class,
      teacherData: validatedSheets.teacher,
      studentData: validatedSheets.student,
    });
  } catch (error) {
    logger.error(
      'Bulk upload payload generation failed in worker, falling back to main thread payload mapper.',
      error,
    );
    const { generateFinalPayload } =
      await import('../../OpsUtility/OpsDataMapper');
    return generateFinalPayload(
      validatedSheets.school,
      validatedSheets.class,
      validatedSheets.teacher,
      validatedSheets.student,
    );
  }
};
