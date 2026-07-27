import { Table, TableContainer } from '@mui/material';
import React, { forwardRef } from 'react';
import { useHistory } from 'react-router';
import { PAGES } from '../../common/constants';
import logger from '../../utility/logger';
import './DataTableBody.css';
import type { Column, DataTableBodyProps } from './DataTableBody.types';
import { DataTableHeader } from './DataTableHeader';
import { DataTableRows } from './DataTableRows';
import { TableSkeleton } from './DataTableSkeleton';

export type { Column } from './DataTableBody.types';

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
    renderHeaderActions,
    customHeaderIcons = false,
    activeHeaderFilterKey,
    onHeaderFilterClick,
  }: DataTableBodyProps<T>,
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
        <DataTableHeader
          activeHeaderFilterKey={activeHeaderFilterKey}
          allRowsSelected={allRowsSelected}
          columns={columns}
          customHeaderIcons={customHeaderIcons}
          headerAlign={headerAlign}
          headerClampLines={headerClampLines}
          headerNoEllipsis={headerNoEllipsis}
          onHeaderFilterClick={onHeaderFilterClick}
          onSort={onSort}
          onToggleSelectAll={(checked) => onToggleSelectAll?.(checked, rows)}
          order={order}
          orderBy={orderBy}
          renderHeaderActions={renderHeaderActions}
          selectableRows={selectableRows}
          someRowsSelected={someRowsSelected}
        />
        {loading ? (
          <TableSkeleton
            columns={columns}
            rows={10}
            showSelectionColumn={selectableRows}
          />
        ) : (
          <DataTableRows
            columns={columns}
            customHeaderIcons={customHeaderIcons}
            handleRowAction={handleRowAction}
            isRowCurrentlySelected={isRowCurrentlySelected}
            isRowSelectable={isRowSelectable}
            onToggleRowSelection={onToggleRowSelection}
            resolveRowId={resolveRowId}
            rows={rows}
            selectableRows={selectableRows}
          />
        )}
      </Table>
    </TableContainer>
  );
}

const DataTableBody = forwardRef(DataTableBodyInner) as <
  T extends object = Record<string, unknown>,
>(
  props: DataTableBodyProps<T> & React.RefAttributes<HTMLDivElement>,
) => React.ReactElement;

export default DataTableBody;
