import { useCallback, useState } from 'react';
import type * as XLSXModule from 'xlsx-js-style';
import { PROGRAM_TAB } from '../../common/constants';
import type { ServiceApi } from '../../services/api/ServiceApi';
import { Util } from '../../utility/util';
import logger from '../../utility/logger';
import { runBackgroundWorkerTask } from '../../workers/backgroundWorkerClient';
import {
  fetchSchoolListPage,
  type SchoolListRow,
  type SchoolListSourceRow,
} from './SchoolList.fetcher';
import {
  getSchoolListExportColumns,
  type DateRangeValue,
  type Filters,
} from './SchoolList.helpers';
import {
  isSchoolMetricCell,
  mapSchoolRowsToRenderRows,
} from './SchoolListRowRenderer';

const EXPORT_SHEET_NAME = 'Schools';
const EXPORT_FILE_NAME = 'SchoolMetrics.xlsx';
const EXPORT_BORDER_COLOR = 'D0D7DE';
const EXPORT_PAGE_SIZE = 500;
const EXPORT_FONT_NAME = 'Inter';
const EXPORT_FONT_SIZE = 10;
type XlsxModule = typeof XLSXModule;
type XlsxWorkSheet = XLSXModule.WorkSheet;

let xlsxModulePromise: Promise<XlsxModule> | null = null;

type FreezePaneConfig = {
  xSplit: number;
  ySplit: number;
  topLeftCell: string;
  activePane: 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight';
  activeCell?: string;
  sqref?: string;
};

type UseSchoolListExportParams = {
  api: ServiceApi;
  filters: Filters;
  selectedTab: PROGRAM_TAB;
  orderBy: string;
  orderDir: 'asc' | 'desc';
  searchTerm: string;
  selectedDateRange: DateRangeValue;
  total: number;
  isLoading: boolean;
  isSearchPending: boolean;
};

type FetchAllSchoolsForExportParams = Omit<
  UseSchoolListExportParams,
  'total' | 'isLoading' | 'isSearchPending'
>;

const getXlsx = async (): Promise<XlsxModule> => {
  if (!xlsxModulePromise) {
    xlsxModulePromise = import('xlsx-js-style');
  }
  return xlsxModulePromise;
};

const getExportCellText = (cellValue: unknown) => {
  if (isSchoolMetricCell(cellValue)) {
    return cellValue.text.trim().length > 0 ? cellValue.text : '--';
  }

  if (cellValue === null || cellValue === undefined || cellValue === '') {
    return '--';
  }

  return String(cellValue);
};

// Converts row cells into the exact export-friendly value or paired % cell text.
const getExportCellPartText = (
  row: SchoolListRow,
  key: keyof SchoolListRow,
  part: 'value' | 'percent',
) => {
  if (key === 'name' && part === 'value') {
    const schoolName =
      row.name.exportValueText?.trim().length &&
      row.name.exportValueText !== '--'
        ? row.name.exportValueText
        : getExportCellText(row.name);
    const udiseLocation = getExportCellText(row.udiseLocation);
    return udiseLocation === '--'
      ? schoolName
      : `${schoolName}\n${udiseLocation}`;
  }

  const cellValue = row[key];

  if (isSchoolMetricCell(cellValue)) {
    if (part === 'percent') {
      return cellValue.exportPercentText?.trim().length
        ? cellValue.exportPercentText
        : '--';
    }

    return cellValue.exportValueText?.trim().length
      ? cellValue.exportValueText
      : cellValue.text.trim().length > 0
        ? cellValue.text
        : '--';
  }

  if (part === 'percent') return '--';
  return getExportCellText(cellValue);
};

const buildExportSheetRows = (rows: SchoolListRow[]) => {
  const exportColumns = getSchoolListExportColumns();
  return [
    exportColumns.map((column) => column.label),
    ...rows.map((row) =>
      exportColumns.map((column) =>
        getExportCellPartText(row, column.key, column.part),
      ),
    ),
  ];
};

// Adjacent duplicate headers are merged so value and % columns stay grouped.
const buildHeaderMerges = (headers: string[]) => {
  const merges: Array<{
    s: { r: number; c: number };
    e: { r: number; c: number };
  }> = [];

  let startIndex = 0;
  while (startIndex < headers.length) {
    let endIndex = startIndex;
    while (
      endIndex + 1 < headers.length &&
      headers[endIndex + 1] === headers[startIndex]
    ) {
      endIndex += 1;
    }

    if (endIndex > startIndex) {
      merges.push({
        s: { r: 0, c: startIndex },
        e: { r: 0, c: endIndex },
      });
    }

    startIndex = endIndex + 1;
  }

  return merges;
};

