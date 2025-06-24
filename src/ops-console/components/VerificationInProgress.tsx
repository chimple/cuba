import React from "react";
import { CiRedo } from "react-icons/ci";
import "./VerificationInProgress.css"; // Optional: if needed for styles

interface VerificationInProgressProps {
  progress: number;
  title: string;
  message: string;
}

const VerificationInProgress: React.FC<VerificationInProgressProps> = ({
  progress,
  title,
  message,
}) => {
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
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <p className="verification-title">{title}</p>
          <p>{message}</p>
        </div>
      </div>
    </div>
  );
};

export default VerificationInProgress;
