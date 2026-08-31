import {
  CHIMPLE_MATHS,
  COURSES,
  MUTATE_TYPES,
  TABLES,
  TableTypes,
} from '../../../common/constants';
import Course from '../../../models/Course';
import { v4 as uuidv4 } from 'uuid';
import { SqliteApiResultsStudentProfiles } from './SqliteApi.results.studentProfiles';

export class SqliteApiResultsCourseSelection extends SqliteApiResultsStudentProfiles {
  [key: string]: any;
  async updateSchoolCourseSelection(
    schoolId: string,
    selectedCourseIds: string[],
  ): Promise<void> {
    await this.ensureInitialized();
    const currentDate = new Date().toISOString();

    for (let idx = 0; idx < selectedCourseIds.length; idx++) {
      const courseId = selectedCourseIds[idx];
      const isLast = idx === selectedCourseIds.length - 1; // ✅ last index check

      // Check if the course is already assigned to the school
      const isExist = await this._db?.query(
        `SELECT * FROM school_course WHERE school_id = ? AND course_id = ?;`,
        [schoolId, courseId],
      );

      if (!isExist || !isExist.values || isExist.values.length < 1) {
        // Case 1: Course is not assigned, so we insert it
        const newId = uuidv4();
        const newSchoolCourseEntry = {
          id: newId,
          school_id: schoolId,
          course_id: courseId,
          created_at: currentDate,
          updated_at: currentDate,
          is_deleted: false,
        };

        await this.executeQuery(
          `INSERT INTO school_course (id, school_id, course_id, created_at, updated_at, is_deleted)
       VALUES (?, ?, ?, ?, ?, ?);`,
          [
            newSchoolCourseEntry.id,
            newSchoolCourseEntry.school_id,
            newSchoolCourseEntry.course_id,
            newSchoolCourseEntry.created_at,
            newSchoolCourseEntry.updated_at,
            newSchoolCourseEntry.is_deleted,
          ],
        );

        // If not last index → isLast = false, otherwise true
        this.updatePushChanges(
          TABLES.SchoolCourse,
          MUTATE_TYPES.INSERT,
          newSchoolCourseEntry,
        );
      } else {
        // Case 2: Course is already assigned
        const existingEntry = isExist.values[0];

        if (existingEntry.is_deleted) {
          // Case 2a: Course was marked as deleted, reactivate it
          await this.executeQuery(
            `UPDATE school_course SET is_deleted = 0, updated_at = ? WHERE id = ?;`,
            [currentDate, existingEntry.id],
          );

          this.updatePushChanges(TABLES.SchoolCourse, MUTATE_TYPES.UPDATE, {
            id: existingEntry.id,
            is_deleted: false,
            updated_at: currentDate,
          });
        } else {
          // Case 2b: Course is already active, update the updated_at field
          await this.executeQuery(
            `UPDATE school_course SET updated_at = ? WHERE id = ?;`,
            [currentDate, existingEntry.id],
          );

          this.updatePushChanges(TABLES.SchoolCourse, MUTATE_TYPES.UPDATE, {
            id: existingEntry.id,
            updated_at: currentDate,
          });
        }
      }
    }
  }

