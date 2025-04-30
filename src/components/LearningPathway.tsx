import { useEffect, useState } from "react";
import DropdownMenu from "./Home/DropdownMenu";
import ChapterLessonBox from "./learningPathway/chapterLessonBox";
import PathwayStructure from "./learningPathway/PathwayStructure";
import { TableTypes } from "../common/constants";
import { ServiceConfig } from "../services/ServiceConfig";

const LearningPathway: React.FC = () => {
  const [courses, setCourses] = useState<TableTypes<"course">[]>([]);
  const api = ServiceConfig.getI().apiHandler;

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    const allCourses = await api.getAllCourses(); // Make sure this method exists
    setCourses(allCourses);
  };

  return (
    <div>
      <div>
        <DropdownMenu courses={courses} />
        <PathwayStructure />
      </div>
      <ChapterLessonBox
        text="English: a-d"
        containerStyle={{
          width: "27vw",
        }}
      />
    </div>
  );
};

export default LearningPathway;