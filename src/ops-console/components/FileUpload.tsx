import React, { useEffect, useRef, useState } from "react";
import * as XLSX from "xlsx";
import { Capacitor } from "@capacitor/core";
import "./FileUpload.css";
import UploadIcon from "../assets/icons/upload_icon.png";
import { FaCloudDownloadAlt } from "react-icons/fa";
import { t } from "i18next";
import { Util } from "../../utility/util";
import { CiRedo } from "react-icons/ci";

const FileUpload: React.FC = () => {
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
  const processFile = async () => {
    if (!fileBuffer) return;
    progressRef.current = 40;
    setVerifyingProgressState(progressRef.current);

    try {
      const workbook = XLSX.read(fileBuffer, { type: "array" });
      workbook.SheetNames.forEach((sheet) => {
        const worksheet = workbook.Sheets[sheet];
        const data: Record<string, any>[] = XLSX.utils.sheet_to_json(worksheet);
        data.forEach((row) => (row["Updated"] = "✅ Processed"));
        const updatedSheet = XLSX.utils.json_to_sheet(data);
        progressRef.current = 70;
        setVerifyingProgressState(progressRef.current);

        workbook.Sheets[sheet] = updatedSheet;
      });

      const processedData = XLSX.write(workbook, {
        bookType: "xlsx",
        type: "array",
      });
      progressRef.current = 80;
      setVerifyingProgressState(progressRef.current);
      setIsProcessing(false);
      handleDownload(processedData);
    } catch (error) {
      console.error("Processing failed:", error);
      setIsProcessing(false);
    }
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
