import React from 'react';
import {
  Divider,
  FormControl,
  MenuItem,
  Paper,
  Select,
  Typography,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { RequestTypes, TableTypes } from '../../common/constants';

type OpsFlaggedRequestLeftPanelProps = {
  classOptions: Array<{ id: string; name: string }>;
  flaggedBy: any;
  formatDT: (d: string | undefined) => string;
  isLoadingDropdowns: boolean;
  requestDetails: TableTypes<'ops_requests'>;
  requestedBy: any;
  requestTypeOptions: string[];
  selectedClassId: string;
  selectedRequestType: string;
  selectedSchoolId: string;
  setSelectedClass: React.Dispatch<React.SetStateAction<string>>;
  setSelectedClassId: React.Dispatch<React.SetStateAction<string>>;
  setSelectedRequestType: React.Dispatch<React.SetStateAction<string>>;
  setValidationErrors: React.Dispatch<
    React.SetStateAction<{ [key: string]: string }>
  >;
  validationErrors: { [key: string]: string };
};

export default function OpsFlaggedRequestLeftPanel({
  classOptions,
  flaggedBy,
  formatDT,
  isLoadingDropdowns,
  requestDetails,
  requestedBy,
  requestTypeOptions,
  selectedClassId,
  selectedRequestType,
  selectedSchoolId,
  setSelectedClass,
  setSelectedClassId,
  setSelectedRequestType,
  setValidationErrors,
  validationErrors,
}: OpsFlaggedRequestLeftPanelProps) {
  const { t } = useTranslation();

  return (
    <>
      <Paper className="ops-flagged-request-details-card">
        <Typography
          variant="h6"
          className="ops-flagged-request-details-card-title"
        >
          {t('Request From')}
        </Typography>
        <Divider className="ops-flagged-request-details-divider" />
        <div className="ops-flagged-request-details-field-stack">
          <div className="ops-flagged-request-details-label">{t('Name')}</div>
          <div>{requestedBy.name || t('-')}</div>
        </div>
        <div className="ops-flagged-request-details-field-stack">
          <div className="ops-flagged-request-details-label">
            {t('Phone Number')}
          </div>
          <div>{requestedBy.phone || t('-')}</div>
        </div>
        <div className="ops-flagged-request-details-field-stack">
          <div className="ops-flagged-request-details-label">
            {t('Email ID')}
          </div>
          <div>{requestedBy.email || t('-')}</div>
        </div>
        <Divider className="ops-flagged-request-details-divider" />
        <Typography
          variant="h6"
          className="ops-flagged-request-details-card-title"
        >
          {t('Request Details')}
        </Typography>
        <Divider className="ops-flagged-request-details-divider" />
        <div className="ops-flagged-request-details-field-row-label">
          <div className="ops-flagged-request-details-label">
            {t('Request Type')}
          </div>
          <FormControl
            className="ops-flagged-request-details-dropdown"
            error={!!validationErrors.requestType}
          >
            <Select
              value={selectedRequestType}
              onChange={(e) => {
                setSelectedRequestType(e.target.value);
                setValidationErrors({
                  ...validationErrors,
                  requestType: '',
                });
              }}
              displayEmpty
              disabled={isLoadingDropdowns}
            >
              <MenuItem value="" disabled>
                {t('Select Request Type')}
              </MenuItem>
              {requestTypeOptions.map((opt) => (
                <MenuItem key={opt} value={opt}>
                  {opt.charAt(0).toUpperCase() + opt.slice(1).toLowerCase()}
                </MenuItem>
              ))}
            </Select>
            {validationErrors.requestType && (
              <Typography variant="caption" color="error">
                {validationErrors.requestType}
              </Typography>
            )}
          </FormControl>
        </div>
        <div className="ops-flagged-request-details-field-row-label">
          <div className="ops-flagged-request-details-label">
            {t('Select Class')}
          </div>
          <FormControl
            className="ops-flagged-request-details-dropdown"
            error={!!validationErrors.class}
          >
            <Select
              value={selectedClassId || ''}
              onChange={(e) => {
                setSelectedClassId(e.target.value);
                const selectedClassItem = classOptions.find(
                  (c) => c.id === e.target.value,
                );
                setSelectedClass(selectedClassItem?.name || '');
                setValidationErrors({ ...validationErrors, class: '' });
              }}
              displayEmpty
              disabled={
                selectedRequestType === RequestTypes.PRINCIPAL ||
                !selectedSchoolId ||
                classOptions.length === 0
              }
            >
              <MenuItem value="" disabled>
                {classOptions.length === 0 && selectedSchoolId
                  ? t('No classes available for this school')
                  : t('Select Class')}
              </MenuItem>
              {classOptions.map((opt) => (
                <MenuItem key={opt.id} value={opt.id}>
                  {opt.name}
                </MenuItem>
              ))}
            </Select>
            {validationErrors.class && (
              <Typography variant="caption" color="error">
                {validationErrors.class}
              </Typography>
            )}
            {selectedSchoolId &&
              classOptions.length === 0 &&
              !validationErrors.class && (
                <Typography variant="caption" color="textSecondary">
                  {t('This school has no class sections configured')}
                </Typography>
              )}
          </FormControl>
        </div>
      </Paper>
      <Paper className="ops-flagged-request-details-flagged-card ops-flagged-request-details-card">
        <Typography
          variant="h6"
          className="ops-flagged-request-details-card-title"
        >
          {t('Flagged Details')}
        </Typography>
        <Divider className="ops-flagged-request-details-divider" />
        <div className="ops-flagged-request-details-field-stack">
          <div className="ops-flagged-request-details-label">
            {t('Flagged By')}
          </div>
          <div>{flaggedBy.name || t('-')}</div>
        </div>
        <div className="ops-flagged-request-details-field-stack">
          <div className="ops-flagged-request-details-label">
            {t('Phone Number')}
          </div>
          <div>{flaggedBy.phone || t('-')}</div>
        </div>
        <div className="ops-flagged-request-details-field-stack">
          <div className="ops-flagged-request-details-label">
            {t('Flagged On')}
          </div>
          <div>{formatDT(requestDetails.updated_at)}</div>
        </div>
      </Paper>
    </>
  );
}
