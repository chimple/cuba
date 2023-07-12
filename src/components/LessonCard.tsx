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
import LovedIcon from "./LovedIcon";
import SelectIconImage from "./displaySubjects/SelectIconImage";

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
  isLoved: boolean | undefined;
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
  isLoved,
  lessonData,
  startIndex,
}) => {
  const history = useHistory();
  const [subject, setSubject] = useState<Subject>();

  // const subjectCode = lesson.chapter.course.id;
  useEffect(() => {
    if (showSubjectName) getSubject();
  }, [lesson]);

  const getSubject = async () => {
    const subjectId = lesson?.subject?.toString()?.split("/")?.at(-1);
    if (!subjectId) return;
    let subject = await ServiceConfig.getI().apiHandler.getSubject(subjectId);
    if (!subject) {
      const subjectId = lesson?.subject.path?.toString()?.split("/")?.at(-1);
      if (!subjectId) return;
      subject = await ServiceConfig.getI().apiHandler.getSubject(subjectId);
    }
    setSubject(subject);
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
          {showSubjectName && subject?.title ? (
            <div id="lesson-card-subject-name">
              <p>
                {subject?.title}
                {/* {subject.title==="English"?subject.title:t(subject.title)} */}
              </p>
            </div>
          ) : null}
          <div className="pattern">
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
            />
          </div>

          <div id="lesson-card-image">
            <SelectIconImage
              localSrc={
                "courses/" +
                lesson.cocosSubjectCode +
                "/icons/" +
                lesson.id +
                ".png"
              }
              defaultSrc={"courses/" + "en" + "/icons/" + "en33.png"}
              webSrc={lesson.thumbnail}
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
                <div id="lesson-card-score">
                  <ScoreCard score={score}></ScoreCard>
                </div>
              ) : (
                <></>
              )
            ) : (
              <div />
            )}
            {isLoved && <LovedIcon isLoved={isLoved} />}
          </div>
        </div>
      </div>
      {showText ? <p id="lesson-card-name">{t(lesson?.title)}</p> : null}
    </IonCard>
  );
};

export default LessonCard;
