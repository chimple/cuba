import React from 'react';
import './FileUpload.css';
import UploadIcon from '../assets/icons/upload_icon.png';
import { FaCloudDownloadAlt } from 'react-icons/fa';
import { t } from 'i18next';
import { Util } from '../../utility/util';
import VerifiedPage from './FileVerifiedComponent';
import ErrorPage from './FileErrorComponent';
import VerificationInProgress from './VerificationInProgress';
import {
  BULK_UPLOAD_TEMPLATE_URL,
  FileUploadStep,
} from '../../common/constants';
import { useFileUploadController } from './useFileUploadController';

const FileUpload: React.FC<{ onCancleClick?: () => void }> = ({
  onCancleClick,
}) => {
  const {
    file,
    progress,
    isProcessing,
    verifyingProgressState,
    isReupload,
    step,
    validSheetCountRef,
    hasDuplicateStudentErrorRef,
    handleFileUpload,
    handleNext,
    handleDownload,
    onReuploadTriggered,
    setFile,
  } = useFileUploadController({ onCancleClick });

  if (step === FileUploadStep.Verifying) {
    return (
      <VerificationInProgress
        progress={verifyingProgressState}
        title={t('Verifying Data...')}
        message={t(
          'We are checking your uploaded data for any errors. Please wait a moment.',
        )}
      />
    );
  }

  if (step === FileUploadStep.Verified) {
    return (
      <VerifiedPage
        title={t('Verified')}
        message={t(
          'Your data has been successfully checked, and no errors were found.',
        )}
      />
    );
  }

  if (step === FileUploadStep.Uploading) {
    return (
      <VerificationInProgress
        progress={90}
        title={t('Uploading Data...')}
        message={t('We are uploading your data. Please wait.')}
      />
    );
  }

  if (step === FileUploadStep.Uploaded) {
    return (
      <VerifiedPage
        title={t('Upload Successful')}
        message={t('Your data has been uploaded successfully.')}
      />
    );
  }

  if (step === FileUploadStep.UploadError) {
    return (
      <ErrorPage
        reUplod={() => onReuploadTriggered()}
        message={t(
          'Upload failed. Please try again later. You may retry or contact support if the problem continues.',
        )}
        title={t('Unable to Upload File')}
      />
    );
  }

  if (validSheetCountRef.current !== 0 && validSheetCountRef.current !== null) {
    return (
      <ErrorPage
        handleDownload={() => handleDownload()}
        reUplod={() => onReuploadTriggered()}
        title={
          hasDuplicateStudentErrorRef.current
            ? t('Duplicate Students Found')
            : undefined
        }
        message={
          hasDuplicateStudentErrorRef.current
            ? t(
                'Some student records already exist in the same class for this school. Download the file, review the highlighted rows, remove duplicates, and re-upload.',
              )
            : undefined
        }
      />
    );
  }

  return (
    <div className="file-upload-page">
      <div className="file-upload-container">
        <div className="file-upload-header">{t('Upload a new file')}</div>
        <p className="file-upload-info">
          {t('Supported file type')} <strong>.xlsx</strong>
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
            <span>{t('Click to upload student data')}</span>
          </p>
          <p className="upload-file-size">{t('Maximum file size')} 50MB</p>
        </label>

        {file && (
          <div className="file-upload-preview">
            <div className="file-uploading-icon">ðŸ“„</div>
            <div className="file-upload-view">
              <div className="file-uploading-header">
                <p className="file-upload-name">{file.name}</p>
                <button
                  onClick={() => setFile(null)}
                  className="file-upload-remove-btn"
                >
                  âœ•
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
                  />
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
              {t('Processing...')}
            </button>
          ) : progress === 100 ? (
            <div className="file-upload-actions">
              <button
                onClick={onCancleClick}
                className="file-upload-btn file-upload-cancel-btn"
              >
                {t('Cancel')}
              </button>
              <div className="spacer" />
              <button
                onClick={handleNext}
                className="file-upload-btn file-upload-next-btn"
              >
                {t('Next')}
              </button>
            </div>
          ) : (
            <button
              onClick={onCancleClick}
              className="file-upload-btn file-upload-long-cancel-btn"
            >
              {t('Cancel')}
            </button>
          )}
        </div>
      </div>

      {!isReupload && (
        <a
          className="download-upload-template"
          onClick={() => Util.downloadFileFromUrl(BULK_UPLOAD_TEMPLATE_URL)}
        >
          <FaCloudDownloadAlt /> {t('Download Bulk Upload Template')}
        </a>
      )}
    </div>
  );
};

export default FileUpload;
