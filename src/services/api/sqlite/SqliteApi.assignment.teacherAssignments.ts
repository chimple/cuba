import { MUTATE_TYPES, TABLES, TableTypes } from '../../../common/constants';
import { RoleType } from '../../../interface/modelInterfaces';
import logger from '../../../utility/logger';
import { v4 as uuidv4 } from 'uuid';
import { SqliteApiAssignmentRecommendations } from './SqliteApi.assignment.recommendations';

export class SqliteApiAssignmentTeacherAssignments extends SqliteApiAssignmentRecommendations {
  [key: string]: any;
  async getTeachersForClass(
    classId: string,
  ): Promise<TableTypes<'user'>[] | undefined> {
    await this.ensureInitialized();
    const query = `
    SELECT user.*
    FROM ${TABLES.ClassUser} AS cu
    JOIN ${TABLES.User} AS user ON cu.user_id= user.id
    WHERE cu.class_id = "${classId}" and cu.role = '${RoleType.TEACHER}' and cu.is_deleted = false;
  `;
    const res = await this._db?.query(query);
    return res?.values ?? [];
  }

  async getUserByEmail(email: string): Promise<TableTypes<'user'> | undefined> {
    return this._serverApi.getUserByEmail(email);
  }

  async getUserByPhoneNumber(
    phone: string,
  ): Promise<TableTypes<'user'> | undefined> {
    return this._serverApi.getUserByPhoneNumber(phone);
  }

  async addTeacherToClass(
    schoolId: string,
    classId: string,
    user: TableTypes<'user'>,
  ): Promise<void> {
    const classUserId = uuidv4();
    const classUser = {
      id: classUserId,
      class_id: classId,
      user_id: user.id,
      role: RoleType.TEACHER,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      is_deleted: false,
    };

    await this.executeQuery(
      `
    INSERT INTO class_user (id, class_id, user_id, role, created_at, updated_at, is_deleted)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    `,
      [
        classUser.id,
        classUser.class_id,
        classUser.user_id,
        classUser.role,
        classUser.created_at,
        classUser.updated_at,
        classUser.is_deleted,
      ],
    );

    await this.updatePushChanges(
      TABLES.ClassUser,
      MUTATE_TYPES.INSERT,
      classUser,
    );
    // var user_doc = await this._serverApi.getUserByDocId(userId);
    if (user) {
      await this.executeQuery(
        `
        INSERT INTO user (id, name, age, gender, avatar, image, curriculum_id, language_id,created_at,updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT (id) DO NOTHING;
        `,
        [
          user.id,
          user.name,
          user.age,
          user.gender,
          user.avatar,
          user.image,
          user.curriculum_id,
          user.language_id,
          user.created_at,
          user.updated_at,
        ],
      );
    }
  }

  async checkUserIsManagerOrDirector(
    schoolId: string,
    userId: string,
  ): Promise<boolean> {
    // Check if user is PROGRAM_MANAGER, OPERATIONAL_DIRECTOR, or FIELD_COORDINATOR in school_user
    const result = await this.executeQuery(
      `SELECT * FROM school_user
     WHERE school_id = ? AND user_id = ?
     AND role IN (?, ?, ?)
     AND is_deleted = false`,
      [
        schoolId,
        userId,
        RoleType.PROGRAM_MANAGER,
        RoleType.OPERATIONAL_DIRECTOR,
        RoleType.FIELD_COORDINATOR,
      ],
    );

    if (result?.values && result.values.length > 0) {
      return true;
    }
    return false;
  }

  async checkUserExistInSchool(
    schoolId: string,
    userId: string,
  ): Promise<boolean> {
    // Check if the user is present in school_user but not as a parent
    const schoolUserResult = await this.executeQuery(
      `SELECT * FROM school_user
     WHERE school_id = ? AND user_id = ?
     AND role != ?
     AND is_deleted = false`,
      [schoolId, userId, RoleType.PARENT],
    );

    if (schoolUserResult?.values && schoolUserResult.values.length > 0) {
      return true;
    }

    // Step 2: Fetch all classes for the given school
    const classResult = await this.executeQuery(
      `SELECT id FROM class
     WHERE school_id = ?
     AND is_deleted = false`,
      [schoolId],
    );

    if (!classResult?.values || classResult.values.length === 0) {
      return false;
    }
    const classIds = classResult.values.map((row: { id: string }) => row.id);
    // Step 3: Check if the user is a teacher in any of these classes
    const placeholders = classIds.map(() => '?').join(', ');
    const teacherResult = await this.executeQuery(
      `SELECT * FROM class_user
       WHERE class_id IN (${placeholders})
       AND user_id = ?
       AND role = ?
       AND is_deleted = false`,
      [...classIds, userId, RoleType.TEACHER],
    );

    if (teacherResult?.values && teacherResult.values.length > 0) {
      return true;
    }
    return false;
  }

