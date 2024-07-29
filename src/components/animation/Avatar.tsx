import { Filesystem } from "@capacitor/filesystem";
import {
  CURRENT_AVATAR_SUGGESTION_NO,
  LEADERBOARD_REWARD_LIST,
  LeaderboardDropdownList,
  LeaderboardRewardsType,
  SHOW_DAILY_PROGRESS_FLAG,
  unlockedRewardsInfo,
} from "../../common/constants";
import { Chapter, StudentLessonResult } from "../../common/courseConstants";
import Course from "../../models/course";
import Lesson from "../../models/lesson";
import { Util } from "../../utility/util";
import { ServiceConfig } from "../../services/ServiceConfig";
import { t } from "i18next";
import { LeaderboardInfo } from "../../services/api/ServiceApi";

export enum AvatarModes {
  Welcome,
  CourseSuggestion,
  RecommendedLesson,
  ChapterSuggestion,
  LessonSuggestion,
  TwoOptionQuestion,
  FourOptionQuestion,
  ShowWeeklyProgress,
  collectReward,
  // scores >= 70
  GoodProgress,
  // scores < 70
  BadProgress,
}

export class AvatarObj {
  private _mode: any;
  private _message: string | undefined;
  private _imageSrc: string;
  private _audioSrc: string | undefined;
  private _avatarAnimation: string | undefined;
  private _yesAnimation: string | undefined;
  private _noAnimation: string | undefined;
  private _questionType: string | undefined; //"answered/unanswered",
  private _answer: string | undefined;
  private _option1: string | undefined;
  private _option2: string | undefined;
  private _option3: string | undefined;
  private _option4: string | undefined;
  private _nextMode: string;
  private _currentSuggestionNumber: number;
  private _allSuggestions: [];
  public static _i: AvatarObj | undefined;
  unlockedRewards: unlockedRewardsInfo[];

  currentCourse: Course;
  currentChapter: Chapter;
  currentLesson: Lesson | undefined;
  currentLessonSuggestionIndex: number;
  currentRecommendedLessonIndex: number = 0;
  weeklyProgressGoal: number = 60;
  weeklyTimeSpent: {} = { min: 0, sec: 0 };
  weeklyPlayedLesson: number = 0;
  wrongAttempts: number = 0;
  // gamifyTimespentMessage = "Play ' x1 ' to win your daily reward";
  gamifyTimespentMessage =
    "Playing for just ' x1 ' every week helps you do better in school and get ready for more learning!";

  private constructor() {}

  public static getInstance(): AvatarObj {
    if (!this._i) {
      this._i = new AvatarObj();
    }
    return this._i;
  }

  public static destroyInstance() {
    if (this._i) {
      this._i = undefined;
    }
  }

  public get mode(): any {
    return this._mode;
  }
  public set mode(value: any) {
    this._mode = value;
  }

  public get message(): string | undefined {
    return this._message;
  }
  public set message(value: string | undefined) {
    this._message = value;
  }
  public get imageSrc(): string {
    return this._imageSrc;
  }
  public set imageSrc(value: string) {
    this._imageSrc = value;
  }
  public get audioSrc(): string | undefined {
    return this._audioSrc;
  }
  public set audioSrc(value: string | undefined) {
    this._avatarAnimation = value;
  }
  public get avatarAnimation(): string | undefined {
    return this._avatarAnimation;
  }
  public set avatarAnimation(value: string | undefined) {
    this._avatarAnimation = value;
  }
  public get yesAnimation(): string | undefined {
    return this._yesAnimation;
  }
  public set yesAnimation(value: string | undefined) {
    this._yesAnimation = value;
  }
  public get noAnimation(): string | undefined {
    return this._noAnimation;
  }
  public set noAnimation(value: string | undefined) {
    this._noAnimation = value;
  }
  public get nextMode(): string {
    return this._nextMode;
  }
  public set nextMode(value: string) {
    this._nextMode = value;
  }
  public get questionType(): string | undefined {
    return this._questionType;
  }
  public set questionType(value: string | undefined) {
    this._questionType = value;
  }
  public get answer(): string | undefined {
    return this._answer;
  }
  public set answer(value: string | undefined) {
    this._answer = value;
  }
  public get option1(): string | undefined {
    return this._option1;
  }
  public set option1(value: string | undefined) {
    this._option1 = value;
  }
  public get option2(): string | undefined {
    return this._option2;
  }
  public set option2(value: string | undefined) {
    this._option2 = value;
  }
  public get option3(): string | undefined {
    return this._option3;
  }
  public set option3(value: string | undefined) {
    this._option3 = value;
  }
  public get option4(): string | undefined {
    return this._option4;
  }
  public set option4(value: string | undefined) {
    this._option4 = value;
  }
  public get currentSuggestionNumber(): number {
    return this._currentSuggestionNumber;
  }
  public set currentSuggestionNumber(value: number) {
    this._currentSuggestionNumber = value;
  }

