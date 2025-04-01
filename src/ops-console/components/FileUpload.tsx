import React, { useEffect, useRef, useState } from "react";
import * as XLSX from "xlsx";
import { Capacitor } from "@capacitor/core";
import "./FileUpload.css";
import UploadIcon from "../assets/icons/upload_icon.png";
import { FaCloudDownloadAlt } from "react-icons/fa";
import { t } from "i18next";
import { Util } from "../../utility/util";
import { CiRedo } from "react-icons/ci";
import { ServiceConfig } from "../../services/ServiceConfig";

const FileUpload: React.FC = () => {
  const api = ServiceConfig.getI()?.apiHandler;
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [fileBuffer, setFileBuffer] = useState<ArrayBuffer | null>(null);
  const progressRef = useRef(10);
  const [verifyingProgressState, setVerifyingProgressState] = useState(10);

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
    const phoneRegex = /^\d{10}$/; // Assuming 10-digit phone numbers
    console.log("fsdfscsf", emailRegex.test(value), phoneRegex.test(value));
    return emailRegex.test(value) || phoneRegex.test(value);
  };
  const processFile = async () => {
    if (!fileBuffer) return;
    progressRef.current = 40;
    setVerifyingProgressState(progressRef.current);
    const workbook = XLSX.read(fileBuffer, { type: "array" });

    let validatedSchoolIds: Set<string> = new Set(); // Store valid school IDs

    for (const sheet of workbook.SheetNames) {
      const worksheet = workbook.Sheets[sheet];
      let data: Record<string, any>[] = XLSX.utils.sheet_to_json(worksheet);
      progressRef.current = 70;
      setVerifyingProgressState(progressRef.current);

      // **Check if it's a School Sheet**
      if (sheet.toLowerCase().includes("school")) {
        for (let row of data) {
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
          const studentLoginType = row["STUDENT LOGIN TYPE"]?.toString().trim();

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
          const validationResponse = await api.validateUserContacts(programManagerPhone, fieldCoordinatorPhone );
          console.log(validationResponse); 
          if (validationResponse.status === "error") {
            errors.push(...(validationResponse.errors || []));
          }


          // **Condition 1: If SCHOOL ID (UDISE Code) is present**
          if (schoolId) {
            // Validate only required fields
            if (!schoolName) errors.push("Missing SCHOOL NAME");
            if (!schoolInstructionLanguage)
              errors.push("Missing SCHOOL INSTRUCTION LANGUAGE");

            // Call API for validation if all required fields are filled
            if (errors.length === 0) {
              const validationResponse = await api.validateSchoolData(
                schoolId,
                schoolName,
                schoolInstructionLanguage
              );
              if (validationResponse.status === "error") {
                errors.push(...(validationResponse.errors || []));
              } else {
                validatedSchoolIds.add(schoolId); // ✅ Store valid school IDs
              }
            }
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
            if (!studentLoginType) errors.push("Missing STUDENT LOGIN TYPE");
          }
          row["Updated"] =
            errors.length > 0
              ? `❌ Errors: ${errors.join(", ")}`
              : "✅ School Validated";
        }
      }

      // **Check if it's a Class Sheet**
      if (sheet.toLowerCase().includes("class")) {
        for (let row of data) {
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
          if (
            !schoolId ||
            !grade ||
            !subjectGrade ||
            !curriculum ||
            !subject ||
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
        }
      }
      // **Teacher Sheet Validation**
      if (sheet.toLowerCase().includes("teacher")) {
        for (let row of data) {
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
          const className = `${grade} ${classSection}`.trim();
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
          const validationResponse = await api.validateClassExistence(
            schoolId,
            className
          );
          if (validationResponse.status === "error") {
            errors.push(...(validationResponse.errors || []));
          }
          row["Updated"] =
            errors.length > 0
              ? `❌ Errors: ${errors.join(", ")}`
              : "✅ Teacher Validated";
        }
      }

      // **Student Sheet Validation**
      if (sheet.toLowerCase().includes("student")) {
        for (let row of data) {
          let errors: string[] = [];
          const schoolId = row["SCHOOL ID"]?.toString().trim();
          const studentId = row["STUDENT ID"]?.toString().trim();
          const studentName = row["STUDENT NAME"]?.toString().trim();
          const gender = row["GENDER"]?.toString().trim();
          const age = row["AGE"]?.toString().trim();
          const grade = row["GRADE"]?.toString().trim();
          const classSection = row["CLASS SECTION"]
            ? row["CLASS SECTION"].toString().trim()
            : "";
          const parentContact = row["PARENT PHONE NUMBER OR LOGIN ID"]
            ?.toString()
            .trim();
          const className = `${grade} ${classSection}`.trim();

          if (!schoolId || !studentName || !age || !grade || !parentContact) {
            errors.push("Missing required student details.");
          } else {
            if (!validatedSchoolIds.has(schoolId)) {
              errors.push("SCHOOL ID does not match any validated school.");
            }
          }
          if (parentContact && !validateEmailOrPhone(parentContact)) {
            errors.push("Invalid PARENT PHONE NUMBER OR LOGIN ID format.");
          }

          const validationResponse = await api.validateClassExistence(
            schoolId,
            className,
            studentName
          );
          if (validationResponse.status === "error") {
            errors.push(...(validationResponse.errors || []));
          }

          row["Updated"] =
            errors.length > 0
              ? `❌ Errors: ${errors.join(", ")}`
              : "✅ Student Validated";
        }
      }

      // **Update sheet with validation messages**
      const updatedSheet = XLSX.utils.json_to_sheet(data);
      workbook.Sheets[sheet] = updatedSheet;
    }
    const processedData = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });
    progressRef.current = 80;
    setVerifyingProgressState(progressRef.current);
    setIsProcessing(false);
    handleDownload(processedData);
    return XLSX.write(workbook, { bookType: "xlsx", type: "array" });
  };

  const handleDownload = async (processedData: ArrayBuffer) => {
    if (!processedData) return;
    try {
      const blob = new Blob([processedData], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      if (Capacitor.isNativePlatform()) {
        const fileDataBase64 = await blobToBase64(blob);
        await Util.triggerSaveProceesedXlsxFile({ fileData: fileDataBase64 });
        progressRef.current = 100;
        setVerifyingProgressState(progressRef.current);
        setTimeout(() => {
          setIsVerifying(false);
        }, 8000);
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
        setTimeout(() => {
          setIsVerifying(false);
        }, 8000);
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

  if (isVerifying) {
    return (
      <div className="verification-page">
        <div className="verification-container">
          <div className="verification-main">
            <div className="verification-icon">
              <CiRedo className="rotating-icon" />
            </div>
            <div className="verification-progress-bar">
              <div
                className="verification-progress"
                style={{ width: `${verifyingProgressState}%` }}
              ></div>
            </div>
            <p className="verification-title">{t("Verifying Data...")}</p>
            <p>
              {t(
                "We are checking your uploaded data for any errors. Please wait a moment."
              )}
            </p>
          </div>
        </div>
      </div>
    );
  } else
    return (
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
        <a href="#" className="download-upload-template">
          <FaCloudDownloadAlt /> {t("Download Bulk Upload Template")}
        </a>
      </div>
    );
};

export default FileUpload;
