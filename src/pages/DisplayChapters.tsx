import { useDisplayChapters } from '../hooks/useDisplayChapters';
import './DisplayChapters.css';

const DisplayChapters = () => {
  const viewProps = useDisplayChapters();

  const {
    BackButton,
    DropDown,
    IonItem,
    IonPage,
    LessonSlider,
    PAGES,
    STAGES,
    SelectChapter,
    SkeltonLoading,
    chapters,
    currentChapter,
    currentCourse,
    currentGrade,
    getCourseBasedName,
    getLastPlayedLessonIndex,
    isLoading,
    lessonResultMap,
    lessons,
    localGradeMap,
    onBackButton,
    onChapterChange,
    onGradeChanges,
    stage,
    t,
  } = viewProps;

  return !isLoading ? (
    <IonPage id="display-chapters-page">
      <div className="chapters-header">
        <div id="back-button-container">
          <BackButton aria-label={t('Back')} onClicked={onBackButton} />
        </div>
        <div className="chapter-header">
          <IonItem lines="none">
            <div className="chapter-name">
              {stage === STAGES.CHAPTERS
                ? getCourseBasedName(currentCourse?.name)
                : getCourseBasedName(currentChapter?.name)}
            </div>
          </IonItem>
        </div>

        {localGradeMap && currentGrade && stage === STAGES.CHAPTERS && (
          <DropDown
            currentValue={currentGrade?.id}
            optionList={localGradeMap.grades.map((grade) => ({
              displayName: grade.name,
              id: grade.id,
            }))}
            placeholder=""
            onValueChange={(evt) => {
              {
                const tempGrade = localGradeMap.grades.find(
                  (grade) => grade.id === evt,
                );
                onGradeChanges(tempGrade ?? currentGrade);
              }
            }}
            width="15vw"
          />
        )}
        {stage !== STAGES.CHAPTERS && <div className="button-right" />}
      </div>
      <div className="chapters-content">
        {stage === STAGES.CHAPTERS &&
          currentCourse &&
          localGradeMap &&
          currentGrade && (
            <div>
              <SelectChapter
                chapters={chapters}
                onChapterChange={onChapterChange}
                currentGrade={currentGrade}
                grades={!!localGradeMap ? localGradeMap.grades : localGradeMap}
                onGradeChange={onGradeChanges}
                course={currentCourse}
                currentChapterId={currentChapter?.id}
              />
            </div>
          )}
      </div>
      {stage === STAGES.LESSONS && lessons && (
        <div className="slider-container">
          <LessonSlider
            lessonData={lessons}
            isHome={true}
            course={currentCourse!}
            lessonsScoreMap={lessonResultMap || {}}
            startIndex={getLastPlayedLessonIndex()}
            showSubjectName={false}
            showChapterName={false}
            chapter={currentChapter}
          />
        </div>
      )}
    </IonPage>
  ) : (
    <SkeltonLoading
      isLoading={isLoading}
      header={PAGES.DISPLAY_CHAPTERS}
      isChapter={stage == STAGES.CHAPTERS ? false : true}
    />
  );
};

export default DisplayChapters;
