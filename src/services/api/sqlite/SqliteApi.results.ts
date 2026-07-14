import { v4 as uuidv4 } from 'uuid';
import { getDailyRewardClaimedEvent } from '../../../analytics/rewardEvents';
import {
  CHIMPLE_DIGITAL_SKILLS,
  CHIMPLE_ENGLISH,
  CHIMPLE_HINDI,
  CHIMPLE_MATHS,
  COURSES,
  DEFAULT_LOCALE_ID,
  GRADE1_KANNADA,
  GRADE1_MARATHI,
  LATEST_LEARNING_PATH,
  LATEST_STARS,
  MUTATE_TYPES,
  RESULT_STATUS,
  REWARD_LEARNING_PATH,
  REWARD_LESSON,
  SOURCE,
  STUDENT_RESULT,
  TABLES,
  TableTypes,
} from '../../../common/constants';
import { store } from '../../../redux/store';
import logger from '../../../utility/logger';
import { Util } from '../../../utility/util';

import { SqliteApiCourse } from './SqliteApi.course';
export interface SqliteApiResults {
  [key: string]: any;
}
export class SqliteApiResults extends SqliteApiCourse {
  async updateResult(
    student: TableTypes<'user'>,
    courseId: string | undefined,
    lessonId: string,
    score: number,
    correctMoves: number,
    wrongMoves: number,
    timeSpent: number,
    assignmentId: string | undefined,
    chapterId: string,
    classId: string | undefined,
    schoolId: string | undefined,
    isImediateSync: boolean = false,
    isHomework: boolean = false,
    skill_id?: string | undefined,
    skill_ability?: number | undefined,
    outcome_id?: string | undefined,
    outcome_ability?: number | undefined,
    competency_id?: string | undefined,
    competency_ability?: number | undefined,
    domain_id?: string | undefined,
    domain_ability?: number | undefined,
    subject_id?: string | undefined,
    subject_ability?: number | undefined,
    activities_scores?: string | undefined,
    user_id?: string | undefined,
    status?: RESULT_STATUS | null,
    source?: SOURCE | null,
  ): Promise<TableTypes<'result'>> {
    let resultId = uuidv4();
    let isDuplicate = true;
    while (isDuplicate) {
      const check = await this.executeQuery(
        `SELECT id FROM result WHERE id = ? LIMIT 1`,
        [resultId],
      );
      if (!check?.values || check.values.length === 0) {
        isDuplicate = false;
      } else {
        resultId = uuidv4(); // now this won't throw error
      }
    }
    const newResult: TableTypes<'result'> = {
      id: resultId,
      assignment_id: assignmentId ?? null,
      correct_moves: correctMoves,
      lesson_id: lessonId,
      school_id: schoolId ?? null,
      score: score,
      student_id: student.id,
      time_spent: timeSpent,
      wrong_moves: wrongMoves,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      is_deleted: false,
      chapter_id: chapterId,
      course_id: courseId ?? null,
      class_id: classId ?? null,
      firebase_id: null,
      is_firebase: null,
      skill_id: skill_id ?? null,
      skill_ability: skill_ability ?? null,
      outcome_id: outcome_id ?? null,
      outcome_ability: outcome_ability ?? null,
      competency_id: competency_id ?? null,
      competency_ability: competency_ability ?? null,
      domain_id: domain_id ?? null,
      domain_ability: domain_ability ?? null,
      subject_id: subject_id ?? null,
      subject_ability: subject_ability ?? null,
      activities_scores: activities_scores ?? null,
      user_id: user_id ?? null,
      status: (status ?? null) as TableTypes<'result'>['status'],
      source: source ?? null,
    };
    await this.executeQuery(
      `
    INSERT INTO result (id, assignment_id, correct_moves, lesson_id, school_id, score, student_id, time_spent, wrong_moves, created_at, updated_at, is_deleted, course_id, chapter_id , class_id, skill_id, skill_ability, outcome_id, outcome_ability, competency_id, competency_ability, domain_id, domain_ability, subject_id, subject_ability, activities_scores,user_id, status, source)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
  `,
      [
        newResult.id,
        newResult.assignment_id,
        newResult.correct_moves,
        newResult.lesson_id,
        newResult.school_id,
        newResult.score,
        newResult.student_id,
        newResult.time_spent,
        newResult.wrong_moves,
        newResult.created_at,
        newResult.updated_at,
        newResult.is_deleted,
        newResult.course_id,
        newResult.chapter_id,
        newResult.class_id,
        newResult.skill_id,
        newResult.skill_ability,
        newResult.outcome_id,
        newResult.outcome_ability,
        newResult.competency_id,
        newResult.competency_ability,
        newResult.domain_id,
        newResult.domain_ability,
        newResult.subject_id,
        newResult.subject_ability,
        newResult.activities_scores,
        newResult.user_id,
        newResult.status,
        newResult.source,
      ],
    );
    // ? reward update
    const currentUser = await this.getUserByDocId(student.id);
    const rewardLesson = sessionStorage.getItem(REWARD_LESSON);
    let newReward: { reward_id: string; timestamp: string } | null = null;
    let currentUserReward: { reward_id: string; timestamp: string } | null =
      null;

    if (rewardLesson == 'true' && currentUser) {
      sessionStorage.removeItem(REWARD_LESSON);

      const todaysReward = await Util.fetchTodaysReward();
      const todaysTimestamp = new Date().toISOString();

      currentUserReward = currentUser.reward
        ? JSON.parse(currentUser.reward as string)
        : null;

      if (todaysReward) {
        const alreadyGiven =
          currentUserReward &&
          currentUserReward.reward_id === todaysReward.id &&
          new Date(currentUserReward.timestamp).toISOString().split('T')[0] ===
            todaysTimestamp.split('T')[0];

        if (!alreadyGiven) {
          newReward = {
            reward_id: todaysReward.id,
            timestamp: todaysTimestamp,
          };
        }
      }
    }
    const lesson = await this.getLesson(lessonId);

    const isAssessment = lesson?.plugin_type === 'lido_assessment';

    let starsEarned = 0;
    if (isAssessment) {
      const assessmentKey = `assessment_star_state_${student.id}_${lessonId}`;
      const awarded = sessionStorage.getItem(assessmentKey) === 'true';
      if (!awarded) {
        starsEarned = 3;
        sessionStorage.setItem(assessmentKey, 'true');
      }
    } else {
      if (score > 25) starsEarned++;
      if (score > 50) starsEarned++;
      if (score > 75) starsEarned++;
    }

    if (starsEarned > 0) {
      const latestStarsKey = LATEST_STARS(student.id);
      const currentLocalStars = parseInt(
        localStorage.getItem(latestStarsKey) || '0',
      );
      localStorage.setItem(
        latestStarsKey,
        (currentLocalStars + starsEarned).toString(),
      );
    }
    let query = `UPDATE ${TABLES.User} SET `;
    let params: any[] = [];

    if (newReward !== null) {
      query += `reward = ?, `;
      params.push(JSON.stringify(newReward));
    }
    // Fetch fresh value only for star calculation
    const latestUserForStars = await this.getUserByDocId(student.id);
    const totalStars = (latestUserForStars?.stars || 0) + starsEarned;
    const latestLocalStarsForStudent = parseInt(
      localStorage.getItem(LATEST_STARS(student.id)) || '0',
    );
    const finalStarsToSet = Math.max(totalStars, latestLocalStarsForStudent);
    query += `stars =  ? WHERE id = ?;`;
    params.push(finalStarsToSet, student.id);

    await this.executeQuery(query, params);

    const updatedStudent = await this.getUserByDocId(student.id);
    if (updatedStudent) {
      updatedStudent.language_id = student.language_id;
      Util.setCurrentStudent(updatedStudent);
      Util.setLocalStarsForStudent(
        updatedStudent.id,
        updatedStudent.stars || 0,
      );
    }
    this.updatePushChanges(TABLES.Result, MUTATE_TYPES.INSERT, newResult);
    const pushData: any = {
      id: student.id,
      stars: updatedStudent?.stars,
    };
    if (newReward !== null && currentUser) {
      let userId: string = 'anonymous';
      try {
        const data = store.getState()?.auth?.user;
        if (!data || !data.id)
          throw new Error('User data or ID is missing in the store');
        userId = data?.id ?? 'anonymous';
      } catch (error) {
        logger.error('Failed to get user from redux store:', error);
      }
      pushData.reward = JSON.stringify(newReward);
      await Util.logEvent(getDailyRewardClaimedEvent(source), {
        user_id: userId,
        student_id: currentUser.id,
        reward_id: newReward.reward_id,
        prev_reward_id: currentUserReward?.reward_id ?? null,
        timestamp: newReward.timestamp,
        source: source ?? null,
        course_id: courseId ?? null,
        chapter_id: chapterId,
        lesson_id: lessonId,
        assignment_id: assignmentId ?? null,
        class_id: classId ?? null,
        school_id: schoolId ?? null,
        score: score,
        stars_earned: starsEarned,
      });
    }
    this.updatePushChanges(TABLES.User, MUTATE_TYPES.UPDATE, pushData);

    try {
      const studentResultStr = sessionStorage.getItem(STUDENT_RESULT);
      const studentResultObj = studentResultStr
        ? JSON.parse(studentResultStr)
        : {};
      studentResultObj[student.id] = true;
      sessionStorage.setItem(STUDENT_RESULT, JSON.stringify(studentResultObj));
    } catch (e) {
      logger.error('Failed to set studentResult in sessionStorage', e);
    }

    return newResult;
  }

