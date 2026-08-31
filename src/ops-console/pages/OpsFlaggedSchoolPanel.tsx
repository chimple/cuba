import React from 'react';
import {
  Autocomplete,
  Button,
  Divider,
  IconButton,
  InputAdornment,
  Paper,
  TextField,
  Typography,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { useTranslation } from 'react-i18next';

type SchoolOption = { id: string; name: string; udise?: string };

type OpsFlaggedSchoolPanelProps = {
  classOptions: Array<{ id: string; name: string }>;
  handleApprove: () => void;
  handleCancel: () => void;
  handleSchoolSearch: (searchTerm: string) => void;
  handleSchoolSelect: (school: SchoolOption | null) => void;
  isApproving: boolean;
  isFetchingSchool: boolean;
  isInitialLoad: boolean;
  isLoading: boolean;
  schoolInputValue: string;
  schoolOptions: SchoolOption[];
  selectedCountry: string;
  selectedDistrict: string;
  selectedSchoolUdise: string;
  selectedState: string;
  setClassOptions: React.Dispatch<
    React.SetStateAction<Array<{ id: string; name: string }>>
  >;
  setInitialUdiseSet: React.Dispatch<React.SetStateAction<boolean>>;
  setIsInitialLoad: React.Dispatch<React.SetStateAction<boolean>>;
  setSchoolInputValue: React.Dispatch<React.SetStateAction<string>>;
  setSelectedClass: React.Dispatch<React.SetStateAction<string>>;
  setSelectedClassId: React.Dispatch<React.SetStateAction<string>>;
  setSelectedCountry: React.Dispatch<React.SetStateAction<string>>;
  setSelectedDistrict: React.Dispatch<React.SetStateAction<string>>;
  setSelectedSchoolId: React.Dispatch<React.SetStateAction<string>>;
  setSelectedSchoolName: React.Dispatch<React.SetStateAction<string>>;
  setSelectedSchoolUdise: React.Dispatch<React.SetStateAction<string>>;
  setSelectedState: React.Dispatch<React.SetStateAction<string>>;
  setValidationErrors: React.Dispatch<
    React.SetStateAction<{ [key: string]: string }>
  >;
  validationErrors: { [key: string]: string };
};

export default function OpsFlaggedSchoolPanel({
  classOptions,
  handleApprove,
  handleCancel,
  handleSchoolSearch,
  handleSchoolSelect,
  isApproving,
  isFetchingSchool,
  isInitialLoad,
  isLoading,
  schoolInputValue,
  schoolOptions,
  selectedCountry,
  selectedDistrict,
  selectedSchoolUdise,
  selectedState,
  setClassOptions,
  setInitialUdiseSet,
  setIsInitialLoad,
  setSchoolInputValue,
  setSelectedClass,
  setSelectedClassId,
  setSelectedCountry,
  setSelectedDistrict,
  setSelectedSchoolId,
  setSelectedSchoolName,
  setSelectedSchoolUdise,
  setSelectedState,
  setValidationErrors,
  validationErrors,
}: OpsFlaggedSchoolPanelProps) {
  const { t } = useTranslation();

  const clearSchool = () => {
    setSelectedSchoolUdise('');
    setSelectedSchoolId('');
    setSelectedSchoolName('');
    setSchoolInputValue('');
    setSelectedDistrict('');
    setSelectedState('');
    setSelectedCountry('');
    setClassOptions([]);
    setSelectedClassId('');
    setSelectedClass('');
  };

  return (
    <>
      <Paper className="ops-flagged-request-details-card">
        <Typography
          variant="h6"
          className="ops-flagged-request-details-card-title"
        >
          {t('School Details')}
        </Typography>
        <Divider className="ops-flagged-request-details-divider" />
        <div className="ops-flagged-request-details-field-row-label">
          <div className="ops-flagged-request-details-label">
            {t('School ID (UDISE)')}
          </div>
          <TextField
            value={selectedSchoolUdise}
            onChange={(e) => {
              setIsInitialLoad(false);
              setInitialUdiseSet(true);
              const val = e.target.value;
              setSelectedSchoolUdise(val);
              setValidationErrors({ ...validationErrors, udise: '' });
              if (!val) clearSchool();
            }}
            variant="outlined"
            size="small"
            className="ops-flagged-request-details-textfield"
            placeholder={t('Enter UDISE') || ''}
            error={!!validationErrors.udise}
            helperText={
              validationErrors.udise ||
              (isFetchingSchool ? t('Fetching school details...') : '')
            }
            disabled={isFetchingSchool}
            InputProps={{
              endAdornment: selectedSchoolUdise ? (
                <InputAdornment
                  position="end"
                  sx={{ position: 'absolute', right: 6 }}
                >
                  <IconButton
                    aria-label="clear"
                    title="Clear"
                    onClick={() => {
                      clearSchool();
                      setValidationErrors({
                        ...validationErrors,
                        udise: '',
                      });
                      setIsInitialLoad(false);
                      setInitialUdiseSet(true);
                    }}
                    onMouseDown={(e) => e.preventDefault()}
                    size="small"
                  >
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </InputAdornment>
              ) : null,
            }}
            inputProps={{
              style: {
                paddingRight: selectedSchoolUdise ? '30px' : undefined,
              },
            }}
          />
        </div>
        <div className="ops-flagged-request-details-field-row-label">
          <div className="ops-flagged-request-details-label">
            {t('School Name')}
          </div>
          <Autocomplete
            freeSolo
            onChange={(_, newValue) => {
              if (isInitialLoad) return;
              if (typeof newValue === 'object' && newValue !== null) {
                handleSchoolSelect(newValue);
              } else if (typeof newValue === 'string') {
                setSelectedSchoolName(newValue);
                setSelectedSchoolId('');
                setSelectedSchoolUdise('');
                setSelectedDistrict('');
                setSelectedState('');
                setSelectedCountry('');
                setClassOptions([]);
                setSelectedClassId('');
                setSelectedClass('');
              } else {
                handleSchoolSelect(null);
              }
            }}
            onInputChange={(_, newInputValue, reason) => {
              if (reason === 'input') {
                setIsInitialLoad(false);
              }
              if (isInitialLoad && reason === 'reset') {
                return;
              }
              setSchoolInputValue(newInputValue);
              if (
                reason === 'clear' ||
                (reason === 'input' && newInputValue === '')
              ) {
                handleSchoolSelect(null);
              } else if (reason === 'input' && newInputValue.length >= 3) {
                handleSchoolSearch(newInputValue);
              }
            }}
            inputValue={schoolInputValue}
            options={schoolOptions}
            getOptionLabel={(option) =>
              typeof option === 'string' ? option : option.name
            }
            renderInput={(params) => (
              <TextField
                {...params}
                variant="outlined"
                size="small"
                placeholder={t('Search School') || ''}
                error={!!validationErrors.schoolName}
                helperText={validationErrors.schoolName}
              />
            )}
            className="ops-flagged-request-details-dropdown"
            clearOnEscape
          />
        </div>
        <Divider className="ops-flagged-request-details-divider" />
        <div className="ops-flagged-request-details-flex-row">
          <div className="ops-flagged-request-details-field-column">
            <div className="ops-flagged-request-details-label">
              {t('District')}
            </div>
            <div className="ops-flagged-request-details-value">
              {selectedDistrict || '-'}
            </div>
          </div>
          <div className="ops-flagged-request-details-field-column">
            <div className="ops-flagged-request-details-label">
              {t('State')}
            </div>
            <div className="ops-flagged-request-details-value">
              {selectedState || '-'}
            </div>
          </div>
        </div>
        <div className="ops-flagged-request-details-field-column">
          <div className="ops-flagged-request-details-label">
            {t('Country')}
          </div>
          <div className="ops-flagged-request-details-value">
            {selectedCountry || '-'}
          </div>
        </div>
      </Paper>
      <div className="ops-flagged-request-details-action-row">
        <Button
          variant="outlined"
          color="error"
          className="ops-flagged-request-details-cancel-btn"
          onClick={handleCancel}
          disabled={isApproving}
        >
          {t('Cancel')}
        </Button>
        <Button
          variant="contained"
          color="success"
          className="ops-flagged-request-details-approve-btn"
          onClick={handleApprove}
          disabled={isApproving || isLoading}
        >
          {isApproving ? t('Approving...') : t('Approve')}
        </Button>
      </div>
    </>
  );
}
