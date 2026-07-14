import { useEffect, useState } from "react";
import { Util } from "../utility/util";
import ChapterLessonBox from "./learningPathway/chapterLessonBox";
import PathwayStructure from "./learningPathway/PathwayStructure";
import "./LearningPathway.css";
import TressureBox from "./learningPathway/TressureBox";
import DropdownMenu from "./Home/DropdownMenu";
import { ServiceConfig } from "../services/ServiceConfig";
import Loading from "./Loading";
import { schoolUtil } from "../utility/schoolUtil";
import { v4 as uuidv4 } from "uuid";
import {
  EVENTS,
  LATEST_STARS,
  STARS_COUNT,
  TableTypes,
} from "../common/constants";
import { updateLocalAttributes, useGbContext } from "../growthbook/Growthbook";

const LearningPathway: React.FC = () => {
  const api = ServiceConfig.getI().apiHandler;
  const [loading, setLoading] = useState<boolean>(false);
  const [from, setFrom] = useState<number>(0);
  const [to, setTo] = useState<number>(0);
  const currentStudent = Util.getCurrentStudent();
  const { setGbUpdated } = useGbContext();

  useEffect(() => {
    if (!currentStudent?.id) return;
    updateStarCount(currentStudent);
    fetchLearningPathway(currentStudent);
  }, []);
  const updateStarCount = async (currentStudent: TableTypes<"user">) => {
    const storedStarsJson = localStorage.getItem(STARS_COUNT);
    const storedStarsMap = storedStarsJson ? JSON.parse(storedStarsJson) : {};
    const localStorageStars = parseInt(
      storedStarsMap[currentStudent.id] || "0",
      10
    );

    const latestStarsJson = localStorage.getItem(LATEST_STARS);
    const latestStarsMap = latestStarsJson ? JSON.parse(latestStarsJson) : {};

    const latestLocalStars = parseInt(
      latestStarsMap[currentStudent.id] || "0",
      10
    );
    const dbStars = currentStudent.stars || 0;
    const studentStars = Math.max(latestLocalStars, dbStars);

    if (localStorageStars < studentStars) {
      storedStarsMap[currentStudent.id] = studentStars;
      localStorage.setItem(STARS_COUNT, JSON.stringify(storedStarsMap));
      setFrom(localStorageStars);
      setTo(studentStars);
    } else {
      setFrom(studentStars);
      setTo(studentStars);
    }

    if (latestLocalStars <= dbStars) {
      latestStarsMap[currentStudent.id] = dbStars;
      localStorage.setItem(LATEST_STARS, JSON.stringify(latestStarsMap));
    } else {
      await api.updateStudentStars(currentStudent.id, latestLocalStars);
    }
  };

  const fetchLearningPathway = async (student: any) => {
    let currClass;
    const isLinked = await api.isStudentLinked(student.id);
    if (isLinked) {
      currClass = schoolUtil.getCurrentClass();
    }
    try {
      const userCourses = currClass
        ? await api.getCoursesForClassStudent(currClass.id)
        : await api.getCoursesForPathway(student.id);

      let learningPath = student.learning_path
        ? JSON.parse(student.learning_path)
        : null;
      if (!learningPath || !learningPath.courses?.courseList?.length) {
        setLoading(true);
        learningPath = await buildInitialLearningPath(userCourses);
        await saveLearningPath(student, learningPath, true);
        setLoading(false);
      } else {
        const updated = await updateLearningPathIfNeeded(
          learningPath,
          userCourses
        );

        let learning_path_completed: { [key: string]: number } = {};
        learningPath.courses.courseList.forEach((course) => {
          const { subject_id, currentIndex } = course;
          if (subject_id && currentIndex !== undefined) {
            learning_path_completed[`${subject_id}_path_completed`] =
              currentIndex;
          }
        });
        updateLocalAttributes({ learning_path_completed });
        setGbUpdated(true);

        if (updated) {
          await saveLearningPath(student, learningPath);
          window.dispatchEvent(
            new CustomEvent("courseChanged", {
              detail: {
                currentStudent: {
                  ...student,
                  learning_path: JSON.stringify(learningPath),
                },
              },
            })
          );
        }
      }
    } catch (error) {
      console.error("Error in Learning Pathway", error);
    } finally {
      setLoading(false);
    }
  };

  const buildInitialLearningPath = async (courses: any[]) => {
    const courseList = await Promise.all(
      courses.map(async (course) => ({
        path_id: uuidv4(),
        course_id: course.id,
        subject_id: course.subject_id,
        path: await buildLessonPath(course.id),
        startIndex: 0,
        currentIndex: 0,
        pathEndIndex: 4,
      }))
    );

    return {
      courses: {
        courseList,
        currentCourseIndex: 0,
      },
    };
  };

  const updateLearningPathIfNeeded = async (
    learningPath: any,
    userCourses: any[]
  ) => {
    let updated = normalizeLearningPath(learningPath);
    const oldCourseList = learningPath.courses?.courseList || [];
    const oldCoursesById = new Map<string, any>(
      oldCourseList.map((course: any) => [course.course_id, course])
    );
    const previousCurrentCourse =
      oldCourseList[learningPath.courses.currentCourseIndex];
    const nextCourseList = await Promise.all(
      userCourses.map(async (course) => {
        const existingCourse = oldCoursesById.get(course.id);
        const shouldReuseExistingCourse =
          existingCourse &&
          existingCourse.path_id &&
          !(await hasInvalidCoursePathContent(existingCourse));

        if (shouldReuseExistingCourse) {
          if (existingCourse.subject_id !== course.subject_id) {
            existingCourse.subject_id = course.subject_id;
            updated = true;
          }
          return existingCourse;
        }

        updated = true;
        return buildCoursePath(course, existingCourse?.path_id);
      })
    );

    const oldCourseIds = oldCourseList.map((course: any) => course.course_id);
    const nextCourseIds = nextCourseList.map((course: any) => course.course_id);
    const courseListChanged =
      oldCourseIds.length !== nextCourseIds.length ||
      oldCourseIds.some((courseId: string, index: number) => {
        return courseId !== nextCourseIds[index];
      });

    if (courseListChanged || updated) {
      learningPath.courses.courseList = nextCourseList;
      updated = true;
    }

    const nextCurrentCourseIndex = previousCurrentCourse
      ? nextCourseList.findIndex(
          (course: any) => course.course_id === previousCurrentCourse.course_id
        )
      : -1;
    const normalizedCourseIndex =
      nextCurrentCourseIndex >= 0
        ? nextCurrentCourseIndex
        : Math.min(
            Math.max(learningPath.courses.currentCourseIndex ?? 0, 0),
            Math.max(nextCourseList.length - 1, 0)
          );

    if (learningPath.courses.currentCourseIndex !== normalizedCourseIndex) {
      learningPath.courses.currentCourseIndex = normalizedCourseIndex;
      updated = true;
    }

    if (!updated) {
      return false;
    }

    return true;
  };

  const buildCoursePath = async (course: any, pathId?: string) => {
    const path = await buildLessonPath(course.id);
    return {
      path_id: pathId || uuidv4(),
      course_id: course.id,
      subject_id: course.subject_id,
      path,
      startIndex: 0,
      currentIndex: 0,
      pathEndIndex: Math.min(4, Math.max(path.length - 1, 0)),
    };
  };

  const hasInvalidCoursePathContent = async (course: any) => {
    if (isLegacySingleNodePath(course)) return true;

    const currentIndex = Number.isInteger(course.currentIndex)
      ? course.currentIndex
      : 0;
    const currentPathItem = course.path?.[currentIndex];
    if (!currentPathItem?.lesson_id || !currentPathItem?.chapter_id) {
      return true;
    }

    const [lesson, chapter] = await Promise.all([
      api.getLesson(currentPathItem.lesson_id),
      api.getChapterById(currentPathItem.chapter_id),
    ]);
    return !lesson || !chapter;
  };

  const isLegacySingleNodePath = (course: any) => {
    const path = course?.path;
    const firstPathItem = path?.[0];
    const hasLegacyPathItemFields =
      firstPathItem &&
      ("is_assessment" in firstPathItem || "isPlayed" in firstPathItem);

    return (
      Array.isArray(path) &&
      path.length <= 1 &&
      (course.type === "chapter" ||
        course.pathMode === "chapter" ||
        hasLegacyPathItemFields)
    );
  };

  const normalizeLearningPath = (learningPath: any) => {
    const courseList = learningPath?.courses?.courseList;
    if (!Array.isArray(courseList) || courseList.length === 0) return false;

    let updated = false;
    const hasChapterLessonPath = courseList.some((course: any) =>
      course.path?.some(
        (item: any) => item?.chapter_id && item?.is_assessment !== true
      )
    );

    if (hasChapterLessonPath && (learningPath.type || learningPath.pathMode)) {
      delete learningPath.type;
      delete learningPath.pathMode;
      updated = true;
    }

    const currentCourseIndex = Number.isInteger(
      learningPath.courses.currentCourseIndex
    )
      ? learningPath.courses.currentCourseIndex
      : 0;
    const normalizedCourseIndex = Math.min(
      Math.max(currentCourseIndex, 0),
      courseList.length - 1
    );

    if (learningPath.courses.currentCourseIndex !== normalizedCourseIndex) {
      learningPath.courses.currentCourseIndex = normalizedCourseIndex;
      updated = true;
    }

    courseList.forEach((course: any) => {
      if (!course.path_id) {
        course.path_id = uuidv4();
        updated = true;
      }

      if (!Array.isArray(course.path) || course.path.length === 0) return;

      const firstUnplayedIndex = course.path.findIndex(
        (item: any) => item?.isPlayed === false
      );
      const legacyCompletedPath = Number.isInteger(course.completedPath)
        ? course.completedPath
        : 0;
      const inferredCurrentIndex =
        firstUnplayedIndex >= 0 ? firstUnplayedIndex : legacyCompletedPath;
      const currentIndex = Number.isInteger(course.currentIndex)
        ? course.currentIndex
        : inferredCurrentIndex;
      const normalizedCurrentIndex = Math.min(
        Math.max(currentIndex, 0),
        course.path.length - 1
      );

      if (course.currentIndex !== normalizedCurrentIndex) {
        course.currentIndex = normalizedCurrentIndex;
        updated = true;
      }

      const expectedStartIndex = Math.floor(normalizedCurrentIndex / 5) * 5;
      const hasValidWindow =
        Number.isInteger(course.startIndex) &&
        Number.isInteger(course.pathEndIndex) &&
        course.startIndex <= normalizedCurrentIndex &&
        course.pathEndIndex >= normalizedCurrentIndex &&
        course.pathEndIndex < course.path.length;

      if (!hasValidWindow) {
        course.startIndex = expectedStartIndex;
        course.pathEndIndex = Math.min(
          expectedStartIndex + 4,
          course.path.length - 1
        );
        updated = true;
      }
    });

    return updated;
  };

  const buildLessonPath = async (courseId: string) => {
    const chapters = await api.getChaptersForCourse(courseId);
    const lessons = await Promise.all(
      chapters.map(async (chapter) => {
        const lessons = await api.getLessonsForChapter(chapter.id);
        return lessons.map((lesson: any) => ({
          lesson_id: lesson.id,
          chapter_id: chapter.id,
        }));
      })
    );
    return lessons.flat();
  };

  const saveLearningPath = async (
    student: any,
    path: any,
    logCreated = false
  ) => {
    const pathStr = JSON.stringify(path);
    await api.updateLearningPath(student, pathStr);
    await Util.setCurrentStudent(
      { ...student, learning_path: pathStr },
      undefined
    );

    const currentCourse =
      path.courses.courseList[path.courses.currentCourseIndex];
    if (!logCreated || !currentCourse) return;

    const currentPath = currentCourse.path;

    const LessonSlice = currentPath.slice(
      currentCourse.startIndex,
      currentCourse.pathEndIndex + 1
    );

    // Extract lesson IDs
    const LessonIds = LessonSlice.map((item: any) => item.lesson_id);

    const eventData = {
      user_id: student.id,
      path_id: path.courses.courseList[path.courses.currentCourseIndex].path_id,
      current_course_id:
        path.courses.courseList[path.courses.currentCourseIndex].course_id,
      current_lesson_id:
        path.courses.courseList[path.courses.currentCourseIndex].path[
          path.courses.courseList[path.courses.currentCourseIndex].currentIndex
        ].lesson_id,
      current_chapter_id:
        path.courses.courseList[path.courses.currentCourseIndex].path[
          path.courses.courseList[path.courses.currentCourseIndex].currentIndex
        ].chapter_id,
      path_lesson_one: LessonIds[0],
      path_lesson_two: LessonIds[1],
      path_lesson_three: LessonIds[2],
      path_lesson_four: LessonIds[3],
      path_lesson_five: LessonIds[4],
    };
    await Util.logEvent(EVENTS.PATHWAY_CREATED, eventData);
  };
  if (loading) return <Loading isLoading={loading} msg="Loading Lessons" />;

  return (
    <div className="learning-pathway-container">
      <div className="pathway_section">
        <DropdownMenu />
        <PathwayStructure />
      </div>

      <div className="chapter-egg-container">
        <ChapterLessonBox
          containerStyle={{
            width: "35vw",
          }}
        />
        <TressureBox startNumber={from} endNumber={to} />
      </div>
    </div>
  );
};

export default LearningPathway;
