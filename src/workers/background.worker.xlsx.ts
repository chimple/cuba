import {
  applyFreezePanesToWorkbook,
  XLSX_EXPORT_BORDER_COLOR,
  XLSX_EXPORT_FONT_NAME,
  XLSX_EXPORT_FONT_SIZE,
} from '../utility/xlsxExportUtils';
import {
  BuildXlsxFilePayload,
  ParseXlsxSheetsPayload,
} from './background.worker.types';

let xlsxModulePromise: Promise<typeof import('xlsx-js-style')> | null = null;
type XlsxModule = typeof import('xlsx-js-style');
type XlsxSheetRow = Record<string, unknown>;
type XlsxWorksheetStyle = {
  font?: Record<string, unknown>;
  border?: Record<string, unknown>;
  fill?: Record<string, unknown>;
  alignment?: Record<string, unknown>;
};
type XlsxWorksheetCell = {
  s?: XlsxWorksheetStyle;
  [key: string]: unknown;
};
type WritableWorksheet = Record<string, unknown> & {
  ['!cols']?: unknown;
  ['!rows']?: unknown;
  ['!merges']?: unknown;
};
const getWrappedCellMaxLineLength = (value: string | number | undefined) =>
  String(value ?? '')
    .split('\n')
    .reduce((maxLength, line) => Math.max(maxLength, line.length), 0);
const getXlsx = async (): Promise<XlsxModule> => {
  if (!xlsxModulePromise) {
    xlsxModulePromise = import('xlsx-js-style');
  }
  return xlsxModulePromise;
};
const getWorksheetCell = (
  sheet: WritableWorksheet,
  cellRef: string,
): XlsxWorksheetCell | undefined =>
  sheet[cellRef] as XlsxWorksheetCell | undefined;

export const parseXlsxSheets = async (
  payload: ParseXlsxSheetsPayload,
): Promise<{
  sheetNames: string[];
  sheets: Record<string, XlsxSheetRow[]>;
}> => {
  const XLSX = await getXlsx();
  const workbook = XLSX.read(payload.fileBuffer, { type: 'array' });
  const sheets: Record<string, XlsxSheetRow[]> = {};
  for (const sheetName of workbook.SheetNames) {
    const worksheet = workbook.Sheets[sheetName];
    sheets[sheetName] = XLSX.utils.sheet_to_json(worksheet, {
      raw: false,
      defval: '',
    }) as XlsxSheetRow[];
  }
  return {
    sheetNames: workbook.SheetNames,
    sheets,
  };
};

const toArrayBuffer = (value: unknown): ArrayBuffer => {
  if (value instanceof ArrayBuffer) {
    return value;
  }
  if (ArrayBuffer.isView(value)) {
    const view = value as ArrayBufferView;
    const bytes = new Uint8Array(view.buffer, view.byteOffset, view.byteLength);
    const copy = new Uint8Array(bytes.byteLength);
    copy.set(bytes);
    return copy.buffer;
  }
  if (typeof value === 'string') {
    const encoded = new TextEncoder().encode(value);
    const copy = new Uint8Array(encoded.byteLength);
    copy.set(encoded);
    return copy.buffer;
  }
  throw new Error('Unsupported XLSX write output type');
};

