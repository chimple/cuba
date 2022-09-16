import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonCol,
  IonRow,
} from "@ionic/react";
import { useEffect, useState } from "react";
import ChapterSlider from "../components/ChapterSlider";
import CustomSlider from "../components/CustomSlider";
import Loading from "../components/Loading";
import SubjectDropdown from "../components/SubjectDropdown";
import { OneRosterApi } from "../services/OneRosterApi";
import { COURSES } from "../common/constants";

import "./Slider.css";
// Default theme
import "@splidejs/react-splide/css";
// or only core styles
import "@splidejs/react-splide/css/core";
import Curriculum from "../models/curriculum";
import { Chapter, Lesson } from "../interface/curriculumInterfaces";
import { Splide } from "@splidejs/react-splide";

const Slider: React.FC = () => {
  const [dataCourse, setDataCourse] = useState<{
    lessons: Lesson[];
    chapters: Chapter[];
  }>({
    lessons: [],
    chapters: [],
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [subject, setSubject] = useState<string>();
  const [customSwiperRef, setCustomSwiperRef] = useState<Splide>();
  const [isPreQuizPlayed, setIsPreQuizPlayed] = useState(false);
  const [currentChapterId, setCurrentChapterId] = useState("");
  const [chaptersMap, setChaptersMap] = useState<any>();

  useEffect(() => {
    setCourse(COURSES.SIERRA_LEONE_ENGLISH);
  }, []);
  async function setCourse(subjectCode: string) {
    setIsLoading(true);
    const curInstanse = Curriculum.getInstance();
    const lessons = await curInstanse.allLessonforSubject(subjectCode);
    const chapters = await curInstanse.allChapterforSubject(subjectCode);
    await new Promise((r) => setTimeout(r, 100));
    const apiInstance = OneRosterApi.getInstance();
    const _isPreQuizPlayed = await apiInstance.isPreQuizDone(
      subjectCode,
      "",
      ""
    );
    const tempChapterMap: any = {};
    for (let i = 0; i < chapters.length; i++) {
      tempChapterMap[chapters[i].id] = i;
    }
    setSubject(subjectCode);
    setChaptersMap(tempChapterMap);
    setDataCourse({ lessons: lessons, chapters: chapters });
    setCurrentChapterId(chapters[0].id);
    setIsPreQuizPlayed(_isPreQuizPlayed);
    setIsLoading(false);
  }
  function onChapterClick(e: any) {
    const firstLessonId = e.lessons[0].id;
    const lessonIndex = dataCourse.lessons.findIndex(
      (lesson: any) => lesson.id === firstLessonId
    );
    customSwiperRef?.go(lessonIndex);
    setCurrentChapterId(e.id);
  }
  function onCustomSlideChange(lessonIndex: number) {
    const chapter = dataCourse.lessons[lessonIndex].chapter;
    if (chapter.id === currentChapterId) return;
    const chapterIndex = chaptersMap[chapter.id];
    setCurrentChapterId(dataCourse.chapters[chapterIndex].id);
  }
  return (
    <IonPage id="slider-page">
      <IonHeader>
        <IonToolbar>
          <IonTitle text-center>
            {!isLoading ? (
              <SubjectDropdown
                onChange={async (value: any) => {
                  await setCourse(value);
                }}
                value={subject ?? COURSES.SIERRA_LEONE_ENGLISH}
              />
            ) : null}
          </IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="slider-content">
        {isLoading === false ? (
          <div className="fullheight xc">
            <IonCol className="cloumn">
              <IonRow>
                <SubjectDropdown
                  onChange={async (value: any) => {
                    await setCourse(value);
                  }}
                  value={subject ?? COURSES.SIERRA_LEONE_ENGLISH}
                />
                <ChapterSlider
                  chapterData={dataCourse.chapters}
                  onChapterClick={onChapterClick}
                  currentChapterId={currentChapterId}
                  chaptersIndex={chaptersMap[currentChapterId] ?? 0}
                />
              </IonRow>
              <CustomSlider
                lessonData={dataCourse.lessons}
                onSwiper={setCustomSwiperRef}
                onSlideChange={onCustomSlideChange}
                subjectCode={subject ?? COURSES.SIERRA_LEONE_ENGLISH}
                isPreQuizPlayed={isPreQuizPlayed}
              />
            </IonCol>
          </div>
        ) : null}
        <Loading isLoading={isLoading} />
      </IonContent>
    </IonPage>
  );
};
export default Slider;
