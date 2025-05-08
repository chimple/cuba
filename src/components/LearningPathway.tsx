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
import { STARS_COUNT, TableTypes } from "../common/constants";

const LearningPathway: React.FC = () => {
  const api = ServiceConfig.getI().apiHandler;
  const [loading, setLoading] = useState<boolean>(true);
  const [from, setFrom] = useState<number>(0);
  const [to, setTo] = useState<number>(0);
  const currentStudent = Util.getCurrentStudent();

  useEffect(() => {
    if (!currentStudent?.id) return;
    updateStarCount(currentStudent);
    fetchLearningPathway(currentStudent);
  }, []);
  const updateStarCount = (currentStudent: any) => {
      const storedStarsJson = localStorage.getItem(STARS_COUNT);
      const storedStarsMap = storedStarsJson ? JSON.parse(storedStarsJson) : {};

      const localStorageStars = parseInt(
        storedStarsMap[currentStudent.id] || "0",
        10
      );
      const studentStars = currentStudent.stars || 0;
      if (localStorageStars < studentStars) {
        storedStarsMap[currentStudent.id] = studentStars;
        localStorage.setItem(STARS_COUNT, JSON.stringify(storedStarsMap));
        setFrom(localStorageStars);
        setTo(studentStars);
      } else {
        setFrom(studentStars);
        setTo(studentStars);
      }
  };

  const fetchLearningPathway = async (student: any) => {
    setLoading(true);
    const currClass = schoolUtil.getCurrentClass();

    try {
      const userCourses = currClass
        ? await api.getCoursesForClassStudent(currClass.id)
        : await api.getCoursesForPathway(student.id);

      let learningPath = student.learning_path
        ? JSON.parse(student.learning_path)
        : null;

      if (!learningPath || !learningPath.courses?.courseList?.length) {
        learningPath = await buildInitialLearningPath(userCourses);
        await saveLearningPath(student, learningPath);
      } else {
        const updated = await updateLearningPathIfNeeded(learningPath, userCourses);
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

  const updateLearningPathIfNeeded = async (learningPath: any, userCourses: any[]) => {
    const existingCourseIds = new Set(learningPath.courses.courseList.map((c: any) => c.course_id));
    const newCourseIds = new Set(userCourses.map((c: any) => c.id));

    const toAdd = userCourses.filter((c) => !existingCourseIds.has(c.id));
    const toRemove = learningPath.courses.courseList.filter(
      (c: any) => !newCourseIds.has(c.course_id)
    );

    if (!toAdd.length && !toRemove.length) return false;

    // Create a map of existing course details for quick lookup
    const existingCourseMap = new Map(
      learningPath.courses.courseList.map((c: any) => [c.course_id, c])
    );

    // Build new course list maintaining API order
    const newCourseList = await Promise.all(
      userCourses.map(async (course) => {
        if (existingCourseMap.has(course.id)) {
          // Keep existing course details if course already exists
          return existingCourseMap.get(course.id);
        } else {
          // Add new course details for new courses
          return {
            course_id: course.id,
            subject_id: course.subject_id,
            path: await buildLessonPath(course.id),
            startIndex: 0,
            currentIndex: 0,
            pathEndIndex: 4,
          };
        }
      })
    );

    learningPath.courses.courseList = newCourseList;
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
    await Util.setCurrentStudent({ ...student, learning_path: pathStr }, undefined);
    window.dispatchEvent(
      new CustomEvent("PathwayCreated", { detail: { userId: student.id } })
    );
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
            width: "30vw",
          }}
        />
        <TressureBox startNumber={from} endNumber={to} />
      </div>
    </div>
  );
};

export default LearningPathway;
