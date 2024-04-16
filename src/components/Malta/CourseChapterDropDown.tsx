import "./CourseChapterDropDown.css";
import DropDown from "../DropDown";

import Course from "../../models/course";
import { Chapter } from "../../common/courseConstants";

const CourseChapterDropDown: React.FC<{
  courses: Course[];
  currentCourse: Course;
  onCourseChange;
  chapters: Chapter[];
  currentChapter: Chapter;
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
        currentValue={currentCourse?.docId}
        optionList={courses.map((course) => ({
          displayName: course.title,
          id: course.docId,
        }))}
        placeholder=""
        onValueChange={(evt) => {
          {
            const tempCourse = courses.find((course) => course.docId === evt);
            onChapterChange(tempCourse ?? currentChapter);
          }
        }}
        width="35vw"
      />
      <DropDown
        currentValue={currentChapter?.id}
        optionList={chapters.map((chapter) => ({
          displayName: chapter.title,
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
      />
    </div>
  );
};
export default CourseChapterDropDown;
