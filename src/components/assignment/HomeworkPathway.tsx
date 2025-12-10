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
import HomeworkCompleteModal from "./HomeworkCompleteModal";

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
  const [isHomeworkComplete, setIsHomeworkComplete] = useState(false);

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
    if (!currentStudent?.id) return;

    const studentId = currentStudent.id;
    const dbStars = currentStudent.stars || 0;

    // ⭐ Local-first: read from localStorage (STARS_COUNT/LATEST_STARS) via Util,
    // fallback to DB value if nothing stored.
    const localStars = Util.getLocalStarsForStudent(studentId, dbStars);

    // Decide animation range
    let fromVal = localStars;
    let toVal = localStars;

    if (localStars < dbStars) {
      // DB has more stars (e.g. user played on another device) → animate up to DB
      fromVal = localStars;
      toVal = dbStars;

      // Sync local storage to DB value so future reads start at correct value
      Util.setLocalStarsForStudent(studentId, dbStars);
    } else if (localStars > dbStars) {
      // Local is ahead of the DB (offline play / UI already bumped)
      // For UI we animate from DB → local (if you want that effect)
      fromVal = dbStars;
      toVal = localStars;
    }

    setFrom(fromVal);
    setTo(toVal);

    // Best-effort: if local is ahead, push to backend when online.
    // This keeps DB in sync but UI never waits on it.
    try {
      if (
        typeof navigator === "undefined" ||
        (navigator && navigator.onLine && localStars > dbStars)
      ) {
        await api.updateStudentStars(studentId, localStars);
      }
    } catch (err) {
      console.warn("[Stars sync] Failed to sync stars with backend", err);
    }
  };

  const onSubjectChange = async (subjectId: string) => {
    if (subjectId === selectedSubject) {
      return;
    }
    const currentStudent = Util.getCurrentStudent();
    localStorage.removeItem(HOMEWORK_PATHWAY);
    setIsDropdownDisabled(false); // allow switching again until they start playing
    if (currentStudent) {
      await fetchHomeworkPathway(currentStudent, subjectId);
    }
    setSelectedSubject(subjectId);
  };

  async function awardStarsForPathCompletion(
    student: TableTypes<"user">,
    starsToAdd: number
  ) {
    if (!student?.id) return;
    // 1) Local-first bump (this will also fire "starsUpdated")
    const newLocalStars = Util.bumpLocalStarsForStudent(
      student.id,
      starsToAdd,
      student.stars || 0
    );

    // 2) Best-effort sync DB
    try {
      await api.updateStudentStars(student.id, newLocalStars);
    } catch (err) {
      console.warn(
        "[awardStarsForPathCompletion] failed to sync with backend",
        err
      );
    }

    // 3) Optional: re-run updateStarCount in case header / other logic depends on it
    await updateStarCount(student);
  }
  const normalizeAssignment = async (assignment: any) => {
    // if assignment already has .lesson, keep it; otherwise fetch
    const lesson =
      assignment.lesson ??
      (assignment.lesson_id ? await api.getLesson(assignment.lesson_id) : null);

    return {
      assignment_id: assignment.assignment_id ?? assignment.id ?? null,
      lesson_id: assignment.lesson_id ?? lesson?.id ?? null,
      chapter_id: assignment.chapter_id ?? lesson?.chapter_id ?? null,
      course_id: assignment.course_id ?? lesson?.course_id ?? null,
      lesson: lesson ?? null,
      raw_assignment: assignment,
    };
  };

  const fetchHomeworkPathway = async (
    student: TableTypes<"user">,
    subjectId?: string
  ) => {
    setLoading(true);

    // 0️⃣ Read existing path from localStorage (if any)
    const existingPathStr = localStorage.getItem(HOMEWORK_PATHWAY);
    let existingPath: HomeworkPath | null = null;

    if (existingPathStr) {
      try {
        const parsed = JSON.parse(existingPathStr) as HomeworkPath;

        const hasLessons =
          Array.isArray(parsed.lessons) && parsed.lessons.length > 0;
        const notFinished =
          typeof parsed.currentIndex === "number" &&
          parsed.currentIndex < parsed.lessons.length;

        if (hasLessons && notFinished) {
          // ✅ active path → we can reuse
          existingPath = parsed;
        } else {
          // ✅ finished or invalid path → drop it so we can rebuild
          localStorage.removeItem(HOMEWORK_PATHWAY);
        }
      } catch (err) {
        console.warn("Invalid HOMEWORK_PATHWAY in localStorage:", err);
        localStorage.removeItem(HOMEWORK_PATHWAY);
      }
    }

    let pathData: HomeworkPath | null = null;

    try {
      const currClass = Util.getCurrentClass();
      if (!currClass?.id) {
        setLoading(false);
        return;
      }

      // 1️⃣ If we already have a good cached path and NO subject filter:
      //    Use it and don't depend on network (offline friendly)
      if (!subjectId && existingPath) {
        pathData = existingPath;
      } else {
        // 2️⃣ Need (re)build from assignments (first time / subject change)
        const all = await api.getPendingAssignments(currClass.id, student.id);
        let allPendingAssignments = all.filter((a) => a.type !== LIVE_QUIZ);

        // 2a. Subject filter, if any
        if (subjectId) {
          allPendingAssignments = allPendingAssignments.filter(
            (assignment) => String(assignment.course_id) === String(subjectId)
          );

          if (!allPendingAssignments.length) {
            // No assignments for this subject → reset selection & fall back to global path
            setSelectedSubject(null);

            if (existingPath) {
              pathData = existingPath;
            } else {
              // No path yet, try global recompute
              return fetchHomeworkPathway(student);
            }
          }
        }

        // 3️⃣ If pathData still not set, build it
        if (!pathData) {
          if (!subjectId) {
            if (!allPendingAssignments.length) {
              const emptyPath: HomeworkPath = {
                path_id: uuidv4(),
                lessons: [],
                currentIndex: 0,
              };
              await saveHomeworkPath(student, emptyPath);
              pathData = emptyPath;
            } else {
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

                const lessonsWithDetails = await Promise.all(
                  selectedAssignments.map(async (assignment) => {
                    return await normalizeAssignment(assignment);
                  })
                );

                const newHomeworkPath: HomeworkPath = {
                  path_id: uuidv4(),
                  lessons: lessonsWithDetails,
                  currentIndex: 0,
                };

                await saveHomeworkPath(student, newHomeworkPath);
                // ▶️ Log HOMEWORK_PATHWAY_CHANGED for the newly created path
                try {
                  const changedEvent = {
                    user_id: student.id,
                    new_path_id: newHomeworkPath.path_id,
                    new_course_id:
                      newHomeworkPath.lessons?.[0]?.course_id || null,
                    new_lesson_id:
                      newHomeworkPath.lessons?.[0]?.lesson_id || null,
                    new_chapter_id:
                      newHomeworkPath.lessons?.[0]?.chapter_id || null,
                    total_lessons_in_path: newHomeworkPath.lessons?.length || 0,
                    changed_at: new Date().toISOString(),
                    reason: subjectId
                      ? "subject_changed"
                      : "path_completed_rebuild",
                    subject_id: subjectId || null,
                  };
                  await Util.logEvent(
                    EVENTS.HOMEWORK_PATHWAY_COURSE_CHANGED,
                    changedEvent
                  );
                } catch (err) {
                  console.warn(
                    "[HomeworkPathway] Failed to log HOMEWORK_PATHWAY_CHANGED event",
                    err
                  );
                }

                pathData = newHomeworkPath;
              }
            }
          } else {
            // ⭐ SUBJECT-SPECIFIC path when dropdown is used
            pathData = await buildAndSaveInitialHomeworkPath(
              student,
              allPendingAssignments,
              subjectId
            );
          }
        }
      }

      // ---- From here on, we just use pathData (from cache OR built) ----
      if (!pathData) {
        setLoading(false);
        return;
      }

      // 4️⃣ Set dropdown default subject when no filter
      if (!subjectId && pathData.lessons && pathData.lessons.length > 0) {
        const firstCourseId = String(pathData.lessons[0].course_id);
        setSelectedSubject(firstCourseId);
      }

      // 5️⃣ Effective current index
      const effectiveCurrentIndex = pathData.currentIndex || 0;

      if (isDropdownAlwaysEnabled) {
        setIsDropdownDisabled(false);
      } else {
        setIsDropdownDisabled(effectiveCurrentIndex > 0);
      }

      // 6️⃣ Award stars if path complete
      if (
        pathData.lessons &&
        pathData.lessons.length > 0 &&
        pathData.currentIndex >= pathData.lessons.length
      ) {
        // 2️⃣ Log: HOMEWORK_PATHWAY_COMPLETED
        try {
          const prevIndex = Math.max(pathData.currentIndex - 1, 0);
          const prev = pathData.lessons[prevIndex];

          const completedEvent = {
            user_id: student.id,
            completed_path_id: pathData.path_id,
            completed_course_id: prev?.course_id || null,
            completed_lesson_id: prev?.lesson_id || prev?.lesson?.id || null,
            assignment_id: prev?.assignment_id || null,
            completed_chapter_id: prev?.chapter_id || null,
            total_lessons_in_path: pathData.lessons.length,
            completed_at: new Date().toISOString(),
          };

          await Util.logEvent(
            EVENTS.HOMEWORK_PATHWAY_COMPLETED,
            completedEvent
          );
        } catch (err) {
          console.warn(
            "[HomeworkPathway] Failed to log pathway-completed event",
            err
          );
        }
        localStorage.removeItem(HOMEWORK_PATHWAY);
      }

      // 7️⃣ Update chapter & lesson box info
      if (pathData.lessons && pathData.lessons.length > 0) {
        const idx = Math.min(
          pathData.currentIndex || 0,
          pathData.lessons.length - 1
        );
        const currentObj = pathData.lessons[idx];

        if (!currentObj) return;

        const lessonName = currentObj.lesson?.name || "Lesson";
        let chapterName = "Chapter";

        try {
          if (currentObj.chapter_id) {
            const chapter = await api.getChapterById(currentObj.chapter_id);
            chapterName = chapter?.name || chapterName;
          }
        } catch (error) {
          console.warn("Failed fetching chapter details", error);
        }

        console.log("ChapterLessonBox data", {
          chapterName,
          lessonName,
          currentObj,
        });

        setBoxDetails({
          cName: chapterName,
          lName: lessonName,
        });
      }

      // 8️⃣ Notify structure to re-render
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
    pendingAssignments: any[],
    subjectId?: string
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
        // use normalizeAssignment which ensures lesson is present
        return await normalizeAssignment(assignment);
      })
    );

    const newHomeworkPath: HomeworkPath = {
      path_id: uuidv4(),
      lessons: lessonsWithDetails,
      currentIndex: 0,
    };

    await saveHomeworkPath(student, newHomeworkPath);
    // ▶️ Log HOMEWORK_PATHWAY_CHANGED for the newly created path
    if (subjectId) setSelectedSubject(subjectId);
    try {
      const changedEvent = {
        user_id: student.id,
        new_path_id: newHomeworkPath.path_id,
        subject_id: subjectId ?? null,
        new_course_id: newHomeworkPath.lessons?.[0]?.course_id ?? null,
        new_lesson_id: newHomeworkPath.lessons?.[0]?.lesson_id ?? null,
        assignment_id: newHomeworkPath.lessons?.[0]?.assignment_id ?? null,
        total_lessons_in_path: newHomeworkPath.lessons?.length ?? 0,
        lesson_ids: newHomeworkPath.lessons.map(
          (l: any) => l.lesson_id ?? null
        ),
        assignment_ids: newHomeworkPath.lessons.map(
          (l: any) => l.assignment_id ?? null
        ),
        changed_at: new Date().toISOString(),
        reason: subjectId ? "subject_changed" : "subject_specific",
      };
      await Util.logEvent(EVENTS.HOMEWORK_PATHWAY_COURSE_CHANGED, changedEvent);
    } catch (err) {
      console.warn(
        "[HomeworkPathway] Failed to log HOMEWORK_PATHWAY_CHANGED event",
        err
      );
    }

    return newHomeworkPath;
  };

  const saveHomeworkPath = async (
    student: TableTypes<"user">,
    path: HomeworkPath
  ) => {
    localStorage.setItem(HOMEWORK_PATHWAY, JSON.stringify(path));

    if (!path.lessons || path.lessons.length < 5) {
      return;
    }

    const assignmentIds = (path.lessons || []).map(
      (l: any) => l.assignment_id ?? null
    );

    // Build compact list of up to 5 assignment ids with explicit keys (assignment_id_1 .. 5)
    const assignmentSlots: any = {};
    for (let i = 0; i < 5; i++) {
      assignmentSlots[`assignment_id_${i + 1}`] = assignmentIds[i] ?? null;
    }

    const eventData = {
      user_id: student.id,
      path_id: path.path_id,
      current_course_id: path.lessons?.[0]?.course_id ?? null,
      current_lesson_id: path.lessons?.[0]?.lesson_id ?? null,
      current_chapter_id: path.lessons?.[0]?.chapter_id ?? null,
      total_lessons_in_path: path.lessons?.length ?? 0,
      lesson_ids: path.lessons?.map((l: any) => l.lesson_id ?? null) ?? [],
      assignment_ids: assignmentIds,
      created_at: new Date().toISOString(),
      ...assignmentSlots,
    };

    await Util.logEvent(EVENTS.HOMEWORK_PATHWAY_CREATED, eventData);
  };

  // ✅ New handler for clicking the disabled dropdown wrapper
  const handleDropdownWrapperClick = () => {
    if (isDropdownDisabled) {
      setShowDisabledDropdownModal(true);
    }
  };

  if (loading) return <Loading isLoading={loading} />;

  if (isHomeworkComplete) {
    return (
      <div className="pending-assignment">
        <HomeworkCompleteModal
          text={t("Yay!! You have completed all the Homework!!")}
          borderImageSrc="/pathwayAssets/homeworkCelebration.svg"
          onClose={() => setIsHomeworkComplete(false)}
          onPlayMore={() => {
            setIsHomeworkComplete(false);
            if (onPlayMoreHomework) {
              onPlayMoreHomework();
            }
          }}
        />
      </div>
    );
  }

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
          onHomeworkComplete={() => setIsHomeworkComplete(true)}
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
          text={t("Keep going!\nFinish these lesson to change the subject")}
          onClose={() => setShowDisabledDropdownModal(false)}
          onConfirm={() => setShowDisabledDropdownModal(false)}
        />
      )}
    </div>
  );
};

export default HomeworkPathway;
