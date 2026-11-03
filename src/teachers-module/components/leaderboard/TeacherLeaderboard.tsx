import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import PersonIcon from '@mui/icons-material/Person';
import { ServiceConfig } from '../../../services/ServiceConfig';
import { TableTypes } from '../../../common/constants';
import './TeacherLeaderboard.css';

interface TeacherLeaderboardProps {
  onAssign: () => void;
}

const TIER_LABELS = ['Silver', 'Gold', 'Bronze'] as const;

const TeacherLeaderboard = ({ onAssign }: TeacherLeaderboardProps) => {
  const { t } = useTranslation();
  const [leaderboard, setLeaderboard] = useState<
    TableTypes<'teacher_leaderboard'> | undefined
  >();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    let retryCount = 0;
    const loadLeaderboard = async () => {
      const config = ServiceConfig.getI();
      const user = await config.authHandler.getCurrentUser();
      const data = user?.id
        ? await config.apiHandler.getTeacherLeaderboard(user.id)
        : undefined;
      if (isMounted) {
        // Local UI preview fixture (disabled; use backend data below):
        // const developmentPreview = { tier: 'gold', final_score: 125 };
        setLeaderboard(data);
        setIsLoading(false);
        if (!data && retryCount < 5 && isMounted) {
          retryCount += 1;
          window.setTimeout(loadLeaderboard, 1000);
        }
      }
    };
    loadLeaderboard();
    return () => {
      isMounted = false;
    };
  }, []);

  if (isLoading) return <div className="teacher-leaderboard-loading" />;
  const isLocked = !leaderboard || leaderboard.tier === 'locked';
  const blockName = leaderboard?.block_name || '';
  const tierMessage =
    leaderboard?.tier === 'silver' || leaderboard?.tier === 'bronze'
      ? t(
          'Keep more students engaged and improve longer to climb the leaderboard! Lower engagement may move you down.',
        )
      : t('Congratulations! You are in the top 20% teachers. Keep it up!');

  return (
    <section className="teacher-leaderboard" aria-live="polite">
      <h2>{t('{{blockName}} Block Leaderboard', { blockName })}</h2>
      {isLocked ? (
        <>
          <p className="teacher-leaderboard-lock-message">
            {t(
              'You have not assigned homework in the last 7 days. Assign an assignment to unlock your Leaderboard',
            )}
          </p>
          <img
            className="teacher-leaderboard-lock"
            src="/assets/icons/leaderboard teacher app lock.svg"
            alt=""
            aria-hidden="true"
          />
          <p className="teacher-leaderboard-lock-title">
            {t('Leaderboard Locked !')}
          </p>
          <p className="teacher-leaderboard-lock-subtitle">
            {t('To unlock, click Assign')}
          </p>
        </>
      ) : (
        <>
          <p className="teacher-leaderboard-count">
            {t('Teachers Count is {{count}}', {
              count: leaderboard.total_teachers_in_block,
            })}
          </p>
          <div className="teacher-leaderboard-tiers">
            <div
              className={`teacher-leaderboard-score teacher-leaderboard-score--${leaderboard.tier}`}
            >
              <PersonIcon
                className="teacher-leaderboard-person"
                aria-hidden="true"
              />
              <strong>
                {t('{{points}} points', {
                  points: Number(leaderboard.final_score),
                })}
              </strong>
              <span>{t('You are here')}</span>
            </div>
            {TIER_LABELS.map((tier) => (
              <div
                key={tier}
                className={`teacher-leaderboard-tier teacher-leaderboard-tier--${tier.toLowerCase()} ${
                  leaderboard.tier === tier.toLowerCase()
                    ? 'teacher-leaderboard-tier--current'
                    : ''
                }`}
              >
                {leaderboard.tier === tier.toLowerCase() && (
                  <>
                    <img
                      className="teacher-leaderboard-hand"
                      src="/assets/icons/hand icon teachers app wo border.svg"
                      alt=""
                      aria-hidden="true"
                    />
                  </>
                )}
                {t(tier)}
              </div>
            ))}
          </div>
          <p className="teacher-leaderboard-congratulations">{tierMessage}</p>
        </>
      )}
      <button
        className="teacher-leaderboard-assign"
        type="button"
        onClick={onAssign}
      >
        {t('Assign')}
      </button>
    </section>
  );
};

export default TeacherLeaderboard;
