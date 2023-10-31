import { Chapter } from "../../common/courseConstants";
import Course from "../../models/course";
import Lesson from "../../models/lesson";
import { AvatarModes } from "./ChimpleAvatarPage";

export class Avatar {
  public static i: Avatar;
  _currentMode: AvatarModes;
  _message: String;
  _allCourses: Course[];
  _currentCourse: Course;
  _currentChapter: Chapter;
  _currentLesson: Lesson | undefined;
  _audioSrc: String;
  _noOfOptions: Number;
  _currentModeResult: boolean;

  private constructor() {}

  public static getInstance(): Avatar {
    if (!Avatar.i) {
      Avatar.i = new Avatar();
    }
    return Avatar.i;
  }
}
