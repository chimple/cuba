import { FC, useEffect, useRef, useState } from "react";
import './DropdownMenu.css';
import SelectIconImage from '../displaySubjects/SelectIconImage';
import { ServiceConfig } from "../../services/ServiceConfig";
import { Util } from "../../utility/util";

interface CourseDetails {
  id: string;
  name: string;
  image: string | null;
}

const DropdownMenu: FC = () => {
  const [expanded, setExpanded] = useState<boolean>(false);
  const [courses, setCourses] = useState<CourseDetails[]>([]);
  const [currentCourseIndex, setCurrentCourseIndex] = useState<number>(0);
  const itemRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const api = ServiceConfig.getI().apiHandler;

  useEffect(() => {
    fetchLearningPathCourses();
  }, []);

  const fetchLearningPathCourses = async () => {
    const currentStudent = await Util.getCurrentStudent();

    if (!currentStudent || !currentStudent.learning_path) {
      console.error("No learning path found for the user");
      return;
    }

    const learningPath = JSON.parse(currentStudent.learning_path);
    const courseList = learningPath.courses.courseList;
    setCurrentCourseIndex(learningPath.courses.currentCourseIndex);

    const detailedCourses = await Promise.all(
      courseList.map(async (course: { course_id: string }) => {
        const courseData = await api.getCourse(course.course_id);
        if (!courseData) {
          console.error(`Course data not found for course ID: ${course.course_id}`);
          return null;
        }
        return {
          id: courseData.id,
          name: courseData.name,
          image: courseData.image,
        };
      })
    );

    setCourses(detailedCourses);
  };

  const handleSelect = async (index: number) => {
    setCurrentCourseIndex(index);
    setExpanded(false);

    const currentStudent = await Util.getCurrentStudent();
    if (!currentStudent || !currentStudent.learning_path) return;

    const learningPath = JSON.parse(currentStudent.learning_path);
    learningPath.courses.currentCourseIndex = index;

    await api.updateLearningPath(currentStudent, JSON.stringify(learningPath));
    await Util.setCurrentStudent({ ...currentStudent, learning_path: JSON.stringify(learningPath) }, undefined);

    // Dispatch a custom event to notify about the course change
    const event = new CustomEvent("courseChanged", { detail: { currentStudent } });
    window.dispatchEvent(event);
  };

  useEffect(() => {
    if (expanded) {
      const selectedRef = itemRefs.current[courses[currentCourseIndex]?.id];
      selectedRef?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [expanded, currentCourseIndex]);

  return (
    <div className="dropdown-main">
      <div
        className={`dropdown-container ${expanded ? "expanded" : ""}`}
        onClick={() => setExpanded((prev) => !prev)}
      >
        <div className="dropdown-left">
          {!expanded && courses[currentCourseIndex] && (
            <div className="selected-icon">
              <SelectIconImage
                defaultSrc={"assets/icons/DefaultIcon.png"}
                webSrc={courses[currentCourseIndex].image || "assets/icons/DefaultIcon.png"}
                imageWidth="80%"
                imageHeight="auto"
              />
            </div>
          )}

          {expanded && (
            <div className="dropdown-items">
              {courses.map((course, index) => (
                <div
                  ref={(el) => (itemRefs.current[course.id] = el)}
                  className={`menu-item ${expanded && currentCourseIndex === index ? "selected-expanded" : ""}`}
                  key={course.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelect(index);
                  }}
                >
                  <SelectIconImage
                    defaultSrc={"assets/icons/DefaultIcon.png"}
                    webSrc={course.image || "assets/icons/DefaultIcon.png"}
                    imageWidth="80%"
                  />
                  <div className="truncate-style">
                    {course.name}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className={`dropdown-arrow ${expanded ? "expanded-arrow" : ""}`}>
          <SelectIconImage
            defaultSrc={expanded ? '/assets/icons/ArrowDropUp.svg' : '/assets/icons/ArrowDropDown.svg'}
          />
        </div>
      </div>

        {!expanded && courses[currentCourseIndex] && (
          <div className="dropdown-label">
            {courses[currentCourseIndex].name}
          </div>
        )}
    </div>
  );
};

export default DropdownMenu;