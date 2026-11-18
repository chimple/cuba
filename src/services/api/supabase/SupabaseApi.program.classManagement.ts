import { v4 as uuidv4, v5 as uuidv5 } from 'uuid';
import { AVATARS, DEFAULT_LANGUAGE_ID_EN } from '../../../common/constants';
import logger from '../../../utility/logger';
import { SupabaseApiProgramEnrollment } from './SupabaseApi.program.enrollment';
import type {
  OpsStudentProfileMatch,
  OpsStudentProfileSearchResult,
  StudentProfileCreateResult,
} from '../serviceapi/ServiceApi.fieldActivities';
import { normalizeIndianPhone10 } from '../../../ops-console/utils/phoneNormalization';
import {
  DUPLICATE_STUDENT_PROFILE_EMAIL_MESSAGE,
  DUPLICATE_STUDENT_PROFILE_MESSAGE,
  parseStudentProfileContact,
} from '../../../ops-console/utils/studentProfileContact';
import { RoleType } from '../../../interface/modelInterfaces';

type StudentProfileContact = {
  phone: string | null;
  email: string | null;
};

type ParentContactUser = {
  id: string;
  phone: string | null;
  email: string | null;
};

type StudentProfileUser = {
  id: string;
  name: string | null;
  student_id: string | null;
};

// Identical normalized contact and name pairs must collide during concurrent inserts.
const STUDENT_PROFILE_ID_NAMESPACE = '6ba7b811-9dad-11d1-80b4-00c04fd430c8';

// Exact variants use the existing phone index instead of scanning with LIKE.
const getPhoneLookupCandidates = (phone: string): string[] => {
  const firstFive = phone.slice(0, 5);
  const lastFive = phone.slice(5);
  const firstThree = phone.slice(0, 3);
  const middleThree = phone.slice(3, 6);
  const lastFour = phone.slice(6);
  const localFormats = [
    phone,
    firstFive + ' ' + lastFive,
    firstFive + '-' + lastFive,
    firstThree + ' ' + middleThree + ' ' + lastFour,
    firstThree + '-' + middleThree + '-' + lastFour,
    '(' + firstFive + ') ' + lastFive,
    '(' + firstFive + ')' + lastFive,
    '(' + firstThree + ') ' + middleThree + ' ' + lastFour,
  ];
  const candidates = new Set<string>();
  ['', '91', '+91', '0'].forEach((prefix) => {
    localFormats.forEach((localFormat) => {
      candidates.add(prefix + localFormat);
      if (prefix) {
        candidates.add(prefix + ' ' + localFormat);
        candidates.add(prefix + '-' + localFormat);
      }
    });
  });
  return Array.from(candidates);
};

export interface SupabaseApiProgramClassManagement {
  [key: string]: any;
}
export class SupabaseApiProgramClassManagement extends SupabaseApiProgramEnrollment {
  async insertSchoolDetails(
    schoolId: string,
    schoolModel: string,
    locationLink?: string,
    keyContacts?: any,
  ): Promise<void> {
    if (!this.supabase) return;
    const insertPayload: any = {
      model: schoolModel,
      updated_at: new Date().toISOString(),
    };

    if (locationLink !== undefined && locationLink !== null) {
      insertPayload.location_link = locationLink;
    }

    if (keyContacts) {
      insertPayload.key_contacts = JSON.stringify(keyContacts);
    }

    const { error } = await this.supabase
      .from('school')
      .update(insertPayload)
      .eq('id', schoolId)
      .eq('is_deleted', false);

    if (error) {
      logger.error('Error inserting school details:', error);
    }
  }
  async updateClassCourses(
    classId: string,
    selectedCourseIds: string[],
  ): Promise<void> {
    if (!this.supabase) return;

    const now = new Date().toISOString();

    // Delete all existing course for this class
    const { error: deleteError } = await this.supabase
      .from('class_course')
      .update({ is_deleted: true, updated_at: now })
      .eq('class_id', classId)
      .eq('is_deleted', false);

    if (deleteError) {
      logger.error('Error removing old class_course entries:', deleteError);
      throw deleteError;
    }

    // Insert the new course
    if (selectedCourseIds.length > 0) {
      const newEntries = selectedCourseIds.map((courseId) => ({
        id: uuidv4(),
        class_id: classId,
        course_id: courseId,
        created_at: now,
        updated_at: now,
        is_deleted: false,
      }));

      const { error: insertError } = await this.supabase
        .from('class_course')
        .insert(newEntries);

      if (insertError) {
        logger.error('Error inserting new class_course entries:', insertError);
        throw insertError;
      }
    }
  }

