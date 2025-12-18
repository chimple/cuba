import React, { useEffect, useRef, useState } from "react";
import * as XLSX from "xlsx-js-style";
import { Capacitor } from "@capacitor/core";
import "./FileUpload.css";
import UploadIcon from "../assets/icons/upload_icon.png";
import { FaCloudDownloadAlt } from "react-icons/fa";
import { t } from "i18next";
import { Util } from "../../utility/util";
import { ServiceConfig } from "../../services/ServiceConfig";
import { OpsUtil } from "../OpsUtility/OpsUtil";
import { SupabaseApi } from "../../services/api/SupabaseApi";
import { generateFinalPayload } from "../OpsUtility/OpsDataMapper";
import VerifiedPage from "./FileVerifiedComponent";
import ErrorPage from "./FileErrorComponent";
import VerificationInProgress from "./VerificationInProgress";
import { useHistory } from "react-router-dom";
import {
  BULK_UPLOAD_TEMPLATE_URL,
  FileUploadStep,
  PAGES,
} from "../../common/constants";

type NamedContact = {
  name: string;
  contact: string;
};

const FileUpload: React.FC<{ onCancleClick?: () => void }> = ({
  onCancleClick,
}) => {
  const api = ServiceConfig.getI()?.apiHandler;
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const validSheetCountRef = useRef<number | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [fileBuffer, setFileBuffer] = useState<ArrayBuffer | null>(null);
  const progressRef = useRef(10);
  const [verifyingProgressState, setVerifyingProgressState] = useState(10);
  const [isReupload, setIsReupload] = useState(false);
  const processedDataRef = useRef(null);
  const [finalPayload, setFinalPayload] = useState<any[] | null>(null);
  const [isVerified, setIsVerified] = useState(false);
  const [step, setStep] = useState<FileUploadStep>(FileUploadStep.Idle);
  const history = useHistory();

  function onReuploadTriggered() {
    setFile(null);
    setProgress(0);
    setFileBuffer(null);
    validSheetCountRef.current = null;
    setStep(FileUploadStep.Idle);
    setIsReupload(true);
  }
  const gradeLevelMap: Record<string, string> = {
    "1": "Grade 1",
    "2": "Grade 2",
    "3": "Grade 3",
  };

  const curriculumMap: Record<string, string> = {
    NCERT: "NCERT",
    Chimple: "Chimple",
    Karnataka: "Karnataka State Board",
    Haryana: "Haryana",
    "Uttar Pradesh": "Uttar Pradesh",
    Maharashtra: "Maharashtra",
  };

  const subjectMap: Record<string, string> = {
    Maths: "Maths",
    English: "English",
    "Digital Skills": "Digital Skills",
    Kannada: "ಕನ್ನಡ",
    Hindi: "हिंदी",
    Marathi: "मराठी",
  };

  const createStyledCell = (message, isError) => {
    const color = isError ? "FF0000" : "00A000";
    return {
      v: message,
      t: "s",
      s: {
        font: {
          color: { rgb: color },
          bold: true,
        },
        alignment: {
          horizontal: "left",
          vertical: "center",
          wrapText: true,
        },
        border: {
          top: { style: "thin", color: { rgb: color } },
          bottom: { style: "thin", color: { rgb: color } },
          left: { style: "thin", color: { rgb: color } },
          right: { style: "thin", color: { rgb: color } },
        },
      },
    };
  };

  useEffect(() => {
    setVerifyingProgressState(progressRef.current);
  }, [progressRef.current]);

  useEffect(() => {
    if (isVerified && finalPayload) {
      setStep(FileUploadStep.Uploading);
      const uploadData = async () => {
        const result = await api.uploadData(finalPayload);
        if (result === true) {
          setStep(FileUploadStep.Uploaded);
        } else if (result === false) {
          setStep(FileUploadStep.UploadError);
        }
      };
      uploadData();
    }
  }, [isVerified, finalPayload]);
  useEffect(() => {
    if (step === FileUploadStep.Uploaded) {
      const timer = setTimeout(() => {
        onCancleClick?.();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [step, history]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setProgress(0);
    setIsProcessing(true);

    const reader = new FileReader();
    reader.readAsArrayBuffer(selectedFile);
    reader.onload = async (e) => {
      const buffer = e.target?.result as ArrayBuffer;
      setFileBuffer(buffer);
      setProgress(100);
      setIsProcessing(false);
    };
    event.target.value = "";
  };
  const validateEmailOrPhone = (value: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (emailRegex.test(value)) {
      return true;
    }
    const phoneValidation = OpsUtil.validateAndFormatPhoneNumber(value, "IN");
    return phoneValidation.valid;
  };
  const processFile = async () => {
    if (!fileBuffer) return;
    progressRef.current = 40;
    setVerifyingProgressState(progressRef.current);
    const workbook = XLSX.read(fileBuffer, { type: "array" });

    let validatedSchoolIds: Set<string> = new Set();
    let studentLoginTypeMap = new Map<string, string>();
    let validatedSchoolClassPairs: Set<string> = new Set();
    let newlyCreatedClasses: Set<string> = new Set();
    let validatedProgramNames = new Set<string>();
    let schoolProgramModelMap = new Map<string, string>();

    const validatedSheets = {
      school: [] as any[],
      class: [] as any[],
      teacher: [] as any[],
      student: [] as any[],
    };
    for (const sheet of workbook.SheetNames) {
      const worksheet = workbook.Sheets[sheet];
      let rawData: Record<string, any>[] = XLSX.utils.sheet_to_json(worksheet, {
        raw: false,
        defval: "",
      });
      let processedData = rawData.map((row) =>
        Object.fromEntries(
          Object.entries(row).map(([key, value]) => [
            key.trim(),
            typeof value === "string" ? value.trim() : value,
          ])
        )
      );

      progressRef.current = 70;
      setVerifyingProgressState(progressRef.current);
      if (sheet.toLowerCase().includes("school")) {
        processedData.forEach((row, index) => {
          row.__rowNum = index;
        });

        const schoolGroups = new Map<string, any[]>();
        for (const row of processedData) {
          const schoolId = row["SCHOOL ID"]?.toString().trim();
          const schoolName = row["SCHOOL NAME"]?.toString().trim();
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
            const pmPhone = row["PROGRAM MANAGER EMAIL OR PHONE NUMBER"]
              ?.toString()
              .trim();
            const fcPhone = row["FIELD COORDINATOR EMAIL OR PHONE NUMBER"]
              ?.toString()
              .trim();
            const principalName = row["PRINCIPAL NAME"]?.toString().trim();
            const principalPhone = row["PRINCIPAL PHONE NUMBER OR EMAIL ID"]
              ?.toString()
              .trim();
            const schoolCoordinatorName = row["SCHOOL COORDINATOR NAME"]
              ?.toString()
              .trim();
            const schoolCoordinatorPhone = row[
              "SCHOOL COORDINATOR PHONE NUMBER OR EMAIL ID"
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
                  `❌ Duplicate PROGRAM MANAGER contact in sheet: ${pmPhone}`
                );
              } else {
                seenPMContacts.add(pmPhone);
                collectedPMs.push(pmPhone);
                if (!validateEmailOrPhone(pmPhone)) {
                  addRowError(
                    `Invalid PROGRAM MANAGER contact format: ${pmPhone}`
                  );
                }
              }
            }
            if (fcPhone) {
              if (seenFCContacts.has(fcPhone)) {
                addRowError(
                  `❌ Duplicate FIELD COORDINATOR contact in sheet: ${fcPhone}`
                );
              } else {
                seenFCContacts.add(fcPhone);
                collectedFCs.push(fcPhone);
                if (!validateEmailOrPhone(fcPhone)) {
                  addRowError(
                    `Invalid FIELD COORDINATOR contact format: ${fcPhone}`
                  );
                }
              }
            }
            if (principalName && !principalPhone) {
              addRowError(
                `Principal "${principalName}" is missing a phone number or email on the same row.`
              );
            } else if (!principalName && principalPhone) {
              addRowError(
                `The contact "${principalPhone}" is missing a Principal Name on the same row.`
              );
            } else if (principalName && principalPhone) {
              if (seenPrincipalContacts.has(principalPhone)) {
                addRowError(
                  `❌ Duplicate PRINCIPAL contact in sheet: ${principalPhone}`
                );
              } else {
                seenPrincipalContacts.add(principalPhone);
                collectedPrincipals.push({
                  name: principalName,
                  contact: principalPhone,
                });
                if (!validateEmailOrPhone(principalPhone)) {
                  addRowError(
                    `Invalid PRINCIPAL contact format: ${principalPhone}`
                  );
                }
              }
            }
            if (schoolCoordinatorName && !schoolCoordinatorPhone) {
              addRowError(
                `School Coordinator "${schoolCoordinatorName}" is missing a phone number or email on the same row.`
              );
            } else if (!schoolCoordinatorName && schoolCoordinatorPhone) {
              addRowError(
                `The contact "${schoolCoordinatorPhone}" is missing a School Coordinator Name on the same row.`
              );
            } else if (schoolCoordinatorName && schoolCoordinatorPhone) {
              if (seenSchoolCoordinatorContacts.has(schoolCoordinatorPhone)) {
                addRowError(
                  `❌ Duplicate SCHOOL COORDINATOR contact in sheet: ${schoolCoordinatorPhone}`
                );
              } else {
                seenSchoolCoordinatorContacts.add(schoolCoordinatorPhone);
                collectedSchoolCoordinators.push({
                  name: schoolCoordinatorName,
                  contact: schoolCoordinatorPhone,
                });
                if (!validateEmailOrPhone(schoolCoordinatorPhone)) {
                  addRowError(
                    `Invalid SCHOOL COORDINATOR contact format: ${schoolCoordinatorPhone}`
                  );
                }
              }
            }
          }

          // --- Pass 1.5: Validate all UNIQUE contacts against the database ---
          for (const pm of seenPMContacts) {
            const validation = await api.validateUserContacts(pm, undefined);
            if (validation.status === "error" && validation.errors) {
              const formattedErrors = validation.errors.map(
                (err) => `For PM (${pm}): ${err}`
              );
              contactValidationErrors.set(pm, formattedErrors);
            }
          }
          if (seenFCContacts.size > 0) {
            const firstPM =
              collectedPMs.length > 0 ? collectedPMs[0] : undefined;
            for (const fc of seenFCContacts) {
              const validation = await api.validateUserContacts(
                firstPM ?? "",
                fc
              );
              if (validation.status === "error" && validation.errors) {
                const fcError = validation.errors.find((e) =>
                  e.includes("FIELD COORDINATOR")
                );
                if (fcError) {
                  contactValidationErrors.set(fc, [
                    `For FC (${fc}): ${fcError}`,
                  ]);
                }
              }
            }
          }

          // --- Pass 2: Validation logic for school details ---
          const schoolId = masterRow["SCHOOL ID"]?.toString().trim();
          let isExistingAndActiveSchool = false;

          // First, check if the school is already active in the main `school` table.
          if (schoolId) {
            const activeSchoolCheck = await api.validateSchoolUdiseCode(
              schoolId
            );
            if (activeSchoolCheck.status === "success") {
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
                "✅ School ID is valid. No new data to process on this row.",
                false
              );
              schoolRows.forEach((row) => (row["Updated"] = successMessage));
              continue;
            }
          } else {
            // This block runs if we are CREATING a new school.
            const schoolName = masterRow["SCHOOL NAME"]?.toString().trim();
            const academicYear = masterRow["SCHOOL ACADEMIC YEAR"]
              ?.toString()
              .trim();
            const programName = masterRow["PROGRAM NAME"]?.toString().trim();
            const programModel = masterRow["PROGRAM MODEL"]?.toString().trim();
            const schoolInstructionLanguage = masterRow[
              "SCHOOL INSTRUCTION LANGUAGE"
            ]
              ?.toString()
              .trim();
            const studentLoginType = masterRow["STUDENT LOGIN TYPE"]
              ?.toString()
              .trim();
            const isWhatsappEnabled = masterRow["IS WHATSAPP ENABLED"]
              ?.toString()
              .trim();

            if (schoolId) {
              // CASE: if school ID is provided, but school is not active. Check against `school_data`.
              if (!schoolName) {
                groupLevelErrors.push(
                  "Missing SCHOOL NAME (required when providing a School ID for a new school)."
                );
              } else {
                const schoolDataCheck = await api.validateSchoolData(
                  schoolId,
                  schoolName
                );
                if (schoolDataCheck && schoolDataCheck.status === "error") {
                  groupLevelErrors.push(
                    ...(schoolDataCheck.errors || [
                      `School with ID ${schoolId} not found in master data.`,
                    ])
                  );
                } else if (schoolDataCheck) {
                  validatedSchoolIds.add(schoolId);
                }
              }
            } else {
              // CASE: No School ID is provided. Creating from scratch requires location details.
              const state = masterRow["STATE"]?.toString().trim();
              const district = masterRow["DISTRICT"]?.toString().trim();
              const block = masterRow["BLOCK"]?.toString().trim();
              const cluster = masterRow["CLUSTER"]?.toString().trim();
              if (!schoolName) groupLevelErrors.push("Missing SCHOOL NAME");
              if (!state) groupLevelErrors.push("Missing STATE");
              if (!district) groupLevelErrors.push("Missing DISTRICT");
              if (!block) groupLevelErrors.push("Missing BLOCK");
              if (!cluster) groupLevelErrors.push("Missing CLUSTER");
            }

            // These are mandatory fields for ANY new school creation.
            if (!academicYear)
              groupLevelErrors.push("Missing SCHOOL ACADEMIC YEAR");
            if (!schoolInstructionLanguage)
              groupLevelErrors.push("Missing SCHOOL INSTRUCTION LANGUAGE");
            if (collectedFCs.length === 0) {
              groupLevelErrors.push(
                "At least one unique Field Coordinator is required for a new school."
              );
            }
            if (collectedPrincipals.length === 0) {
              groupLevelErrors.push(
                "Missing PRINCIPAL information (Name and Contact)"
              );
            }

            if (programName) {
              const programValidation = await api.validateProgramName(
                programName
              );
              if (programValidation.status === "error") {
                groupLevelErrors.push(
                  ...(programValidation.errors || ["Program name not found."])
                );
              } else {
                validatedProgramNames.add(programName);
              }
            } else {
              groupLevelErrors.push("Missing PROGRAM NAME");
            }

            if (programModel) {
              const validProgramModels = ["AT HOME", "AT SCHOOL", "HYBRID"];
              if (!validProgramModels.includes(programModel.toUpperCase())) {
                groupLevelErrors.push(
                  'Invalid PROGRAM MODEL. Must be "AT HOME", "AT SCHOOL", or "HYBRID".'
                );
              }
            } else {
              groupLevelErrors.push("Missing PROGRAM MODEL");
            }

            if (isWhatsappEnabled) {
              const validIsWhatsappEnabled = ["YES", "NO"];
              if (
                !validIsWhatsappEnabled.includes(
                  isWhatsappEnabled.toUpperCase()
                )
              ) {
                groupLevelErrors.push(
                  'Invalid "IS WHATSAPP ENABLED" value. Must be "YES" or "NO".'
                );
              }
            } else {
              groupLevelErrors.push("Missing IS WHATSAPP ENABLED information");
            }

            if (programModel?.toUpperCase() !== "AT SCHOOL") {
              if (!studentLoginType?.trim()) {
                groupLevelErrors.push(
                  "Missing STUDENT LOGIN TYPE (Required for AT HOME/HYBRID models)"
                );
              }
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
              const pmPhone = row["PROGRAM MANAGER EMAIL OR PHONE NUMBER"]
                ?.toString()
                .trim();
              const fcPhone = row["FIELD COORDINATOR EMAIL OR PHONE NUMBER"]
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
                row["Updated"] = createStyledCell(
                  `❌ Errors: ${uniqueErrors.join(", ")}`,
                  true
                );
              } else {
                row["Updated"] = createStyledCell(
                  "✅ This row is valid, but the school group has other errors.",
                  false
                );
              }
            }
          } else {
            const successMessage = createStyledCell(
              "✅ School and all contacts validated",
              false
            );
            schoolRows.forEach((row) => (row["Updated"] = successMessage));
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
      // **Check if it's a Class Sheet**
      if (sheet.toLowerCase().includes("class")) {
        for (let row of processedData) {
          let errors: string[] = [];
          const schoolId = row["SCHOOL ID"]?.toString().trim();
          let grade = row["GRADE"]?.toString().trim();
          const classSection = row["CLASS SECTION"]?.toString().trim();
          let subjectGrade = row["SUBJECT GRADE"]?.toString().trim();
          let curriculum = row["CURRICULUM"]?.toString().trim();
          let subject = row["SUBJECT"]?.toString().trim();
          const studentCount = row["STUDENTS COUNT IN CLASS"]
            ?.toString()
            .trim();

          // --- ⬇️ GRADE VALIDATION ADDED HERE ⬇️ ---
          if (!grade) {
            errors.push("Missing GRADE.");
          } else if (!/^\d+$/.test(grade)) {
            errors.push("GRADE must be a whole number (e.g., 1, 2, 3).");
          } else {
            const numericGrade = parseInt(grade, 10);
            if (numericGrade < 0) {
              errors.push("GRADE cannot be negative.");
            } else if (numericGrade > 5) {
              errors.push("GRADE cannot be more than 5.");
            } else {
              grade = numericGrade.toString();
            }
          }

          const className = `${grade}${classSection}`.trim();
          if (schoolId && className) {
            const schoolClassKey = `${schoolId}_${className}`;
            if (!validatedSchoolClassPairs.has(schoolClassKey)) {
              validatedSchoolClassPairs.add(schoolClassKey);
              newlyCreatedClasses.add(schoolClassKey);
            }
          }

          if (!curriculum) errors.push("Missing curriculum");
          if (!subject) errors.push("Missing subject");
          if (!studentCount) errors.push("Missing studentCount");

          if (!subjectGrade) {
            errors.push("Missing subjectGrade");
          } else {
            subjectGrade = gradeLevelMap[subjectGrade] || "";
            if (!subjectGrade) {
              errors.push("Invalid subjectGrade. Only 1, 2, or 3 are allowed.");
            }
          }

          // Apply curriculum and subject mappings
          curriculum = curriculumMap[curriculum] || "";
          subject = subjectMap[subject] || "";

          if (!curriculum) errors.push("Invalid curriculum selected.");
          if (!subject) errors.push("Invalid subject selected.");

          if (
            !schoolId &&
            !grade &&
            !subjectGrade &&
            !curriculum &&
            !subject &&
            !studentCount
          ) {
            errors.push("Missing required class details.");
          } else {
            if (!validatedSchoolIds.has(schoolId)) {
              const result = await api.validateSchoolUdiseCode(schoolId);
              if (result?.status === "error") {
                errors.push("SCHOOL ID does not match any validated school.");
                errors.push(...(result.errors || []));
              }
            }
          }
          const validationResponse =
            await api.validateClassCurriculumAndSubject(
              curriculum,
              subject,
              subjectGrade
            );
          if (validationResponse.status === "error") {
            errors.push(...(validationResponse.errors || []));
          }
          if (errors.length > 0) {
            row["Updated"] = createStyledCell(
              `❌ Errors: ${errors.join(", ")}`,
              true
            );
            validSheetCountRef.current = 1;
          } else {
            row["Updated"] = createStyledCell("✅ Class Validated", false);
          }
        }
      }
      // **Teacher Sheet Validation**
      if (sheet.toLowerCase().includes("teacher")) {
        for (const row of processedData) {
          let errors: string[] = [];
          const schoolId = row["SCHOOL ID"]?.toString().trim();
          let grade = row["GRADE"]?.toString().trim();
          const classSection = row["CLASS SECTION"]
            ? row["CLASS SECTION"].toString().trim()
            : "";
           const classSection11 = row["CLASS SECTION"]?.toString().trim();
          const teacherName = row["TEACHER NAME"]?.toString().trim();
          const teacherContact = row["TEACHER PHONE NUMBER OR EMAIL"]
            ?.toString()
            .trim();

          if (!grade) {
            errors.push("Missing GRADE.");
          } else if (!/^\d+$/.test(grade)) {
            errors.push("GRADE must be a whole number (e.g., 1, 2, 3).");
          } else {
            const numericGrade = parseInt(grade, 10);
            if (numericGrade < 0) {
              errors.push("GRADE cannot be negative.");
            } else if (numericGrade > 5) {
              errors.push("GRADE cannot be more than 5.");
            } else {
              grade = numericGrade.toString();
            }
          }
          const className = `${grade}${classSection}`.trim();
          const schoolClassKey = `${schoolId}_${className}`;

          if (!teacherName || teacherName.trim() === "")
            errors.push("Missing teacher Name");
          if (!teacherContact || teacherContact.trim() === "")
            errors.push("Missing teacher Contact");

          if (!schoolId || schoolId.trim() === "") {
            errors.push("Missing schoolId.");
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
                const schoolResult = await api.validateSchoolUdiseCode(
                  schoolId
                );
                if (schoolResult?.status === "success") {
                  isSchoolValidInDB = true;
                } else {
                  errors.push("SCHOOL ID does not exist in the database.");
                  errors.push(...(schoolResult.errors || []));
                }
              }

              // If the school is valid, now check the class in the database
              if (isSchoolValidInDB) {
                const classValidationResponse =
                  await api.validateClassNameWithSchoolID(schoolId, className);
                if (classValidationResponse?.status === "error") {
                  errors.push(
                    `Class "${className}" for school "${schoolId}" was not found in the Class sheet AND does not exist in the database.`
                  );
                } else {
                  // Success! The class exists in the DB. Cache it to avoid re-checking.
                  validatedSchoolClassPairs.add(schoolClassKey);
                }
              }
            }
          }

          if (teacherContact && !validateEmailOrPhone(teacherContact)) {
            errors.push("Invalid TEACHER PHONE NUMBER OR EMAIL format.");
          }

          if (!className || className.trim() === "") {
            errors.push("Class name should not be empty");
          }
          if (errors.length > 0) {
            row["Updated"] = createStyledCell(
              `❌ Errors: ${errors.join(", ")}`,
              true
            );
            validSheetCountRef.current = 1;
          } else {
            row["Updated"] = createStyledCell("✅ Teacher Validated", false);
          }
        }
      }
      // **Student Sheet Validation**
      if (sheet.toLowerCase().includes("student")) {
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
          studentName: string,
          schoolId: string,
          studentId: string | undefined,
          errors: string[]
        ) {
          if (!studentLoginType || studentLoginType.trim() === "") {
            errors.push(
              "Student login type is missing for this school. Please check the school details."
            );
            return;
          }
          if (
            studentLoginType === "PARENT PHONE NUMBER" ||
            studentLoginType === "parent_phone_number"
          ) {
            if (!parentContact) {
              errors.push(
                "PARENT PHONE NUMBER OR LOGIN ID is required for this school's login type."
              );
            } else if (!/^\d{10}$/.test(parentContact)) {
              errors.push(
                "PARENT PHONE NUMBER must be a valid 10-digit mobile number."
              );
            } else {
              try {
                const result = await api.validateParentAndStudentInClass(
                  parentContact,
                  studentName,
                  className,
                  schoolId
                );
                if (result?.status === "error") {
                  if (result.message) errors.push(result.message);
                  if (result.errors && result.errors.length > 0) {
                    errors.push(...result.errors);
                  }
                }
              } catch (e) {
                errors.push(
                  "Server error validating parent/student class link."
                );
              }
            }
          } else {
            if (!studentId || studentId.trim() === "") {
              errors.push(
                "STUDENT ID is required for this school's login type."
              );
            }
            try {
              const result = await api.validateStudentInClassWithoutPhone(
                studentName,
                className,
                schoolId
              );
              if (result?.status === "error") {
                if (result.message) errors.push(result.message);
                if (result.errors && result.errors.length > 0) {
                  errors.push(...result.errors);
                }
              }
            } catch (e) {
              errors.push("Error while validating student in class.");
            }
          }
        }

        // --- Start processing each row in the Student sheet ---
        for (const row of processedData) {
          let errors: string[] = [];
          const schoolId = row["SCHOOL ID"]?.toString().trim();
          const studentId = row["STUDENT ID"]?.toString().trim();
          const studentName = row["STUDENT NAME"]?.toString().trim();
          const gender = row["GENDER"]?.toString().trim();
          let age = row["AGE"]?.toString().trim();
          let grade = row["GRADE"]?.toString().trim();
          const classSection = row["CLASS SECTION"]?.toString().trim() ?? "";
          const parentContact = row["PARENT PHONE NUMBER OR LOGIN ID"]
            ?.toString()
            .trim();
          const className = `${grade}${classSection}`.trim();
          const schoolClassKey = `${schoolId}_${className}`;
          const classId = `${schoolId}_${grade}_${classSection}`.trim();

          if (!studentName) errors.push("Missing STUDENT NAME.");
          if (!gender) {
            errors.push("Missing GENDER.");
          } else if (!["MALE", "FEMALE"].includes(gender.toUpperCase())) {
            errors.push('Invalid GENDER. Must be "MALE" or "FEMALE".');
          }
          if (!/^\d+$/.test(age)) {
            errors.push("AGE must be a whole number.");
          } else {
            const numericAge = parseInt(age, 10);
            if (numericAge < 2 || numericAge > 10)
              errors.push("AGE must be between 2 and 10.");
          }
          if (!/^\d+$/.test(grade)) {
            errors.push("GRADE must be a whole number.");
          } else {
            const numericGrade = parseInt(grade, 10);
            if (numericGrade < 0 || numericGrade > 5)
              errors.push("GRADE must be between 0 and 5.");
          }
          if (!className)
            errors.push("Class details (Grade/Section) are required.");

          // --- In-sheet duplicate checks ---
          if (studentName && classId) {
            const nameClassKey = `${studentName}_${classId}`.toLowerCase();
            if (seenNameClassCombos.has(nameClassKey)) {
              errors.push(
                "Duplicate student name in the same class within this sheet."
              );
            } else {
              seenNameClassCombos.add(nameClassKey);
            }
          }
          const identifier = parentContact || studentId;
          if (identifier && classId) {
            const classIdentifierKey = `${classId}_${identifier}`.toLowerCase();
            if (seenClassIdCombos.has(classIdentifierKey)) {
              errors.push(
                "Duplicate Parent Phone/Student ID in the same class within this sheet."
              );
            } else {
              seenClassIdCombos.add(classIdentifierKey);
            }
          }

          // 3. Main Conditional Validation Logic
          if (!schoolId) {
            errors.push("Missing SCHOOL ID.");
          } else {
            // Validate the class first (from sheet or DB)
            let isClassValid = validatedSchoolClassPairs.has(schoolClassKey);
            if (!isClassValid) {
              const classValidationResponse =
                await api.validateClassNameWithSchoolID(schoolId, className);
              if (classValidationResponse?.status === "success") {
                isClassValid = true;
                validatedSchoolClassPairs.add(schoolClassKey);
              } else {
                errors.push(
                  `Class "${className}" for school "${schoolId}" was not found in the Class sheet or the database.`
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
                  const schoolDetailsResult = await api.getSchoolDetailsByUdise(
                    schoolId
                  );
                  if (!schoolDetailsResult) {
                    errors.push(`School ID ${schoolId} not found in database.`);
                  } else {
                    schoolModel =
                      schoolDetailsResult.schoolModel?.toUpperCase();
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
                    `Could not determine Program Model for School ID ${schoolId}.`
                  );
              } else if (isNewClassForThisUpload) {
                // LOGIC FOR A **NEW CLASS**: Only perform FORMAT validation.
                if (
                  schoolModel !== "AT_SCHOOL" &&
                  schoolModel !== "at_school"
                ) {
                  if (!studentLoginType) {
                    errors.push(
                      `Could not determine STUDENT LOGIN TYPE for school ${schoolId}.`
                    );
                  } else if (
                    studentLoginType.toUpperCase() === "PARENT PHONE NUMBER"
                  ) {
                    if (!parentContact)
                      errors.push(
                        "PARENT PHONE NUMBER OR LOGIN ID is required for this school's login type."
                      );
                    else if (!/^\d{10}$/.test(parentContact))
                      errors.push(
                        "PARENT PHONE NUMBER must be a valid 10-digit mobile number."
                      );
                  } else {
                    if (!studentId || studentId.trim() === "")
                      errors.push(
                        "STUDENT ID is required for this school's login type."
                      );
                  }
                }
              } else {
                // LOGIC FOR AN **EXISTING CLASS**: Safe to call database validation.
                if (
                  schoolModel === "AT SCHOOL" ||
                  schoolModel === "at_school" ||
                  schoolModel === "AT_SCHOOL"
                ) {
                  const result = await api.validateStudentInClassWithoutPhone(
                    studentName,
                    className,
                    schoolId
                  );
                  if (result?.status === "error") {
                    errors.push(
                      ...(result.errors || [
                        result.message || "Validation failed.",
                      ])
                    );
                  }
                } else {
                  await validateStudentData(
                    studentLoginType,
                    parentContact,
                    className,
                    studentName,
                    schoolId,
                    studentId,
                    errors
                  );
                }
              }
            }
          }

          if (errors.length > 0) {
            row["Updated"] = createStyledCell(
              `❌ Errors: ${[...new Set(errors)].join(", ")}`,
              true
            );
            validSheetCountRef.current = 1;
          } else {
            row["Updated"] = createStyledCell("✅ Student Validated", false);
          }
        }
      }

      const updatedSheet = XLSX.utils.json_to_sheet(processedData);
      workbook.Sheets[sheet] = updatedSheet;

      if (sheet === "School") validatedSheets.school = processedData;
      else if (sheet === "Class") validatedSheets.class = processedData;
      else if (sheet === "Teacher") validatedSheets.teacher = processedData;
      else if (sheet === "Student") validatedSheets.student = processedData;
    }

    const output = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });
    processedDataRef.current = output;
    progressRef.current = 80;
    setVerifyingProgressState(progressRef.current);

    const isValidSheetCount =
      validSheetCountRef.current !== null && validSheetCountRef.current > 0;
    if (!isValidSheetCount) {
      setIsProcessing(false);
      validSheetCountRef.current = 0;
    }
    // When validations are complete
    let payload = generateFinalPayload(
      validatedSheets.school,
      validatedSheets.class,
      validatedSheets.teacher,
      validatedSheets.student
    );
    setFinalPayload(payload);

    setIsProcessing(false);
    setIsVerifying(false);
  };

  const handleDownload = async () => {
    if (!processedDataRef.current) return;
    try {
      const blob = new Blob([processedDataRef.current], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      Util.handleBlobDownloadAndSave(blob, "ProcessedFile.xlsx");
      progressRef.current = 100;
      setVerifyingProgressState(progressRef.current);
    } catch (error) {
      console.error("Download failed:", error);
    }
  };

  const handleNext = async () => {
    setStep(FileUploadStep.Verifying);
    await processFile();
    const isValid =
      validSheetCountRef.current === 0 && validSheetCountRef.current !== null;
    if (isValid) {
      setStep(FileUploadStep.Verified);
      setIsVerified(true); // triggers upload in useEffect
    } else {
      setStep(FileUploadStep.Error);
    }
  };

  const renderUploadPage = () => (
    <div className="file-upload-page">
      <div className="file-upload-container">
        <div className="file-upload-header">{t("Upload a new file")}</div>
        <p className="file-upload-info">
          {t("Supported file type")} <strong>.xlsx</strong>
        </p>

        <label className="file-upload-box">
          <img src={UploadIcon} alt="Upload Icon" />
          <input
            type="file"
            className="file_upload_input_file"
            accept=".xlsx"
            onChange={handleFileUpload}
          />
          <p className="file-upload-text">
            <span>{t("Click to upload student data")}</span>
          </p>
          <p className="upload-file-size">{t("Maximum file size")} 50MB</p>
        </label>

        {file && (
          <div className="file-upload-preview">
            <div className="file-uploading-icon">📄</div>
            <div className="file-upload-view">
              <div className="file-uploading-header">
                <p className="file-upload-name">{file.name}</p>
                <button
                  onClick={() => setFile(null)}
                  className="file-upload-remove-btn"
                >
                  ✕
                </button>
              </div>
              <p className="file-upload-size">
                {(file.size / (1024 * 1024)).toFixed(2)} MB
              </p>

              <div className="file-upload-progress-container">
                <div className="file-upload-progress-bar">
                  <div
                    className="file-upload-progress"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
                <span className="file-upload-progress-text">{progress}%</span>
              </div>
            </div>
          </div>
        )}

        <div className="file-upload-button-group">
          {isProcessing ? (
            <button
              disabled
              className="file-upload-btn file-upload-disabled-btn"
            >
              {t("Processing...")}
            </button>
          ) : progress === 100 ? (
            <div className="file-upload-actions">
              <button
                onClick={onCancleClick}
                className="file-upload-btn file-upload-cancel-btn"
              >
                {t("Cancel")}
              </button>
              <div className="spacer"></div>
              <button
                onClick={handleNext}
                className="file-upload-btn file-upload-next-btn"
              >
                {t("Next")}
              </button>
            </div>
          ) : (
            <button
              onClick={onCancleClick}
              className="file-upload-btn file-upload-long-cancel-btn"
            >
              {t("Cancel")}
            </button>
          )}
        </div>
      </div>

      {!isReupload && (
        <a
          className="download-upload-template"
          onClick={() => Util.downloadFileFromUrl(BULK_UPLOAD_TEMPLATE_URL)}
        >
          <FaCloudDownloadAlt /> {t("Download Bulk Upload Template")}
        </a>
      )}
    </div>
  );

  // Render conditions at the end
  if (step === FileUploadStep.Verifying) {
    return (
      <VerificationInProgress
        progress={verifyingProgressState}
        title={t("Verifying Data...")}
        message={t(
          "We are checking your uploaded data for any errors. Please wait a moment."
        )}
      />
    );
  }

  if (step === FileUploadStep.Verified) {
    return (
      <VerifiedPage
        title={t("Verified")}
        message={t(
          "Your data has been successfully checked, and no errors were found."
        )}
      />
    );
  }

  if (step === FileUploadStep.Uploading) {
    return (
      <VerificationInProgress
        progress={90}
        title={t("Uploading Data...")}
        message={t("We are uploading your data. Please wait.")}
      />
    );
  }

  if (step === FileUploadStep.Uploaded) {
    return (
      <VerifiedPage
        title={t("Upload Successful")}
        message={t("Your data has been uploaded successfully.")}
      />
    );
  }

  if (step === FileUploadStep.UploadError) {
    return (
      <ErrorPage
        reUplod={() => onReuploadTriggered()}
        message={t(
          "Upload failed. Please try again later. You may retry or contact support if the problem continues."
        )}
        title={t("Unable to Upload File")}
      />
    );
  }

  if (validSheetCountRef.current !== 0 && validSheetCountRef.current !== null) {
    return (
      <ErrorPage
        handleDownload={() => handleDownload()}
        reUplod={() => onReuploadTriggered()}
      />
    );
  }

  return renderUploadPage();
};

export default FileUpload;
