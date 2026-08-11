import { useEffect, useState } from 'react';
import { Util } from '../utility/util';
import ChapterLessonBox from './learningPathway/chapterLessonBox';
import PathwayStructure from './learningPathway/PathwayStructure';
import './LearningPathway.css';
import DropdownMenu from './Home/DropdownMenu';
import Loading from './Loading';
import { ServiceConfig } from '../services/ServiceConfig';
import { schoolUtil } from '../utility/schoolUtil';
import {
  LATEST_STARS,
  STARS_COUNT,
  TableTypes,
  LEARNING_PATHWAY_MODE,
  CURRENT_PATHWAY_MODE,
  EVENTS,
} from '../common/constants';
import { useGrowthBook } from '@growthbook/growthbook-react';
import { v4 as uuidv4 } from 'uuid';
import { updateLocalAttributes, useGbContext } from '../growthbook/Growthbook';
import {
  consolidatePalEnabledCourses,
  sortCoursesByStudentLanguage,
  useLearningPath,
} from '../hooks/useLearningPath';
import logger from '../utility/logger';

const LearningPathway: React.FC = () => {
  const api = ServiceConfig.getI().apiHandler;
  const [from, setFrom] = useState<number>(0);
  const [to, setTo] = useState<number>(0);
  const gb = useGrowthBook();
  const { setGbUpdated } = useGbContext();

  const [loading, setLoading] = useState<boolean>(false);
  const [mode, setMode] = useState<string>(LEARNING_PATHWAY_MODE.DISABLED);
  const [isModeResolved, setIsModeResolved] = useState(false);
  const [courseCode, setCourseCode] = useState<string | undefined>(undefined);

  let student = Util.getCurrentStudent();
  const [pathwayReady, setPathwayReady] = useState(false);

  const { getPath } = useLearningPath({
    student,
    gb,
  });

  const getPreferredStudent = (
    localStudent: TableTypes<'user'>,
    fetchedStudent?: TableTypes<'user'>,
  ): TableTypes<'user'> => {
    if (!fetchedStudent) return localStudent;

    const localLearningPath =
      Util.getLatestLearningPathByUpdatedAt(localStudent);
    if (localLearningPath && !fetchedStudent.learning_path) {
      return { ...fetchedStudent, learning_path: localLearningPath };
    }

    return fetchedStudent;
  };

  const updateCourseCodeFromSubject = async (subjectId?: string | null) => {
    if (!subjectId) return;
    const selectedCourse = await api.getCourse(subjectId);
    setCourseCode(selectedCourse?.code ?? undefined);
  };
  /* -----------------------------------
   * 2️⃣ Resolve mode from GrowthBook
   * ----------------------------------- */
  useEffect(() => {
    if (!gb?.ready || !student?.id) return;

    const currentClass = schoolUtil.getCurrentClass();
    const existingAttributes = gb.getAttributes?.() ?? {};
    // Always target the active student's current class school only.
    const freshSchoolIds = currentClass?.school_id
      ? [currentClass.school_id]
      : [];
    gb.setAttributes({
      ...existingAttributes,
      student_id: student.id,
      school_ids: freshSchoolIds,
    });
    const resolvedMode = gb.getFeatureValue(
      'learning-pathway-mode',
      LEARNING_PATHWAY_MODE.DISABLED,
    ) as string;
    setMode(resolvedMode);
    localStorage.setItem(CURRENT_PATHWAY_MODE, resolvedMode);
    setIsModeResolved(true);
  }, [gb?.ready, student?.id]);

  /* -----------------------------------
   * 3️⃣ Fetch path
   * ----------------------------------- */
  useEffect(() => {
    if (!student?.id || !isModeResolved) return;

    const init = async () => {
      setLoading(true);

      try {
        if (!student?.id) return;
        const isLinked = await api.isStudentLinked(student.id);
        const currClass = isLinked ? schoolUtil.getCurrentClass() : null;

        const latest = await api.getUserByDocId(student.id);
        student = getPreferredStudent(student, latest);
        await Util.setCurrentStudent(student);
        const courses = currClass
          ? await api.getCoursesForClassStudent(currClass.id)
          : await api.getCoursesForPathway(student.id);

        const sortedCourses = await sortCoursesByStudentLanguage(
          courses,
          student,
        );
        const learningPathMode = localStorage.getItem(CURRENT_PATHWAY_MODE);
        const mode = learningPathMode ?? LEARNING_PATHWAY_MODE.DISABLED;
        const pathwayCourses = await consolidatePalEnabledCourses(
          sortedCourses,
          mode,
        );
        const learningPath = student.learning_path
          ? JSON.parse(student.learning_path)
          : null;
        const selectedCourseIndex = learningPath?.courses?.currentCourseIndex;
        const selectedCourseId =
          selectedCourseIndex !== undefined
            ? learningPath?.courses?.courseList?.[selectedCourseIndex]
                ?.course_id
            : null;
        await updateCourseCodeFromSubject(selectedCourseId);
        updateStarCount(student);
        await getPath({
          courses: pathwayCourses,
          mode,
          classId: currClass?.id,
        });
      } catch (e) {
        logger.error('Error in init() learningPathway', e);
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [student?.id, isModeResolved, mode]);

  const updateStarCount = async (currentStudent: TableTypes<'user'>) => {
    if (Util.isRespectMode) {
      await api.updateStudentStars(currentStudent.id, 0); // This will update LATEST_STARS
      // Now read from LATEST_STARS
      const latestStarsJson = localStorage.getItem(
        LATEST_STARS(currentStudent.id),
      );
      const latestStarsMap = latestStarsJson ? JSON.parse(latestStarsJson) : {};
      const totalStars = parseInt(latestStarsMap[currentStudent.id] || '0', 10);
      setFrom(totalStars);
      setTo(totalStars);
      return totalStars;
    }

    const storedStarsJson = localStorage.getItem(STARS_COUNT);
    const storedStarsMap = storedStarsJson ? JSON.parse(storedStarsJson) : {};
    const localStorageStars = parseInt(
      storedStarsMap[currentStudent.id] || '0',
      10,
    );

    const latestLocalStars = parseInt(
      localStorage.getItem(LATEST_STARS(currentStudent.id)) || '0',
      10,
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
      localStorage.setItem(LATEST_STARS(currentStudent.id), dbStars.toString());
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
        if (Util.isRespectMode) setPathwayReady(true);
      } else {
        const updated = await updateLearningPathIfNeeded(
          learningPath,
          userCourses,
        );

        let learning_path_completed: { [key: string]: number } = {};
        learningPath.courses.courseList.forEach(
          (course: { subject_id: string | null; currentIndex?: number }) => {
            const { subject_id, currentIndex } = course;
            if (subject_id && currentIndex !== undefined) {
              learning_path_completed[`${subject_id}_path_completed`] =
                currentIndex;
            }
          },
        );
        updateLocalAttributes({ learning_path_completed });
        setGbUpdated(true);

        if (updated) {
          learningPath = await buildInitialLearningPath(userCourses);
          await saveLearningPath(student, learningPath);
        }
        if (Util.isRespectMode) setPathwayReady(true);
      }
    } catch (error) {
      console.error('Error in Learning Pathway', error);
    } finally {
      setLoading(false);
    }
  };

  const buildInitialLearningPath = async (courses: TableTypes<'course'>[]) => {
    const courseList = await Promise.all(
      courses.map(async (course) => ({
        path_id: uuidv4(),
        course_id: course.id,
        subject_id: course.subject_id,
        path: await buildLessonPath(course.id),
        startIndex: 0,
        currentIndex: 0,
        pathEndIndex: 4,
      })),
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
    userCourses: TableTypes<'course'>[],
  ) => {
    const oldCourseList = learningPath.courses?.courseList || [];

    // Check if lengths and course IDs/order match
    const isSameLengthAndOrder =
      oldCourseList.length === userCourses.length &&
      userCourses.every(
        (course, index) => course.id === oldCourseList[index]?.course_id,
      );

    // Check if any course is missing path_id
    const isPathIdMissing = oldCourseList.some(
      (course: { path_id?: string }) => !course.path_id,
    );

    if (isSameLengthAndOrder && !isPathIdMissing) {
      return false; // No need to rebuild
    }

    // If path_id is missing or courses mismatch, rebuild everything
    const newLearningPath = await buildInitialLearningPath(userCourses);
    learningPath.courses.courseList = newLearningPath.courses.courseList;

    // Dispatch event to notify that course has changed
    const event = new CustomEvent('courseChanged', {
      detail: { currentStudent: student },
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
      }),
    );
    return lessons.flat();
  };

  const saveLearningPath = async (student: any, path: any) => {
    const pathStr = JSON.stringify(path);
    await api.updateLearningPath(student, pathStr);
    await Util.setCurrentStudent(
      { ...student, learning_path: pathStr },
      undefined,
    );

    const currentCourse =
      path.courses.courseList[path.courses.currentCourseIndex];
    const currentPath = currentCourse.path;

    const LessonSlice = currentPath.slice(
      currentCourse.startIndex,
      currentCourse.pathEndIndex + 1,
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
  if (loading || (Util.isRespectMode && !pathwayReady)) {
    return <Loading isLoading={loading} msg="Loading Lessons" />;
  }
  if (loading) return <Loading isLoading={true} />;

  return (
    <div className="learning-pathway-container">
      <div className="pathway_section">
        <DropdownMenu
          onSubjectChange={(subjectId) => {
            updateCourseCodeFromSubject(subjectId);
          }}
        />
        <PathwayStructure />
      </div>

      <div className="chapter-egg-container">
        <ChapterLessonBox courseCode={courseCode} />
      </div>
    </div>
  );
};

export default LearningPathway;