  public get allSuggestions(): [] {
    return this._allSuggestions;
  }
  public set allSuggestions(value: []) {
    this._allSuggestions = value;
  }

  suggestionConstant = () => {
    const currentStudent = Util.getCurrentStudent();
    return currentStudent?.docId + "-" + CURRENT_AVATAR_SUGGESTION_NO;
  };

  public getCurrentSuggestionNo() {
    let tempCurrentSugNo = Number(
      localStorage.getItem(this.suggestionConstant())
    );
    this._currentSuggestionNumber = tempCurrentSugNo;

    return tempCurrentSugNo;
  }

  public async loadAvatarData() {
    try {
      const showDailyProgress = localStorage.getItem(SHOW_DAILY_PROGRESS_FLAG);
      if (this.unlockedRewards && this.unlockedRewards?.length > 0) {
        this.mode = AvatarModes.collectReward;
        this.avatarAnimation = "Success";
        return;
      } else if (showDailyProgress === "true") {
        if (this.weeklyTimeSpent["min"] * 60 < this.weeklyProgressGoal * 60) {
          await this.loadAvatarWeeklyProgressData();
          return;
        }

        if (this.weeklyTimeSpent["min"] * 60 >= this.weeklyProgressGoal * 60) {
          localStorage.setItem(SHOW_DAILY_PROGRESS_FLAG, "false");
          const isCurrentWeeklyStickerUnlocked =
            await Util.unlockWeeklySticker();

          if (isCurrentWeeklyStickerUnlocked) {
            if (this.unlockedRewards && this.unlockedRewards?.length > 0) {
              this.mode = AvatarModes.collectReward;
              this.avatarAnimation = "Success";
              return;
            }
          }
        }
      }
      if (!this._allSuggestions) {
        if (!this._currentSuggestionNumber) {
          this._currentSuggestionNumber = 0;
        }
        const path = "assets/animation/avatarSugguestions.json";
        // localStorage.getItem("avatarSuggestionJsonLocation") ||
        // "assets/animation/avatarSugguestions.json";

        // let response = await fetch(path);
        let response;
        // try {
        //   response = await Filesystem.readFile({
        //     path: path,
        //   });
        //   let suggesstionJson = await response.data;
        //   console.log("Avatar Sugguestion Json ", suggesstionJson);

        //   console.log(
        //     "Avatar suggesstionJson.data ",
        //     suggesstionJson,
        //     JSON.parse(suggesstionJson).data
        //   );

        //   this._allSuggestions = JSON.parse(suggesstionJson).data;
        // } catch (error) {
        //   console.log("await Filesystem.readFile({ failed");

        response = await fetch(path);
        let suggesstionJson = await response.json();

        this._allSuggestions = suggesstionJson.data;
        // }
      }

      const currentAvatarSuggestionNoFromLocal = this.getCurrentSuggestionNo();

      let currentSuggestionInJson =
        this._allSuggestions[currentAvatarSuggestionNoFromLocal];
      this._mode = AvatarModes[currentSuggestionInJson[0]];
      this._message = currentSuggestionInJson[1];
      this._imageSrc = currentSuggestionInJson[2];
      this._audioSrc = currentSuggestionInJson[3];
      this._avatarAnimation = currentSuggestionInJson[4];
      this._yesAnimation = currentSuggestionInJson[5];
      this._noAnimation = currentSuggestionInJson[6];
      this._questionType = currentSuggestionInJson[7];
      this._answer = currentSuggestionInJson[8];
      this._option1 = currentSuggestionInJson[9];
      this._option2 = currentSuggestionInJson[10];
      this._option3 = currentSuggestionInJson[11];
      this._option4 = currentSuggestionInJson[12];
    } catch (error) {
      console.log("Failed to load Avatar Data", error);
    }
  }

