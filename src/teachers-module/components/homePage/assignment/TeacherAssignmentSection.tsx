import { t } from 'i18next';
import {
  getTrackableIdForItem,
  getTrackableProps,
  TRACKABLE_IDS,
} from '../../../../analytics/trackable';
import {
  TeacherAssignmentPageType,
  useTeacherAssignment,
} from '../../../hooks/useTeacherAssignment';
import TeacherAssignmentSectionContent from './TeacherAssignmentSectionContent';

export type TeacherAssignmentSectionProps = {
  assignments: ReturnType<typeof useTeacherAssignment>['manualAssignments'];
  collapsed: boolean;
  heading: string;
  id: string;
  onLibraryClick?: () => void;
  showEmptyActions?: boolean;
  setAssignments: ReturnType<
    typeof useTeacherAssignment
  >['setManualAssignments'];
  setCollapsed: ReturnType<typeof useTeacherAssignment>['setManualCollapsed'];
  startScan?: () => void;
  type: TeacherAssignmentPageType;
  controls: Pick<
    ReturnType<typeof useTeacherAssignment>,
    | 'areAllSelected'
    | 'selectAllAssignments'
    | 'toggleAssignmentSelection'
    | 'toggleCollapse'
    | 'toggleSubjectCollapse'
  >;
};

const TeacherAssignmentSection = ({
  assignments,
  collapsed,
  controls,
  heading,
  id,
  onLibraryClick,
  setAssignments,
  setCollapsed,
  showEmptyActions = false,
  startScan,
  type,
}: TeacherAssignmentSectionProps) => {
  const selectAllTrackableId = getTrackableIdForItem(
    TRACKABLE_IDS.TEACHER_ASSIGNMENT_SECTION_SELECT_ALL,
    id,
  );
  return (
    <div className={id}>
      <div
        className={`${id}-header`}
        onClick={() => controls.toggleCollapse(setCollapsed, collapsed)}
      >
        <p
          className="recommended-assignments-headings"
          style={{ width: !collapsed ? '60%' : '100%' }}
          id={`${id}-heading`}
        >
          {t(heading)}
        </p>
        <div>
          {collapsed ? (
            <img
              src="assets/icons/iconDown.png"
              alt="DropDown_Icon"
              style={{ width: '16px', height: '16px' }}
            />
          ) : (
            <div className="select-all-container">
              <label
                className="recommended-assignments-headings"
                htmlFor={selectAllTrackableId}
              >
                {t('Select All')}
              </label>
              <input
                id={selectAllTrackableId}
                {...getTrackableProps(selectAllTrackableId)}
                className={`select-all-container-checkbox ${selectAllTrackableId}`}
                type="checkbox"
                checked={controls.areAllSelected(assignments)}
                onClick={(e) => e.stopPropagation()}
                onChange={() =>
                  controls.selectAllAssignments(
                    type,
                    assignments,
                    setAssignments,
                  )
                }
              />
            </div>
          )}
        </div>
      </div>
      <hr className="styled-line" />
      <TeacherAssignmentSectionContent
        assignments={assignments}
        collapsed={collapsed}
        controls={controls}
        id={id}
        onLibraryClick={onLibraryClick}
        setAssignments={setAssignments}
        showEmptyActions={showEmptyActions}
        startScan={startScan}
        type={type}
      />
    </div>
  );
};

export default TeacherAssignmentSection;
