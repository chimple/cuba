import type {
  FileUploadRow,
  FileUploadValidationContext,
} from './fileUploadTypes';

export async function processStudentSheet(
  sheet: string,
  processedData: FileUploadRow[],
  context: FileUploadValidationContext,
) {
  const {
    api,
    validSheetCountRef,
    studentLoginTypeMap,
    validatedSchoolClassPairs,
    newlyCreatedClasses,
    schoolProgramModelMap,
    createStyledCell,
    markDuplicateStudentErrorIfPresent,
  } = context;
  if (sheet.toLowerCase().includes('student')) {
    const seenNameClassCombos = new Set<string>();

    const seenClassIdCombos = new Set<string>();

    // Cache for school details fetched from the DB to avoid redundant calls within this sheet

    const schoolDetailsCache = new Map<
      string,
      { schoolModel?: string; studentLoginType?: string }
    >();

    // ---------- Helper Function for DB Validation (for EXISTING schools/classes) ----------

    async function validateStudentData(
      studentLoginType: string | undefined,

      parentContact: string,

      className: string,

      normalizedStudentName: string,

      schoolId: string,

      studentId: string | undefined,

      errors: string[],
    ) {
      if (!studentLoginType || studentLoginType.trim() === '') {
        errors.push(
          'Student login type is missing for this school. Please check the school details.',
        );

        return;
      }

      if (
        studentLoginType === 'PARENT PHONE NUMBER' ||
        studentLoginType === 'parent_phone_number'
      ) {
        if (!parentContact) {
          errors.push(
            "PARENT PHONE NUMBER OR LOGIN ID is required for this school's login type.",
          );
        } else if (!/^\d{10}$/.test(parentContact)) {
          errors.push(
            'PARENT PHONE NUMBER must be a valid 10-digit mobile number.',
          );
        } else {
          try {
            const result = await api.validateParentAndStudentInClass(
              parentContact,

              normalizedStudentName,

              className,

              schoolId,
            );

            if (result?.status === 'error') {
              if (result.message) {
                errors.push(result.message);

                markDuplicateStudentErrorIfPresent([result.message]);
              }

              if (result.errors && result.errors.length > 0) {
                errors.push(...result.errors);

                markDuplicateStudentErrorIfPresent(result.errors);
              }
            }
          } catch (e) {
            errors.push('Server error validating parent/student class link.');
          }
        }
      } else {
        if (!studentId || studentId.trim() === '') {
          errors.push("STUDENT ID is required for this school's login type.");
        }

        try {
          const result = await api.validateStudentInClassWithoutPhone(
            normalizedStudentName,

            className,

            schoolId,
          );

          if (result?.status === 'error') {
            if (result.message) {
              errors.push(result.message);

              markDuplicateStudentErrorIfPresent([result.message]);
            }

            if (result.errors && result.errors.length > 0) {
              errors.push(...result.errors);

              markDuplicateStudentErrorIfPresent(result.errors);
            }
          }
        } catch (e) {
          errors.push('Error while validating student in class.');
        }
      }
    }

    // --- Start processing each row in the Student sheet ---

    for (const row of processedData) {
      let errors: string[] = [];

      const schoolId = row['SCHOOL ID']?.toString().trim();

      const studentId = row['STUDENT ID']?.toString().trim();

      const rawStudentName = row['STUDENT NAME']?.toString() ?? '';

      const studentName = rawStudentName.trim().replace(/\s+/g, ' ');

      row['STUDENT NAME'] = studentName;

      const normalizedStudentName = studentName.toLowerCase();

      const gender = row['GENDER']?.toString().trim();

      let age = row['AGE']?.toString().trim();

      let grade = row['GRADE']?.toString().trim();

      const classSection = row['CLASS SECTION']?.toString().trim() ?? '';

      const parentContact = row['PARENT PHONE NUMBER OR LOGIN ID']

        ?.toString()

        .trim();

      const className = `${grade}${classSection}`.trim();

      const schoolClassKey = `${schoolId}_${className}`;

      const classId = `${schoolId}_${grade}_${classSection}`.trim();

      if (!studentName) errors.push('Missing STUDENT NAME.');

      if (!gender) {
        errors.push('Missing GENDER.');
      } else if (
        !['MALE', 'FEMALE', 'UNSPECIFIED'].includes(gender.toUpperCase())
      ) {
        errors.push(
          'Invalid GENDER. Must be "MALE", "FEMALE", or "UNSPECIFIED".',
        );
      }

      if (!/^\d+$/.test(age)) {
        errors.push('AGE must be a whole number.');
      } else {
        const numericAge = parseInt(age, 10);

        if (numericAge < 2 || numericAge > 10)
          errors.push('AGE must be between 2 and 10.');
      }

      if (!/^\d+$/.test(grade)) {
        errors.push('GRADE must be a whole number.');
      } else {
        const numericGrade = parseInt(grade, 10);

        if (numericGrade < 0 || numericGrade > 5)
          errors.push('GRADE must be between 0 and 5.');
      }

      if (!className)
        errors.push('Class details (Grade/Section) are required.');

      // --- In-sheet duplicate checks ---

      if (normalizedStudentName && classId) {
        const nameClassKey = `${schoolId}_${classId}_${normalizedStudentName}`;

        if (seenNameClassCombos.has(nameClassKey)) {
          const duplicateMessage =
            'Duplicate student name in the same class within this sheet.';

          errors.push(duplicateMessage);

          markDuplicateStudentErrorIfPresent([duplicateMessage]);
        } else {
          seenNameClassCombos.add(nameClassKey);
        }
      }

      const identifier = parentContact || studentId;

      if (identifier && classId) {
        const classIdentifierKey = `${classId}_${identifier}`.toLowerCase();

        if (seenClassIdCombos.has(classIdentifierKey)) {
          errors.push(
            'Duplicate Parent Phone/Student ID in the same class within this sheet.',
          );
        } else {
          seenClassIdCombos.add(classIdentifierKey);
        }
      }

      // 3. Main Conditional Validation Logic

      if (!schoolId) {
        errors.push('Missing SCHOOL ID.');
      } else {
        // Validate the class first (from sheet or DB)

        let isClassValid = validatedSchoolClassPairs.has(schoolClassKey);

        if (!isClassValid) {
          const classValidationResponse =
            await api.validateClassNameWithSchoolID(schoolId, className);

          if (classValidationResponse?.status === 'success') {
            isClassValid = true;

            validatedSchoolClassPairs.add(schoolClassKey);
          } else {
            errors.push(
              `Class "${className}" for school "${schoolId}" was not found in the Class sheet or the database.`,
            );
          }
        }

        // Only proceed if the class is valid and there are no basic errors yet

        if (isClassValid && errors.length === 0) {
          const isNewClassForThisUpload =
            newlyCreatedClasses.has(schoolClassKey);

          let schoolModel: string | undefined;

          let studentLoginType: string | undefined;

          if (schoolProgramModelMap.has(schoolId)) {
            // New school case

            schoolModel = schoolProgramModelMap.get(schoolId);

            studentLoginType = studentLoginTypeMap.get(schoolId);
          } else {
            // Existing school case

            if (schoolDetailsCache.has(schoolId)) {
              const details = schoolDetailsCache.get(schoolId)!;

              schoolModel = details.schoolModel;

              studentLoginType = details.studentLoginType;
            } else {
              const schoolDetailsResult =
                await api.getSchoolDetailsByUdise(schoolId);

              if (!schoolDetailsResult) {
                errors.push(`School ID ${schoolId} not found in database.`);
              } else {
                schoolModel = schoolDetailsResult.schoolModel?.toUpperCase();

                studentLoginType = schoolDetailsResult.studentLoginType;

                schoolDetailsCache.set(schoolId, {
                  schoolModel,

                  studentLoginType,
                });
              }
            }
          }

          if (!schoolModel) {
            if (errors.length === 0)
              errors.push(
                `Could not determine Program Model for School ID ${schoolId}.`,
              );
          } else if (isNewClassForThisUpload) {
            // LOGIC FOR A **NEW CLASS**: Only perform FORMAT validation.

            if (schoolModel !== 'AT_SCHOOL' && schoolModel !== 'at_school') {
              if (!studentLoginType) {
                errors.push(
                  `Could not determine STUDENT LOGIN TYPE for school ${schoolId}.`,
                );
              } else if (
                studentLoginType.toUpperCase() === 'PARENT PHONE NUMBER'
              ) {
                if (!parentContact)
                  errors.push(
                    "PARENT PHONE NUMBER OR LOGIN ID is required for this school's login type.",
                  );
                else if (!/^\d{10}$/.test(parentContact))
                  errors.push(
                    'PARENT PHONE NUMBER must be a valid 10-digit mobile number.',
                  );
              } else {
                if (!studentId || studentId.trim() === '')
                  errors.push(
                    "STUDENT ID is required for this school's login type.",
                  );
              }
            }
          } else {
            // LOGIC FOR AN **EXISTING CLASS**: Safe to call database validation.

            if (
              schoolModel === 'AT SCHOOL' ||
              schoolModel === 'at_school' ||
              schoolModel === 'AT_SCHOOL'
            ) {
              const result = await api.validateStudentInClassWithoutPhone(
                normalizedStudentName,

                className,

                schoolId,
              );

              if (result?.status === 'error') {
                const duplicateMessages = result.errors || [
                  result.message || 'Validation failed.',
                ];

                errors.push(...duplicateMessages);

                markDuplicateStudentErrorIfPresent(duplicateMessages);
              }
            } else {
              await validateStudentData(
                studentLoginType,

                parentContact,

                className,

                normalizedStudentName,

                schoolId,

                studentId,

                errors,
              );
            }
          }
        }
      }

      if (errors.length > 0) {
        row['Updated'] = createStyledCell(
          `❌ Errors: ${[...new Set(errors)].join(', ')}`,

          true,
        );

        validSheetCountRef.current = 1;
      } else {
        row['Updated'] = createStyledCell('✅ Student Validated', false);
      }
    }
  }
}
