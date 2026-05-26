import React from 'react';

type StreakHeaderStatsProps = {
  coinCount: number;
  streakCount: number;
  assignmentCount: number;
};

const StreakHeaderStats: React.FC<StreakHeaderStatsProps> = ({
  coinCount,
  streakCount,
  assignmentCount,
}) => {
  return (
    <>
      <div className="streak-coin-card">
        <img
          src="assets/icons/coinIcon.png"
          className="streak-summary-coin"
          alt="Coins"
        />
        <span className="streak-coin-value">{coinCount}</span>
      </div>

      <div className="streak-summary">
        <div className="streak-summary-item">
          <div className="streak-summary-value">
            <span>{streakCount}</span>
            <img
              src="assets/icons/streakIcon2.png"
              className="streak-summary-fire"
              alt="Streak"
            />
          </div>
          <div className="streak-summary-label">Weeks Streak</div>
        </div>
        <div className="streak-summary-item">
          <div className="streak-summary-value">{assignmentCount}</div>
          <div className="streak-summary-label">Assignments</div>
        </div>
      </div>
    </>
  );
};

export default StreakHeaderStats;
