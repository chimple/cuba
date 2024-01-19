import { FC, useEffect, useState } from "react";
import { Util } from "../../utility/util";
import { ServiceConfig } from "../../services/ServiceConfig";
import Badge from "../../models/Badge";
import { LeaderboardRewardsType } from "../../common/constants";
import CachedImage from "../common/CachedImage";
import "./LeaderboardBadges.css";
import { t } from "i18next";

interface BadgeInfo {
  badge: Badge | undefined;
  isUnlocked: boolean;
  isNextUnlock?: boolean;
}

const LeaderboardBadges: FC = () => {
  const currentStudent = Util.getCurrentStudent()!;
  const api = ServiceConfig.getI().apiHandler;
  const [badges, setBadges] = useState<BadgeInfo[]>();

  useEffect(() => {
    init();
  }, []);

  async function init() {
    if (!currentStudent) return;

    const unlockedBadges = await getUnlockedBadges();
    const prevBadges = await getPrevBadges();
    const nextUnlockBadges = await getNextUnlockBadges();
    const badgeInfoArray: BadgeInfo[] = [];
    const uniqueBadgeIds = new Set<string>();

    for (const nextUnlockBadge of nextUnlockBadges) {
      if (nextUnlockBadge) {
        badgeInfoArray.push({
          badge: nextUnlockBadge,
          isUnlocked: false,
          isNextUnlock: true,
        });
        // uniqueBadgeIds.add(nextUnlockBadge.docId);
      }
    }

    for (const unlockedBadge of unlockedBadges) {
      if (unlockedBadge) {
        badgeInfoArray.push({
          badge: unlockedBadge,
          isUnlocked: true,
        });
        uniqueBadgeIds.add(unlockedBadge.docId);
      }
    }

    for (const prevBadge of prevBadges) {
      if (prevBadge) {
        const isCommon = uniqueBadgeIds.has(prevBadge.docId);
        if (isCommon) continue;
        badgeInfoArray.push({
          badge: prevBadge,
          isUnlocked: false,
        });
        uniqueBadgeIds.add(prevBadge.docId);
      }
    }

    setBadges(badgeInfoArray);
  }

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
    weeklyData[currentWeek.toString()].forEach((value) => {
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
    <div className="leaderboard-badge-container">
      {badges &&
        badges.length > 0 &&
        badges.map((value, index) => (
          <div
            key={index}
            className={
              "leaderboard-badge-item " +
              (value.isUnlocked ? "" : "leaderboard-badge-disabled")
            }
          >
            <CachedImage src={value.badge?.image} />
            {value.isNextUnlock && (
              <p className="leaderboard-next-unlock-text">
                {t("This Week's Reward")}
              </p>
            )}
          </div>
        ))}
    </div>
  ) : (
    <div></div>
  );
};

export default LeaderboardBadges;
