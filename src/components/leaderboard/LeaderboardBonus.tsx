import { FC, useEffect, useState } from "react";
import { Util } from "../../utility/util";
import Lesson from "../../models/lesson";
import { ServiceConfig } from "../../services/ServiceConfig";
import { LeaderboardRewardsType } from "../../common/constants";
import "./LeaderboardBonus.css";
import LessonCard from "../LessonCard";

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
    const prevBonuses = await getPrevBonus();
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
          if (item.type === LeaderboardRewardsType.BONUS) {
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
    <div className="leaderboard-bonus-container">
      {bonuses &&
        bonuses.length > 0 &&
        bonuses.map((value, index) => (
          <div
            key={index}
            className={
              "leaderboard-bonus-item " +
              (value.isUnlocked ? "" : "leaderboard-bonus-disabled")
            }
          >
            {value.bonus && (
              <LessonCard
                width={""}
                height={""}
                lesson={value.bonus}
                course={undefined}
                isPlayed={false}
                isUnlocked={value.isUnlocked}
                isHome={false}
                showSubjectName={false}
                score={undefined}
                isLoved={undefined}
                lessonData={[]}
                startIndex={0}
                // showScoreCard={false}
                // showText={false}
                showChapterName={false}
              />
            )}
          </div>
        ))}
    </div>
  ) : (
    <div></div>
  );
};

export default LeaderboardBonus;
