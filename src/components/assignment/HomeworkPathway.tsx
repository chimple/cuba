import '../LearningPathway.css';
import './HomeworkPathway.css';
import { t } from 'i18next';
import Loading from '../Loading';
import DropdownMenu from '../Home/DropdownMenu';
import ChapterLessonBox from '../learningPathway/chapterLessonBox';
import HomeworkPathwayStructure from './HomeworkPathwayStructure';
import PathwayModal from '../learningPathway/PathwayModal';
import HomeworkCompleteModal from './HomeworkCompleteModal';
import { Util } from '../../utility/util';

import { useHomeworkPathwayController } from './useHomeworkPathwayController';

interface HomeworkPathwayProps {
  onPlayMoreHomework?: () => void;
  refreshToken?: number;
}

const HomeworkPathway: React.FC<HomeworkPathwayProps> = (props) => {
  const {
    activeSubjectRef,
    boxDetails,
    fetchHomeworkPathway,
    handleDropdownWrapperClick,
    handleFinalHomeworkStickerComplete,
    handleHomeworkComplete,
    isDropdownDisabled,
    isHomeworkComplete,
    loading,
    onPlayMoreHomework,
    onSubjectChange,
    refreshKey,
    selectedSubject,
    setIsHomeworkComplete,
    setShowDisabledDropdownModal,
    showDisabledDropdownModal,
  } = useHomeworkPathwayController(props);

  if (loading) return <Loading isLoading={loading} />;

  if (isHomeworkComplete) {
    return (
      <div className="pending-assignment">
        <HomeworkCompleteModal
          text={t('Yay!! You have completed all the Homework!!')}
          borderImageSrc="/pathwayAssets/homeworkCelebration.svg"
          onClose={() => setIsHomeworkComplete(false)}
          onPlayMore={() => {
            setIsHomeworkComplete(false);
            if (onPlayMoreHomework) {
              onPlayMoreHomework();
            }
          }}
        />
      </div>
    );
  }

  return (
    <div className="homework-pathway-container">
      <div className="homeworkpathway-pathway_section">
        <div
          className="homework-dropdown-wrapper"
          onClick={handleDropdownWrapperClick}
        >
          <DropdownMenu
            selectedSubject={selectedSubject}
            onSubjectChange={onSubjectChange}
            onCourseChange={() => {
              const currentStudent = Util.getCurrentStudent();
              if (currentStudent) {
                fetchHomeworkPathway(
                  currentStudent,
                  selectedSubject || activeSubjectRef.current || undefined,
                );
              }
            }}
            disabled={isDropdownDisabled}
            hideArrow={isDropdownDisabled}
            syncWithLearningPath={false}
          />
        </div>
        <HomeworkPathwayStructure
          key={refreshKey}
          selectedSubject={selectedSubject}
          onHomeworkComplete={handleHomeworkComplete}
          onFinalHomeworkStickerComplete={handleFinalHomeworkStickerComplete}
        />
      </div>

      <div className="homeworkpathway-chapter-egg-container">
        <ChapterLessonBox
          chapterName={boxDetails?.cName || 'Loading'}
          lessonName={boxDetails?.lName || '...'}
          courseCode={boxDetails?.courseCode}
        />
      </div>

      {/* ✅ Render the modal when its state is true */}
      {showDisabledDropdownModal && (
        <PathwayModal
          text={t(
            'Keep going!\nFinish these lessons to choose another subject.',
          )}
          onClose={() => setShowDisabledDropdownModal(false)}
          onConfirm={() => setShowDisabledDropdownModal(false)}
          audioFolder={'subDisabled'}
          audioClipName={'sub_disabled'}
        />
      )}
    </div>
  );
};

export default HomeworkPathway;
