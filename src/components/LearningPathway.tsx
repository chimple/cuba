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
        await saveLearningPath(student, learningPath);
        setLoading(false);
      } else {
        const updated = await updateLearningPathIfNeeded(
          learningPath,
          userCourses
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
    const newLearningPath = await buildInitialLearningPath(userCourses);
    learningPath.courses.courseList = newLearningPath.courses.courseList;

    // Dispatch event to notify that course has changed
    const event = new CustomEvent("courseChanged", {
      detail: { currentStudent },
    });
    window.dispatchEvent(event);

    return true;
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

  const saveLearningPath = async (student: any, path: any) => {
    const pathStr = JSON.stringify(path);
    await api.updateLearningPath(student, pathStr);
    await Util.setCurrentStudent(
      { ...student, learning_path: pathStr },
      undefined
    );

    const currentCourse =
      path.courses.courseList[path.courses.currentCourseIndex];
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
        {/* <TressureBox startNumber={from} endNumber={to} /> */}
      </div>
    </div>
  );
};

export default LearningPathway;