export const buildXlsxFile = async (
  payload: BuildXlsxFilePayload,
): Promise<{
  fileBuffer: ArrayBuffer;
}> => {
  const XLSX = await getXlsx();
  const workbook = XLSX.utils.book_new();
  for (const sheetName of payload.sheetNames) {
    const rows = payload.sheets[sheetName] ?? [];
    const sheetFormat = payload.sheetFormats?.[sheetName] ?? 'json';
    const sheet =
      sheetFormat === 'aoa'
        ? XLSX.utils.aoa_to_sheet(rows as Array<Array<string | number>>)
        : XLSX.utils.json_to_sheet(rows as XlsxSheetRow[]);
    const writableSheet = sheet as WritableWorksheet;

    const applyCellBorders = (
      rowCount: number,
      columnCount: number,
      borderColor = XLSX_EXPORT_BORDER_COLOR,
    ) => {
      for (let rowIndex = 0; rowIndex < rowCount; rowIndex += 1) {
        for (let columnIndex = 0; columnIndex < columnCount; columnIndex += 1) {
          const cellRef = XLSX.utils.encode_cell({
            r: rowIndex,
            c: columnIndex,
          });
          const cell = getWorksheetCell(writableSheet, cellRef);
          if (!cell) continue;
          cell.s = {
            ...cell.s,
            font: {
              ...(cell.s?.font ?? {}),
              name: XLSX_EXPORT_FONT_NAME,
              sz: XLSX_EXPORT_FONT_SIZE,
            },
            border: {
              top: { style: 'thin', color: { rgb: borderColor } },
              bottom: { style: 'thin', color: { rgb: borderColor } },
              left: { style: 'thin', color: { rgb: borderColor } },
              right: { style: 'thin', color: { rgb: borderColor } },
            },
          };
        }
      }
    };

    if (sheetFormat === 'aoa') {
      const headers = (rows as Array<Array<string | number>>)[0] ?? [];
      const headerCount = headers.length;
      for (let columnIndex = 0; columnIndex < headerCount; columnIndex += 1) {
        const cellRef = XLSX.utils.encode_cell({ r: 0, c: columnIndex });
        const cell = getWorksheetCell(writableSheet, cellRef);
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

      const merges = payload.sheetMerges?.[sheetName] ?? [];
      const mergeWidths = new Map<number, number>();
      merges.forEach((merge) => {
        const span = merge.e.c - merge.s.c + 1;
        const headerText = String(headers[merge.s.c] ?? '');
        const widthPerColumn = Math.max(
          12,
          Math.ceil(headerText.length / span) + 2,
        );
        for (
          let columnIndex = merge.s.c;
          columnIndex <= merge.e.c;
          columnIndex += 1
        ) {
          mergeWidths.set(columnIndex, widthPerColumn);
        }
      });
      const firstColumnWidth = (rows as Array<Array<string | number>>).reduce(
        (maxWidth, row) =>
          Math.max(maxWidth, getWrappedCellMaxLineLength(row[0])),
        getWrappedCellMaxLineLength(headers[0]),
      );
      writableSheet['!cols'] = headers.map((header, columnIndex) => ({
        wch:
          columnIndex === 0
            ? Math.max(20, firstColumnWidth + 4)
            : (mergeWidths.get(columnIndex) ??
              Math.max(12, String(header ?? '').length + 2)),
      }));
    }

    const wrappedColumns = payload.sheetWrapColumns?.[sheetName] ?? [];
    if (sheetFormat === 'aoa' && wrappedColumns.length > 0) {
      const rowCount = (rows as Array<Array<string | number>>).length;
      wrappedColumns.forEach((columnIndex) => {
        for (let rowIndex = 1; rowIndex < rowCount; rowIndex += 1) {
          const cellRef = XLSX.utils.encode_cell({
            r: rowIndex,
            c: columnIndex,
          });
          const cell = getWorksheetCell(writableSheet, cellRef);
          if (!cell) continue;
          cell.s = {
            ...cell.s,
            alignment: {
              ...(cell.s?.alignment ?? {}),
              wrapText: true,
              vertical: 'top',
            },
          };
        }
      });
      writableSheet['!rows'] = Array.from(
        { length: rowCount },
        (_, rowIndex) => (rowIndex === 0 ? {} : { hpt: 30 }),
      );
    }

    const merges = payload.sheetMerges?.[sheetName] ?? [];
    if (merges.length > 0) {
      writableSheet['!merges'] = merges;
      merges.forEach((merge) => {
        const cellRef = XLSX.utils.encode_cell(merge.s);
        const cell = getWorksheetCell(writableSheet, cellRef);
        if (!cell) return;
        cell.s = {
          ...cell.s,
          alignment: {
            ...(cell.s?.alignment ?? {}),
            horizontal: 'center',
            vertical: 'center',
          },
        };
      });
    }

    if (sheetFormat === 'aoa') {
      const rowCount = (rows as Array<Array<string | number>>).length;
      const columnCount = ((rows as Array<Array<string | number>>)[0] ?? [])
        .length;
      applyCellBorders(rowCount, columnCount);
    }

    XLSX.utils.book_append_sheet(workbook, sheet, sheetName);
  }
  const output = XLSX.write(workbook, {
    bookType: 'xlsx',
    type: 'array',
  });
  const outputBuffer = toArrayBuffer(output);
  const frozenBuffer = await applyFreezePanesToWorkbook(
    outputBuffer,
    payload.sheetNames,
    payload.sheetFreeze,
  );
  return {
    fileBuffer: frozenBuffer,
  };
};
