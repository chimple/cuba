import React, { useEffect, useRef, useState } from 'react';
import {
  AssessmentOutlined,
  CloseRounded,
  CloudUploadOutlined,
  ForumOutlined,
  InsertDriveFileOutlined,
  SendOutlined,
} from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  LinearProgress,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import DataTableBody from '../components/DataTableBody';
import { ServiceConfig } from '../../services/ServiceConfig';
import { ApiHandler } from '../../services/api/ApiHandler';
import {
  formatSmsReadyIndianPhone,
  parseIndianPhoneInput,
} from '../utils/phoneNormalization';
import {
  fetchParentWhatsappMsg91Report,
  ParentWhatsappAnalysisResult,
  ParentWhatsappApiError,
  ParentWhatsappSendFailure,
  ParentWhatsappSmsSendResult,
  processParentWhatsappUdiseCodes,
  sendParentWhatsappMsg91Invites,
  sendParentWhatsappTemplateMessage,
  uploadParentWhatsappMedia,
} from './parentWhatsappInvitationService';
import './ParentWhatsappInvitationPage.css';

type Feedback = {
  severity: 'success' | 'error' | 'info' | 'warning';
  text: string;
};

type TableColumn = {
  key: string;
  label: string;
};

type ManualPhoneValidation = {
  normalizedPhones: string[];
  duplicates: string[];
  invalid: string[];
};

type ManualSendSummary = {
  attempted: number;
  successCount: number;
  failed: ParentWhatsappSendFailure[];
};

