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
  const processedDataRef = useRef();
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
    let validatedProgramNames = new Set<string>();

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
          const contactValidationErrors = new Map<string, string[]>(); // Store DB validation errors by contact
          const collectedPMs: string[] = [];
          const collectedFCs: string[] = [];
          const seenPMContacts = new Set<string>();
          const seenFCContacts = new Set<string>();

          // --- Pass 1: Collect contacts, check formats and in-sheet duplicates (ROW-SPECIFIC) ---
          for (const row of schoolRows) {
            const pmPhone = row["PROGRAM MANAGER EMAIL OR PHONE NUMBER"]
              ?.toString()
              .trim();
            const fcPhone = row["FIELD COORDINATOR EMAIL OR PHONE NUMBER"]
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

            // ✅ SOLUTION: Add this 'if' check.
            // Only proceed with FC validation if a PM exists to validate against.
            if (firstPM) {
              for (const fc of seenFCContacts) {
                // Now TypeScript knows `firstPM` is a `string` inside this block.
                const validation = await api.validateUserContacts(firstPM, fc);
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
          }

          // --- Pass 2: Perform ALL other GROUP-LEVEL validations ---
          const schoolId = masterRow["SCHOOL ID"]?.toString().trim();
          const schoolName = masterRow["SCHOOL NAME"]?.toString().trim();
          const state = masterRow["STATE"]?.toString().trim();
          const district = masterRow["DISTRICT"]?.toString().trim();
          const block = masterRow["BLOCK"]?.toString().trim();
          const cluster = masterRow["CLUSTER"]?.toString().trim();
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
          const principalName = masterRow["PRINCIPAL NAME"]?.toString().trim();
          const principalPhone = masterRow["PRINCIPAL PHONE NUMBER OR EMAIL ID"]
            ?.toString()
            .trim();
          const schoolCoordinatorName = masterRow["SCHOOL COORDINATOR NAME"]
            ?.toString()
            .trim();
          const schoolCoordinatorPhone = masterRow[
            "SCHOOL COORDINATOR PHONE NUMBER OR EMAIL ID"
          ]
            ?.toString()
            .trim();
          const studentLoginType = masterRow["STUDENT LOGIN TYPE"]
            ?.toString()
            .trim();
          const isWhatsappEnabled = masterRow["IS WHATSAPP ENABLED"]
            ?.toString()
            .trim();

          if (schoolId && studentLoginType) {
            studentLoginTypeMap.set(schoolId, studentLoginType);
          }

          if (collectedPMs.length === 0)
            groupLevelErrors.push(
              "At least one unique Program Manager contact is required."
            );
          if (collectedFCs.length === 0)
            groupLevelErrors.push(
              "At least one unique Field Coordinator contact is required."
            );

          if (isWhatsappEnabled) {
            const validIsWhatsappEnabled = ["YES", "NO"];
            if (
              !validIsWhatsappEnabled.includes(isWhatsappEnabled.toUpperCase())
            ) {
              groupLevelErrors.push(
                'Invalid "IS WHATSAPP ENABLED" value. Must be "YES" or "NO".'
              );
            }
          } else {
            groupLevelErrors.push("Missing IS WHATSAPP ENABLED information");
          }

          if (programModel) {
            const validProgramModels = ["AT HOME", "AT SCHOOL", "HYBRID"];
            if (!validProgramModels.includes(programModel.toUpperCase())) {
              groupLevelErrors.push(
                'Invalid PROGRAM MODEL. Must be "AT HOME", "AT SCHOOL", or "HYBRID".'
              );
            }
          }

          if (programName) {
            const programValidation =
              await api.validateProgramName(programName);
            if (programValidation.status === "error") {
              groupLevelErrors.push(
                ...(programValidation.errors || [
                  "Program name not found in database",
                ])
              );
            } else {
              validatedProgramNames.add(programName);
            }
          } else {
            groupLevelErrors.push("Missing PROGRAM NAME");
          }

          if (principalPhone && !validateEmailOrPhone(principalPhone)) {
            groupLevelErrors.push(
              "Invalid PRINCIPAL PHONE NUMBER OR EMAIL ID format"
            );
          }
          if (
            schoolCoordinatorPhone &&
            !validateEmailOrPhone(schoolCoordinatorPhone)
          ) {
            groupLevelErrors.push(
              "Invalid SCHOOL COORDINATOR PHONE NUMBER OR EMAIL ID format"
            );
          }

          if (schoolId) {
            let schoolValidation;
            if (schoolName) {
              schoolValidation = await api.validateSchoolData(
                schoolId,
                schoolName
              );
            } else {
              groupLevelErrors.push("Missing SCHOOL NAME");
            }
            if (schoolValidation && schoolValidation.status === "error") {
              groupLevelErrors.push(...(schoolValidation.errors || []));
            } else if (schoolValidation) {
              validatedSchoolIds.add(schoolId);
            }
            if (!academicYear)
              groupLevelErrors.push("Missing SCHOOL ACADEMIC YEAR");
             if (!programName) groupLevelErrors.push("Missing PROGRAM NAME");
            if (!programModel) groupLevelErrors.push("Missing PROGRAM MODEL");
            if (!schoolInstructionLanguage)
              groupLevelErrors.push("Missing SCHOOL INSTRUCTION LANGUAGE");
            if (!principalName) groupLevelErrors.push("Missing PRINCIPAL NAME");
            if (!principalPhone)
              groupLevelErrors.push(
                "Missing PRINCIPAL PHONE NUMBER OR EMAIL ID"
              );
            if (!studentLoginType?.trim())
              groupLevelErrors.push("Missing STUDENT LOGIN TYPE");
          } else {
            if (!schoolName) groupLevelErrors.push("Missing SCHOOL NAME");
            if (!state) groupLevelErrors.push("Missing STATE");
            if (!district) groupLevelErrors.push("Missing DISTRICT");
            if (!block) groupLevelErrors.push("Missing BLOCK");
            if (!cluster) groupLevelErrors.push("Missing CLUSTER");
            if (!academicYear)
              groupLevelErrors.push("Missing SCHOOL ACADEMIC YEAR");
            if (!programName) groupLevelErrors.push("Missing PROGRAM NAME");
            if (!programModel) groupLevelErrors.push("Missing PROGRAM MODEL");
            if (!schoolInstructionLanguage)
              groupLevelErrors.push("Missing SCHOOL INSTRUCTION LANGUAGE");
            if (!principalName) groupLevelErrors.push("Missing PRINCIPAL NAME");
            if (!principalPhone)
              groupLevelErrors.push(
                "Missing PRINCIPAL PHONE NUMBER OR EMAIL ID"
              );
            if (!studentLoginType?.trim())
              groupLevelErrors.push("Missing STUDENT LOGIN TYPE");
          }

          // --- Pass 3: Apply final status messages by combining all error sources for each row ---
          const hasGroupErrors = groupLevelErrors.length > 0;
          const hasRowErrors = rowSpecificErrors.size > 0;
          const hasContactDBErrors = contactValidationErrors.size > 0;

          if (hasGroupErrors || hasRowErrors || hasContactDBErrors) {
            validSheetCountRef.current = 1;
            for (const row of schoolRows) {
              const allErrorsForRow: string[] = [];

              // 1. Add group-level errors (apply to all rows in the group)
              allErrorsForRow.push(...groupLevelErrors);

              // 2. Add row-specific errors (duplicates, format issues)
              const specificErrs = rowSpecificErrors.get(row.__rowNum);
              if (specificErrs) {
                allErrorsForRow.push(...specificErrs);
              }

              // 3. Add DB validation errors for contacts on this specific row
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
                // This row is valid, but others in its group might have errors.
                row["Updated"] = createStyledCell(
                  "✅ This row is valid, but the school group has other errors.",
                  false
                );
              }
            }
          } else {
            // Success case: No errors in the entire group
            const successMessage = createStyledCell(
              "✅ School and all contacts validated",
              false
            );
            schoolRows.forEach((row) => (row["Updated"] = successMessage));
            masterRow.programManagers = collectedPMs;
            masterRow.fieldCoordinators = collectedFCs;
            masterSchoolRowsForPayload.push(masterRow);
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
        for (let row of processedData) {
          let errors: string[] = [];
          const schoolId = row["SCHOOL ID"]?.toString().trim();
          let grade = row["GRADE"]?.toString().trim();
          const classSection = row["CLASS SECTION"]
            ? row["CLASS SECTION"].toString().trim()
            : "";
          const teacherName = row["TEACHER NAME"]?.toString().trim();
          const teacherContact = row["TEACHER PHONE NUMBER OR EMAIL"]
            ?.toString()
            .trim();
          const classId = `${schoolId}_${grade}_${classSection}`;

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

          if (!teacherName || teacherName.trim() === "")
            errors.push("Missing teacher Name");
          if (!teacherContact || teacherContact.trim() === "")
            errors.push("Missing teacher Contact");

          if (!schoolId || schoolId.trim() === "") {
            errors.push("Missing schoolId.");
          } else {
            if (!validatedSchoolIds.has(schoolId)) {
              const result = await api.validateSchoolUdiseCode(schoolId);
              if (result?.status === "error") {
                errors.push("SCHOOL ID does not match any validated school.");
                errors.push(...(result.errors || []));
              } else if (className && schoolId) {
                const schoolClassKey = `${schoolId}_${className}`;
                if (!validatedSchoolClassPairs.has(schoolClassKey)) {
                  // Validate class name and schoolId pair from server if not validated already
                  const classValidationResponse =
                    await api.validateClassNameWithSchoolID(
                      schoolId,
                      className
                    );
                  if (classValidationResponse?.status === "error") {
                    errors.push(
                      "Class name does not exist for the given school ID."
                    );
                    errors.push(...(classValidationResponse.errors || []));
                  } else {
                    // Store valid school and class pairs
                    validatedSchoolClassPairs.add(schoolClassKey);
                  }
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

        for (let row of processedData) {
          let errors: string[] = [];

          const schoolId = row["SCHOOL ID"]?.toString().trim();
          const studentId = row["STUDENT ID"]?.toString().trim();
          const studentName = row["STUDENT NAME"]?.toString().trim();
          const gender = row["GENDER"]?.toString().trim();
          let age = row["AGE"]?.toString().trim();

          let grade = row["GRADE"]?.toString().trim();
          const classSection = row["CLASS SECTION"]
            ? row["CLASS SECTION"].toString().trim()
            : "";
          const parentContact = row["PARENT PHONE NUMBER OR LOGIN ID"]
            ?.toString()
            .trim();

          const className = `${grade}${classSection}`.trim();
          const classId = `${schoolId}_${grade}_${classSection}`.trim();

          // ---------- ✅ Duplicate within sheet check ----------
          const nameClassKey = `${studentName}_${classId}`.toLowerCase();
          const classPhoneOrIdKey =
            `${classId}_${parentContact || studentId}`.toLowerCase();

          if (seenNameClassCombos.has(nameClassKey)) {
            errors.push(
              "Duplicate student name in the same class within the sheet."
            );
          } else {
            seenNameClassCombos.add(nameClassKey);
          }

          if (seenClassIdCombos.has(classPhoneOrIdKey)) {
            errors.push(
              "Duplicate student identifier (phone or ID) in the same class within the sheet."
            );
          } else {
            seenClassIdCombos.add(classPhoneOrIdKey);
          }

          if (!gender) {
            errors.push("Missing GENDER.");
          } else {
            const validGenders = ["MALE", "FEMALE"];
            if (!validGenders.includes(gender.toUpperCase())) {
              errors.push('Invalid GENDER. Must be "MALE" or "FEMALE".');
            }
          }

          // ---------- ✅ Age & Grade validation  ----------
          if (!/^\d+$/.test(age)) {
            errors.push(
              "AGE must be a whole number without letters or special characters."
            );
          } else {
            const numericAge = parseInt(age, 10);
            if (numericAge < 2) {
              errors.push("AGE cannot be negative or less than 2.");
            } else if (numericAge > 10) {
              errors.push("AGE cannot be more than 10.");
            } else {
              age = numericAge.toString();
            }
          }

          if (!grade || grade.trim() === "") {
            errors.push("Missing GRADE.");
          } else if (!/^\d+$/.test(grade)) {
            errors.push("GRADE must be a whole number.");
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

          if (!className || className.trim() === "") {
            errors.push("Class name should not be empty");
          }
          if (!studentName || studentName.trim() === "")
            errors.push("Missing student Name");
          if (!schoolId || schoolId.trim() === "") {
            errors.push("Missing schoolId.");
          } else {
            // ---------- ✅  UDISE + backend validations ----------
            async function validateStudentData(
              studentLoginType: string | undefined,
              parentContact: string,
              className: string,
              studentName: string,
              schoolId: string,
              studentId: string | undefined,
              errors: string[]
            ) {
              if (studentLoginType === "PARENT PHONE NUMBER") {
                if (parentContact && !/^\d{10}$/.test(parentContact)) {
                  errors.push(
                    "PARENT PHONE NUMBER must be a valid 10-digit mobile number."
                  );
                } else if (/^\d{10}$/.test(parentContact)) {
                  try {
                    const result = await api.validateParentAndStudentInClass(
                      parentContact,
                      className,
                      studentName,
                      schoolId
                    );
                    if (result?.status === "error") {
                      errors.push(...(result.errors || []));
                    }
                  } catch (e) {
                    errors.push(
                      "Server error validating parent/student class link"
                    );
                  }
                }
              } else {
                if (!studentId || studentId.trim() === "") {
                  errors.push("Missing student ID.");
                }
                try {
                  const result = await api.validateStudentInClassWithoutPhone(
                    studentName,
                    className,
                    schoolId
                  );
                  if (result?.status === "error") {
                    errors.push(...(result.errors || []));
                  }
                } catch (e) {
                  errors.push("error while validating student in class");
                }
              }
            }

            if (!validatedSchoolIds.has(schoolId)) {
              const result = await api.validateSchoolUdiseCode(schoolId);
              if (result?.status === "error") {
                errors.push("SCHOOL ID does not match any validated school.");
                errors.push(...(result.errors || []));
              } else {
                const studentLoginType = studentLoginTypeMap.get(schoolId);
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
            } else {
              const studentLoginType = studentLoginTypeMap.get(schoolId);
              if (studentLoginType === "PARENT PHONE NUMBER") {
                if (parentContact && !/^\d{10}$/.test(parentContact)) {
                  errors.push(
                    "PARENT PHONE NUMBER must be a valid 10-digit mobile number."
                  );
                }
              } else {
                if (!studentId || studentId.trim() === "") {
                  errors.push("Missing student ID.");
                }
              }
            }
          }
          if (errors.length > 0) {
            row["Updated"] = createStyledCell(
              `❌ Errors: ${errors.join(", ")}`,
              true
            );
            validSheetCountRef.current = 1;
          } else {
            row["Updated"] = createStyledCell("✅ Student Validated", false);
          }
        }
      }
      // **Update sheet with validation messages**
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
