import { FC, useEffect, useState } from "react";
import { Util } from "../../utility/util";
import Lesson from "../../models/lesson";
import { ServiceConfig } from "../../services/ServiceConfig";
import { LeaderboardRewardsType } from "../../common/constants";

interface BonusInfo {
  bonus: Lesson | undefined;
  isUnlocked: boolean;
}
const LeaderboardBonus: FC = () => {
  const currentStudent = Util.getCurrentStudent()!;
  const api = ServiceConfig.getI().apiHandler;

  const [bonuses, setBonuses] = useState<BonusInfo[]>();
  useEffect(() => {
    if (!currentStudent) return;
    init();
  }, []);

  async function init() {
    if (!currentStudent) return;

    const unlockedBonuses = await getUnlockedBonus();
    console.log("🚀 ~ init ~ unlockedBonuses:", unlockedBonuses);
    const prevBonuses = await getPrevBonus();
    console.log("🚀 ~ init ~ prevBonuses:", prevBonuses);
    const bonusInfoArray: BonusInfo[] = [];
    const uniqueBonusIds = new Set<string>();

    for (const unlockedBonus of unlockedBonuses) {
      if (unlockedBonus) {
        bonusInfoArray.push({
          bonus: unlockedBonus,
          isUnlocked: true,
        });
        uniqueBonusIds.add(unlockedBonus.docId);
      }
    }
    for (const prevBonus of prevBonuses) {
      if (prevBonus) {
        const isCommon = uniqueBonusIds.has(prevBonus.docId);
        if (isCommon) continue;
        bonusInfoArray.push({
          bonus: prevBonus,
          isUnlocked: false,
        });
        uniqueBonusIds.add(prevBonus.docId);
      }
    }

    setBonuses(bonusInfoArray);
    console.log("🚀 ~ init ~ bonusInfoArray:", bonusInfoArray);
  }
  const getUnlockedBonus = async (): Promise<(Lesson | undefined)[]> => {
    if (
      !currentStudent.rewards ||
      !currentStudent.rewards.bonus ||
      currentStudent.rewards.bonus.length < 1
    ) {
      return [];
    }
    const unlockedBonus = await Promise.all(
      currentStudent.rewards.bonus.map((value) => api.getLesson(value.id))
    );
    return unlockedBonus;
  };

  const getPrevBonus = async () => {
    const date = new Date();
    const rewardsDoc = await api.getRewardsById(date.getFullYear().toString());
    if (!rewardsDoc) return [];
    const currentMonth = new Date().getMonth();
    const bonusIds: string[] = [];
    const monthlyData = rewardsDoc.monthly;
    for (const key in monthlyData) {
      const weekNumber = parseInt(key);
      if (!isNaN(weekNumber) && weekNumber < currentMonth) {
        monthlyData[key].forEach((item) => {
          if (item.type == LeaderboardRewardsType.BONUS) {
            bonusIds.push(item.id);
          }
        });
      }
    }
    const bonusDocs = await Promise.all(
      bonusIds.map((value) => api.getLesson(value))
    );
    return bonusDocs;
  };

  return currentStudent ? (
    <div>
      {bonuses && bonuses.length > 0 && (
        <div>
          {bonuses.map((value, index) => (
            <div
              key={index}
              style={{
                color: value.isUnlocked ? "black" : "grey",
              }}
            >
              {value.bonus?.title ?? "Bhanu"}
            </div>
          ))}
        </div>
      )}
    </div>
  ) : (
    <div></div>
  );
};

export default LeaderboardBonus;
