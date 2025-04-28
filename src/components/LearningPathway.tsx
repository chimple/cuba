import DropdownMenu from "./Home/DropdownMenu";
import ChapterLessonBox from "./learningPathway/chapterLessonBox";
import PathwayStructure from "./learningPathway/PathwayStructure";

const LearningPathway: React.FC = () => {
  return (
    <div
    style={{
      display: "flex",
      alignItems: "flex-start",
      gap: "2vw", 
      padding: "2vh 2vw",
      justifyContent: "space-between"
    }}
    >
      <div style={{display: "flex", alignItems: "flex-start", gap: "2rem"}}>
        <DropdownMenu />
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