  async checkTeacherExistInClass(
    schoolId: string,
    classId: string,
    userId: string,
  ): Promise<boolean> {
    // Check if the user is present in school_user but not as a parent
    const schoolUserResult = await this.executeQuery(
      `SELECT * FROM school_user
     WHERE school_id = ? AND user_id = ?
     AND role != ?
     AND is_deleted = false`,
      [schoolId, userId, RoleType.PARENT],
    );

    if (schoolUserResult?.values && schoolUserResult.values.length > 0) {
      return true;
    }
    // Step 2: Check if the user is a teacher in this class
    const result = await this.executeQuery(
      `SELECT * FROM class_user
      WHERE class_id = ?
      AND user_id = ?
      AND role = ?
      AND is_deleted = false`,
      [classId, userId, RoleType.TEACHER],
    );
    return !!(result?.values && result.values.length > 0);
  }

  async getAssignmentsByAssignerAndClass(
    userId: string,
    classId: string,
    startDate: string,
    endDate: string,
  ): Promise<{
    classWiseAssignments: TableTypes<'assignment'>[];
    individualAssignments: TableTypes<'assignment'>[];
  }> {
    await this.ensureInitialized();
    const query = `
      SELECT *
      FROM ${TABLES.Assignment}
      WHERE created_by = '${userId}'
        AND (class_id = '${classId}')
        AND created_at >= '${startDate}T00:00:00'
        AND created_at <= '${endDate}T23:59:59.999'
      ORDER BY is_class_wise DESC, created_at ASC;
    `;
    const res = await this._db?.query(query);
    const assignments = res?.values ?? [];

    const classWiseAssignments = assignments.filter(
      (assignment: any) => assignment.is_class_wise === 1,
    );
    const individualAssignments = assignments.filter(
      (assignment: any) => assignment.is_class_wise === 0,
    );

    return { classWiseAssignments, individualAssignments };
  }

  async createAssignment(
    student_list: string[],
    userId: string,
    starts_at: string,
    ends_at: string,
    is_class_wise: boolean,
    class_id: string,
    school_id: string,
    lesson_id: string,
    chapter_id: string,
    course_id: string,
    type: string,
    batch_id: string,
    source: string | null,
    created_at?: string,
    set_number?: number,
  ): Promise<void> {
    const assignmentUUid = uuidv4();
    const timestamp = new Date().toISOString(); // Cache timestamp for reuse

    try {
      // Insert into assignment table
      await this.executeQuery(
        `INSERT INTO assignment
          (id, created_by, starts_at, ends_at, is_class_wise, class_id, school_id, lesson_id, type, created_at, updated_at, is_deleted, chapter_id, course_id, source, batch_id)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
        [
          assignmentUUid,
          userId,
          starts_at,
          ends_at,
          is_class_wise,
          class_id,
          school_id,
          lesson_id,
          type,
          created_at ?? timestamp,
          timestamp,
          false,
          chapter_id,
          course_id,
          source ?? null,
          batch_id,
        ],
      );

      // Prepare assignment data for push changes
      const assignment_data: TableTypes<'assignment'> = {
        id: assignmentUUid,
        created_by: userId,
        starts_at: starts_at,
        ends_at: ends_at,
        is_class_wise: is_class_wise,
        class_id: class_id,
        school_id: school_id,
        lesson_id: lesson_id,
        type: type,
        created_at: created_at ?? timestamp,
        updated_at: timestamp,
        is_deleted: false,
        chapter_id: chapter_id,
        course_id: course_id,
        batch_id: batch_id ?? null,
        source: source ?? null,
        firebase_id: null,
        is_firebase: null,
        set_number: null,
      };

      this.updatePushChanges(
        TABLES.Assignment,
        MUTATE_TYPES.INSERT,
        assignment_data,
      );

      // If the assignment is not class-wide, assign it to individual students

      if (!is_class_wise && student_list.length > 0) {
        for (const student of student_list) {
          const assignment_user_UUid = uuidv4();
          const newAssignmentUser: TableTypes<'assignment_user'> = {
            assignment_id: assignmentUUid,
            created_at: new Date().toISOString(),
            id: assignment_user_UUid,
            is_deleted: false,
            updated_at: new Date().toISOString(),
            user_id: student,
            is_firebase: null,
          };
          await this.executeQuery(
            `
          INSERT INTO assignment_user (id, assignment_id, user_id,created_at,updated_at,is_deleted)
        VALUES (?, ?, ?, ?, ?, ?);
      `,
            [
              assignment_user_UUid,
              assignmentUUid,
              student,
              new Date().toISOString(),
              new Date().toISOString(),
              false,
            ],
          );
          this.updatePushChanges(
            TABLES.Assignment_user,
            MUTATE_TYPES.INSERT,
            newAssignmentUser,
          );
        }
      }
    } catch (error) {
      logger.error('Error in createAssignment:', error);
    }
  }
}
