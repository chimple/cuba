import { TableTypes } from '../../common/constants';

export interface lessonChapterInterface {
  lesson: TableTypes<'lesson'>[];
  course: TableTypes<'course'>[];
}
