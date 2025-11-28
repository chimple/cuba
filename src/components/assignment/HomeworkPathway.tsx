import { useEffect, useState } from "react";
import "../LearningPathway.css";
import "./HomeworkPathway.css";
import { v4 as uuidv4 } from "uuid";
import { ServiceConfig } from "../../services/ServiceConfig";
import {
  EVENTS,
  HOMEWORK_PATHWAY_DROPDOWN,
  HOMEWORK_PATHWAY,
  LATEST_STARS,
  STARS_COUNT,
  TableTypes,
  LIVE_QUIZ,
} from "../../common/constants";
import { Util } from "../../utility/util";
import { schoolUtil } from "../../utility/schoolUtil";
import {
  updateLocalAttributes,
  useGbContext,
} from "../../growthbook/Growthbook";
import Loading from "../Loading";
import DropdownMenu from "../Home/DropdownMenu";
import ChapterLessonBox from "../learningPathway/chapterLessonBox";
import HomeworkPathwayStructure from "./HomeworkPathwayStructure";
import PathwayModal from "../learningPathway/PathwayModal";
import { t } from "i18next";
import { useFeatureIsOn } from "@growthbook/growthbook-react";

// Make sure this interface is defined at the top of your component file
interface HomeworkPath {
  path_id: string;
  lessons: any[];
  currentIndex: number;
}
interface HomeworkPathwayProps {
  onPlayMoreHomework?: () => void; // ✅ NEW
}

