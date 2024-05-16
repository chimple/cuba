import { FC, useEffect, useState } from "react";
import { Util } from "../../utility/util";
import { ServiceConfig } from "../../services/ServiceConfig";
import { LeaderboardRewardsType, TableTypes } from "../../common/constants";
import "./LeaderboardBonus.css";
import LessonCard from "../LessonCard";
import { t } from "i18next";

interface BonusInfo {
  bonus: TableTypes<"lesson"> | undefined;
  isUnlocked: boolean;
  isNextUnlock?: boolean;
  isUpcomingBonus?: boolean;
}
const LeaderboardBonus: FC = () => {
  const currentStudent = Util.getCurrentStudent()!;
  const api = ServiceConfig.getI().apiHandler;

  const [bonuses, setBonuses] = useState<BonusInfo[]>();
  const [allBonus, setAllBonus] =
    useState<(TableTypes<"lesson"> | undefined)[]>();

  useEffect(() => {
    if (!currentStudent) return;
    init();
  }, []);

  async function init() {
    if (!currentStudent) return;

    const unlockedBonuses = await getUnlockedBonus();
    const prevBonus = await getPrevBonus();
    const nextUnlockBonus = await getNextUnlockBonus();
    const allBonuses = await getBonus();
    const upcomingBonus = await getUpcomingBadges();
    setAllBonus(allBonuses);

    const bonusInfoArray: BonusInfo[] = prevBonus.map((bonus) => ({
      bonus,
      isUnlocked: unlockedBonuses.some((b) => b?.id === bonus?.id),
    }));

    nextUnlockBonus.forEach((bonus) => {
      bonusInfoArray.push({ bonus, isUnlocked: false, isNextUnlock: true });
    });
    upcomingBonus.forEach((bonus) => {
      bonusInfoArray.push({
        bonus,
        isUnlocked: false,
        isUpcomingBonus: true,
      });
    });
    setBonuses(bonusInfoArray);
  }
  const getUpcomingBadges = async (): Promise<
    (TableTypes<"lesson"> | undefined)[]
  > => {
    const rewardsDoc = await api.getRewardsById(
      Util.getCurrentYearForLeaderboard().toString()
    );
    if (!rewardsDoc) return [];
    const currentMonth = Util.getCurrentMonthForLeaderboard();
    const nextMonth = currentMonth + 1;
    const bonusIds: string[] = [];
    const monthlyData = rewardsDoc.monthly;
    monthlyData?.[nextMonth.toString()].forEach((value) => {
      if (value.type === LeaderboardRewardsType.BONUS) {
        bonusIds.push(value.id);
      }
    });
    const bonusDocs = await Promise.all(
      bonusIds.map((value) => api.getLesson(value))
    );
    return bonusDocs;
  };
  const getBonus = async () => {
    const rewardsDoc = await api.getRewardsById(
      Util.getCurrentYearForLeaderboard().toString()
    );
    if (!rewardsDoc) return [];
    const currentMonth = Util.getCurrentMonthForLeaderboard();
    const bonusIds: string[] = [];
    const monthlyData: any = rewardsDoc.monthly;
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
  const getUnlockedBonus = async (): Promise<
    (TableTypes<"lesson"> | undefined)[]
  > => {
    // if (
    //   !currentStudent.rewards ||
    //   !currentStudent.rewards.bonus ||
    //   currentStudent.rewards.bonus.length < 1
    // ) {
    //   return [];
    // }
    // let isSeen = true;
    // const unlockedBonus = await Promise.all(
    //   currentStudent.rewards.bonus.map((value) => {
    //     if (!value.seen) {
    //       isSeen = false;
    //     }
    //     return api.getLesson(value.id);
    //   })
    // );
    // if (!isSeen) {
    //   api.updateRewardAsSeen(currentStudent.id);
    // }
    // return unlockedBonus?.reverse();
    return [];
  };

  const getPrevBonus = async (): Promise<
    (TableTypes<"lesson"> | undefined)[]
  > => {
    const rewardsDoc = await api.getRewardsById(
      Util.getCurrentYearForLeaderboard().toString()
    );
    if (!rewardsDoc) return [];
    const currentMonth = Util.getCurrentMonthForLeaderboard();
    const bonusIds: string[] = [];
    const monthlyData: any = rewardsDoc.monthly;
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

  const getNextUnlockBonus = async (): Promise<
    (TableTypes<"lesson"> | undefined)[]
  > => {
    const rewardsDoc = await api.getRewardsById(
      Util.getCurrentYearForLeaderboard().toString()
    );
    if (!rewardsDoc) return [];
    const currentMonth = Util.getCurrentMonthForLeaderboard();
    const bonusIds: string[] = [];
    const monthlyData = rewardsDoc.monthly;
    monthlyData?.[currentMonth.toString()].forEach((value) => {
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
            style={{ opacity: value.isUpcomingBonus ? "0.2" : "" }}
            className={
              "leaderboard-badge-item " +
              (value.isUnlocked
                ? ""
                : value.isNextUnlock
                  ? "next-reward"
                  : "") +
              (!value.isUnlocked &&
              !value.isUpcomingBonus &&
              !value.isNextUnlock
                ? "lost-bonus"
                : "")
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
                showSubjectName={false}
                score={undefined}
                isLoved={undefined}
                // showScoreCard={false}
                // showText={false}
                showChapterName={false}
              />
            )}
            {value.isNextUnlock && (
              <p className="leaderboard-next-unlock-text">
                {t("This Month's Reward")}
              </p>
            )}
            {value.isUnlocked && (
              <p>
                <b>{t("won reward")}</b>
              </p>
            )}
            {!value.isUnlocked &&
              !value.isNextUnlock &&
              !value.isUpcomingBonus && <p>{t("lost reward")}</p>}
            {value.isUpcomingBonus && <p>{t("Upcoming")}</p>}
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
                showSubjectName={false}
                score={undefined}
                isLoved={undefined}
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
