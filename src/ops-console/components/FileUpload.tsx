import React, { useEffect, useRef, useState } from "react";
import * as XLSX from "xlsx";
import { Capacitor } from "@capacitor/core";
import "./FileUpload.css";
import UploadIcon from "../assets/icons/upload_icon.png";
import { FaCloudDownloadAlt } from "react-icons/fa";
import { t } from "i18next";
import { Util } from "../../utility/util";
import { ServiceConfig } from "../../services/ServiceConfig";
import { useLocation } from "react-router-dom";
import { OpsUtil } from "../OpsUtility/OpsUtil";
import VerifiedPage from "./FileVerifiedComponent";
import ErrorPage from "./FileErrorComponent";
import VerificationInProgress from "./VerificationInProgress";

const FileUpload: React.FC = () => {
  const api = ServiceConfig.getI()?.apiHandler;
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const validSheetCountRef = useRef<number | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [fileBuffer, setFileBuffer] = useState<ArrayBuffer | null>(null);
  const progressRef = useRef(10);
  const [verifyingProgressState, setVerifyingProgressState] = useState(10);
  const isReupload =
    new URLSearchParams(useLocation().search).get("reupload") === "true";
  const processedDataRef = useRef();

  useEffect(() => {
    setVerifyingProgressState(progressRef.current);
  }, [progressRef.current]);

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
  };
  const validateEmailOrPhone = (value: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (emailRegex.test(value)) {
      return true;
    }
    const phoneValidation = OpsUtil.validateAndFormatPhoneNumber(value, "IN");
    return phoneValidation.valid;
    // const phoneRegex = /^\d{10}$/; // Assuming 10-digit phone numbers
    // return emailRegex.test(value) || phoneRegex.test(value);
  };
  const processFile = async () => {
    if (!fileBuffer) return;
    progressRef.current = 40;
    setVerifyingProgressState(progressRef.current);
    const workbook = XLSX.read(fileBuffer, { type: "array" });

    let validatedSchoolIds: Set<string> = new Set(); // Store valid school IDs
    let validatedClassIds: Map<string, string> = new Map(); // Store valid school IDs
    let studentLoginType;

    for (const sheet of workbook.SheetNames) {
      const worksheet = workbook.Sheets[sheet];
      // Define this at the top of your processing function or scope
      const seenSchoolIds = new Set<string>();
      let processedData: Record<string, any>[] =
        XLSX.utils.sheet_to_json(worksheet);
      progressRef.current = 70;
      setVerifyingProgressState(progressRef.current);

      // **Check if it's a School Sheet**
      if (sheet.toLowerCase().includes("school")) {
        for (let row of processedData) {
          let errors: string[] = [];
          const schoolId = row["SCHOOL ID"]?.toString().trim();
          const schoolName = row["SCHOOL NAME"]?.toString().trim();
          const state = row["STATE"]?.toString().trim();
          const district = row["DISTRICT"]?.toString().trim();
          const block = row["BLOCK"]?.toString().trim();
          const cluster = row["CLUSTER"]?.toString().trim();
          const academicYear = row["SCHOOL ACADEMIC YEAR"]?.toString().trim();
          const programName = row["PROGRAM NAME"]?.toString().trim();
          const programModel = row["PROGRAM MODEL"]?.toString().trim();
          const programManagerPhone = row[
            "PROGRAM MANAGER EMAIL OR PHONE NUMBER"
          ]
            ?.toString()
            .trim();
          const fieldCoordinatorPhone = row[
            "FIELD COORDINATOR EMAIL OR PHONE NUMBER"
          ]
            ?.toString()
            .trim();
          const schoolInstructionLanguage = row["SCHOOL INSTRUCTION LANGUAGE"]
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
          studentLoginType = row["STUDENT LOGIN TYPE"]?.toString().trim();

          // ✅ Check for duplicate SCHOOL ID
          if (schoolId) {
            if (seenSchoolIds.has(schoolId)) {
              row["Updated"] = `❌ Duplicate SCHOOL ID found: ${schoolId}`;
              continue;
            } else {
              seenSchoolIds.add(schoolId);
            }
          }

          // Validate format
          if (
            programManagerPhone &&
            !validateEmailOrPhone(programManagerPhone)
          ) {
            errors.push("Invalid PROGRAM MANAGER EMAIL OR PHONE NUMBER format");
          }

          if (
            fieldCoordinatorPhone &&
            !validateEmailOrPhone(fieldCoordinatorPhone)
          ) {
            errors.push(
              "Invalid FIELD COORDINATOR EMAIL OR PHONE NUMBER format"
            );
          }
          if (principalPhone && !validateEmailOrPhone(principalPhone)) {
            errors.push("Invalid PRINCIPAL PHONE EMAIL OR PHONE NUMBER format");
          }
          if (
            schoolCoordinatorPhone &&
            !validateEmailOrPhone(schoolCoordinatorPhone)
          ) {
            errors.push(
              "Invalid School Coordinator EMAIL OR PHONE NUMBER format"
            );
          }

          // ✅ Only call validateUserContacts if at least one contact is present
          const hasProgramManagerContact = !!programManagerPhone?.trim();
          const hasFieldCoordinatorContact = !!fieldCoordinatorPhone?.trim();

          if (!hasProgramManagerContact && !hasFieldCoordinatorContact) {
            errors.push(
              "Missing both PROGRAM MANAGER and FIELD COORDINATOR contact information"
            );
          } else {
            if (!hasProgramManagerContact) {
              errors.push("Missing PROGRAM MANAGER contact information");
            }
            if (!hasFieldCoordinatorContact) {
              errors.push("Missing FIELD COORDINATOR contact information");
            }

            if (hasProgramManagerContact && hasFieldCoordinatorContact) {
              const contactValidation = await api.validateUserContacts(
                programManagerPhone.trim(),
                fieldCoordinatorPhone.trim()
              );
              if (contactValidation.status === "error") {
                errors.push(...(contactValidation.errors || []));
              }
            }
          }
          console.log("errors list 1", errors);
          // **Condition 1: If SCHOOL ID (UDISE Code) is present**
          if (schoolId) {
            // Validate only required fields
            if (!schoolName) errors.push("Missing SCHOOL NAME");
            if (!programManagerPhone)
              errors.push("Missing PROGRAM MANAGER EMAIL OR PHONE NUMBER");
            if (!fieldCoordinatorPhone)
              errors.push("Missing FIELD COORDINATOR EMAIL OR PHONE NUMBER");
            if (!schoolInstructionLanguage)
              errors.push(
                "Missing SCHOOL INSTRUCTION LANGUAGE or Invalid format"
              );
            if (!principalName) errors.push("Missing PRINCIPAL NAME");
            if (!principalPhone)
              errors.push("Missing PRINCIPAL PHONE NUMBER OR EMAIL ID");
            if (!studentLoginType?.trim())
              errors.push("Missing STUDENT LOGIN TYPE");

            // Call API for validation if all required fields are filled
            // if (errors.length === 0) {
            const schoolValidation = await api.validateSchoolData(
              schoolId,
              schoolName,
              schoolInstructionLanguage
            );
            console.log("fsdfdsfs", schoolValidation.status);

            if (schoolValidation.status === "error") {
              errors.push(...(schoolValidation.errors || []));
            } else {
              validatedSchoolIds.add(schoolId); // ✅ Store valid school IDs
            }
            // }
          }
          // **Condition 2: If SCHOOL ID (UDISE Code) is missing**
          else {
            // Validate all required fields
            if (!schoolName) errors.push("Missing SCHOOL NAME");
            if (!state) errors.push("Missing STATE");
            if (!district) errors.push("Missing DISTRICT");
            if (!block) errors.push("Missing BLOCK");
            if (!cluster) errors.push("Missing CLUSTER");
            if (!academicYear) errors.push("Missing SCHOOL ACADEMIC YEAR");
            if (!programName) errors.push("Missing PROGRAM NAME");
            if (!programModel) errors.push("Missing PROGRAM MODEL");
            if (!programManagerPhone)
              errors.push("Missing PROGRAM MANAGER EMAIL OR PHONE NUMBER");
            if (!fieldCoordinatorPhone)
              errors.push("Missing FIELD COORDINATOR EMAIL OR PHONE NUMBER");
            if (!schoolInstructionLanguage)
              errors.push("Missing SCHOOL INSTRUCTION LANGUAGE");
            if (!principalName) errors.push("Missing PRINCIPAL NAME");
            if (!principalPhone)
              errors.push("Missing PRINCIPAL PHONE NUMBER OR EMAIL ID");
            if (!studentLoginType?.trim())
              errors.push("Missing STUDENT LOGIN TYPE");
          }
          console.log("fddfdsgfdgdg", errors);

          row["Updated"] =
            errors.length > 0
              ? `❌ Errors: ${errors.join(", ")}`
              : "✅ School Validated";
          if (errors.length > 0) {
            validSheetCountRef.current = 1;
          }
        }
      }

      // **Check if it's a Class Sheet**
      if (sheet.toLowerCase().includes("class")) {
        for (let row of processedData) {
          let errors: string[] = [];
          const schoolId = row["SCHOOL ID"]?.toString().trim();
          const grade = row["GRADE"]?.toString().trim();
          const classSection = row["CLASS SECTION"]?.toString().trim();
          const subjectGrade = row["SUBJECT GRADE"]?.toString().trim();
          const curriculum = row["CURICULLUM"]?.toString().trim();
          const subject = row["SUBJECT"]?.toString().trim();
          const studentCount = row["STUDENTS COUNT IN CLASS"]
            ?.toString()
            .trim();
          const className = `${grade} ${classSection}`.trim();
          console.log("fddfdsgfdgdg23", validatedSchoolIds);
          if (!grade) errors.push("Missing grade");
          if (!subjectGrade) errors.push("Missing subjectGrade");
          if (!curriculum) errors.push("Missing curriculum");
          if (!subject) errors.push("Missing subject");
          if (!studentCount) errors.push("Missing studentCount");

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
              errors.push("SCHOOL ID does not match any validated school.");
            }
          }
          const validationResponse =
            await api.validateClassCurriculumAndSubject(curriculum, subject);
          if (validationResponse.status === "error") {
            errors.push(...(validationResponse.errors || []));
          }
          row["Updated"] =
            errors.length > 0
              ? `❌ Errors: ${errors.join(", ")}`
              : "✅ Class Validated";
          if (errors.length > 0) {
            validSheetCountRef.current = 2;
          }
        }
      }
      // **Teacher Sheet Validation**
      if (sheet.toLowerCase().includes("teacher")) {
        for (let row of processedData) {
          let errors: string[] = [];
          const schoolId = row["SCHOOL ID"]?.toString().trim();
          const grade = row["GRADE"]?.toString().trim();
          const classSection = row["CLASS SECTION"]
            ? row["CLASS SECTION"].toString().trim()
            : "";
          const teacherName = row["TEACHER NAME"]?.toString().trim();
          const teacherContact = row["TEACHER PHONE NUMBER OR EMAIL"]
            ?.toString()
            .trim();
          const classId = `${schoolId}_${grade}_${classSection}`;
          const className = `${grade} ${classSection}`.trim();
          if (!grade) errors.push("Missing grade");

          if (!schoolId || !grade || !teacherName || !teacherContact) {
            errors.push("Missing required teacher details.");
          } else {
            if (!validatedSchoolIds.has(schoolId)) {
              errors.push("SCHOOL ID does not match any validated school.");
            }
          }

          if (teacherContact && !validateEmailOrPhone(teacherContact)) {
            errors.push("Invalid TEACHER PHONE NUMBER OR EMAIL format.");
          }

          // Check if classId exists and className matches
          if (
            validatedClassIds.has(classId) &&
            validatedClassIds.get(classId) === className
          ) {
            console.log(
              `Skipping API call for class ${classId} as it's already validated.`
            );
          } else {
            const validationResponse = await api.validateClassExistence(
              schoolId,
              className
            );
            if (validationResponse.status === "error") {
              errors.push(...(validationResponse.errors || []));
            } else {
              validatedClassIds.set(classId, className); // ✅ Store valid class ID and name
            }
          }

          row["Updated"] =
            errors.length > 0
              ? `❌ Errors: ${errors.join(", ")}`
              : "✅ Teacher Validated";
          if (errors.length > 0) {
            validSheetCountRef.current = 3;
          }
        }
      }

      // **Student Sheet Validation**
      if (sheet.toLowerCase().includes("student")) {
        for (let row of processedData) {
          let errors: string[] = [];
          const schoolId = row["SCHOOL ID"]?.toString().trim();
          const studentId = row["STUDENT ID"]?.toString().trim();
          const studentName = row["STUDENT NAME"]?.toString().trim();
          const gender = row["GENDER"]?.toString().trim();
          let age = row["AGE"]?.toString().trim();
          // Validate age
          if (!/^\d+$/.test(age)) {
            errors.push(
              "AGE must be a whole number without letters or special characters."
            );
          } else {
            const numericAge = parseInt(age, 10);
            if (numericAge < 0) {
              errors.push("AGE cannot be negative.");
            } else if (numericAge > 10) {
              age = "10"; // Cap the age at 10
            } else {
              age = numericAge.toString();
            }
          }
          const grade = row["GRADE"]?.toString().trim();
          const classSection = row["CLASS SECTION"]
            ? row["CLASS SECTION"].toString().trim()
            : "";
          const parentContact = row["PARENT PHONE NUMBER OR LOGIN ID"]
            ?.toString()
            .trim();
          const classId = `${schoolId}_${grade}_${classSection}`; // Unique class identifier
          const className = `${grade} ${classSection}`.trim();
          if (!grade) errors.push("Missing grade");
          
          if (!schoolId || !studentName || !age || !grade || !parentContact) {
            errors.push("Missing required student details.");
          } else {
            if (!validatedSchoolIds.has(schoolId)) {
              errors.push("SCHOOL ID does not match any validated school.");
            }
          } 

          if(studentLoginType === "PARENT PHONE NUMBER"){
            if (parentContact && !validateEmailOrPhone(parentContact)) {
              errors.push("Invalid PARENT PHONE NUMBER OR LOGIN ID format.");
            }
          }

          // Check if classId exists and className matches
          if (
            validatedClassIds.has(classId) &&
            validatedClassIds.get(classId) === className
          ) {
            console.log(
              `Skipping API call for class ${classId} as it's already validated.`
            );
          } else {
            const validationResponse = await api.validateClassExistence(
              schoolId,
              className,
              studentName
            );
            if (validationResponse.status === "error") {
              errors.push(...(validationResponse.errors || []));
            } else {
              validatedClassIds.set(classId, className); // ✅ Store valid class ID and name
            }
          }

          row["Updated"] =
            errors.length > 0
              ? `❌ Errors: ${errors.join(", ")}`
              : "✅ Student Validated";
          if (errors.length > 0) {
            validSheetCountRef.current = 4;
          }
        }
      }
      // **Update sheet with validation messages**
      const updatedSheet = XLSX.utils.json_to_sheet(processedData);
      workbook.Sheets[sheet] = updatedSheet;
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

    setIsProcessing(false);
    setIsVerifying(false);
    return XLSX.write(workbook, { bookType: "xlsx", type: "array" });
  };

  const handleDownload = async () => {
    if (!processedDataRef.current) return;
    try {
      const blob = new Blob([processedDataRef.current], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      if (Capacitor.isNativePlatform()) {
        const fileDataBase64 = await blobToBase64(blob);
        await Util.triggerSaveProceesedXlsxFile({ fileData: fileDataBase64 });
        progressRef.current = 100;
        setVerifyingProgressState(progressRef.current);
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "processed_data.xlsx";
        document.body.appendChild(a);
        a.click();
        URL.revokeObjectURL(url);
        progressRef.current = 100;
        setVerifyingProgressState(progressRef.current);
      }
    } catch (error) {
      console.error("Download failed:", error);
    }
  };

  function blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onloadend = () => {
        const base64Data = reader.result as string;
        resolve(base64Data.split(",")[1]);
      };
      reader.onerror = reject;
    });
  }

  const handleNext = async () => {
    setIsVerifying(true);
    await processFile();
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
            <span>{t("Click to upload")}</span> {t("Student Data")}
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
              <button className="file-upload-btn file-upload-cancel-btn">
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
              onClick={() => setFile(null)}
              className="file-upload-btn file-upload-long-cancel-btn"
            >
              {t("Cancel")}
            </button>
          )}
        </div>
      </div>

      {!isReupload && (
        <a href="#" className="download-upload-template">
          <FaCloudDownloadAlt /> {t("Download Bulk Upload Template")}
        </a>
      )}
    </div>
  );

  // Render conditions at the end
  if (isVerifying && !isProcessing) {
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
  if (validSheetCountRef.current == 0 && validSheetCountRef.current !== null) {
    return (
      <VerifiedPage
        title={t("Verified")}
        message={t(
          "Your data has been successfully checked, and no errors were found."
        )}
      />
    );
  }

  if (validSheetCountRef.current !== 0 && validSheetCountRef.current !== null) {
    return <ErrorPage handleDownload={() => handleDownload()} />;
  }

  return renderUploadPage();
};

export default FileUpload;
