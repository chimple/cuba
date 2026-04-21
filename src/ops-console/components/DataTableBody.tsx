import React, { forwardRef } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  Checkbox,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  Skeleton,
} from '@mui/material';
import './DataTableBody.css';
import { useHistory } from 'react-router';
import { PAGES } from '../../common/constants';
import logger from '../../utility/logger';

export interface Column<T extends object> {
  key: keyof T | string;
  label: string;
  align?: 'left' | 'right' | 'center' | 'justify' | 'inherit';
  render?: (row: T) => React.ReactNode;
  width?: string | number;
  [key: string]: unknown;
}

const getHeaderLabelSx = (
  headerClampLines: number,
  headerNoEllipsis = false,
) => {
  // SchoolList opts out of truncation so its labels can wrap cleanly.
  if (headerNoEllipsis || headerClampLines <= 0) {
    return {
      display: 'block',
      overflow: 'visible',
      whiteSpace: 'normal',
      lineHeight: 1.15,
      fontWeight: 700,
    } as const;
  }

  return {
    display: '-webkit-box',
    WebkitBoxOrient: 'vertical',
    WebkitLineClamp: headerClampLines,
    overflow: 'hidden',
    whiteSpace: 'normal',
    lineHeight: 1.15,
    fontWeight: 700,
  } as const;
};

interface Props<T extends object> {
  columns: Column<T>[];
  rows: T[];
  orderBy: string | null;
  order: 'asc' | 'desc';
  onSort: (key: string) => void;
  detailPageRouteBase?: string;
  onRowClick?: (id: string | number, row: T) => void;
  loading?: boolean;
  selectableRows?: boolean;
  selectedRowIds?: Array<string | number>;
  onToggleRowSelection?: (id: string | number, row: T) => void;
  onToggleSelectAll?: (checked: boolean, visibleRows: T[]) => void;
  getRowId?: (row: T) => string | number;
  isRowSelectable?: (row: T) => boolean;
  disableRowNavigation?: boolean;
  tableMinWidth?: string | number;
  tableWidth?: string | number;
  headerClampLines?: number;
  headerNoEllipsis?: boolean;
  headerAlign?: 'left' | 'center' | 'right';
}

function TableSkeleton<T extends object>({
  columns,
  rows = 10,
  showSelectionColumn = false,
}: {
  columns: Column<T>[];
  rows?: number;
  showSelectionColumn?: boolean;
}) {
  return (
    <TableBody>
      {Array.from({ length: rows }).map((_, i) => (
        <TableRow key={i}>
          {showSelectionColumn && (
            <TableCell
              id="data-tablebody-skeleton-selection-cell"
              className="data-tablebody-skeleton-selection-cell"
            >
              <Skeleton
                id="data-tablebody-skeleton-selection-icon"
                variant="circular"
                className="data-tablebody-skeleton-selection-icon"
              />
            </TableCell>
          )}
          {columns.map((col) => (
            <TableCell
              key={String(col.key)}
              align="left"
              sx={{
                py: 0.25,
                px: 1,
                height: 32,
                transform: 'none',
              }}
            >
              <div style={{ width: '90%' }}>
                <Skeleton
                  variant="rectangular"
                  height={24}
                  width="100%"
                  sx={{ mx: 0, ml: 0, transform: 'none' }}
                />
              </div>
            </TableCell>
          ))}
        </TableRow>
      ))}
    </TableBody>
  );
}

