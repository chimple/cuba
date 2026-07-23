import { useHome } from '../hooks/useHome';
import './Home.css';

const Home = () => {
  const {
    ActivationLessonBanner,
    AssignmentPage,
    HOMEHEADERLIST,
    HomeHeader,
    IonHeader,
    IonPage,
    LearningPathway,
    LiveQuiz,
    SOURCE,
    SearchLesson,
    SkeltonLoading,
    Subjects,
    WinterCampaignPopupGating,
    canShowAvatar,
    currentHeader,
    isLoading,
    onHeaderIconClick,
    pendingAssignmentCount,
    pendingLiveQuizCount,
    refreshKey,
    setCurrentHeader,
    setPendingAssignmentCount,
    setPendingLiveQuizCount,
    showActivationLessonBanner,
  } = useHome();

  return (
    <IonPage id="home-page">
      <IonHeader id="home-header">
        <HomeHeader
          key={refreshKey}
          currentHeader={currentHeader}
          onHeaderIconClick={onHeaderIconClick}
          pendingAssignmentCount={pendingAssignmentCount}
          pendingLiveQuizCount={pendingLiveQuizCount}
        />
      </IonHeader>
      <div className="slider-content">
        {!isLoading ? (
          <div className="space-between">
            {currentHeader === HOMEHEADERLIST.HOME && !!canShowAvatar ? (
              showActivationLessonBanner ? (
                <ActivationLessonBanner source={SOURCE.INITIAL_ASSESSMENT} />
              ) : (
                <LearningPathway />
              )
            ) : null}

            {currentHeader === HOMEHEADERLIST.SUBJECTS && <Subjects />}

            {currentHeader === HOMEHEADERLIST.ASSIGNMENT && (
              <AssignmentPage
                assignmentCount={setPendingAssignmentCount}
                onPlayMoreHomework={() => {
                  setCurrentHeader(HOMEHEADERLIST.HOME);
                }}
              />
            )}

            {currentHeader === HOMEHEADERLIST.SEARCH && <SearchLesson />}
            {currentHeader === HOMEHEADERLIST.LIVEQUIZ && (
              <LiveQuiz liveQuizCount={setPendingLiveQuizCount} />
            )}
          </div>
        ) : null}
        <SkeltonLoading isLoading={isLoading} header={currentHeader} />
      </div>
      <WinterCampaignPopupGating />
    </IonPage>
  );
};

export default Home;
