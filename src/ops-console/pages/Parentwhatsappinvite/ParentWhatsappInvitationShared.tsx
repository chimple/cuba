import { Typography } from '@mui/material';
import { t } from 'i18next';
import React from 'react';
import DataTableBody from '../../components/DataTableBody';
import {
  formatCellValue,
  formatHeaderLabel,
} from './ParentWhatsappInvitationPageLogic';

export type ParentWhatsappTableColumn = {
  key: string;
  label: string;
};

export const FieldBlock: React.FC<{
  label: string;
  children: React.ReactNode;
}> = ({ label, children }) => (
  <div
    id="parent-whatsapp-page-field-block"
    className="parent-whatsapp-page-field-block"
  >
    <label
      id="parent-whatsapp-page-field-label"
      className="parent-whatsapp-page-field-label"
    >
      {label}
    </label>
    {children}
  </div>
);

export const InlineToggle: React.FC<{
  checked: boolean;
  onChange: (nextValue: boolean) => void;
  icon: React.ReactNode;
  label: string;
}> = ({ checked, onChange, icon, label }) => {
  const toggleControlClassName = `parent-whatsapp-page-toggle-control${checked ? ' parent-whatsapp-page-toggle-control--checked' : ''}`;

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      id="parent-whatsapp-page-toggle-item"
      className="parent-whatsapp-page-toggle-item"
      onClick={() => onChange(!checked)}
    >
      <span
        aria-hidden="true"
        id={toggleControlClassName}
        className={toggleControlClassName}
      >
        <span
          id="parent-whatsapp-page-toggle-thumb"
          className="parent-whatsapp-page-toggle-thumb"
        />
      </span>
      <span
        id="parent-whatsapp-page-switch-label"
        className="parent-whatsapp-page-switch-label"
      >
        {icon}
        {label}
      </span>
    </button>
  );
};

export const DataFrameCard: React.FC<{
  title?: React.ReactNode;
  rows: Record<string, unknown>[];
  columns?: ParentWhatsappTableColumn[];
  showWhenEmpty?: boolean;
}> = ({ title, rows, columns, showWhenEmpty = false }) => {
  const handleNoopSort = (_key: string): void => undefined;
  const derivedColumns =
    columns && columns.length > 0
      ? columns
      : Array.from(new Set(rows.flatMap((row) => Object.keys(row)))).map(
          (key) => ({
            key,
            label: key,
          }),
        );

  if (rows.length === 0 && !showWhenEmpty) return null;

  const tableColumns = derivedColumns.map((column) => ({
    key: column.key,
    label: formatHeaderLabel(column.label),
    sortable: false,
    render: (row: Record<string, unknown>) => formatCellValue(row[column.key]),
  }));

  return (
    <section
      id="parent-whatsapp-page-dataframe"
      className="parent-whatsapp-page-dataframe"
    >
      {title ? (
        <Typography
          id="parent-whatsapp-page-dataframe-title"
          className="parent-whatsapp-page-dataframe-title"
        >
          {title}
        </Typography>
      ) : null}
      <div
        id="parent-whatsapp-page-table-wrap"
        className="parent-whatsapp-page-table-wrap"
      >
        {rows.length > 0 ? (
          <DataTableBody
            columns={tableColumns}
            rows={rows}
            orderBy={null}
            order="asc"
            onSort={handleNoopSort}
            disableRowNavigation
          />
        ) : (
          <div
            id="parent-whatsapp-page-table-empty"
            className="parent-whatsapp-page-table-empty"
          >
            {t('No rows found.')}
          </div>
        )}
      </div>
    </section>
  );
};
