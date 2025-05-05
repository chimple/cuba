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
    if (courses.length > 0) {
      fetchCourseDetails();
    }
  }, [courses]); 
  
  const fetchCourseDetails = async () => {
    const detailedCourses: CourseDetails[] = await Promise.all(
      courses.map(async (course) => {
        const [gradeDoc, curriculumDoc] = await Promise.all([
          api.getGradeById(course.grade_id!),
          api.getCurriculumById(course.curriculum_id!)
        ]);
        return { course, grade: gradeDoc, curriculum: curriculumDoc };
      })
    );
    setCourseDetails(detailedCourses);
    if (detailedCourses.length > 0) {
      setSelected(prev => prev || detailedCourses[0]); 
    }
  };
  
  const handleSelect = (subject: CourseDetails) => {
    setSelected(subject);
  
    // Prevent closing and immediately reopening due to re-renders
    requestAnimationFrame(() => {
      setExpanded(false);
    });
  };  

  const truncateName = (name: string) => {
    if(name.split(" ").length > 1) {
      return name.split(" ")[1]
      } else return name
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
                webSrc={selected.course.image || "assets/icons/DefaultIcon.png"}
                imageWidth="75%"
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
                    webSrc={detail.course.image || "assets/icons/DefaultIcon.png"}
                    imageWidth="85%"
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