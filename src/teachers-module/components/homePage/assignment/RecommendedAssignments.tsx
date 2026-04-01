import React from 'react';
import { t } from 'i18next';
import SelectIconImage from '../../../../components/displaySubjects/SelectIconImage';
import { TeacherAssignmentPageType } from './TeacherAssignment';
import { AssignmentSource } from '../../../../common/constants';
import './RecommendedAssignments.css';

export type Lesson = {
  id: string;
  _chapterId: string;
  name: string | null;
  image: string | null;
  _chapterName: string;
  selected: boolean;
  source: string | null;
};

export type Subject = {
  name: string;
  courseCode?: string;
  sort_index?: number;
  isCollapsed?: boolean;
  lessons: Lesson[];
  allLessons?: Lesson[];
};

export type RecommendedAssignmentsState = {
  [subjectId: string]: Subject;
};

type Props = {
  recommendedAssignments: RecommendedAssignmentsState;
  setRecommendedAssignments: React.Dispatch<
    React.SetStateAction<RecommendedAssignmentsState>
  >;
  toggleSubjectCollapse: (
    type: TeacherAssignmentPageType,
    subjectId: string,
  ) => void;
  toggleAssignmentSelection: (
    type: TeacherAssignmentPageType,
    assignments: RecommendedAssignmentsState,
    setAssignments: React.Dispatch<
      React.SetStateAction<RecommendedAssignmentsState>
    >,
    subjectId: string,
    index: number,
  ) => void;
  updateSelectedLesson: (
    updatedAssignments: RecommendedAssignmentsState,
  ) => void;
};
const RecommendedAssignments: React.FC<Props> = ({
  recommendedAssignments,
  setRecommendedAssignments,
  toggleSubjectCollapse,
  toggleAssignmentSelection,
  updateSelectedLesson,
}) => {
  // Adds the next 5 lessons for a given subject
  const handleAddMoreLessons = (subjectId: string) => {
    setRecommendedAssignments((prev) => {
      // Get the subject from previous state
      const subject = prev[subjectId];
      // If no lessons available at all, return previous state
      if (!subject?.allLessons?.length) return prev;

      // If currently displayed lessons are empty, do nothing
      if (!subject.lessons.length) return prev;
      // Get the last currently displayed lesson
      const lastLesson = subject.lessons[subject.lessons.length - 1];

      // Find the index of that lesson inside allLessons
      const lastIndex = subject.allLessons.findIndex(
        (lesson) =>
          lesson.id === lastLesson.id &&
          lesson._chapterId === lastLesson._chapterId,
      );
      // If lesson not found, do nothing
      if (lastIndex === -1) return prev;
      // Get the next 5 lessons after the last displayed one
      const nextFiveRaw = subject.allLessons.slice(
        lastIndex + 1,
        lastIndex + 6,
      );
      // If there are no more lessons to add, return previous state
      if (!nextFiveRaw.length) return prev;
      // Mark new lessons as selected and recommended
      const nextFive = nextFiveRaw.map((lesson) => ({
        ...lesson,
        selected: true,
        source: AssignmentSource.RECOMMENDED,
      }));
      // Update state by appending new lessons
      const updatedState: RecommendedAssignmentsState = {
        ...prev,
        [subjectId]: {
          ...subject,
          lessons: [...subject.lessons, ...nextFive],
        },
      };
      // Update selected lessons count/state externally
      updateSelectedLesson(updatedState);

      return updatedState;
    });
  };
  const renderAssignments = (
    assignments: RecommendedAssignmentsState,
    type: TeacherAssignmentPageType,
  ) => {
    const sortedSubjectKeys = Object.keys(assignments).sort(
      (a, b) =>
        (assignments[a]?.sort_index ?? Infinity) -
        (assignments[b]?.sort_index ?? Infinity),
    );

    return sortedSubjectKeys.map((subjectId) => {
      const subject = assignments[subjectId];
      if (!subject) return null;

      return (
        <div
          key={subjectId}
          id={`recommended-assignments-subject-${subjectId}`}
          className="recommended-assignments-render-subject"
        >
          {/* HEADER */}
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
              className="recommended-assignments-add-more-btn"
              onClick={() => handleAddMoreLessons(subjectId)}
            >
              {t('Add 5 more')}
            </button>
          </div>

          {/* LESSONS */}
          {!subject.isCollapsed && (
            <div id={`recommended-assignments-lessons-container-${subjectId}`}>
              {subject.lessons.map((assignment, index) => {
                const isSelected = assignment.selected;
                const courseCode = subject.courseCode;

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
                      id={`recommended-assignments-toggle-circle-${subjectId}-${index}`}
                      className={`recommended-assignments-toggle-circle ${
                        isSelected ? 'is-selected' : 'is-unselected'
                      }`}
                      onClick={() =>
                        toggleAssignmentSelection(
                          type,
                          assignments,
                          setRecommendedAssignments,
                          subjectId,
                          index,
                        )
                      }
                    >
                      {isSelected && (
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
  return (
    <div className="recommended-assignments-page">
      <div className="recommended-assignments-container">
        {renderAssignments(
          recommendedAssignments,
          TeacherAssignmentPageType.RECOMMENDED,
        )}
      </div>
    </div>
  );
};

export default RecommendedAssignments;
