import ChapterLessonBox from "./learningPathway/chapterLessonBox";
import PathwayStructure from "./learningPathway/PathwayStructure";

const LearningPathway: React.FC = () => {
  return (
    <div>
      <PathwayStructure />
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