  async updateClassCourseSelection(
    classId: string,
    selectedCourseIds: string[],
  ): Promise<void> {
    await this.ensureInitialized();
    const currentDate = new Date().toISOString();
    for (let idx = 0; idx < selectedCourseIds.length; idx++) {
      const courseId = selectedCourseIds[idx];
      const isLast = idx === selectedCourseIds.length - 1; // ✅ last item check

      // Check if the course is already assigned to the class
      const isExist = await this._db?.query(
        `SELECT * FROM class_course WHERE class_id = ? AND course_id = ?;`,
        [classId, courseId],
      );

      if (!isExist || !isExist.values || isExist.values.length < 1) {
        // Case 1: Course is not assigned, so we insert it
        const newId = uuidv4();
        const newClassCourseEntry = {
          id: newId,
          class_id: classId,
          course_id: courseId,
          created_at: currentDate,
          updated_at: currentDate,
          is_deleted: false,
        };

        await this.executeQuery(
          `INSERT INTO class_course (id, class_id, course_id, created_at, updated_at, is_deleted)
       VALUES (?, ?, ?, ?, ?, ?);`,
          [
            newClassCourseEntry.id,
            newClassCourseEntry.class_id,
            newClassCourseEntry.course_id,
            newClassCourseEntry.created_at,
            newClassCourseEntry.updated_at,
            newClassCourseEntry.is_deleted,
          ],
        );

        // Insert notification — pass isLast
        this.updatePushChanges(
          TABLES.ClassCourse,
          MUTATE_TYPES.INSERT,
          newClassCourseEntry,
        );
      } else {
        // Case 2: Course is already assigned
        const existingEntry = isExist.values[0];

        if (existingEntry.is_deleted) {
          // Case 2a: Reactivate deleted course
          await this.executeQuery(
            `UPDATE class_course SET is_deleted = 0, updated_at = ? WHERE id = ?;`,
            [currentDate, existingEntry.id],
          );

          this.updatePushChanges(TABLES.ClassCourse, MUTATE_TYPES.UPDATE, {
            id: existingEntry.id,
            is_deleted: false,
            updated_at: currentDate,
          });
        } else {
          // Case 2b: Course already active, just update timestamp
          await this.executeQuery(
            `UPDATE class_course SET updated_at = ? WHERE id = ?;`,
            [currentDate, existingEntry.id],
          );

          this.updatePushChanges(TABLES.ClassCourse, MUTATE_TYPES.UPDATE, {
            id: existingEntry.id,
            updated_at: currentDate,
          });
        }
      }
    }
  }

  async getSubject(id: string): Promise<TableTypes<'subject'> | undefined> {
    await this.ensureInitialized();
    const res = await this._db?.query(
      `select * from ${TABLES.Subject} where id = "${id}"`,
    );
    if (!res || !res.values || res.values.length < 1) return;
    return res.values[0];
  }

  async getCourse(id: string): Promise<TableTypes<'course'> | undefined> {
    await this.ensureInitialized();
    const res = await this._db?.query(
      `select * from ${TABLES.Course} where id = "${id}" and is_deleted = 0`,
    );
    if (!res || !res.values || res.values.length < 1) return;
    return res.values[0];
  }

  async resolveMathCourseByLanguage(
    languageDocId?: string | null,
  ): Promise<TableTypes<'course'> | undefined> {
    const englishMathCourse = await this.getCourse(CHIMPLE_MATHS);
    if (!englishMathCourse?.subject_id) return englishMathCourse;

    if (!languageDocId) return englishMathCourse;

    const language = await this.getLanguageWithId(languageDocId);
    const languageCode = (language?.code ?? '').toLowerCase();
    if (!languageCode || languageCode === COURSES.ENGLISH) {
      return englishMathCourse;
    }

    const mathCode = `maths-${languageCode}`;
    const res = await this._db?.query(
      `
      SELECT *
      FROM ${TABLES.Course}
      WHERE subject_id = ?
        AND code = ?
        AND is_deleted = 0
      `,
      [englishMathCourse.subject_id, mathCode],
    );

    const matchingCourse =
      (res?.values ?? []).find(
        (course: TableTypes<'course'>) =>
          course.curriculum_id === englishMathCourse.curriculum_id &&
          course.grade_id === englishMathCourse.grade_id,
      ) ?? res?.values?.[0];

    return matchingCourse ?? englishMathCourse;
  }

  async getCourses(courseIds: string[]): Promise<TableTypes<'course'>[]> {
    await this.ensureInitialized();
    if (!courseIds || courseIds.length === 0) {
      return [];
    }

    // create placeholders (?, ?, ?) based on number of courseIds
    const placeholders = courseIds.map(() => '?').join(',');

    const query = `
      SELECT *
      FROM ${TABLES.Course}
      WHERE id IN (${placeholders})
        AND is_deleted = 0
    `;

    const res = await this._db?.query(query, courseIds);
    return res?.values ?? [];
  }
}
