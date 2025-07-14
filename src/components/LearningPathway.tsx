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

const isRespect = Util.isRespectMode;
const LearningPathway: React.FC = () => {
  const api = ServiceConfig.getI().apiHandler;
  const [loading, setLoading] = useState<boolean>(false);
  const [from, setFrom] = useState<number>(0);
  const [to, setTo] = useState<number>(0);
  const [pathReady, setPathReady] = useState<boolean>(false);
  const [subjectStars, setSubjectStars] = useState<{ [subjectId: string]: number }>({});
  const [starAnimation, setStarAnimation] = useState<boolean>(false);
  const currentStudent = Util.getCurrentStudent();

  useEffect(() => {
    // Listen for star update event after game completion
    const handleStarUpdate = async () => {
      let student = Util.getCurrentStudent();
      if (!student?.id) return;
      // Fetch latest student from DB
      try {
        const latestStudent = await api.getUserByDocId(student.id);
        if (latestStudent) {
          Util.setCurrentStudent(latestStudent);
          student = latestStudent;
        }
      } catch (e) {}
      if (!student) return;
      // Always fetch latest pathway from DB after lesson completion
      let refreshedStudent = student;
      try {
        const refreshed = await api.getUserByDocId(student.id);
        if (refreshed) {
          Util.setCurrentStudent(refreshed);
          refreshedStudent = refreshed;
        }
      } catch (e) {}
      updateStarCount(refreshedStudent, true); // Animate stars only after lesson completion
    };
    window.addEventListener("StarUpdate", handleStarUpdate);

    const loadStudentAndPathway = async () => {
      let student = Util.getCurrentStudent();
      if (!student?.id) return;
      // Always fetch latest student from DB to get updated learning_path
      try {
        const latestStudent = await api.getUserByDocId(student.id);
        if (latestStudent) {
          Util.setCurrentStudent(latestStudent);
          student = latestStudent;
        }
      } catch (e) {
        // fallback to local student
      }
      let cachedPathway: any = null;
      try {
        cachedPathway = student.learning_path
          ? JSON.parse(student.learning_path)
          : null;
      } catch (e) {
        cachedPathway = null;
      }
      if (!cachedPathway || !cachedPathway.courses?.courseList?.length) {
        await fetchLearningPathway(student);
      } else {
        setPathReady(true);
        // Update student stars immediately when pathway is ready
        updateStarCount(student);
      }
    };
    if (currentStudent?.id) {
      loadStudentAndPathway();
    }
    return () => {
      window.removeEventListener("StarUpdate", handleStarUpdate);
    };
  }, []);
  const updateStarCount = async (currentStudent: TableTypes<"user">, animate: boolean = false) => {
    // Calculate total stars from completed lessons in pathway
    let totalStars = 0;
    let pathway = currentStudent.learning_path ? JSON.parse(currentStudent.learning_path) : null;
    if (pathway && pathway.courses?.courseList) {
      pathway.courses.courseList.forEach((course: any) => {
        if (course.path) {
          course.path.forEach((lesson: any) => {
            if (lesson.completed) {
              let stars = 0;
              if (lesson.score !== undefined && typeof lesson.score === 'number') {
                if (lesson.score >= 75 && lesson.score <= 100) {
                  stars = 3;
                } else if (lesson.score >= 50 && lesson.score < 75) {
                  stars = 2;
                } else if (lesson.score >= 25 && lesson.score < 50) {
                  stars = 1;
                }
              }
              totalStars += stars;
            }
          });
        }
      });
    }
    // Only set total stars, not subject-specific
    setSubjectStars({}); // Clear subject-specific stars
    const studentStars = totalStars;

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
    const finalStars = Math.max(latestLocalStars, studentStars);

    if (localStorageStars < finalStars) {
      storedStarsMap[currentStudent.id] = finalStars;
      localStorage.setItem(STARS_COUNT, JSON.stringify(storedStarsMap));
      setFrom(localStorageStars);
      setTo(finalStars);
      setStarAnimation(animate);
    } else {
      setFrom(finalStars);
      setTo(finalStars);
      setStarAnimation(false);
    }

    if (latestLocalStars <= studentStars) {
      latestStarsMap[currentStudent.id] = studentStars;
      localStorage.setItem(LATEST_STARS, JSON.stringify(latestStarsMap));
    } else {
      await api.updateStudentStars(currentStudent.id, latestLocalStars);
    }
  };

  const fetchLearningPathway = async (student: any) => {
    const currClass = schoolUtil.getCurrentClass();
    try {
      const userCourses = currClass
        ? await api.getCoursesForClassStudent(currClass.id)
        : await api.getCoursesForPathway(student.id);
      let learningPath = student.learning_path
        ? JSON.parse(student.learning_path)
        : null;
      // Only rebuild if missing or empty
      if (!learningPath || !learningPath.courses?.courseList?.length) {
        setLoading(true);
        if(isRespect) setPathReady(false);
        learningPath = await buildInitialLearningPath(userCourses);
        await saveLearningPath(student, learningPath);
        setLoading(false);
        if(isRespect) setPathReady(true);
        // Immediately set stars in the box after pathway is built
        updateStarCount({ ...student, learning_path: JSON.stringify(learningPath) }, false); // No animation on first load
        setFrom(0);
        let totalStars = 0;
        if (learningPath && learningPath.courses?.courseList) {
          learningPath.courses.courseList.forEach((course: any) => {
            if (course.path) {
              course.path.forEach((lesson: any) => {
                totalStars += lesson.stars || 0;
              });
            }
          });
        }
        setTo(totalStars);
      } else {
        // Only update if courses have changed
        const updated = await updateLearningPathIfNeeded(
          learningPath,
          userCourses
        );
        if (updated) await saveLearningPath(student, learningPath);
        if(isRespect) setPathReady(true);
        updateStarCount(student, false); // No animation on cached load
      }
    } catch (error) {
      console.error("Error in Learning Pathway", error);
    } finally {
      setLoading(false);
    }
  };

  const buildLessonPath = async (courseId: string) => {
    const chapters = await api.getChaptersForCourse(courseId);

    // Fetch completed lessons and stars for this student and course using OneRosterApi's getStudentResultInMap
    let completedLessonsMap: { [lessonDocId: string]: TableTypes<"result"> } = {};
    if (currentStudent?.id && api.getStudentResultInMap) {
      completedLessonsMap = await api.getStudentResultInMap(currentStudent.id);
    }

    const lessons = await Promise.all(
      chapters.map(async (chapter) => {
        const lessons = await api.getLessonsForChapter(chapter.id);
        return lessons.map((lesson: any) => {
          const result = completedLessonsMap[lesson.id];
          // Award stars based on new logic
          let stars = 0;
          if (result && typeof result.score === 'number') {
            if (result.score >= 75 && result.score <= 100) {
              stars = 3;
            } else if (result.score >= 50 && result.score < 75) {
              stars = 2;
            } else if (result.score >= 25 && result.score < 50) {
              stars = 1;
            }
          }
          return {
            lesson_id: lesson.id,
            chapter_id: chapter.id,
            completed: !!(result && result.score != null),
            stars,
          };
        });
      })
    );
    return lessons.flat();
  };

  const buildInitialLearningPath = async (courses: any[]) => {
    const courseList = await Promise.all(
      courses.map(async (course) => {
        const path = await buildLessonPath(course.id);
        // Find last completed lesson index
        let lastCompletedIndex = -1;
        for (let i = 0; i < path.length; i++) {
          if (path[i].completed) {
            lastCompletedIndex = i;
          }
        }
        // Set currentIndex to next lesson after last completed
        let currentIndex = lastCompletedIndex + 1;
        if (currentIndex >= path.length) {
          currentIndex = path.length - 1; // Stay at last lesson if all are completed
        }
        // Set startIndex to currentIndex
        let startIndex = currentIndex;
        // pathEndIndex logic remains the same
        return {
          path_id: uuidv4(),
          course_id: course.id,
          subject_id: course.subject_id,
          path,
          startIndex,
          currentIndex,
          pathEndIndex: currentIndex + 4 < path.length ? currentIndex + 4 : path.length - 1,
        };
      })
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
  if (loading || !pathReady) return <Loading isLoading={loading} msg="Loading Lessons" />;

  return (
    <div className="learning-pathway-container">
      <div className="pathway_section">
        <DropdownMenu />
        <PathwayStructure />
      </div>

      <div className="chapter-egg-container">
        <ChapterLessonBox
        // containerStyle={{
        //   width: "30vw",
        // }}
        />
        <TressureBox startNumber={from} endNumber={to} animate={starAnimation} />
      </div>
    </div>
  );
};

export default LearningPathway;
