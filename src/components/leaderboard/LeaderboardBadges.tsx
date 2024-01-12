import { FC, useEffect, useState } from "react";
import { Util } from "../../utility/util";
import { ServiceConfig } from "../../services/ServiceConfig";
import Badge from "../../models/Badge";
import { LeaderboardRewardsType } from "../../common/constants";

interface BadgeInfo {
  badge: Badge | undefined;
  isUnlocked: boolean;
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
    const badgeInfoArray: BadgeInfo[] = [];
    const uniqueBadgeIds = new Set<string>();

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
    const unlockedBadges = await Promise.all(
      currentStudent.rewards.badges.map((value) => api.getBadgeById(value.id))
    );
    return unlockedBadges;
  };

  const getPrevBadges = async () => {
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
  return currentStudent ? (
    <div>
      {badges && badges.length > 0 && (
        <div>
          {badges.map((value, index) => (
            <div
              key={index}
              style={{
                color: value.isUnlocked ? "black" : "grey",
              }}
            >
              {value.badge?.name}
            </div>
          ))}
        </div>
      )}
    </div>
  ) : (
    <div></div>
  );
};

export default LeaderboardBadges;
