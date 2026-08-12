import { TABLES, TableTypes } from '../../../common/constants';
import Course from '../../../models/Course';
import Lesson from '../../../models/Lesson';
import logger from '../../../utility/logger';
import { SqliteApiSchoolReferenceData } from './SqliteApi.school.referenceData';

export class SqliteApiAssignmentCourseLookups extends SqliteApiSchoolReferenceData {
  [key: string]: any;
  async getAllLessonsForCourse(
    courseId: string,
  ): Promise<TableTypes<'lesson'>[]> {
    await this.ensureInitialized();
    const query = `
    SELECT l.* FROM ${TABLES.Chapter} as c
    JOIN ${TABLES.ChapterLesson} cl ON cl.chapter_id = c.id
    JOIN ${TABLES.Lesson} l ON l.id = cl.lesson_id
    WHERE c.course_id = '${courseId}'
    `;
    const res = await this._db?.query(query);
    return res?.values ?? [];
  }

  getLessonFromCourse(
    course: Course,
    lessonId: string,
  ): Promise<Lesson | undefined> {
    throw new Error('Method not implemented.');
  }

  async getLessonFromChapter(
    chapterId: string,
    lessonId: string,
  ): Promise<{
    lesson: TableTypes<'lesson'>[];
    course: TableTypes<'course'>[];
  }> {
    await this.ensureInitialized();
    const data: {
      lesson: TableTypes<'lesson'>[];
      course: TableTypes<'course'>[];
    } = {
      lesson: [],
      course: [],
    };
    const query = `
    SELECT l.*,JSON_OBJECT(
          'id',co.id,
          'code',co.code,
          'color',co.color,
          'created_at',co.created_at,
          'curriculum_id',co.curriculum_id,
          'description',co.description,
          'grade_id',co.grade_id,
          'image',co.image,
          'is_deleted',co.is_deleted,
          'name',co.name,
          'sort_index',co.sort_index,
          'subject_id',co.subject_id,
          'updated_at',co.updated_at
      ) AS course FROM ${TABLES.Lesson} as l
    JOIN ${TABLES.ChapterLesson} cl ON l.id = cl.lesson_id
    JOIN ${TABLES.Chapter} c ON c.id = cl.chapter_id
    JOIN ${TABLES.Course} co ON co.id = c.course_id
    WHERE c.id='${chapterId}' and c.is_deleted = 0 and l.id = '${lessonId}' and l.is_deleted = 0
    `;
    const res = await this._db?.query(query);
    if (!res || !res.values || res.values.length < 1) return data;
    data.lesson = res.values;
    data.course = res.values.map((val: any) => JSON.parse(val.course));
    return data;
  }

  async getCoursesByGrade(gradeDocId: any): Promise<TableTypes<'course'>[]> {
    await this.ensureInitialized();
    try {
      const gradeCoursesRes = await this._db?.query(
        `SELECT * FROM ${TABLES.Course} WHERE grade_id = "${gradeDocId}" AND is_deleted = 0`,
      );

      const puzzleCoursesRes = await this._db?.query(
        `SELECT * FROM ${TABLES.Course} WHERE name = "Digital Skills"  AND is_deleted = 0`,
      );

      const courses = [
        ...(gradeCoursesRes?.values ?? []),
        ...(puzzleCoursesRes?.values ?? []),
      ];
      return courses;
    } catch (error) {
      logger.error('Error fetching courses by grade:', error);
      return [];
    }
  }

  async getAllCourses(): Promise<TableTypes<'course'>[]> {
    await this.ensureInitialized();
    const res = await this._db?.query(
      `select * from ${TABLES.Course} ORDER BY sort_index ASC`,
    );
    return res?.values ?? [];
  }

  deleteAllUserData(): Promise<void> {
    throw new Error('Method not implemented.');
  }

  async getCoursesFromLesson(
    lessonId: string,
  ): Promise<TableTypes<'course'>[]> {
    await this.ensureInitialized();
    const query = `
    SELECT co.* FROM ${TABLES.Lesson} as l
    JOIN ${TABLES.ChapterLesson} cl ON l.id = cl.lesson_id
    JOIN ${TABLES.Chapter} c ON c.id = cl.chapter_id
    JOIN ${TABLES.Course} co ON co.id = c.course_id
    WHERE l.id = '${lessonId} and l.is_deleted = 0'
    `;
    const res = await this._db?.query(query);
    return res?.values ?? [];
  }

