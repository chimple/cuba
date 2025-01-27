import { DBSQLiteValues } from '@capacitor-community/sqlite';
import { ILessonChapterInterface, IClassStudentResultInMap } from '../interface/ApiDataProcessorTypes';

export default class ApiDataProcessor {

  // staudent data map
  public static dataProcessorStudentResultInMap(
    res: DBSQLiteValues | undefined,
  ): IClassStudentResultInMap {
    const data: IClassStudentResultInMap = {
    };

    if (!res || !res.values || res.values.length < 1)  {
      return data
    };
    const resultMap = {};
    for (const data of res.values) {
      resultMap[data.lesson_id] = data;
    }
    return data;
  }

  public static dataProcessorLessonFromChapter(
    res: DBSQLiteValues | undefined
  ): ILessonChapterInterface {
    const data: ILessonChapterInterface = {
      lesson: [],
      course: [],
    };
    if (!res || !res.values || res.values.length < 1) return data;
    data.lesson = res.values;
    data.course = res.values.map((val) => JSON.parse(val.course));
    return data;
  }

}