  async updateUserProfile(
    user: TableTypes<'user'>,
    fullName: string,
    email: string,
    phoneNum: string,
    languageDocId: string,
    profilePic: string | undefined,
    options?: {
      age?: string;
      gender?: string;
    },
  ): Promise<TableTypes<'user'>> {
    const updateUserProfileQuery = `
      UPDATE "user"
      SET
        name = ?,
        email = ?,
        phone = ?,
        language_id = ?,
        image = ?
      WHERE id = ?;
    `;

    await this.executeQuery(updateUserProfileQuery, [
      fullName,
      email,
      phoneNum,
      languageDocId,
      profilePic ?? null,
      user.id,
    ]);

    const updatedUser: TableTypes<'user'> = {
      ...user,
      name: fullName,
      email: email,
      phone: phoneNum,
      language_id: languageDocId,
      image: profilePic ?? null,
    };

    // Push changes for synchronization
    this.updatePushChanges(TABLES.User, MUTATE_TYPES.UPDATE, {
      name: fullName,
      email: email,
      phone: phoneNum,
      language_id: languageDocId,
      image: profilePic ?? null,
      id: user.id,
    });
    return updatedUser;
  }
  protected async assignCoursesToStudent(
    studentId: string,
    gradeDocId?: string,
    boardDocId?: string,
    languageDocId?: string,
  ) {
    const now = new Date().toISOString();
    let coursesToAdd: TableTypes<'course'>[] = [];

    // Grade + Board based courses
    if (gradeDocId && boardDocId) {
      coursesToAdd = await this.getCourseByUserGradeId(gradeDocId, boardDocId);
    }
    // Fallback default courses
    else {
      const englishCourse = await this.getCourse(CHIMPLE_ENGLISH);
      const mathsCourse = await this.resolveMathCourseByLanguage(languageDocId);
      const digitalSkillsCourse = await this.getCourse(CHIMPLE_DIGITAL_SKILLS);

      let langCourse: TableTypes<'course'> | undefined;

      if (languageDocId) {
        const language = await this.getLanguageWithId(languageDocId);

        if (language && language.code !== COURSES.ENGLISH) {
          const thirdLanguageCourseMap: Record<string, string> = {
            hi: CHIMPLE_HINDI,
            kn: GRADE1_KANNADA,
            mr: GRADE1_MARATHI,
          };

          const courseId = thirdLanguageCourseMap[language.code ?? ''];
          if (courseId) {
            langCourse = await this.getCourse(courseId);
          }
        }
      }

      coursesToAdd = [
        englishCourse,
        mathsCourse,
        langCourse,
        digitalSkillsCourse,
      ].filter(Boolean) as TableTypes<'course'>[];
    }

    // Insert only if not exists
    for (let idx = 0; idx < coursesToAdd.length; idx++) {
      const course = coursesToAdd[idx];
      // Prevent duplicates
      const result = await this.executeQuery(
        `
        SELECT COUNT(*) as count
        FROM user_course
        WHERE user_id = ?
          AND course_id = ?
          AND is_deleted = false;
      `,
        [studentId, course.id],
      );

      const count = result?.values?.[0]?.count ?? 0;
      if (count > 0) continue;

      const newUserCourse: TableTypes<'user_course'> = {
        id: uuidv4(),
        user_id: studentId,
        course_id: course.id,
        created_at: now,
        updated_at: now,
        is_deleted: false,
        is_firebase: null,
      };

      await this.executeQuery(
        `
        INSERT INTO user_course (id, user_id, course_id)
        VALUES (?, ?, ?);
      `,
        [newUserCourse.id, newUserCourse.user_id, newUserCourse.course_id],
      );

      this.updatePushChanges(
        TABLES.UserCourse,
        MUTATE_TYPES.INSERT,
        newUserCourse,
      );
    }
  }
  async updateStudent(
    student: TableTypes<'user'>,
    name: string,
    age: number,
    gender: string,
    avatar: string,
    image: string | undefined,
    boardDocId: string,
    gradeDocId: string,
    languageDocId: string,
  ): Promise<TableTypes<'user'>> {
    const languageChanged = student.language_id !== languageDocId;
    let localeId = student.locale_id;
    if (languageChanged) {
      const countryCode = await this.getClientCountryCode();
      const locale = await this.getLocaleByIdOrCode(undefined, countryCode);
      localeId = locale?.id ?? DEFAULT_LOCALE_ID;
    }
    const now = new Date().toISOString();

    const updateUserQuery = `
    UPDATE "user"
    SET
      name = ?,
      age = ?,
      gender = ?,
      avatar = ?,
      image = ?,
      curriculum_id = ?,
      grade_id = ?,
      language_id = ?,
      locale_id = ?,
      updated_at = ?
      ${languageChanged ? ', learning_path = ?' : ''}
    WHERE id = ?;
  `;
    const params = [
      name,
      age,
      gender,
      avatar,
      image ?? null,
      boardDocId ?? null,
      gradeDocId ?? null,
      languageDocId,
      localeId,
      now,
    ];
    if (languageChanged) {
      params.push(null);
    }
    params.push(student.id);
    await this.executeQuery(updateUserQuery, params);

    const updatedStudent: TableTypes<'user'> = {
      ...student,
      name,
      age,
      gender,
      avatar,
      image: image ?? null,
      curriculum_id: boardDocId ?? null,
      grade_id: gradeDocId ?? null,
      language_id: languageDocId,
      locale_id: localeId,
      updated_at: now,
      ...(languageChanged && { learning_path: null }),
    };

    await this.assignCoursesToStudent(
      student.id,
      gradeDocId,
      boardDocId,
      languageDocId,
    );

    this.updatePushChanges(TABLES.User, MUTATE_TYPES.UPDATE, {
      id: student.id,
      name,
      age,
      gender,
      avatar,
      image: image ?? null,
      curriculum_id: boardDocId,
      grade_id: gradeDocId,
      language_id: languageDocId,
      locale_id: localeId,
      updated_at: now,
      ...(languageChanged && { learning_path: null }),
    });
    if (languageChanged) {
      localStorage.removeItem(`${LATEST_LEARNING_PATH}:${student.id}`);
      sessionStorage.removeItem(REWARD_LEARNING_PATH);
    }
    return updatedStudent;
  }
  async getCurrentClassIdForStudent(studentId: string): Promise<string | null> {
    const query = `
      SELECT class_id
      FROM class_user
      WHERE user_id = ? AND is_deleted = false
      ORDER BY updated_at DESC
      LIMIT 1;
    `;
    const res = await this.executeQuery(query, [studentId]);
    // Check if a result was found
    if (!res || !res.values || res.values.length < 1) {
      return null;
    }
    return res?.values[0];
  }

