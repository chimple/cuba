import { useState } from "react";
import "./FileUpload.css";

export default function FileUpload() {
  const [file, setFile] = useState(null);
  const [progress, setProgress] = useState(0);

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile && selectedFile.type === "text/csv") {
      setFile(selectedFile);
      simulateUpload();
    } else {
      alert("Only .csv files are allowed.");
    }
  };

  const simulateUpload = () => {
    let uploadProgress = 0;
    const interval = setInterval(() => {
      uploadProgress += 10;
      setProgress(uploadProgress);
      if (uploadProgress >= 100) clearInterval(interval);
    }, 300);
  };

  const handleRemoveFile = () => {
    setFile(null);
    setProgress(0);
  };

  return (
    <div className="file-upload-container">
      <div className="file-upload-header">Upload a new file</div>
      <p className="file-upload-info">Supported file type <strong>.csv</strong></p>
      
      <label className="file-upload-box">
        <input 
          type="file" 
          className="hidden" 
          accept=".csv" 
          onChange={handleFileChange} 
        />
        {/* <UploadCloud className="upload-icon" size={40} /> */}
        <p className="upload-text">Click to upload xyz student data</p>
        <p className="upload-size">Maximum file size 50MB</p>
      </label>
      
      {file && (
        <div className="file-upload-preview">
          <div>
            <p className="file-upload-name">{"adad"}</p>
            <p className="file-upload-size">{( 1024).toFixed(2)} MB</p>
            <div className="file-upload-progress-bar">
              <div className="file-upload-progress" style={{ width: `${progress}%` }}></div>
            </div>
          </div>
          <button onClick={handleRemoveFile} className="remove-btn">
            {/* <X size={18} /> */}
          </button>
        </div>
      )}
      
      <div className="file-upload-button-group">
        <button className="file-upload-btn cancel-btn">Cancel</button>
        <button className="file-upload-btn next-btn" disabled={!file || progress < 100}>Next</button>
      </div>
    </div>
  );
}