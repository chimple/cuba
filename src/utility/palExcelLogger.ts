import { Directory, Filesystem } from '@capacitor/filesystem';
import * as XLSX from 'xlsx';
import logger from './logger';

const UPDATE_ABILITIES_LOG_FILE_NAME = 'pal_update_abilities_logs.xlsx';
const UPDATE_ABILITIES_SHEET_NAME = 'updateAbilities()';
const RECOMMENDATION_LOG_FILE_NAME = 'pal_recommendation_logs.xlsx';
const RECOMMENDATION_SHEET_NAME = 'recommendNextSkill()';
const EXCEL_CELL_CHAR_LIMIT = 32000;
const UPDATE_ABILITIES_COLUMN_ORDER = [
  'timestamp',
  'studentId',
  'courseId',
  'skillId',
  'graph',
  'abilityState',
  'outcomeEvents',
  'updatedAbilities',
] as const;
const RECOMMENDATION_COLUMN_ORDER = [
  'timestamp',
  'studentId',
  'courseId',
  'graph',
  'abilityState',
  'recommendation',
] as const;

export interface PalLogData {
  studentId: string;
  courseId: string;
  skillId: string;
  graph: any;
  abilityState: any;
  outcomeEvents: any;
  updated: any;
}

export interface PalRecommendationLogData {
  studentId: string;
  courseId: string;
  graph: any;
  abilityState: any;
  recommendation: any;
}

export class palExcelLogger {
  public static async logPalDataToExcel(data: PalLogData): Promise<void> {
    try {
      const rowData = this.buildRowData(data);
      await this.writeRowToWorkbook({
        fileName: UPDATE_ABILITIES_LOG_FILE_NAME,
        sheetName: UPDATE_ABILITIES_SHEET_NAME,
        rowData,
        columnOrder: UPDATE_ABILITIES_COLUMN_ORDER,
      });

      logger.info('Successfully logged PAL updateAbilities data to Excel.');
    } catch (error) {
      logger.error('Failed to log PAL data to Excel:', error);
    }
  }

  public static async logRecommendationDataToExcel(
    data: PalRecommendationLogData,
  ): Promise<void> {
    try {
      const rowData = this.buildRecommendationRowData(data);
      await this.writeRowToWorkbook({
        fileName: RECOMMENDATION_LOG_FILE_NAME,
        sheetName: RECOMMENDATION_SHEET_NAME,
        rowData,
        columnOrder: RECOMMENDATION_COLUMN_ORDER,
      });

      logger.info('Successfully logged PAL recommendation data to Excel.');
    } catch (error) {
      logger.error('Failed to log PAL recommendation data to Excel:', error);
    }
  }

  public static async downloadLogsToPC(): Promise<void> {
    try {
      logger.info('Reading PAL Logs from storage to download...');
      const fileResult = await Filesystem.readFile({
        path: UPDATE_ABILITIES_LOG_FILE_NAME,
        directory: Directory.Documents,
      });
      const existingBase64 = fileResult.data as string;
      const workbook = XLSX.read(existingBase64, { type: 'base64' });
      XLSX.writeFile(workbook, UPDATE_ABILITIES_LOG_FILE_NAME);
      logger.info('Downloading PAL Logs manually to your PC...');
    } catch (error) {
      logger.error(
        'No logs found! You need to play a game first to generate data.',
        error,
      );
    }
  }

  private static buildRowData(data: PalLogData): Record<string, string> {
    return {
      timestamp: new Date().toISOString(),
      studentId: data.studentId ?? '',
      courseId: data.courseId ?? '',
      skillId: data.skillId ?? '',
      ...this.serializeIntoColumns('graph', data.graph),
      ...this.serializeIntoColumns('abilityState', data.abilityState),
      ...this.serializeIntoColumns('outcomeEvents', data.outcomeEvents),
      ...this.serializeIntoColumns('updatedAbilities', data.updated),
    };
  }

  private static buildRecommendationRowData(
    data: PalRecommendationLogData,
  ): Record<string, string> {
    return {
      timestamp: new Date().toISOString(),
      studentId: data.studentId ?? '',
      courseId: data.courseId ?? '',
      ...this.serializeIntoColumns('graph', data.graph),
      ...this.serializeIntoColumns('abilityState', data.abilityState),
      ...this.serializeIntoColumns('recommendation', data.recommendation),
    };
  }

  private static async writeRowToWorkbook(params: {
    fileName: string;
    sheetName: string;
    rowData: Record<string, string>;
    columnOrder: readonly string[];
  }): Promise<void> {
    let workbook: XLSX.WorkBook;
    let existingBase64 = '';

    try {
      const fileResult = await Filesystem.readFile({
        path: params.fileName,
        directory: Directory.Documents,
      });
      existingBase64 = fileResult.data as string;
    } catch (_error) {
      // File does not exist yet.
    }

    if (existingBase64) {
      workbook = XLSX.read(existingBase64, { type: 'base64' });
    } else {
      workbook = XLSX.utils.book_new();
    }

    this.appendSingleRow(
      workbook,
      params.sheetName,
      params.rowData,
      params.columnOrder,
    );

    const newBase64 = XLSX.write(workbook, {
      bookType: 'xlsx',
      type: 'base64',
    });

    await Filesystem.writeFile({
      path: params.fileName,
      data: newBase64,
      directory: Directory.Documents,
    });
  }