  public async loadAvatarNextSuggestion() {
    if (this._currentSuggestionNumber === this._allSuggestions.length - 1) {
      this._currentSuggestionNumber = 0;
      localStorage.setItem(
        this.suggestionConstant(),
        this._currentSuggestionNumber.toString()
      );
    } else {
      this.currentSuggestionNumber++;
      localStorage.setItem(
        this.suggestionConstant(),
        this._currentSuggestionNumber.toString()
      );
    }
    let currentSuggestionInJson =
      this._allSuggestions[this._currentSuggestionNumber];
    this._mode = AvatarModes[currentSuggestionInJson[0]];
    this._message = currentSuggestionInJson[1];
    this._imageSrc = currentSuggestionInJson[2];
    this._audioSrc = currentSuggestionInJson[3];
    this._avatarAnimation = currentSuggestionInJson[4];
    this._yesAnimation = currentSuggestionInJson[5];
    this._noAnimation = currentSuggestionInJson[6];
    this._questionType = currentSuggestionInJson[7];
    this._answer = currentSuggestionInJson[8];
    this._option1 = currentSuggestionInJson[9];
    this._option2 = currentSuggestionInJson[10];
    this._option3 = currentSuggestionInJson[11];
    this._option4 = currentSuggestionInJson[12];
  }

  public async loadAvatarWeeklyProgressData() {
    try {
      const currentStudent = await Util.getCurrentStudent();
      if (!currentStudent) {
        return;
      }

      const api = ServiceConfig.getI().apiHandler;
      const studentProfile = await api.getStudentResult(currentStudent.docId);

      let weeKlyProgressData: LeaderboardInfo | undefined;

      if (studentProfile?.classes != undefined) {
        weeKlyProgressData = await api.getLeaderboardResults(
          studentProfile?.classes[0],
          LeaderboardDropdownList.WEEKLY
        );
      } else {
        weeKlyProgressData =
          await api.getLeaderboardStudentResultFromB2CCollection(
            currentStudent.docId
          );
      }

      if (!weeKlyProgressData) {
        this.weeklyTimeSpent = { min: 0, sec: 0 };
        this.weeklyPlayedLesson = 0;
        this._mode = AvatarModes.ShowWeeklyProgress;
        return;
      }
      let weeklyData = weeKlyProgressData.weekly;
      if (!weeklyData) {
        this.weeklyTimeSpent = { min: 0, sec: 0 };
        this.weeklyPlayedLesson = 0;
        this._mode = AvatarModes.ShowWeeklyProgress;
        return;
      }

      for (let i = 0; i < weeklyData.length; i++) {
        const element = weeklyData[i];
        if (currentStudent.docId == element.userId) {
          let finalProgressTimespent = element.timeSpent;
          let computeMinutes = Math.floor(finalProgressTimespent / 60);
          let computeSec = finalProgressTimespent % 60;
          if (
            this.weeklyTimeSpent["min"] * 60 + this.weeklyTimeSpent["sec"] <=
            computeMinutes * 60 + computeSec
          ) {
            this.weeklyTimeSpent["min"] = computeMinutes;
            this.weeklyTimeSpent["sec"] = computeSec;
            this.weeklyPlayedLesson = element.lessonsPlayed;
          }

          if (element.timeSpent >= this.weeklyProgressGoal * 60) {
            localStorage.setItem(SHOW_DAILY_PROGRESS_FLAG, "false");
            return;
          }
          this.message = t(this.gamifyTimespentMessage).replace(
            "x1",
            computeMinutes.toString() + " min and " + computeSec + " sec"
          );
          // this._mode = AvatarModes.ShowWeeklyProgress;
        }
      }
      this._mode = AvatarModes.ShowWeeklyProgress;
    } catch (error) {
      console.log("loadAvatarWeeklyProgressData error ", error);
    }
  }
}
