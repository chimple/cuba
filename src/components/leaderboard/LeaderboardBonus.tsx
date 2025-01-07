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
  const [lostBonus, setLostBonus] = useState<BonusInfo[]>();

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
      if (bonus) {
        bonusInfoArray.push({ bonus, isUnlocked: false, isNextUnlock: true });
      }
    });

    unlockedBonuses.forEach((bonus) => {
      const isInNextUnlock = bonusInfoArray?.some(
        (nextBonus) => nextBonus?.bonus?.id === bonus?.id
      );
      if (!isInNextUnlock) {
        bonusInfoArray.push({
          bonus,
          isUnlocked: true,
          isNextUnlock: false,
        });
      }
    });

    upcomingBonus.forEach((bonus) => {
      if (bonus) {
        bonusInfoArray.push({
          bonus,
          isUnlocked: false,
          isUpcomingBonus: true,
        });
      }
    });
    setBonuses(bonusInfoArray); // Sorting logic: prioritize by type order
    const typePriority = (bonus: BonusInfo): number => {
      if (bonus.isNextUnlock) return 1; // Current
      if (bonus.isUpcomingBonus) return 2; // Upcoming
      if (bonus.isUnlocked) return 3; // Won
      if (!bonus.isUnlocked && !bonus.isUpcomingBonus) return 4; // Lost
      return 5; // Remaining
    };

    bonusInfoArray.sort((a, b) => typePriority(a) - typePriority(b));
    // Filter lost badges
    const lostBonusArray = bonusInfoArray.filter(
      (bonus) => !bonus.isUnlocked && !bonus.isNextUnlock && !bonus.isUpcomingBonus
    );
    // Filter current, upcoming, and won badges
    const filteredBonus = bonusInfoArray.filter(
      (bonus) =>
        bonus.isUnlocked || bonus.isNextUnlock || bonus.isUpcomingBonus
    );
    setBonuses(filteredBonus);
    setLostBonus(lostBonusArray);
  }
  const getUpcomingBadges = async (): Promise<TableTypes<"lesson">[]> => {
    const rewardsDoc = await api.getRewardsById(
      Util.getCurrentYearForLeaderboard(),
      "monthly"
    );
    if (!rewardsDoc) return [];
    const currentMonth = Util.getCurrentMonthForLeaderboard();
    const nextMonth = currentMonth + 1;
    const bonusIds: string[] = [];
    const monthlyData: any = rewardsDoc.monthly;
    if (monthlyData && monthlyData[nextMonth.toString()]) {
      monthlyData[nextMonth.toString()].forEach((value: any) => {
        if (value.type === LeaderboardRewardsType.BONUS) {
          bonusIds.push(value.id);
        }
      });
    } else {
      console.error(`No data found for month ${nextMonth}`);
      return [];
    }
    const bonusDocs = await api.getBonusesByIds(bonusIds);
    return bonusDocs;
  };
  const getBonus = async (): Promise<(TableTypes<"lesson"> | undefined)[]> => {
    const rewardsDoc = await api.getRewardsById(
      Util.getCurrentYearForLeaderboard(),
      "monthly"
    );
    if (!rewardsDoc) return [];
    const currentMonth = Util.getCurrentMonthForLeaderboard();
    const bonusIds: string[] = [];
    const monthlyData: any = rewardsDoc.monthly;
    for (const key in monthlyData) {
      const monthNumber = parseInt(key);
      if (!isNaN(monthNumber) && monthNumber > currentMonth) {
        monthlyData[key].forEach((item) => {
          if (item.type === LeaderboardRewardsType.BONUS) {
            bonusIds.push(item.id);
          }
        });
      }
    }
    const bonusDocs = await api.getBonusesByIds(bonusIds);
    return bonusDocs;
  };
  const getUnlockedBonus = async (): Promise<TableTypes<"lesson">[]> => {
    if (!currentStudent) return [];

    try {
      const userBonuses = await api.getUserBonus(currentStudent.id);
      if (!userBonuses || userBonuses.length === 0) return [];

      let isSeen = true;

      const lessonIds = userBonuses.map((bonus) => {
        if (!bonus.is_seen) {
          isSeen = false;
        }
        return bonus.bonus_id;
      });

      const lessons = await api.getBonusesByIds(lessonIds);
      if (!isSeen) {
        await api.updateRewardAsSeen(currentStudent.id);
      }

      return lessons.reverse();
    } catch (error) {
      console.error("Error fetching unlocked bonuses:", error);
      return [];
    }
  };

  const getPrevBonus = async (): Promise<
    (TableTypes<"lesson"> | undefined)[]
  > => {
    const rewardsDoc = await api.getRewardsById(
      Util.getCurrentYearForLeaderboard(),
      "monthly"
    );
    if (!rewardsDoc) return [];
    const currentMonth = Util.getCurrentMonthForLeaderboard();
    const bonusIds: string[] = [];
    const monthlyData: any = rewardsDoc.monthly;
    for (const key in monthlyData) {
      const monthNumber = parseInt(key);
      if (!isNaN(monthNumber) && monthNumber < currentMonth) {
        monthlyData[key].forEach((item) => {
          if (item.type === LeaderboardRewardsType.BONUS) {
            bonusIds.push(item.id);
          }
        });
      }
    }
    const bonusDocs = await api.getBonusesByIds(bonusIds);
    return bonusDocs;
  };

  const getNextUnlockBonus = async (): Promise<TableTypes<"lesson">[]> => {
    const rewardsDoc = await api.getRewardsById(
      Util.getCurrentYearForLeaderboard(),
      "monthly"
    );
    if (!rewardsDoc) return [];
    const currentMonth = Util.getCurrentMonthForLeaderboard();
    const nextMonth = currentMonth + 1;
    const bonusIds: string[] = [];
    const monthlyData: any = rewardsDoc.monthly;
    if (monthlyData && monthlyData[nextMonth.toString()]) {
      monthlyData[nextMonth.toString()].forEach((value: any) => {
        if (value.type === LeaderboardRewardsType.BONUS) {
          bonusIds.push(value.id);
        }
      });
    } else {
      console.error(`No data found for month ${nextMonth}`);
      return [];
    }
    const bonusDocs = await api.getBonusesByIds(bonusIds);
    return bonusDocs;
  };

   return currentStudent ? (
    <div className="leaderboard-bonus-page">
      {/* Section for Current, Upcoming, and Won Bonuses */}
      <div className="leaderboard-bonus-section">
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
                  (value.isUpcomingBonus
                    ? "upcoming-reward"
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
        </div>
      </div>

      <hr className="section-divider" />

      {/* Section for Lost Bonuses */}
      <div className="leaderboard-bonus-section">
        <div className="leaderboard-bonus-container">
          {lostBonus &&
            lostBonus.length > 0 &&
            lostBonus.map((value, index) => (
              !value.isUnlocked && !value.isUpcomingBonus && !value.isNextUnlock ? (
                <div
                  key={index}
                  className="leaderboard-badge-item lost-reward"
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
                  <p>{t("Lost Reward")}</p>
                </div>
              ) : null
            ))}
        </div>
      </div>
    </div>
  ) : (
    <div></div>
  );

};

export default LeaderboardBonus;