import { t } from 'i18next';
import { IonIcon } from '@ionic/react';
import { checkmarkCircle, ellipseOutline } from 'ionicons/icons';
import SelectIconImage from '../../../../components/displaySubjects/SelectIconImage';
import { COURSES } from '../../../../common/constants';
import {
  getTrackableIdForItem,
  getTrackableProps,
  TRACKABLE_IDS,
} from '../../../../analytics/trackable';
import type { AssignmentLesson } from '../../../hooks/useTeacherAssignment';
import AssignmentActions from './AssignmentActions';
import type { TeacherAssignmentSectionProps } from './TeacherAssignmentSection';

type TeacherAssignmentSectionContentProps = Pick<
  TeacherAssignmentSectionProps,
  | 'assignments'
  | 'collapsed'
  | 'controls'
  | 'id'
  | 'onLibraryClick'
  | 'setAssignments'
  | 'showEmptyActions'
  | 'startScan'
  | 'type'
>;

const TeacherAssignmentSectionContent = ({
  assignments,
  collapsed,
  controls,
  id,
  onLibraryClick,
  setAssignments,
  showEmptyActions = false,
  startScan,
  type,
}: TeacherAssignmentSectionContentProps) => {
  const sortedSubjectKeys = Object.keys(assignments).sort(
    (a, b) =>
      (assignments[a].sort_index ?? Infinity) -
      (assignments[b].sort_index ?? Infinity),
  );

  if (collapsed) return null;

  if (showEmptyActions && Object.keys(assignments).length === 0) {
    return (
      <AssignmentActions
        message="You have not chosen any assignments. Please use the buttons below to add assignments."
        onLibraryClick={onLibraryClick}
        startScan={startScan}
      />
    );
  }

  return (
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
                (assignment: AssignmentLesson, index: number) => {
                  const isSelected = assignment?.selected;
                  const courseCode = assignments[subjectId]?.courseCode;
                  const assignmentTrackableId = getTrackableIdForItem(
                    TRACKABLE_IDS.TEACHER_ASSIGNMENT_LESSON_SELECT,
                    `${id}-${subjectId}-${assignment?.id ?? index}`,
                  );

                  return (
                    <div key={index} className="assignment-list-item">
                      <span className="assignment-list-item-thumb">
                        <SelectIconImage
                          localSrc={
                            assignment?.id
                              ? `teacher/lessons/icons/${assignment.id}.webp`
                              : undefined
                          }
                          defaultSrc="assets/icons/DefaultIcon.png"
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
                        {...getTrackableProps(assignmentTrackableId)}
                        className={`subject-page-checkbox checkbox-subject ${assignmentTrackableId} ${isSelected ? 'selected' : ''}`}
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
  );
};

export default TeacherAssignmentSectionContent;
