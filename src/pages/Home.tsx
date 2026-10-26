import { useEffect, useState } from 'react';
import { useHome } from '../hooks/useHome';
import BadgeCelebrationModal from '../components/badges/BadgeCelebrationModal';
import { PENDING_BADGE_MILESTONE_KEY } from '../common/Badges/badgeProgress';
import type { BadgeAnalyticsProgress } from '../common/Badges/badgeAnalytics';
import { Util } from '../utility/util';
import './Home.css';

const Home = () => {
  const [badgeMilestone, setBadgeMilestone] = useState<number | null>(null);
  const [badgeProgress, setBadgeProgress] =
    useState<BadgeAnalyticsProgress | null>(null);
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
    isReturnFromSwitchProfileReturn,
    isReturnFromLidoOrSwitchProfile,
    setCurrentHeader,
    setPendingAssignmentCount,
    setPendingLiveQuizCount,
    showActivationLessonBanner,
  } = useHome();

  useEffect(() => {
    const currentStudentId = Util.getCurrentStudent()?.id;
    const pendingBadge = sessionStorage.getItem(PENDING_BADGE_MILESTONE_KEY);
    if (!currentStudentId || !pendingBadge) return;

    let waitTimer: number | undefined;

    try {
      const parsed = JSON.parse(pendingBadge) as {
        milestone?: number;
        studentId?: string;
        progress?: BadgeAnalyticsProgress;
      };
      if (
        parsed.studentId === currentStudentId &&
        Number.isInteger(parsed.milestone)
      ) {
        const showBadgeWhenStickerCloses = () => {
          const stickerPopup = document.querySelector(
            '.StickerBookPreviewModal-overlay, .StickerBookCompletionModal-overlay',
          );

          if (stickerPopup) {
            waitTimer = window.setTimeout(showBadgeWhenStickerCloses, 100);
            return;
          }

          // Badge celebration waits until sticker UI has released the screen.
          setBadgeMilestone(parsed.milestone ?? null);
          setBadgeProgress(
            parsed.progress ?? {
              lessons_played_count: 0,
              latest_badge_milestone: parsed.milestone ?? 0,
              has_unseen_badge: false,
            },
          );
          sessionStorage.removeItem(PENDING_BADGE_MILESTONE_KEY);
        };

        showBadgeWhenStickerCloses();
      }
    } catch {
      sessionStorage.removeItem(PENDING_BADGE_MILESTONE_KEY);
    }

    return () => {
      if (waitTimer !== undefined) window.clearTimeout(waitTimer);
    };
  }, []);

  return (
    <IonPage id="home-page">
      <IonHeader id="home-header">
        <HomeHeader
          key={refreshKey}
          currentHeader={currentHeader}
          onHeaderIconClick={onHeaderIconClick}
          pendingAssignmentCount={pendingAssignmentCount}
          pendingLiveQuizCount={pendingLiveQuizCount}
          isReturnFromSwitchProfileReturn={isReturnFromSwitchProfileReturn}
          isReturnFromLidoOrSwitchProfile={isReturnFromLidoOrSwitchProfile}
        />
      </IonHeader>
      <div className="slider-content">
        {!isLoading ? (
          <div className="space-between">
            {currentHeader === HOMEHEADERLIST.HOME && !!canShowAvatar ? (
              showActivationLessonBanner ? (
                <ActivationLessonBanner source={SOURCE.INITIAL_ASSESSMENT} />
              ) : (
                <LearningPathway key={refreshKey} />
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
      <BadgeCelebrationModal
        milestone={badgeMilestone}
        studentId={Util.getCurrentStudent()?.id}
        progress={badgeProgress ?? undefined}
        languageCode={localStorage.getItem('language') ?? 'en'}
        onClose={() => {
          setBadgeMilestone(null);
          setBadgeProgress(null);
        }}
      />
    </IonPage>
  );
};

export default Home;
