import { FC, useState } from "react";
import AssignButton from './AssignButton';
import Lesson from "../../../models/lesson";
import CourseChapterDropDown from './CourseChapterDropDown';
import DisplayLesson from './DisplayLesson';
import Course from "../../../models/course";

const AssignmentTab: FC<{
  lessons: Lesson[];
  courses: Course[];
  onCourseChange;
  onChapterChange;
  onLessonSelect;
}> = ({
  lessons,
  courses,
  onCourseChange,
  onChapterChange,
  onLessonSelect,
}) => {
  enum STAGES {
    SUBJECTS,
  }
  const [stage, setStage] = useState(STAGES.SUBJECTS);
  return (
    <div>
      {stage === STAGES.SUBJECTS && courses && courses.length > 0 && (
        <CourseChapterDropDown
          courses={courses!}
          currentCourse={courses![5]}
          onCourseChange={onCourseChange}
          chapters={courses![5].chapters}
          currentChapter={courses![5].chapters[6]}
          onChapterChange={onChapterChange}
        />
      )}
      <div className="lessons-content">
        {stage === STAGES.SUBJECTS && lessons && (
          <div>
            <DisplayLesson
              lessons={lessons!}
              onLessonSelect={onLessonSelect}
              currentChapterId={courses![0].chapters[0].id}
            />
          </div>
        )}
      </div>
      <AssignButton disabled={false} onClicked={() => {}} />
    </div>
  );
};

export default AssignmentTab;
