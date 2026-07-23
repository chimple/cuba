import { t } from 'i18next';
import { IonIcon } from '@ionic/react';
import { checkmarkCircle, ellipseOutline } from 'ionicons/icons';
import QrCode2Icon from '@mui/icons-material/QrCode2';
import SelectIconImage from '../../../../components/displaySubjects/SelectIconImage';
import { COURSES } from '../../../../common/constants';
import {
  TeacherAssignmentPageType,
  useTeacherAssignment,
} from '../../../hooks/useTeacherAssignment';

type TeacherAssignmentSectionProps = {
  assignments: any;
  collapsed: boolean;
  heading: string;
  id: string;
  onLibraryClick?: () => void;
  showEmptyActions?: boolean;
  setAssignments: any;
  setCollapsed: any;
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
  const sortedSubjectKeys = Object.keys(assignments).sort(
    (a, b) =>
      (assignments[a].sort_index ?? Infinity) -
      (assignments[b].sort_index ?? Infinity),
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
              <label className="recommended-assignments-headings">
                {t('Select All')}
              </label>
              <input
                className="select-all-container-checkbox"
                type="checkbox"
                checked={controls.areAllSelected(assignments)}
                onClick={(e) => e.stopPropagation()}
                onChange={() =>
                  controls.selectAllAssignments(type, assignments, setAssignments)
                }
              />
            </div>
          )}
        </div>
      </div>
      <hr className="styled-line" />
      {!collapsed &&
        (showEmptyActions && Object.keys(assignments).length === 0 ? (
          <AssignmentActions
            message="You have not chosen any assignments. Please use the buttons below to add assignments."
            onLibraryClick={onLibraryClick}
            startScan={startScan}
          />
        ) : (
          <>
            {sortedSubjectKeys.map((subjectId) => (
              <div key={subjectId} className="render-subject">
                <div
                  className="subject-header"
                  onClick={() => controls.toggleSubjectCollapse(type, subjectId)}
                >
                  <h4>{assignments[subjectId]?.name}</h4>
                  <img
                    src="assets/icons/iconDown.png"
                    alt="DropDown_Icon"
                    style={{ width: '16px', height: '16px', marginLeft: 'auto' }}
                  />
                </div>
                {!assignments[subjectId].isCollapsed && (
                  <div>
                    {assignments[subjectId].lessons.map(
                      (assignment: any, index: number) => {
                        const isSelected = assignment?.selected;
                        const courseCode = assignments[subjectId]?.courseCode;
                        return (
                          <div key={index} className="assignment-list-item">
                            <span className="assignment-list-item-thumb">
                              <SelectIconImage
                                localSrc={
                                  assignment?.id
                                    ? `teacher/lessons/icons/${assignment.id}.webp`
                                    : undefined
                                }
                                defaultSrc={'assets/icons/DefaultIcon.png'}
                                webSrc={assignment?.image ?? ''}
                                imageWidth="100%"
                                imageHeight="100%"
                              />
                            </span>
                            <span className="assignment-list-item-name">
                              {courseCode === COURSES.ENGLISH ||
                              courseCode === COURSES.MATHS
                                ? (assignment?.name ?? '')
                                : t(assignment?.name ?? '')}
                            </span>

                            <IonIcon
                              icon={isSelected ? checkmarkCircle : ellipseOutline}
                              id="checkbox-subject"
                              className={`subject-page-checkbox ${isSelected ? 'selected' : ''}`}
                              onClick={() =>
                                controls.toggleAssignmentSelection(
                                  type,
                                  assignments,
                                  setAssignments,
                                  subjectId,
                                  index,
                                )
                              }
                            />
                          </div>
                        );
                      },
                    )}
                  </div>
                )}
              </div>
            ))}
            {showEmptyActions && (
              <AssignmentActions
                message="To add more assignments. Please use the buttons below to add assignments."
                onLibraryClick={onLibraryClick}
                startScan={startScan}
              />
            )}
          </>
        ))}
    </div>
  );
};

const AssignmentActions = ({
  message,
  onLibraryClick,
  startScan,
}: {
  message: string;
  onLibraryClick?: () => void;
  startScan?: () => void;
}) => (
  <div className="TeacherAssignment-Add-moreAssignments">
    <p>{t(message)}</p>
    <div className="TeacherAssignment-add-moreAssignments-button">
      <div
        className="TeacherAssignment-manual-assignments-icon-btn"
        onClick={() => onLibraryClick?.()}
      >
        <img
          src="assets/icons/bookSelected.png"
          alt="Library"
          className="TeacherAssignment-addAssignment-icon1"
        />
        <span style={{ fontWeight: 500, color: '#444', fontSize: 16 }}>
          {t('Library')}
        </span>
      </div>
      <div
        className="TeacherAssignment-manual-assignments-icon-btn"
        onClick={startScan}
      >
        <QrCode2Icon
          sx={{ color: '#7C5DB0' }}
          className="TeacherAssignment-addAssignment-icon2"
        />
        <span style={{ fontWeight: 500, color: '#444', fontSize: 16 }}>
          {t('Scan QR')}
        </span>
      </div>
    </div>
  </div>
);

export default TeacherAssignmentSection;
