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
  COURSE_CHANGED,
  EVENTS,
  LATEST_STARS,
  STARS_COUNT,
  TableTypes,
  RECOMMENDATION_TYPE,
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
      const isFrameworkPath =
        learningPath?.type === RECOMMENDATION_TYPE.FRAMEWORK;
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
            learning_path_completed[`${subject_id}_path_completed`] =
              currentIndex;
            total_learning_path_completed += currentIndex;
          }
        });
        updateLocalAttributes({
          learning_path_completed,
          total_learning_path_completed,
        });
        setGbUpdated(true);

        if (updated) await saveLearningPath(student, learningPath);
        await buildLearningPathForUnplayedCourses(learningPath, userCourses, student);
        await updateLearningPathWithLatestAssessment(currClass, student);
      }
    } catch (error) {
      console.error("Error in Learning Pathway", error);
    } finally {
      setLoading(false);
    }
  };

  async function buildLearningPathForUnplayedCourses(
    learningPath: any,
    userCourses: any[],
    student: TableTypes<"user">
  ) {
    if (!learningPath?.courses?.courseList) return null;
    if (!Array.isArray(userCourses) || userCourses.length === 0) return null;

    // 1️⃣ Find unplayed courses
    const unplayedCourses: any[] = [];

    for (const course of userCourses) {
      const hasPlayed = await api.isStudentPlayedPalLesson(
        student.id,
        course.id
      );
      if (!hasPlayed) {
        unplayedCourses.push(course);
      }
    }

    if (unplayedCourses.length === 0) return null;

    // 2️⃣ Build path ONCE for all unplayed
    const newLearningPath = await buildInitialLearningPath(
      unplayedCourses,
      student.id
    );

    const newCourseList = newLearningPath?.courses?.courseList || [];
    const existingList = [...learningPath.courses.courseList];

    // 3️⃣ Replace matching courses
    for (const newCourse of newCourseList) {
      const index = existingList.findIndex(
        (c: any) => c.course_id === newCourse.course_id
      );

      if (index !== -1) {
        existingList[index] = newCourse;
      } else {
        existingList.push(newCourse);
      }
    }

    // 4️⃣ Save
    learningPath.courses.courseList = existingList;
    await saveLearningPath(student, learningPath);

    return true;
  }


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
          type: course?.framework_id
            ? RECOMMENDATION_TYPE.FRAMEWORK
            : RECOMMENDATION_TYPE.CHAPTER,
        };
      })
    );

    const hasFrameworkCourse = courses.some((course) => course?.framework_id);

    return {
      courses: {
        courseList,
        currentCourseIndex: 0,
      },
      type: hasFrameworkCourse
        ? RECOMMENDATION_TYPE.FRAMEWORK
        : RECOMMENDATION_TYPE.CHAPTER,
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
    const isPathIdMissing = oldCourseList.some((course) => !course.path_id);
    const isPathCompleted = oldCourseList.some(
      (course) => course.currentIndex > course.pathEndIndex
    );
    if (isSameLengthAndOrder && !isPathIdMissing && !isPathCompleted) {
      return false;
    }
    // If path_id is missing or courses mismatch, rebuild everything
    const newLearningPath = await buildInitialLearningPath(
      userCourses,
      studentId
    );
    learningPath.courses.courseList = newLearningPath.courses.courseList;
    // Dispatch event to notify that course has changed
    const event = new CustomEvent(COURSE_CHANGED);
    window.dispatchEvent(event);
    return true;
  };

  const buildLessonPath = async (course: any, studentId: string) => {
    // -------------------------------
    // 1️⃣ checking re student results
    // -------------------------------
    const rawResults = await api.isStudentPlayedPalLesson(studentId, course.id);
    // -------------------------------
    // 2️⃣ CASE 1: Student HAS results → PAL
    // -------------------------------
    if (rawResults) {
      console.log("Fetching PAL path for course:", rawResults);
      const palPath = await palUtil.getPalLessonPathForCourse(
        course.id,
        studentId
      );
      if (Array.isArray(palPath) && palPath.length > 0) {
        return palPath.map((item: any) => ({
          ...item,
          is_assessment: false, // 🔴 PAL is NOT assessment
        }));
      }
    }
    // -------------------------------
    // 3️⃣ CASE 2: Student has NO results → Subject lessons
    // -------------------------------
    if (!rawResults) {
      const subjectLessons = await api.getSubjectLessonsBySubjectId(course.subject_id);
      if (Array.isArray(subjectLessons) && subjectLessons.length > 0) {
        return subjectLessons
          .map((lesson: any) => ({
            lesson_id: lesson.lesson_id,
            is_assessment: true,
          }))
          .slice(0, 5);
      }
    }
    // -------------------------------
    // 4️⃣ FINAL FALLBACK → Chapters → Lessons
    // -------------------------------
    const chapters = await api.getChaptersForCourse(course.id);
    if (!Array.isArray(chapters) || chapters.length === 0) return [];
    const lessons = await Promise.all(
      chapters.map(async (chapter: any) => {
        const chapterLessons = await api.getLessonsForChapter(chapter.id);

        return (Array.isArray(chapterLessons) ? chapterLessons : []).map(
          (lesson: any) => ({
            lesson_id: lesson.id,
            chapter_id: chapter.id,
            is_assessment: false,
          })
        );
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
    ] = [LessonIds[0], LessonIds[1], LessonIds[2], LessonIds[3], LessonIds[4]];

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

  async function formatLatestAssessmentGroupPerCourse(
    assignments: TableTypes<"assignment">[]
  ): Promise<any[]> {
    if (!assignments.length) return [];
    const api = ServiceConfig.getI().apiHandler;
    // 1️⃣ Group assignments by course_id
    const courseMap = new Map<string, TableTypes<"assignment">[]>();

    for (const a of assignments) {
      if (!a.course_id) continue;

      if (!courseMap.has(a.course_id)) {
        courseMap.set(a.course_id, []);
      }
      courseMap.get(a.course_id)!.push(a);
    }

    const result: any[] = [];

    // 2️⃣ For each course → fetch subject_id → format
    for (const [courseId, courseAssignments] of courseMap.entries()) {
      const course = await api.getCourse(courseId);
      if (!course?.subject_id) continue;

      result.push({
        course_id: courseId,
        subject_id: course.subject_id,
        lessons: courseAssignments.map((a) => ({
          lesson_id: a.lesson_id,
          assignment_id: a.id,
        })),
      });
    }
    return result;
  }

  const updatePathwayWithLatestAssessment = async (
    assessmentCheckData: any[]
  ) => {
    if (!Array.isArray(assessmentCheckData)) return null;

    const api = ServiceConfig.getI().apiHandler;
    const courseList: any[] = [];

    for (const item of assessmentCheckData) {
      // Skip if path is already valid or nothing missing
      if (item.isPathValid || !item.missing?.length) continue;

      const course = await api.getCourse(item.course_id);
      if (!course) continue;

      courseList.push({
        path_id: uuidv4(),
        course_id: item.course_id,
        subject_id: item.subject_id ?? course.subject_id,
        path: item.missing.map((l: any) => ({
          lesson_id: l.lesson_id,
          assignment_id: l.assignment_id,
          is_assessment: true,
        })),
        startIndex: 0,
        currentIndex: 0,
        pathEndIndex: item.missing.length - 1,
        type: course.framework_id
          ? RECOMMENDATION_TYPE.FRAMEWORK
          : RECOMMENDATION_TYPE.CHAPTER,
      });
    }

    if (courseList.length === 0) return null;

    const hasFrameworkCourse = courseList.some(
      (c) => c.type === RECOMMENDATION_TYPE.FRAMEWORK
    );

    return {
      courses: {
        courseList,
        currentCourseIndex: 0,
      },
      type: hasFrameworkCourse
        ? RECOMMENDATION_TYPE.FRAMEWORK
        : RECOMMENDATION_TYPE.CHAPTER,
    };
  };
  async function checkAssessmentLessonsInPathway(
    formattedAssessments: any[],
    learningPath: any
  ): Promise<any> {
    const coursePaths = learningPath?.courses?.courseList ?? [];

    return formattedAssessments.map((assessment: any) => {
      const coursePath = coursePaths.find(
        (c: any) => c.course_id === assessment.course_id
      );

      // ❌ No pathway at all
      if (!coursePath || !Array.isArray(coursePath.path)) {
        return {
          course_id: assessment.course_id,
          isPathValid: false,
          missing: assessment.lessons,
        };
      }

      const pathKeySet = new Set(
        coursePath.path.map(
          (p: any) => `${p.lesson_id}|${p.assignment_id ?? ""}`
        )
      );

      const missing = assessment.lessons.filter(
        (l: any) =>
          !pathKeySet.has(`${l.lesson_id}|${l.assignment_id}`)
      );

      return {
        course_id: assessment.course_id,
        isPathValid: missing.length === 0,
        ...(missing.length > 0 ? { missing } : {}),
      };
    });
  }
  async function updateLearningPathWithLatestAssessment(
    Class: any,
    Student: any,
  ) {
    const api = ServiceConfig.getI().apiHandler;
    const assignments = await api.getLatestAssessmentGroup(
      Class.id,
      Student
    );
    let learningPath = Student.learning_path
      ? JSON.parse(Student.learning_path)
      : null;
    if (!assignments || assignments.length === 0) {
      return;
    }

    // 2️⃣ Format assessment per course
    const formattedPerCourse =
      await formatLatestAssessmentGroupPerCourse(assignments);
    // 3️⃣ Check assessment lessons against existing learning path
    const validatedAssessments = await checkAssessmentLessonsInPathway(
      formattedPerCourse,
      learningPath
    );
    const updatedPath =
      await updatePathwayWithLatestAssessment(validatedAssessments);
    // 🟢 MERGE like buildLearningPathForUnplayedCourses
    const newCourseList =
      updatedPath?.courses?.courseList || [];
    const existingList =
      [...learningPath.courses.courseList];
    for (const newCourse of newCourseList) {
      const index = existingList.findIndex(
        (c: any) => c.course_id === newCourse?.course_id
      );

      if (index !== -1) {
        existingList[index] = newCourse;
      } else {
        existingList.push(newCourse);
      }
    }
    learningPath.courses.courseList = existingList;
    await saveLearningPath(Student, learningPath);
  }

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
