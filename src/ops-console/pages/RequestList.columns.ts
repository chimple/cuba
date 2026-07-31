import { t } from 'i18next';
import { REQUEST_TABS } from '../../common/constants';
import type { Column } from '../components/DataTableBody';
import type { RequestRow } from './RequestList.types';

const pendingColumns: Column<RequestRow>[] = [
  { key: 'request_id', label: t('Request ID'), width: '10%', sortable: false },
  {
    key: 'request_type',
    label: t('Request Type'),
    width: '15%',
    sortable: false,
  },
  {
    key: 'school_name',
    label: t('School Name'),
    width: 'fit-content',
    sortable: true,
    orderBy: 'school_name',
  },
  { key: 'class', label: t('Class'), width: 'fit-content', sortable: false },
  { key: 'from', label: t('From'), width: 'fit-content', sortable: false },
  {
    key: 'requested_date',
    label: t('Requested Date'),
    width: 'fit-content',
    sortable: true,
    orderBy: 'requested_date',
  },
  {
    key: 'auto_approves_on',
    label: t('Auto approves on'),
    width: 'fit-content',
    sortable: true,
    orderBy: 'auto_approves_on',
  },
];

const approvedColumns: Column<RequestRow>[] = [
  { key: 'request_id', label: t('Request ID'), width: '10%', sortable: false },
  {
    key: 'request_type',
    label: t('Request Type'),
    width: '15%',
    sortable: false,
  },
  {
    key: 'school_name',
    label: t('School Name'),
    width: '15%',
    sortable: true,
    orderBy: 'school_name',
  },
  { key: 'class', label: t('Class'), width: '10%', sortable: false },
  { key: 'from', label: t('From'), width: '15%', sortable: false },
  {
    key: 'approved_date',
    label: t('Approved Date'),
    width: '15%',
    sortable: true,
    orderBy: 'approved_date',
  },
  {
    key: 'approved_by',
    label: t('Approved By'),
    width: '10%',
    sortable: false,
  },
];

const rejectedColumns: Column<RequestRow>[] = [
  { key: 'request_id', label: t('Request ID'), width: '10%', sortable: false },
  {
    key: 'request_type',
    label: t('Request Type'),
    width: '15%',
    sortable: false,
  },
  {
    key: 'school_name',
    label: t('School Name'),
    width: '15%',
    sortable: true,
    orderBy: 'school_name',
  },
  { key: 'class', label: t('Class'), width: '10%', sortable: false },
  { key: 'from', label: t('From'), width: '10%', sortable: false },
  {
    key: 'rejected_date',
    label: t('Rejected Date'),
    width: '15%',
    sortable: true,
    orderBy: 'rejected_date',
  },
  {
    key: 'rejected_by',
    label: t('Rejected By'),
    width: '20%',
    sortable: false,
  },
];

const flaggedColumns: Column<RequestRow>[] = [
  { key: 'request_id', label: t('Request ID'), width: '10%', sortable: false },
  {
    key: 'request_type',
    label: t('Request Type'),
    width: '15%',
    sortable: false,
  },
  {
    key: 'school_name',
    label: t('School Name'),
    width: '15%',
    sortable: true,
    orderBy: 'school_name',
  },
  { key: 'class', label: t('Class'), width: '10%', sortable: false },
  { key: 'from', label: t('From'), width: '15%', sortable: false },
  {
    key: 'flagged_date',
    label: t('Flagged Date'),
    width: '15%',
    sortable: true,
    orderBy: 'flagged_date',
  },
  { key: 'flagged_by', label: t('Flagged By'), width: '10%', sortable: false },
];

export function getRequestListColumns(selectedTab: REQUEST_TABS) {
  switch (selectedTab) {
    case REQUEST_TABS.APPROVED:
      return approvedColumns;
    case REQUEST_TABS.REJECTED:
      return rejectedColumns;
    case REQUEST_TABS.FLAGGED:
      return flaggedColumns;
    case REQUEST_TABS.PENDING:
    default:
      return pendingColumns;
  }
}
