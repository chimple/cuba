import { FC, useEffect, useRef, useState } from "react";
import './DropdownMenu.css';
import { TableTypes } from '../../common/constants';
import SelectIconImage from '../displaySubjects/SelectIconImage';
import { ServiceConfig } from "../../services/ServiceConfig";
import { Util } from "../../utility/util";

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
    const currentStudent = await Util.getCurrentStudent();

    if (!currentStudent || !currentStudent.learning_path) {
      console.error("No learning path found for the user");
      return;
    }

    const learningPath = JSON.parse(currentStudent.learning_path);
    const courseList = learningPath.courses.courseList;
    const currentIndex = learningPath.courses.currentCourseIndex ?? 0;

    const detailedCourses: CourseDetails[] = await Promise.all(
      courseList.map(async (entry: { course_id: string }) => {
        const course = await api.getCourse(entry.course_id);
        if (!course) return null;

        const [gradeDoc, curriculumDoc] = await Promise.all([
          api.getGradeById(course.grade_id!),
          api.getCurriculumById(course.curriculum_id!)
        ]);

        return {
          course,
          grade: gradeDoc,
          curriculum: curriculumDoc
        };
      })
    ).then(results => results.filter(Boolean) as CourseDetails[]);

    setCourseDetails(detailedCourses);
    setSelected(prev => prev || detailedCourses[currentIndex] || null);
  };

  const handleSelect = async (subject: CourseDetails, index: number) => {
    setSelected(subject);
    setExpanded(false);

    const currentStudent = await Util.getCurrentStudent();
    if (!currentStudent || !currentStudent.learning_path) return;

    const learningPath = JSON.parse(currentStudent.learning_path);
    learningPath.courses.currentCourseIndex = index;

    await api.updateLearningPath(currentStudent, JSON.stringify(learningPath));
    await Util.setCurrentStudent({ ...currentStudent, learning_path: JSON.stringify(learningPath) }, undefined);

    // Dispatch event
    const event = new CustomEvent("courseChanged", { detail: { currentStudent } });
    window.dispatchEvent(event);
  };

  const truncateName = (name: string) => {
    const parts = name.split(" ");
    return parts.length > 1 ? parts[1] : name;
  };

  useEffect(() => {
    if (expanded && selected) {
      const selectedRef = itemRefs.current[selected.course.id];
      selectedRef?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [expanded, selected]);

  return (
    <div className="dropdown-main">
      <div
        className={`dropdown-container ${expanded ? "expanded" : ""}`}
        onClick={() => setExpanded(prev => !prev)}
      >
        <div className="dropdown-left">
          {!expanded && selected && (
            <div className="selected-icon">
              <SelectIconImage
                localSrc={`courses/chapter_icons/${selected.course.code}.webp`}
                defaultSrc={"assets/icons/DefaultIcon.png"}
                webSrc={selected.course.image || "assets/icons/DefaultIcon.png"}
                imageWidth="10vh"
                imageHeight="auto"
              />
            </div>
          )}

          {expanded && (
            <div className="dropdown-items"
            onClick={(e) => e.stopPropagation()}
            >
              {courseDetails.map((detail, index) => (
                <div
                  ref={(el) => (itemRefs.current[detail.course.id] = el)}
                  className={`menu-item ${expanded && selected?.course.id === detail.course.id ? "selected-expanded" : ""}`}
                  key={detail.course.id}
                  onClick={(e) => {
                    // e.stopPropagation();
                    handleSelect(detail, index);
                  }}
                >
                  <SelectIconImage
                    localSrc={`courses/chapter_icons/${detail.course.code}.webp`}
                    defaultSrc={"assets/icons/DefaultIcon.png"}
                    webSrc={detail.course.image || "assets/icons/DefaultIcon.png"}
                    imageWidth="85%"
                  />
                  <div className="truncate-style">
                    {truncateName(detail.course.name)}
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

      <div>
        {!expanded && selected && (
          <div className="dropdown-label">
            {selected.course.name}
          </div>
        )}
      </div>
    </div>
  );
};

export default DropdownMenu;
