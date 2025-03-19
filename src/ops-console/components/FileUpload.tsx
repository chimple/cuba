import { useState } from "react";
import "./FileUpload.css";
import UploadIcon from "../assets/icons/upload_icon.png";
import { FaCloudDownloadAlt } from "react-icons/fa";
import { IonPage } from "@ionic/react";

const FileUpload: React.FC = () => {
  const [file, setFile] = useState(null);
  const [progress, setProgress] = useState(0);

  return (
    <IonPage className="file-upload-page">
      <div className="file-upload-container">
        <div className="file-upload-header">Upload a new file</div>
        <p className="file-upload-info">
          Supported file type <strong> .xlxs</strong>
        </p>

        <label className="file-upload-box">
          <img src={UploadIcon} alt="Homework Icon" />
          <input
            type="file"
            className="file_upload_input_file"
            accept=".csv"
            onChange={() => {}}
          />
          {/* <UploadCloud className="upload-icon" size={40} /> */}
          <p className="upload-text">
            <span>Click to upload</span> xyz student data
          </p>
          <p className="upload-size">Maximum file size 50MB</p>
        </label>

        {file && (
          <div className="file-upload-preview">
            <div className="file-uploading-icon">📄</div>
            <div className="file-upload-view">
              <div className="file-uploading-header">
                <p className="file-upload-name">adad</p>
                <button onClick={() => {}} className="remove-btn">
                  <strong>✕</strong>
                </button>
              </div>
              <p className="file-upload-size">{(1024).toFixed(2)} MB</p>

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
          {progress < 100 ? (
            <button className="file-upload-btn file-upload-long-cancel-btn">
              Cancel
            </button>
          ) : (
            <div className="file-upload-actions">
              <button className="file-upload-btn file-upload-cancel-btn">
                Cancel
              </button>
              <div className="spacer"></div>
              <button className="file-upload-btn file-upload-next-btn">
                Next
              </button>
            </div>
          )}
        </div>
      </div>
      <a href="#" className="download-upload-template">
        <FaCloudDownloadAlt /> Download Bulk Upload Template
      </a>
    </IonPage>
  );
};

export default FileUpload;
