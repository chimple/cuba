import { IonCard } from "@ionic/react";
import { useEffect, useState } from "react";
import { useHistory } from "react-router-dom";
import {
  COCOS,
  CONTINUE,
  LESSON_CARD_COLORS,
  LIVE_QUIZ,
  PAGES,
  TYPE,
  TableTypes,
} from "../common/constants";
import "./LessonCard.css";
import LessonCardStarIcons from "./LessonCardStarIcons";
import React from "react";
import { ServiceConfig } from "../services/ServiceConfig";
import { t } from "i18next";
import LovedIcon from "./LovedIcon";
import SelectIconImage from "./displaySubjects/SelectIconImage";
import { Util } from "../utility/util";
import DownloadLesson from "./DownloadChapterAndLesson";
import { useOnlineOfflineErrorMessageHandler } from "../common/onlineOfflineErrorMessageHandler";

const LessonCard: React.FC<{
  width: string;
  height: string;
  lesson: TableTypes<"lesson">;
  course: TableTypes<"course"> | undefined;
  isPlayed: boolean;
  isUnlocked: boolean;
  showSubjectName: boolean;
  showText?: boolean;
  showScoreCard?: boolean;
  score: any;
  isLoved: boolean | undefined;
  showChapterName: boolean;
  downloadButtonLoading?: boolean;
  showDate?: boolean;
  onDownloadOrDelete?: () => void;
  chapter?: TableTypes<"chapter">;
  assignment?: TableTypes<"assignment">;
  lessonCourseMap?: {
    [lessonId: string]: { course_id: string };
  };
}> = ({
  width,
  height,
  lesson,
  course,
  isPlayed,
  isUnlocked,
  showSubjectName = false,
  showText = true,
  showScoreCard = true,
  score,
  isLoved,
  showChapterName = false,
  downloadButtonLoading,
  showDate,
  onDownloadOrDelete,
  chapter,
  assignment,
  lessonCourseMap,
}) => {
  const history = useHistory();
  const [showImage, setShowImage] = useState(true);
  const [subject, setSubject] = useState<TableTypes<"subject">>();
  // const [subject, setSubject] = useState<Subject>();
  const [currentCourse, setCurrentCourse] = useState<TableTypes<"course">>();
  const { online, presentToast } = useOnlineOfflineErrorMessageHandler();
  const [date, setDate] = useState<Date>();
  const hideImg = (event: any) => {
    setShowImage(false);
  };
  useEffect(() => {
    getCurrentCourse();
    getDate();
  }, [lesson]);

  const getDate = () => {
    const res = assignment?.updated_at;
    if (!!res) {
      const dateObj = new Date(res);
      setDate(dateObj);
    }
  };

  const getCurrentCourse = async () => {
    const api = ServiceConfig.getI().apiHandler;
    try {
      if (lessonCourseMap) {
        const lessonData = lessonCourseMap[lesson.id];
        if (lessonData?.course_id) {
          const course = await api.getCourse(lessonData.course_id);
          setCurrentCourse(course);
          return;
        }
      }
    } catch (error) {
      console.error("Error fetching course data:", error);
    }
  };

  // const lessonCardColor =
  //   LESSON_CARD_COLORS[Math.floor(Math.random() * LESSON_CARD_COLORS.length)];

  const [lessonCardColor, setLessonCardColor] = useState("");

  useEffect(() => {
    setLessonCardColor(
      LESSON_CARD_COLORS[Math.floor(Math.random() * LESSON_CARD_COLORS.length)]
    );
  }, []);

  return (
    <>
      <div className="assigned-date-div">
        {!!showDate && assignment ? (
          <div id="lesson-card-date">
            <p>
              {t("Assigned") + ": "}
              <b>
                {!!date &&
                  (() => {
                    const day = date.getDate().toString().padStart(2, "0");
                    const month = (date.getMonth() + 1)
                      .toString()
                      .padStart(2, "0");
                    const year = date.getFullYear();
                    return `${day}-${month}-${year}`;
                  })()}
              </b>
            </p>
          </div>
        ) : null}
      </div>

      <IonCard
        id="lesson-card"
        style={{
          width: width,
          height: "auto",
        }}
        onClick={async () => {
          if (isUnlocked) {
            // if (
            //   lesson.chapter.course.isCourseMapped &&
            //   lesson.orig_course_id != undefined &&
            //   lesson.orig_chapter_id != undefined &&
            //   lesson.orig_lesson_id != undefined
            // ) {
            //   const parmas = `?courseid=${lesson.orig_course_id}&chapterid=${lesson.orig_chapter_id}&lessonid=${lesson.orig_lesson_id}`;
            //   console.log("parmas", parmas);
            //   history.push(PAGES.GAME + parmas, {
            //     url: "chimple-lib/index.html" + parmas,
            //     lessonId: TableTypes<"lesson">.orig_lesson_id,
            //     lesson: TableTypes<"lesson">,
            //     from: history.location.pathname,
            //   });
            // } else {
            // console.log("LessonCard course: subject,", subject);
            if (lesson.plugin_type === COCOS) {
              const parmas = `?courseid=${lesson.cocos_subject_code}&chapterid=${lesson.cocos_chapter_code}&lessonid=${lesson.cocos_lesson_id}`;
              history.replace(PAGES.GAME + parmas, {
                url: "chimple-lib/index.html" + parmas,
                lessonId: lesson.cocos_lesson_id,
                courseDocId:
                  course?.id ??
                  // lesson?.assignment?.course?.id ??
                  // lesson.courseId ??
                  currentCourse?.id,
                course: JSON.stringify(currentCourse!),
                lesson: JSON.stringify(lesson),
                assignment: assignment,
                chapter: JSON.stringify(chapter),
                from: history.location.pathname + `?${CONTINUE}=true`,
              });
            } else if (!!assignment?.id && lesson.plugin_type === LIVE_QUIZ) {
              if (!online) {
                presentToast({
                  message: t(`Device is offline`),
                  color: "danger",
                  duration: 3000,
                  position: "bottom",
                  buttons: [
                    {
                      text: "Dismiss",
                      role: "cancel",
                    },
                  ],
                });
                return;
              }
              history.replace(
                PAGES.LIVE_QUIZ_JOIN + `?assignmentId=${assignment?.id}`,
                {
                  assignment: JSON.stringify(assignment),
                }
              );
            }
          }
        }}
      >
        <div
          style={{
            display: "grid",
          }}
        >
          <div
            style={{
              background: lesson?.color ?? lessonCardColor,
              borderRadius: "7vh",
              width: width,
              height: height,
              display: "grid",
              justifyContent: "center",
              alignItems: "center",
              gridArea: "1/1",
            }}
            color={lessonCardColor}
          >
            <div id="lesson-card-homework-icon">
              {assignment !== undefined &&
                (!(TYPE in assignment) || assignment.type !== LIVE_QUIZ ? (
                  <div>
                    <img
                      src="assets/icons/homework_icon.svg"
                      className="lesson-card-homework-indicator"
                      alt="Homework Icon"
                    />
                  </div>
                ) : (
                  <div>
                    <img
                      src="/assets/icons/quiz_icon.svg"
                      className="lesson-card-homework-indicator"
                      alt="Quiz Icon"
                    />
                  </div>
                ))}
            </div>

            {showSubjectName && currentCourse?.name ? (
              <div id="lesson-card-subject-name">
                <p>
                  {currentCourse?.name}
                  {/* {subject.title==="English"?subject.title:t(subject.title)} */}
                </p>
              </div>
            ) : null}
            <div className="pattern">
              <SelectIconImage
                imageWidth={"100%"}
                imageHeight={"auto"}
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
              />
            </div>

            <div id="lesson-card-image">
              <SelectIconImage
                localSrc={
                  "courses/" +
                  lesson.cocos_subject_code +
                  "/icons/" +
                  lesson.id +
                  ".webp"
                }
                defaultSrc={"assets/icons/DefaultIcon.png"}
                webSrc={lesson.image || "assets/icons/DefaultIcon.png"}
                imageWidth={"60%"}
                imageHeight={"auto"}
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
              ) : isPlayed ? (
                showScoreCard ? (
                  <div>
                    <div id="lesson-card-score">
                      <LessonCardStarIcons score={score}></LessonCardStarIcons>
                    </div>

                    {/* {isLoved && <LovedIcon isLoved={isLoved} hasChapterTitle={!!lesson.chapterTitle && showChapterName} />} */}
                  </div>
                ) : (
                  <></>
                )
              ) : (
                <div />
              )}
            </div>

            {/* {isLoved && <LovedIcon isLoved={isLoved} hasChapterTitle={!!lesson.chapterTitle && showChapterName} />} */}
          </div>
          <div className="lesson-download-button-container">
            {lesson.cocos_lesson_id && (
              <DownloadLesson
                lessonId={lesson.cocos_lesson_id}
                downloadButtonLoading={downloadButtonLoading}
                onDownloadOrDelete={onDownloadOrDelete}
              />
            )}
          </div>
          {isLoved && (
            <LovedIcon
              isLoved={isLoved}
              hasChapterTitle={!!chapter?.name && showChapterName}
            />
          )}
        </div>
        <div>
          {showText ? (
            <p id={`lesson-card-name${isLoved ? "-fav-icon" : ""}`}>
              {t(lesson?.name ?? "")}
            </p>
          ) : null}
          {showChapterName && chapter?.name && (
            <div id={`chapter-title${isLoved ? "-fav-icon" : ""}`}>
              {chapter?.name}
            </div>
          )}
        </div>
      </IonCard>
    </>
  );
};

export default LessonCard;
