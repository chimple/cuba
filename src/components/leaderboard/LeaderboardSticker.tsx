import { FC, useEffect, useState } from "react";
import { Util } from "../../utility/util";
import { ServiceConfig } from "../../services/ServiceConfig";
import sticker from "../../models/Sticker";
import { LeaderboardRewardsType } from "../../common/constants";
import CachedImage from "../common/CachedImage";
import "./LeaderboardSticker.css";
import Sticker from "../../models/Sticker";

interface stickerInfo {
  sticker: sticker | undefined;
  isUnlocked: boolean;
  isNextUnlock?: boolean;
}

const LeaderboardStickers: FC = () => {
  const currentStudent = Util.getCurrentStudent()!;
  const api = ServiceConfig.getI().apiHandler;
  const [stickers, setstickers] = useState<stickerInfo[]>();

  useEffect(() => {
    init();
  }, []);

  async function init() {
    if (!currentStudent) return;

    const unlockedstickers = await getUnlockedstickers();
    const prevstickers = await getPrevstickers();
    const nextUnlockedstickers = await getNextUnlockStickers();
    const stickerInfoArray: stickerInfo[] = [];
    const uniqueStickerIds = new Set<string>();

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

  const getNextUnlockStickers = async (): Promise<(Sticker | undefined)[]> => {
    const date = new Date();
    const rewardsDoc = await api.getRewardsById(date.getFullYear().toString());
    if (!rewardsDoc) return [];
    const currentWeek = Util.getCurrentWeekNumber();
    const stickerIds: string[] = [];
    const weeklyData = rewardsDoc.weeklySticker;
    weeklyData[currentWeek.toString()].forEach((value) => {
      if (value.type === LeaderboardRewardsType.STICKER) {
        stickerIds.push(value.id);
      }
    });
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
              "leaderboard-sticker-item " +
              (value.isUnlocked ? "" : "leaderboard-sticker-disabled")
            }
          >
            <CachedImage src={value.sticker?.image} />
          </div>
        ))}
    </div>
  ) : (
    <div></div>
  );
};

export default LeaderboardStickers;
