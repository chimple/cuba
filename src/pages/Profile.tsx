import { IonButton, IonContent, IonPage, IonRow } from "@ionic/react";
import { useEffect, useState } from "react";
import { COURSES, MIN_PASS, PAGES } from "../common/constants";
import LessonCard from "../components/LessonCard";
import Loading from "../components/Loading";
import ProfileHeader from "../components/ProfileHeader";
import { Lesson } from "../interface/curriculumInterfaces";
import Auth from "../models/auth";
import CurriculumController from "../models/curriculumController";
import { Util } from "../utility/util";
import "./Profile.css";
import { OneRosterApi } from "../services/api/OneRosterApi";
import { useHistory } from "react-router";
import { ServiceConfig } from "../services/ServiceConfig";

const Profile: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [rewards, setRewards] = useState<any>();
  const [allLessons, setAllLessons] = useState<any>();
  const [currentCourseId, setCurrentCourseId] = useState(
    Util.getCourseByGrade(COURSES.ENGLISH)
  );
  // const [unlockUpTo, setUnlockUpTo] = useState(-1);
  const history = useHistory();
  useEffect(() => {
    if (!ServiceConfig.getI().apiHandler.currentStudent) {
      history.replace(PAGES.DISPLAY_STUDENT);
    } else {
      init();
    }
  }, []);

  async function init(subjectCode = Util.getCourseByGrade(COURSES.ENGLISH)) {
    setIsLoading(true);
    const apiInstance = OneRosterApi.getInstance();
    const tempClass = await apiInstance.getClassForUserForSubject(
      Auth.i.sourcedId,
      subjectCode
    );
    const results = await apiInstance.getResultsForStudentsForClassInLessonMap(
      tempClass?.docId ?? "",
      Auth.i.sourcedId
    );
    const curriculum = CurriculumController.getInstance();
    const tempLessons = await curriculum.allLessonForSubject(
      subjectCode,
      results
    );
    const lessons: Lesson[] = [];
    for (let i = 0; i < tempLessons.length; i++) {
      const lesson = tempLessons[i];
      if (lesson.type === "exam") {
        lessons.push(lesson);
      }
    }
    setRewards(results);
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
            "tab " +
            (currentCourseId === Util.getCourseByGrade(COURSES.ENGLISH)
              ? " active"
              : "in-active")
          }
          color={
            currentCourseId === Util.getCourseByGrade(COURSES.ENGLISH)
              ? "success"
              : ""
          }
          fill={
            currentCourseId === Util.getCourseByGrade(COURSES.ENGLISH)
              ? "solid"
              : "outline"
          }
          onClick={async () => {
            if (currentCourseId === Util.getCourseByGrade(COURSES.ENGLISH))
              return;
            await init(Util.getCourseByGrade(COURSES.ENGLISH));
          }}
          shape="round"
        >
          English
        </IonButton>
        <IonButton
          className={
            "tab " +
            (currentCourseId === Util.getCourseByGrade(COURSES.MATHS)
              ? " active"
              : "in-active")
          }
          color={
            currentCourseId === Util.getCourseByGrade(COURSES.MATHS)
              ? "success"
              : ""
          }
          // color={"success"}
          fill={
            currentCourseId === Util.getCourseByGrade(COURSES.MATHS)
              ? "solid"
              : "outline"
          }
          onClick={async () => {
            if (currentCourseId === Util.getCourseByGrade(COURSES.MATHS))
              return;

            await init(Util.getCourseByGrade(COURSES.MATHS));
          }}
          shape="round"
        >
          Maths
        </IonButton>
      </div>

      {!isLoading ? (
        <div className="wrapper">
          {allLessons?.map((lesson: Lesson, index: number) => {
            const isPLayed =
              !!rewards[lesson.id] && rewards[lesson.id].score >= MIN_PASS;
            return (
              <div></div>
              // <LessonCard
              //   width="clamp(150px,40vh,200px)"
              //   height="clamp(150px,40vh,200px)"
              //   lesson={lesson}
              //   key={index}
              //   isPlayed={isPLayed}
              //   isUnlocked={isPLayed}
              //   isHome={false}
              //   showSubjectName={false}
              //   showText={false}
              //   showScoreCard={false}
              //   score={0}
              //   lessonData={allLessons}
              //   startIndex={0}
              // />
            );
          })}
        </div>
      ) : null}
      <Loading isLoading={isLoading} />
    </IonPage>
  );
};

export default Profile;
