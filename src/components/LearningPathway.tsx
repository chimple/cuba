import ChapterLessonBox from "./learningPathway/chapterLessonBox";
import PathwayStructure from "./learningPathway/PathwayStructure";

const LearningPathway: React.FC = () => {
  return (
    <div>
      <PathwayStructure />
      <ChapterLessonBox 
        text="English: a-d"
        containerStyle={{
          position: 'fixed',
          bottom: '2vh',
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          backgroundImage: 'url(/pathwayAssets/chapterLessonBox.svg)',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'center',
          backgroundSize: '100% 100%',
          width: '27vw'
        }}
        textStyle={{
          margin: 0,
          color: 'var(--text-color)',
          textAlign: 'center',
          fontSize: 'var(--text-sizeL)'
        }}
      />
    </div>
  );
};

export default LearningPathway;
