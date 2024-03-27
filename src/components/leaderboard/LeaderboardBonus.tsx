import { FC, useEffect, useState } from "react";
import { Util } from "../../utility/util";
import Lesson from "../../models/lesson";
import { ServiceConfig } from "../../services/ServiceConfig";
import { LeaderboardRewardsType } from "../../common/constants";
import "./LeaderboardBonus.css";
import LessonCard from "../LessonCard";
import { t } from "i18next";

interface BonusInfo {
  bonus: Lesson | undefined;
  isUnlocked: boolean;
  isNextUnlock?: boolean;
}
const LeaderboardBonus: FC = () => {
  const currentStudent = Util.getCurrentStudent()!;
  const api = ServiceConfig.getI().apiHandler;

  const [bonuses, setBonuses] = useState<BonusInfo[]>();
  const [allBonus, setAllBonus] = useState<Lesson[]>();

  useEffect(() => {
    if (!currentStudent) return;
    init();
  }, []);

  async function init() {
    if (!currentStudent) return;

    const unlockedBonuses = await getUnlockedBonus();
    const prevBonuses = await getPrevBonus();
    const nextUnlockBonuses = await getNextUnlockBonus();
    const getAllBonus = await getBonus();
    console.log("🚀 ~ init ~ nextUnlockBonuses:", nextUnlockBonuses);
    const bonusInfoArray: BonusInfo[] = [];
    const uniqueBonusIds = new Set<string>();
    const fetchedBonus: Lesson[] = [];

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
    for (const unlockedBonus of nextUnlockBonuses) {
      if (unlockedBonus) {
        let newBonus = unlockedBonus;
        newBonus.title = t("This Month's Reward");
        bonusInfoArray.push({
          bonus: unlockedBonus,
          isUnlocked: false,
          isNextUnlock: true,
        });
        // uniqueBadgeIds.add(unlockedBonus.docId);
      }
    }
    for (const bonus of getAllBonus) {
      if (!!bonus) {
        fetchedBonus.push(bonus);
      }
    }
    setAllBonus(fetchedBonus);
    setBonuses(bonusInfoArray);
  }
  const getBonus = async () => {
    const rewardsDoc = await api.getRewardsById(
      Util.getCurrentYearForLeaderboard().toString()
    );
    if (!rewardsDoc) return [];
    const currentMonth = Util.getCurrentMonthForLeaderboard();
    const bonusIds: string[] = [];
    const monthlyData = rewardsDoc.monthly;
    for (const key in monthlyData) {
      const weekNumber = parseInt(key);
      if (!isNaN(weekNumber) && weekNumber > currentMonth) {
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
  const getUnlockedBonus = async (): Promise<(Lesson | undefined)[]> => {
    if (
      !currentStudent.rewards ||
      !currentStudent.rewards.bonus ||
      currentStudent.rewards.bonus.length < 1
    ) {
      return [];
    }
    let isSeen = true;
    const unlockedBonus = await Promise.all(
      currentStudent.rewards.bonus.map((value) => {
        if (!value.seen) {
          isSeen = false;
        }
        return api.getLesson(value.id);
      })
    );
    if (!isSeen) {
      api.updateRewardAsSeen(currentStudent.docId);
    }
    return unlockedBonus?.reverse();
  };

  const getPrevBonus = async (): Promise<(Lesson | undefined)[]> => {
    const rewardsDoc = await api.getRewardsById(
      Util.getCurrentYearForLeaderboard().toString()
    );
    if (!rewardsDoc) return [];
    const currentMonth = Util.getCurrentMonthForLeaderboard();
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

  const getNextUnlockBonus = async (): Promise<(Lesson | undefined)[]> => {
    const rewardsDoc = await api.getRewardsById(
      Util.getCurrentYearForLeaderboard().toString()
    );
    if (!rewardsDoc) return [];
    const currentMonth = Util.getCurrentMonthForLeaderboard();
    const bonusIds: string[] = [];
    const monthlyData = rewardsDoc.monthly;
    monthlyData[currentMonth.toString()].forEach((value) => {
      if (value.type === LeaderboardRewardsType.BONUS) {
        bonusIds.push(value.id);
      }
    });
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
              "leaderboard-badge-item " +
              (value.isUnlocked
                ? ""
                : value.isNextUnlock
                ? "next-reward"
                : "lost-reward")
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
            {value.isUnlocked && <p>{t("won reward")}</p>}
            {!value.isUnlocked && !value.isNextUnlock && (
              <p>{t("lost reward")}</p>
            )}
          </div>
        ))}
      {allBonus &&
        allBonus.length > 0 &&
        allBonus.map((value, index) => (
          <div
            key={index}
            className={value ? "leaderboard-bonus-disabled" : ""}
          >
            {value && (
              <LessonCard
                width={""}
                height={""}
                lesson={value}
                course={undefined}
                isPlayed={false}
                isUnlocked={false}
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
