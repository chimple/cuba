import { FC, useEffect, useRef, useState } from "react";
import "./DropdownMenu.css";
import { EVENTS, TableTypes } from "../../common/constants";
import SelectIconImage from "../displaySubjects/SelectIconImage";
import { ServiceConfig } from "../../services/ServiceConfig";
import { Util } from "../../utility/util";
import { t } from "i18next";

interface CourseDetails {
  course: TableTypes<"course">;
  grade?: TableTypes<"grade"> | null;
  curriculum?: TableTypes<"curriculum"> | null;
}

const DropdownMenu: FC = () => {
  const [expanded, setExpanded] = useState<boolean>(false);
  const [courseDetails, setCourseDetails] = useState<CourseDetails[]>([]);
  const [selected, setSelected] = useState<CourseDetails | null>(null);
  const itemRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const api = ServiceConfig.getI().apiHandler;

  useEffect(() => {
    fetchLearningPathCourseDetails();
  }, []);

  const fetchLearningPathCourseDetails = async () => {
    try {
      const currentStudent = await Util.getCurrentStudent();

      if (!currentStudent?.learning_path) {
        console.error("No learning path found for the user");
        return;
      }

      // Parse learning path only once
      const learningPath = JSON.parse(currentStudent.learning_path);
      const { courseList } = learningPath.courses;
      const currentIndex = learningPath.courses.currentCourseIndex ?? 0;

      // Pre-allocate array for better performance
      const coursePromises: Promise<CourseDetails | null>[] = [];

      // Prepare all promises first (no await in loop)
      for (const entry of courseList) {
        const promise = (async () => {
          try {
            const course = await api.getCourse(entry.course_id);
            if (!course) return null;

            // Parallelize these requests
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

      // Wait for all promises to settle
      const detailedCourses = (await Promise.all(coursePromises)).filter(
        Boolean
      ) as CourseDetails[];

      // Update state in one batch if possible
      setCourseDetails(detailedCourses);
      setSelected((prev) => prev || detailedCourses[currentIndex] || null);
    } catch (error) {
      console.error("Error in fetchLearningPathCourseDetails:", error);
    }
  };

  const handleSelect = async (subject: CourseDetails, index: number) => {
    try {
      setSelected(subject);
      setExpanded(false);

      const currentStudent = await Util.getCurrentStudent();
      if (!currentStudent?.learning_path) return;

      // Parse learning path once
      const learningPath = JSON.parse(currentStudent.learning_path);
      const { courseList, currentCourseIndex } = learningPath.courses;

      // Get previous course info more efficiently
      const prevCourse = courseList[currentCourseIndex];
      const prevPathItem = prevCourse?.path?.[prevCourse.currentIndex];

      // Extract previous IDs
      const prevCourseId = prevCourse?.course_id;
      const prevLessonId = prevPathItem?.lesson_id;
      const prevChapterId = prevPathItem?.chapter_id;
      const prevPathId = prevCourse?.path_id;

      // Update learning path index
      learningPath.courses.currentCourseIndex = index;

      // Prepare all async operations first
      const updateOperations = [
        api.updateLearningPath(currentStudent, JSON.stringify(learningPath)),
        Util.setCurrentStudent(
          { ...currentStudent, learning_path: JSON.stringify(learningPath) },
          undefined
        ),
      ];

      // Get current course info after update
      const currentCourse = courseList[index];
      const currentPathItem = currentCourse?.path?.[currentCourse.currentIndex];

      // Prepare event data
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

      // Add event logging to operations
      updateOperations.push(
        Util.logEvent(EVENTS.PATHWAY_COURSE_CHANGED, eventData)
      );

      // Execute all async operations in parallel
      await Promise.all(updateOperations);

      // Dispatch event after all operations complete
      window.dispatchEvent(
        new CustomEvent("courseChanged", { detail: { currentStudent } })
      );
    } catch (error) {
      console.error("Error in handleSelect:", error);
      // Consider adding error handling UI feedback here
    }
  };

  const truncateName = (name: string) => {
    const parts = name.split(" ");
    return parts.length > 1 ? parts[1] : name;
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

      await Promise.any(sources.map(preloadImage));
    });

    if (expanded && selected) {
      const selectedRef = itemRefs.current[selected.course.id];
      selectedRef?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [expanded, selected, courseDetails]);

  return (
    <div className="dropdown-main">
      <div
        className={`dropdown-container ${expanded ? "expanded" : ""}`}
        onClick={() => setExpanded((prev) => !prev)}
      >
        <div className="dropdown-left">
          {!expanded && selected && (
            <>
              <div className="menu-selected">
                <div className="selected-icon">
                  <SelectIconImage
                    localSrc={`courses/chapter_icons/${selected.course.code}.webp`}
                    defaultSrc={"assets/icons/DefaultIcon.png"}
                    webSrc={
                      selected.course.image || "assets/icons/DefaultIcon.png"
                    }
                    imageWidth="10vh"
                    imageHeight="auto"
                  />
                </div>
              </div>
            </>
          )}
          {expanded && (
            <div
              className="dropdown-items"
              onClick={(e) => e.stopPropagation()}
            >
              {courseDetails.map((detail, index) => (
                <div
                  ref={(el) => {
                    itemRefs.current[detail.course.id] = el;
                  }}
                  className={`menu-item ${
                    selected?.course.id === detail.course.id
                      ? "selected-expanded"
                      : ""
                  }`}
                  key={detail.course.id}
                  onClick={() => handleSelect(detail, index)}
                >
                  <SelectIconImage
                    key={detail.course.id} // Important for cache invalidation
                    localSrc={`courses/chapter_icons/${detail.course.code}.webp`}
                    defaultSrc="assets/icons/DefaultIcon.png"
                    webSrc={
                      detail.course.image || "assets/icons/DefaultIcon.png"
                    }
                    imageWidth="85%"
                  />

                  <div className="truncate-style">
                    {truncateName(t(detail.course?.name ?? ""))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className={`dropdown-arrow ${expanded ? "expanded-arrow" : ""}`}>
          <SelectIconImage
            defaultSrc={
              expanded
                ? "/assets/icons/ArrowDropUp.svg"
                : "/assets/icons/ArrowDropDown.svg"
            }
          />
        </div>
      </div>

      <div>
        {!expanded && selected && (
          <div className="dropdown-label">{t(selected.course?.name ?? "")}</div>
        )}
      </div>
    </div>
  );
};

export default DropdownMenu;
