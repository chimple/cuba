import "./CourseChapterDropDown.css";

import DropDown from "./DropDown";
import { TableTypes } from "../../../common/constants";

const CourseChapterDropDown: React.FC<{
  courses: TableTypes<"course">[];
  currentCourse: TableTypes<"course">;
  onCourseChange;
  chapters: TableTypes<"chapter">[];
  currentChapter: TableTypes<"chapter">;
  onChapterChange;
}> = ({
  courses,
  currentCourse,
  onCourseChange,
  chapters,
  currentChapter,
  onChapterChange,
}) => {
  return (
    <div className="dropDown">
      <DropDown
        currentValue={currentCourse?.id}
        optionList={courses.map((course) => ({
          displayName: course.name,
          id: course.id,
        }))}
        placeholder=""
        onValueChange={(evt) => {
          {
            const tempCourse = courses.find((course) => course.id === evt);
            onChapterChange(tempCourse ?? currentChapter);
          }
        }}
        width="35vw"
        // height="5vh"
      />
      <DropDown
        currentValue={currentChapter?.id}
        optionList={chapters.map((chapter) => ({
          displayName: chapter.name ?? "",
          id: chapter.id,
        }))}
        placeholder=""
        onValueChange={(evt) => {
          {
            const tempChapter = chapters.find((chapter) => chapter.id === evt);
            onChapterChange(tempChapter ?? currentChapter);
          }
        }}
        width="35vw"
        // height="5vh"
      />
    </div>
  );
};
export default CourseChapterDropDown;
