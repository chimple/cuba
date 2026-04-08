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
import { t } from 'i18next';
import React from 'react';
import DataTableBody from '../../components/DataTableBody';
import './ParentWhatsappInvitationPage.css';
import {
  formatCellValue,
  formatFileSize,
  formatHeaderLabel,
  formatProcessedUdiseRows,
  useParentWhatsappInvitationPageLogic,
} from './ParentWhatsappInvitationPageLogic';

type TableColumn = {
  key: string;
  label: string;
};

const FieldBlock: React.FC<{
  label: string;
  children: React.ReactNode;
}> = ({ label, children }) => (
  <div
    id="parent-whatsapp-page-field-block"
    className="parent-whatsapp-page-field-block"
  >
    <label
      id="parent-whatsapp-page-field-label"
      className="parent-whatsapp-page-field-label"
    >
      {label}
    </label>
    {children}
  </div>
);

const InlineToggle: React.FC<{
  checked: boolean;
  onChange: (nextValue: boolean) => void;
  icon: React.ReactNode;
  label: string;
}> = ({ checked, onChange, icon, label }) => {
  const toggleControlClassName = `parent-whatsapp-page-toggle-control${checked ? ' parent-whatsapp-page-toggle-control--checked' : ''}`;

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      id="parent-whatsapp-page-toggle-item"
      className="parent-whatsapp-page-toggle-item"
      onClick={() => onChange(!checked)}
    >
      <span
        aria-hidden="true"
        id={toggleControlClassName}
        className={toggleControlClassName}
      >
        <span
          id="parent-whatsapp-page-toggle-thumb"
          className="parent-whatsapp-page-toggle-thumb"
        />
      </span>
      <span
        id="parent-whatsapp-page-switch-label"
        className="parent-whatsapp-page-switch-label"
      >
        {icon}
        {label}
      </span>
    </button>
  );
};

const DataFrameCard: React.FC<{
  title?: React.ReactNode;
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
    <section
      id="parent-whatsapp-page-dataframe"
      className="parent-whatsapp-page-dataframe"
    >
      {title ? (
        <Typography
          id="parent-whatsapp-page-dataframe-title"
          className="parent-whatsapp-page-dataframe-title"
        >
          {title}
        </Typography>
      ) : null}
      <div
        id="parent-whatsapp-page-table-wrap"
        className="parent-whatsapp-page-table-wrap"
      >
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
          <div
            id="parent-whatsapp-page-table-empty"
            className="parent-whatsapp-page-table-empty"
          >
            {t('No rows found.')}
          </div>
        )}
      </div>
    </section>
  );
};

