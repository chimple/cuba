import { FC, ReactNode, useEffect, useState } from "react";
import { t } from "i18next";
import { useHistory } from "react-router-dom";
import { CircularProgressbar } from "react-circular-progressbar";
import {
  CHAPTER_CARD_COLOURS,
  LESSON_CARD_COLORS,
  TableTypes,
} from "../../common/constants";
import { AvatarModes, AvatarObj } from "./Avatar";
import SelectIconImage from "../displaySubjects/SelectIconImage";
import { Util } from "../../utility/util";
import "./RectangularTextButton.css";
import "./AvatarImageOption.css";

const AvatarImageOption: FC<{
  currentMode?: AvatarModes;
  currtStageMode: AvatarModes;
  currentCourse?: TableTypes<"course">;
  currentChapter?: TableTypes<"chapter">;
  currentLesson?: TableTypes<"lesson">;
  avatarObj: AvatarObj;
}> = ({
  currentMode,
  currtStageMode,
  currentCourse,
  currentChapter,
  currentLesson,
  avatarObj,
}) => {
  const history = useHistory();
  let content: ReactNode | null = null;
  const [index, setIndex] = useState<number>(0);
  const [sticker, setSticker] = useState<string | undefined>(undefined);
  const [lessonCardColor, setLessonCardColor] = useState("");

  useEffect(() => {
    const randomIndex = Math.floor(Math.random() * CHAPTER_CARD_COLOURS.length);
    setLessonCardColor(
      LESSON_CARD_COLORS[Math.floor(Math.random() * LESSON_CARD_COLORS.length)]
    );
    setIndex(randomIndex);
    const loadSticker = async () => {
      const stickerData = await Util.getNextUnlockStickers();
      if (stickerData && stickerData.length > 0) {
        setSticker(stickerData[0]?.image ?? undefined);
      }
    };

    loadSticker();
  }, []);

  switch (currentMode) {
    case AvatarModes.collectReward:
      content = cardContent(
        avatarObj.unlockedRewards[0]?.image,
        avatarObj.unlockedRewards[0]?.image,
        avatarObj.unlockedRewards[0]?.image
      );
      break;
    case AvatarModes.ShowWeeklyProgress:
      let percentage =
        ((avatarObj.weeklyTimeSpent["min"] * 60 +
          avatarObj.weeklyTimeSpent["sec"]) /
          (avatarObj.weeklyProgressGoal * 60)) *
        100;

      if (!percentage || percentage < 0) percentage = 0;

      content = (
        <div className="progress-container">
          <CircularProgressbar
            value={percentage}
            text={`${avatarObj.weeklyTimeSpent["min"]} ${t("min")} : ${
              avatarObj.weeklyTimeSpent["sec"]
            } ${t("sec")}`}
            styles={{
              root: {},
              path: {
                stroke: `#678e21`,
                strokeLinecap: "butt",
                transition: "stroke-dashoffset 0.5s ease 0s",
                transformOrigin: "center center",
              },
              trail: {
                stroke: "#d6d6d6",
                strokeLinecap: "butt",
                transform: "rotate(0.25turn)",
                transformOrigin: "center center",
              },
              text: {
                fill: "#000",
                fontSize: "8px",
              },
              background: {
                fill: "#3e98c7",
              },
            }}
          />
          <div className="sticker-container">
            {sticker && (
              <div className="sticker-inner-container">
                <img src={sticker} className="sticker-img" alt="Sticker" />
              </div>
            )}
          </div>
        </div>
      );
      break;
    case AvatarModes.CourseSuggestion:
      switch (currtStageMode) {
        case AvatarModes.CourseSuggestion:
          if (currentCourse) {
            content = cardContent(
              `courses/chapter_icons/${currentCourse.code}.png`,
              "",
              currentCourse.image ?? ""
            );
          }
          break;
        case AvatarModes.ChapterSuggestion:
          if (currentCourse && currentChapter) {
            content = cardContent(
              `courses/${currentCourse.code}/icons/${currentChapter.id}.webp`,
              "",
              currentChapter.image ?? ""
            );
          }
          break;
        case AvatarModes.LessonSuggestion:
          if (currentCourse && currentChapter && currentLesson) {
            content = cardContent(
              "courses/" +
                currentLesson.cocos_subject_code +
                "/icons/" +
                currentLesson.id +
                ".webp",
              "",
              currentLesson.image ?? ""
            );
          }
          break;
      }
      break;
    case AvatarModes.TwoOptionQuestion:
    case AvatarModes.FourOptionQuestion:
      content = cardContent(
        AvatarObj.getInstance().imageSrc,
        "",
        AvatarObj.getInstance().imageSrc
      );
      break;
    case AvatarModes.RecommendedLesson:
      if (currentLesson) {
        content = cardContent(
          "courses/" +
            currentLesson.cocos_subject_code +
            "/icons/" +
            currentLesson.id +
            ".webp",
          "",
          currentLesson.image ?? ""
        );
      }
      break;
    default:
      content = null;
  }

  function cardContent(localSrc: string, defaultSrc: string, webSrc: string) {
    let contentWidth =
      currentMode === AvatarModes.FourOptionQuestion ||
      currentMode === AvatarModes.TwoOptionQuestion
        ? "16vw"
        : "30vw";
    let contentHeight = "40vh";
    return (
      <div
        style={{
          background: lessonCardColor,
          height: contentHeight,
          display: "grid",
          justifyContent: "center",
          gridArea: "1/1",
        }}
        color={lessonCardColor}
      >
        <div
          style={{
            width: contentWidth,
            display: "grid",
            justifyContent: "center",
            gridArea: "1/1",
          }}
        >
          <SelectIconImage
            localSrc={
              "courses/" + "sl_en1_mp" + "/icons/" + "ChallengePattern.png"
            }
            defaultSrc={
              "courses/" + "sl_en1_mp" + "/icons/" + "ChallengePattern.png"
            }
            webSrc={
              "https://firebasestorage.googleapis.com/v0/b/cuba-stage.appspot.com/o/lesson_thumbnails%2FlessonCaredPattern%2FChallengePattern.png?alt=media&token=be64aec1-f70f-43c3-95de-fd4b1afe5806"
            }
            imageWidth={"100%"}
            imageHeight={"auto"}
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
          }}
        >
          <SelectIconImage
            localSrc={localSrc}
            defaultSrc={"assets/icons/DefaultIcon.png"}
            webSrc={webSrc}
            imageWidth={"80%"}
            imageHeight={"auto"}
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

  return content;
};

export default AvatarImageOption;
