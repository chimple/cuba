import {
  COURSES,
  LIVE_QUIZ,
  MUTATE_TYPES,
  TABLES,
  TableTypes,
} from '../../../common/constants';
import { StudentLessonResult } from '../../../common/courseConstants';
import { AvatarObj } from '../../../components/animation/Avatar';
import Course from '../../../models/Course';
import { v4 as uuidv4 } from 'uuid';
import { SqliteApiCourseCatalog } from './SqliteApi.course.catalog';

export class SqliteApiCourseGradeOptions extends SqliteApiCourseCatalog {
  [key: string]: any;
  async getDifferentGradesForCourse(course: TableTypes<'course'>): Promise<{
    grades: TableTypes<'grade'>[];
    courses: TableTypes<'course'>[];
  }> {
    await this.ensureInitialized();
    const query = `
    SELECT c.*,
    JSON_OBJECT(
      'id',g.id,
      'name',g.name,
      'image',g.image,
      'description',g.description,
      'sort_index',g.sort_index,
      'created_at',g.created_at,
      'updated_at',g.updated_at,
      'is_deleted',g.is_deleted
    ) AS grade
    FROM ${TABLES.Course} c
    JOIN ${TABLES.Grade} g ON c.grade_id = g.id
    WHERE c.subject_id = "${course.subject_id}"
    AND c.curriculum_id = "${course.curriculum_id}";

  `;
    const res = await this._db?.query(query);
    const gradesById = new Map<string, TableTypes<'grade'>>();
    const coursesByGradeId = new Map<string, TableTypes<'course'>[]>();
    for (const data of res?.values ?? []) {
      const grade = JSON.parse(data.grade);
      delete data.grade;
      const courseDoc = data;
      gradesById.set(grade.id, grade);
      const currentGradeCourses = coursesByGradeId.get(grade.id) ?? [];
      currentGradeCourses.push(courseDoc);
      coursesByGradeId.set(grade.id, currentGradeCourses);
    }

    if (course.grade_id) {
      const currentGradeCourses = coursesByGradeId.get(course.grade_id) ?? [];
      if (!currentGradeCourses.some((_course) => _course.id === course.id)) {
        currentGradeCourses.push(course);
        coursesByGradeId.set(course.grade_id, currentGradeCourses);
      }

      if (!gradesById.has(course.grade_id)) {
        const courseGrade = await this.getGradeById(course.grade_id);
        if (courseGrade) {
          gradesById.set(course.grade_id, courseGrade);
        }
      }
    }

    const currentCourseCode = course.code?.toLowerCase() ?? '';
    const isMathCourse =
      currentCourseCode === COURSES.MATHS ||
      currentCourseCode.startsWith(`${COURSES.MATHS}-`);

    const pickCourseForGrade = (gradeId: string) => {
      const gradeCourses = coursesByGradeId.get(gradeId) ?? [];
      if (gradeCourses.length === 0) return undefined;

      if (course.grade_id === gradeId) {
        const selectedCourse = gradeCourses.find(
          (_course) => _course.id === course.id,
        );
        if (selectedCourse) return selectedCourse;
      }

      if (isMathCourse) {
        const matchingMathVariant = gradeCourses.find(
          (_course) => _course.code?.toLowerCase() === currentCourseCode,
        );
        if (matchingMathVariant) return matchingMathVariant;

        const regularMathCourse = gradeCourses.find(
          (_course) => _course.code?.toLowerCase() === COURSES.MATHS,
        );
        if (regularMathCourse) return regularMathCourse;
      }

      return gradeCourses[0];
    };

    const grades = Array.from(gradesById.values()).sort((a, b) => {
      //Number.MAX_SAFE_INTEGER is using when sortIndex is not found GRADES (i.e it gives default value)
      const sortIndexA = a.sort_index || Number.MAX_SAFE_INTEGER;
      const sortIndexB = b.sort_index || Number.MAX_SAFE_INTEGER;

      return sortIndexA - sortIndexB;
    });
    const gradeMap = {
      grades,
      courses: grades
        .map((grade) => pickCourseForGrade(grade.id))
        .filter(
          (mappedCourse): mappedCourse is TableTypes<'course'> =>
            !!mappedCourse,
        ),
    };
    return gradeMap as any;
  }