  private static serializeIntoColumns(
    columnName: string,
    value: unknown,
  ): Record<string, string> {
    const serialized = this.serializeValue(value);
    const chunks = this.splitIntoCellSizedChunks(serialized);

    return chunks.reduce(
      (accumulator, chunk, index) => {
        const key = index === 0 ? columnName : `${columnName}_${index + 1}`;
        accumulator[key] = chunk;
        return accumulator;
      },
      {} as Record<string, string>,
    );
  }

  private static serializeValue(value: unknown): string {
    if (value === null || value === undefined) return '';
    if (typeof value === 'string') return value;

    try {
      return JSON.stringify(value);
    } catch (_error) {
      return String(value);
    }
  }

  private static splitIntoCellSizedChunks(value: string): string[] {
    if (!value) return [''];

    const chunks: string[] = [];
    for (let index = 0; index < value.length; index += EXCEL_CELL_CHAR_LIMIT) {
      chunks.push(value.slice(index, index + EXCEL_CELL_CHAR_LIMIT));
    }
    return chunks;
  }

  private static appendSingleRow(
    workbook: XLSX.WorkBook,
    sheetName: string,
    rowData: Record<string, string>,
    columnOrder: readonly string[],
  ): void {
    const worksheet = workbook.Sheets[sheetName];
    const nextHeaders = this.getHeaderOrder(rowData, columnOrder);

    if (!worksheet) {
      const newSheet = XLSX.utils.json_to_sheet([rowData], {
        header: nextHeaders,
      });
      XLSX.utils.book_append_sheet(workbook, newSheet, sheetName);
      return;
    }

    const rows = XLSX.utils.sheet_to_json<(string | number)[]>(worksheet, {
      header: 1,
      defval: '',
    });

    const existingHeaders = (rows[0] ?? []).map((header) => String(header));
    const mergedHeaders = this.mergeHeaders(
      existingHeaders,
      nextHeaders,
      columnOrder,
    );
    const existingDataRows = rows.length > 0 ? rows.slice(1) : [];
    const appendedRow = mergedHeaders.map((header) => rowData[header] ?? '');

    const output = [
      mergedHeaders,
      ...existingDataRows.map((row) =>
        mergedHeaders.map((_, index) => String(row[index] ?? '')),
      ),
      appendedRow,
    ];

    workbook.Sheets[sheetName] = XLSX.utils.aoa_to_sheet(output);
  }

  private static mergeHeaders(
    existingHeaders: string[],
    nextHeaders: string[],
    columnOrder: readonly string[],
  ): string[] {
    const mergedHeaders = new Set([...existingHeaders, ...nextHeaders]);
    return Array.from(mergedHeaders).sort((left, right) =>
      this.compareByColumnOrder(left, right, columnOrder),
    );
  }

  private static getHeaderOrder(
    rowData: Record<string, string>,
    columnOrder: readonly string[],
  ): string[] {
    const orderedHeaders: string[] = [];

    columnOrder.forEach((baseHeader) => {
      Object.keys(rowData)
        .filter(
          (header) =>
            header === baseHeader || header.startsWith(`${baseHeader}_`),
        )
        .sort((left, right) => this.compareSplitHeaders(left, right))
        .forEach((header) => orderedHeaders.push(header));
    });

    Object.keys(rowData).forEach((header) => {
      if (!orderedHeaders.includes(header)) {
        orderedHeaders.push(header);
      }
    });

    return orderedHeaders;
  }

  private static compareSplitHeaders(a: string, b: string): number {
    return this.getHeaderChunkIndex(a) - this.getHeaderChunkIndex(b);
  }

  private static compareByColumnOrder(
    a: string,
    b: string,
    columnOrder: readonly string[],
  ): number {
    const leftBaseIndex = this.getBaseColumnIndex(a, columnOrder);
    const rightBaseIndex = this.getBaseColumnIndex(b, columnOrder);

    if (leftBaseIndex !== rightBaseIndex) {
      return leftBaseIndex - rightBaseIndex;
    }

    return this.compareSplitHeaders(a, b);
  }

  private static getBaseColumnIndex(
    header: string,
    columnOrder: readonly string[],
  ): number {
    const baseHeader = header.replace(/_\d+$/, '');
    const index = columnOrder.indexOf(baseHeader);

    return index === -1 ? columnOrder.length : index;
  }

  private static getHeaderChunkIndex(header: string): number {
    const parts = header.split('_');
    const suffix = parts[parts.length - 1];
    const parsed = Number(suffix);
    return Number.isFinite(parsed) ? parsed : 1;
  }
}

if (typeof window !== 'undefined') {
  (window as any).downloadPalLogs = () => {
    palExcelLogger.downloadLogsToPC();
  };
}
