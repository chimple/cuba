import React from 'react';

export interface Column<T extends object> {
  key: keyof T | string;
  label: React.ReactNode;
  align?: 'left' | 'right' | 'center' | 'justify' | 'inherit';
  headerAlign?: 'left' | 'center' | 'right';
  headerIcon?: 'sort' | 'filter' | 'none';
  render?: (row: T) => React.ReactNode;
  width?: string | number;
  [key: string]: unknown;
}

export interface DataTableBodyProps<T extends object> {
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
  renderHeaderActions?: (column: Column<T>) => React.ReactNode;
  customHeaderIcons?: boolean;
  activeHeaderFilterKey?: string | null;
  onHeaderFilterClick?: (anchorEl: HTMLElement, key: string) => void;
}