  async updateStudentFromSchoolMode(
    student: TableTypes<'user'>,
    name: string,
    age: number,
    gender: string,
    avatar: string,
    image: string | undefined,
    boardDocId: string,
    gradeDocId: string,
    languageDocId: string,
    student_id: string,
    newClassId: string,
  ): Promise<TableTypes<'user'>> {
    const languageChanged = student.language_id !== languageDocId;
    let localeId = student.locale_id;

    if (languageChanged) {
      const countryCode = await this.getClientCountryCode();
      const locale = await this.getLocaleByIdOrCode(undefined, countryCode);
      localeId = locale?.id ?? DEFAULT_LOCALE_ID;
    }

    const now = new Date().toISOString();

    const updateUserQuery = `
      UPDATE "user"
      SET
        name = ?,
        age = ?,
        gender = ?,
        avatar = ?,
        image = ?,
        curriculum_id = ?,
        grade_id = ?,
        language_id = ?,
        locale_id = ?,
        student_id = ?,
        updated_at = ?
        ${languageChanged ? ', learning_path = ?' : ''}
      WHERE id = ?;
    `;

    try {
      const params = [
        name,
        age,
        gender,
        avatar,
        image ?? null,
        boardDocId,
        gradeDocId,
        languageDocId,
        localeId,
        student_id,
        now,
      ];

      if (languageChanged) {
        params.push(JSON.stringify([])); // keep your existing logic
      }

      params.push(student.id);

      await this.executeQuery(updateUserQuery, params);

      const updatedStudent: TableTypes<'user'> = {
        ...student,
        name,
        age,
        gender,
        avatar,
        image: image ?? null,
        curriculum_id: boardDocId,
        grade_id: gradeDocId,
        language_id: languageDocId,
        student_id,
        locale_id: localeId,
        updated_at: now,
      };

      if (languageChanged) {
        updatedStudent.learning_path = JSON.stringify([]);
      }

      this.updatePushChanges(TABLES.User, MUTATE_TYPES.UPDATE, {
        name,
        age,
        gender,
        avatar,
        image: image ?? null,
        curriculum_id: boardDocId,
        grade_id: gradeDocId,
        language_id: languageDocId,
        student_id: student_id,
        locale_id: localeId,
        updated_at: now,
        ...(languageChanged && { learning_path: JSON.stringify([]) }),
        id: student.id,
      });
      // Check if the class has changed
      const currentClassIdQuery = `
        SELECT class_id FROM class_user
        WHERE user_id = ? AND is_deleted = 0 AND role = 'student'
        LIMIT 1
      `;

      const currentClassRes = await this.executeQuery(currentClassIdQuery, [
        student.id,
      ]);

      const currentClassId = currentClassRes?.values?.[0]?.class_id;

      if (currentClassId !== newClassId) {
        // Update class_user table to set previous record as deleted
        const currentClassUserId = `
          SELECT id FROM class_user
          WHERE user_id = ? AND class_id = ? AND is_deleted = 0
        `;

        const data = await this.executeQuery(currentClassUserId, [
          student.id,
          currentClassId,
        ]);

        const deleteOldClassUserQuery = `
          UPDATE class_user
          SET is_deleted = 1, updated_at = ?
          WHERE id = ? AND is_deleted = 0;
        `;

        await this.executeQuery(deleteOldClassUserQuery, [
          now,
          data?.values?.[0]?.id,
        ]);
        // Push changes for the update (marking the old class_user as deleted)
        this.updatePushChanges(TABLES.ClassUser, MUTATE_TYPES.UPDATE, {
          id: data?.values?.[0]?.id,
          is_deleted: true,
          updated_at: now,
        });
        // Create new class_user entry
        const newClassUserId = uuidv4();
        const newClassUser: TableTypes<'class_user'> = {
          id: newClassUserId,
          class_id: newClassId,
          user_id: student.id,
          role: 'student',
          created_at: now,
          updated_at: now,
          is_deleted: false,
          is_firebase: null,
          is_ops: null,
          ops_created_by: null,
        };
        await this.executeQuery(
          `
            INSERT INTO class_user (id, class_id, user_id, role, created_at, updated_at, is_deleted)
            VALUES (?, ?, ?, ?, ?, ?, ?);
            `,
          [
            newClassUser.id,
            newClassUser.class_id,
            newClassUser.user_id,
            newClassUser.role,
            newClassUser.created_at,
            newClassUser.updated_at,
            newClassUser.is_deleted,
          ],
        );
        this.updatePushChanges(
          TABLES.ClassUser,
          MUTATE_TYPES.INSERT,
          newClassUser,
        );
        await this._serverApi.addParentToNewClass(newClassId, student.id);
      }

      return updatedStudent;
    } catch (error) {
      logger.error('Error updating student:', error);
      throw error; // Rethrow error after logging
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
