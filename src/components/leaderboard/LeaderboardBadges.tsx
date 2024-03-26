import { FC, useEffect, useState } from "react";
import { Util } from "../../utility/util";
import { ServiceConfig } from "../../services/ServiceConfig";
import Badge from "../../models/Badge";
import { LeaderboardRewardsType } from "../../common/constants";
import CachedImage from "../common/CachedImage";
import "./LeaderboardBadges.css";
import { t } from "i18next";
import { FaHeart } from "react-icons/fa";

interface BadgeInfo {
  badge: Badge | undefined;
  isUnlocked: boolean;
  isNextUnlock?: boolean;
}

const LeaderboardBadges: FC = () => {
  const currentStudent = Util.getCurrentStudent()!;
  const api = ServiceConfig.getI().apiHandler;
  const [badges, setBadges] = useState<BadgeInfo[]>();
  const [allBadges, setAllBadges] = useState<Badge[]>();
  useEffect(() => {
    init();
  }, []);

  async function init() {
    if (!currentStudent) return;

    const unlockedBadges = await getUnlockedBadges();
    const prevBadges = await getPrevBadges();
    const nextUnlockBadges = await getNextUnlockBadges();
    const getAllBadges = await getbadges();
    const badgeInfoArray: BadgeInfo[] = [];
    const uniqueBadgeIds = new Set<string>();
    const fetchedBadges: Badge[] = [];
    for (let temp of getAllBadges) {
      const badgeData = await api.getBadgeById(temp);
      if (!!badgeData) {
        fetchedBadges.push(badgeData);
      }
    }
    setAllBadges(fetchedBadges);

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

    setBadges(badgeInfoArray);
  }
  const getbadges = async () => {
    const matchingDocIds: string[] = [];
    const date = new Date();
    const currentWeek = Util.getCurrentWeekNumber();
    const rewardsDoc = await api.getRewardsById(date.getFullYear().toString());
    if (rewardsDoc && rewardsDoc.weekly) {
      for (const key in rewardsDoc.weekly) {
        const weekNumber = parseInt(key);
        if (!isNaN(weekNumber) && weekNumber > currentWeek) {
          rewardsDoc.weekly[key].forEach((item) => {
            if (item.type == LeaderboardRewardsType.BADGE) {
              matchingDocIds.push(item.id);
            }
          });
        }
      }
    }
    return matchingDocIds;
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
              (value.isUnlocked
                ? ""
                : value.isNextUnlock
                ? "next-reward"
                : "lost-reward")
            }
          >
            {value.isNextUnlock && (
              <div className="green-circle">
                <FaHeart color="white" />
              </div>
            )}
            <CachedImage src={value.badge?.image} />
            {value.isUnlocked && <p>{t("won reward")}</p>}
            {!value.isUnlocked && !value.isNextUnlock && (
              <p>{t("lost reward")}</p>
            )}
            {value.isNextUnlock && (
              <p className="leaderboard-next-unlock-text">
                {t("This Week's Reward")}
              </p>
            )}
          </div>
        ))}
      {allBadges &&
        allBadges.length > 0 &&
        allBadges.map((value) => (
          <div className="leaderboard-badge-disabled">
            <CachedImage src={value.image} />
            {!!value.name ? <p>{value.name}</p> : ""}
          </div>
        ))}
    </div>
  ) : (
    <div></div>
  );
};

export default LeaderboardBadges;
