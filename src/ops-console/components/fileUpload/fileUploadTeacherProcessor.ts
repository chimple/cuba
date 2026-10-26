import type {
  FileUploadRow,
  FileUploadValidationContext,
} from './fileUploadTypes';

export async function processTeacherSheet(
  sheet: string,
  processedData: FileUploadRow[],
  context: FileUploadValidationContext,
) {
  const {
    api,
    validSheetCountRef,
    validatedSchoolIds,
    validatedSchoolClassPairs,
    createStyledCell,
    validateEmailOrPhone,
  } = context;
  if (sheet.toLowerCase().includes('teacher')) {
    for (const row of processedData) {
      let errors: string[] = [];

      const schoolId = row['SCHOOL ID']?.toString().trim();

      let grade = row['GRADE']?.toString().trim();

      const classSection = row['CLASS SECTION']
        ? row['CLASS SECTION'].toString().trim()
        : '';

      const classSection11 = row['CLASS SECTION']?.toString().trim();

      const teacherName = row['TEACHER NAME']?.toString().trim();

      const teacherContact = row['TEACHER PHONE NUMBER OR EMAIL']

        ?.toString()

        .trim();

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

      const schoolClassKey = `${schoolId}_${className}`;

      if (!teacherName || teacherName.trim() === '')
        errors.push('Missing teacher Name');

      if (!teacherContact || teacherContact.trim() === '')
        errors.push('Missing teacher Contact');

      if (!schoolId || schoolId.trim() === '') {
        errors.push('Missing schoolId.');
      } else {
        // This 'isSchoolValidatedInFile' flag helps direct the logic

        const isSchoolValidatedInFile = validatedSchoolIds.has(schoolId);

        // First, check if the class was defined in this upload's "Class" sheet

        const isClassValidatedInFile =
          validatedSchoolClassPairs.has(schoolClassKey);

        if (isClassValidatedInFile) {
          // Class was found in the sheet, no further DB check needed for the class.
        } else {
          // Class was NOT in the sheet. We must check the database.

          // But first, ensure the school itself is valid (either from the sheet or the DB).

          let isSchoolValidInDB = false;

          if (isSchoolValidatedInFile) {
            isSchoolValidInDB = true;
          } else {
            const schoolResult = await api.validateSchoolUdiseCode(schoolId);

            if (schoolResult?.status === 'success') {
              isSchoolValidInDB = true;
            } else {
              errors.push('SCHOOL ID does not exist in the database.');

              errors.push(...(schoolResult.errors || []));
            }
          }

          // If the school is valid, now check the class in the database

          if (isSchoolValidInDB) {
            const classValidationResponse =
              await api.validateClassNameWithSchoolID(schoolId, className);

            if (classValidationResponse?.status === 'error') {
              errors.push(
                `Class "${className}" for school "${schoolId}" was not found in the Class sheet AND does not exist in the database.`,
              );
            } else {
              // Success! The class exists in the DB. Cache it to avoid re-checking.

              validatedSchoolClassPairs.add(schoolClassKey);
            }
          }
        }
      }

      if (teacherContact && !validateEmailOrPhone(teacherContact)) {
        errors.push('Invalid TEACHER PHONE NUMBER OR EMAIL format.');
      }

      if (!className || className.trim() === '') {
        errors.push('Class name should not be empty');
      }

      if (errors.length > 0) {
        row['Updated'] = createStyledCell(
          `❌ Errors: ${errors.join(', ')}`,

          true,
        );

        validSheetCountRef.current = 1;
      } else {
        row['Updated'] = createStyledCell('✅ Teacher Validated', false);
      }
    }
  }
}