const getTodayDateValue = (): string => {
  const today = new Date();
  const year = today.getFullYear();
  const month = `${today.getMonth() + 1}`.padStart(2, '0');
  const day = `${today.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const toApiError = (
  error: unknown,
  fallbackMessage: string,
): ParentWhatsappApiError => {
  if (error && typeof error === 'object') {
    const candidate = error as ParentWhatsappApiError & Error;
    return {
      message: candidate.message || fallbackMessage,
      statusCode: candidate.statusCode,
      responseText: candidate.responseText,
      exceptionMessage: candidate.exceptionMessage || candidate.message,
    };
  }

  return {
    message: fallbackMessage,
    exceptionMessage: String(error ?? ''),
  };
};

const getWhatsappMediaType = (
  file: File | null,
): { mediaType: 'image' | 'video' | null; error?: string } => {
  if (!file) {
    return { mediaType: null };
  }

  const extension = file.name.split('.').pop()?.toLowerCase() ?? '';

  if (
    ['png', 'jpeg', 'jpg'].includes(extension) &&
    file.size <= 5 * 1024 * 1024
  ) {
    return { mediaType: 'image' };
  }

  if (['mp4', '3gp'].includes(extension) && file.size <= 16 * 1024 * 1024) {
    return { mediaType: 'video' };
  }

  return {
    mediaType: null,
    error:
      'Only PNG/JPEG up to 5 MB or MP4/3GP up to 16 MB are allowed for WhatsApp media.',
  };
};

const formatCellValue = (value: unknown): string => {
  if (value == null || value === '') return '-';
  if (Array.isArray(value))
    return value.map((item) => formatCellValue(item)).join(', ');
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
};

const formatHeaderLabel = (label: string): string => {
  const withSpaces = label
    .replace(/[_-]+/g, ' ')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/\s+/g, ' ')
    .trim();

  if (!withSpaces) {
    return label;
  }

  return withSpaces
    .toLowerCase()
    .replace(/\b\w/g, (character) => character.toUpperCase());
};

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const formatProcessedUdiseRows = (udiseCodes: string[]): string => {
  if (!udiseCodes.length) {
    return '-';
  }

  const rowSize = 5;
  const rows: string[] = [];

  for (let index = 0; index < udiseCodes.length; index += rowSize) {
    rows.push(udiseCodes.slice(index, index + rowSize).join('   '));
  }

  return rows.join('\n');
};

const FieldBlock: React.FC<{
  label: string;
  children: React.ReactNode;
}> = ({ label, children }) => (
  <div className="parent-whatsapp-page__field-block">
    <label className="parent-whatsapp-page__field-label">{label}</label>
    {children}
  </div>
);

const InlineToggle: React.FC<{
  checked: boolean;
  onChange: (nextValue: boolean) => void;
  icon: React.ReactNode;
  label: string;
}> = ({ checked, onChange, icon, label }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    className="parent-whatsapp-page__toggle-item"
    onClick={() => onChange(!checked)}
  >
    <span
      aria-hidden="true"
      className={`parent-whatsapp-page__toggle-control${checked ? ' parent-whatsapp-page__toggle-control--checked' : ''}`}
    >
      <span className="parent-whatsapp-page__toggle-thumb" />
    </span>
    <span className="parent-whatsapp-page__switch-label">
      {icon}
      {label}
    </span>
  </button>
);

const DataFrameCard: React.FC<{
  title?: string;
  rows: Record<string, unknown>[];
  columns?: TableColumn[];
  showWhenEmpty?: boolean;
}> = ({ title, rows, columns, showWhenEmpty = false }) => {
  const handleNoopSort = (_key: string): void => undefined;

  const derivedColumns =
    columns && columns.length > 0
      ? columns
      : Array.from(new Set(rows.flatMap((row) => Object.keys(row)))).map(
          (key) => ({
            key,
            label: key,
          }),
        );

  if (rows.length === 0 && !showWhenEmpty) {
    return null;
  }

  const tableColumns = derivedColumns.map((column) => ({
    key: column.key,
    label: formatHeaderLabel(column.label),
    sortable: false,
    render: (row: Record<string, unknown>) => formatCellValue(row[column.key]),
  }));

  return (
    <section className="parent-whatsapp-page__dataframe">
      {title ? (
        <Typography className="parent-whatsapp-page__dataframe-title">
          {title}
        </Typography>
      ) : null}
      <div className="parent-whatsapp-page__table-wrap">
        {rows.length > 0 ? (
          <DataTableBody
            columns={tableColumns}
            rows={rows}
            orderBy={null}
            order="asc"
            onSort={handleNoopSort}
            disableRowNavigation
          />
        ) : (
          <div className="parent-whatsapp-page__table-empty">
            No rows found.
          </div>
        )}
      </div>
    </section>
  );
};

const ParentWhatsappInvitationPage: React.FC = () => {
  const api: ApiHandler | null = ServiceConfig.getI()?.apiHandler ?? null;
  const uploadInputRef = useRef<HTMLInputElement | null>(null);

  const [isWhatsappMode, setIsWhatsappMode] = useState(false);
  const [showMsg91Report, setShowMsg91Report] = useState(false);
  const [isDraggingFile, setIsDraggingFile] = useState(false);

  const [udiseInput, setUdiseInput] = useState('');
  const [limit, setLimit] = useState(300);
  const [analysisResult, setAnalysisResult] =
    useState<ParentWhatsappAnalysisResult | null>(null);
  const [analysisFeedback, setAnalysisFeedback] = useState<Feedback | null>(
    null,
  );
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const [isSendingSms, setIsSendingSms] = useState(false);
  const [smsFeedback, setSmsFeedback] = useState<Feedback | null>(null);
  const [smsResult, setSmsResult] =
    useState<ParentWhatsappSmsSendResult | null>(null);

  const [startDate, setStartDate] = useState(getTodayDateValue());
  const [endDate, setEndDate] = useState(getTodayDateValue());
  const [reportRows, setReportRows] = useState<Record<string, unknown>[]>([]);
  const [reportFeedback, setReportFeedback] = useState<Feedback | null>(null);
  const [isLoadingReport, setIsLoadingReport] = useState(false);

  const [phoneInput, setPhoneInput] = useState('');
  const [templateName, setTemplateName] = useState('');
  const [templateLang, setTemplateLang] = useState('');
  const [messageType, setMessageType] = useState<'utility' | 'marketing'>(
    'utility',
  );
  const [uploadedMedia, setUploadedMedia] = useState<File | null>(null);
  const [manualValidation, setManualValidation] =
    useState<ManualPhoneValidation>({
      normalizedPhones: [],
      duplicates: [],
      invalid: [],
    });
  const [manualFeedback, setManualFeedback] = useState<Feedback | null>(null);
  const [isSendingWhatsapp, setIsSendingWhatsapp] = useState(false);
  const [whatsappProgress, setWhatsappProgress] = useState(0);
  const [manualSendSummary, setManualSendSummary] =
    useState<ManualSendSummary | null>(null);

  useEffect(() => {
    setManualValidation(parseIndianPhoneInput(phoneInput));
  }, [phoneInput]);

  const handleAnalyze = async (): Promise<void> => {
    const parsedUdiseCodes = udiseInput
      .replace(/,/g, '\n')
      .split(/\r?\n/)
      .map((value) => value.trim())
      .filter(Boolean);
    const udiseCodes = Array.from(new Set(parsedUdiseCodes));

    if (!api) {
      setAnalysisFeedback({
        severity: 'error',
        text: 'API service is not ready yet in this session.',
      });
      return;
    }

    if (udiseCodes.length === 0) {
      setAnalysisFeedback({
        severity: 'warning',
        text: 'Enter at least one UDISE code before running analysis.',
      });
      return;
    }

    try {
      setIsAnalyzing(true);
      setSmsResult(null);
      setSmsFeedback(null);
      const result = await processParentWhatsappUdiseCodes({
        api,
        udiseCodes,
        limit: Math.max(1, Number(limit) || 1),
      });
      setAnalysisResult(result);
      setAnalysisFeedback({
        severity: 'success',
        text: `Analysis complete. ${result.inviteList.length} invite rows are ready.`,
      });
    } catch (error) {
      const apiError = toApiError(error, 'Failed to process UDISE codes.');
      setAnalysisFeedback({
        severity: 'error',
        text: apiError.message,
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSendSmsInvites = async (): Promise<void> => {
    if (!analysisResult?.inviteList?.length) {
      setSmsFeedback({
        severity: 'warning',
        text: 'Run analysis first or load a saved invite list.',
      });
      return;
    }

    try {
      setIsSendingSms(true);
      const result = await sendParentWhatsappMsg91Invites(
        analysisResult.inviteList,
      );
      setSmsResult(result);
      setSmsFeedback({
        severity: result.failedBatches.length > 0 ? 'warning' : 'success',
        text:
          result.failedBatches.length > 0
            ? `Sent ${result.successCount} invites. ${result.failedBatches.length} batch failures were captured.`
            : `Sent ${result.successCount} invites successfully.`,
      });
    } catch (error) {
      const apiError = toApiError(error, 'Failed to send MSG91 invites.');
      setSmsFeedback({
        severity: 'error',
        text: apiError.message,
      });
    } finally {
      setIsSendingSms(false);
    }
  };

  const handleFetchReport = async (): Promise<void> => {
    if (!startDate || !endDate) {
      setReportFeedback({
        severity: 'warning',
        text: 'Select both start date and end date first.',
      });
      return;
    }

    try {
      setIsLoadingReport(true);
      const rows = await fetchParentWhatsappMsg91Report({
        startDate,
        endDate,
      });
      setReportRows(rows);
      setReportFeedback({
        severity: 'success',
        text: `Report loaded with ${rows.length} row(s).`,
      });
    } catch (error) {
      const apiError = toApiError(error, 'Failed to fetch MSG91 report.');
      setReportFeedback({
        severity: 'error',
        text: apiError.message,
      });
    } finally {
      setIsLoadingReport(false);
    }
  };

  const handleFileSelect = (fileList: FileList | null): void => {
    setUploadedMedia(fileList?.[0] ?? null);
  };

  const handleSendWhatsapp = async (): Promise<void> => {
    if (isSendingWhatsapp) return;

    const parsedPhones = parseIndianPhoneInput(phoneInput);
    setManualValidation(parsedPhones);

    if (!templateName.trim() || !templateLang.trim()) {
      setManualFeedback({
        severity: 'warning',
        text: 'Provide template name and language code before sending.',
      });
      return;
    }

    if (parsedPhones.normalizedPhones.length === 0) {
      setManualFeedback({
        severity: 'warning',
        text: 'Add at least one valid Indian mobile number.',
      });
      return;
    }

    if (parsedPhones.normalizedPhones.length > 1000) {
      setManualFeedback({
        severity: 'warning',
        text: 'A maximum of 1000 unique phone numbers can be sent in one run.',
      });
      return;
    }

    const mediaValidation = getWhatsappMediaType(uploadedMedia);
    if (mediaValidation.error) {
      setManualFeedback({
        severity: 'error',
        text: mediaValidation.error,
      });
      return;
    }

    let mediaId: string | null = null;

    try {
      setIsSendingWhatsapp(true);
      setWhatsappProgress(0);
      setManualSendSummary(null);

      if (uploadedMedia) {
        mediaId = await uploadParentWhatsappMedia(uploadedMedia);
      }

      const failures: ParentWhatsappSendFailure[] = [];
      let successCount = 0;

      for (const [index, phone] of parsedPhones.normalizedPhones.entries()) {
        const outboundPhone = formatSmsReadyIndianPhone(phone);

        if (!outboundPhone) {
          failures.push({
            mobile: phone,
            error: {
              message: 'Invalid phone number after normalization.',
            },
          });
          continue;
        }

        try {
          await sendParentWhatsappTemplateMessage({
            to: outboundPhone,
            templateName: templateName.trim(),
            templateLang: templateLang.trim(),
            messageType,
            mediaId,
            mediaType: mediaValidation.mediaType,
          });
          successCount += 1;
        } catch (error) {
          failures.push({
            mobile: outboundPhone,
            error: toApiError(
              error,
              `Failed to send WhatsApp template message to ${outboundPhone}.`,
            ),
          });
        } finally {
          setWhatsappProgress(
            Math.round(
              ((index + 1) / parsedPhones.normalizedPhones.length) * 100,
            ),
          );
        }
      }

      setManualSendSummary({
        attempted: parsedPhones.normalizedPhones.length,
        successCount,
        failed: failures,
      });

      setManualFeedback({
        severity:
          failures.length > 0 || parsedPhones.invalid.length > 0
            ? 'warning'
            : 'success',
        text:
          failures.length > 0
            ? `WhatsApp run finished with ${successCount} success(es) and ${failures.length} failure(s).`
            : `WhatsApp run finished with ${successCount} successful send(s).`,
      });
    } catch (error) {
      const apiError = toApiError(
        error,
        'WhatsApp media upload failed before sending started.',
      );
      setManualFeedback({
        severity: 'error',
        text: apiError.message,
      });
    } finally {
      setIsSendingWhatsapp(false);
    }
  };

  return (
    <div className="parent-whatsapp-page">
      <div className="parent-whatsapp-page__title-row">
        <Typography className="parent-whatsapp-page__title">
          UDISE WhatsApp Invite Tool (1.0.1)
        </Typography>
      </div>

      <div className="parent-whatsapp-page__toggle-bar">
        <InlineToggle
          checked={isWhatsappMode}
          onChange={setIsWhatsappMode}
          icon={<ForumOutlined className="parent-whatsapp-page__inline-icon" />}
          label="WhatsApp"
        />
        <InlineToggle
          checked={showMsg91Report}
          onChange={setShowMsg91Report}
          icon={
            <AssessmentOutlined className="parent-whatsapp-page__inline-icon" />
          }
          label="View MSG91 Report"
        />
      </div>

      {isWhatsappMode ? (
        <>
          <div className="parent-whatsapp-page__section-heading">
            <ForumOutlined className="parent-whatsapp-page__section-icon" />
            <Typography className="parent-whatsapp-page__section-title-main">
              Send WhatsApp messages to parents
            </Typography>
          </div>

          <div className="parent-whatsapp-page__info-banner">
            Send WhatsApp template messages with optional header media.
          </div>

          <div className="parent-whatsapp-page__form-area">
            <FieldBlock label="Enter phone numbers (one per line or comma-separated)">
              <TextField
                multiline
                minRows={4}
                fullWidth
                value={phoneInput}
                onChange={(event) => setPhoneInput(event.target.value)}
                className="parent-whatsapp-page__input"
              />
            </FieldBlock>

            <FieldBlock label="Template Name">
              <TextField
                fullWidth
                value={templateName}
                onChange={(event) => setTemplateName(event.target.value)}
                className="parent-whatsapp-page__input"
              />
            </FieldBlock>

            <FieldBlock label="Template Language Code (hi/en/kn)">
              <TextField
                fullWidth
                value={templateLang}
                onChange={(event) => setTemplateLang(event.target.value)}
                className="parent-whatsapp-page__input"
              />
            </FieldBlock>

            <FieldBlock label="Message Type">
              <TextField
                select
                fullWidth
                value={messageType}
                onChange={(event) =>
                  setMessageType(event.target.value as 'utility' | 'marketing')
                }
                className="parent-whatsapp-page__input"
              >
                <MenuItem value="utility">utility</MenuItem>
                <MenuItem value="marketing">marketing</MenuItem>
              </TextField>
            </FieldBlock>

            <FieldBlock label="Upload Image (<=5MB) or Video (<=16MB) (optional, must match template header type)">
              <div
                className={`parent-whatsapp-page__upload-zone${isDraggingFile ? ' parent-whatsapp-page__upload-zone--dragging' : ''}`}
                role="button"
                tabIndex={0}
                onClick={() => uploadInputRef.current?.click()}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    uploadInputRef.current?.click();
                  }
                }}
                onDragOver={(event) => {
                  event.preventDefault();
                  setIsDraggingFile(true);
                }}
                onDragLeave={() => setIsDraggingFile(false)}
                onDrop={(event) => {
                  event.preventDefault();
                  setIsDraggingFile(false);
                  handleFileSelect(event.dataTransfer.files);
                }}
              >
                <div className="parent-whatsapp-page__upload-copy">
                  <CloudUploadOutlined className="parent-whatsapp-page__upload-icon" />
                  <div>
                    <div className="parent-whatsapp-page__upload-title">
                      Drag and drop file here
                    </div>
                    <div className="parent-whatsapp-page__upload-caption">
                      Limit 200MB per file | PNG, JPEG, MP4, 3GP, JPG, MPEG4
                    </div>
                  </div>
                </div>
                <Button
                  variant="outlined"
                  className="parent-whatsapp-page__browse-button"
                  onClick={(event) => {
                    event.stopPropagation();
                    uploadInputRef.current?.click();
                  }}
                >
                  Browse files
                </Button>
                <input
                  ref={uploadInputRef}
                  hidden
                  type="file"
                  accept=".png,.jpeg,.jpg,.mp4,.3gp"
                  onChange={(event) => handleFileSelect(event.target.files)}
                />
              </div>
              {uploadedMedia ? (
                <div className="parent-whatsapp-page__upload-file">
                  <div className="parent-whatsapp-page__upload-file-info">
                    <InsertDriveFileOutlined className="parent-whatsapp-page__upload-file-icon" />
                    <div className="parent-whatsapp-page__upload-file-copy">
                      <div className="parent-whatsapp-page__upload-file-name">
                        {uploadedMedia.name}
                      </div>
                      <div className="parent-whatsapp-page__upload-file-size">
                        {formatFileSize(uploadedMedia.size)}
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="parent-whatsapp-page__upload-file-remove"
                    onClick={() => setUploadedMedia(null)}
                    aria-label="Remove uploaded file"
                  >
                    <CloseRounded fontSize="small" />
                  </button>
                </div>
              ) : null}
            </FieldBlock>

            <Button
              variant="outlined"
              startIcon={<SendOutlined />}
              disabled={isSendingWhatsapp}
              onClick={handleSendWhatsapp}
              className="parent-whatsapp-page__action-button"
            >
              Send WhatsApp Message
            </Button>

            {isSendingWhatsapp || whatsappProgress > 0 ? (
              <Box className="parent-whatsapp-page__progress">
                <LinearProgress
                  variant="determinate"
                  value={whatsappProgress}
                />
                <Typography className="parent-whatsapp-page__progress-text">
                  {whatsappProgress}% complete
                </Typography>
              </Box>
            ) : null}

            {manualFeedback ? (
              <Alert
                severity={manualFeedback.severity}
                className="parent-whatsapp-page__alert"
              >
                {manualFeedback.text}
              </Alert>
            ) : null}

            {manualSendSummary ? (
              <Stack
                direction="row"
                spacing={1}
                useFlexGap
                flexWrap="wrap"
                className="parent-whatsapp-page__summary"
              >
                <div className="parent-whatsapp-page__summary-pill">
                  Attempted: {manualSendSummary.attempted}
                </div>
                <div className="parent-whatsapp-page__summary-pill">
                  Success: {manualSendSummary.successCount}
                </div>
                <div className="parent-whatsapp-page__summary-pill">
                  Failed: {manualSendSummary.failed.length}
                </div>
              </Stack>
            ) : null}
          </div>

          <DataFrameCard
            title="Invalid Numbers"
            rows={manualValidation.invalid.map((value) => ({ number: value }))}
          />
          <DataFrameCard
            title="Duplicate Numbers"
            rows={manualValidation.duplicates.map((value) => ({
              number: value,
            }))}
          />
          <DataFrameCard
            title="WhatsApp Failures"
            rows={(manualSendSummary?.failed ?? []).map((failure) => ({
              mobile: failure.mobile,
              reason: failure.error.message,
              statusCode: failure.error.statusCode,
              responseText: failure.error.responseText,
            }))}
          />
        </>
      ) : (
        <>
          {showMsg91Report ? (
            <>
              <div className="parent-whatsapp-page__form-grid parent-whatsapp-page__report-grid">
                <FieldBlock label="Start Date">
                  <TextField
                    fullWidth
                    type="date"
                    value={startDate}
                    onChange={(event) => setStartDate(event.target.value)}
                    className="parent-whatsapp-page__input parent-whatsapp-page__date-input"
                    InputLabelProps={{ shrink: true }}
                  />
                </FieldBlock>

                <FieldBlock label="End Date">
                  <TextField
                    fullWidth
                    type="date"
                    value={endDate}
                    onChange={(event) => setEndDate(event.target.value)}
                    className="parent-whatsapp-page__input parent-whatsapp-page__date-input"
                    InputLabelProps={{ shrink: true }}
                  />
                </FieldBlock>
              </div>

              <Button
                variant="outlined"
                disabled={isLoadingReport}
                onClick={handleFetchReport}
                className="parent-whatsapp-page__action-button parent-whatsapp-page__report-button"
              >
                Get Report
              </Button>

              {reportFeedback ? (
                <Alert
                  severity={reportFeedback.severity}
                  className="parent-whatsapp-page__alert"
                >
                  {reportFeedback.text}
                </Alert>
              ) : null}

              {reportRows.length > 0 ||
              reportFeedback?.severity === 'success' ? (
                <Typography className="parent-whatsapp-page__report-count">
                  Total Count: {reportRows.length}
                </Typography>
              ) : null}

              <DataFrameCard title="MSG91 Report Rows" rows={reportRows} />
            </>
          ) : (
            <>
              <div className="parent-whatsapp-page__form-area">
                <FieldBlock label="Enter UDISE codes">
                  <TextField
                    multiline
                    minRows={4}
                    fullWidth
                    value={udiseInput}
                    onChange={(event) => setUdiseInput(event.target.value)}
                    className="parent-whatsapp-page__input"
                  />
                </FieldBlock>

                <FieldBlock label="Message Limit">
                  <TextField
                    type="number"
                    fullWidth
                    value={limit}
                    onChange={(event) => {
                      const nextLimit = Number(event.target.value);
                      setLimit(
                        Number.isFinite(nextLimit) && nextLimit > 0
                          ? nextLimit
                          : 1,
                      );
                    }}
                    inputProps={{ min: 1 }}
                    className="parent-whatsapp-page__input parent-whatsapp-page__input--limit"
                    InputProps={{
                      endAdornment: (
                        <Box className="parent-whatsapp-page__limit-stepper">
                          <button
                            type="button"
                            className="parent-whatsapp-page__limit-button"
                            onClick={() =>
                              setLimit((currentLimit) =>
                                Math.max(1, currentLimit - 1),
                              )
                            }
                          >
                            -
                          </button>
                          <button
                            type="button"
                            className="parent-whatsapp-page__limit-button"
                            onClick={() =>
                              setLimit((currentLimit) => currentLimit + 1)
                            }
                          >
                            +
                          </button>
                        </Box>
                      ),
                    }}
                  />
                </FieldBlock>

                <div className="parent-whatsapp-page__button-stack">
                  <Button
                    variant="outlined"
                    startIcon={<AssessmentOutlined />}
                    disabled={isAnalyzing}
                    onClick={handleAnalyze}
                    className="parent-whatsapp-page__action-button"
                  >
                    Run Analysis
                  </Button>
                </div>

                {analysisFeedback ? (
                  <Alert
                    severity={analysisFeedback.severity}
                    className="parent-whatsapp-page__alert"
                  >
                    {analysisFeedback.text}
                  </Alert>
                ) : null}

                {smsFeedback ? (
                  <Alert
                    severity={smsFeedback.severity}
                    className="parent-whatsapp-page__alert"
                  >
                    {smsFeedback.text}
                  </Alert>
                ) : null}

                {smsResult ? (
                  <Stack
                    direction="row"
                    spacing={1}
                    useFlexGap
                    flexWrap="wrap"
                    className="parent-whatsapp-page__summary"
                  >
                    <div className="parent-whatsapp-page__summary-pill">
                      Success Count: {smsResult.successCount}
                    </div>
                    <div className="parent-whatsapp-page__summary-pill">
                      Failed Batches: {smsResult.failedBatches.length}
                    </div>
                  </Stack>
                ) : null}
              </div>

              {analysisResult ? (
                <section className="parent-whatsapp-page__analysis-output">
                  <div className="parent-whatsapp-page__processed-block">
                    <div className="parent-whatsapp-page__processed-heading">
                      <Typography className="parent-whatsapp-page__processed-title">
                        Processed UDISE
                      </Typography>
                    </div>
                    <pre className="parent-whatsapp-page__processed-list">
                      {formatProcessedUdiseRows(analysisResult.processedUdise)}
                    </pre>
                  </div>

                  <div className="parent-whatsapp-page__missing-block">
                    <Typography className="parent-whatsapp-page__missing-label">
                      Total Missing Parents
                    </Typography>
                    <Typography className="parent-whatsapp-page__missing-value">
                      {analysisResult.totalMissing}
                    </Typography>
                  </div>

                  <DataFrameCard
                    rows={analysisResult.inviteList}
                    columns={[
                      { key: 'udise', label: 'udise' },
                      { key: 'school', label: 'school' },
                      { key: 'className', label: 'class' },
                      { key: 'mobile', label: 'mobile' },
                      { key: 'inviteLink', label: 'invite_link' },
                    ]}
                    showWhenEmpty
                  />

                  <Button
                    variant="outlined"
                    startIcon={<SendOutlined />}
                    disabled={isSendingSms || !analysisResult.inviteList.length}
                    onClick={handleSendSmsInvites}
                    className="parent-whatsapp-page__action-button parent-whatsapp-page__analysis-send-button"
                  >
                    Send Invitation to Parents
                  </Button>
                </section>
              ) : null}

              <DataFrameCard
                title="Failed Groups"
                rows={analysisResult?.failedGroups ?? []}
                columns={[
                  { key: 'udise', label: 'UDISE' },
                  { key: 'school', label: 'School' },
                  { key: 'className', label: 'Class' },
                  { key: 'groupId', label: 'Group ID' },
                  { key: 'error', label: 'Error' },
                  { key: 'statusCode', label: 'Status Code' },
                ]}
              />

              <DataFrameCard
                title="Failed MSG91 Batches"
                rows={(smsResult?.failedBatches ?? []).map((failure) => ({
                  batchIndex: failure.batchIndex,
                  recipients: failure.recipients.join(', '),
                  error: failure.error.message,
                  statusCode: failure.error.statusCode,
                  responseText: failure.error.responseText,
                }))}
              />
            </>
          )}
        </>
      )}
    </div>
  );
};

export default ParentWhatsappInvitationPage;
