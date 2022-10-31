import { IonButton, IonContent, IonPage, IonRow } from "@ionic/react";
import { useEffect, useState } from "react";
import { COURSES } from "../common/constants";
import LessonCard from "../components/LessonCard";
import Loading from "../components/Loading";
import ProfileHeader from "../components/ProfileHeader";
import { Lesson } from "../interface/curriculumInterfaces";
import Curriculum from "../models/curriculum";
import { OneRosterApi } from "../services/OneRosterApi";
import "./Profile.css";

const Profile: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [rewards, setRewards] = useState<any>();
  const [allLessons, setAllLessons] = useState<any>();
  const [currentCourseId, setCurrentCourseId] = useState(COURSES.ENGLISH);
  const [unlockUpTo, setUnlockUpTo] = useState(-1);

  useEffect(() => {
    init();
  }, []);

  async function init(subjectCode = COURSES.ENGLISH) {
    setIsLoading(true);
    const results =
      await OneRosterApi.getInstance().getResultsForStudentForClass("", "");
    const curriculum = Curriculum.getInstance();
    const tempLessons = await curriculum.allLessonforSubject(subjectCode);
    let lessonMap = rewards;
    if (!rewards) {
      const tempLessonMap: any = {};
      for (const result of results) {
        if (!tempLessonMap[result.metadata?.lessonId]) {
          tempLessonMap[result.metadata?.lessonId] = result.score;
        }
      }
      setRewards(tempLessonMap);
      lessonMap = tempLessonMap;
    }
    const lessons: Lesson[] = [];
    let tempUnlockUpTo = -1;

    for (let i = 0; i < tempLessons.length; i++) {
      const lesson = tempLessons[i];
      if (lesson.type === "exam") {
        lessons.push(lesson);
        const isUnlocked = !!lessonMap[lesson.id] && lessonMap[lesson.id] > 0;
        if (isUnlocked) {
          tempUnlockUpTo = lessons.length - 1;
        }
      }
    }
    setUnlockUpTo(tempUnlockUpTo);
    setCurrentCourseId(subjectCode);
    setAllLessons(lessons);
    setIsLoading(false);
  }
  return (
    <IonPage>
      <ProfileHeader />
      <div className="tabs">
        <IonButton
          className={
            "tab " + (currentCourseId === COURSES.ENGLISH ? " active" : "")
          }
          color={"success"}
          fill={currentCourseId === COURSES.ENGLISH ? "solid" : "outline"}
          onClick={async () => {
            if (currentCourseId === COURSES.ENGLISH) return;
            await init(COURSES.ENGLISH);
          }}
          shape="round"
        >
          English
        </IonButton>
        <IonButton
          className={
            "tab " + (currentCourseId === COURSES.MATHS ? " active" : "")
          }
          color={"success"}
          fill={currentCourseId === COURSES.MATHS ? "solid" : "outline"}
          onClick={async () => {
            if (currentCourseId === COURSES.MATHS) return;

            await init(COURSES.MATHS);
          }}
          shape="round"
        >
          Maths
        </IonButton>
      </div>
      <IonContent>
        {!isLoading ? (
          <div className="wrapper">
            {allLessons?.map((lesson: Lesson, index: number) => {
              const isUnlocked = index <= unlockUpTo;
              const isPLayed = !!rewards[lesson.id] && rewards[lesson.id] > 0;
              return (
                <LessonCard
                  width="clamp(150px,40vh,200px)"
                  height="clamp(150px,40vh,200px)"
                  lesson={lesson}
                  key={index}
                  isPlayed={isPLayed}
                  isUnlocked={isUnlocked}
                  subjectCode={lesson.chapter.course.id}
                  showText={false}
                  showScoreCard={false}
                  score={0}
                />
              );
            })}
          </div>
        ) : null}
        <Loading isLoading={isLoading} />
      </IonContent>
    </IonPage>
  );
};

export default Profile;
