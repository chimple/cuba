import { IonContent, IonPage } from "@ionic/react";
import { useEffect, useState } from "react";
import { ALL_COURSES } from "../common/constants";
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

  useEffect(() => {
    init();
  }, []);

  async function init() {
    setIsLoading(true);
    const results =
      await OneRosterApi.getInstance().getResultsForStudentForClass("", "");
    if (results.length === 0) {
      setIsLoading(false);
      return;
    }
    const curriculum = Curriculum.getInstance();
    await curriculum.loadCourseJsons(ALL_COURSES);
    const allLessons = new Map(curriculum.allLessons);
    const tempLessonsPlayed = [];
    const tempLessonMap: any = {};
    for (const result of results) {
      const lesson = allLessons.get(result.metadata?.lessonId);
      if (lesson?.type === "exam" && !tempLessonMap[lesson.id]) {
        tempLessonsPlayed.push(lesson);
        tempLessonMap[lesson.id] = result.score;
        allLessons.delete(lesson.id);
      }
    }
    setRewards(tempLessonMap);
    setAllLessons(tempLessonsPlayed.concat(Array.from(allLessons.values())));
    setIsLoading(false);
  }

  return (
    <IonPage>
      <ProfileHeader />
      <IonContent>
        {!isLoading ? (
          <div className="wrapper">
            {allLessons?.map((lesson: Lesson, index: number) => {
              if (lesson.type !== "exam") return null;
              const isUnlocked = !!rewards[lesson.id] && rewards[lesson.id] > 0;
              return (
                <LessonCard
                  width="200"
                  height="200"
                  lesson={lesson}
                  key={index}
                  isPlayed={false}
                  isUnlocked={isUnlocked}
                  subjectCode={lesson.chapter.course.id}
                />
              );
            })}
          </div>
        ) : null}
      </IonContent>
      <Loading isLoading={isLoading} />
    </IonPage>
  );
};

export default Profile;
