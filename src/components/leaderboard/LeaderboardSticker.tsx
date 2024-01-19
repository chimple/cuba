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
    // const currentstickers = await getCurrentstickers();
    const stickerInfoArray: stickerInfo[] = [];
    const uniquestickerIds = new Set<string>();

    for (const unlockedsticker of unlockedstickers) {
      if (unlockedsticker) {
        stickerInfoArray.push({
          sticker: unlockedsticker,
          isUnlocked: true,
        });
        uniquestickerIds.add(unlockedsticker.docId);
      }
    }

    for (const prevsticker of prevstickers) {
      if (prevsticker) {
        const isCommon = uniquestickerIds.has(prevsticker.docId);
        if (isCommon) continue;
        stickerInfoArray.push({
          sticker: prevsticker,
          isUnlocked: false,
        });
        uniquestickerIds.add(prevsticker.docId);
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
    const unlockedstickers = await Promise.all(
      currentStudent.rewards.sticker.map((value) =>
        api.getStickerById(value.id)
      )
    );
    return unlockedstickers;
  };

  const getPrevstickers = async (): Promise<(Sticker | undefined)[]> => {
    const date = new Date();
    const rewardsDoc = await api.getRewardsById(date.getFullYear().toString());
    if (!rewardsDoc) return [];
    const currentWeek = Util.getCurrentWeekNumber();
    const stickerIds: string[] = [];
    const weeklyData = rewardsDoc.weekly;
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

  const getCurrentstickers = async (): Promise<(Sticker | undefined)[]> => {
    const date = new Date();
    const rewardsDoc = await api.getRewardsById(date.getFullYear().toString());
    if (!rewardsDoc) return [];
    const currentWeek = Util.getCurrentWeekNumber();
    const stickerIds: string[] = [];
    const weeklyData = rewardsDoc.weekly;
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
