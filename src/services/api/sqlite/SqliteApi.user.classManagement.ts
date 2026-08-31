import {
  MUTATE_TYPES,
  STUDENT_RESULT,
  TABLES,
  TableTypes,
} from '../../../common/constants';
import { RoleType } from '../../../interface/modelInterfaces';
import logger from '../../../utility/logger';
import { Util } from '../../../utility/util';
import { ServiceConfig } from '../../ServiceConfig';
import { JoinClassInviteLookupResult } from '../ServiceApi';
import { v4 as uuidv4 } from 'uuid';
import { SqliteApiUserSchoolRoles } from './SqliteApi.user.schoolRoles';

export class SqliteApiUserClassManagement extends SqliteApiUserSchoolRoles {
  [key: string]: any;
  async subscribeToClassTopic(): Promise<void> {
    var students: TableTypes<'user'>[] = await this.getParentStudentProfiles();
    for (const student of students) {
      const linkedData = await this.getStudentClassesAndSchools(student.id);
      if (
        !!linkedData &&
        !!linkedData.classes &&
        linkedData.classes.length > 0
      ) {
        Util.subscribeToClassTopic(
          linkedData.classes[0].id,
          linkedData.schools[0].id,
        );
      }
    }
  }

  parseClassName(className: string): { grade: number; section: string } {
    const cleanedName = className.trim();
    if (!cleanedName) {
      return { grade: 0, section: '' };
    }

    let grade = 0;
    let section = '';

    // Pattern 1: Just a number (e.g., "1", "5", "10")
    const numericMatch = cleanedName.match(/^(\d+)$/);
    if (numericMatch) {
      grade = parseInt(numericMatch[1], 10);
      return { grade: isNaN(grade) ? 0 : grade, section: '' };
    }

    // Pattern 2: Number followed by letters or words (e.g., "3A", "5 B")
    const alphanumericMatch = cleanedName.match(/(\d+)\s*(\w+)/i);
    if (alphanumericMatch) {
      grade = parseInt(alphanumericMatch[1], 10);
      section = alphanumericMatch[2];
      return { grade: isNaN(grade) ? 0 : grade, section };
    }

    logger.warn(
      `Could not parse grade from class name: "${cleanedName}". Assigning grade 0.`,
    );
    return { grade: 0, section: cleanedName };
  }

  async getStudentsForClass(classId: string): Promise<TableTypes<'user'>[]> {
    await this.ensureInitialized();
    const query = `
      SELECT user.*
      FROM ${TABLES.ClassUser} AS cu
      JOIN ${TABLES.User} AS user ON cu.user_id = user.id
      WHERE cu.class_id = ?
        AND cu.role = ?
        AND cu.is_deleted = 0
        ORDER BY name ASC ;
    `;
    const res = await this._db?.query(query, [classId, RoleType.STUDENT]);
    return res?.values ?? [];
  }

  async getDataByInviteCode(inviteCode: number): Promise<any> {
    let inviteData = await this._serverApi.getDataByInviteCode(inviteCode);
    return inviteData;
  }

  async getDataByInviteCodeNew(
    inviteCode: number,
  ): Promise<JoinClassInviteLookupResult> {
    logger.warn('Join class lookup requested through SQLite API', {
      file_name: 'SqliteApi.ts',
      function_name: 'getDataByInviteCodeNew',
      inviteCode,
      syncInProgress: this._syncInProgress,
    });
    const { inviteData, classData, schoolData } =
      await this._serverApi.getDataByInviteCodeNew(inviteCode);

    if (!classData) {
      throw new Error('Class data could not be fetched.');
    }

    if (!schoolData) {
      throw new Error('School data could not be fetched.');
    }

    return {
      inviteData,
      classData,
      schoolData,
    };
  }

