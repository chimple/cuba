import { LeaderboardRewardsType } from "../common/constants";
import BaseObject from "./baseObject";
import { Timestamp } from "firebase/firestore";

export default class Rewards extends BaseObject {
  private _monthly: {
    [key: string]: { id: string; type: LeaderboardRewardsType }[];
  };
  private _weekly: {
    [key: string]: { id: string; type: LeaderboardRewardsType }[];
  };
  private _weeklySticker: {
    [key: string]: { id: string; type: LeaderboardRewardsType }[];
  };

  constructor({
    monthly,
    weekly,
    weeklySticker,
    updatedAt,
    createdAt,
    docId,
  }: {
    monthly: { [key: string]: { id: string; type: LeaderboardRewardsType }[] };
    weekly: { [key: string]: { id: string; type: LeaderboardRewardsType }[] };
    weeklySticker: {
      [key: string]: { id: string; type: LeaderboardRewardsType }[];
    };
    updatedAt: Timestamp;
    createdAt: Timestamp;
    docId: string;
  }) {
    super(updatedAt, createdAt, docId);
    this._monthly = monthly;
    this._weekly = weekly;
    this._weeklySticker = weeklySticker;
  }

  public get monthly(): {
    [key: string]: { id: string; type: LeaderboardRewardsType }[];
  } {
    return this._monthly;
  }

  public set monthly(value: {
    [key: string]: { id: string; type: LeaderboardRewardsType }[];
  }) {
    this._monthly = value;
  }

  public get weekly(): {
    [key: string]: { id: string; type: LeaderboardRewardsType }[];
  } {
    return this._weekly;
  }

  public set weekly(value: {
    [key: string]: { id: string; type: LeaderboardRewardsType }[];
  }) {
    this._weekly = value;
  }

  public get weeklySticker(): {
    [key: string]: { id: string; type: LeaderboardRewardsType }[];
  } {
    return this._weeklySticker;
  }

  public set weeklySticker(value: {
    [key: string]: { id: string; type: LeaderboardRewardsType }[];
  }) {
    this._weeklySticker = value;
  }
}
