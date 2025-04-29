import { FC, useEffect, useRef, useState } from "react";
import './DropdownMenu.css';
import { TableTypes } from '../../common/constants';
import SelectIconImage from '../displaySubjects/SelectIconImage';
import { ServiceConfig } from "../../services/ServiceConfig";

interface CourseDetails {
  course: TableTypes<"course">;
  grade?: TableTypes<"grade"> | null;
  curriculum?: TableTypes<"curriculum"> | null;
}

const DropdownMenu: FC<{ courses: TableTypes<"course">[] }> = ({ courses }) => {
  const [expanded, setExpanded] = useState<boolean>(false);
  const [courseDetails, setCourseDetails] = useState<CourseDetails[]>([]);
  console.log("My courses", courseDetails)
  const [selected, setSelected] = useState<CourseDetails | null>(null);
  const itemRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const api = ServiceConfig.getI().apiHandler;

  useEffect(() => {
    fetchCourseDetails();
  }, [courses]);

  const fetchCourseDetails = async () => {
    const detailedCourses: CourseDetails[] = await Promise.all(
      courses.map(async (course) => {
        const gradeDoc = await api.getGradeById(course.grade_id!);
        const curriculumDoc = await api.getCurriculumById(course.curriculum_id!);
        return {
          course,
          grade: gradeDoc,
          curriculum: curriculumDoc,
        };
      })
    );
    setCourseDetails(detailedCourses);
    if (detailedCourses.length > 0) {
      setSelected(detailedCourses[0]);
    }
  };

  const handleSelect = (subject: CourseDetails) => {
    setSelected(subject);
    setExpanded(false);
  };

  const getSortedSubjects = () => {
    return [...courseDetails].sort((a, b) => (a.course.sort_index ?? 0) - (b.course.sort_index ?? 0));
  };

  const truncateName = (name: string) => {
    if(name.split(" ").length > 1) {
      return name.split(" ")[1]
      } else return name
  };

  useEffect(() => {
    if (expanded && selected) {
      const selectedRef = itemRefs.current[selected.course.id];
      selectedRef?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [expanded, selected]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1vh" }}>
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
                imageWidth="80%"
                imageHeight="auto"
              />
            </div>
          )}

          {expanded && (
            <div className="dropdown-items">
              {getSortedSubjects().map((detail, index) => (
                <div
                  ref={(el) => (itemRefs.current[detail.course.id] = el)}
                  className={`menu-item ${expanded && selected?.course.id === detail.course.id ? "selected-expanded" : ""}`}
                  key={index}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelect(detail);
                  }}
                >
                  <SelectIconImage
                    localSrc={`courses/chapter_icons/${detail.course.code}.webp`}
                    defaultSrc={"assets/icons/DefaultIcon.png"}
                    webSrc={detail.course.image || "assets/icons/DefaultIcon.png"}
                    imageWidth="90%"
                  />
                  <div style={{ fontSize: "10px", marginTop: "-6px" }}>
                    {truncateName(detail.course.name)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className={`dropdown-arrow ${expanded ? "expanded-arrow" : ""}`}>
          <img
            src={expanded ? '/assets/icons/ArrowDropUp.svg' : '/assets/icons/ArrowDropDown.svg'}
            alt="Toggle Dropdown"
            className="expand-icon"
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