  async searchStudentProfilesByContact(
    contact: string,
    classId: string,
  ): Promise<OpsStudentProfileSearchResult> {
    if (!this.supabase) throw new Error('Supabase client is not initialized');
    await this.authorizeStudentProfileClass(classId);
    return this.getProfilesForClass(contact, classId);
  }

  async hasDuplicateStudentProfile(
    name: string,
    contact: string,
    classId: string,
  ): Promise<boolean> {
    if (!this.supabase) throw new Error('Supabase client is not initialized');
    await this.authorizeStudentProfileClass(classId);
    const { students } = await this.getStudentUsersByContact(contact);
    const normalizedName = name.trim().toLowerCase();
    return students.some(
      (student) => student.name?.trim().toLowerCase() === normalizedName,
    );
  }

  async linkExistingStudentToClass(
    studentId: string,
    classId: string,
    contact: string,
  ): Promise<boolean> {
    if (!this.supabase) throw new Error('Supabase client is not initialized');
    await this.authorizeStudentProfileClass(classId);
    const { profiles } = await this.getProfilesForClass(contact, classId);
    const profile = profiles.find((student) => student.id === studentId);
    if (!profile || profile.isInSelectedClass) return false;

    const { data: existingLinks, error: linksError } = await this.supabase
      .from('class_user')
      .select('id, is_deleted')
      .eq('class_id', classId)
      .eq('user_id', studentId)
      .eq('role', RoleType.STUDENT);
    if (linksError) throw linksError;
    if ((existingLinks ?? []).some((link) => !link.is_deleted)) return false;

    const existingIds = new Set((existingLinks ?? []).map((link) => link.id));
    let generation = 0;
    let mappingId = uuidv5(
      'ops-student-class:' + classId + ':' + studentId + ':' + generation,
      classId,
    );
    // Keep prior deleted mappings deleted; use a new ID generation instead.
    while (existingIds.has(mappingId)) {
      generation += 1;
      mappingId = uuidv5(
        'ops-student-class:' + classId + ':' + studentId + ':' + generation,
        classId,
      );
    }

    const now = new Date().toISOString();
    const { error: insertError } = await this.supabase
      .from('class_user')
      .insert({
        id: mappingId,
        class_id: classId,
        user_id: studentId,
        role: RoleType.STUDENT,
        created_at: now,
        updated_at: now,
        is_deleted: false,
      });
    if (insertError) {
      const { data: activeLink, error: activeLinkError } = await this.supabase
        .from('class_user')
        .select('id')
        .eq('class_id', classId)
        .eq('user_id', studentId)
        .eq('role', RoleType.STUDENT)
        .eq('is_deleted', false)
        .limit(1)
        .maybeSingle();
      if (activeLinkError) throw activeLinkError;
      if (activeLink) return false;
      throw insertError;
    }
    return true;
  }

