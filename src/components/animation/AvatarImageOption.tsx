import { t } from "i18next";
import "./RectangularTextButton.css";
import SelectIconImage from "../displaySubjects/SelectIconImage";
import course from "../../models/course";
import { useHistory } from "react-router-dom";
import { AvatarModes } from "./ChimpleAvatarPage";
import { ReactNode, useEffect, useState } from "react";
import {
  CHAPTER_CARD_COLOURS,
  LESSON_CARD_COLORS,
  PAGES,
} from "../../common/constants";
import Course from "../../models/course";
import Lesson from "../../models/lesson";
import "./AvatarImageOption.css";
import { IonCard } from "@ionic/react";

const AvatarImageOption: React.FC<{
  imageWidth?: number;
  imageSrc?: string;
  localSrc?: any;
  defaultSrc?: any;
  webSrc?: any;
  currentMode?: any;
  currentCourse?: any;
  cuReChapter?: any;
  cuRecLesson?: any;
  isUnlocked?: boolean;
}> = ({
  imageWidth,
  currentMode,
  currentCourse,
  cuReChapter,
  cuRecLesson,
  isUnlocked,
}) => {
  const history = useHistory();
  let content: ReactNode | null = null;
  const [index, setIndex] = useState<number>(0);
  const [lessonCardColor, setLessonCardColor] = useState("");

  useEffect(() => {
    const randomIndex = Math.floor(Math.random() * CHAPTER_CARD_COLOURS.length);
    setLessonCardColor(
      LESSON_CARD_COLORS[Math.floor(Math.random() * LESSON_CARD_COLORS.length)]
    );
    setIndex(randomIndex);
  }, [currentCourse]);

  // const containerStyle = {
  //   width: imageWidth + "vw",
  //   height: "auto",
  //   // maxHeight: "46vh",
  //   // minHeight: "46vh",
  //   maxHeight: "44vh",
  //   minHeight: "44vh",

  //   padding: "0%",
  //   display: "flex",
  //   alignItems: "center",
  // } as React.CSSProperties;

  switch (currentMode) {
    case AvatarModes.CourseSuggestion:
      content = cardContent(
        `courses/chapter_icons/${currentCourse.courseCode}.png`,
        "courses/maths/icons/maths10.png",
        currentCourse.thumbnail
      );
      // content = (
      //   <div
      //     className="course-icon"
      //     style={{
      //       backgroundColor: CHAPTER_CARD_COLOURS[index],
      //     }}
      //   >
      //     <SelectIconImage
      //       localSrc={`courses/chapter_icons/${currentCourse.courseCode}.png`}
      //       defaultSrc={"courses/" + "maths" + "/icons/" + "maths10.png"}
      //       webSrc={currentCourse.thumbnail}
      //     />
      //   </div>
      // );
      break;
    case AvatarModes.ChapterSuggestion:
      content = cardContent(
        `courses/${currentCourse.courseCode}/icons/${cuReChapter.id}.webp`,
        "courses/en/icons/en38.webp",
        cuReChapter.thumbnail
      );
      // content = (
      //   <div className="chapter-icon">
      //     <SelectIconImage
      //       localSrc={`courses/${currentCourse.courseCode}/icons/${cuReChapter.id}.webp`}
      //       defaultSrc={"courses/" + "en" + "/icons/" + "en38.webp"}
      //       webSrc={cuReChapter.thumbnail}
      //     />
      //   </div>
      // );
      break;
    case AvatarModes.LessonSuggestion:
      content = cardContent(
        "courses/" +
          cuRecLesson.cocosSubjectCode +
          "/icons/" +
          cuRecLesson.id +
          ".webp",
        "courses/en/icons/en38.webp",
        cuRecLesson.thumbnail
      );
      break;
    default:
      content = (
        <div className="chapter-icon">
          <SelectIconImage
            localSrc={""}
            defaultSrc={""}
            webSrc={
              // "https://www.cambridgeblog.org/wp-content/uploads/2015/05/What-is-an-Animal.jpg"
              // "https://i.ytimg.com/vi/Ez9oouE2pOE/hqdefault.jpg"
              "https://play-lh.googleusercontent.com/sSy91b6MppWNW7T7O7B9WTtqdFuvI5ZPemzxatFxLckENyiDY7p_NpaOGnGcKLBoNA"
            }
            imageWidth={"100"}
            imageHeight={"80"}
          />
        </div>
      );
  }

  function cardContent(localSrc: string, defalutSrc: string, webSrc: string) {
    let contentWidth = "40vw";
    let contentHeight = "40vh";
    return (
      <div
        style={{
          background: lessonCardColor,
          // borderRadius: "7vh",
          // width: "45.5vh",
          height: contentHeight,
          display: "grid",
          justifyContent: "center",
          // alignItems: "center",
          gridArea: "1/1",
        }}
        color={lessonCardColor}
      >
        <div
          style={{
            width: contentWidth,
            // borderRadius: "12%",
            display: "grid",
            justifyContent: "center",
            gridArea: "1/1",
            //           border-radius: 12%;
            // display: grid;
            // justify-content: center;
            // align-items: center;
            // grid-area: 1/1;
          }}
        >
          <SelectIconImage
            localSrc={
              // this is for lesson card background
              "courses/" + "sl_en1_mp" + "/icons/" + "ChallengePattern.png"
            }
            defaultSrc={
              "courses/" + "sl_en1_mp" + "/icons/" + "ChallengePattern.png"
            }
            webSrc={
              "https://firebasestorage.googleapis.com/v0/b/cuba-stage.appspot.com/o/lesson_thumbnails%2FlessonCaredPattern%2FChallengePattern.png?alt=media&token=be64aec1-f70f-43c3-95de-fd4b1afe5806"
            }
            imageWidth={"100"}
            imageHeight={"80"}
          />
        </div>

        <div
          style={{
            width: contentWidth,
            height: contentHeight,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gridArea: "1/1 / span 2 / span 2",
            //           max-width: 100%;
            // height: auto;
            // width: auto;
            // /* height: 80%; */
            // display: flex;
            // justify-content: center;
            // align-items: center;
            // grid-area: 1/1 / span 2 / span 2;
          }}
        >
          <SelectIconImage
            localSrc={localSrc}
            defaultSrc={defalutSrc}
            webSrc={webSrc}
            imageWidth={"100"}
            imageHeight={"80"}
          />
        </div>
      </div>
    );
  }

  return (
    // <div style={{ width: imageWidth + "vw", height: "auto", padding: "0%" }}>
    <div>{content}</div>
  );
};
export default AvatarImageOption;
