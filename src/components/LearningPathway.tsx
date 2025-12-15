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
  RECOMMENDATION_TYPE
} from "../common/constants";
import { updateLocalAttributes, useGbContext } from "../growthbook/Growthbook";
import { palUtil } from "../utility/palUtil";

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

      const hasFrameworkCourse = userCourses.some(
        (course) => course?.framework_id
      );
      const isFrameworkPath = learningPath?.type === RECOMMENDATION_TYPE.FRAMEWORK;

      if (
        !learningPath ||
        !learningPath.courses?.courseList?.length ||
        (hasFrameworkCourse && !isFrameworkPath)
      ) {
        setLoading(true);
        learningPath = await buildInitialLearningPath(userCourses, student.id);
        await saveLearningPath(student, learningPath);
        setLoading(false);
      } else {
        const updated = await updateLearningPathIfNeeded(
          learningPath,
          userCourses,
          student.id
        );

        let total_learning_path_completed = 0;
        let learning_path_completed: { [key: string]: number } = {};
        learningPath.courses.courseList.forEach((course) => {
          const { subject_id, currentIndex } = course;
          if (subject_id && currentIndex !== undefined) {
            learning_path_completed[`${subject_id}_path_completed`] = currentIndex;
            total_learning_path_completed += currentIndex;
          }
        });
        updateLocalAttributes({ learning_path_completed, total_learning_path_completed });
        setGbUpdated(true);

        if (updated) await saveLearningPath(student, learningPath);
      }
    } catch (error) {
      console.error("Error in Learning Pathway", error);
    } finally {
      setLoading(false);
    }
  };

  const buildInitialLearningPath = async (
    courses: any[],
    studentId: string
  ) => {
    const courseList = await Promise.all(
      courses.map(async (course) => {
        const path = await buildLessonPath(course, studentId);
        return {
          path_id: uuidv4(),
          course_id: course.id,
          subject_id: course.subject_id,
          path,
          startIndex: 0,
          currentIndex: 0,
          pathEndIndex: 4,
          type: course?.framework_id ? RECOMMENDATION_TYPE.FRAMEWORK : RECOMMENDATION_TYPE.CHAPTER
        };
      })
    );

    const hasFrameworkCourse = courses.some(
      (course) => course?.framework_id
    );

    return {
      courses: {
        courseList,
        currentCourseIndex: 0,
      },
      type: hasFrameworkCourse ? RECOMMENDATION_TYPE.FRAMEWORK : RECOMMENDATION_TYPE.CHAPTER
    };
  };

  const updateLearningPathIfNeeded = async (
    learningPath: any,
    userCourses: any[],
    studentId: string
  ) => {
    const oldCourseList = learningPath.courses?.courseList || [];

    // Check if lengths and course IDs/order match
    const isSameLengthAndOrder =
      oldCourseList.length === userCourses.length &&
      userCourses.every(
        (course, index) => course.id === oldCourseList[index]?.course_id
      );

    // Check if any course is missing path_id
    const isPathIdMissing = oldCourseList.some((course) => !course.path_id);

    if (isSameLengthAndOrder && !isPathIdMissing) {
      return false; // No need to rebuild
    }

    // If path_id is missing or courses mismatch, rebuild everything
    const newLearningPath = await buildInitialLearningPath(
      userCourses,
      studentId
    );
    learningPath.courses.courseList = newLearningPath.courses.courseList;

    // Dispatch event to notify that course has changed
    const event = new CustomEvent("courseChanged", {
      detail: { currentStudent },
    });
    window.dispatchEvent(event);

    return true;
  };

  const buildLessonPath = async (course: any, studentId: string) => {
    const palPath = await palUtil.getPalLessonPathForCourse(
      course.id,
      studentId
    );
    if (palPath) return palPath;

    const chapters = await api.getChaptersForCourse(course.id);
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

  const saveLearningPath = async (student: any, path: any) => {
    const pathStr = JSON.stringify(path);
    await api.updateLearningPath(student, pathStr);
    await Util.setCurrentStudent(
      { ...student, learning_path: pathStr },
      undefined
    );

    const currentCourse =
      path.courses.courseList[path.courses.currentCourseIndex];
    const currentPath = currentCourse.path ?? [];
    if (!currentPath.length) return;

    const cappedEndIndex = Math.min(
      currentCourse.pathEndIndex ?? 0,
      currentPath.length - 1
    );
    const currentIndex = Math.min(
      currentCourse.currentIndex ?? 0,
      currentPath.length - 1
    );

    const LessonSlice = currentPath.slice(
      currentCourse.startIndex,
      cappedEndIndex + 1
    );

    // Extract lesson IDs
    const LessonIds = LessonSlice.map((item: any) => item.lesson_id);
    const [
      pathLessonOne,
      pathLessonTwo,
      pathLessonThree,
      pathLessonFour,
      pathLessonFive,
    ] = [
      LessonIds[0],
      LessonIds[1],
      LessonIds[2],
      LessonIds[3],
      LessonIds[4],
    ];

    const eventData = {
      user_id: student.id,
      path_id: path.courses.courseList[path.courses.currentCourseIndex].path_id,
      current_course_id:
        path.courses.courseList[path.courses.currentCourseIndex].course_id,
      current_lesson_id:
        path.courses.courseList[path.courses.currentCourseIndex].path?.[
          currentIndex
        ]?.lesson_id,
      current_chapter_id:
        path.courses.courseList[path.courses.currentCourseIndex].path?.[
          currentIndex
        ]?.chapter_id,
      path_lesson_one: pathLessonOne,
      path_lesson_two: pathLessonTwo,
      path_lesson_three: pathLessonThree,
      path_lesson_four: pathLessonFour,
      path_lesson_five: pathLessonFive,
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
        {/* <TressureBox startNumber={from} endNumber={to} /> */}
      </div>
    </div>
  );
};

export default LearningPathway;
