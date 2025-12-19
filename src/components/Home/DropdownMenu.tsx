import { FC, useEffect, useRef, useState } from "react";
import "./DropdownMenu.css";
import {
  COURSE_CHANGED,
  EVENTS,
  HOMEWORK_PATHWAY,
  LIVE_QUIZ,
  TableTypes,
} from "../../common/constants";
import SelectIconImage from "../displaySubjects/SelectIconImage";
import { ServiceConfig } from "../../services/ServiceConfig";
import { Util } from "../../utility/util";

interface CourseDetails {
  course: TableTypes<"course">;
  grade?: TableTypes<"grade"> | null;
  curriculum?: TableTypes<"curriculum"> | null;
}
const ImageUrlCache: Record<string, string> = {};

interface DropdownMenuProps {
  disabled?: boolean;
  hideArrow?: boolean;
  onCourseChange?: () => void; // used by LearningPathway
  onSubjectChange?: (subjectId: string) => void; // used by HomeworkPathway & LP
  selectedSubject?: string | null; // external controlled value (Homework)
  syncWithLearningPath?: boolean;
}

const DropdownMenu: FC<DropdownMenuProps> = ({
  disabled = false,
  hideArrow = false,
  onCourseChange,
  onSubjectChange,
  selectedSubject = null,
  syncWithLearningPath = true,
}) => {
  const [expanded, setExpanded] = useState<boolean>(false);
  const [courseDetails, setCourseDetails] = useState<CourseDetails[]>([]);
  const [selected, setSelected] = useState<CourseDetails | null>(null);
  const itemRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const api = ServiceConfig.getI().apiHandler;

  useEffect(() => {
    fetchLearningPathCourseDetails();
  }, []);

  useEffect(() => {
    // For HomeworkPathway: keep internal "selected" in sync with selectedSubject
    if (!syncWithLearningPath && selectedSubject && courseDetails.length) {
      const matched = courseDetails.find(
        (detail) => String(detail.course.id) === String(selectedSubject)
      );
      if (matched) {
        setSelected(matched);
      }
    }
  }, [selectedSubject, courseDetails, syncWithLearningPath]);

  const fetchLearningPathCourseDetails = async () => {
    try {
      const currentStudent = await Util.getCurrentStudent();

      // 🔹 HOMEWORK MODE: don't depend on HOMEWORK_PATHWAY at all
      if (!syncWithLearningPath) {
        const currClass = Util.getCurrentClass();
        if (!currentStudent?.id || !currClass?.id) {
          setCourseDetails([]);
          return;
        }

        // 👉 Get ALL pending assignments for this class & student
        const all = await api.getPendingAssignments(
          currClass.id,
          currentStudent.id
        );
        const pendingAssignments = all.filter((a) => a.type !== LIVE_QUIZ);

        if (!pendingAssignments.length) {
          setCourseDetails([]);
          return;
        }

        // 👉 Collect unique course ids from pending assignments
        const uniqueCourseIds: string[] = Array.from(
          new Set(
            pendingAssignments
              .map((a: any) => a.course_id as string | undefined)
              .filter((id): id is string => !!id)
          )
        );

        const coursePromises: Promise<CourseDetails | null>[] =
          uniqueCourseIds.map(async (courseId) => {
            try {
              const course = await api.getCourse(courseId);
              if (!course) return null;

              const [gradeDoc, curriculumDoc] = await Promise.all([
                course.grade_id
                  ? api.getGradeById(course.grade_id)
                  : Promise.resolve(null),
                course.curriculum_id
                  ? api.getCurriculumById(course.curriculum_id)
                  : Promise.resolve(null),
              ]);

              return { course, grade: gradeDoc, curriculum: curriculumDoc };
            } catch (err) {
              console.error("Failed to fetch homework course", err);
              return null;
            }
          });

        const detailedCourses = (await Promise.all(coursePromises)).filter(
          Boolean
        ) as CourseDetails[];

        setCourseDetails(detailedCourses);

        // initial selection in homework mode
        setSelected((prev) => {
          if (prev) return prev;

          if (selectedSubject) {
            const matched = detailedCourses.find(
              (detail) => String(detail.course.id) === String(selectedSubject)
            );
            if (matched) return matched;
          }

          return detailedCourses[0] || null;
        });

        return;
      }

      // 🔹 LEARNING PATHWAY MODE (original behaviour)
      if (!currentStudent?.learning_path) {
        console.error("No learning path found for the user");
        return;
      }

      if (!currentStudent?.learning_path) {
        console.error("No learning path found for the user");
        return;
      }

      const learningPath = JSON.parse(currentStudent.learning_path);
      const { courseList } = learningPath.courses;
      const currentIndex = learningPath.courses.currentCourseIndex ?? 0;

      const coursePromises: Promise<CourseDetails | null>[] = [];

      for (const entry of courseList) {
        const promise = (async () => {
          try {
            const course = await api.getCourse(entry.course_id);
            if (!course) return null;

            const [gradeDoc, curriculumDoc] = await Promise.all([
              course.grade_id
                ? api.getGradeById(course.grade_id)
                : Promise.resolve(null),
              course.curriculum_id
                ? api.getCurriculumById(course.curriculum_id)
                : Promise.resolve(null),
            ]);

            return {
              course,
              grade: gradeDoc,
              curriculum: curriculumDoc,
            };
          } catch (error) {
            console.error(
              `Failed to fetch details for course ${entry.course_id}`,
              error
            );
            return null;
          }
        })();

        coursePromises.push(promise);
      }

      const detailedCourses = (await Promise.all(coursePromises)).filter(
        Boolean
      ) as CourseDetails[];

      setCourseDetails(detailedCourses);

      // INITIAL SELECTION LOGIC
      setSelected((prev) => {
        if (prev) return prev;

        // Homework: don't follow learning_path index, use selectedSubject if provided
        if (!syncWithLearningPath) {
          if (selectedSubject) {
            const matched = detailedCourses.find(
              (detail) => String(detail.course.id) === String(selectedSubject)
            );
            if (matched) return matched;
          }
          // fallback: first course
          return detailedCourses[0] || null;
        }

        // LearningPathway: follow learning_path.currentCourseIndex as before
        return detailedCourses[currentIndex] || detailedCourses[0] || null;
      });
    } catch (error) {
      console.error("Error in fetchLearningPathCourseDetails:", error);
    }
  };

  const handleSelect = async (subject: CourseDetails, index: number) => {
    if (disabled) return;
    try {
      setSelected(subject);
      setExpanded(false);

      // 🔹 HOMEWORK MODE: DO NOT touch learning_path, only notify subject change
      if (!syncWithLearningPath) {
        if (onSubjectChange) {
          onSubjectChange(subject.course.id);
        }
        return;
      }

      // 🔹 LEARNING PATHWAY MODE (original behaviour)
      const currentStudent = await Util.getCurrentStudent();
      if (!currentStudent?.learning_path) return;

      const learningPath = JSON.parse(currentStudent.learning_path);
      const { courseList, currentCourseIndex } = learningPath.courses;

      const prevCourse = courseList[currentCourseIndex];
      const prevPathItem = prevCourse?.path?.[prevCourse.currentIndex];

      const prevCourseId = prevCourse?.course_id;
      const prevLessonId = prevPathItem?.lesson_id;
      const prevChapterId = prevPathItem?.chapter_id;
      const prevPathId = prevCourse?.path_id;

      learningPath.courses.currentCourseIndex = index;

      Util.setCurrentStudent(
        { ...currentStudent, learning_path: JSON.stringify(learningPath) },
        undefined
      )
      window.dispatchEvent(
        new CustomEvent(COURSE_CHANGED)
      );

      const currentCourse = courseList[index];
      const currentPathItem = currentCourse?.path?.[currentCourse.currentIndex];

      const eventData = {
        user_id: currentStudent.id,
        current_path_id: currentCourse?.path_id,
        current_course_id: currentCourse?.course_id,
        current_lesson_id: currentPathItem?.lesson_id,
        current_chapter_id: currentPathItem?.chapter_id,
        prev_path_id: prevPathId,
        prev_course_id: prevCourseId,
        prev_lesson_id: prevLessonId,
        prev_chapter_id: prevChapterId,
      };

      Util.logEvent(EVENTS.PATHWAY_COURSE_CHANGED, eventData)

      await api.updateLearningPath(currentStudent, JSON.stringify(learningPath));

      if (onSubjectChange) {
        onSubjectChange(subject.course.id);
      }
      if (onCourseChange) onCourseChange();
    } catch (error) {
      console.error("Error in handleSelect:", error);
    }
  };

  const truncateName = (name: string) => {
    const parts = name.split(" ");
    return parts.length > 1 ? parts[1] : name;
  };

  const handleToggleExpand = () => {
    if (hideArrow) return;
    requestAnimationFrame(() => setExpanded((prev) => !prev));
  };

  useEffect(() => {
    const preloadImage = (src: string) => {
      return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => resolve(true);
        img.onerror = () => resolve(false);
        img.src = src;
      });
    };

    courseDetails.forEach(async (detail) => {
      const sources = [
        `courses/chapter_icons/${detail.course.code}.webp`,
        detail.course.image || "",
      ].filter(Boolean);

      Promise.any(sources.map(preloadImage));
    });
  }, [courseDetails]);

  useEffect(() => {
    if (!expanded || !selected) return;
    requestAnimationFrame(() => {
      const ref = itemRefs.current[selected.course.id];
      ref?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  }, [expanded]);

const getCachedImageUrl = (course: any) => {
  const key = course.id;

  // Already cached → return
  if (ImageUrlCache[key]) return ImageUrlCache[key];

  // Missing → store immediately (public URLs are static)
  const url = course.image || "";
  ImageUrlCache[key] = url;

  return url;
};


  return (
    <div className={`dropdownmenu-dropdown-main ${disabled ? "dropdownmenu-dropdown-disabled" : ""}`}>
      <div
        className={`dropdownmenu-dropdown-container ${expanded ? "dropdownmenu-expanded" : ""}`}
        onClick={handleToggleExpand}
      >
        <div className="dropdownmenu-dropdown-left">
          {!expanded && selected && (
              <div className="dropdownmenu-menu-selected">
                <div className="dropdownmenu-selected-icon">
                  <SelectIconImage
                    localSrc={`courses/chapter_icons/${selected.course.code}.webp`}
                    defaultSrc={"assets/icons/DefaultIcon.png"}
                    webSrc={
                      getCachedImageUrl(selected.course) || "assets/icons/DefaultIcon.png"
                    }
                    imageWidth="10vh"
                    imageHeight="auto"
                  />
                </div>
              </div>
          )}
            <div
              className={`dropdownmenu-dropdown-items ${expanded ? "dropdownmenu-open" : "dropdownmenu-closed"}`}  
              onClick={(e) => e.stopPropagation()}
              aria-hidden={!expanded}
            >
              {courseDetails.map((detail, index) => (
                <div
                  ref={(el) => {
                    itemRefs.current[detail.course.id] = el;
                  }}
                  className={`dropdownmenu-menu-item ${
                    selected?.course.id === detail.course.id
                      ? "dropdownmenu-selected-expanded"
                      : ""
                  }`}
                  key={detail.course.id}
                  onClick={() => handleSelect(detail, index)}
                >
                  <SelectIconImage
                    key={detail.course.id}
                    localSrc={`courses/chapter_icons/${detail.course.code}.webp`}
                    defaultSrc="assets/icons/DefaultIcon.png"
                    webSrc={
                      getCachedImageUrl(detail.course) || "assets/icons/DefaultIcon.png"
                    }
                    imageWidth="85%"
                  />
                  <div className="dropdownmenu-truncate-style">
                    {truncateName(detail.course.name)}
                  </div>
                </div>
              ))}
            </div>
        </div>
        {!hideArrow && (
          <div className={`dropdownmenu-dropdown-arrow ${expanded ? "dropdownmenu-expanded-arrow" : ""}`}>
            <SelectIconImage
              defaultSrc={
                expanded
                  ? "/assets/icons/ArrowDropUp.svg"
                  : "/assets/icons/ArrowDropDown.svg"
              }
            />
          </div>
        )}
      </div>

      <div>
        {!expanded && selected && (
          <div className=" dropdownmenu-dropdown-label">{selected.course.name}</div>
        )}
      </div>
    </div>
  );
};

export default DropdownMenu;