  private async authorizeStudentProfileClass(
    classId: string,
    requestedSchoolId?: string,
  ): Promise<string> {
    const supabase = this.supabase;
    if (!supabase) throw new Error('Supabase client is not initialized');
    if (!classId) throw new Error('A class is required');

    const { data: classRow, error: classError } = await supabase
      .from('class')
      .select('id, school_id')
      .eq('id', classId)
      .eq('is_deleted', false)
      .maybeSingle();
    if (classError) throw classError;
    if (!classRow?.school_id) throw new Error('Class not found');
    if (requestedSchoolId && requestedSchoolId !== classRow.school_id) {
      throw new Error('Class does not belong to this school');
    }

    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError) throw authError;
    const callerId = authData.user?.id;
    if (!callerId) throw new Error('User is not logged in');

    const { data: specialUser, error: specialUserError } = await supabase
      .from('special_users')
      .select('role')
      .eq('user_id', callerId)
      .eq('is_deleted', false)
      .maybeSingle();
    if (specialUserError) throw specialUserError;
    const allowedRoles = [
      RoleType.OPERATIONAL_DIRECTOR,
      RoleType.SUPER_ADMIN,
      RoleType.PROGRAM_MANAGER,
      RoleType.FIELD_COORDINATOR,
    ];
    if (
      !specialUser ||
      !specialUser.role ||
      !allowedRoles.includes(specialUser.role)
    ) {
      throw new Error('You cannot manage this class');
    }
    if (
      specialUser.role === RoleType.SUPER_ADMIN ||
      specialUser.role === RoleType.OPERATIONAL_DIRECTOR
    ) {
      return classRow.school_id;
    }

    const { data: schoolUsers, error: schoolUserError } = await supabase
      .from('school_user')
      .select('id')
      .eq('school_id', classRow.school_id)
      .eq('user_id', callerId)
      .eq('is_deleted', false)
      .not(
        'role',
        'in',
        '("' +
          RoleType.SPONSOR +
          '","' +
          RoleType.PARENT +
          '","' +
          RoleType.STUDENT +
          '")',
      )
      .limit(1);
    if (schoolUserError) throw schoolUserError;
    if ((schoolUsers ?? []).length > 0) return classRow.school_id;

    if (specialUser.role === RoleType.PROGRAM_MANAGER) {
      const { data: school, error: schoolError } = await supabase
        .from('school')
        .select('program_id')
        .eq('id', classRow.school_id)
        .eq('is_deleted', false)
        .maybeSingle();
      if (schoolError) throw schoolError;
      if (school?.program_id) {
        const { data: programUser, error: programUserError } = await supabase
          .from('program_user')
          .select('id')
          .eq('program_id', school.program_id)
          .eq('user', callerId)
          .eq('role', RoleType.PROGRAM_MANAGER)
          .eq('is_deleted', false)
          .limit(1)
          .maybeSingle();
        if (programUserError) throw programUserError;
        if (programUser) return classRow.school_id;
      }
    }

