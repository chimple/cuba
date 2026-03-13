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

export interface Column<T> {
  key: keyof T;
  label: string;
  align?: 'left' | 'right' | 'center' | 'justify' | 'inherit';
  render?: (row: T) => React.ReactNode;
  width?: string | number;
  [key: string]: any;
}

interface Props {
  columns: Record<string, any>[];
  rows: Record<string, any>[];
  orderBy: string | null;
  order: 'asc' | 'desc';
  onSort: (key: string) => void;
  detailPageRouteBase?: string;
  onRowClick?: (id: string | number, row: any) => void;
  loading?: boolean;
  selectableRows?: boolean;
  selectedRowIds?: Array<string | number>;
  onToggleRowSelection?: (id: string | number, row: any) => void;
  onToggleSelectAll?: (checked: boolean, visibleRows: any[]) => void;
  getRowId?: (row: any) => string | number;
  isRowSelectable?: (row: any) => boolean;
  disableRowNavigation?: boolean;
}

function TableSkeleton({
  columns,
  rows = 10,
  showSelectionColumn = false,
}: {
  columns: Record<string, any>[];
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
              key={col.key}
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

const DataTableBody = forwardRef<HTMLDivElement, Props>(
  (
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
    },
    ref,
  ) => {
    const history = useHistory();
    const resolveRowId = (row: any): string | number =>
      getRowId ? getRowId(row) : row.request_id || row.id;

    const isRowCurrentlySelected = (rowId: string | number): boolean =>
      selectedRowIds.some((id) => String(id) === String(rowId));

    const handleRowClick = (row: any) => {
      if (disableRowNavigation) return;

      if (onRowClick) {
        const id = row.request_id || row.id;
        onRowClick(id, row);
        return;
      }

      const id = row.id;
      if (!id) {
        console.warn("Row missing 'id' property");
        return;
      }

      if (detailPageRouteBase === 'programs') {
        history.push(
          `${PAGES.SIDEBAR_PAGE}${PAGES.PROGRAM_PAGE}${PAGES.PROGRAM_DETAIL_PAGE}/${row['id']}`,
        );
      } else if (detailPageRouteBase === 'users') {
        history.push({
          pathname: `${PAGES.SIDEBAR_PAGE}${PAGES.USERS}${PAGES.USER_DETAILS}`,
          state: { userData: row },
        });
      } else {
        history.push(
          `${PAGES.SIDEBAR_PAGE}${PAGES.SCHOOL_LIST}${PAGES.SCHOOL_DETAILS}/${row['sch_id']}`,
        );
      }
    };

    const handleRowAction = (row: any) => {
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
      <TableContainer ref={ref} className="data-tablebody-container">
        <Table size="small" stickyHeader>
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
                  }}
                >
                  {col.sortable === false ? (
                    col.label
                  ) : (
                    <TableSortLabel
                      active={orderBy === String(col.key)}
                      direction={orderBy === String(col.key) ? order : 'asc'}
                      onClick={() => onSort(String(col.key))}
                      sx={{
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
                        {col.render
                          ? col.render(row)
                          : typeof row[col.key] === 'object' &&
                              row[col.key]?.render !== undefined
                            ? row[col.key].render
                            : row[col.key]}
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
  },
);

export default DataTableBody;
