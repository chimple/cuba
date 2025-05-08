import React, { useEffect, useState, useRef } from "react";
import "./ShowChapters.css";
import { useHistory } from "react-router";
import Header from "../components/homePage/Header";
import { PAGES, TableTypes } from "../../common/constants";
import { ServiceConfig } from "../../services/ServiceConfig";
import ChapterContainer from "../components/library/ChapterContainer";
import AssigmentCount from "../components/library/AssignmentCount";
import { Util } from "../../utility/util";

interface ShowChaptersProps {}

const ShowChapters: React.FC<ShowChaptersProps> = ({}) => {
  const history = useHistory();
  const course: TableTypes<"course"> = history.location.state![
    "course"
  ] as TableTypes<"course">;
  const [lessons, setLessons] = useState<Map<string, TableTypes<"lesson">[]>>();
  const [chapters, setChapters] = useState<TableTypes<"chapter">[]>();
  const [currentUser, setCurrentUser] = useState<TableTypes<"user">>();
  const [assignmentCount, setAssignmentCount] = useState<number>(0);
  const [classSelectedLesson, setClassSelectedLesson] = useState<
    Map<string, string[]>
  >(new Map());
  const [selectedLesson, setSelectedLesson] = useState<Map<string, string>>(
    new Map()
  );

  const chapterRefs = useRef<(HTMLDivElement | null)[]>([]); // Create an array of refs for each chapter
  const auth = ServiceConfig.getI().authHandler;
  const api = ServiceConfig.getI().apiHandler;
  const current_class = Util.getCurrentClass();

  useEffect(() => {
    init();
  }, []);

  useEffect(() => {
    // Scroll to the chapterId when chapters are set
    if (chapters) {
      const chapterIndex = chapters.findIndex(
        (chapter) => chapter.id === chapterId
      );
      if (chapterIndex !== -1 && chapterRefs.current[chapterIndex]) {
        chapterRefs.current[chapterIndex]?.scrollIntoView({
          behavior: "auto",
        });
      }
    }
  }, [chapters]);

  const syncSelectedLesson = async (lesson) => {
    if (currentUser?.id)
      await api.createOrUpdateAssignmentCart(currentUser?.id, lesson);
  };

  const chapterId: string = history.location.state!["chapterId"] as string;

  const init = async () => {
    const currUser = await auth.getCurrentUser();
    setCurrentUser(currUser);
    const chapter_res = await api.getChaptersForCourse(course.id);
    const lesson_map: Map<string, TableTypes<"lesson">[]> = new Map();
    for (const chapter of chapter_res) {
      const lessons = await api.getLessonsForChapter(chapter.id);
      lesson_map.set(chapter.id, lessons);
    }
    const previous_sync_lesson = currUser?.id
      ? await api.getUserAssignmentCart(currUser?.id)
      : null;
    if (previous_sync_lesson?.lessons) {
      const sync_lesson: Map<string, string> = new Map(
        Object.entries(JSON.parse(previous_sync_lesson?.lessons))
      );
      setSelectedLesson(sync_lesson);
      const sync_lesson_data = sync_lesson.get(current_class?.id ?? "");
      const class_sync_lesson: Map<string, string[]> = new Map(
        Object.entries(sync_lesson_data ? JSON.parse(sync_lesson_data) : {})
      );
      setClassSelectedLesson(class_sync_lesson);
    }

    setChapters(chapter_res);
    setLessons(lesson_map);
  };

  const handleOnLessonClick = (lesson, chapter) => {
    history.replace(PAGES.LESSON_DETAILS, {
      course: course,
      lesson: lesson,
      chapterId: chapter.id,
      selectedLesson: selectedLesson,
    });
  };

  const handleSelectedLesson = (chapterId, lessons) => {
    if (lessons !== undefined) {
      const tmpselectedLesson = new Map(selectedLesson);
      const newSelectedLesson = new Map(classSelectedLesson);
      newSelectedLesson.set(chapterId, lessons);
      setClassSelectedLesson(newSelectedLesson);
      const _selectedLesson = JSON.stringify(
        Object.fromEntries(newSelectedLesson)
      );
      tmpselectedLesson.set(current_class?.id ?? "", _selectedLesson);
      setSelectedLesson(tmpselectedLesson);
      const _totalSelectedLesson = JSON.stringify(
        Object.fromEntries(tmpselectedLesson)
      );
      syncSelectedLesson(_totalSelectedLesson);
      let _assignmentCount = 0;
      for (const value of newSelectedLesson.values()) {
        _assignmentCount += value.length;
      }
      setAssignmentCount(_assignmentCount);
    }
  };

  return (
    <div className="chapter-container">
      <Header
        isBackButton={true}
        onButtonClick={() => {
          history.replace(PAGES.HOME_PAGE, { tabValue: 1 });
        }}
      />
      <main className="container-body">
        <div className="lesson-grid">
          {chapters?.map((chapter, index) => (
            <div
              key={chapter.id}
              ref={(el) => (chapterRefs.current[index] = el)} // Assign the ref to each chapter
            >
              <ChapterContainer
                chapter={chapter}
                isOpened={chapterId === chapter.id}
                syncSelectedLessons={classSelectedLesson.get(chapter.id) ?? []}
                lessons={lessons?.get(chapter.id) ?? []}
                chapterSelectedLessons={handleSelectedLesson}
                lessonClickCallBack={(lesson) => {
                  handleOnLessonClick(lesson, chapter);
                }}
              />
            </div>
          ))}
        </div>
        <AssigmentCount
          assignments={assignmentCount}
          onClick={() => {
            history.replace(PAGES.HOME_PAGE, { tabValue: 2 });
          }}
        />
      </main>
    </div>
  );
};

export default ShowChapters;
