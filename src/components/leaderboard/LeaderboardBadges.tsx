import { FC, useEffect, useState } from "react";
import { Util } from "../../utility/util";
import { ServiceConfig } from "../../services/ServiceConfig";
import Badge from "../../models/Badge";
import { LeaderboardRewardsType } from "../../common/constants";
import CachedImage from "../common/CachedImage";
import "./LeaderboardBadges.css";
import { t } from "i18next";
import { FaHeart } from "react-icons/fa";
import { RxCross2 } from "react-icons/rx";
import { TiTick } from "react-icons/ti";
interface BadgeInfo {
  badge: Badge | undefined;
  isUnlocked: boolean;
  isNextUnlock?: boolean;
  isUpcomingBadge?: boolean;
}

const LeaderboardBadges: FC = () => {
  const currentStudent = Util.getCurrentStudent()!;
  const api = ServiceConfig.getI().apiHandler;
  const [badges, setBadges] = useState<BadgeInfo[]>();
  const [allBadges, setAllBadges] = useState<(Badge | undefined)[]>();
  const [lostBadges, setLostBadges] = useState<BadgeInfo[]>();
  useEffect(() => {
    init();
  }, []);

  async function init() {
    if (!currentStudent) return;

    const unlockedBadges = await getUnlockedBadges();
    const prevBadges = await getPrevBadges();
    const nextUnlockBadges = await getNextUnlockBadges();
    const allBadges = await getBadges(); //remaning badges
    const upcomingBadges = await getUpcomingBadges(); // upcoming badges
    setAllBadges(allBadges);

    const badgeInfoArray: BadgeInfo[] = prevBadges.map((badge) => ({
      badge,
      isUnlocked: unlockedBadges.some((b) => b?.docId === badge?.docId),
    }));

    nextUnlockBadges.forEach((badge) => {
      const isAlreadyUnlocked = unlockedBadges.some(
        (b) => b?.docId === badge?.docId
      );
      if (isAlreadyUnlocked) {
        badgeInfoArray.push({ badge, isUnlocked: true, isNextUnlock: true });
      } else {
        badgeInfoArray.push({ badge, isUnlocked: false, isNextUnlock: true });
      }
    });
    unlockedBadges.forEach((badge) => {
      const isInNextUnlock = badgeInfoArray?.some(
        (nextBadge) => nextBadge?.badge?.docId === badge?.docId
      );
      if (!isInNextUnlock) {
        badgeInfoArray.push({
          badge,
          isUnlocked: true,
          isNextUnlock: false,
        });
      }
    });
    upcomingBadges.forEach((badge) => {
      badgeInfoArray.push({
        badge,
        isUnlocked: false,
        isUpcomingBadge: true,
        isNextUnlock: false,
      });
    });
    // Sorting logic: prioritize by type order
    const typePriority = (badge: BadgeInfo): number => {
      if (badge.isNextUnlock) return 1; // Current
      if (badge.isUpcomingBadge) return 2; // Upcoming
      if (badge.isUnlocked) return 3; // Won
      if (!badge.isUnlocked && !badge.isUpcomingBadge) return 4; // Lost
      return 5; // Remaining
    };

    badgeInfoArray.sort((a, b) => typePriority(a) - typePriority(b));
    // Filter lost badges
    const lostBadgeArray = badgeInfoArray.filter(
      (badge) => !badge.isUnlocked && !badge.isNextUnlock && !badge.isUpcomingBadge
    );
    // Filter current, upcoming, and won badges
    const filteredBadges = badgeInfoArray.filter(
      (badge) =>
        badge.isUnlocked || badge.isNextUnlock || badge.isUpcomingBadge
    );
    setBadges(filteredBadges);
    setLostBadges(lostBadgeArray);

  }

  const getUpcomingBadges = async (): Promise<(Badge | undefined)[]> => {
    const date = new Date();
    const rewardsDoc = await api.getRewardsById(date.getFullYear().toString());
    if (!rewardsDoc) return [];
    const currentWeek = Util.getCurrentWeekNumber();
    const nextWeek = currentWeek + 1;
    const badgeIds: string[] = [];
    const weeklyData = rewardsDoc.weekly;
    const weekData = weeklyData[nextWeek.toString()];

    if (weekData) {
      weekData.forEach((value) => {
        if (value.type === LeaderboardRewardsType.BADGE) {
          badgeIds.push(value.id);
        }
      });
    }
    const badgeDocs = await Promise.all(
      badgeIds.map((value) => api.getBadgeById(value))
    );
    return badgeDocs;
  };
  const getBadges = async (): Promise<(Badge | undefined)[]> => {
    const matchingDocIds: string[] = [];
    const date = new Date();
    const currentWeek = Util.getCurrentWeekNumber();
    const rewardsDoc = await api.getRewardsById(date.getFullYear().toString());
    for (const key in rewardsDoc?.weekly) {
      const weekNumber = parseInt(key);
      if (!isNaN(weekNumber) && weekNumber > currentWeek + 1) {
        rewardsDoc?.weekly[key].forEach((item) => {
          if (item.type == LeaderboardRewardsType.BADGE) {
            matchingDocIds.push(item.id);
          }
        });
      }
    }
    const badgeDocs: (Badge | undefined)[] = [];
    let index = 0;
    while (index < matchingDocIds.length) {
      const limit = matchingDocIds.slice(index, index + 20);
      const limitBadgeDocs = await Promise.all(
        limit.map((value) => api.getBadgeById(value))
      );
      badgeDocs.push(...limitBadgeDocs);
      index += 20;
    }
    return badgeDocs;
  };

  const getUnlockedBadges = async (): Promise<(Badge | undefined)[]> => {
    if (
      !currentStudent.rewards ||
      !currentStudent.rewards.badges ||
      currentStudent.rewards.badges.length < 1
    ) {
      return [];
    }
    let isSeen = true;
    const unlockedBadges = await Promise.all(
      currentStudent.rewards.badges.map((value) => {
        if (!value.seen) {
          isSeen = false;
        }
        return api.getBadgeById(value.id);
      })
    );
    if (!isSeen) {
      api.updateRewardAsSeen(currentStudent.docId);
    }
    return unlockedBadges?.reverse();
  };

  const getPrevBadges = async (): Promise<(Badge | undefined)[]> => {
    const date = new Date();
    const rewardsDoc = await api.getRewardsById(date.getFullYear().toString());
    if (!rewardsDoc) return [];
    const currentWeek = Util.getCurrentWeekNumber();
    const badgeIds: string[] = [];
    const weeklyData = rewardsDoc.weekly;
    for (const key in weeklyData) {
      const weekNumber = parseInt(key);
      if (!isNaN(weekNumber) && weekNumber < currentWeek) {
        weeklyData[key].forEach((item) => {
          if (item.type == LeaderboardRewardsType.BADGE) {
            badgeIds.push(item.id);
          }
        });
      }
    }
    const badgeDocs = await Promise.all(
      badgeIds.map((value) => api.getBadgeById(value))
    );
    return badgeDocs;
  };

  const getNextUnlockBadges = async (): Promise<(Badge | undefined)[]> => {
    const date = new Date();
    const rewardsDoc = await api.getRewardsById(date.getFullYear().toString());
    if (!rewardsDoc) return [];
    const currentWeek = Util.getCurrentWeekNumber();
    const badgeIds: string[] = [];
    const weeklyData = rewardsDoc.weekly;
    weeklyData[currentWeek.toString()]?.forEach((value) => {
      if (value.type === LeaderboardRewardsType.BADGE) {
        badgeIds.push(value.id);
      }
    });
    const badgeDocs = await Promise.all(
      badgeIds.map((value) => api.getBadgeById(value))
    );
    return badgeDocs;
  };

  return currentStudent ? (
    <div className="leaderboard-badge-page">
      {/* Section for Current, Upcoming, and Won Badges */}
      <div className="leaderboard-badge-section">
        <div className="leaderboard-badge-container">
          {badges &&
            badges.map((value, index) => (
              <div
                key={index}
                className={`leaderboard-badge-item ${value.isUnlocked
                  ? ""
                  : value.isNextUnlock
                    ? "next-reward"
                    : value.isUpcomingBadge
                      ? "upcoming-reward"
                      : "lost-reward"
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
                <CachedImage src={value.badge?.image} />
                <p>{value.badge?.name}</p>
                {value.isUpcomingBadge &&
                  !value.isNextUnlock &&
                  !value.isUnlocked ? (
                  <p>{t("Upcoming")}</p>
                ) : null}
                {!value.isUnlocked &&
                  !value.isNextUnlock &&
                  !value.isUpcomingBadge && <p>{t("Lost Reward")}</p>}
                {value.isUnlocked && (
                  <p>
                    <b>{t("Won Reward")}</b>
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
            lostBadges.map((value, index) => (
              <div
                key={index}
                className="leaderboard-badge-item lost-reward"
              >
                <div className="lost-reward-overlay">
                  <div className="red-circle">
                    <RxCross2 color="white" />
                  </div>
                </div>
                <CachedImage src={value.badge?.image} />
                <p>{value.badge?.name}</p>
                <p>{t("Lost Reward")}</p>
              </div>
            ))}
        </div>
      </div>

      {/* Disabled Badges */}
      {/* {allBadges &&
        allBadges.length > 0 &&
        allBadges.map((value, index) => (
          <div key={index} className="leaderboard-badge-disabled">
            <CachedImage src={value?.image} />
            {!!value?.name && <p>{value?.name}</p>}
          </div>
        ))} */}
    </div>
  ) : (
    <div></div>
  );
};

export default LeaderboardBadges;
