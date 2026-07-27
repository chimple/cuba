import React from 'react';
import {
  Box,
  Checkbox,
  TableCell,
  TableHead,
  TableRow,
  TableSortLabel,
} from '@mui/material';
import type { Column } from './DataTableBody.types';

const getHeaderLabelSx = (
  headerClampLines: number,
  headerNoEllipsis = false,
) => {
  if (headerNoEllipsis || headerClampLines <= 0) {
    return {
      display: 'block',
      overflow: 'visible',
      whiteSpace: 'pre-line',
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

type DataTableHeaderProps<T extends object> = {
  activeHeaderFilterKey?: string | null;
  allRowsSelected: boolean;
  columns: Column<T>[];
  customHeaderIcons: boolean;
  headerAlign: 'left' | 'center' | 'right';
  headerClampLines: number;
  headerNoEllipsis: boolean;
  onHeaderFilterClick?: (anchorEl: HTMLElement, key: string) => void;
  onSort: (key: string) => void;
  onToggleSelectAll?: (checked: boolean) => void;
  order: 'asc' | 'desc';
  orderBy: string | null;
  renderHeaderActions?: (column: Column<T>) => React.ReactNode;
  selectableRows: boolean;
  someRowsSelected: boolean;
};

const getJustifyContent = (align: 'left' | 'center' | 'right') =>
  align === 'center' ? 'center' : align === 'right' ? 'flex-end' : 'flex-start';

export const DataTableHeader = <T extends object>({
  activeHeaderFilterKey,
  allRowsSelected,
  columns,
  customHeaderIcons,
  headerAlign,
  headerClampLines,
  headerNoEllipsis,
  onHeaderFilterClick,
  onSort,
  onToggleSelectAll,
  order,
  orderBy,
  renderHeaderActions,
  selectableRows,
  someRowsSelected,
}: DataTableHeaderProps<T>) => (
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
            onChange={(event) => onToggleSelectAll?.(event.target.checked)}
            inputProps={{ 'aria-label': 'Select all rows' }}
          />
        </TableCell>
      )}
      {columns.map((col) => {
        const resolvedHeaderAlign = col.headerAlign ?? headerAlign;
        const headerActions = renderHeaderActions?.(col);
        const columnKey = String(col.key);
        const isSortedColumn = orderBy === columnKey;
        const labelSx = getHeaderLabelSx(headerClampLines, headerNoEllipsis);
        const sortIcon = (
          <span
            aria-hidden="true"
            className={`data-tablebody-head-icon data-tablebody-head-icon-sort ${
              isSortedColumn ? 'data-tablebody-head-icon-active' : ''
            } ${
              isSortedColumn && order === 'desc'
                ? 'data-tablebody-head-icon-desc'
                : ''
            }`}
          >
            <img
              alt=""
              aria-hidden="true"
              className="data-tablebody-head-sort-image"
              src={
                isSortedColumn
                  ? '/assets/icons/Sorted.svg'
                  : '/assets/icons/Sort.svg'
              }
            />
          </span>
        );
        const customHeaderContent = (
          <div
            className={`data-tablebody-head-button data-tablebody-head-button-${resolvedHeaderAlign}`}
          >
            <span className="data-tablebody-head-label" style={labelSx}>
              {col.label}
            </span>
            {col.sortable !== false &&
              (col.headerIcon ?? 'sort') !== 'none' && (
                <button
                  type="button"
                  className="data-tablebody-head-sort-icon-trigger"
                  aria-label={`Sort ${col.label}`}
                  onClick={(event) => {
                    event.stopPropagation();
                    onSort(columnKey);
                  }}
                >
                  {col.headerIcon === 'filter' ? sortIcon : sortIcon}
                </button>
              )}
            {customHeaderIcons && col.headerIcon === 'filter' && (
              <button
                type="button"
                className={`data-tablebody-head-filter-trigger ${
                  activeHeaderFilterKey === columnKey
                    ? 'data-tablebody-head-filter-trigger-active'
                    : ''
                }`}
                aria-label={`Filter ${col.label}`}
                onClick={(event) => {
                  event.stopPropagation();
                  const headerCell = event.currentTarget.closest('th');
                  onHeaderFilterClick?.(
                    headerCell ?? event.currentTarget,
                    columnKey,
                  );
                }}
              >
                <img
                  alt=""
                  aria-hidden="true"
                  className="data-tablebody-head-icon data-tablebody-head-icon-filter"
                  src={
                    activeHeaderFilterKey === columnKey
                      ? '/assets/icons/tableFilterIconActive.svg'
                      : '/assets/icons/tableFilterIcon.svg'
                  }
                />
              </button>
            )}
          </div>
        );
        const headerContent =
          col.sortable === false ? (
            <span className="data-tablebody-head-label" style={labelSx}>
              {col.label}
            </span>
          ) : customHeaderIcons ? (
            customHeaderContent
          ) : (
            <TableSortLabel
              active={isSortedColumn}
              direction={isSortedColumn ? order : 'asc'}
              onClick={() => onSort(columnKey)}
              sx={{
                color: '#121619 !important',
                fontWeight: 700,
                maxWidth: '100%',
                justifyContent: getJustifyContent(resolvedHeaderAlign),
                '&:hover': { color: '#121619 !important' },
                '& .MuiTableSortLabel-label': labelSx,
                '& .MuiTableSortLabel-label, & .MuiTableSortLabel-icon': {
                  color: '#121619 !important',
                },
                '& .MuiTableSortLabel-icon': { display: 'none' },
              }}
            >
              {col.label}
              <Box
                component="img"
                src={
                  isSortedColumn
                    ? 'assets/icons/Sorted.svg'
                    : 'assets/icons/Sort.svg'
                }
                alt=""
                aria-hidden="true"
                sx={{
                  width: isSortedColumn ? 7 : 4,
                  height: isSortedColumn ? 7 : 10,
                  objectFit: 'contain',
                  marginLeft: '6px',
                  transform:
                    isSortedColumn && order === 'desc'
                      ? 'rotate(180deg)'
                      : 'none',
                  transition: 'transform 0.2s ease',
                }}
              />
            </TableSortLabel>
          );
        return (
          <TableCell
            key={columnKey}
            align={col.align || 'left'}
            className={`data-tablebody-head-cell data-tablebody-column-${columnKey}`}
            sx={{
              width: col.width ?? 'auto',
              textAlign: resolvedHeaderAlign,
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
            <Box
              display="flex"
              alignItems="center"
              justifyContent={getJustifyContent(resolvedHeaderAlign)}
              gap={0.25}
              width="100%"
              minHeight={32}
            >
              <Box
                minWidth={0}
                display="flex"
                alignItems="center"
                justifyContent="inherit"
                flex={headerActions ? '1 1 auto' : '0 1 auto'}
              >
                {headerContent}
              </Box>
              {headerActions ? (
                <Box display="flex" alignItems="center" flexShrink={0}>
                  {headerActions}
                </Box>
              ) : null}
            </Box>
          </TableCell>
        );
      })}
    </TableRow>
  </TableHead>
);