  async storeJoinClassLookupDataLocally(
    classData: TableTypes<'class'>,
    schoolData: TableTypes<'school'>,
  ): Promise<void> {
    logger.warn('Storing join lookup data in local SQLite', {
      file_name: 'SqliteApi.ts',
      function_name: 'storeJoinClassLookupDataLocally',
      classId: classData.id,
      schoolId: schoolData.id,
    });
    await this.upsertJoinLookupRow(TABLES.School, schoolData);
    await this.upsertJoinLookupRow(TABLES.Class, classData);
    logger.warn('Stored join lookup data in local SQLite successfully', {
      file_name: 'SqliteApi.ts',
      function_name: 'storeJoinClassLookupDataLocally',
      classId: classData.id,
      schoolId: schoolData.id,
    });
  }

  async createClass(
    schoolId: string,
    className: string,
    groupId?: string,
    whatsapp_invite_link?: string,
    gradeId?: string,
    standard?: string,
  ): Promise<TableTypes<'class'>> {
    const _currentUser =
      await ServiceConfig.getI().authHandler.getCurrentUser();
    if (!_currentUser) throw 'User is not Logged in';

    const classId = uuidv4();
    const newClass: TableTypes<'class'> = {
      id: classId,
      name: className,
      image: null,
      school_id: schoolId,
      grade_id: gradeId ?? null,
      group_id: groupId ?? null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),

      is_deleted: false,
      academic_year: null,
      firebase_id: null,
      is_firebase: null,
      is_ops: null,
      ops_created_by: null,
      standard: standard ?? null,
      status: null,
      whatsapp_invite_link: whatsapp_invite_link ?? null,
      migrated_count: 0,
    };

    await this.executeQuery(
      `
      INSERT INTO class (id, name , image, school_id, grade_id, standard, created_at, updated_at, is_deleted, group_id, whatsapp_invite_link)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
      `,
      [
        newClass.id,
        newClass.name,
        newClass.image,
        newClass.school_id,
        newClass.grade_id,
        newClass.standard,
        newClass.created_at,
        newClass.updated_at,
        newClass.is_deleted,
        newClass.group_id,
        newClass.whatsapp_invite_link,
      ],
    );

