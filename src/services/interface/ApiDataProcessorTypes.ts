import { TableTypes } from '../../common/constants';

export interface ILessonChapterInterface {
  lesson: TableTypes<'lesson'>[];
  course: TableTypes<'course'>[];
}
