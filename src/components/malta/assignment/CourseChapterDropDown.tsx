import "./CourseChapterDropDown.css";

import Course from "../../../models/course";
import { Chapter } from "../../../common/courseConstants";
import DropDown from "./DropDown";

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
        // height="5vh"
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
        // height="5vh"
      />
    </div>
  );
};
export default CourseChapterDropDown;
