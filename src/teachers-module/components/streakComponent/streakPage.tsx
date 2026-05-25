import React from 'react';
import { IonContent, IonPage } from '@ionic/react';
import { useHistory } from 'react-router';
import Header from '../homePage/Header';
import StreakHeaderStats from './components/StreakHeaderStats';
import StreakCalendarSection from './components/StreakCalendarSection';
import StreakShareCaptureCard from './components/StreakShareCaptureCard';
import { useStreakPageLogic } from './hooks/useStreakPageLogic';
import './streakPage.css';

const StreakPage: React.FC = () => {
  const history = useHistory();
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
    </IonPage>
  );
};

export default StreakPage;
