import { FC, useState } from "react";
import CommonButton from "../common/CommonButton";
import { t } from "i18next";
import { TableTypes } from "../../../common/constants";

const AssignmentTab: FC<{
  lessons: TableTypes<"lesson">[];
  courses: TableTypes<"course">[];
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
      {/* {stage === STAGES.SUBJECTS && courses && courses.length > 0 && (
        <CourseChapterDropDown
          courses={courses!}
          currentCourse={courses![5]}
          onCourseChange={onCourseChange}
          chapters={[]}
          currentChapter={courses![5].chapters[6]}
          onChapterChange={onChapterChange}
        />
      )} */}
      <div className="lessons-content">
        {stage === STAGES.SUBJECTS && lessons && (
          <div>
            {/* <DisplayLesson
              lessons={lessons!}
              onLessonSelect={onLessonSelect}
              currentChapterId={courses![0].chapters[0].id}
            /> */}
          </div>
        )}
      </div>
      <CommonButton title={t("Assign")} disabled={false} onClicked={() => {}} />
    </div>
  );
};

export default AssignmentTab;
