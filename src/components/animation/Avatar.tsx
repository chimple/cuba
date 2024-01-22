import { Filesystem } from "@capacitor/filesystem";
import {
  CURRENT_AVATAR_SUGGESTION_NO,
  LEADERBOARD_REWARD_LIST,
  LeaderboardDropdownList,
  LeaderboardRewardsType,
  SHOW_DAILY_PROGRESS_FLAG,
} from "../../common/constants";
import { Chapter, StudentLessonResult } from "../../common/courseConstants";
import Course from "../../models/course";
import Lesson from "../../models/lesson";
import { Util } from "../../utility/util";
import { ServiceConfig } from "../../services/ServiceConfig";
import { t } from "i18next";

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
  public static i: AvatarObj;
  private _mode: any;
  private _message: string | undefined;
  private _imageSrc: string | undefined;
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
  static _i: AvatarObj;

  currentCourse: Course;
  currentChapter: Chapter;
  currentLesson: Lesson | undefined;
  currentLessonSuggestionIndex: number;
  currentRecommendedLessonIndex: number = 0;
  weeklyProgressGoal: number = 25;
  weeklyTimeSpent: {} = { min: 0, sec: 0 };
  weeklyPlayedLesson: number = 0;
  wrongAttempts: number = 0;
  gamifyTimespentMessage = "Play ' x1 ' to win your weekly reward";
  currentRewardInfo: {
    id: string;
    type: LeaderboardRewardsType;
    image: string;
    name: string;
    leaderboardRewardList: LEADERBOARD_REWARD_LIST;
  };

  private constructor() {}

  public static getInstance(): AvatarObj {
    if (!this._i) {
      this._i = new AvatarObj();
    }
    return this._i;
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
  public get imageSrc(): string | undefined {
    return this._imageSrc;
  }
  public set imageSrc(value: string | undefined) {
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
    console.log(
      "currentStudent?.docId-CURRENT_AVATAR_SUGGESTION_NO",
      currentStudent?.docId + "-" + CURRENT_AVATAR_SUGGESTION_NO
    );

    return currentStudent?.docId + "-" + CURRENT_AVATAR_SUGGESTION_NO;
  };

  public getCurrentSuggestionNo() {
    let tempCurrentSugNo = Number(
      localStorage.getItem(this.suggestionConstant())
    );
    this._currentSuggestionNumber = tempCurrentSugNo;
    console.log("let tempCurrentSugNo =", tempCurrentSugNo);

    return tempCurrentSugNo;
  }

  public async loadAvatarData() {
    try {
      const showDailyProgress = localStorage.getItem(SHOW_DAILY_PROGRESS_FLAG);
      console.log(
        "localStorage.getItem(showDailyProgress) ",
        showDailyProgress
      );
      let unlockedRewards = await Util.getAllUnlockedRewards();
      console.log("if (unlockedRewards) {", unlockedRewards);
      if (unlockedRewards && unlockedRewards?.length > 0) {
        this.mode = AvatarModes.collectReward;
        this.avatarAnimation = "Success";
        this.currentRewardInfo = unlockedRewards[0];
        return;
      } else if (showDailyProgress === "true") {
        console.log(
          "} else if (showDailyProgress === true) {",
          this.weeklyTimeSpent["min"] * 60 < this.weeklyProgressGoal * 60
        );

        if (this.weeklyTimeSpent["min"] * 60 < this.weeklyProgressGoal * 60) {
          await this.loadAvatarWeeklyProgressData();
          return;
        }

        localStorage.setItem(SHOW_DAILY_PROGRESS_FLAG, "false");
        const isCurrentWeeklyStickerUnlocked = await Util.unlockWeeklySticker();
        console.log(
          "const isCurrentWeeklyStickerUnlocked ",
          isCurrentWeeklyStickerUnlocked
        );

        if (isCurrentWeeklyStickerUnlocked) {
          let unlockedSticker = await Util.getAllUnlockedRewards();
          if (unlockedSticker && unlockedSticker?.length > 0) {
            this.mode = AvatarModes.collectReward;
            this.avatarAnimation = "Success";
            this.currentRewardInfo = unlockedSticker[0];
            return;
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
        console.log("Avatar Sugguestion Json ", suggesstionJson);

        console.log(
          "Avatar suggesstionJson.data ",
          suggesstionJson,
          suggesstionJson.data
        );

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
      // this._nextMode = currentSuggestionInJson[13];

      console.log(" AvatarObj in Avatar page ", AvatarObj.getInstance());
    } catch (error) {
      console.log("Failed to load Avatar Data", error);
    }
  }

  public async loadAvatarNextSuggestion() {
    console.log(
      "if (this.currentSuggestionNumber === this.allSuggestions.length) {",
      this._currentSuggestionNumber === this._allSuggestions.length - 1
    );

    if (this._currentSuggestionNumber === this._allSuggestions.length - 1) {
      this._currentSuggestionNumber = 0;
      console.log(
        "resetting the Avatar Suggestions",
        this._currentSuggestionNumber
      );
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
      console.log(
        "Avatar Suggestions incremented",
        this._currentSuggestionNumber
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
    // this._nextMode = currentSuggestionInJson[13];

    console.log(
      " AvatarObj in Avatar page loadAvatarNextSuggestion( ",
      AvatarObj.getInstance()
    );
  }

  public async loadAvatarWeeklyProgressData() {
    try {
      console.log("loadAvatarWeeklyProgressData called ");

      const currentStudent = await Util.getCurrentStudent();
      if (!currentStudent) {
        return;
      }

      const api = ServiceConfig.getI().apiHandler;
      const studentProfile = await api.getStudentResult(currentStudent.docId);
      console.log("const studentProfile", studentProfile);

      if (studentProfile?.classes != undefined) {
        const leaderboardData = await api.getLeaderboardResults(
          studentProfile?.classes[0],
          LeaderboardDropdownList.WEEKLY
        );
        let weeklyData = leaderboardData?.weekly;
        console.log("weeklyReport ", weeklyData);
        if (!weeklyData) {
          // this.message = undefined;
          this.weeklyTimeSpent = { min: 0, sec: 0 };
          this.weeklyPlayedLesson = 0;
          this._mode = AvatarModes.ShowWeeklyProgress;
          return;
        }

        for (let i = 0; i < weeklyData.length; i++) {
          const element = weeklyData[i];
          console.log(
            "currentStudent.docId == element.userId ",
            currentStudent.docId,
            element.userId,
            currentStudent.docId == element.userId
          );

          if (currentStudent.docId == element.userId) {
            console.log(
              "current student result ",
              this.weeklyProgressGoal,
              this.weeklyProgressGoal * 60,
              element.timeSpent,
              this.weeklyProgressGoal * 60 - element.timeSpent
            );
            let finalProgressTimespent = element.timeSpent;
            var computeMinutes = Math.floor(finalProgressTimespent / 60);
            var computeSec = finalProgressTimespent % 60;
            console.log(
              "current student result ",
              // i + 1,
              element.name,
              element.lessonsPlayed,
              "lessons played scores",
              element.score,
              computeMinutes
              // computeMinutes + t("min") + " " + result + " " + t("sec")
            );
            console.log(
              "current computeMinutes ",
              computeMinutes,
              finalProgressTimespent
            );
            this.message = t(this.gamifyTimespentMessage).replace(
              "x1",
              computeMinutes.toString() + " min and " + computeSec + " sec"
            );

            this.weeklyTimeSpent["min"] = computeMinutes;
            this.weeklyTimeSpent["sec"] = computeSec;
            this.weeklyPlayedLesson = element.lessonsPlayed;
            console.log(
              "this.message ",
              this.message,
              this.weeklyPlayedLesson,
              this.weeklyTimeSpent
            );
            // this._mode = AvatarModes.ShowWeeklyProgress;
          }
        }
      } else {
        const b2cResult =
          await api.getLeaderboardStudentResultFromB2CCollection(
            currentStudent.docId
          );
        let weeklyData = b2cResult?.weekly;
        console.log("weeklyReport ", weeklyData);
        if (!weeklyData) {
          // this.message = undefined;
          this.weeklyTimeSpent = { min: 0, sec: 0 };
          this.weeklyPlayedLesson = 0;
          this._mode = AvatarModes.ShowWeeklyProgress;
          return;
        }

        for (let i = 0; i < weeklyData.length; i++) {
          const element = weeklyData[i];
          console.log(
            "currentStudent.docId == element.userId ",
            currentStudent.docId,
            element.userId,
            currentStudent.docId == element.userId
          );

          if (currentStudent.docId == element.userId) {
            console.log(
              "current student result ",
              this.weeklyProgressGoal,
              this.weeklyProgressGoal * 60,
              element.timeSpent,
              this.weeklyProgressGoal * 60 - element.timeSpent
            );
            let finalProgressTimespent = element.timeSpent;
            var computeMinutes = Math.floor(finalProgressTimespent / 60);
            var computeSec = finalProgressTimespent % 60;
            console.log(
              "current student result ",
              // i + 1,
              element.name,
              element.lessonsPlayed,
              "lessons played scores",
              element.score,
              computeMinutes
              // computeMinutes + t("min") + " " + result + " " + t("sec")
            );
            console.log(
              "current computeMinutes ",
              computeMinutes,
              finalProgressTimespent
            );
            // this.message = t(this.gamifyTimespentMessage).replace(
            //   "x1",
            //   computeMinutes.toString() + " min and " + computeSec + " sec"
            // );
            this.weeklyTimeSpent["min"] = computeMinutes;
            this.weeklyTimeSpent["sec"] = computeSec;
            this.weeklyPlayedLesson = element.lessonsPlayed;
            console.log(
              "this.message ",
              this.message,
              this.weeklyPlayedLesson,
              this.weeklyTimeSpent
            );
          }
        }
      }
      this._mode = AvatarModes.ShowWeeklyProgress;
    } catch (error) {
      console.log("loadAvatarWeeklyProgressData error ", error);
    }
  }
}