function DataTableBodyInner<T extends object>(
  {
    columns,
    rows,
    orderBy,
    order,
    onSort,
    detailPageRouteBase,
    onRowClick,
    loading,
    selectableRows = false,
    selectedRowIds = [],
    onToggleRowSelection,
    onToggleSelectAll,
    getRowId,
    isRowSelectable,
    disableRowNavigation = false,
    tableMinWidth,
    tableWidth,
    headerClampLines = 2,
    headerNoEllipsis = false,
    headerAlign = 'left',
  }: Props<T>,
  ref: React.ForwardedRef<HTMLDivElement>,
) {
  const history = useHistory();
  const resolveRowId = (row: T): string | number =>
    getRowId
      ? getRowId(row)
      : (((row as Record<string, unknown>).request_id ??
          (row as Record<string, unknown>).id ??
          (row as Record<string, unknown>).sch_id ??
          '') as string | number);

  const isRowCurrentlySelected = (rowId: string | number): boolean =>
    selectedRowIds.some((id) => String(id) === String(rowId));

  const handleRowClick = (row: T) => {
    if (disableRowNavigation) return;

    if (onRowClick) {
      const recordRow = row as Record<string, unknown>;
      const id = (recordRow.request_id ??
        recordRow.id ??
        recordRow.sch_id ??
        '') as string | number;
      onRowClick(id, row);
      return;
    }

    const recordRow = row as Record<string, unknown>;
    const id = (recordRow.id ?? recordRow.sch_id) as
      | string
      | number
      | undefined;
    if (!id) {
      logger.warn("Row missing 'id' property");
      return;
    }

    if (detailPageRouteBase === 'programs') {
      const recordRow = row as Record<string, unknown>;
      history.push(
        `${PAGES.SIDEBAR_PAGE}${PAGES.PROGRAM_PAGE}${PAGES.PROGRAM_DETAIL_PAGE}/${String(
          recordRow.id,
        )}`,
      );
    } else if (detailPageRouteBase === 'users') {
      history.push({
        pathname: `${PAGES.SIDEBAR_PAGE}${PAGES.USERS}${PAGES.USER_DETAILS}`,
        state: { userData: row },
      });
    } else {
      history.push(
        `${PAGES.SIDEBAR_PAGE}${PAGES.SCHOOL_LIST}${PAGES.SCHOOL_DETAILS}/${String(
          (recordRow.sch_id ?? id) as string | number,
        )}`,
      );
    }
  };

  const handleRowAction = (row: T) => {
    if (selectableRows) {
      const rowId = resolveRowId(row);
      const canSelect = isRowSelectable ? isRowSelectable(row) : true;
      if (!canSelect) return;
      onToggleRowSelection?.(rowId, row);
      return;
    }

    handleRowClick(row);
  };

  const selectableRowIds = rows
    .filter((row) => (isRowSelectable ? isRowSelectable(row) : true))
    .map((row) => resolveRowId(row));

  const allRowsSelected =
    selectableRowIds.length > 0 &&
    selectableRowIds.every((id) => isRowCurrentlySelected(id));

  const someRowsSelected =
    selectableRowIds.some((id) => isRowCurrentlySelected(id)) &&
    !allRowsSelected;

  return (
    // This shared body stays generic; SchoolList only opts into the wider scroll props.
    <TableContainer ref={ref} className="data-tablebody-container">
      <Table
        size="small"
        stickyHeader
        sx={
          tableMinWidth || tableWidth
            ? { minWidth: tableMinWidth, width: tableWidth }
            : undefined
        }
      >
        <TableHead>
          <TableRow>
            {selectableRows && (
              <TableCell
                id="data-tablebody-select-all-head-cell"
                className="data-tablebody-head-cell data-tablebody-select-all-head-cell"
              >
                <Checkbox
                  size="small"
                  indeterminate={someRowsSelected}
                  checked={allRowsSelected}
                  onChange={(event) =>
                    onToggleSelectAll?.(event.target.checked, rows)
                  }
                  inputProps={{ 'aria-label': 'Select all rows' }}
                />
              </TableCell>
            )}
            {columns.map((col) => (
              <TableCell
                key={String(col.key)}
                align={col.align || 'left'}
                className="data-tablebody-head-cell"
                sx={{
                  width: col.width ?? 'auto',
                  textAlign: headerAlign,
                  transform: 'none',
                  height: 'auto',
                  paddingTop: {
                    xs: '4px !important',
                    sm: '6px !important',
                    md: '8px !important',
                  },
                  paddingBottom: {
                    xs: '4px !important',
                    sm: '6px !important',
                    md: '8px !important',
                  },
                  fontWeight: 700,
                }}
              >
                {/* Sortable and non-sortable headers share the same wrapping rules. */}
                {col.sortable === false ? (
                  <span
                    className="data-tablebody-head-label"
                    style={getHeaderLabelSx(headerClampLines, headerNoEllipsis)}
                  >
                    {col.label}
                  </span>
                ) : (
                  <TableSortLabel
                    active={orderBy === String(col.key)}
                    direction={orderBy === String(col.key) ? order : 'asc'}
                    onClick={() => onSort(String(col.key))}
                    sx={{
                      fontWeight: 700,
                      width: '100%',
                      justifyContent:
                        headerAlign === 'center'
                          ? 'center'
                          : headerAlign === 'right'
                            ? 'flex-end'
                            : 'flex-start',
                      '& .MuiTableSortLabel-label': getHeaderLabelSx(
                        headerClampLines,
                        headerNoEllipsis,
                      ),
                      '& .MuiTableSortLabel-icon': {
                        opacity: 1,
                      },
                    }}
                  >
                    {col.label}
                  </TableSortLabel>
                )}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        {/* Show skeleton or actual rows */}
        {loading ? (
          <TableSkeleton
            columns={columns}
            rows={10}
            showSelectionColumn={selectableRows}
          />
        ) : (
          <TableBody>
            {rows.map((row, idx) => {
              const rowId = resolveRowId(row);
              const canSelect = isRowSelectable ? isRowSelectable(row) : true;
              const selected = selectableRows
                ? isRowCurrentlySelected(rowId)
                : false;

              return (
                <TableRow
                  id="data-tablebody-row"
                  key={idx}
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
                      className="data-tablebody-cell"
                      sx={{
                        width: col.width ?? 'auto',
                        maxWidth: col.width,
                      }}
                    >
                      {(() => {
                        const cellValue = (row as Record<string, unknown>)[
                          col.key as string
                        ];
                        if (col.render) return col.render(row);
                        if (
                          typeof cellValue === 'object' &&
                          cellValue !== null &&
                          'render' in cellValue &&
                          typeof (cellValue as { render?: unknown }).render !==
                            'undefined'
                        ) {
                          return (cellValue as { render: React.ReactNode })
                            .render;
                        }
                        return cellValue as React.ReactNode;
                      })()}
                    </TableCell>
                  ))}
                </TableRow>
              );
            })}
          </TableBody>
        )}
      </Table>
    </TableContainer>
  );
}

const DataTableBody = forwardRef(DataTableBodyInner) as <
  T extends object = Record<string, unknown>,
>(
  props: Props<T> & React.RefAttributes<HTMLDivElement>,
) => React.ReactElement;

export default DataTableBody;
