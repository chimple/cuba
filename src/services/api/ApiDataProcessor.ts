import { DBSQLiteValues } from '@capacitor-community/sqlite';
import { lessonChapterInterface } from '../types/ApiDataProcessorTypes';
export default class ApiDataProcessor {
  public static getLessonFromChapterDataProcessor(
    res: DBSQLiteValues | undefined
  ): lessonChapterInterface {
    const data: lessonChapterInterface = {
      lesson: [],
      course: [],
    };
    if (!res || !res.values || res.values.length < 1) return data;
    data.lesson = res.values;
    data.course = res.values.map((val) => JSON.parse(val.course));
    return data;
  }
}