const ParentWhatsappInvitationPage: React.FC = () => {
  const {
    uploadInputRef,
    isWhatsappMode,
    setIsWhatsappMode,
    showMsg91Report,
    setShowMsg91Report,
    isDraggingFile,
    setIsDraggingFile,
    udiseInput,
    setUdiseInput,
    limit,
    setLimit,
    analysisResult,
    analysisFeedback,
    isAnalyzing,
    isSendingSms,
    smsFeedback,
    smsResult,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    reportRows,
    reportFeedback,
    isLoadingReport,
    phoneInput,
    setPhoneInput,
    whatsappPhoneLimit,
    handleWhatsappPhoneLimitChange,
    templateName,
    setTemplateName,
    templateLang,
    setTemplateLang,
    messageType,
    setMessageType,
    uploadedMedia,
    setUploadedMedia,
    manualValidation,
    manualFeedback,
    isSendingWhatsapp,
    whatsappProgress,
    manualSendSummary,
    handleAnalyze,
    handleSendSmsInvites,
    handleFetchReport,
    handleFileSelect,
    handleSendWhatsapp,
  } = useParentWhatsappInvitationPageLogic();
  const uploadZoneClassName = `parent-whatsapp-page-upload-zone${isDraggingFile ? ' parent-whatsapp-page-upload-zone--dragging' : ''}`;

  return (
    <div id="parent-whatsapp-page" className="parent-whatsapp-page">
      <div
        id="parent-whatsapp-page-title-row"
        className="parent-whatsapp-page-title-row"
      >
        <Typography
          id="parent-whatsapp-page-title"
          className="parent-whatsapp-page-title"
        >
          {t('UDISE WhatsApp Invite Tool (1.0.1)')}
        </Typography>
      </div>

      <div
        id="parent-whatsapp-page-toggle-bar"
        className="parent-whatsapp-page-toggle-bar"
      >
        <InlineToggle
          checked={isWhatsappMode}
          onChange={setIsWhatsappMode}
          icon={
            <ForumOutlined
              id="parent-whatsapp-page-inline-icon"
              className="parent-whatsapp-page-inline-icon"
            />
          }
          label={t('WhatsApp')}
        />
        <InlineToggle
          checked={showMsg91Report}
          onChange={setShowMsg91Report}
          icon={
            <AssessmentOutlined
              id="parent-whatsapp-page-inline-icon"
              className="parent-whatsapp-page-inline-icon"
            />
          }
          label={t('View MSG91 Report')}
        />
      </div>

      {isWhatsappMode ? (
        <>
          <div
            id="parent-whatsapp-page-section-heading"
            className="parent-whatsapp-page-section-heading"
          >
            <ForumOutlined
              id="parent-whatsapp-page-section-icon"
              className="parent-whatsapp-page-section-icon"
            />
            <Typography
              id="parent-whatsapp-page-section-title-main"
              className="parent-whatsapp-page-section-title-main"
            >
              {t('Send WhatsApp messages to parents')}
            </Typography>
          </div>

          <div
            id="parent-whatsapp-page-info-banner"
            className="parent-whatsapp-page-info-banner"
          >
            {t('Send WhatsApp template messages with optional header media.')}
          </div>

          <div
            id="parent-whatsapp-page-form-area"
            className="parent-whatsapp-page-form-area"
          >
            <FieldBlock
              label={t('Enter phone numbers (one per line or comma-separated)')}
            >
              <TextField
                multiline
                minRows={4}
                fullWidth
                value={phoneInput}
                onChange={(event) => setPhoneInput(event.target.value)}
                id="parent-whatsapp-page-input"
                className="parent-whatsapp-page-input"
              />
            </FieldBlock>

            <FieldBlock label={t('Phone Number Limit')}>
              <TextField
                type="number"
                fullWidth
                value={whatsappPhoneLimit}
                onChange={(event) =>
                  handleWhatsappPhoneLimitChange(event.target.value)
                }
                id="parent-whatsapp-page-input"
                className="parent-whatsapp-page-input"
                inputProps={{
                  min: 1,
                }}
              />
            </FieldBlock>

            <FieldBlock label={t('Template Name')}>
              <TextField
                fullWidth
                value={templateName}
                onChange={(event) => setTemplateName(event.target.value)}
                id="parent-whatsapp-page-input"
                className="parent-whatsapp-page-input"
              />
            </FieldBlock>

            <FieldBlock label={t('Template Language Code (hi/en/kn)')}>
              <TextField
                fullWidth
                value={templateLang}
                onChange={(event) => setTemplateLang(event.target.value)}
                id="parent-whatsapp-page-input"
                className="parent-whatsapp-page-input"
              />
            </FieldBlock>

            <FieldBlock label={t('Message Type')}>
              <TextField
                select
                fullWidth
                value={messageType}
                onChange={(event) =>
                  setMessageType(event.target.value as 'utility' | 'marketing')
                }
                id="parent-whatsapp-page-input"
                className="parent-whatsapp-page-input"
              >
                <MenuItem value="utility">{t('utility')}</MenuItem>
                <MenuItem value="marketing">{t('marketing')}</MenuItem>
              </TextField>
            </FieldBlock>

            <FieldBlock
              label={t(
                'Upload Image (<=5MB) or Video (<=16MB) (optional, must match template header type)',
              )}
            >
              <div
                id={uploadZoneClassName}
                className={uploadZoneClassName}
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
                <div
                  id="parent-whatsapp-page-upload-copy"
                  className="parent-whatsapp-page-upload-copy"
                >
                  <CloudUploadOutlined
                    id="parent-whatsapp-page-upload-icon"
                    className="parent-whatsapp-page-upload-icon"
                  />
                  <div>
                    <div
                      id="parent-whatsapp-page-upload-title"
                      className="parent-whatsapp-page-upload-title"
                    >
                      {t('Drag and drop file here')}
                    </div>
                    <div
                      id="parent-whatsapp-page-upload-caption"
                      className="parent-whatsapp-page-upload-caption"
                    >
                      {t(
                        'Limit 200MB per file | PNG, JPEG, MP4, 3GP, JPG, MPEG4',
                      )}
                    </div>
                  </div>
                </div>
                <Button
                  variant="outlined"
                  id="parent-whatsapp-page-browse-button"
                  className="parent-whatsapp-page-browse-button"
                  onClick={(event) => {
                    event.stopPropagation();
                    uploadInputRef.current?.click();
                  }}
                >
                  {t('Browse files')}
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
                <div
                  id="parent-whatsapp-page-upload-file"
                  className="parent-whatsapp-page-upload-file"
                >
                  <div
                    id="parent-whatsapp-page-upload-file-info"
                    className="parent-whatsapp-page-upload-file-info"
                  >
                    <InsertDriveFileOutlined
                      id="parent-whatsapp-page-upload-file-icon"
                      className="parent-whatsapp-page-upload-file-icon"
                    />
                    <div
                      id="parent-whatsapp-page-upload-file-copy"
                      className="parent-whatsapp-page-upload-file-copy"
                    >
                      <div
                        id="parent-whatsapp-page-upload-file-name"
                        className="parent-whatsapp-page-upload-file-name"
                      >
                        {uploadedMedia.name}
                      </div>
                      <div
                        id="parent-whatsapp-page-upload-file-size"
                        className="parent-whatsapp-page-upload-file-size"
                      >
                        {formatFileSize(uploadedMedia.size)}
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    id="parent-whatsapp-page-upload-file-remove"
                    className="parent-whatsapp-page-upload-file-remove"
                    onClick={() => setUploadedMedia(null)}
                    aria-label={String(t('Remove uploaded file'))}
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
              id="parent-whatsapp-page-action-button"
              className="parent-whatsapp-page-action-button"
            >
              {t('Send WhatsApp Message')}
            </Button>

            {isSendingWhatsapp || whatsappProgress > 0 ? (
              <Box
                id="parent-whatsapp-page-progress"
                className="parent-whatsapp-page-progress"
              >
                <LinearProgress
                  variant="determinate"
                  value={whatsappProgress}
                />
                <Typography
                  id="parent-whatsapp-page-progress-text"
                  className="parent-whatsapp-page-progress-text"
                >
                  {t('{{value}}% complete', { value: whatsappProgress })}
                </Typography>
              </Box>
            ) : null}

            {manualFeedback ? (
              <Alert
                severity={manualFeedback.severity}
                id="parent-whatsapp-page-alert"
                className="parent-whatsapp-page-alert"
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
                id="parent-whatsapp-page-summary"
                className="parent-whatsapp-page-summary"
              >
                <div
                  id="parent-whatsapp-page-summary-pill"
                  className="parent-whatsapp-page-summary-pill"
                >
                  {t('Attempted')}: {manualSendSummary.attempted}
                </div>
                <div
                  id="parent-whatsapp-page-summary-pill"
                  className="parent-whatsapp-page-summary-pill"
                >
                  {t('Success')}: {manualSendSummary.successCount}
                </div>
                <div
                  id="parent-whatsapp-page-summary-pill"
                  className="parent-whatsapp-page-summary-pill"
                >
                  {t('Failed')}: {manualSendSummary.failed.length}
                </div>
              </Stack>
            ) : null}
          </div>

          <DataFrameCard
            title={t('Invalid Numbers')}
            rows={manualValidation.invalid.map((value) => ({ number: value }))}
            columns={[{ key: 'number', label: t('Number') }]}
          />
          <DataFrameCard
            title={t('Duplicate Numbers')}
            rows={manualValidation.duplicates.map((value) => ({
              number: value,
            }))}
            columns={[{ key: 'number', label: t('Number') }]}
          />
          <DataFrameCard
            title={t('WhatsApp Failures')}
            rows={(manualSendSummary?.failed ?? []).map((failure) => ({
              mobile: failure.mobile,
              reason: failure.error.message,
              statusCode: failure.error.statusCode,
              responseText: failure.error.responseText,
            }))}
            columns={[
              { key: 'mobile', label: t('Mobile') },
              { key: 'reason', label: t('Reason') },
              { key: 'statusCode', label: t('Status Code') },
              { key: 'responseText', label: t('Response Text') },
            ]}
          />
        </>
      ) : (
        <>
          {showMsg91Report ? (
            <>
              <div
                id="parent-whatsapp-page-form-grid parent-whatsapp-page-report-grid"
                className="parent-whatsapp-page-form-grid parent-whatsapp-page-report-grid"
              >
                <FieldBlock label={t('Start Date')}>
                  <TextField
                    fullWidth
                    type="date"
                    value={startDate}
                    onChange={(event) => setStartDate(event.target.value)}
                    id="parent-whatsapp-page-input parent-whatsapp-page-date-input"
                    className="parent-whatsapp-page-input parent-whatsapp-page-date-input"
                    InputLabelProps={{ shrink: true }}
                  />
                </FieldBlock>

                <FieldBlock label={t('End Date')}>
                  <TextField
                    fullWidth
                    type="date"
                    value={endDate}
                    onChange={(event) => setEndDate(event.target.value)}
                    id="parent-whatsapp-page-input parent-whatsapp-page-date-input"
                    className="parent-whatsapp-page-input parent-whatsapp-page-date-input"
                    InputLabelProps={{ shrink: true }}
                  />
                </FieldBlock>
              </div>

              <Button
                variant="outlined"
                disabled={isLoadingReport}
                onClick={handleFetchReport}
                id="parent-whatsapp-page-action-button parent-whatsapp-page-report-button"
                className="parent-whatsapp-page-action-button parent-whatsapp-page-report-button"
              >
                {t('Get Report')}
              </Button>

              {reportFeedback ? (
                <Alert
                  severity={reportFeedback.severity}
                  id="parent-whatsapp-page-alert"
                  className="parent-whatsapp-page-alert"
                >
                  {reportFeedback.text}
                </Alert>
              ) : null}

              {reportRows.length > 0 ||
              reportFeedback?.severity === 'success' ? (
                <Typography
                  id="parent-whatsapp-page-report-count"
                  className="parent-whatsapp-page-report-count"
                >
                  {t('Total Count')}: {reportRows.length}
                </Typography>
              ) : null}

              <DataFrameCard title={t('MSG91 Report Rows')} rows={reportRows} />
            </>
          ) : (
            <>
              <div
                id="parent-whatsapp-page-form-area"
                className="parent-whatsapp-page-form-area"
              >
                <FieldBlock label={t('Enter UDISE codes')}>
                  <TextField
                    multiline
                    minRows={4}
                    fullWidth
                    value={udiseInput}
                    onChange={(event) => setUdiseInput(event.target.value)}
                    id="parent-whatsapp-page-input"
                    className="parent-whatsapp-page-input"
                  />
                </FieldBlock>

                <FieldBlock label={t('Message Limit')}>
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
                    id="parent-whatsapp-page-input parent-whatsapp-page-input--limit"
                    className="parent-whatsapp-page-input parent-whatsapp-page-input--limit"
                    InputProps={{
                      endAdornment: (
                        <Box
                          id="parent-whatsapp-page-limit-stepper"
                          className="parent-whatsapp-page-limit-stepper"
                        >
                          <button
                            type="button"
                            id="parent-whatsapp-page-limit-button"
                            className="parent-whatsapp-page-limit-button"
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
                            id="parent-whatsapp-page-limit-button"
                            className="parent-whatsapp-page-limit-button"
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

                <div
                  id="parent-whatsapp-page-button-stack"
                  className="parent-whatsapp-page-button-stack"
                >
                  <Button
                    variant="outlined"
                    startIcon={<AssessmentOutlined />}
                    disabled={isAnalyzing}
                    onClick={handleAnalyze}
                    id="parent-whatsapp-page-action-button"
                    className="parent-whatsapp-page-action-button"
                  >
                    {t('Run Analysis')}
                  </Button>
                </div>

                {analysisFeedback ? (
                  <Alert
                    severity={analysisFeedback.severity}
                    id="parent-whatsapp-page-alert"
                    className="parent-whatsapp-page-alert"
                  >
                    {analysisFeedback.text}
                  </Alert>
                ) : null}

                {smsFeedback ? (
                  <Alert
                    severity={smsFeedback.severity}
                    id="parent-whatsapp-page-alert"
                    className="parent-whatsapp-page-alert"
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
                    id="parent-whatsapp-page-summary"
                    className="parent-whatsapp-page-summary"
                  >
                    <div
                      id="parent-whatsapp-page-summary-pill"
                      className="parent-whatsapp-page-summary-pill"
                    >
                      {t('Success Count')}: {smsResult.successCount}
                    </div>
                    <div
                      id="parent-whatsapp-page-summary-pill"
                      className="parent-whatsapp-page-summary-pill"
                    >
                      {t('Failed Batches')}: {smsResult.failedBatches.length}
                    </div>
                  </Stack>
                ) : null}
              </div>

              {analysisResult ? (
                <section
                  id="parent-whatsapp-page-analysis-output"
                  className="parent-whatsapp-page-analysis-output"
                >
                  <div
                    id="parent-whatsapp-page-processed-block"
                    className="parent-whatsapp-page-processed-block"
                  >
                    <div
                      id="parent-whatsapp-page-processed-heading"
                      className="parent-whatsapp-page-processed-heading"
                    >
                      <Typography
                        id="parent-whatsapp-page-processed-title"
                        className="parent-whatsapp-page-processed-title"
                      >
                        {t('Processed UDISE')}
                      </Typography>
                    </div>
                    <pre
                      id="parent-whatsapp-page-processed-list"
                      className="parent-whatsapp-page-processed-list"
                    >
                      {formatProcessedUdiseRows(analysisResult.processedUdise)}
                    </pre>
                  </div>

                  <div
                    id="parent-whatsapp-page-missing-block"
                    className="parent-whatsapp-page-missing-block"
                  >
                    <Typography
                      id="parent-whatsapp-page-missing-label"
                      className="parent-whatsapp-page-missing-label"
                    >
                      {t('Total Missing Parents')}
                    </Typography>
                    <Typography
                      id="parent-whatsapp-page-missing-value"
                      className="parent-whatsapp-page-missing-value"
                    >
                      {analysisResult.totalMissing}
                    </Typography>
                  </div>

                  <DataFrameCard
                    rows={analysisResult.inviteList}
                    columns={[
                      { key: 'udise', label: t('UDISE') },
                      { key: 'school', label: t('School') },
                      { key: 'className', label: t('Class') },
                      { key: 'mobile', label: t('Mobile') },
                      { key: 'inviteLink', label: t('Invite Link') },
                    ]}
                    showWhenEmpty
                  />

                  <Button
                    variant="outlined"
                    startIcon={<SendOutlined />}
                    disabled={isSendingSms || !analysisResult.inviteList.length}
                    onClick={handleSendSmsInvites}
                    id="parent-whatsapp-page-action-button parent-whatsapp-page-analysis-send-button"
                    className="parent-whatsapp-page-action-button parent-whatsapp-page-analysis-send-button"
                  >
                    {t('Send Invitation to Parents')}
                  </Button>
                </section>
              ) : null}

              <DataFrameCard
                title={t('Failed Groups')}
                rows={analysisResult?.failedGroups ?? []}
                columns={[
                  { key: 'udise', label: t('UDISE') },
                  { key: 'school', label: t('School') },
                  { key: 'className', label: t('Class') },
                  { key: 'groupId', label: t('Group ID') },
                  { key: 'error', label: t('Error') },
                  { key: 'statusCode', label: t('Status Code') },
                ]}
              />

              <DataFrameCard
                title={t('Failed MSG91 Batches')}
                rows={(smsResult?.failedBatches ?? []).map((failure) => ({
                  batchIndex: failure.batchIndex,
                  recipients: failure.recipients.join(', '),
                  error: failure.error.message,
                  statusCode: failure.error.statusCode,
                  responseText: failure.error.responseText,
                }))}
                columns={[
                  { key: 'batchIndex', label: t('Batch Index') },
                  { key: 'recipients', label: t('Recipients') },
                  { key: 'error', label: t('Error') },
                  { key: 'statusCode', label: t('Status Code') },
                  { key: 'responseText', label: t('Response Text') },
                ]}
              />
            </>
          )}
        </>
      )}
    </div>
  );
};

export default ParentWhatsappInvitationPage;
