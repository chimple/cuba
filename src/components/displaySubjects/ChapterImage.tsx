import { FC, useState } from "react";
import { Chapter } from "../../common/courseConstants";
import "./SelectChapter.css";
import Course from "../../models/course";
import Lesson from "../../models/lesson";
import { url } from "inspector";
import CachedImage from "../common/CachedImage";

const ChapterImage: FC<{
  course: Course;
  chapter: Chapter;
}> = ({ course, chapter }) => {
  const [count, setCount] = useState(1);

  return (
    <div className="chapter-icon">
      {count === 1 ? (
        <img
          className="class-avatar-img"
          src={`courses/${course.courseCode}/icons/${chapter.id}.png`}
          alt=""
          onError={() => {
            setCount(2);
            console.log(chapter.thumbnail);
          }}
        />
      ) : count === 2 ? (
        <CachedImage
          className="class-avatar-img"
          src={
            chapter.thumbnail ??
            "courses/" + "maths" + "/icons/" + "maths10.png"
          }
          alt=""
          onError={() => {
            setCount(3);
          }}
        />
      ) : (
        <img
          className="class-avatar-img"
          src={"courses/" + "maths" + "/icons/" + "maths10.png"}
          alt="all"
        />
      )}
    </div>
  );
};
export default ChapterImage;
