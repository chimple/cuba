import { IonCard } from "@ionic/react";
import { useEffect, useState } from "react";
import { useHistory } from "react-router-dom";
import { LESSON_CARD_COLORS, PAGES } from "../common/constants";
import "./LessonCard.css";
import ScoreCard from "./ScoreCard";
import React from "react";
import Lesson from "../models/lesson";
import Course from "../models/course";
import { ServiceConfig } from "../services/ServiceConfig";
import Subject from "../models/subject";
import { t } from "i18next";

const LessonCard: React.FC<{
  width: string;
  height: string;
  lesson: Lesson;
  course: Course | undefined;
  isPlayed: boolean;
  isUnlocked: boolean;
  isHome: boolean;
  showSubjectName: boolean;
  showText?: boolean;
  showScoreCard?: boolean;
  score: any;
  lessonData: Lesson[];
  startIndex: number;
}> = ({
  width,
  height,
  lesson,
  course,
  isPlayed,
  isUnlocked,
  isHome,
  showSubjectName = false,
  showText = true,
  showScoreCard = true,
  score,
  lessonData,
  startIndex,
}) => {
  const history = useHistory();
  const [showImage, setShowImage] = useState(true);
  const [subject, setSubject] = useState<Subject>();

  const hideImg = (event: any) => {
    setShowImage(false);
  };
  // const subjectCode = lesson.chapter.course.id;
  useEffect(() => {
    if (showSubjectName) getSubject();
  }, [lesson]);

  const getSubject = async () => {
    const subjectId = lesson?.subject?.toString()?.split("/")?.at(-1);
    console.log(
      "const subjectId",
      subjectId,
      lesson?.subject?.toString(),
      lesson?.subject?.id?.toString()
    );

    if (!subjectId) return;
    const subject = await ServiceConfig.getI().apiHandler.getSubject(subjectId);
    if (!subject) return;
    console.log("const subject", subject);
    setSubject(subject);
  };

  const lessonCardColor =
    LESSON_CARD_COLORS[Math.floor(Math.random() * LESSON_CARD_COLORS.length)];
  return (
    <IonCard
      id="lesson-card"
      style={{
        width: width,
        height: "auto",
      }}
      onClick={() => {
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
          //     lessonId: lesson.orig_lesson_id,
          //     lesson: lesson,
          //     from: history.location.pathname,
          //   });
          // } else {
          const parmas = `?courseid=${lesson.cocosSubjectCode}&chapterid=${lesson.cocosChapterCode}&lessonid=${lesson.id}`;
          console.log(
            "🚀 ~ file: LessonCard.tsx:73 ~ parmas:",
            parmas,
            Lesson.toJson(lesson)
          );
          history.push(PAGES.GAME + parmas, {
            url: "chimple-lib/index.html" + parmas,
            lessonId: lesson.id,
            courseDocId: course?.docId ?? lesson?.assignment?.course?.id,
            lesson: JSON.stringify(Lesson.toJson(lesson)),
            from: history.location.pathname + "?continue=true",
          });
          // }
        } else {
          console.log(lesson?.title, "lesson is locked");
        }
      }}
      // disabled={!isUnlocked}
    >
      <div
        style={{
          display: "grid",
        }}
      >
        <div
          style={{
            background: lessonCardColor,
            borderRadius: "12%",
            width: width,
            height: height,
            display: "grid",
            justifyContent: "center",
            alignItems: "center",
            gridArea: "1/1",
          }}
          color={lessonCardColor}
        >
          {showSubjectName && subject?.title ? (
            <div id="lesson-card-subject-name">
              <p>{subject?.title}</p>
            </div>
          ) : null}
          <img
            className="pattern"
            style={{
              width: width,
              height: height,
              borderRadius: "12%",
              display: "grid",
              justifyContent: "center",
              alignItems: "center",
              gridArea: "1 / 1 ",
            }}
            src={"courses/" + "sl_en1_mp" + "/icons/" + "ChallengePattern.png"}
            alt={"courses/" + "sl_en1_mp" + "/icons/" + "ChallengePattern.png"}
          ></img>

          <div id="lesson-card-image">
            {showImage ? (
              <img
                id="lesson-card-image"
                loading="lazy"
                alt={
                  "courses/" +
                  lesson.cocosSubjectCode +
                  "/icons/" +
                  lesson.id +
                  ".png"
                }
                src={
                  "courses/" +
                  lesson.cocosSubjectCode +
                  "/icons/" +
                  lesson.id +
                  ".png"
                }
                onError={hideImg}
              />
            ) : (
              <div /> // we can show Default LessonCard text or image
            )}

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
                <div id="lesson-card-score">
                  <ScoreCard score={score}></ScoreCard>
                </div>
              ) : (
                <></>
              )
            ) : (
              <div />
            )}
          </div>
        </div>
      </div>
      {showText ? <p id="lesson-card-name">{t(lesson?.title)}</p> : null}
    </IonCard>
  );
};

export default LessonCard;
