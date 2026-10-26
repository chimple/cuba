import { OpsUtil } from '../../OpsUtility/OpsUtil';
import type { ProcessBulkUploadFileOptions } from './fileUploadTypes';
import { processClassSheet } from './fileUploadClassProcessor';
import { processSchoolSheet } from './fileUploadSchoolProcessor';
import { processStudentSheet } from './fileUploadStudentProcessor';
import { processTeacherSheet } from './fileUploadTeacherProcessor';
import {
  buildProcessedWorkbook,
  createStyledCell,
  normalizeSheetRows,
  normalizeWhatsappBotNumber,
  parseWorkbookSheets,
  prepareBulkUploadPayload,
} from './fileUploadWorkbookUtils';

const gradeLevelMap: Record<string, string> = {
  '1': 'Grade 1',
  '2': 'Grade 2',
  '3': 'Grade 3',
};

const curriculumMap: Record<string, string> = {
  NCERT: 'NCERT',
  Chimple: 'Chimple',
  Karnataka: 'Karnataka State Board',
  'Karnataka State Board': 'Karnataka State Board',
  Haryana: 'Haryana',
  'Uttar Pradesh': 'Uttar Pradesh',
  Maharashtra: 'Maharashtra',
};

const subjectMap: Record<string, string> = {
  Maths: 'Maths',
  English: 'English',
  'Digital Skills': 'Digital Skills',
  Kannada: 'ಕನ್ನಡ',
  Hindi: 'हिंदी',
  Marathi: 'मराठी',
};

const validateEmailOrPhone = (value: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (emailRegex.test(value)) {
    return true;
  }
  const phoneValidation = OpsUtil.validateAndFormatPhoneNumber(value, 'IN');
  return phoneValidation.valid;
};

export const processBulkUploadFile = async ({
  api,
  fileBuffer,
  validSheetCountRef,
  setIsProcessing,
  setIsVerifying,
  setFinalPayload,
  setVerifyingProgressState,
  progressRef,
  markDuplicateStudentErrorIfPresent,
}: ProcessBulkUploadFileOptions): Promise<ArrayBuffer> => {
  const { workbookSheetNames, workbookSheets } =
    await parseWorkbookSheets(fileBuffer);

  const validatedSchoolIds: Set<string> = new Set();
  const studentLoginTypeMap = new Map<string, string>();
  const validatedSchoolClassPairs: Set<string> = new Set();
  const newlyCreatedClasses: Set<string> = new Set();
  const validatedProgramNames = new Set<string>();
  const schoolProgramModelMap = new Map<string, string>();
  const schoolWhatsappBotNumberMap = new Map<string, string>();

  const validatedSheets = {
    school: [] as any[],
    class: [] as any[],
    teacher: [] as any[],
    student: [] as any[],
  };
  const processedSheetsForExport: Record<string, Record<string, any>[]> = {};
  const validationContext = {
    api,
    validSheetCountRef,
    validatedSheets,
    validatedSchoolIds,
    studentLoginTypeMap,
    validatedSchoolClassPairs,
    newlyCreatedClasses,
    validatedProgramNames,
    schoolProgramModelMap,
    schoolWhatsappBotNumberMap,
    gradeLevelMap,
    curriculumMap,
    subjectMap,
    createStyledCell,
    validateEmailOrPhone,
    normalizeWhatsappBotNumber,
    markDuplicateStudentErrorIfPresent,
  };

  for (const sheet of workbookSheetNames) {
    const rawData: Record<string, any>[] = workbookSheets[sheet] ?? [];
    const processedData = normalizeSheetRows(rawData);

    progressRef.current = 70;
    setVerifyingProgressState(progressRef.current);

    await processSchoolSheet(sheet, processedData, validationContext);
    await processClassSheet(sheet, processedData, validationContext);
    await processTeacherSheet(sheet, processedData, validationContext);
    await processStudentSheet(sheet, processedData, validationContext);

    processedSheetsForExport[sheet] = processedData as Record<string, any>[];

    if (sheet === 'School') validatedSheets.school = processedData;
    else if (sheet === 'Class') validatedSheets.class = processedData;
    else if (sheet === 'Teacher') validatedSheets.teacher = processedData;
    else if (sheet === 'Student') validatedSheets.student = processedData;
  }

  const output = await buildProcessedWorkbook(
    workbookSheetNames,
    processedSheetsForExport,
  );
  progressRef.current = 80;
  setVerifyingProgressState(progressRef.current);

  const isValidSheetCount =
    validSheetCountRef.current !== null && validSheetCountRef.current > 0;
  if (!isValidSheetCount) {
    setIsProcessing(false);
    validSheetCountRef.current = 0;
  }

  const payload = await prepareBulkUploadPayload(validatedSheets);
  setFinalPayload(payload);

  setIsProcessing(false);
  setIsVerifying(false);

  return output;
};
