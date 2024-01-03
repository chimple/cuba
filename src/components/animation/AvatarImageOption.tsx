import { t } from "i18next";
import "./RectangularTextButton.css";
import SelectIconImage from "../displaySubjects/SelectIconImage";
import course from "../../models/course";
import { useHistory } from "react-router-dom";
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
import { Chapter } from "../../common/courseConstants";
import { AvatarModes, AvatarObj } from "./Avatar";
import CachedImage from "../common/CachedImage";

const AvatarImageOption: React.FC<{
  currentMode?: AvatarModes;
  currtStageMode: AvatarModes;
  currentCourse?: Course;
  currentChapter?: Chapter;
  currentLesson?: Lesson;
}> = ({
  currentMode,
  currtStageMode,
  currentCourse,
  currentChapter,
  currentLesson,
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
  }, []);

  switch (currentMode) {
    case AvatarModes.CourseSuggestion:
      switch (currtStageMode) {
        case AvatarModes.CourseSuggestion:
          if (currentCourse) {
            content = cardContent(
              `courses/chapter_icons/${currentCourse.courseCode}.png`,
              "courses/maths/icons/maths10.png",
              currentCourse.thumbnail ?? ""
            );
          }
          break;
        case AvatarModes.ChapterSuggestion:
          if (currentCourse && currentChapter) {
            content = cardContent(
              `courses/${currentCourse.courseCode}/icons/${currentChapter.id}.webp`,
              "courses/en/icons/en38.webp",
              currentChapter.thumbnail
            );
          }
          break;
        case AvatarModes.LessonSuggestion:
          if (currentCourse && currentChapter && currentLesson) {
            content = cardContent(
              "courses/" +
                currentLesson.cocosSubjectCode +
                "/icons/" +
                currentLesson.id +
                ".webp",
              "courses/en/icons/en38.webp",
              currentLesson.thumbnail
            );
          }
          break;
      }
      break;
    case AvatarModes.TwoOptionQuestion:
      content = cardContent("", "", AvatarObj._i.imageSrc || "");
      break;
    case AvatarModes.FourOptionQuestion:
      content = cardContent("", "", AvatarObj._i.imageSrc || "");
      break;
    case AvatarModes.RecommendedLesson:
      if (currentLesson) {
        content = cardContent(
          "courses/" +
            currentLesson.cocosSubjectCode +
            "/icons/" +
            currentLesson.id +
            ".webp",
          "courses/en/icons/en38.webp",
          currentLesson.thumbnail
        );
      }

      break;

    default:
      content = (
        <div
          style={{
            width: "40vh",
            // margin: "0% 0% 0% 26%",
            marginLeft: "auto",
            marginRight: "auto",
            // flexWrap: "wrap",
            // justifyContent: "center",
          }}
        >
          <CachedImage
            // style={{
            //   width: "50%",
            //   height: "100%",
            // }}
            src="https://play-lh.googleusercontent.com/sSy91b6MppWNW7T7O7B9WTtqdFuvI5ZPemzxatFxLckENyiDY7p_NpaOGnGcKLBoNA"
            alt=""
            onError={() => {
              // setLoadIcon(LoadIcon.Default);
            }}
          ></CachedImage>
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
            imageWidth={"100%"}
            imageHeight={"80%"}
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
            textAlign: "center",
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
            imageWidth={"80%"}
            imageHeight={"80%"}
            webImageWidth={
              currentMode === AvatarModes.FourOptionQuestion ||
              currentMode === AvatarModes.TwoOptionQuestion
                ? "16vw"
                : "15vw"
            }
            webImageHeight="100%"
          />
        </div>
      </div>
    );
  }

  return (
    // <div style={{ width: imageWidth + "vw", height: "auto", padding: "0%" }}>
    content
  );
};
export default AvatarImageOption;
