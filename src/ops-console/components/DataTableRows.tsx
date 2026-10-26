import React from 'react';
import { Checkbox, TableBody, TableCell, TableRow } from '@mui/material';
import type { Column } from './DataTableBody.types';

type DataTableRowsProps<T extends object> = {
  columns: Column<T>[];
  customHeaderIcons: boolean;
  handleRowAction: (row: T) => void;
  isRowCurrentlySelected: (rowId: string | number) => boolean;
  isRowSelectable?: (row: T) => boolean;
  onToggleRowSelection?: (id: string | number, row: T) => void;
  resolveRowId: (row: T) => string | number;
  rows: T[];
  selectableRows: boolean;
};

const renderCellValue = <T extends object>(row: T, col: Column<T>) => {
  const cellValue = (row as Record<string, unknown>)[col.key as string];
  if (col.render) return col.render(row);
  if (
    typeof cellValue === 'object' &&
    cellValue !== null &&
    'render' in cellValue &&
    typeof (cellValue as { render?: unknown }).render !== 'undefined'
  ) {
    return (cellValue as { render: React.ReactNode }).render;
  }
  return cellValue as React.ReactNode;
};

export const DataTableRows = <T extends object>({
  columns,
  customHeaderIcons,
  handleRowAction,
  isRowCurrentlySelected,
  isRowSelectable,
  onToggleRowSelection,
  resolveRowId,
  rows,
  selectableRows,
}: DataTableRowsProps<T>) => (
  <TableBody>
    {rows.map((row) => {
      const rowId = resolveRowId(row);
      const canSelect = isRowSelectable ? isRowSelectable(row) : true;
      const selected = selectableRows ? isRowCurrentlySelected(rowId) : false;

      return (
        <TableRow
          id="data-tablebody-row"
          key={String(rowId)}
          hover
          onClick={() => {
            handleRowAction(row);
          }}
          className={`data-tablebody-row ${
            selectableRows && !canSelect
              ? 'data-tablebody-row-disabled'
              : 'data-tablebody-row-clickable'
          }`}
          selected={selected}
        >
          {selectableRows && (
            <TableCell
              id="data-tablebody-selection-cell"
              className="data-tablebody-cell data-tablebody-selection-cell"
              onClick={(event) => event.stopPropagation()}
            >
              <Checkbox
                size="small"
                checked={selected}
                disabled={!canSelect}
                onChange={() => onToggleRowSelection?.(rowId, row)}
                inputProps={{ 'aria-label': 'Select row' }}
              />
            </TableCell>
          )}

          {columns.map((col) => (
            <TableCell
              id="data-tablebody-content-cell"
              key={String(col.key)}
              align={col.align || 'left'}
              className={`data-tablebody-cell data-tablebody-column-${String(
                col.key,
              )}`}
              sx={{
                width: col.width ?? 'auto',
                maxWidth: customHeaderIcons ? 'none' : col.width,
                textAlign: col.align || 'left',
              }}
            >
              {renderCellValue(row, col)}
            </TableCell>
          ))}
        </TableRow>
      );
    })}
  </TableBody>
);
