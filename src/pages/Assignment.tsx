import './Assignment.css';
import { useAssignmentPage } from '../hooks/useAssignmentPage';

const AssignmentPage = (props: Parameters<typeof useAssignmentPage>[0]) => {
  const {
    ActivationLessonBanner,
    Capacitor,
    HOMEHEADERLIST,
    HomeworkCompleteModal,
    HomeworkPathway,
    IonButton,
    JoinClass,
    LessonSlider,
    SOURCE,
    SkeltonLoading,
    TfiDownload,
    assignmentLessonCourseMap,
    assignmentRefreshToken,
    assignments,
    bodyClass,
    checkAllHomeworkDownloaded,
    currentClass,
    downloadAllHomeWork,
    downloadButtonLoading,
    isHomeworkPathwayOnLocal,
    isLinked,
    lessonChapterMap,
    lessonResultMap,
    lessons,
    loading,
    onPlayMoreHomework,
    online,
    presentToast,
    refreshAssignmentPageAfterJoin,
    schoolName,
    setLoading,
    setShowHomeworkCompleteModal,
    showActivationLessonBanner,
    showDownloadHomeworkButton,
    showHomeworkCompleteModal,
    t,
  } = useAssignmentPage(props);

  return !loading ? (
    <div>
      <div className={`assignment-main${isLinked ? '' : '-join-class'}`}>
        <div className={bodyClass}>
          {!isHomeworkPathwayOnLocal &&
            !showHomeworkCompleteModal &&
            assignments.length > 0 && (
              <div className="assignment-header">
                <div className="right-button"></div>

                <div className="dowload-homework-button-container">
                  <div className="school-class-header">
                    <div className="classname-header">{schoolName}</div>
                    <div className="classname-header">
                      {currentClass?.name ? currentClass?.name : ''}
                    </div>
                  </div>
                </div>

                {isLinked &&
                showDownloadHomeworkButton &&
                lessons.length > 0 &&
                Capacitor.isNativePlatform() ? (
                  <IonButton
                    size="small"
                    color="white"
                    shape="round"
                    disabled={downloadButtonLoading}
                    className="dowload-homework-button"
                    onClick={() => {
                      if (!online) {
                        presentToast({
                          message: t(`Device is offline.`),
                          color: 'danger',
                          duration: 3000,
                          position: 'bottom',
                          buttons: [{ text: 'Dismiss', role: 'cancel' }],
                        });
                        setLoading(false);
                        return;
                      }
                      downloadAllHomeWork(lessons);
                    }}
                  >
                    <div className="download-homework-label">
                      {downloadButtonLoading
                        ? t('Downloading...')
                        : t('Download all')}
                    </div>

                    {!downloadButtonLoading && (
                      <div className="dowload-homework-icon-container">
                        <TfiDownload className="dowload-homework-icon" />
                      </div>
                    )}
                  </IonButton>
                ) : (
                  <div className="right-button"></div>
                )}
              </div>
            )}

          {!loading && (
            <div>
              {!isLinked ? (
                <JoinClass
                  onClassJoin={() => {
                    refreshAssignmentPageAfterJoin();
                  }}
                />
              ) : showActivationLessonBanner ? (
                <ActivationLessonBanner
                  source={SOURCE.LEARNING_PATHWAY_HOMEWORK}
                />
              ) : (
                <div>
                  {!isHomeworkPathwayOnLocal ? (
                    // ✅ Flag ON → old LessonSlider flow
                    assignments.length > 0 ? (
                      <LessonSlider
                        key={assignments.length}
                        lessonData={lessons}
                        isHome={true}
                        course={undefined}
                        lessonsScoreMap={lessonResultMap || {}}
                        startIndex={0}
                        showSubjectName={true}
                        showChapterName={true}
                        assignments={assignments}
                        downloadButtonLoading={downloadButtonLoading}
                        showDate={true}
                        onDownloadOrDelete={checkAllHomeworkDownloaded}
                        lessonChapterMap={lessonChapterMap}
                        lessonCourseMap={assignmentLessonCourseMap}
                      />
                    ) : (
                      <div className="pending-assignment">
                        {showHomeworkCompleteModal && (
                          <HomeworkCompleteModal
                            text={t(
                              'Yay!! You have completed all the Homework!!',
                            )}
                            borderImageSrc="/pathwayAssets/homeworkCelebration.svg"
                            onClose={() => setShowHomeworkCompleteModal(false)}
                            onPlayMore={() => {
                              setShowHomeworkCompleteModal(false);
                              if (onPlayMoreHomework) {
                                onPlayMoreHomework();
                              }
                            }}
                          />
                        )}
                      </div>
                    )
                  ) : (
                    // ✅ Pathway mode: always render HomeworkPathway.
                    // It handles reward-transition and completion modal internally.
                    <HomeworkPathway
                      onPlayMoreHomework={onPlayMoreHomework}
                      refreshToken={assignmentRefreshToken}
                    />
                  )}

                  {/* retained older commented logic in case you want to revert */}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  ) : (
    <div className="assignment-loading">
      <SkeltonLoading isLoading={loading} header={HOMEHEADERLIST.ASSIGNMENT} />
    </div>
  );
};
export default AssignmentPage;