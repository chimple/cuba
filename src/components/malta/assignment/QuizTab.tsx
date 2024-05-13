import { FC, useState } from "react";
import Lesson from "../../../models/lesson";
import CourseChapterDropDown from "./CourseChapterDropDown";
import DisplayLesson from "./DisplayLesson";
import Course from "../../../models/course";
import { t } from "i18next";
import CommonButton from "../common/CommonButton";
import StartEndDateSelect from "./StartEndDateSelect";

const QuizTab: FC<{
  liveQuizLessons: Lesson[];
  courses: Course[];
  onCourseChange;
  onChapterChange;
  onLessonSelect;
}> = ({
  liveQuizLessons,
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
          currentCourse={courses![12]}
          onCourseChange={onCourseChange}
          chapters={courses![12].chapters}
          currentChapter={courses![12].chapters[5]}
          onChapterChange={onChapterChange}
        />
      )}
      <div className="lessons-content">
        {stage === STAGES.SUBJECTS && liveQuizLessons && (
          <div>
            <DisplayLesson
              lessons={liveQuizLessons!}
              onLessonSelect={onLessonSelect}
              currentChapterId={courses![12].chapters[5].id}
            />
          </div>
        )}
      </div>

      <div style={{ marginLeft: "1vh" }}>{t("Select by date range")}</div>
      <StartEndDateSelect startDate="2024-05-02" endDate="2024-05-10"/>

      <CommonButton title="Assign" disabled={false} onClicked={() => {}} />
    </div>
  );
};

export default QuizTab;
