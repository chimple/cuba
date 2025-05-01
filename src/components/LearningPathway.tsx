import { useEffect, useState } from "react";
import ChapterLessonBox from "./learningPathway/chapterLessonBox";
import PathwayStructure from "./learningPathway/PathwayStructure";
import "./LearningPathway.css";
import TressureBox from "./learningPathway/TressureBox";
import DropdownMenu from "./Home/DropdownMenu";
import { TableTypes } from "../common/constants";
import { ServiceConfig } from "../services/ServiceConfig";

interface LearningPathwayProps {
  from: number;
  to: number;
}

const LearningPathway: React.FC<LearningPathwayProps> = ({ from, to }) => {
  const [courses, setCourses] = useState<TableTypes<"course">[]>([]);
  const api = ServiceConfig.getI().apiHandler;

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    const allCourses = await api.getAllCourses(); 
    setCourses(allCourses);
  };

  return (
    <div className="learning-pathway-container">
      <div className="pathway_section">
        <DropdownMenu courses={courses} />
        <PathwayStructure />
      </div>

      <div className="chapter-egg-container">
        <ChapterLessonBox
          text="English: a-d"
          containerStyle={{
            width: "27vw",
          }}
        />
        <TressureBox startNumber={from ?? 0} endNumber={to ?? 0} />
      </div>
    </div>
  );
};

export default LearningPathway;