// Wrapped first-column rows preserve the stacked school name and location.
const applyWrappedSheetFormatting = (
  xlsx: XlsxModule,
  worksheet: XlsxWorkSheet,
  wrappedColumns: number[],
  rowCount: number,
) => {
  wrappedColumns.forEach((columnIndex) => {
    for (let rowIndex = 1; rowIndex < rowCount; rowIndex += 1) {
      const cellRef = xlsx.utils.encode_cell({
        r: rowIndex,
        c: columnIndex,
      });
      const cell = worksheet[cellRef];
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

  worksheet['!rows'] = Array.from({ length: rowCount }, (_, rowIndex) =>
    rowIndex === 0 ? {} : { hpt: 30 },
  );
};

// Borders and font are applied to every populated cell in the sheet.
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
          name: EXPORT_FONT_NAME,
          sz: EXPORT_FONT_SIZE,
        },
        border: {
          top: { style: 'thin', color: { rgb: EXPORT_BORDER_COLOR } },
          bottom: { style: 'thin', color: { rgb: EXPORT_BORDER_COLOR } },
          left: { style: 'thin', color: { rgb: EXPORT_BORDER_COLOR } },
          right: { style: 'thin', color: { rgb: EXPORT_BORDER_COLOR } },
        },
      };
    }
  }
};

// Header styling matches the worker-generated sheet so both paths stay aligned.
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
        name: EXPORT_FONT_NAME,
        sz: EXPORT_FONT_SIZE,
        bold: true,
        color: { rgb: 'FFFFFF' },
      },
      fill: {
        patternType: 'solid',
        fgColor: { rgb: '1976D2' },
        bgColor: { rgb: '1976D2' },
      },
      alignment: {
        ...(cell.s?.alignment ?? {}),
        vertical: 'center',
      },
    };
  }
};

