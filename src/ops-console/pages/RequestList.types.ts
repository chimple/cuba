import type { TableTypes } from '../../common/constants';

export type RequestListFilters = Record<string, string[]>;

export type RequestListFilterOptions = {
  request_type: string[];
  school: Array<{ id: string; name: string }>;
};

type OpsRequestUserRef = {
  id?: string;
  name?: string;
};

type OpsRequestSchoolRef = {
  id?: string;
  name?: string;
};

type OpsRequestClassRef = {
  id?: string;
  name?: string;
};

export type OpsRequestItem = TableTypes<'ops_requests'> & {
  request_id?: string;
  school?: OpsRequestSchoolRef | null;
  classInfo?: OpsRequestClassRef | null;
  requestedBy?: OpsRequestUserRef | null;
  respondedBy?: OpsRequestUserRef | null;
  requested_by?: string | null;
  responded_by?: string | null;
};

export type RequestRow = {
  request_id: string;
  request_type: string;
  school_name: string;
  class: string;
  from: string;
  requested_date?: string;
  approved_date?: string;
  approved_by?: string;
  rejected_date?: string;
  rejected_reason?: string;
  rejected_by?: string;
  flagged_date?: string;
  flagged_by?: string;
};
