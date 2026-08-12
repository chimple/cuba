import { t } from 'i18next';
import { REQUEST_TABS } from '../../common/constants';
import { RoleType } from '../../interface/modelInterfaces';
import type {
  RequestListFilterOptions,
  RequestListFilters,
} from './RequestList.types';

export const filterConfigsForRequests = [
  { key: 'school', label: t('Select School') },
  { key: 'request_type', label: t('Request Type') },
];

export const INITIAL_FILTERS: RequestListFilters = {
  request_type: [],
  school: [],
};

export const INITIAL_FILTER_OPTIONS: RequestListFilterOptions = {
  request_type: [],
  school: [],
};

export const getRequestTabOptions = (userRoles: string[]) => {
  const canSeeFlaggedTab =
    userRoles.includes(RoleType.SUPER_ADMIN) ||
    userRoles.includes(RoleType.OPERATIONAL_DIRECTOR);

  const allTabs = Object.entries(REQUEST_TABS).map(([key, val]) => ({
    label: val,
    value: val,
  }));

  if (!canSeeFlaggedTab) {
    return allTabs.filter((tab) => tab.value !== REQUEST_TABS.FLAGGED);
  }

  return allTabs;
};
