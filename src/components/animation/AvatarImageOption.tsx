import { t } from "i18next";
import "./RectangularTextButton.css";
import SelectIconImage from "../displaySubjects/SelectIconImage";
import course from "../../models/course";
import { useHistory } from "react-router-dom";
import { AvatarModes } from "./ChimpleAvatarPage";
import { ReactNode, useEffect, useState } from "react";
import { CHAPTER_CARD_COLOURS, PAGES } from "../../common/constants";
import Course from "../../models/course";
import Lesson from "../../models/lesson";

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
}> = ({ imageWidth,
  webSrc, localSrc, defaultSrc, currentMode, currentCourse, cuReChapter, cuRecLesson, isUnlocked
}) => {

    const history = useHistory();
    let content: ReactNode | null = null;
    const [index, setIndex] = useState<number>(0); 

    useEffect(() => {
      const randomIndex = Math.floor(Math.random() * CHAPTER_CARD_COLOURS.length); 
      setIndex(randomIndex);
    }, [currentCourse]);

    const containerStyle = {
      width: imageWidth + "vw",
      height: "auto", 
      // maxHeight: "46vh",
      // minHeight: "46vh",
      maxHeight: "44vh",
      minHeight: "44vh",


      padding: "0%",
      display: "flex",
      alignItems: "center",
    } as React.CSSProperties;

    switch (currentMode) {
      case AvatarModes.CourseSuggestion:
        content = (
          <div
            className="course-icon"
            style={{
              backgroundColor: CHAPTER_CARD_COLOURS[index],
              //   display: "flex", // Add flex display
              // alignItems: "center", // Center vertically
              // justifyContent: "center", // Center horizontally
              marginLeft: "auto",
              marginRight: "auto",
              // maxHeight: "43vh",
              maxHeight: "39vh",

            }}
          >
            <SelectIconImage
              localSrc={`courses/chapter_icons/${currentCourse.courseCode}.png`}
              defaultSrc={"courses/" + "maths" + "/icons/" + "maths10.png"}
              webSrc={currentCourse.thumbnail}
            />
          </div>
        );
        break;
      case AvatarModes.ChapterSuggestion:
        content = (
          <div className="chapter-icon"
            style={{

              marginLeft: "auto",
              marginRight: "auto",
            }}
          >
            <SelectIconImage
              localSrc={`courses/${currentCourse.courseCode}/icons/${cuReChapter.id}.webp`}
              defaultSrc={"courses/" + "en" + "/icons/" + "en38.webp"}
              webSrc={cuReChapter.thumbnail}
            />
          </div>
        );
        break;
      case AvatarModes.LessonSuggestion:
        content = (
          <div className="chapter-icon-in-avatar-image-option">
            <div style={{ width: imageWidth + "vw", height: "auto" }}>

              <div
                style={{
                  display: "grid",
                }}
              >
                <div
                  style={{
                    background: CHAPTER_CARD_COLOURS[index],
                    borderRadius: "7vh",
                    width: 45.5 + "vh",
                    height: 35 + "vh",
                    display: "grid",
                    justifyContent: "center",
                    alignItems: "center",
                    gridArea: "1/1",
                    marginLeft: "auto",
                    marginRight: "auto",
                    maxHeight: "43vh",
                  }}
                >
                  <SelectIconImage
                    localSrc={
                      "courses/" +
                      cuRecLesson.cocosSubjectCode +
                      "/icons/" +
                      cuRecLesson.id +
                      ".webp"
                    }
                    defaultSrc={
                      "courses/" + "en" + "/icons/" + "en38.webp"
                    }
                    webSrc={cuRecLesson.thumbnail}
                  />
                  {!isUnlocked ? (
                    <div id="lesson-card-status-icon">
                      <img
                        id="lesson-card-status-icon1"
                        loading="lazy"
                        src="assets/icons/Lock_icon.svg"
                        alt="assets/icons/Lock_icon.svg"
                      />
                    </div>
                  ) : (
                    <div />
                  )}
                </div>
              </div>
            </div>
          </div>
        );
        break;
      default:
        content = (
          <div className="chapter-icon"
            style={{

              marginLeft: "auto",
              marginRight: "auto",
            }}
          >
            <SelectIconImage
              localSrc={""}
              defaultSrc={""}
              webSrc={
                // "https://www.cambridgeblog.org/wp-content/uploads/2015/05/What-is-an-Animal.jpg"
                // "https://i.ytimg.com/vi/Ez9oouE2pOE/hqdefault.jpg"
                "https://play-lh.googleusercontent.com/sSy91b6MppWNW7T7O7B9WTtqdFuvI5ZPemzxatFxLckENyiDY7p_NpaOGnGcKLBoNA"
              }
            />
          </div>
        );
    }


    return (
      // <div style={{ width: imageWidth + "vw", height: "auto", padding: "0%" }}>
      <div style={containerStyle}>

        {content}

      </div>
    );
  };
export default AvatarImageOption;
