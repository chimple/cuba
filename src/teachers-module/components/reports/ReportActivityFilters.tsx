import React from 'react';
import { t } from 'i18next';
import { getTrackableProps, TRACKABLE_IDS } from '../../../analytics/trackable';

interface ReportActivityFiltersProps {
  isAssignmentsOnly: boolean;
  onSelectionChange: (isAssignmentsOnly: boolean) => void;
}

const ReportActivityFilters: React.FC<ReportActivityFiltersProps> = ({
  isAssignmentsOnly,
  onSelectionChange,
}) => (
  <div className="toggle-container">
    <div className="pill-toggle">
      <div
        id={TRACKABLE_IDS.TEACHER_REPORT_ASSIGNMENTS_FILTER}
        {...getTrackableProps(TRACKABLE_IDS.TEACHER_REPORT_ASSIGNMENTS_FILTER)}
        className={`pill-option teacher_report_assignments_filter ${
          isAssignmentsOnly ? 'active' : ''
        }`}
        onClick={() => onSelectionChange(true)}
      >
        {t('Assignments')}
      </div>
      <div
        id={TRACKABLE_IDS.TEACHER_REPORT_ALL_ACTIVITIES_FILTER}
        {...getTrackableProps(
          TRACKABLE_IDS.TEACHER_REPORT_ALL_ACTIVITIES_FILTER,
        )}
        className={`pill-option teacher_report_all_activities_filter ${
          !isAssignmentsOnly ? 'active' : ''
        }`}
        onClick={() => onSelectionChange(false)}
      >
        {t('All activities')}
      </div>
    </div>
  </div>
);

export default ReportActivityFilters;
