import { useEffect, useState } from "react";
import { Util } from "../utility/util";
import ChapterLessonBox from "./learningPathway/chapterLessonBox";
import PathwayStructure from "./learningPathway/PathwayStructure";
import "./LearningPathway.css";
import DropdownMenu from "./Home/DropdownMenu";
import Loading from "./Loading";
import { ServiceConfig } from "../services/ServiceConfig";
import { schoolUtil } from "../utility/schoolUtil";
import {
  LATEST_STARS,
  STARS_COUNT,
  TableTypes,
  LEARNING_PATHWAY_MODE,
  CURRENT_PATHWAY_MODE,
} from "../common/constants";
import { useGrowthBook } from "@growthbook/growthbook-react";
import { sortCoursesByStudentLanguage, useLearningPath } from "../hooks/useLearningPath";

const LearningPathway: React.FC = () => {
  const api = ServiceConfig.getI().apiHandler;
  const [from, setFrom] = useState<number>(0);
  const [to, setTo] = useState<number>(0);
  const gb = useGrowthBook();

  const [loading, setLoading] = useState<boolean>(false);
  const [mode, setMode] = useState<string>(
    LEARNING_PATHWAY_MODE.DISABLED,
  );
  const [isModeResolved, setIsModeResolved] = useState(false);

  const student = Util.getCurrentStudent();

  const { getPath } = useLearningPath({
    student,
    gb,
  });

  /* -----------------------------------
   * 1️⃣ Refresh student from DB
   * ----------------------------------- */
  useEffect(() => {
    const refreshStudent = async () => {
      if (!student?.id) return;
      const latest = await api.getUserByDocId(student.id);
      if (latest) {
        Util.setCurrentStudent(latest);
      }
    };
    refreshStudent();
  }, []);

  /* -----------------------------------
   * 2️⃣ Resolve mode from GrowthBook
   * ----------------------------------- */
  useEffect(() => {
    if (!gb?.ready || !student?.id) return;

    const currentClass = schoolUtil.getCurrentClass();
    gb.setAttributes({
      ...gb.getAttributes(),
      school_ids: [currentClass?.school_id],
    });
    const resolvedMode = gb.getFeatureValue(
      "learning-pathway-mode",
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
        const isLinked = await api.isStudentLinked(student.id);
        const currClass = isLinked ? schoolUtil.getCurrentClass() : null;

        const courses = currClass
          ? await api.getCoursesForClassStudent(currClass.id)
          : await api.getCoursesForPathway(student.id);

        const sortedCourses = await sortCoursesByStudentLanguage(courses, student.language_id);
        const learningPathMode = localStorage.getItem(CURRENT_PATHWAY_MODE);
        const mode = learningPathMode ?? LEARNING_PATHWAY_MODE.DISABLED;
        updateStarCount(student);
        await getPath({
          courses: sortedCourses,
          mode,
          classId: currClass?.id,
        });
      } catch (e) {
        console.error("Error in init() learningPathway", e);
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [student?.id, isModeResolved, mode]);

  const updateStarCount = async (currentStudent: TableTypes<"user">) => {
    const storedStarsJson = localStorage.getItem(STARS_COUNT);
    const storedStarsMap = storedStarsJson ? JSON.parse(storedStarsJson) : {};
    const localStorageStars = parseInt(
      storedStarsMap[currentStudent.id] || "0",
      10,
    );

    const latestLocalStars = parseInt(
      localStorage.getItem(LATEST_STARS(currentStudent.id)) || "0",
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
      localStorage.setItem(
        LATEST_STARS(currentStudent.id),
        dbStars.toString(),
      );
    } else {
      await api.updateStudentStars(currentStudent.id, latestLocalStars);
    }
  };

  if (loading)  return <Loading isLoading={true} />;

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
      </div>
    </div>
  );
};

export default LearningPathway;