// Widths are based on headers, with a wider first column for wrapped school labels.
const applyHeaderColumnWidths = (
  worksheet: XlsxWorkSheet,
  sheetRows: string[][],
  headers: string[],
  merges: Array<{
    s: { r: number; c: number };
    e: { r: number; c: number };
  }>,
) => {
  const mergeWidths = new Map<number, number>();

  merges.forEach((merge) => {
    const span = merge.e.c - merge.s.c + 1;
    const headerText = headers[merge.s.c] ?? '';
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

  const firstColumnWidth = sheetRows.reduce((maxWidth, row) => {
    const cellText = String(row[0] ?? '');
    const longestLineLength = cellText
      .split('\n')
      .reduce((maxLineLength, line) => Math.max(maxLineLength, line.length), 0);
    return Math.max(maxWidth, longestLineLength);
  }, headers[0]?.length ?? 0);

  worksheet['!cols'] = headers.map((header, columnIndex) => ({
    wch:
      columnIndex === 0
        ? Math.max(20, firstColumnWidth + 4)
        : (mergeWidths.get(columnIndex) ?? Math.max(12, header.length + 2)),
  }));
};

const applyMergedHeaderFormatting = (
  xlsx: XlsxModule,
  worksheet: XlsxWorkSheet,
  merges: Array<{
    s: { r: number; c: number };
    e: { r: number; c: number };
  }>,
) => {
  merges.forEach((merge) => {
    const cellRef = xlsx.utils.encode_cell(merge.s);
    const cell = worksheet[cellRef];
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
};

// Main-thread fallback still patches freeze panes so Excel opens in the right view.
const applyFreezePanesToWorkbook = async (
  fileBuffer: ArrayBuffer,
  freeze: FreezePaneConfig,
) => {
  const { default: JSZip } = await import('jszip');
  const zip = await JSZip.loadAsync(fileBuffer);
  const worksheetPath = 'xl/worksheets/sheet1.xml';
  const worksheetFile = zip.file(worksheetPath);
  if (!worksheetFile) return fileBuffer;

  const paneXml = `<pane xSplit="${freeze.xSplit}" ySplit="${freeze.ySplit}" topLeftCell="${freeze.topLeftCell}" activePane="${freeze.activePane}" state="frozen"/>`;
  const selectionXml = `<selection pane="${freeze.activePane}" activeCell="${freeze.activeCell ?? freeze.topLeftCell}" sqref="${freeze.sqref ?? freeze.topLeftCell}"/>`;

  const worksheetXml = await worksheetFile.async('string');
  const updatedWorksheetXml = worksheetXml.replace(
    /<sheetViews>([\s\S]*?)<\/sheetViews>/,
    (sheetViewsXml) => {
      if (/<sheetView([^>]*)\/>/.test(sheetViewsXml)) {
        return sheetViewsXml.replace(
          /<sheetView([^>]*)\/>/,
          `<sheetView$1>${paneXml}${selectionXml}</sheetView>`,
        );
      }

      const withoutPane = sheetViewsXml.replace(/<pane[^>]*\/>/, '');
      const withoutSelection = withoutPane.replace(/<selection[^>]*\/>/g, '');
      return withoutSelection.replace(
        /<sheetView([^>]*)>/,
        `<sheetView$1>${paneXml}${selectionXml}`,
      );
    },
  );

  zip.file(worksheetPath, updatedWorksheetXml);
  return zip.generateAsync({ type: 'arraybuffer' });
};

const buildExportWorkbook = async (sheetRows: string[][]) => {
  const headers = sheetRows[0] ?? [];
  const headerMerges = buildHeaderMerges(headers);

  try {
    const builtWorkbook = await runBackgroundWorkerTask('BUILD_XLSX_FILE', {
      sheetNames: [EXPORT_SHEET_NAME],
      sheets: {
        [EXPORT_SHEET_NAME]: sheetRows,
      },
      sheetFormats: {
        [EXPORT_SHEET_NAME]: 'aoa',
      },
      sheetWrapColumns: {
        [EXPORT_SHEET_NAME]: [0],
      },
      sheetFreeze: {
        [EXPORT_SHEET_NAME]: {
          xSplit: 1,
          ySplit: 1,
          topLeftCell: 'B2',
          activePane: 'bottomRight',
        },
      },
      sheetMerges: {
        [EXPORT_SHEET_NAME]: headerMerges,
      },
    });
    return builtWorkbook.fileBuffer;
  } catch (workerError) {
    logger.warn(
      'School metrics export worker failed, falling back to main thread workbook generation.',
      workerError,
    );
    const XLSX = await getXlsx();
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.aoa_to_sheet(sheetRows);
    applyCellBorders(XLSX, worksheet, sheetRows.length, headers.length);
    applyHeaderRowFormatting(XLSX, worksheet, headers.length);
    applyHeaderColumnWidths(worksheet, sheetRows, headers, headerMerges);
    applyWrappedSheetFormatting(XLSX, worksheet, [0], sheetRows.length);
    worksheet['!merges'] = headerMerges;
    applyMergedHeaderFormatting(XLSX, worksheet, headerMerges);
    XLSX.utils.book_append_sheet(workbook, worksheet, EXPORT_SHEET_NAME);
    const output = XLSX.write(workbook, {
      bookType: 'xlsx',
      type: 'array',
    }) as ArrayBuffer;
    return applyFreezePanesToWorkbook(output, {
      xSplit: 1,
      ySplit: 1,
      topLeftCell: 'B2',
      activePane: 'bottomRight',
    });
  }
};

const fetchAllSchoolsForExport = async ({
  api,
  filters,
  selectedTab,
  orderBy,
  orderDir,
  searchTerm,
  selectedDateRange,
}: FetchAllSchoolsForExportParams) => {
  const allSchools: SchoolListSourceRow[] = [];
  let currentPage = 1;
  let exportTotal = 0;

  while (currentPage === 1 || allSchools.length < exportTotal) {
    const response = await fetchSchoolListPage({
      api,
      filters,
      selectedTab,
      page: currentPage,
      pageSize: EXPORT_PAGE_SIZE,
      orderBy,
      orderDir,
      searchTerm,
      selectedDateRange,
    });

    const pageRows = (response?.data || []) as SchoolListSourceRow[];
    exportTotal = response?.total ?? pageRows.length;
    allSchools.push(...pageRows);

    if (
      pageRows.length === 0 ||
      pageRows.length < EXPORT_PAGE_SIZE ||
      allSchools.length >= exportTotal
    ) {
      break;
    }

    currentPage += 1;
  }

  return allSchools;
};

export const useSchoolListExport = ({
  api,
  filters,
  selectedTab,
  orderBy,
  orderDir,
  searchTerm,
  selectedDateRange,
  total,
  isLoading,
  isSearchPending,
}: UseSchoolListExportParams) => {
  const [isExporting, setIsExporting] = useState(false);
  const isExportDisabled =
    isLoading || isSearchPending || isExporting || total === 0;

  // Export always respects the same filters, search, sort, and date range as the UI.
  const handleExportSchools = useCallback(async () => {
    if (isLoading || isSearchPending || isExporting || total === 0) return;

    setIsExporting(true);
    try {
      const exportSchools = await fetchAllSchoolsForExport({
        api,
        filters,
        selectedTab,
        orderBy,
        orderDir,
        searchTerm,
        selectedDateRange,
      });
      const exportSheetRows = buildExportSheetRows(
        mapSchoolRowsToRenderRows(exportSchools),
      );
      const output = await buildExportWorkbook(exportSheetRows);

      const blob = new Blob([output], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });

      await Util.handleBlobDownloadAndSave(blob, EXPORT_FILE_NAME);
    } catch (error) {
      logger.error('Failed to export school listing', error);
    } finally {
      setIsExporting(false);
    }
  }, [
    api,
    filters,
    isExporting,
    isLoading,
    isSearchPending,
    orderBy,
    orderDir,
    searchTerm,
    selectedDateRange,
    selectedTab,
    total,
  ]);

  return {
    isExporting,
    isExportDisabled,
    handleExportSchools,
  };
};
