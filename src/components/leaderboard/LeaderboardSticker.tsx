import { FC, useEffect, useState } from "react";
import { Util } from "../../utility/util";
import { ServiceConfig } from "../../services/ServiceConfig";
import sticker from "../../models/Sticker";
import { LeaderboardRewardsType } from "../../common/constants";
import CachedImage from "../common/CachedImage";
import "./LeaderboardSticker.css";
import Sticker from "../../models/Sticker";
import { t } from "i18next";
import { FaHeart } from "react-icons/fa";
import { RxCross2 } from "react-icons/rx";
import { TiTick } from "react-icons/ti";

interface stickerInfo {
  sticker: sticker | undefined;
  isUnlocked: boolean;
  isNextUnlock?: boolean;
  isUpcomingSticker?: boolean;
}

const LeaderboardStickers: FC = () => {
  const currentStudent = Util.getCurrentStudent()!;
  const api = ServiceConfig.getI().apiHandler;
  const [stickers, setstickers] = useState<stickerInfo[]>();
  const [allSticker, setAllStickers] = useState<(Sticker | undefined)[]>();

  useEffect(() => {
    init();
  }, []);

  async function init() {
    if (!currentStudent) return;

    const unlockedStickers = await getUnlockedstickers();
    const prevStickers = await getPrevstickers();
    const nextUnlockStickers = await Util.getNextUnlockStickers();
    const allStickers = await getStickers();
    const upcomingStickers = await getUpcomingStickers();
    setAllStickers(allStickers);

    const stickerInfoArray: stickerInfo[] = prevStickers.map((sticker) => ({
      sticker,
      isUnlocked: unlockedStickers.some((s) => s?.docId === sticker?.docId),
    }));

    nextUnlockStickers?.forEach((sticker) => {
      const isAlreadyUnlocked = unlockedStickers.some(
        (b) => b?.docId === sticker?.docId
      );
      if (isAlreadyUnlocked) {
        stickerInfoArray.push({
          sticker,
          isUnlocked: true,
          isNextUnlock: true,
        });
      } else {
        stickerInfoArray.push({
          sticker,
          isUnlocked: false,
          isNextUnlock: true,
        });
      }
    });
    upcomingStickers.forEach((sticker) => {
      stickerInfoArray.push({
        sticker,
        isUnlocked: false,
        isUpcomingSticker: true,
      });
    });
    setstickers(stickerInfoArray);
  }
  const getUnlockedstickers = async (): Promise<(Sticker | undefined)[]> => {
    if (
      !currentStudent.rewards ||
      !currentStudent.rewards.sticker ||
      currentStudent.rewards.sticker.length < 1
    ) {
      return [];
    }
    let isSeen = true;
    const unlockedSticker = await Promise.all(
      currentStudent.rewards.sticker.map((value) => {
        if (!value.seen) {
          isSeen = false;
        }
        return api.getStickerById(value.id);
      })
    );
    if (!isSeen) {
      api.updateRewardAsSeen(currentStudent.docId);
    }
    return unlockedSticker?.reverse();
  };
  const getStickers = async () => {
    const date = new Date();
    const rewardsDoc = await api.getRewardsById(date.getFullYear().toString());
    if (!rewardsDoc) return [];
    const currentWeek = Util.getCurrentWeekNumber();
    const stickerIds: string[] = [];
    const weeklyData = rewardsDoc.weeklySticker;
    for (const key in weeklyData) {
      const weekNumber = parseInt(key);
      if (!isNaN(weekNumber) && weekNumber > currentWeek + 1) {
        weeklyData[key].forEach((item) => {
          if (item.type == LeaderboardRewardsType.STICKER) {
            stickerIds.push(item.id);
          }
        });
      }
    }
    const stickerDocs = await Promise.all(
      stickerIds.map((value) => api.getStickerById(value))
    );
    return stickerDocs;
  };
  const getPrevstickers = async (): Promise<(Sticker | undefined)[]> => {
    const date = new Date();
    const rewardsDoc = await api.getRewardsById(date.getFullYear().toString());
    if (!rewardsDoc) return [];
    const currentWeek = Util.getCurrentWeekNumber();
    const stickerIds: string[] = [];
    const weeklyData = rewardsDoc.weeklySticker;
    for (const key in weeklyData) {
      const weekNumber = parseInt(key);
      if (!isNaN(weekNumber) && weekNumber < currentWeek) {
        weeklyData[key].forEach((item) => {
          if (item.type == LeaderboardRewardsType.STICKER) {
            stickerIds.push(item.id);
          }
        });
      }
    }
    const stickerDocs = await Promise.all(
      stickerIds.map((value) => api.getStickerById(value))
    );
    return stickerDocs;
  };
  const getUpcomingStickers = async (): Promise<(Sticker | undefined)[]> => {
    const date = new Date();
    const rewardsDoc = await api.getRewardsById(date.getFullYear().toString());

    if (!rewardsDoc) return [];
    const currentWeek = Util.getCurrentWeekNumber();
    const nextWeek = currentWeek + 1;
    const stickerIds: string[] = [];
    const weeklyData = rewardsDoc.weeklySticker;
    const weekData = weeklyData[nextWeek.toString()];
    if (weekData) {
      weeklyData[nextWeek.toString()].forEach((value) => {
        if (value.type === LeaderboardRewardsType.STICKER) {
          stickerIds.push(value.id);
        }
      });
    }

    const stickerDocs = await Promise.all(
      stickerIds.map((value) => api.getStickerById(value))
    );
    return stickerDocs;
  };
  return currentStudent ? (
    <div className="leaderboard-sticker-container">
      {stickers &&
        stickers.length > 0 &&
        stickers.map((value, index) => (
          <div
            key={index}
            className={
              "leaderboard-badge-item " +
              (value.isUnlocked
                ? ""
                : value.isNextUnlock
                  ? "next-reward"
                  : value.isUpcomingSticker
                    ? "next-reward"
                    : "lost-reward")
            }
          >
            {value.isNextUnlock && !value.isUnlocked && (
              <div className="green-circle">
                <FaHeart color="white" />
              </div>
            )}
            {!value.isUnlocked &&
              !value.isNextUnlock &&
              !value.isUpcomingSticker && (
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

            <CachedImage src={value.sticker?.image} />

            <p>{value.sticker?.name}</p>
            {value.isUpcomingSticker && !value.isUnlocked ? (
              <p>{t("Upcoming")}</p>
            ) : (
              ""
            )}
            {!value.isUnlocked &&
              !value.isNextUnlock &&
              !value.isUpcomingSticker && <p>{t("lost reward")}</p>}
            {value.isUnlocked && (
              <p>
                <b>{t("won reward")}</b>
              </p>
            )}
            {!value.isUnlocked && value.isNextUnlock ? (
              <p className="leaderboard-next-unlock-text">
                {t("This Week's Reward")}
              </p>
            ) : null}
          </div>
        ))}
      {allSticker &&
        allSticker.length > 0 &&
        allSticker.map((value) => (
          <div className="leaderboard-badge-disabled">
            <CachedImage src={value?.image} />
            {!!value?.name ? <p>{value?.name}</p> : ""}
          </div>
        ))}
    </div>
  ) : (
    <div></div>
  );
};

export default LeaderboardStickers;
