import { FC, useEffect, useState } from "react";
import { Util } from "../../utility/util";
import { ServiceConfig } from "../../services/ServiceConfig";
import sticker from "../../models/Sticker";
import { LeaderboardRewardsType } from "../../common/constants";
import CachedImage from "../common/CachedImage";
import "./LeaderboardSticker.css";
import Sticker from "../../models/Sticker";
import { t } from "i18next";

interface stickerInfo {
  sticker: sticker | undefined;
  isUnlocked: boolean;
  isNextUnlock?: boolean;
}

const LeaderboardStickers: FC = () => {
  const currentStudent = Util.getCurrentStudent()!;
  const api = ServiceConfig.getI().apiHandler;
  const [stickers, setstickers] = useState<stickerInfo[]>();
  const [allStickers, setAllStickers] = useState<Sticker[]>();

  useEffect(() => {
    init();
  }, []);

  async function init() {
    if (!currentStudent) return;

    const unlockedstickers = await getUnlockedstickers();
    const prevstickers = await getPrevstickers();
    const nextUnlockedstickers = await Util.getNextUnlockStickers();
    const getAllStickers = await getStickers();
    const stickerInfoArray: stickerInfo[] = [];
    const uniqueStickerIds = new Set<string>();
    const fetchedStickers: Sticker[] = [];

    for (const unlockedStickers of unlockedstickers) {
      if (unlockedStickers) {
        stickerInfoArray.push({
          sticker: unlockedStickers,
          isUnlocked: true,
        });
        uniqueStickerIds.add(unlockedStickers.docId);
      }
    }

    for (const prevsticker of prevstickers) {
      if (prevsticker) {
        const isCommon = uniqueStickerIds.has(prevsticker.docId);
        if (isCommon) continue;
        stickerInfoArray.push({
          sticker: prevsticker,
          isUnlocked: false,
        });
        uniqueStickerIds.add(prevsticker.docId);
      }
    }
    for (const nextUnlockedsticker of nextUnlockedstickers) {
      if (nextUnlockedsticker) {
        stickerInfoArray.push({
          sticker: nextUnlockedsticker,
          isUnlocked: false,
          isNextUnlock: true,
        });
        // uniquestickerIds.add(nextUnlockedsticker.docId);
      }
    }
    for (const sticker of getAllStickers) {
      if (!!sticker) {
        fetchedStickers.push(sticker);
      }
    }

    setAllStickers(fetchedStickers);
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
      if (!isNaN(weekNumber) && weekNumber > currentWeek) {
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
                : "lost-reward")
            }
          >
            <CachedImage src={value.sticker?.image} />
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
      {allStickers &&
        allStickers.length > 0 &&
        allStickers.map((value, index) => (
          <div key={index} className={"leaderboard-sticker-disabled"}>
            <CachedImage src={value.image} />
            {!!value.name ? <p>{value.name}</p> : ""}
          </div>
        ))}
    </div>
  ) : (
    <div></div>
  );
};

export default LeaderboardStickers;
