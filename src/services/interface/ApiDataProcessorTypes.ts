import { TableTypes, } from '../../common/constants';

export interface IClassStudentResultInMap {
  [lessonDocId: string]: TableTypes<"result">;
}

export interface ILessonChapterInterface {
  lesson: TableTypes<'lesson'>[];
  course: TableTypes<'course'>[];
}

