import React, { useEffect, useState, useRef } from "react";
import "./ShowChapters.css";
import { useHistory } from "react-router";
import Header from "../components/homePage/Header";
import {
  AssignmentSource,
  COURSES,
  PAGES,
  TableTypes,
  belowGrade1,
  grade1,
} from "../../common/constants";
import { ServiceConfig } from "../../services/ServiceConfig";
import ChapterContainer from "../components/library/ChapterContainer";
import AssigmentCount from "../components/library/AssignmentCount";
import { Util } from "../../utility/util";
import { t } from "i18next";

interface ShowChaptersProps {}

const ShowChapters: React.FC<ShowChaptersProps> = ({}) => {
  const [currentClass, setCurrentClass] = useState<TableTypes<"class"> | null>(
    null
  );
  const currentSchool = Util.getCurrentSchool();
  const history = useHistory();
  const course: TableTypes<"course"> = history.location.state![
    "course"
  ] as TableTypes<"course">;
  const [lessons, setLessons] = useState<Map<string, TableTypes<"lesson">[]>>();
  const [chapters, setChapters] = useState<TableTypes<"chapter">[]>();
  const [currentUser, setCurrentUser] = useState<TableTypes<"user">>();
  const [courseCode, setCourseCode] = useState<string>();
  const [assignmentCount, setAssignmentCount] = useState<number>(0);
  const [classSelectedLesson, setClassSelectedLesson] = useState<
    Map<string, Partial<Record<AssignmentSource, string[]>>>
  >(new Map());
  const [selectedLesson, setSelectedLesson] = useState<Map<string, string>>(
    new Map()
  );
  const [isShowAssigned, setIsShowAssigned] = useState<boolean>(false);
  const [assignedLessonIds, setAssignedLessonIds] = useState<Set<string>>(
    new Set()
  );
  const [hasLoadedAssignedLessons, setHasLoadedAssignedLessons] =
    useState<boolean>(false);
  const [isLoadingAssignedLessons, setIsLoadingAssignedLessons] =
    useState<boolean>(false);

  const chapterRefs = useRef<(HTMLDivElement | null)[]>([]); // Create an array of refs for each chapter
  const auth = ServiceConfig.getI().authHandler;
  const api = ServiceConfig.getI().apiHandler;
  const current_class = Util.getCurrentClass();
  const isGrade1 =
    course.grade_id === grade1 || course.grade_id === belowGrade1;
  const selectedCourseName =
    course.code === COURSES.ENGLISH
      ? course.name ?? ""
      : t(course.name ?? "");
  const selectedCourseGrade =
    course.code === COURSES.ENGLISH
      ? `Grade ${isGrade1 ? "1" : "2"}`
      : `${t("Grade")} ${isGrade1 ? "1" : "2"}`;

  const formatLocalDate = (date: Date) => {
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, "0");
    const day = `${date.getDate()}`.padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  useEffect(() => {
    const fetchClassDetails = async () => {
      try {
        const tempClass = await Util.getCurrentClass();
        setCurrentClass(tempClass || null);
      } catch (err) {
        console.error("ShowChapters → Failed to load current class:", err);
        setCurrentClass(null);
      }
    };
    fetchClassDetails();
  }, []);

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
    const course_data = await api.getCourse(course.id);
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
      const class_sync_lesson: Map<
        string,
        Partial<Record<AssignmentSource, string[]>>
      > = new Map(
        Object.entries(sync_lesson_data ? JSON.parse(sync_lesson_data) : {})
      );
      setClassSelectedLesson(class_sync_lesson);
      let _assignmentCount = 0;
      class_sync_lesson.forEach((sourceMap) => {
        const manual = sourceMap[AssignmentSource.MANUAL] || [];
        const qr = sourceMap[AssignmentSource.QR_CODE] || [];
        _assignmentCount += manual.length + qr.length;
      });
      setAssignmentCount(_assignmentCount);
    }

    setChapters(chapter_res);
    setLessons(lesson_map);
    setCourseCode(course_data?.code ?? "");
  };

  const handleOnLessonClick = (lesson, chapter) => {
    history.replace(PAGES.LESSON_DETAILS, {
      course: course,
      lesson: lesson,
      chapterId: chapter.id,
      selectedLesson: selectedLesson,
    });
  };

  // const handleSelectedLesson = (chapterId: string, lessonIds: string[]) => {
  //   if (lessonIds !== undefined) {
  //     const newClassSelectedLesson = new Map(classSelectedLesson);
  //     const existing = newClassSelectedLesson.get(chapterId) ?? {};
  //     newClassSelectedLesson.set(chapterId, {
  //       ...existing,
  //       [AssignmentSource.MANUAL]: lessonIds,
  //     });
  //     setClassSelectedLesson(newClassSelectedLesson);

  //     const _selectedLessonJson = JSON.stringify(
  //       Object.fromEntries(newClassSelectedLesson)
  //     );
  //     const newSelectedLesson = new Map(selectedLesson);
  //     newSelectedLesson.set(current_class?.id ?? "", _selectedLessonJson);
  //     setSelectedLesson(newSelectedLesson);

  //     const _totalSelectedLessonJson = JSON.stringify(
  //       Object.fromEntries(newSelectedLesson)
  //     );
  //     syncSelectedLesson(_totalSelectedLessonJson);

  //     let _assignmentCount = 0;
  //     for (const value of newClassSelectedLesson.values()) {
  //       const manual = value[AssignmentSource.MANUAL] || [];
  //       const qr = value[AssignmentSource.QR_CODE] || [];
  //       _assignmentCount += manual.length + qr.length;
  //     }
  //     setAssignmentCount(_assignmentCount);
  //   }
  // };

  const updateLessonSelection = (
    chapterId: string,
    lessonId: string,
    isSelected: boolean
  ) => {
    setClassSelectedLesson((prevClassSelectedLesson) => {
      const newClassSelectedLesson = new Map(prevClassSelectedLesson);
      const existing = { ...newClassSelectedLesson.get(chapterId) };

      if (isSelected) {
        const manual = new Set(existing[AssignmentSource.MANUAL] || []);
        manual.add(lessonId);
        existing[AssignmentSource.MANUAL] = Array.from(manual);
      } else {
        const manual = new Set(existing[AssignmentSource.MANUAL] || []);
        const qr = new Set(existing[AssignmentSource.QR_CODE] || []);

        if (manual.has(lessonId)) {
          manual.delete(lessonId);
        } else if (qr.has(lessonId)) {
          qr.delete(lessonId);
        }

        existing[AssignmentSource.MANUAL] = Array.from(manual);
        existing[AssignmentSource.QR_CODE] = Array.from(qr);
      }

      newClassSelectedLesson.set(chapterId, existing);

      const _selectedLessonJson = JSON.stringify(
        Object.fromEntries(newClassSelectedLesson)
      );

      setSelectedLesson((prevSelectedLesson) => {
        const newSelectedLesson = new Map(prevSelectedLesson);
        newSelectedLesson.set(current_class?.id ?? "", _selectedLessonJson);
        syncSelectedLesson(JSON.stringify(Object.fromEntries(newSelectedLesson)));
        return newSelectedLesson;
      });

      let _assignmentCount = 0;
      for (const value of newClassSelectedLesson.values()) {
        const manual = value[AssignmentSource.MANUAL] || [];
        const qr = value[AssignmentSource.QR_CODE] || [];
        _assignmentCount += manual.length + qr.length;
      }
      setAssignmentCount(_assignmentCount);

      return newClassSelectedLesson;
    });
  };

  const loadAssignedLessonsForCourse = async () => {
    if (hasLoadedAssignedLessons || isLoadingAssignedLessons) return;
    const userId = currentUser?.id ?? (await auth.getCurrentUser())?.id;
    const classId = currentClass?.id ?? current_class?.id;
    if (!userId || !classId || !course?.id) return;

    setIsLoadingAssignedLessons(true);
    try {
      const endDate = formatLocalDate(new Date());
      const startDateObj = new Date();
      startDateObj.setDate(startDateObj.getDate() - 9);
      const startDate = formatLocalDate(startDateObj);

      const { classWiseAssignments, individualAssignments } =
        await api.getAssignmentsByAssignerAndClass(
          userId,
          classId,
          startDate,
          endDate
        );

      const assignedIds = new Set<string>();
      [...classWiseAssignments, ...individualAssignments].forEach(
        (assignment) => {
          if (
            assignment?.lesson_id &&
            String(assignment.course_id ?? "") === String(course.id)
          ) {
            assignedIds.add(String(assignment.lesson_id));
          }
        }
      );

      setAssignedLessonIds(assignedIds);
      setHasLoadedAssignedLessons(true);
    } catch (error) {
      console.error("Failed to load assigned lessons for course:", error);
    } finally {
      setIsLoadingAssignedLessons(false);
    }
  };

  const handleShowAssignedClick = async () => {
    const nextShowAssigned = !isShowAssigned;
    setIsShowAssigned(nextShowAssigned);
    if (nextShowAssigned) {
      await loadAssignedLessonsForCourse();
    }
  };

  return (
    <div className="chapter-container">
      <Header
        isBackButton={true}
        onBackButtonClick={() => {
          history.replace(PAGES.HOME_PAGE, { tabValue: 1 });
        }}
        customText="Library"
        showSearchIcon={true}
        onSearchIconClick={() => history.replace(PAGES.SEARCH_LESSON)}
      />
      <main className="container-body">
        <div className="show-chapters-course-row">
          <div className="show-chapters-course-name">
            {`${selectedCourseName} ${selectedCourseGrade}`}
          </div>
          <button
            type="button"
            className={`show-chapters-assigned-btn${
              isShowAssigned ? " is-active" : ""
            }`}
            onClick={handleShowAssignedClick}
            disabled={isLoadingAssignedLessons}
          >
            {isShowAssigned ? (
              <>
                <span className="show-chapters-assigned-icon" aria-hidden="true">
                  <img src="assets/icons/assignmentSelect.svg" alt="" />
                </span>
                {t("Assigned")}
              </>
            ) : (
              t("Show Assigned")
            )}
          </button>
        </div>
        <div className="lesson-grid">
          {chapters?.map((chapter, index) => (
            <div
              key={chapter.id}
              ref={(el) => {
                chapterRefs.current[index] = el;
              }}
            >
              <ChapterContainer
                chapter={chapter}
                isOpened={chapterId === chapter.id}
                syncSelectedLessons={[
                  ...(classSelectedLesson.get(chapter.id)?.[
                    AssignmentSource.MANUAL
                  ] ?? []),
                  ...(classSelectedLesson.get(chapter.id)?.[
                    AssignmentSource.QR_CODE
                  ] ?? []),
                ]}
                lessons={lessons?.get(chapter.id) ?? []}
                chapterSelectedLessons={updateLessonSelection}
                lessonClickCallBack={(lesson) => {
                  handleOnLessonClick(lesson, chapter);
                }}
                courseCode={courseCode}
                showAssignedBadge={isShowAssigned}
                assignedLessonIds={assignedLessonIds}
              />
            </div>
          ))}
        </div>
        <AssigmentCount
          assignments={assignmentCount}
          onClick={() => {
            history.replace(PAGES.TEACHER_ASSIGNMENT);
          }}
        />
      </main>
    </div>
  );
};

export default ShowChapters;
