import { useLeaderboardBadges } from '../../hooks/useLeaderboardBadges';
import './LeaderboardBadges.css';

const LeaderboardBadges = () => {
  const {
    CachedImage,
    FaHeart,
    RxCross2,
    TiTick,
    badges,
    currentStudent,
    lostBadges,
    t,
  } = useLeaderboardBadges();

  return currentStudent ? (
    <div className="leaderboard-badge-page">
      {/* Section for Current, Upcoming, and Won Badges */}
      <div className="leaderboard-badge-section">
        <div className="leaderboard-badge-container">
          {badges &&
            badges.map((value, index) => (
              <div
                key={index}
                className={`leaderboard-badge-item ${
                  value.isUnlocked
                    ? ''
                    : value.isNextUnlock
                      ? 'next-reward'
                      : value.isUpcomingBadge
                        ? 'upcoming-reward'
                        : 'lost-reward'
                }`}
              >
                {value.isNextUnlock && !value.isUnlocked && (
                  <div className="green-circle">
                    <FaHeart color="white" />
                  </div>
                )}
                {!value.isUnlocked &&
                  !value.isNextUnlock &&
                  !value.isUpcomingBadge && (
                    <div className="lost-reward-overlay">
                      <div className="red-circle">
                        <RxCross2 color="white" />
                      </div>
                    </div>
                  )}
                {value.isUnlocked && (
                  <div className="lost-reward-overlay">
                    <div className="won-circle">
                      <TiTick color="white" />
                    </div>
                  </div>
                )}
                <CachedImage src={value.badge?.image ?? undefined} />
                <p>{value.badge?.name}</p>
                {value.isUpcomingBadge &&
                !value.isNextUnlock &&
                !value.isUnlocked ? (
                  <p>{t('Upcoming')}</p>
                ) : null}
                {!value.isUnlocked &&
                  !value.isNextUnlock &&
                  !value.isUpcomingBadge && <p>{t('Lost Reward')}</p>}
                {value.isUnlocked && (
                  <p>
                    <b>{t('Won Reward')}</b>
                  </p>
                )}
                {value.isNextUnlock && !value.isUnlocked ? (
                  <p className="leaderboard-next-unlock-text">
                    {t("This Week's Reward")}
                  </p>
                ) : null}
              </div>
            ))}
        </div>
      </div>
      <hr className="section-divider" />
      {/* Section for Lost Badges */}
      <div className="leaderboard-badge-section">
        <div className="leaderboard-badge-container">
          {lostBadges &&
            lostBadges
              .filter(
                (value) =>
                  !value.isUnlocked &&
                  !value.isNextUnlock &&
                  !value.isUpcomingBadge,
              )
              .map((value, index) => (
                <div key={index} className="leaderboard-badge-item lost-reward">
                  <div className="lost-reward-overlay">
                    <div className="red-circle">
                      <RxCross2 color="white" />
                    </div>
                    <CachedImage src={value.badge?.image ?? undefined} />
                  </div>
                  <div>
                    <div className="leaderboard-badge-item lost-reward">
                      <p>{value.badge?.name}</p>
                      <p>{t('Lost Reward')}</p>
                    </div>
                  </div>
                </div>
              ))}
        </div>
      </div>
    </div>
  ) : (
    <div></div>
  );
};

export default LeaderboardBadges;