  async assignmentListner(
    studentId: string,
    onDataChange: (assignment: TableTypes<'assignment'> | undefined) => void,
  ) {
    const handleDataChange = async (
      assignmet: TableTypes<'assignment'> | undefined,
    ) => {
      if (assignmet) {
        await this.executeQuery(
          `
          INSERT INTO assignment (id, created_by, starts_at,ends_at,is_class_wise,class_id,school_id,lesson_id,type,created_at,updated_at,is_deleted,chapter_id,course_id, source)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
      `,
          [
            assignmet.id,
            assignmet.created_by,
            assignmet.starts_at,
            assignmet.ends_at,
            assignmet.is_class_wise,
            assignmet.class_id,
            assignmet.school_id,
            assignmet.lesson_id,
            assignmet.type,
            assignmet.created_at,
            assignmet.updated_at,
            assignmet.is_deleted,
            assignmet.chapter_id,
            assignmet.course_id,
            assignmet.source,
          ],
        );
        onDataChange(assignmet);
      }
    };
    return await this._serverApi.assignmentListner(studentId, handleDataChange);
  }

  async removeAssignmentChannel() {
    return await this._serverApi.removeAssignmentChannel();
  }

  async assignmentUserListner(
    studentId: string,
    onDataChange: (
      assignment_user: TableTypes<'assignment_user'> | undefined,
    ) => void,
  ) {
    const handleDataChange = async (
      assignment_user: TableTypes<'assignment_user'> | undefined,
    ) => {
      if (assignment_user) {
        await this.executeQuery(
          `
          INSERT INTO assignment_user (id, assignment_id, user_id, created_at, updated_at, is_deleted)
          VALUES (?, ?, ?, ?, ?, ?);
          `,
          [
            assignment_user.id,
            assignment_user.assignment_id,
            assignment_user.user_id,
            assignment_user.created_at,
            assignment_user.updated_at,
            assignment_user.is_deleted,
          ],
        );
        onDataChange(assignment_user);
      }
    };

    return await this._serverApi.assignmentUserListner(
      studentId,
      handleDataChange,
    );
  }

  async liveQuizListener(
    liveQuizRoomDocId: string,
    onDataChange: (roomDoc: TableTypes<'live_quiz_room'> | undefined) => void,
  ) {
    return await this._serverApi.liveQuizListener(
      liveQuizRoomDocId,
      onDataChange,
    );
  }

  async removeLiveQuizChannel() {
    return await this._serverApi.removeLiveQuizChannel();
  }

  async updateLiveQuiz(
    roomDocId: string,
    studentId: string,
    questionId: string,
    timeSpent: number,
    score: number,
  ): Promise<void> {
    await this._serverApi.updateLiveQuiz(
      roomDocId,
      studentId,
      questionId,
      timeSpent,
      score,
    );
  }

  async joinLiveQuiz(
    assignmentId: string,
    studentId: string,
  ): Promise<string | undefined> {
    const data = await this._serverApi.joinLiveQuiz(assignmentId, studentId);
    return data;
  }

  async getStudentResultsByAssignmentId(assignmentId: string): Promise<
    {
      result_data: TableTypes<'result'>[];
      user_data: TableTypes<'user'>[];
    }[]
  > {
    const res =
      await this._serverApi.getStudentResultsByAssignmentId(assignmentId);
    return res;
  }

  async getAssignmentById(
    id: string,
  ): Promise<TableTypes<'assignment'> | undefined> {
    await this.ensureInitialized();
    const res = await this._db?.query(
      `select * from ${TABLES.Assignment} where id = "${id}"`,
    );
    if (!res || !res.values || res.values.length < 1) return;
    return res.values[0];
  }

  async getAssignmentsByIds(
    ids: string[],
  ): Promise<TableTypes<'assignment'>[]> {
    await this.ensureInitialized();
    if (!ids.length) return [];

    const idslst = ids.map(() => '?').join(', ');
    const query = `
      SELECT *
      FROM ${TABLES.Assignment}
      WHERE id IN (${idslst})
        AND is_deleted = 0;
    `;

    const res = await this._db?.query(query, ids);
    if (!res?.values?.length) return [];

    return res.values as TableTypes<'assignment'>[];
  }
}