  getAvatarInfo(): Promise<AvatarObj | undefined> {
    throw new Error('Method not implemented.');
  }

  getLessonResultsForStudent(
    studentId: string,
  ): Promise<Map<string, StudentLessonResult> | undefined> {
    throw new Error('Method not implemented.');
  }

  async getLiveQuizLessons(
    classId: string,
    studentId: string,
  ): Promise<TableTypes<'assignment'>[]> {
    await this.ensureInitialized();
    const now = new Date().toISOString();
    const query = `
    SELECT a.*
    FROM ${TABLES.Assignment} a
    LEFT JOIN ${TABLES.Assignment_user} au ON a.id = au.assignment_id
    LEFT JOIN result r ON a.id = r.assignment_id AND r.student_id = "${studentId}"
   WHERE a.class_id = '${classId}' and a.type = "${LIVE_QUIZ}" and (a.is_class_wise = 1 or au.user_id = "${studentId}") and r.assignment_id IS NULL
    and a.starts_at <= '${now}'
    and a.ends_at > '${now}'
    order by a.created_at desc;
    `;
    const res = await this._db?.query(query);
    if (!res || !res.values || res.values.length < 1) return [];
    return res.values;
  }

  async getLiveQuizRoomDoc(
    liveQuizRoomDocId: string,
  ): Promise<TableTypes<'live_quiz_room'>> {
    const roomData =
      await this._serverApi.getLiveQuizRoomDoc(liveQuizRoomDocId);
    return roomData;
  }

  async updateFavoriteLesson(
    studentId: string,
    lessonId: string,
  ): Promise<TableTypes<'favorite_lesson'>> {
    await this.ensureInitialized();
    const favoriteId = uuidv4();
    var favoriteLesson: TableTypes<'favorite_lesson'>;
    const isExist = await this._db?.query(
      `SELECT * FROM ${TABLES.FavoriteLesson}
       WHERE user_id= '${studentId}' and lesson_id = '${lessonId}';`,
    );
    if (!isExist || !isExist.values || isExist.values.length < 1) {
      favoriteLesson = {
        id: favoriteId,
        lesson_id: lessonId,
        user_id: studentId ?? null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        is_deleted: false,
        is_firebase: false,
      };
      const res = await this.executeQuery(
        `
      INSERT INTO favorite_lesson (id, lesson_id, user_id, created_at, updated_at, is_deleted)
      VALUES (?, ?, ?, ?, ?, ?);
      `,
        [
          favoriteLesson.id,
          favoriteLesson.lesson_id,
          favoriteLesson.user_id,
          favoriteLesson.created_at,
          favoriteLesson.updated_at,
          favoriteLesson.is_deleted,
        ],
      );
      this.updatePushChanges(
        TABLES.FavoriteLesson,
        MUTATE_TYPES.INSERT,
        favoriteLesson,
      );
    } else {
      var liked_lesson = isExist.values[0];
      favoriteLesson = {
        id: liked_lesson.id,
        lesson_id: liked_lesson.lesson_id,
        user_id: liked_lesson.student_id,
        created_at: liked_lesson.created_at,
        updated_at: new Date().toISOString(),
        is_deleted: false,
        is_firebase: false,
      };

      await this.executeQuery(
        `
      UPDATE  favorite_lesson SET updated_at = '${favoriteLesson.updated_at}'
      WHERE id = "${favoriteLesson.id}";
       `,
      );
      this.updatePushChanges(TABLES.FavoriteLesson, MUTATE_TYPES.UPDATE, {
        id: favoriteLesson.id,
        updated_at: favoriteLesson.updated_at,
      });
    }

    return favoriteLesson;
  }
}
