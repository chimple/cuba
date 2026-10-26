import logger from '../../../utility/logger';
import type {
  FileUploadRow,
  FileUploadValidationContext,
} from './fileUploadTypes';

export async function processClassSheet(
  sheet: string,
  processedData: FileUploadRow[],
  context: FileUploadValidationContext,
) {
  const {
    api,
    validSheetCountRef,
    validatedSchoolIds,
    validatedSchoolClassPairs,
    newlyCreatedClasses,
    schoolWhatsappBotNumberMap,
    gradeLevelMap,
    curriculumMap,
    subjectMap,
    createStyledCell,
  } = context;
  if (sheet.toLowerCase().includes('class')) {
    const schoolWhatsappBotCache = new Map<string, string>();

    const schoolUuidCache = new Map<string, string>();

    const schoolClassInviteLinkCache = new Map<
      string,
      Map<string, string | null>
    >();

    const normalizeClassNameKey = (value: string): string =>
      value.replace(/\s+/g, '').trim().toLowerCase();

    for (let row of processedData) {
      let errors: string[] = [];

      const schoolId = row['SCHOOL ID']?.toString().trim();

      let grade = row['GRADE']?.toString().trim();

      const classSection = row['CLASS SECTION']?.toString().trim();

      if (!schoolId || schoolId.trim() === '') {
        errors.push('Missing SCHOOL ID.');
      }

      let subjectGrade = row['SUBJECT GRADE']?.toString().trim();

      let curriculum = row['CURRICULUM']?.toString().trim();

      let subject = row['SUBJECT']?.toString().trim();

      const studentCount = row['STUDENTS COUNT IN CLASS']

        ?.toString()

        .trim();

      const whatsappGroupLink =
        row['WHATSAPP GROUP LINK']?.toString().trim() || '';

      if (whatsappGroupLink) {
        row['WHATSAPP GROUP LINK'] = whatsappGroupLink;
      }

      // --- ⬇️ GRADE VALIDATION ADDED HERE ⬇️ ---

      if (!grade) {
        errors.push('Missing GRADE.');
      } else if (!/^\d+$/.test(grade)) {
        errors.push('GRADE must be a whole number (e.g., 1, 2, 3).');
      } else {
        const numericGrade = parseInt(grade, 10);

        if (numericGrade < 0) {
          errors.push('GRADE cannot be negative.');
        } else if (numericGrade > 5) {
          errors.push('GRADE cannot be more than 5.');
        } else {
          grade = numericGrade.toString();
        }
      }

      const className = `${grade}${classSection}`.trim();

      const classNameKey = normalizeClassNameKey(className);

      const schoolClassKey = `${schoolId}_${className}`;

      let classExistsInDb = false;

      if (!curriculum) errors.push('Missing curriculum');

      if (!subject) errors.push('Missing subject');

      if (!studentCount) errors.push('Missing studentCount');

      if (!subjectGrade) {
        errors.push('Missing subjectGrade');
      } else {
        subjectGrade = gradeLevelMap[subjectGrade] || '';

        if (!subjectGrade) {
          errors.push('Invalid subjectGrade. Only 1, 2, or 3 are allowed.');
        }
      }

      // Apply curriculum and subject mappings

      curriculum = curriculumMap[curriculum] || '';

      subject = subjectMap[subject] || '';

      if (!curriculum) errors.push('Invalid curriculum selected.');

      if (!subject) errors.push('Invalid subject selected.');

      if (
        !schoolId &&
        !grade &&
        !subjectGrade &&
        !curriculum &&
        !subject &&
        !studentCount
      ) {
        errors.push('Missing required class details.');
      } else {
        if (schoolId && !validatedSchoolIds.has(schoolId)) {
          const result = await api.validateSchoolUdiseCode(schoolId);

          if (result?.status === 'error') {
            errors.push('SCHOOL ID does not match any validated school.');

            errors.push(...(result.errors || []));
          }
        }

        if (schoolId && className) {
          const classValidationResponse =
            await api.validateClassNameWithSchoolID(schoolId, className);

          classExistsInDb = classValidationResponse?.status === 'success';
        }
      }

      const validationResponse = await api.validateClassCurriculumAndSubject(
        curriculum,

        subject,

        subjectGrade,
      );

      if (validationResponse.status === 'error') {
        errors.push(...(validationResponse.errors || []));
      }

      if (whatsappGroupLink) {
        if (!schoolId) {
          errors.push('SCHOOL ID is required to validate WHATSAPP GROUP LINK.');
        } else {
          let classInviteLinkMap = schoolClassInviteLinkCache.get(schoolId);

          if (!classInviteLinkMap) {
            classInviteLinkMap = new Map<string, string | null>();

            try {
              let schoolUuid = schoolUuidCache.get(schoolId) || '';

              if (!schoolUuid) {
                const schoolDetails =
                  await api.getSchoolDetailsByUdise(schoolId);

                schoolUuid = schoolDetails?.schoolId?.toString().trim() || '';

                const botFromSchoolDetails =
                  schoolDetails?.whatsappBotNumber?.toString().trim() || '';

                if (schoolUuid) {
                  schoolUuidCache.set(schoolId, schoolUuid);
                }

                if (botFromSchoolDetails) {
                  schoolWhatsappBotCache.set(
                    schoolId,

                    botFromSchoolDetails,
                  );
                }
              }

              if (schoolUuid) {
                const classes = await api.getClassesBySchoolId(schoolUuid);

                for (const cls of classes || []) {
                  const dbClassName = cls?.name?.toString().trim();

                  if (!dbClassName) continue;

                  const dbInviteLink =
                    cls?.whatsapp_invite_link?.toString().trim() || null;

                  const dbClassKey = normalizeClassNameKey(dbClassName);

                  const existingInviteLink = classInviteLinkMap.get(dbClassKey);

                  if (!classInviteLinkMap.has(dbClassKey)) {
                    classInviteLinkMap.set(dbClassKey, dbInviteLink);
                  } else if (!existingInviteLink && dbInviteLink) {
                    classInviteLinkMap.set(dbClassKey, dbInviteLink);
                  } else if (
                    existingInviteLink &&
                    dbInviteLink &&
                    existingInviteLink !== dbInviteLink
                  ) {
                    logger.warn(
                      `Multiple invite links found for class ${dbClassName} in school ${schoolId}. Keeping ${existingInviteLink} and ignoring ${dbInviteLink}.`,
                    );
                  }
                }
              }
            } catch (classFetchError) {
              logger.warn(
                `Failed to fetch class invite links for school ${schoolId}`,

                classFetchError,
              );
            }

            schoolClassInviteLinkCache.set(schoolId, classInviteLinkMap);
          }

          const dbInviteLink =
            classInviteLinkMap.get(classNameKey)?.toString().trim() || '';

          if (dbInviteLink) {
            if (dbInviteLink !== whatsappGroupLink) {
              errors.push(
                `WHATSAPP GROUP LINK mismatch for class "${className}". Sheet has "${whatsappGroupLink}" but server has "${dbInviteLink}".`,
              );
            }
          } else {
            let whatsappBotNumber = schoolWhatsappBotNumberMap.get(schoolId);

            if (!whatsappBotNumber) {
              if (schoolWhatsappBotCache.has(schoolId)) {
                whatsappBotNumber = schoolWhatsappBotCache.get(schoolId);
              } else {
                const schoolDetails =
                  await api.getSchoolDetailsByUdise(schoolId);

                const schoolUuid =
                  schoolDetails?.schoolId?.toString().trim() || '';

                whatsappBotNumber =
                  schoolDetails?.whatsappBotNumber?.toString().trim() || '';

                if (schoolUuid) {
                  schoolUuidCache.set(schoolId, schoolUuid);
                }

                schoolWhatsappBotCache.set(schoolId, whatsappBotNumber || '');
              }
            }

            if (!whatsappBotNumber) {
              errors.push(
                'WHATSAPP BOT NUMBER is not available for this school. Cannot validate WHATSAPP GROUP LINK.',
              );
            } else {
              const groupValidation = await api.validateWhatsappGroupLink(
                whatsappBotNumber,

                whatsappGroupLink,
              );

              if (groupValidation.status === 'error') {
                errors.push(
                  ...(groupValidation.errors || [
                    'Invalid WHATSAPP GROUP LINK.',
                  ]),
                );
              }
            }
          }
        }
      }

      if (errors.length > 0) {
        row['Updated'] = createStyledCell(
          `Errors: ${errors.join(', ')}`,

          true,
        );

        validSheetCountRef.current = 1;
      } else {
        validatedSchoolClassPairs.add(schoolClassKey);

        if (!classExistsInDb) {
          newlyCreatedClasses.add(schoolClassKey);
        }

        row['Updated'] = createStyledCell('Class Validated', false);
      }
    }
  }
}
