import { Timestamp } from "firebase/firestore";
import BaseObject from "./baseObject";

export default class Avatar extends BaseObject {
  private _modes: string[];
  private _achievementAudios: string[];
  private _nonAchievementAudios: string[];
  private _commonAudios: string[];
  private _questionList: { [questionName: string]: string[] };

  constructor(
    modes: string[],
    achievementAudios: string[],
    nonAchievementAudios: string[],
    commonAudios: string[],
    questionList: { [questionName: string]: string[] },
    updatedAt: Timestamp,
    createdAt: Timestamp,
    docId: string
  ) {
    super(updatedAt, createdAt, docId);
    this._modes = modes;
    this._achievementAudios = achievementAudios;
    this._nonAchievementAudios = nonAchievementAudios;
    this._commonAudios = commonAudios;
    this._questionList = questionList;
  }

  public get modes(): string[] {
    return this._modes;
  }
  public set modes(value: string[]) {
    this._modes = value;
  }

  public get achievementAudios(): string[] {
    return this._achievementAudios;
  }
  public set achievementAudios(value: string[]) {
    this._achievementAudios = value;
  }

  public get nonAchievementAudios(): string[] {
    return this.nonAchievementAudios;
  }
  public set nonAchievementAudios(value: string[]) {
    this._nonAchievementAudios = value;
  }

  public get commonAudios(): string[] {
    return this._commonAudios;
  }
  public set commonAudios(value: string[]) {
    this._modes = value;
  }

  public get questionList(): { [questionName: string]: string[] } {
    return this._questionList;
  }
  public set questionList(value: { [questionName: string]: string[] }) {
    this._questionList = value;
  }
}
