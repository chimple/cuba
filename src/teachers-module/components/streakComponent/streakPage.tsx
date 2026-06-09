import React, { useState } from 'react';
import { IonContent, IonPage } from '@ionic/react';
import { useHistory } from 'react-router';
import { PAGES } from '../../../common/constants';
import Header from '../homePage/Header';
import StreakInfoPopup from '../homePage/StreakInfoPopup';
import StreakHeaderStats from './components/StreakHeaderStats';
import StreakCalendarSection from './components/StreakCalendarSection';
import StreakShareCaptureCard from './components/StreakShareCaptureCard';
import { useStreakPageLogic } from './hooks/useStreakPageLogic';
import './streakPage.css';
import { t } from 'i18next';

const STREAK_INFO_SECTIONS = [
  {
    title: 'streakInfoStreaksTitle',
    body: 'streakInfoStreaksBody',
  },
  {
    title: 'streakInfoCoinsTitle',
    body: 'streakInfoCoinsBody',
  },
  {
    title: 'streakInfoMaintainingTitle',
    body: 'streakInfoMaintainingBody',
  },
] as const;

const StreakPage: React.FC = () => {
  const history = useHistory();
  const [isStreakInfoOpen, setIsStreakInfoOpen] = useState(false);
  const {
    coinCount,
    streakCount,
    assignmentCount,
    monthTitle,
    calendarRows,
    shareCardRef,
    handleShareStreak,
    goToPreviousMonth,
    goToNextMonth,
  } = useStreakPageLogic();

  return (
    <IonPage className="streak-screen streak-page-screen">
      <Header
        isBackButton={true}
        customText="My Streak"
        customTextClassName="streak-page-header-text"
        onBackButtonClick={() => history.goBack()}
        onShareClick={handleShareStreak}
        showInfoButton={true}
        onInfoClick={() => setIsStreakInfoOpen(true)}
        showStreakButton={false}
      />
      <IonContent className="streak-content-shell">
        <div className="streak-content streak-page-layout">
          <StreakHeaderStats
            coinCount={coinCount}
            streakCount={streakCount}
            assignmentCount={assignmentCount}
          />
          <StreakCalendarSection
            monthTitle={monthTitle}
            calendarRows={calendarRows}
            onPreviousMonth={goToPreviousMonth}
            onNextMonth={goToNextMonth}
          />
        </div>
        <StreakShareCaptureCard
          ref={shareCardRef}
          streakCount={streakCount}
          assignmentCount={assignmentCount}
        />
      </IonContent>
      <StreakInfoPopup
        isOpen={isStreakInfoOpen}
        title="streakInfoModalTitle"
        sections={[...STREAK_INFO_SECTIONS]}
        onClose={() => setIsStreakInfoOpen(false)}
      />
      <div className="streak-bottom-cta-shell">
        <button
          type="button"
          className="streak-bottom-cta"
          onClick={() => history.push(PAGES.TEACHER_ASSIGNMENT)}
        >
          {t('Assign Homework Now (+25 Coins)')}
        </button>
      </div>
    </IonPage>
  );
};

export default StreakPage;
