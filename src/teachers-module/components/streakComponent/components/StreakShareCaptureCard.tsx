import React, { forwardRef } from 'react';

type StreakShareCaptureCardProps = {
  streakCount: number;
  assignmentCount: number;
};

const StreakShareCaptureCard = forwardRef<
  HTMLDivElement,
  StreakShareCaptureCardProps
>(({ streakCount, assignmentCount }, ref) => {
  return (
    <div className="streak-share-capture-shell" aria-hidden="true">
      <div className="streak-share-card" ref={ref}>
        <div className="streak-share-title">I&apos;m on</div>

        <div className="streak-share-stats">
          <div className="streak-share-stat">
            <div className="streak-share-value">
              {streakCount}
              <img
                src="assets/icons/streakIcon2.png"
                alt=""
                className="streak-share-flame"
              />
            </div>
            <div className="streak-share-label">Weeks Streak</div>
          </div>

          <div className="streak-share-stat">
            <div className="streak-share-value">{assignmentCount}</div>
            <div className="streak-share-label">Assignments</div>
          </div>
        </div>

        <div className="streak-share-bottom">
          <div className="streak-share-avatar">
            <img src="assets/icons/ChimpLogo.png" alt="" />
          </div>
          <div className="streak-share-cta">Keep Going</div>
        </div>
      </div>
    </div>
  );
});

StreakShareCaptureCard.displayName = 'StreakShareCaptureCard';

export default StreakShareCaptureCard;