    throw new Error('You cannot manage this class');
  }

  private parseProfileContact(contact: string): StudentProfileContact {
    const parsed = parseStudentProfileContact(contact);
    if (!parsed?.value) {
      throw new Error('Enter a valid phone number or email address');
    }
    return {
      phone: parsed.phone ?? null,
      email: parsed.email ?? null,
    };
  }

  private async getParentUsersByContact(
    contact: StudentProfileContact,
  ): Promise<ParentContactUser[]> {
    const supabase = this.supabase;
    if (!supabase) throw new Error('Supabase client is not initialized');
    const phone = contact.phone ? normalizeIndianPhone10(contact.phone) : null;
    const email = contact.email?.trim().toLowerCase() ?? null;
    const parents: ParentContactUser[] = [];
    if (phone) {
      const { data, error } = await supabase
        .from('user')
        .select('id, phone, email')
        .eq('is_deleted', false)
        .in('phone', getPhoneLookupCandidates(phone));
      if (error) throw error;
      parents.push(
        ...(data ?? []).filter(
          (parent) => normalizeIndianPhone10(parent.phone ?? '') === phone,
        ),
      );
    }
    if (email) {
      const { data, error } = await supabase
        .from('user')
        .select('id, phone, email')
        .eq('is_deleted', false)
        .eq('email', email);
      if (error) throw error;
      parents.push(
        ...(data ?? []).filter(
          (parent) => parent.email?.trim().toLowerCase() === email,
        ),
      );
    }
    return Array.from(
      new Map(parents.map((parent) => [parent.id, parent])).values(),
    );
  }

  private async getStudentUsersByParentIds(
    parentIds: string[],
  ): Promise<{ students: StudentProfileUser[]; profileCount: number }> {
    const supabase = this.supabase;
    if (!supabase) throw new Error('Supabase client is not initialized');
    const normalizedParentIds = Array.from(new Set(parentIds));
    if (normalizedParentIds.length === 0) {
      return { students: [], profileCount: 0 };
    }

    const {
      data: parentLinks,
      count,
      error: parentLinkError,
    } = await supabase
      .from('parent_user')
      .select('student_id', { count: 'exact' })
      .in('parent_id', normalizedParentIds)
      .eq('is_deleted', false);
    if (parentLinkError) throw parentLinkError;
    const profileCount = count ?? parentLinks?.length ?? 0;
    const studentIds = Array.from(
      new Set((parentLinks ?? []).map((link) => link.student_id)),
    );
    if (studentIds.length === 0) return { students: [], profileCount };

    const { data: students, error: studentError } = await supabase
      .from('user')
      .select('id, name, student_id')
      .in('id', studentIds)
      .eq('is_deleted', false);
    if (studentError) throw studentError;
    return { students: students ?? [], profileCount };
  }

  private async getStudentUsersByContact(
    rawContact: string,
  ): Promise<{ students: StudentProfileUser[]; profileCount: number }> {
    const contact = this.parseProfileContact(rawContact);
    const parents = await this.getParentUsersByContact(contact);
    return this.getStudentUsersByParentIds(parents.map((parent) => parent.id));
  }

  private async getProfilesForClass(
    contact: string,
    classId: string,
  ): Promise<OpsStudentProfileSearchResult> {
    const supabase = this.supabase;
    if (!supabase) throw new Error('Supabase client is not initialized');
    const { students, profileCount } =
      await this.getStudentUsersByContact(contact);
    const studentIds = students.map((student) => student.id);
    if (studentIds.length === 0) return { profiles: [], profileCount };

    const { data: links, error: linkError } = await supabase
      .from('class_user')
      .select('user_id, class_id')
      .in('user_id', studentIds)
      .eq('role', RoleType.STUDENT)
      .eq('is_deleted', false);
    if (linkError) throw linkError;
    const classIds = Array.from(
      new Set((links ?? []).map((link) => link.class_id)),
    );
    const activeClassIds = new Set<string>();
    if (classIds.length > 0) {
      const { data: classes, error: classError } = await supabase
        .from('class')
        .select('id')
        .in('id', classIds)
        .eq('is_deleted', false);
      if (classError) throw classError;
      (classes ?? []).forEach((classRow) => activeClassIds.add(classRow.id));
    }

    const linksByStudent = new Map<string, string[]>();
    (links ?? []).forEach((link) => {
      if (!activeClassIds.has(link.class_id)) return;
      const studentLinks = linksByStudent.get(link.user_id) ?? [];
      studentLinks.push(link.class_id);
      linksByStudent.set(link.user_id, studentLinks);
    });

    const profiles = students
      .map((student) => {
        const activeClassLinks = linksByStudent.get(student.id) ?? [];
        return {
          id: student.id,
          name: student.name,
          studentCode: student.student_id,
          isInSelectedClass: activeClassLinks.includes(classId),
          hasOtherClass: activeClassLinks.some((id) => id !== classId),
        };
      })
      .filter((student) => student.isInSelectedClass || !student.hasOtherClass)
      .sort((left, right) => (left.name ?? '').localeCompare(right.name ?? ''))
      .map(({ id, name, studentCode, isInSelectedClass }) => ({
        id,
        name,
        studentCode,
        isInSelectedClass,
      }));

    return { profiles, profileCount };
  }

  private async getOrCreateParentUserId(
    phone: string | undefined,
    email: string | undefined,
    parentName?: string,
  ): Promise<string> {
    const supabase = this.supabase;
    if (!supabase) throw new Error('Supabase client is not initialized');
    const matchingParents = await this.getParentUsersByContact({
      phone: phone ?? null,
      email: email ?? null,
    });
    const parentByPhone = phone
      ? matchingParents.find(
          (parent) => normalizeIndianPhone10(parent.phone) === phone,
        )
      : undefined;
    const parentByEmail = email
      ? matchingParents.find(
          (parent) => parent.email?.trim().toLowerCase() === email,
        )
      : undefined;
    const exactPhone = parentByPhone?.phone ?? phone;
    const exactEmail = parentByEmail?.email ?? email;

    const { data, error } = await supabase.functions.invoke(
      'get_or_create_user',
      {
        body: {
          name: parentName || 'Parent',
          phone: exactPhone,
          email: exactEmail,
        },
      },
    );
    if (error) throw error;
    const parent = data?.user as ParentContactUser | undefined;
    if (!parent?.id) throw new Error('Error creating parent account');

    const phoneMatches =
      phone && normalizeIndianPhone10(parent.phone) === phone;
    const emailMatches = email && parent.email?.trim().toLowerCase() === email;
    if (!phoneMatches && !emailMatches) {
      throw new Error('Parent account does not match the submitted contact');
    }
    return parent.id;
  }

  private async insertStudentProfileUser(
    contact: StudentProfileContact,
    profile: {
      name: string;
      gender: string;
      age: number | null;
      studentCode: string | null;
      languageId: string;
      avatar: string;
      now: string;
    },
  ): Promise<{ studentId: string | null; duplicate: boolean }> {
    const supabase = this.supabase;
    if (!supabase) throw new Error('Supabase client is not initialized');
    const identity = contact.phone
      ? 'phone:' + contact.phone
      : contact.email
        ? 'email:' + contact.email
        : null;
    const normalizedName = profile.name.trim().toLowerCase();

    for (let generation = 0; ; generation += 1) {
      const studentId = identity
        ? uuidv5(
            'ops-student-profile:' +
              identity +
              ':' +
              normalizedName +
              ':' +
              generation,
            STUDENT_PROFILE_ID_NAMESPACE,
          )
        : uuidv4();
      const { error: insertError } = await supabase.from('user').insert({
        id: studentId,
        name: profile.name,
        gender: profile.gender,
        age: profile.age,
        language_id: profile.languageId,
        avatar: profile.avatar,
        created_at: profile.now,
        updated_at: profile.now,
        is_deleted: false,
        student_id: profile.studentCode,
      });
      if (!insertError) return { studentId, duplicate: false };
      if (insertError.code !== '23505' || !identity) {
        throw insertError;
      }

      const { data: existingUser, error: existingUserError } = await supabase
        .from('user')
        .select('id, is_deleted')
        .eq('id', studentId)
        .maybeSingle();
      if (existingUserError) throw existingUserError;
      // A deleted deterministic row is a tombstone, not a profile to reactivate.
      if (existingUser?.is_deleted) continue;
      if (existingUser) return { studentId: null, duplicate: true };
      throw insertError;
    }
  }

  private async rollbackStudentProfile(
    studentId: string,
    parentLinkId: string,
    studentClassLinkId: string,
    parentClassLinkId: string | null,
    now: string,
  ): Promise<void> {
    const supabase = this.supabase;
    if (!supabase) throw new Error('Supabase client is not initialized');
    const relationshipResults = await Promise.all([
      supabase
        .from('class_user')
        .update({ is_deleted: true, updated_at: now })
        .eq('id', studentClassLinkId)
        .eq('is_deleted', false),
      ...(parentClassLinkId
        ? [
            supabase
              .from('class_user')
              .update({ is_deleted: true, updated_at: now })
              .eq('id', parentClassLinkId)
              .eq('is_deleted', false),
          ]
        : []),
      supabase
        .from('parent_user')
        .update({ is_deleted: true, updated_at: now })
        .eq('id', parentLinkId)
        .eq('is_deleted', false),
    ]);
    const { error: userRollbackError } = await supabase
      .from('user')
      .update({ is_deleted: true, updated_at: now })
      .eq('id', studentId)
      .eq('is_deleted', false);
    const rollbackError =
      relationshipResults.find((result) => result.error)?.error ??
      userRollbackError;
    if (rollbackError) throw rollbackError;
  }

  private async ensureParentClassMapping(
    parentId: string,
    classId: string,
    now: string,
  ): Promise<string | null> {
    const supabase = this.supabase;
    if (!supabase) throw new Error('Supabase client is not initialized');
    const { data: links, error: linksError } = await supabase
      .from('class_user')
      .select('id, is_deleted')
      .eq('class_id', classId)
      .eq('user_id', parentId)
      .eq('role', RoleType.PARENT);
    if (linksError) throw linksError;
    if ((links ?? []).some((link) => !link.is_deleted)) return null;

    const existingIds = new Set((links ?? []).map((link) => link.id));
    let generation = 0;
    let mappingId = uuidv5(
      'ops-parent-class:' + classId + ':' + parentId + ':' + generation,
      parentId,
    );
    // Keep prior deleted mappings deleted; use a new ID generation instead.
    while (existingIds.has(mappingId)) {
      generation += 1;
      mappingId = uuidv5(
        'ops-parent-class:' + classId + ':' + parentId + ':' + generation,
        parentId,
      );
    }

    const { error: insertError } = await supabase.from('class_user').insert({
      id: mappingId,
      class_id: classId,
      user_id: parentId,
      role: RoleType.PARENT,
      created_at: now,
      updated_at: now,
      is_deleted: false,
    });
    if (!insertError) return mappingId;

    const { data: activeLink, error: activeLinkError } = await supabase
      .from('class_user')
      .select('id')
      .eq('class_id', classId)
      .eq('user_id', parentId)
      .eq('role', RoleType.PARENT)
      .eq('is_deleted', false)
      .limit(1)
      .maybeSingle();
    if (activeLinkError) throw activeLinkError;
    if (activeLink) return null;
    throw insertError;
  }

  async addStudentWithParentValidation(params: {
    phone?: string;
    name: string;
    gender: string;
    age: string | null;
    classId: string;
    schoolId?: string;
    parentName?: string;
    email?: string;
    studentID?: string;
    atSchool?: boolean;
  }): Promise<StudentProfileCreateResult> {
    if (!this.supabase) {
      return { success: false, message: 'Supabase client is not initialized' };
    }

    const {
      phone,
      name,
      gender,
      age,
      classId,
      schoolId,
      parentName,
      email,
      studentID,
      atSchool,
    } = params;
    const normalizedName = name.trim();
    const normalizedPhone = phone
      ? (normalizeIndianPhone10(phone) ?? undefined)
      : undefined;
    const normalizedEmail = email?.trim().toLowerCase();
    if (phone && !normalizedPhone) {
      return { success: false, message: 'Phone number must be 10 digits.' };
    }
    if (
      normalizedEmail &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.exec(normalizedEmail)
    ) {
      return { success: false, message: 'Please enter a valid email address.' };
    }
    if (
      !normalizedName ||
      (!atSchool && !normalizedPhone && !normalizedEmail)
    ) {
      return {
        success: false,
        message: 'Name and phone number or email are required.',
      };
    }

    try {
      const authorizedSchoolId = await this.authorizeStudentProfileClass(
        classId,
        schoolId,
      );
      const contact: StudentProfileContact = {
        phone: normalizedPhone ?? null,
        email: normalizedEmail ?? null,
      };
      const rawContact = normalizedPhone ?? normalizedEmail;
      if (rawContact) {
        const { students } = await this.getStudentUsersByContact(rawContact);
        const duplicate = students.some(
          (student) =>
            student.name?.trim().toLowerCase() === normalizedName.toLowerCase(),
        );
        if (duplicate) {
          return {
            success: false,
            message: normalizedPhone
              ? DUPLICATE_STUDENT_PROFILE_MESSAGE
              : DUPLICATE_STUDENT_PROFILE_EMAIL_MESSAGE,
          };
        }
      }

      const parentId = rawContact
        ? await this.getOrCreateParentUserId(
            normalizedPhone,
            normalizedEmail,
            parentName,
          )
        : null;
      if (parentId && !atSchool) {
        const { profileCount } = await this.getStudentUsersByParentIds([
          parentId,
        ]);
        if (profileCount >= 3) {
          return {
            success: false,
            message: 'This contact already has 3 profiles.',
          };
        }
      }

      const { data: school, error: schoolError } = await this.supabase
        .from('school')
        .select('language')
        .eq('id', authorizedSchoolId)
        .eq('is_deleted', false)
        .maybeSingle();
      if (schoolError) throw schoolError;

      const now = new Date().toISOString();
      const parsedAge = age === null || age === '' ? NaN : Number(age);
      const { studentId, duplicate: idConflict } =
        await this.insertStudentProfileUser(contact, {
          name: normalizedName,
          gender,
          age: Number.isNaN(parsedAge) ? null : parsedAge,
          studentCode: studentID || null,
          languageId: school?.language ?? DEFAULT_LANGUAGE_ID_EN,
          avatar: AVATARS[Math.floor(Math.random() * AVATARS.length)],
          now,
        });
      if (idConflict || !studentId) {
        return {
          success: false,
          message: normalizedPhone
            ? DUPLICATE_STUDENT_PROFILE_MESSAGE
            : DUPLICATE_STUDENT_PROFILE_EMAIL_MESSAGE,
        };
      }

      const parentLinkId = uuidv4();
      const studentClassLinkId = uuidv4();
      let parentClassLinkId: string | null = null;
      if (parentId) {
        const { error: parentLinkError } = await this.supabase
          .from('parent_user')
          .insert({
            id: parentLinkId,
            parent_id: parentId,
            student_id: studentId,
            created_at: now,
            updated_at: now,
            is_deleted: false,
          });
        if (parentLinkError) {
          await this.rollbackStudentProfile(
            studentId,
            parentLinkId,
            studentClassLinkId,
            parentClassLinkId,
            now,
          );
          throw parentLinkError;
        }
      }

      const { error: classLinkError } = await this.supabase
        .from('class_user')
        .insert({
          id: studentClassLinkId,
          class_id: classId,
          user_id: studentId,
          role: RoleType.STUDENT,
          created_at: now,
          updated_at: now,
          is_deleted: false,
        });
      if (classLinkError) {
        await this.rollbackStudentProfile(
          studentId,
          parentLinkId,
          studentClassLinkId,
          parentClassLinkId,
          now,
        );
        throw classLinkError;
      }

      if (parentId && !atSchool) {
        try {
          parentClassLinkId = await this.ensureParentClassMapping(
            parentId,
            classId,
            now,
          );
        } catch (error) {
          await this.rollbackStudentProfile(
            studentId,
            parentLinkId,
            studentClassLinkId,
            parentClassLinkId,
            now,
          );
          throw error;
        }
      }

      return {
        success: true,
        message: 'Student added successfully',
        data: { studentId, parentId },
      };
    } catch (error) {
      logger.error(
        'Unexpected error in addStudentWithParentValidation:',
        error,
      );
      return {
        success: false,
        message: 'An unexpected error occurred while adding the student',
      };
    }
  }
}
