import ChapterLessonBox from "./learningPathway/chapterLessonBox";
import PathwayStructure from "./learningPathway/PathwayStructure";
import "./LearningPathway.css";
import TressureBox from "./learningPathway/TressureBox";

interface LearningPathwayProps {
  from: number;
  to: number;
}

const LearningPathway: React.FC<LearningPathwayProps> = ({ from, to }) => {
  return (
    <div className="learning-pathway-container">
      <PathwayStructure />

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
