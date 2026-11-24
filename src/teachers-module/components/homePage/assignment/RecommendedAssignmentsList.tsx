import React from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { t } from 'i18next';
import SelectIconImage from '../../../../components/displaySubjects/SelectIconImage';
import { getTrackableProps } from '../../../../analytics/trackable';
import { getRecommendedAddMoreTrackableId } from './AssignmentUtil';
import type {
  RecommendedAssignmentsState,
  Subject,
} from './RecommendedAssignments';
import type { TeacherAssignmentPageType } from './TeacherAssignment';

interface RecommendedAssignmentsListProps {
  assignments: RecommendedAssignmentsState;
  type: TeacherAssignmentPageType;
  setAssignments: Dispatch<SetStateAction<RecommendedAssignmentsState>>;
  toggleSubjectCollapse: (
    type: TeacherAssignmentPageType,
    subjectId: string,
  ) => void;
  toggleAssignmentSelection: (
    type: TeacherAssignmentPageType,
    assignments: RecommendedAssignmentsState,
    setAssignments: Dispatch<SetStateAction<RecommendedAssignmentsState>>,
    subjectId: string,
    index: number,
  ) => void;
  onAddMoreLessons: (subjectId: string) => void;
}

const RecommendedAssignmentsList: React.FC<RecommendedAssignmentsListProps> = ({
  assignments,
  type,
  setAssignments,
  toggleSubjectCollapse,
  toggleAssignmentSelection,
  onAddMoreLessons,
}) => {
  const sortedSubjectKeys = Object.keys(assignments).sort(
    (left, right) =>
      (assignments[left]?.sort_index ?? Infinity) -
      (assignments[right]?.sort_index ?? Infinity),
  );

  return sortedSubjectKeys.map((subjectId) => {
    const subject: Subject | undefined = assignments[subjectId];
    if (!subject) return null;
    const addMoreTrackableId = getRecommendedAddMoreTrackableId(subjectId);

    return (
      <div
        key={subjectId}
        id={`recommended-assignments-subject-${subjectId}`}
        className="recommended-assignments-render-subject"
      >
        <div
          id={`recommended-assignments-subject-header-${subjectId}`}
          className="recommended-assignments-subject-header"
        >
          <div
            id={`recommended-assignments-subject-header-left-${subjectId}`}
            className="recommended-assignments-subject-header-left"
            onClick={() => toggleSubjectCollapse(type, subjectId)}
          >
            <div
              className="recommended-assignments-subject-name"
              id={`recommended-assignments-subject-name-${subjectId}`}
            >
              {subject.name}
            </div>
            <div
              id={`recommended-assignments-selected-count-${subjectId}`}
              className="recommended-assignments-selected-count"
            >
              {subject.lessons.filter((lesson) => lesson.selected).length} /{' '}
              {subject.lessons.length}
            </div>
          </div>

          <button
            id={addMoreTrackableId}
            {...getTrackableProps(addMoreTrackableId)}
            className={`recommended-assignments-add-more-btn ${addMoreTrackableId}`}
            type="button"
            onClick={() => onAddMoreLessons(subjectId)}
          >
            {t('Add 5 more')}
          </button>
        </div>

        {!subject.isCollapsed && (
          <div id={`recommended-assignments-lessons-container-${subjectId}`}>
            {subject.lessons.map((assignment, index) => {
              const courseCode = subject.courseCode;
              const assignmentToggleId = `recommended-assignments-toggle-circle-${subjectId}-${index}`;
              return (
                <div
                  key={assignment.id}
                  id={`recommended-assignments-lesson-${subjectId}-${index}`}
                  className="recommended-assignments-list-item"
                >
                  <div
                    className="recommended-assignments-list-item-thumb"
                    id={`recommended-assignments-list-item-thumb-${subjectId}-${index}`}
                  >
                    <SelectIconImage
                      localSrc={
                        assignment.id
                          ? `teacher/lessons/icons/${assignment.id}.webp`
                          : undefined
                      }
                      defaultSrc="assets/icons/DefaultIcon.png"
                      webSrc={assignment.image ?? ''}
                      imageWidth="100%"
                      imageHeight="100%"
                    />
                  </div>
                  <div
                    className="recommended-assignments-list-item-info"
                    id={`recommended-assignments-lesson-info-${subjectId}-${index}`}
                  >
                    <div
                      id={`recommended-assignments-lesson-name-${subjectId}-${index}`}
                      className="recommended-assignments-list-item-name"
                    >
                      {courseCode === 'ENGLISH'
                        ? (assignment.name ?? '')
                        : t(assignment.name ?? '')}
                    </div>
                    <div
                      className="recommended-assignments-chapter-name"
                      id="recommended-assignments-chapter-name-id"
                    >
                      {t(assignment._chapterName)}
                    </div>
                  </div>
                  <span
                    id={assignmentToggleId}
                    {...getTrackableProps(assignmentToggleId)}
                    className={`recommended-assignments-toggle-circle ${assignmentToggleId} ${
                      assignment.selected ? 'is-selected' : 'is-unselected'
                    }`}
                    onClick={() =>
                      toggleAssignmentSelection(
                        type,
                        assignments,
                        setAssignments,
                        subjectId,
                        index,
                      )
                    }
                  >
                    {assignment.selected && (
                      <img
                        src="assets/tick.png"
                        alt=""
                        className="recommended-assignments-toggle-check"
                      />
                    )}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  });
};

export default RecommendedAssignmentsList;