const HomeworkPathway: React.FC<HomeworkPathwayProps> = ({
  onPlayMoreHomework,
}) => {
  const api = ServiceConfig.getI().apiHandler;
  const [loading, setLoading] = useState<boolean>(true);
  const [boxDetails, setBoxDetails] = useState<{
    cName: string;
    lName: string;
  } | null>(null);

  const [from, setFrom] = useState<number>(0);
  const [to, setTo] = useState<number>(0);
  const currentStudent = Util.getCurrentStudent();
  const { setGbUpdated } = useGbContext();

  // ✅ New state variables for dropdown logic
  const [isDropdownDisabled, setIsDropdownDisabled] = useState<boolean>(true);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [showDisabledDropdownModal, setShowDisabledDropdownModal] =
    useState<boolean>(false);
  const isDropdownAlwaysEnabled = useFeatureIsOn(HOMEWORK_PATHWAY_DROPDOWN);
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (!currentStudent?.id) {
      setLoading(false);
      return;
    }
    updateStarCount(currentStudent);
    fetchHomeworkPathway(currentStudent);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStudent?.id, isDropdownAlwaysEnabled]);

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

  const onSubjectChange = async (subjectId: string) => {
    const currentStudent = Util.getCurrentStudent();
    if (currentStudent) {
      console.log("dropdown subjectid", subjectId, currentStudent);
      await fetchHomeworkPathway(currentStudent, subjectId);
    }
    // setSelectedSubject after we wrote the new path
    setSelectedSubject(subjectId);
  };

  async function awardStarsForPathCompletion(
    student: TableTypes<"user">,
    starsToAdd: number
  ) {
    const currentStars = student.stars || 0;
    const newStarCount = currentStars + starsToAdd;

    await api.updateStudentStars(student.id, newStarCount);
    await updateStarCount(student);
  }

  const fetchHomeworkPathway = async (
    student: TableTypes<"user">,
    subjectId?: string
  ) => {
    try {
      let pathData: HomeworkPath | null = null;
      const existingPathStr = sessionStorage.getItem(HOMEWORK_PATHWAY);

      // Fetch the current class
      const currClass = Util.getCurrentClass();
      if (!currClass?.id) {
        setLoading(false);
        return;
      }

      // 1. Always fetch pending assignments first
      const all = await api.getPendingAssignments(currClass.id, student.id);
      let allPendingAssignments = all.filter((a) => a.type !== LIVE_QUIZ);

      // 2. If a subjectId filter is provided, filter assignments by that subject
      if (subjectId) {
        // Filter directly using course_id from the assignment object
        allPendingAssignments = allPendingAssignments.filter(
          (assignment) => String(assignment.course_id) === String(subjectId)
        );

        // If this subject has no pending assignments anymore,
        // fallback to global homework path (no subject filter)
        if (!allPendingAssignments.length) {
          setSelectedSubject(null); // reset dropdown selection
          return fetchHomeworkPathway(student);
        }
      }

      // 3. Decide how to determine pathData
      if (existingPathStr && !subjectId) {
        // ⬅️ Reuse existing global path if we’re not filtering by subject
        pathData = JSON.parse(existingPathStr) as HomeworkPath;
      } else if (subjectId) {
        // ⬅️ SUBJECT-SPECIFIC PATH (when user changes dropdown)
        pathData = await buildAndSaveInitialHomeworkPath(
          student,
          allPendingAssignments
        );
      } else {
        // ⬅️ GLOBAL PATH ON FIRST LOAD: use Util.pickFiveHomeworkLessons
        if (!allPendingAssignments.length) {
          const emptyPath: HomeworkPath = {
            path_id: uuidv4(),
            lessons: [],
            currentIndex: 0,
          };
          await saveHomeworkPath(student, emptyPath);
          pathData = emptyPath;
        } else {
          // enrich assignments with lesson + subject_id
          const assignmentsWithSubject: any[] = [];
          const pendingBySubject: { [key: string]: any[] } = {};

          for (const assignment of allPendingAssignments) {
            const lesson = await api.getLesson(assignment.lesson_id);
            if (!lesson || !lesson.subject_id) continue;

            const enriched = {
              ...assignment,
              lesson,
              subject_id: lesson.subject_id,
            };

            assignmentsWithSubject.push(enriched);

            if (!pendingBySubject[lesson.subject_id]) {
              pendingBySubject[lesson.subject_id] = [];
            }
            pendingBySubject[lesson.subject_id].push(enriched);
          }

          if (!assignmentsWithSubject.length) {
            const emptyPath: HomeworkPath = {
              path_id: uuidv4(),
              lessons: [],
              currentIndex: 0,
            };
            await saveHomeworkPath(student, emptyPath);
            pathData = emptyPath;
          } else {
            // find subjects with max pending (for tie-breaking)
            let maxPending = 0;
            let subjectsWithMaxPending: string[] = [];

            Object.keys(pendingBySubject).forEach((subject) => {
              const length = pendingBySubject[subject].length;
              if (length > maxPending) {
                maxPending = length;
                subjectsWithMaxPending = [subject];
              } else if (length === maxPending) {
                subjectsWithMaxPending.push(subject);
              }
            });

            let completedCountBySubject: { [key: string]: number } = {};

            if (subjectsWithMaxPending.length > 1) {
              const completedCounts =
                await api.getCompletedAssignmentsCountForSubjects(
                  student.id,
                  subjectsWithMaxPending
                );
              completedCountBySubject = completedCounts.reduce(
                (acc, { subject_id, completed_count }) => {
                  acc[subject_id] = completed_count;
                  return acc;
                },
                {} as { [key: string]: number }
              );
            }

            const selectedAssignments = Util.pickFiveHomeworkLessons(
              assignmentsWithSubject,
              completedCountBySubject
            );

            const lessonsWithDetails = selectedAssignments.map(
              (assignment: any) => ({
                ...assignment,
                lesson: assignment.lesson,
              })
            );

            const newHomeworkPath: HomeworkPath = {
              path_id: uuidv4(),
              lessons: lessonsWithDetails,
              currentIndex: 0,
            };

            await saveHomeworkPath(student, newHomeworkPath);
            pathData = newHomeworkPath;
          }
        }
      }

      // 4. Set dropdown default subject when there is no subject filter
      if (
        !subjectId &&
        pathData &&
        pathData.lessons &&
        pathData.lessons.length > 0
      ) {
        const firstCourseId = String(pathData.lessons[0].course_id);
        setSelectedSubject(firstCourseId);
      }

      // 5. Determine effective current index
      let effectiveCurrentIndex = 0;
      if (pathData) {
        effectiveCurrentIndex = pathData.currentIndex || 0;
      } else if (existingPathStr) {
        const parsedPath = JSON.parse(existingPathStr) as HomeworkPath;
        effectiveCurrentIndex = parsedPath.currentIndex || 0;
      }

      if (isDropdownAlwaysEnabled) {
        setIsDropdownDisabled(false);
      } else {
        // Disable dropdown only if user is beyond first assignment
        setIsDropdownDisabled(effectiveCurrentIndex > 0);
      }
      // 6. Award stars if path complete
      if (
        pathData &&
        pathData.lessons &&
        pathData.currentIndex >= pathData.lessons.length
      ) {
        await awardStarsForPathCompletion(student, 10);
      }

      // 7. Update chapter and lesson box details for UI
      if (pathData && pathData.lessons && pathData.lessons.length > 0) {
        const currentIndex = pathData.currentIndex || 0;
        const currentObj = pathData.lessons[currentIndex];

        if (currentObj && currentObj.lesson) {
          let cName = "Chapter";
          if (currentObj.lesson.chapter_id) {
            const chapter = await api.getChapterById(
              currentObj.lesson.chapter_id
            );
            cName = chapter?.name || "Chapter";
          }

          setBoxDetails({
            cName: cName,
            lName: currentObj.lesson.name,
          });
        }
      }

      // 8. Force re-render of child structure component
      setRefreshKey((prev) => prev + 1);
    } catch (error) {
      console.error("Error in fetchHomeworkPathway:", error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * SUBJECT-SPECIFIC path builder, used when dropdown subject is chosen.
   */
  const buildAndSaveInitialHomeworkPath = async (
    student: TableTypes<"user">,
    pendingAssignments: any[]
  ) => {
    if (!pendingAssignments || pendingAssignments.length === 0) {
      const emptyPath: HomeworkPath = {
        path_id: uuidv4(),
        lessons: [],
        currentIndex: 0,
      };
      await saveHomeworkPath(student, emptyPath);
      return emptyPath;
    }

    const pendingBySubject: { [key: string]: any[] } = {};

    for (const assignment of pendingAssignments) {
      const lesson = await api.getLesson(assignment.lesson_id);
      if (lesson && lesson.subject_id) {
        pendingBySubject[lesson.subject_id] = (
          pendingBySubject[lesson.subject_id] || []
        ).concat(assignment);
      }
    }

    let maxPending = 0;
    let subjectsWithMaxPending: string[] = [];
    Object.keys(pendingBySubject).forEach((subject) => {
      const length = pendingBySubject[subject].length;
      if (length > maxPending) {
        maxPending = length;
        subjectsWithMaxPending = [subject];
      } else if (length === maxPending) {
        subjectsWithMaxPending.push(subject);
      }
    });

    const bestSubject = subjectsWithMaxPending[0];
    const assignmentsForSubject = pendingBySubject[bestSubject] || [];

    assignmentsForSubject.sort((a, b) => {
      const isAManual = a.source === "manual";
      const isBManual = b.source === "manual";

      if (isAManual && !isBManual) return -1;
      if (!isAManual && isBManual) return 1;
      return 0;
    });

    // Select top 5 after sorting
    const selectedAssignments = assignmentsForSubject.slice(0, 5);

    const lessonsWithDetails = await Promise.all(
      selectedAssignments.map(async (assignment) => {
        const lesson = await api.getLesson(assignment.lesson_id);
        return { ...assignment, lesson };
      })
    );

    const newHomeworkPath: HomeworkPath = {
      path_id: uuidv4(),
      lessons: lessonsWithDetails,
      currentIndex: 0,
    };

    await saveHomeworkPath(student, newHomeworkPath);
    return newHomeworkPath;
  };

  const saveHomeworkPath = async (
    student: TableTypes<"user">,
    path: HomeworkPath
  ) => {
    sessionStorage.setItem(HOMEWORK_PATHWAY, JSON.stringify(path));

    if (!path.lessons || path.lessons.length < 5) {
      return;
    }

    const eventData = {
      user_id: student.id,
      path_id: path.path_id,
      current_course_id: path.lessons[0].course_id,
      current_lesson_id: path.lessons[0].lesson_id,
      current_chapter_id: path.lessons[0].chapter_id,
      path_lesson_one: path.lessons[0].lesson_id,
      path_lesson_two: path.lessons[1].lesson_id,
      path_lesson_three: path.lessons[2].lesson_id,
      path_lesson_four: path.lessons[3].lesson_id,
      path_lesson_five: path.lessons[4].lesson_id,
    };

    // Use the new, specific event name
    await Util.logEvent(EVENTS.HOMEWORK_PATHWAY_CREATED, eventData);
  };

  // ✅ New handler for clicking the disabled dropdown wrapper
  const handleDropdownWrapperClick = () => {
    if (isDropdownDisabled) {
      setShowDisabledDropdownModal(true);
    }
  };

  if (loading) return <Loading isLoading={loading} />;

  return (
    <div className="homework-pathway-container">
      <div className="homeworkpathway-pathway_section">
        <div
          className="homework-dropdown-wrapper"
          onClick={handleDropdownWrapperClick}
        >
          <DropdownMenu
            selectedSubject={selectedSubject}
            onSubjectChange={onSubjectChange}
            onCourseChange={() => {
              const currentStudent = Util.getCurrentStudent();
              if (currentStudent) {
                fetchHomeworkPathway(currentStudent);
              }
            }}
            disabled={isDropdownDisabled}
            hideArrow={isDropdownDisabled}
            syncWithLearningPath={false}
          />
        </div>
        <HomeworkPathwayStructure
          key={refreshKey}
          selectedSubject={selectedSubject}
          onPlayMoreHomework={onPlayMoreHomework}
        />
      </div>

      <div className="homeworkpathway-chapter-egg-container">
        <ChapterLessonBox
          chapterName={boxDetails?.cName || "Loading"}
          lessonName={boxDetails?.lName || "..."}
          containerStyle={{
            width: "35vw",
          }}
        />
      </div>

      {/* ✅ Render the modal when its state is true */}
      {showDisabledDropdownModal && (
        <PathwayModal
          text={t("Keep going!\nFinish these lesson to choose subject")}
          onClose={() => setShowDisabledDropdownModal(false)}
          onConfirm={() => setShowDisabledDropdownModal(false)}
        />
      )}
    </div>
  );
};

export default HomeworkPathway;
