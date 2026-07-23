//@ts-nocheck
import { useDisplaySubjects } from '../hooks/useDisplaySubjects';
import './DisplaySubjects.css';

const DisplaySubjects = () => {
  const viewProps = useDisplaySubjects();

  const {
    BackButton,
    DropDown,
    IonPage,
    LessonSlider,
    Loading,
    STAGES,
    SelectChapter,
    SelectCourse,
    courses,
    currentChapter,
    currentCourse,
    currentGrade,
    getLastPlayedLessonIndex,
    isLoading,
    lessonResultMap,
    lessons,
    localGradeMap,
    onBackButton,
    onChapterChange,
    onCourseChanges,
    onGradeChanges,
    stage,
    t,
  } = viewProps;

  return (
    <IonPage id="display-subjects-page">
      <Loading isLoading={isLoading} />
      <div className="subjects-header">
        <div id="back-button-container">
          <BackButton onClicked={onBackButton} />
        </div>
        <div className="subject-name">
          {stage === STAGES.SUBJECTS
            ? t('Subjects')
            : stage === STAGES.CHAPTERS
              ? currentCourse?.title
              : currentChapter?.title}
        </div>
        {localGradeMap && currentGrade && stage === STAGES.CHAPTERS && (
          <DropDown
            currentValue={currentGrade?.docId}
            optionList={localGradeMap.grades.map((grade) => ({
              displayName: grade.title,
              id: grade.docId,
            }))}
            placeholder=""
            onValueChange={(evt) => {
              {
                const tempGrade = localGradeMap.grades.find(
                  (grade) => grade.docId === evt,
                );
                onGradeChanges(tempGrade ?? currentGrade);
              }
            }}
            width="15vw"
          />
        )}
        {stage !== STAGES.CHAPTERS && <div className="button-right" />}
      </div>
      <div className="subjects-content">
        {!isLoading &&
          stage === STAGES.SUBJECTS &&
          courses &&
          courses.length > 0 && (
            <SelectCourse
              courses={courses}
              modeParent={false}
              onCourseChange={onCourseChanges}
            />
          )}

        {!isLoading &&
          stage === STAGES.CHAPTERS &&
          currentCourse &&
          localGradeMap &&
          currentGrade && (
            <SelectChapter
              chapters={currentCourse.chapters}
              onChapterChange={onChapterChange}
              currentGrade={currentGrade}
              grades={!!localGradeMap ? localGradeMap.grades : localGradeMap}
              onGradeChange={onGradeChanges}
              course={currentCourse}
              currentChapterId={currentChapter?.id}
            />
          )}
      </div>
      {!isLoading && stage === STAGES.LESSONS && lessons && (
        <div className="slider-container">
          <LessonSlider
            lessonData={lessons}
            isHome={true}
            course={currentCourse!}
            lessonsScoreMap={lessonResultMap || {}}
            startIndex={getLastPlayedLessonIndex()}
            showSubjectName={false}
            showChapterName={false}
          />
        </div>
      )}
    </IonPage>
  );
};

export default DisplaySubjects;
