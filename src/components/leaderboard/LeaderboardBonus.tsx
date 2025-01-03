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
  isUpcomingBonus?: boolean;
}
const LeaderboardBonus: FC = () => {
  const currentStudent = Util.getCurrentStudent()!;
  const api = ServiceConfig.getI().apiHandler;

  const [bonuses, setBonuses] = useState<BonusInfo[]>();
  const [allBonus, setAllBonus] = useState<(Lesson | undefined)[]>();
  const [lostBonus, setLostBonus] = useState<BonusInfo[]>();

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
      isUnlocked: unlockedBonuses.some((b) => b?.docId === bonus?.docId),
    }));

    nextUnlockBonus.forEach((bonus) => {
      const isAlreadyUnlocked = unlockedBonuses.some(
        (b) => b?.docId === bonus?.docId
      );
      if (isAlreadyUnlocked) {
        bonusInfoArray.push({ bonus, isUnlocked: true, isNextUnlock: true });
      } else {
        bonusInfoArray.push({ bonus, isUnlocked: false, isNextUnlock: true });
      }
    });
    unlockedBonuses.forEach((bonus) => {
      const isInNextUnlock = bonusInfoArray?.some(
        (nextBonus) => nextBonus?.bonus?.docId === bonus?.docId
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
      bonusInfoArray.push({
        bonus,
        isUnlocked: false,
        isUpcomingBonus: true,
      });
    });
    // Sorting logic: prioritize by type order
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
  const getUpcomingBadges = async (): Promise<(Lesson | undefined)[]> => {
    const rewardsDoc = await api.getRewardsById(
      Util.getCurrentYearForLeaderboard().toString()
    );
    if (!rewardsDoc) return [];
    const currentMonth = Util.getCurrentMonthForLeaderboard();
    const nextMonth = currentMonth + 1;
    const bonusIds: string[] = [];
    const monthlyData = rewardsDoc.monthly;

    // Ensure monthlyData and nextMonth exist
    if (!monthlyData || !monthlyData[nextMonth.toString()]) {
      console.warn("No data available for next month:", nextMonth);
      return [];
    }
    monthlyData[nextMonth.toString()].forEach((value) => {
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
                    isHome={false}
                    showSubjectName={false}
                    score={undefined}
                    isLoved={undefined}
                    lessonData={[]}
                    startIndex={0}
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
                      isHome={false}
                      showSubjectName={false}
                      score={undefined}
                      isLoved={undefined}
                      lessonData={[]}
                      startIndex={0}
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
