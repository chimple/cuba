import type {
  FileUploadRow,
  FileUploadValidationContext,
  NamedContact,
} from './fileUploadTypes';

export async function processSchoolSheet(
  sheet: string,
  processedData: FileUploadRow[],
  context: FileUploadValidationContext,
) {
  const {
    api,
    validSheetCountRef,
    validatedSheets,
    validatedSchoolIds,
    studentLoginTypeMap,
    validatedProgramNames,
    schoolProgramModelMap,
    schoolWhatsappBotNumberMap,
    createStyledCell,
    validateEmailOrPhone,
    normalizeWhatsappBotNumber,
  } = context;
  if (sheet.toLowerCase().includes('school')) {
    processedData.forEach((row, index) => {
      row.__rowNum = index;
    });

    const schoolGroups = new Map<string, any[]>();

    for (const row of processedData) {
      const schoolId = row['SCHOOL ID']?.toString().trim();

      const schoolName = row['SCHOOL NAME']?.toString().trim();

      const key = schoolId || schoolName || `no-id-${row.__rowNum}`;

      if (!schoolGroups.has(key)) {
        schoolGroups.set(key, []);
      }

      schoolGroups.get(key)?.push(row);
    }

    const masterSchoolRowsForPayload: any[] = [];

    for (const schoolRows of schoolGroups.values()) {
      const masterRow = schoolRows[0];

      const groupLevelErrors: string[] = [];

      const rowSpecificErrors = new Map<number, string[]>();

      const contactValidationErrors = new Map<string, string[]>();

      const collectedPMs: string[] = [];

      const collectedFCs: string[] = [];

      const collectedPrincipals: NamedContact[] = [];

      const collectedSchoolCoordinators: NamedContact[] = [];

      const seenPMContacts = new Set<string>();

      const seenFCContacts = new Set<string>();

      const seenPrincipalContacts = new Set<string>();

      const seenSchoolCoordinatorContacts = new Set<string>();

      // --- Pass 1: Collect contacts, check formats and in-sheet duplicates (ROW-SPECIFIC) ---

      for (const row of schoolRows) {
        const pmPhone = row['PROGRAM MANAGER EMAIL OR PHONE NUMBER']

          ?.toString()

          .trim();

        const fcPhone = row['FIELD COORDINATOR EMAIL OR PHONE NUMBER']

          ?.toString()

          .trim();

        const principalName = row['PRINCIPAL NAME']?.toString().trim();

        const principalPhone = row['PRINCIPAL PHONE NUMBER OR EMAIL ID']

          ?.toString()

          .trim();

        const schoolCoordinatorName = row['SCHOOL COORDINATOR NAME']

          ?.toString()

          .trim();

        const schoolCoordinatorPhone = row[
          'SCHOOL COORDINATOR PHONE NUMBER OR EMAIL ID'
        ]

          ?.toString()

          .trim();

        const currentRowNum = row.__rowNum;

        const addRowError = (message: string) => {
          if (!rowSpecificErrors.has(currentRowNum)) {
            rowSpecificErrors.set(currentRowNum, []);
          }

          rowSpecificErrors.get(currentRowNum)?.push(message);
        };

        if (pmPhone) {
          if (seenPMContacts.has(pmPhone)) {
            addRowError(
              `❌ Duplicate PROGRAM MANAGER contact in sheet: ${pmPhone}`,
            );
          } else {
            seenPMContacts.add(pmPhone);

            collectedPMs.push(pmPhone);

            if (!validateEmailOrPhone(pmPhone)) {
              addRowError(`Invalid PROGRAM MANAGER contact format: ${pmPhone}`);
            }
          }
        }

        if (fcPhone) {
          if (seenFCContacts.has(fcPhone)) {
            addRowError(
              `❌ Duplicate FIELD COORDINATOR contact in sheet: ${fcPhone}`,
            );
          } else {
            seenFCContacts.add(fcPhone);

            collectedFCs.push(fcPhone);

            if (!validateEmailOrPhone(fcPhone)) {
              addRowError(
                `Invalid FIELD COORDINATOR contact format: ${fcPhone}`,
              );
            }
          }
        }

        if (principalName && !principalPhone) {
          addRowError(
            `Principal "${principalName}" is missing a phone number or email on the same row.`,
          );
        } else if (!principalName && principalPhone) {
          addRowError(
            `The contact "${principalPhone}" is missing a Principal Name on the same row.`,
          );
        } else if (principalName && principalPhone) {
          if (seenPrincipalContacts.has(principalPhone)) {
            addRowError(
              `❌ Duplicate PRINCIPAL contact in sheet: ${principalPhone}`,
            );
          } else {
            seenPrincipalContacts.add(principalPhone);

            collectedPrincipals.push({
              name: principalName,

              contact: principalPhone,
            });

            if (!validateEmailOrPhone(principalPhone)) {
              addRowError(
                `Invalid PRINCIPAL contact format: ${principalPhone}`,
              );
            }
          }
        }

        if (schoolCoordinatorName && !schoolCoordinatorPhone) {
          addRowError(
            `School Coordinator "${schoolCoordinatorName}" is missing a phone number or email on the same row.`,
          );
        } else if (!schoolCoordinatorName && schoolCoordinatorPhone) {
          addRowError(
            `The contact "${schoolCoordinatorPhone}" is missing a School Coordinator Name on the same row.`,
          );
        } else if (schoolCoordinatorName && schoolCoordinatorPhone) {
          if (seenSchoolCoordinatorContacts.has(schoolCoordinatorPhone)) {
            addRowError(
              `❌ Duplicate SCHOOL COORDINATOR contact in sheet: ${schoolCoordinatorPhone}`,
            );
          } else {
            seenSchoolCoordinatorContacts.add(schoolCoordinatorPhone);

            collectedSchoolCoordinators.push({
              name: schoolCoordinatorName,

              contact: schoolCoordinatorPhone,
            });

            if (!validateEmailOrPhone(schoolCoordinatorPhone)) {
              addRowError(
                `Invalid SCHOOL COORDINATOR contact format: ${schoolCoordinatorPhone}`,
              );
            }
          }
        }
      }

      // --- Pass 1.5: Validate all UNIQUE contacts against the database ---

      for (const pm of seenPMContacts) {
        const validation = await api.validateUserContacts(pm, undefined);

        if (validation.status === 'error' && validation.errors) {
          const formattedErrors = validation.errors.map(
            (err: string) => `For PM (${pm}): ${err}`,
          );

          contactValidationErrors.set(pm, formattedErrors);
        }
      }

      if (seenFCContacts.size > 0) {
        const firstPM = collectedPMs.length > 0 ? collectedPMs[0] : undefined;

        for (const fc of seenFCContacts) {
          const validation = await api.validateUserContacts(
            firstPM ?? '',

            fc,
          );

          if (validation.status === 'error' && validation.errors) {
            const fcError = validation.errors.find((e: string) =>
              e.includes('FIELD COORDINATOR'),
            );

            if (fcError) {
              contactValidationErrors.set(fc, [`For FC (${fc}): ${fcError}`]);
            }
          }
        }
      }

      // --- Pass 2: Validation logic for school details ---

      const schoolId = masterRow['SCHOOL ID']?.toString().trim();

      let isExistingAndActiveSchool = false;

      // First, check if the school is already active in the main `school` table.

      if (schoolId) {
        const activeSchoolCheck = await api.validateSchoolUdiseCode(schoolId);

        if (activeSchoolCheck.status === 'success') {
          isExistingAndActiveSchool = true;

          validatedSchoolIds.add(schoolId);
        }
      }

      if (isExistingAndActiveSchool) {
        // This is an active school. The only goal is to add/update contacts.

        const hasNewContacts =
          collectedPMs.length > 0 ||
          collectedFCs.length > 0 ||
          collectedPrincipals.length > 0 ||
          collectedSchoolCoordinators.length > 0;

        if (!hasNewContacts) {
          const successMessage = createStyledCell(
            '✅ School ID is valid. No new data to process on this row.',

            false,
          );

          schoolRows.forEach((row) => (row['Updated'] = successMessage));

          continue;
        }
      } else {
        // This block runs if we are CREATING a new school.

        const schoolName = masterRow['SCHOOL NAME']?.toString().trim();

        const academicYear = masterRow['SCHOOL ACADEMIC YEAR']

          ?.toString()

          .trim();

        const programName = masterRow['PROGRAM NAME']?.toString().trim();

        const programModel = masterRow['PROGRAM MODEL']?.toString().trim();

        const schoolInstructionLanguage = masterRow[
          'SCHOOL INSTRUCTION LANGUAGE'
        ]

          ?.toString()

          .trim();

        const studentLoginType = masterRow['STUDENT LOGIN TYPE']

          ?.toString()

          .trim();

        const isWhatsappEnabled = masterRow['IS WHATSAPP ENABLED']

          ?.toString()

          .trim()

          .toLowerCase();

        const whatsappBotNumber = normalizeWhatsappBotNumber(
          masterRow['WHATSAPP BOT NUMBER'],
        );

        if (whatsappBotNumber) {
          masterRow['WHATSAPP BOT NUMBER'] = whatsappBotNumber;
        }

        if (schoolId) {
          // CASE: if school ID is provided, but school is not active. Check against `school_data`.

          if (!schoolName) {
            groupLevelErrors.push(
              'Missing SCHOOL NAME (required when providing a School ID for a new school).',
            );
          } else {
            const schoolDataCheck = await api.validateSchoolData(
              schoolId,

              schoolName,
            );

            if (schoolDataCheck && schoolDataCheck.status === 'error') {
              groupLevelErrors.push(
                ...(schoolDataCheck.errors || [
                  `School with ID ${schoolId} not found in master data.`,
                ]),
              );
            } else if (schoolDataCheck) {
              validatedSchoolIds.add(schoolId);
            }
          }
        } else {
          // CASE: No School ID is provided. Creating from scratch requires location details.

          const state = masterRow['STATE']?.toString().trim();

          const district = masterRow['DISTRICT']?.toString().trim();

          const block = masterRow['BLOCK']?.toString().trim();

          const cluster = masterRow['CLUSTER']?.toString().trim();

          if (!schoolName) groupLevelErrors.push('Missing SCHOOL NAME');

          if (!state) groupLevelErrors.push('Missing STATE');

          if (!district) groupLevelErrors.push('Missing DISTRICT');

          if (!block) groupLevelErrors.push('Missing BLOCK');

          if (!cluster) groupLevelErrors.push('Missing CLUSTER');
        }

        // These are mandatory fields for ANY new school creation.

        if (!academicYear)
          groupLevelErrors.push('Missing SCHOOL ACADEMIC YEAR');

        if (!schoolInstructionLanguage)
          groupLevelErrors.push('Missing SCHOOL INSTRUCTION LANGUAGE');

        if (collectedFCs.length === 0) {
          groupLevelErrors.push(
            'At least one unique Field Coordinator is required for a new school.',
          );
        }

        if (collectedPrincipals.length === 0) {
          groupLevelErrors.push(
            'Missing PRINCIPAL information (Name and Contact)',
          );
        }

        if (programName) {
          const programValidation = await api.validateProgramName(programName);

          if (programValidation.status === 'error') {
            groupLevelErrors.push(
              ...(programValidation.errors || ['Program name not found.']),
            );
          } else {
            validatedProgramNames.add(programName);
          }
        } else {
          groupLevelErrors.push('Missing PROGRAM NAME');
        }

        if (programModel) {
          const validProgramModels = ['AT HOME', 'AT SCHOOL', 'HYBRID'];

          if (!validProgramModels.includes(programModel.toUpperCase())) {
            groupLevelErrors.push(
              'Invalid PROGRAM MODEL. Must be "AT HOME", "AT SCHOOL", or "HYBRID".',
            );
          }
        } else {
          groupLevelErrors.push('Missing PROGRAM MODEL');
        }

        if (isWhatsappEnabled) {
          const validIsWhatsappEnabled = ['yes', 'no'];

          if (!validIsWhatsappEnabled.includes(isWhatsappEnabled)) {
            groupLevelErrors.push(
              'Invalid "IS WHATSAPP ENABLED" value. Must be "yes" or "no" (case-insensitive).',
            );
          }
        } else {
          groupLevelErrors.push('Missing IS WHATSAPP ENABLED information');
        }

        if (isWhatsappEnabled === 'yes') {
          if (!whatsappBotNumber) {
            groupLevelErrors.push('Missing WHATSAPP BOT NUMBER');
          } else if (!/^\d{12}$/.test(whatsappBotNumber)) {
            groupLevelErrors.push(
              'Invalid WHATSAPP BOT NUMBER. Must be a 12-digit number.',
            );
          } else {
            const whatsappBotValidation =
              await api.validateWhatsappBotNumber(whatsappBotNumber);

            if (whatsappBotValidation.status === 'error') {
              groupLevelErrors.push(
                ...(whatsappBotValidation.errors || [
                  'WHATSAPP BOT NUMBER validation failed.',
                ]),
              );
            }
          }
        } else if (whatsappBotNumber && !/^\d{12}$/.test(whatsappBotNumber)) {
          groupLevelErrors.push(
            'Invalid WHATSAPP BOT NUMBER. Must be a 12-digit number.',
          );
        }

        if (programModel?.toUpperCase() !== 'AT SCHOOL') {
          if (!studentLoginType?.trim()) {
            groupLevelErrors.push(
              'Missing STUDENT LOGIN TYPE (Required for AT HOME/HYBRID models)',
            );
          }
        }

        if (
          schoolId &&
          isWhatsappEnabled === 'yes' &&
          /^\d{12}$/.test(whatsappBotNumber)
        ) {
          schoolWhatsappBotNumberMap.set(schoolId, whatsappBotNumber);
        }

        if (schoolId && programModel) {
          schoolProgramModelMap.set(schoolId, programModel.toUpperCase());
        }

        if (schoolId && studentLoginType) {
          studentLoginTypeMap.set(schoolId, studentLoginType);
        }
      }

      const hasGroupErrors = groupLevelErrors.length > 0;

      const hasRowErrors = rowSpecificErrors.size > 0;

      const hasContactDBErrors = contactValidationErrors.size > 0;

      if (hasGroupErrors || hasRowErrors || hasContactDBErrors) {
        validSheetCountRef.current = 1;

        for (const row of schoolRows) {
          const allErrorsForRow: string[] = [];

          allErrorsForRow.push(...groupLevelErrors);

          const specificErrs = rowSpecificErrors.get(row.__rowNum);

          if (specificErrs) {
            allErrorsForRow.push(...specificErrs);
          }

          const pmPhone = row['PROGRAM MANAGER EMAIL OR PHONE NUMBER']

            ?.toString()

            .trim();

          const fcPhone = row['FIELD COORDINATOR EMAIL OR PHONE NUMBER']

            ?.toString()

            .trim();

          if (pmPhone && contactValidationErrors.has(pmPhone)) {
            allErrorsForRow.push(...contactValidationErrors.get(pmPhone)!);
          }

          if (fcPhone && contactValidationErrors.has(fcPhone)) {
            allErrorsForRow.push(...contactValidationErrors.get(fcPhone)!);
          }

          if (allErrorsForRow.length > 0) {
            const uniqueErrors = [...new Set(allErrorsForRow)];

            row['Updated'] = createStyledCell(
              `❌ Errors: ${uniqueErrors.join(', ')}`,

              true,
            );
          } else {
            row['Updated'] = createStyledCell(
              '✅ This row is valid, but the school group has other errors.',

              false,
            );
          }
        }
      } else {
        const successMessage = createStyledCell(
          '✅ School and all contacts validated',

          false,
        );

        schoolRows.forEach((row) => (row['Updated'] = successMessage));

        const payloadRow = {
          ...masterRow,

          programManagers: collectedPMs,

          fieldCoordinators: collectedFCs,

          principals: collectedPrincipals,

          schoolCoordinators: collectedSchoolCoordinators,
        };

        masterSchoolRowsForPayload.push(payloadRow);
      }
    }

    validatedSheets.school = masterSchoolRowsForPayload;

    processedData.forEach((row) => delete row.__rowNum);
  }
}
