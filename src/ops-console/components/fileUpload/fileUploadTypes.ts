import type { MutableRefObject } from 'react';

export type FileUploadRow = Record<string, any>;

export type NamedContact = {
  name: string;
  contact: string;
};

export type StyledCell = {
  v: string;
  t: string;
  s: Record<string, any>;
};

export type FileUploadValidationContext = {
  api: any;
  validSheetCountRef: MutableRefObject<number | null>;
  validatedSheets: {
    school: any[];
    class: any[];
    teacher: any[];
    student: any[];
  };
  validatedSchoolIds: Set<string>;
  studentLoginTypeMap: Map<string, string>;
  validatedSchoolClassPairs: Set<string>;
  newlyCreatedClasses: Set<string>;
  validatedProgramNames: Set<string>;
  schoolProgramModelMap: Map<string, string>;
  schoolWhatsappBotNumberMap: Map<string, string>;
  gradeLevelMap: Record<string, string>;
  curriculumMap: Record<string, string>;
  subjectMap: Record<string, string>;
  createStyledCell: (message: string, isError: boolean) => StyledCell;
  validateEmailOrPhone: (value: string) => boolean;
  normalizeWhatsappBotNumber: (value: unknown) => string;
  markDuplicateStudentErrorIfPresent: (messages: string[]) => void;
};

export type ProcessBulkUploadFileOptions = {
  api: any;
  fileBuffer: ArrayBuffer;
  validSheetCountRef: MutableRefObject<number | null>;
  setIsProcessing: (value: boolean) => void;
  setIsVerifying: (value: boolean) => void;
  setFinalPayload: (value: any[]) => void;
  setVerifyingProgressState: (value: number) => void;
  progressRef: MutableRefObject<number>;
  markDuplicateStudentErrorIfPresent: (messages: string[]) => void;
};
