import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  useIonViewWillEnter,
  IonCol,
  IonRow,
} from "@ionic/react";
import { useEffect, useState } from "react";
import { ALL_COURSES, COURSES, HEADERLIST } from "../common/constants";
import Curriculum from "../models/curriculum";
import "./Home.css";
import CustomSlider from "../components/CustomSlider";
import Loading from "../components/Loading";
import ChapterSlider from "../components/ChapterSlider";
import { Chapter, Lesson } from "../interface/curriculumInterfaces";
import { Splide } from "@splidejs/react-splide";
import { OneRosterApi } from "../services/OneRosterApi";

const Home: React.FC = () => {
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
  const [currentHeader, setCurrentHeader] = useState<any>("");

  useEffect(() => {
    setCurrentHeader(HEADERLIST.ENGLISH);
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
    <IonPage id="home-page">
      <IonHeader id={"home-header"}>
        <div
          onClick={() => {
            if (currentHeader != HEADERLIST.ENGLISH) {
              setCurrentHeader(HEADERLIST.ENGLISH);
              setCourse(COURSES.SIERRA_LEONE_ENGLISH);
              console.log("English button clicked", currentHeader, subject);
            }
          }}
        >
          <img alt="EnglishIcon" src="/assets/icon/EnglishIcon.svg" />
          <p>English</p>
        </div>
        <div
          onClick={() => {
            if (currentHeader != HEADERLIST.MATHS) {
              setCurrentHeader(HEADERLIST.MATHS);
              setCourse(COURSES.SIERRA_LEONE_MATHS);
              console.log("Maths button clicked", currentHeader, subject);
            }
          }}
        >
          <img alt="MathsIcon" src="/assets/icon/MathsIcon.svg" />
          <p>Maths</p>
        </div>
        <div
          // style={{ width: "64px" }}
          onClick={() => {
            if (currentHeader != HEADERLIST.PUZZLE) {
              setCurrentHeader(HEADERLIST.PUZZLE);
              setCourse(COURSES.PUZZLE);
              console.log("Puzzle button clicked", currentHeader, subject);
            }
          }}
        >
          <img
            alt="DigitalSkillsIcon"
            src="/assets/icon/DigitalSkillsIcon.svg"
          />
          <p>Digital Skills</p>
        </div>
      </IonHeader>
      <IonContent fullscreen>
        <IonContent className="slider-content">
          {isLoading === false ? (
            <div className="fullheight xc">
              <IonCol className="cloumn">
                <IonRow>
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
      </IonContent>
    </IonPage>
  );
};
export default Home;
