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
  RESULT_STATUS,
  REWARD_LEARNING_PATH,
  REWARD_LESSON,
  SOURCE,
  TABLES,
  TableTypes,
} from '../../../common/constants';
import { RoleType } from '../../../interface/modelInterfaces';
import logger from '../../../utility/logger';
import { Util } from '../../../utility/util';
import { SupabaseApiCourse } from './SupabaseApi.course';

type StudentProgressRowWithLesson = TableTypes<'result'> & {
  lesson?: {
    name?: string;
    chapter_lesson?:
      | {
          chapter?: {
            id?: string;
            name?: string;
            course_id?: string;
          } | null;
        }[]
      | null;
  } | null;
};

export interface SupabaseApiResults {
  [key: string]: any;
}
export class SupabaseApiResults extends SupabaseApiCourse {
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
    isImediateSync?: boolean,
    isHomework?: boolean,
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
    activities_scores?: string | null,
    user_id?: string | null,
    status?: RESULT_STATUS | null,
    source?: SOURCE | null,
  ): Promise<TableTypes<'result'>> {
    if (!this.supabase) return {} as TableTypes<'result'>;

    const resultId = uuidv4();
    const now = new Date().toISOString();

    const newResult: TableTypes<'result'> = {
      id: resultId,
      assignment_id: assignmentId ?? null,
      correct_moves: correctMoves,
      lesson_id: lessonId,
      school_id: schoolId ?? null,
      score,
      student_id: student.id,
      time_spent: timeSpent,
      wrong_moves: wrongMoves,
      created_at: now,
      updated_at: now,
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

    const { error: insertError } = await this.supabase
      .from('result')
      .insert(newResult);

    if (insertError) {
      logger.error('Error inserting result:', insertError);
      return {} as TableTypes<'result'>;
    }

    // ⭐ reward update
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

    // Calculate earned stars
    let starsEarned = 0;
    if (score > 25) starsEarned++;
    if (score > 50) starsEarned++;
    if (score > 75) starsEarned++;

    const totalStars = Util.bumpLocalStarsForStudent(student.id, starsEarned);

    const updateData: any = { stars: totalStars };
    if (newReward) updateData.reward = JSON.stringify(newReward);
    // Update user stars
    const { error: updateError } = await this.supabase
      .from('user')
      .update(updateData)
      .eq('id', student.id);

    if (updateError) {
      logger.error('Error updating student stars:', updateError);
    }

    // Sync local student data
    const updatedStudent = await this.getUserByDocId(student.id);
    if (updatedStudent) {
      Util.setCurrentStudent(updatedStudent);
    }
    // 8️⃣ Log reward event if any
    if (newReward && currentUser) {
      await Util.logEvent(getDailyRewardClaimedEvent(source), {
        user_id: currentUser.id,
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
        score,
        stars_earned: starsEarned,
      });
    }

    return newResult;
  }
  async updateStudent(
    student: TableTypes<'user'>,
    name: string,
    age: number,
    gender: string,
    avatar: string,
    image: string | undefined,
    boardDocId: string | undefined,
    gradeDocId: string | undefined,
    languageDocId: string,
    localeId?: string,
  ): Promise<TableTypes<'user'>> {
    if (!this.supabase) return student;
    const languageChanged = student.language_id !== languageDocId;

    const updatedFields: any = {
      name,
      age,
      gender,
      avatar,
      image: image ?? null,
      curriculum_id: boardDocId,
      grade_id: gradeDocId,
      language_id: languageDocId,
    };

    if (languageChanged) {
      const countryCode = await this.getClientCountryCode();
      const locale = await this.getLocaleByIdOrCode(undefined, countryCode);
      updatedFields.locale_id = locale?.id ?? DEFAULT_LOCALE_ID;
      updatedFields.learning_path = null;
    }

    await this.supabase.from('user').update(updatedFields).eq('id', student.id);
    const updatedStudent = { ...student, ...updatedFields };
    if (languageChanged) {
      localStorage.removeItem(`${LATEST_LEARNING_PATH}:${student.id}`);
      sessionStorage.removeItem(REWARD_LEARNING_PATH);
    }

    const courses =
      gradeDocId && boardDocId
        ? await this.getCourseByUserGradeId(gradeDocId, boardDocId)
        : languageChanged
          ? await this.getDefaultCoursesForLanguage(languageDocId)
          : [];

    if (courses && courses.length > 0) {
      // Batch fetch existing user_course entries for this student and these courses
      const courseIds = courses.map((c) => c.id);
      const { data: existingUserCourses, error } = await this.supabase
        .from('user_course')
        .select('course_id')
        .eq('user_id', student.id)
        .in('course_id', courseIds)
        .eq('is_deleted', false);

      const existingCourseIds = new Set(
        (existingUserCourses ?? []).map((uc) => uc.course_id),
      );

      // Prepare inserts for only missing courses
      const now = new Date().toISOString();
      const inserts = courses
        .filter((c) => !existingCourseIds.has(c.id))
        .map((c) => ({
          id: uuidv4(),
          user_id: student.id,
          course_id: c.id,
          created_at: now,
          updated_at: now,
          is_deleted: false,
        }));

      // Insert all missing user_course entries in one call (if any)
      if (inserts.length > 0) {
        await this.supabase.from('user_course').insert(inserts);
      }
    }

    return updatedStudent;
  }

  private async getDefaultCoursesForLanguage(
    languageDocId?: string | null,
  ): Promise<TableTypes<'course'>[]> {
    const [englishCourse, mathsCourse, digitalSkillsCourse] = await Promise.all(
      [
        this.getCourse(CHIMPLE_ENGLISH),
        this.resolveMathCourseByLanguage(languageDocId),
        this.getCourse(CHIMPLE_DIGITAL_SKILLS),
      ],
    );

    const language = languageDocId
      ? await this.getLanguageWithId(languageDocId)
      : undefined;
    let langCourse: TableTypes<'course'> | undefined;

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

    return [englishCourse, mathsCourse, langCourse, digitalSkillsCourse].filter(
      Boolean,
    ) as TableTypes<'course'>[];
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
    if (!this.supabase) return student;
    const now = new Date().toISOString();
    const updatedFields: any = {
      name,
      age,
      gender,
      avatar,
      image: image ?? null,
      curriculum_id: boardDocId,
      grade_id: gradeDocId,
      language_id: languageDocId,
      student_id: student.student_id ?? null,
      updated_at: now,
    };

    if (student.language_id !== languageDocId) {
      const countryCode = await this.getClientCountryCode();
      const locale = await this.getLocaleByIdOrCode(undefined, countryCode);
      updatedFields.locale_id = locale?.id ?? DEFAULT_LOCALE_ID;
    }

    try {
      // Update user table
      await this.supabase
        .from(TABLES.User)
        .update(updatedFields)
        .eq('id', student.id);
      const updatedStudent = { ...student, ...updatedFields };

      // Get current class_user record (non-deleted)
      const { data: currentClassUser } = await this.supabase
        .from(TABLES.ClassUser)
        .select('id, class_id')
        .eq('user_id', student.id)
        .eq('is_deleted', false)
        .maybeSingle();
      if (currentClassUser?.class_id !== newClassId) {
        // Mark old class_user as deleted
        if (currentClassUser) {
          await this.supabase
            .from(TABLES.ClassUser)
            .update({ is_deleted: true, updated_at: now })
            .eq('id', currentClassUser.id);
        }

        // Insert new class_user
        const newClassUser: TableTypes<TABLES.ClassUser> = {
          id: uuidv4(),
          class_id: newClassId,
          user_id: student.id,
          role: RoleType.STUDENT,
          created_at: now,
          updated_at: now,
          is_deleted: false,
          is_firebase: null,
          is_ops: null,
          ops_created_by: null,
        };

        await this.supabase.from(TABLES.ClassUser).insert(newClassUser);
        await this.addParentToNewClass(newClassId, student.id);
      }

      return updatedStudent;
    } catch (error) {
      logger.error('Error updating student in school mode:', error);
      throw error;
    }
  }
  public async updateUserProfile(
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
    if (!this.supabase) return user;

    const updatedFields: Record<string, any> = {
      name: fullName,
      email,
      phone: phoneNum,
      language_id: languageDocId,
      image: profilePic ?? null,
    };

    if (user.language_id !== languageDocId) {
      const countryCode = await this.getClientCountryCode();
      const locale = await this.getLocaleByIdOrCode(undefined, countryCode);
      updatedFields.locale_id = locale?.id ?? DEFAULT_LOCALE_ID;
    }

    if (options?.age !== undefined) {
      const parsedAge = parseInt(options.age, 10);
      if (!isNaN(parsedAge)) {
        updatedFields.age = parsedAge;
      }
    }

    if (options?.gender !== undefined) {
      updatedFields.gender = options.gender;
    }

    const { error } = await this.supabase
      .from('user')
      .update(updatedFields)
      .eq('id', user.id);

    if (error) {
      logger.error('Error updating user profile:', error);
      throw error;
    }

    return { ...user, ...updatedFields };
  }

  async updateClassCourseSelection(
    classId: string,
    selectedCourseIds: string[],
  ): Promise<void> {
    if (!this.supabase) return;

    const now = new Date().toISOString();

    await Promise.all(
      selectedCourseIds.map(async (courseId) => {
        // Check existing entry
        if (!this.supabase) return;
        const { data: existingEntry, error } = await this.supabase
          .from('class_course')
          .select('*')
          .eq('class_id', classId)
          .eq('course_id', courseId)
          .eq('is_deleted', false)
          .maybeSingle();

        if (error) {
          logger.error('Error fetching class_course:', error);
          throw error;
        }

        if (!existingEntry) {
          // Insert new
          const newEntry = {
            id: uuidv4(),
            class_id: classId,
            course_id: courseId,
            created_at: now,
            updated_at: now,
            is_deleted: false,
          };
          const { error: insertError } = await this.supabase
            .from('class_course')
            .insert(newEntry);

          if (insertError) {
            logger.error('Error inserting class_course:', insertError);
            throw insertError;
          }
        } else if (existingEntry.is_deleted) {
          // Reactivate
          const { error: updateError } = await this.supabase
            .from('class_course')
            .update({ is_deleted: false, updated_at: now })
            .eq('id', existingEntry.id);

          if (updateError) {
            logger.error('Error updating class_course:', updateError);
            throw updateError;
          }
        } else {
          // Update timestamp
          const { error: timestampError } = await this.supabase
            .from('class_course')
            .update({ updated_at: now })
            .eq('id', existingEntry.id);

          if (timestampError) {
            logger.error('Error updating updated_at:', timestampError);
            throw timestampError;
          }
        }
      }),
    );
  }

  async updateSchoolCourseSelection(
    schoolId: string,
    selectedCourseIds: string[],
  ): Promise<void> {
    if (!this.supabase) return;

    const now = new Date().toISOString();

    await Promise.all(
      selectedCourseIds.map(async (courseId) => {
        if (!this.supabase) return;
        const { data: existingEntry, error } = await this.supabase
          .from('school_course')
          .select('id, course_id, is_deleted')
          .eq('school_id', schoolId)
          .eq('course_id', courseId)
          .eq('is_deleted', false)
          .maybeSingle();

        if (error) {
          logger.error('Error fetching school_course:', error);
          throw error;
        }

        if (!existingEntry) {
          // Insert new course assignment
          const newEntry = {
            id: uuidv4(),
            school_id: schoolId,
            course_id: courseId,
            created_at: now,
            updated_at: now,
            is_deleted: false,
          };
          const { error: insertError } = await this.supabase
            .from('school_course')
            .insert(newEntry);

          if (insertError) {
            logger.error('Error inserting school_course:', insertError);
            throw insertError;
          }
        } else if (existingEntry.is_deleted) {
          // Reactivate the deleted entry
          const { error: updateError } = await this.supabase
            .from('school_course')
            .update({ is_deleted: false, updated_at: now })
            .eq('id', existingEntry.id);

          if (updateError) {
            logger.error('Error updating school_course:', updateError);
            throw updateError;
          }
        } else {
          // Update timestamp of existing active entry
          const { error: timestampError } = await this.supabase
            .from('school_course')
            .update({ updated_at: now })
            .eq('id', existingEntry.id);

          if (timestampError) {
            logger.error('Error updating updated_at:', timestampError);
            throw timestampError;
          }
        }
      }),
    );
  }

  async getSubject(id: string): Promise<TableTypes<'subject'> | undefined> {
    if (!this.supabase) return undefined;
    const { data, error } = await this.supabase
      .from('subject')
      .select('*')
      .eq('id', id)
      .eq('is_deleted', false)
      .single();
    if (error) {
      logger.error('Error fetching subject:', error);
      return undefined;
    }
    return data ?? undefined;
  }
  async getCourse(id: string): Promise<TableTypes<'course'> | undefined> {
    if (!this.supabase) return undefined;
    const { data, error } = await this.supabase
      .from('course')
      .select('*')
      .eq('id', id)
      .eq('is_deleted', false)
      .single();
    if (error) {
      logger.error('Error fetching course:', error);
      return undefined;
    }
    return data ?? undefined;
  }

  async resolveMathCourseByLanguage(
    languageDocId?: string | null,
  ): Promise<TableTypes<'course'> | undefined> {
    if (!this.supabase) return undefined;

    const englishMathCourse = await this.getCourse(CHIMPLE_MATHS);
    if (!englishMathCourse?.subject_id) return englishMathCourse;

    if (!languageDocId) return englishMathCourse;

    const language = await this.getLanguageWithId(languageDocId);
    const languageCode = (language?.code ?? '').toLowerCase();
    if (!languageCode || languageCode === COURSES.ENGLISH) {
      return englishMathCourse;
    }

    const { data, error } = await this.supabase
      .from(TABLES.Course)
      .select('*')
      .eq('subject_id', englishMathCourse.subject_id)
      .eq('code', `maths-${languageCode}`)
      .eq('is_deleted', false);

    if (error) {
      logger.error('Error fetching language-specific math course:', error);
      return englishMathCourse;
    }

    const matchingCourse =
      (data ?? []).find(
        (course) =>
          course.curriculum_id === englishMathCourse.curriculum_id &&
          course.grade_id === englishMathCourse.grade_id,
      ) ?? data?.[0];

    return matchingCourse ?? englishMathCourse;
  }
  async getCourses(ids: string[]): Promise<TableTypes<'course'>[]> {
    if (!this.supabase || !ids || ids.length === 0) return [];

    const { data, error } = await this.supabase
      .from('course')
      .select('*')
      .in('id', ids) // fetch all courses in one go
      .eq('is_deleted', false);

    if (error) {
      logger.error('Error fetching courses:', error);
      return [];
    }

    return data ?? [];
  }

  async getStudentResult(
    studentId: string,
    fromCache?: boolean,
  ): Promise<TableTypes<'result'>[]> {
    if (!this.supabase) return [];

    const { data, error } = await this.supabase
      .from('result')
      .select('*')
      .eq('student_id', studentId)
      .eq('is_deleted', false);

    if (error) {
      logger.error('Error fetching student results:', error);
      return [];
    }

    return data ?? [];
  }
  async getStudentProgress(studentId: string): Promise<
    Record<
      string,
      (TableTypes<'result'> & {
        lesson_name?: string;
        chapter_name?: string;
      })[]
    >
  > {
    if (!this.supabase) return {};

    // Use chapter_lesson to join lesson and chapter
    const { data, error } = await this.supabase
      .from('result')
      .select(
        `
      *,
      lesson (
        name,
        chapter_lesson:chapter_lesson!inner(
          chapter (
            id,
            name,
            course_id
          )
        )
      )
    `,
      )
      .eq('student_id', studentId)
      .eq('is_deleted', false);

    if (error) {
      logger.error('Error fetching student progress:', error);
      return {};
    }

    const resultMap: Record<
      string,
      (TableTypes<'result'> & { lesson_name?: string; chapter_name?: string })[]
    > = {};

    if (!data) return resultMap;

    const progressRows = data as StudentProgressRowWithLesson[];
    if (progressRows.length > 0) {
      progressRows.forEach((result) => {
        const lesson = result.lesson;
        const chapter = lesson?.chapter_lesson?.find((chapterLesson) =>
          chapterLesson.chapter?.id
            ? chapterLesson.chapter.id === result.chapter_id ||
              chapterLesson.chapter.course_id === result.course_id
            : false,
        )?.chapter;
        const resultWithNames: TableTypes<'result'> & {
          lesson_name?: string;
          chapter_name?: string;
        } = {
          ...result,
          lesson_name: lesson?.name ?? '',
          chapter_name: chapter?.name ?? '',
        };
        const courseId = result.course_id;
        if (courseId && !resultMap[courseId]) {
          resultMap[courseId] = [];
        }
        if (courseId) {
          resultMap[courseId].push(resultWithNames);
        }
      });
    }
    return resultMap;
  }
  async getStudentResultInMap(
    studentId: string,
  ): Promise<{ [lessonDocId: string]: TableTypes<'result'> }> {
    if (!this.supabase) return {};

    const { data, error } = await this.supabase.rpc(
      'get_latest_results_by_student',
      { student_uuid: studentId },
    );

    if (error || !data) {
      logger.error('RPC failed:', error);
      return {};
    }

    const resultMap: { [lessonId: string]: TableTypes<'result'> } = {};
    for (const row of data) {
      if (row.lesson_id !== null && row.lesson_id !== undefined) {
        resultMap[row.lesson_id] = row;
      }
    }
    return resultMap;
  }
  async hasStudentResult(studentId: string): Promise<boolean> {
    if (!this.supabase) return false;

    try {
      const { classes } = await this.getStudentClassesAndSchools(studentId);
      const classId = this.currentClass?.id ?? classes[0]?.id;

      if (classes.length > 0) {
        if (!classId) {
          logger.warn(
            '[SupabaseApi] Unable to resolve class for linked student result check',
            { studentId },
          );
          return false;
        }

        const { data, error } = await this.supabase
          .from(TABLES.Result)
          .select('id')
          .eq('student_id', studentId)
          .eq('class_id', classId)
          .eq('is_deleted', false)
          .limit(1);

        if (error) {
          logger.error(
            'Error checking linked student result existence:',
            error,
          );
          return false;
        }

        return (data?.length ?? 0) > 0;
      }

      const { data, error } = await this.supabase
        .from(TABLES.Result)
        .select('id')
        .eq('student_id', studentId)
        .eq('is_deleted', false)
        .limit(1);

      if (error) {
        logger.error('Error checking student result existence:', error);
        return false;
      }

      return (data?.length ?? 0) > 0;
    } catch (error) {
      logger.error('Error checking student result', error);
      return true;
    }
  }
}
