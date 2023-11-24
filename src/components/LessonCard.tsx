import { IonCard } from "@ionic/react";
import { useEffect, useState } from "react";
import { useHistory } from "react-router-dom";
import { CONTINUE, LESSON_CARD_COLORS, PAGES } from "../common/constants";
import "./LessonCard.css";
import LessonCardStarIcons from "./LessonCardStarIcons";
import React from "react";
import Lesson from "../models/lesson";
import Course from "../models/course";
import { ServiceConfig } from "../services/ServiceConfig";
import Subject from "../models/subject";
import { t } from "i18next";
import LovedIcon from "./LovedIcon";
import SelectIconImage from "./displaySubjects/SelectIconImage";
import { Util } from "../utility/util";
import DownloadLesson from "./DownloadChapterAndLesson";

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
  showChapterName: boolean;
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
  showChapterName = false,
}) => {
  const history = useHistory();
  const [showImage, setShowImage] = useState(true);
  const [subject, setSubject] = useState<Subject>();
  // const [subject, setSubject] = useState<Subject>();
  const [currentCourse, setCurrentCourse] = useState<Course>();

  const hideImg = (event: any) => {
    setShowImage(false);
  };
  // const subjectCode = lesson.chapter.course.id;
  useEffect(() => {
    // getSubject();
    getCurrentCourse();
  }, [lesson]);

  // const getSubject = async () => {
  //   const subjectId = lesson?.subject?.toString()?.split("/")?.at(-1);
  //   if (!subjectId) return;
  //   let subject = await ServiceConfig.getI().apiHandler.getSubject(subjectId);
  //   if (!subject) {
  //     const subjectId = lesson?.subject.path?.toString()?.split("/")?.at(-1);
  //     if (!subjectId) return;
  //     subject = await ServiceConfig.getI().apiHandler.getSubject(subjectId);
  //   }
  //   setSubject(subject);
  // };

  const getCurrentCourse = async () => {
    const currentStudent = Util.getCurrentStudent();
    if (!currentStudent) {
      return;
    }
    const api = ServiceConfig.getI().apiHandler;
    const courses = await api.getCoursesForParentsStudent(currentStudent);
    console.log("Student Courses ", courses);

    let currentCourse = courses.find(
      (course) => lesson.cocosSubjectCode === course.courseCode
    );

    console.log("current Course ", currentCourse);
    if (!currentCourse) {
      let lessonCourse = await api.getCourseFromLesson(lesson);
      if (!!lessonCourse) {
        console.log("current Course from all courses ", lessonCourse);
        setCurrentCourse(lessonCourse);
      }
    } else {
      setCurrentCourse(currentCourse);
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
          //     lessonId: lesson.orig_lesson_id,
          //     lesson: lesson,
          //     from: history.location.pathname,
          //   });
          // } else {
          // console.log("LessonCard course: subject,", subject);
          console.log("LessonCard course: course,", currentCourse);

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
            course: JSON.stringify(Course.toJson(currentCourse!)),
            lesson: JSON.stringify(Lesson.toJson(lesson)),
            from: history.location.pathname + `?${CONTINUE}=true`,
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
          <div id="lesson-card-homework-icon">
            {lesson.assignment != undefined ? (
              <div>
                <img
                  src="assets/icons/homework_icon.svg"
                  className="lesson-card-homework-indicator"
                />
              </div>
            ) : null}
          </div>
          {showSubjectName && currentCourse?.title ? (
            <div id="lesson-card-subject-name">
              <p>
                {currentCourse?.title}
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
                ".webp"
              }
              defaultSrc={"courses/" + "en" + "/icons/" + "en38.webp"}
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
        <div className="download-lesson-button-container">
          <DownloadLesson lessonID={lesson.id} lessonData={lessonData} />
        </div>
        {isLoved && (
          <LovedIcon
            isLoved={isLoved}
            hasChapterTitle={!!lesson.chapterTitle && showChapterName}
          />
        )}
      </div>
      <div className="titles">
        {showText ? (
          <p id={`lesson-card-name${isLoved ? "-fav-icon" : ""}`}>
            {t(lesson?.title)}
          </p>
        ) : null}
        {showChapterName && lesson.chapterTitle && (
          <div id={`chapter-title${isLoved ? "-fav-icon" : ""}`}>
            {lesson.chapterTitle}
          </div>
        )}
      </div>
    </IonCard>
  );
};

export default LessonCard;
