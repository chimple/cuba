import React from 'react';
import { TeacherAssignmentPageType } from './TeacherAssignment';
import RecommendedAssignmentsList from './RecommendedAssignmentsList';
import './RecommendedAssignments.css';
import { addNextRecommendedLessons } from './AssignmentUtil';

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
  const handleAddMoreLessons = (subjectId: string) => {
    setRecommendedAssignments((previousAssignments) => {
      const updatedAssignments = addNextRecommendedLessons(
        previousAssignments,
        subjectId,
      );
      if (!updatedAssignments) return previousAssignments;
      updateSelectedLesson(updatedAssignments);
      return updatedAssignments;
    });
  };

  return (
    <div className="recommended-assignments-page">
      <div className="recommended-assignments-container">
        <RecommendedAssignmentsList
          assignments={recommendedAssignments}
          type={TeacherAssignmentPageType.RECOMMENDED}
          setAssignments={setRecommendedAssignments}
          toggleSubjectCollapse={toggleSubjectCollapse}
          toggleAssignmentSelection={toggleAssignmentSelection}
          onAddMoreLessons={handleAddMoreLessons}
        />
      </div>
    </div>
  );
};

export default RecommendedAssignments;