    await this.updatePushChanges(TABLES.Class, MUTATE_TYPES.INSERT, newClass);
    return newClass;
  }

  async deleteClass(classId: string) {
    await this.ensureInitialized();
    try {
      // Update is_deleted to true for all class_user records where role is teacher
      await this.executeQuery(
        `UPDATE class_user SET is_deleted = 1 WHERE class_id = ? AND role = ?`,
        [classId, RoleType.TEACHER],
      );

      // Retrieve the ids of the affected class_user rows
      const classUserQuery = `
      SELECT id
      FROM ${TABLES.ClassUser}
      WHERE class_id = ? AND role = ? AND is_deleted = 1
    `;
      const classUserRes = await this._db?.query(classUserQuery, [
        classId,
        RoleType.TEACHER,
      ]);

      if (
        classUserRes &&
        classUserRes.values &&
        classUserRes.values.length > 0
      ) {
        for (const row of classUserRes.values) {
          // Push changes for each affected class_user (teachers)
          this.updatePushChanges(TABLES.ClassUser, MUTATE_TYPES.UPDATE, {
            id: row.id,
            is_deleted: true,
          });
        }
      }

      //Update is_deleted to true for all class_course records where class_id matches
      await this.executeQuery(
        `UPDATE class_course SET is_deleted = 1 WHERE class_id = ?`,
        [classId],
      );

      // Retrieve the ids of the affected class_course rows
      const classCourseQuery = `
      SELECT id
      FROM ${TABLES.ClassCourse}
      WHERE class_id = ? AND is_deleted = 1
    `;
      const classCourseRes = await this._db?.query(classCourseQuery, [classId]);

      if (
        classCourseRes &&
        classCourseRes.values &&
        classCourseRes.values.length > 0
      ) {
        for (const row of classCourseRes.values) {
          // Push changes for each affected class_course
          this.updatePushChanges(TABLES.ClassCourse, MUTATE_TYPES.UPDATE, {
            id: row.id,
            is_deleted: true,
          });
        }
      }

      // Update is_deleted to true for the class itself
      await this.executeQuery(
        `UPDATE class SET is_deleted = 1 WHERE id = ? AND is_deleted = 0`,
        [classId],
      );

      // Push changes for the class itself
      this.updatePushChanges(TABLES.Class, MUTATE_TYPES.UPDATE, {
        id: classId,
        is_deleted: true,
      });
    } catch (error) {
      logger.error('Failed to delete class:', error);
      throw error;
    }
  }

  async updateClass(
    classId: string,
    className: string,
    groupId?: string,
    whatsapp_invite_link?: string,
  ) {
    const _currentUser =
      await ServiceConfig.getI().authHandler.getCurrentUser();
    if (!_currentUser) throw 'User is not Logged in';

    let updatedClassQuery = `UPDATE class SET name = "${className}"`;
    if (groupId !== undefined) {
      updatedClassQuery += `, group_id = "${groupId}"`;
    }
    if (whatsapp_invite_link !== undefined) {
      updatedClassQuery += `, whatsapp_invite_link = "${whatsapp_invite_link}"`;
    }
    updatedClassQuery += `, updated_at = "${new Date().toISOString()}"`;
    updatedClassQuery += ` WHERE id = "${classId}";`;

    const res = await this.executeQuery(updatedClassQuery);
    logger.info('🚀 ~ SqliteApi ~ updateClass ~ res:', res);

    // Include group_id in push only if provided
    const updatedData: any = { id: classId, name: className };
    if (groupId !== undefined) updatedData.group_id = groupId;

    this.updatePushChanges(TABLES.Class, MUTATE_TYPES.UPDATE, updatedData);
  }

  async linkStudent(inviteCode: number, studentId: string): Promise<any> {
    logger.warn('Join class link requested through SQLite API', {
      file_name: 'SqliteApi.ts',
      function_name: 'linkStudent',
      inviteCode,
      studentId,
      syncInProgress: this._syncInProgress,
    });

    try {
      const linkData = await this._serverApi.linkStudent(inviteCode, studentId);

      logger.warn('Join class link completed on server API', {
        file_name: 'SqliteApi.ts',
        function_name: 'linkStudent',
        inviteCode,
        studentId,
        responseType: Array.isArray(linkData) ? 'array' : typeof linkData,
        responseCount: Array.isArray(linkData) ? linkData.length : undefined,
      });

      if (Array.isArray(linkData) && linkData.length > 0) {
        for (const row of linkData as TableTypes<'class_user'>[]) {
          await this.upsertJoinLookupRow(TABLES.ClassUser, row);
        }
        logger.warn('Stored returned class_user rows in local SQLite', {
          file_name: 'SqliteApi.ts',
          function_name: 'linkStudent',
          inviteCode,
          studentId,
          rowCount: linkData.length,
        });
      }

      logger.warn('Starting SQLite sync after join class', {
        file_name: 'SqliteApi.ts',
        function_name: 'linkStudent',
        inviteCode,
        studentId,
      });
      await this.syncDbNow(Object.values(TABLES), [
        TABLES.Assignment,
        TABLES.Class,
        TABLES.School,
        TABLES.ClassCourse,
      ]);
      logger.warn('Completed SQLite sync after join class', {
        file_name: 'SqliteApi.ts',
        function_name: 'linkStudent',
        inviteCode,
        studentId,
      });

      try {
        const studentResultStr = sessionStorage.getItem(STUDENT_RESULT);
        const studentResultObj = studentResultStr
          ? JSON.parse(studentResultStr)
          : {};
        studentResultObj[studentId] = false;
        sessionStorage.setItem(
          STUDENT_RESULT,
          JSON.stringify(studentResultObj),
        );
      } catch (e) {
        logger.error('Failed to reset studentResult in sessionStorage', e);
      }

      return linkData;
    } catch (error) {
      logger.warn('Join class link failed through SQLite API', {
        file_name: 'SqliteApi.ts',
        function_name: 'linkStudent',
        inviteCode,
        studentId,
        syncInProgress: this._syncInProgress,
        rawError: error,
      });
      throw error;
    }
  }
}
