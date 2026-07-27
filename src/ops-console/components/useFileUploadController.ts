import { useEffect, useRef, useState } from 'react';
import { useHistory } from 'react-router-dom';
import { Util } from '../../utility/util';
import { ServiceConfig } from '../../services/ServiceConfig';
import { FileUploadStep } from '../../common/constants';
import logger from '../../utility/logger';
import { processBulkUploadFile } from './fileUpload/processBulkUploadFile';

export function useFileUploadController({
  onCancleClick,
}: {
  onCancleClick?: () => void;
}) {
  const api = ServiceConfig.getI()?.apiHandler;
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const validSheetCountRef = useRef<number | null>(null);
  const [, setIsVerifying] = useState(false);
  const [fileBuffer, setFileBuffer] = useState<ArrayBuffer | null>(null);
  const progressRef = useRef(10);
  const [verifyingProgressState, setVerifyingProgressState] = useState(10);
  const [isReupload, setIsReupload] = useState(false);
  const processedDataRef = useRef<ArrayBuffer | null>(null);
  const hasDuplicateStudentErrorRef = useRef(false);
  const [finalPayload, setFinalPayload] = useState<any[] | null>(null);
  const [isVerified, setIsVerified] = useState(false);
  const [step, setStep] = useState<FileUploadStep>(FileUploadStep.Idle);
  const history = useHistory();

  function onReuploadTriggered() {
    setFile(null);
    setProgress(0);
    setFileBuffer(null);
    validSheetCountRef.current = null;
    hasDuplicateStudentErrorRef.current = false;
    setStep(FileUploadStep.Idle);
    setIsReupload(true);
  }
  const markDuplicateStudentErrorIfPresent = (messages: string[]) => {
    if (
      messages.some((message) => {
        if (!message) return false;
        const normalizedMessage = message.toLowerCase();
        return (
          normalizedMessage.includes('duplicate') ||
          normalizedMessage.includes('already exist')
        );
      })
    ) {
      hasDuplicateStudentErrorRef.current = true;
    }
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
    hasDuplicateStudentErrorRef.current = false;

    const reader = new FileReader();
    reader.readAsArrayBuffer(selectedFile);
    reader.onload = async (e) => {
      const buffer = e.target?.result as ArrayBuffer;
      setFileBuffer(buffer);
      setProgress(100);
      setIsProcessing(false);
    };
    event.target.value = '';
  };
  const processFile = async () => {
    if (!fileBuffer) return;
    hasDuplicateStudentErrorRef.current = false;
    progressRef.current = 40;
    setVerifyingProgressState(progressRef.current);
    const processedData = await processBulkUploadFile({
      api,
      fileBuffer,
      validSheetCountRef,
      setIsProcessing,
      setIsVerifying,
      setFinalPayload,
      setVerifyingProgressState,
      progressRef,
      markDuplicateStudentErrorIfPresent,
    });
    processedDataRef.current = processedData;
  };

  const handleDownload = async () => {
    if (!processedDataRef.current) return;
    try {
      const blob = new Blob([processedDataRef.current], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      Util.handleBlobDownloadAndSave(blob, 'ProcessedFile.xlsx');
      progressRef.current = 100;
      setVerifyingProgressState(progressRef.current);
    } catch (error) {
      logger.error('Download failed:', error);
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

  return {
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
  };
}
