import { Util } from '../../../../utility/util';
import type * as XLSXModule from 'xlsx-js-style';
import {
  applyFreezePanesToWorkbook,
  type FreezePaneConfig,
  XLSX_EXPORT_BORDER_COLOR,
  XLSX_EXPORT_FONT_NAME,
  XLSX_EXPORT_FONT_SIZE,
} from '../../../../utility/xlsxExportUtils';
import {
  CAMPAIGN_REWARD_EXPORT_FILE_NAME,
  CAMPAIGN_REWARD_EXPORT_SHEET_NAME,
  type CampaignRewardRow,
} from './campaignRewardTypes';
import { buildCampaignRewardExportRows } from './campaignRewardRows';

type XlsxModule = typeof XLSXModule;
type XlsxWorkSheet = XLSXModule.WorkSheet;

let xlsxModulePromise: Promise<XlsxModule> | null = null;

const getXlsx = async (): Promise<XlsxModule> => {
  if (!xlsxModulePromise) {
    xlsxModulePromise = import('xlsx-js-style');
  }
  return xlsxModulePromise;
};

const applyCampaignRewardExportFormatting = (
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
      const isHeader = rowIndex === 0;
      cell.s = {
        ...cell.s,
        font: {
          ...(cell.s?.font ?? {}),
          name: XLSX_EXPORT_FONT_NAME,
          sz: XLSX_EXPORT_FONT_SIZE,
          bold: isHeader,
          color: isHeader ? { rgb: 'FFFFFF' } : undefined,
        },
        fill: isHeader
          ? {
              patternType: 'solid',
              fgColor: { rgb: '1A71F6' },
              bgColor: { rgb: '1A71F6' },
            }
          : cell.s?.fill,
        border: {
          top: { style: 'thin', color: { rgb: XLSX_EXPORT_BORDER_COLOR } },
          bottom: { style: 'thin', color: { rgb: XLSX_EXPORT_BORDER_COLOR } },
          left: { style: 'thin', color: { rgb: XLSX_EXPORT_BORDER_COLOR } },
          right: { style: 'thin', color: { rgb: XLSX_EXPORT_BORDER_COLOR } },
        },
        alignment: {
          ...(cell.s?.alignment ?? {}),
          vertical: isHeader ? 'center' : 'top',
          wrapText: columnIndex === 0,
        },
      };
    }
  }
};

const applyCampaignRewardExportWidths = (
  worksheet: XlsxWorkSheet,
  sheetRows: unknown[][],
) => {
  worksheet['!cols'] = (sheetRows[0] ?? []).map((_, columnIndex) => {
    const maxLength = sheetRows.reduce((width, row) => {
      const value = String(row[columnIndex] ?? '');
      return Math.max(width, value.length);
    }, 0);
    return { wch: Math.max(columnIndex === 0 ? 24 : 14, maxLength + 2) };
  });
  worksheet['!rows'] = Array.from({ length: sheetRows.length }, (_, index) =>
    index === 0 ? { hpt: 20 } : { hpt: 28 },
  );
};

export const buildCampaignRewardExportWorkbook = async (
  rows: CampaignRewardRow[],
  rewardTypeLabel: string,
) => {
  const XLSX = await getXlsx();
  const sheetRows = buildCampaignRewardExportRows(rows, rewardTypeLabel);
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.aoa_to_sheet(sheetRows);
  const freezeConfig = {
    [CAMPAIGN_REWARD_EXPORT_SHEET_NAME]: {
      xSplit: 1,
      ySplit: 1,
      topLeftCell: 'B2',
      activePane: 'bottomRight',
    } satisfies FreezePaneConfig,
  };

  applyCampaignRewardExportFormatting(
    XLSX,
    worksheet,
    sheetRows.length,
    sheetRows[0]?.length ?? 0,
  );
  applyCampaignRewardExportWidths(worksheet, sheetRows);
  XLSX.utils.book_append_sheet(
    workbook,
    worksheet,
    CAMPAIGN_REWARD_EXPORT_SHEET_NAME,
  );

  const output = XLSX.write(workbook, {
    bookType: 'xlsx',
    type: 'array',
  }) as ArrayBuffer;

  return applyFreezePanesToWorkbook(
    output,
    [CAMPAIGN_REWARD_EXPORT_SHEET_NAME],
    freezeConfig,
  );
};

export const exportCampaignRewardRows = async (
  rows: CampaignRewardRow[],
  rewardTypeLabel: string,
) => {
  const output = await buildCampaignRewardExportWorkbook(rows, rewardTypeLabel);
  const blob = new Blob([output], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  await Util.handleBlobDownloadAndSave(blob, CAMPAIGN_REWARD_EXPORT_FILE_NAME);
};
