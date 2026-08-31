import React from 'react';
import FormSection from '../components/SchoolRequestComponents/FormSection';
import SchoolNameHeaderComponent from '../components/SchoolDetailsComponents/SchoolNameHeaderComponent';
import { useHistory, useLocation, useParams } from 'react-router-dom';
import Breadcrumb from '../components/Breadcrumb';
import {
  Box,
  Grid,
  Typography,
  FormControl,
  Select,
  MenuItem,
} from '@mui/material';
import ContactFormSection from '../components/SchoolRequestComponents/ContactFormSection';
import './SchoolFormPage.css';
import { t } from 'i18next';
import { PAGES } from '../../common/constants';
import { useSchoolFormPage } from '../hooks/useSchoolFormPage';

const SchoolFormPage: React.FC = () => {
  const history = useHistory();
  const location = useLocation();
  const { id } = useParams<{ id: string }>();

  const {
    address,
    contacts,
    fieldCoordinator,
    fieldCoordinators,
    handleAddressChange,
    handleApprove,
    handleContactChange,
    isSaveDisabled,
    program,
    programs,
    school,
    setFieldCoordinator,
    setProgram,
  } = useSchoolFormPage({ id, locationState: location.state, history });
  const dropdownMenuProps = {
    disablePortal: true,
    PaperProps: {
      style: {
        maxHeight: 300,
      },
    },
    anchorOrigin: {
      vertical: 'top',
      horizontal: 'center',
    },
    transformOrigin: {
      vertical: 'bottom',
      horizontal: 'center',
    },
    getContentAnchorEl: null,
  };

  return (
    <div className="school-form-main-container">
      <div className="school-form-header">
        {school && <SchoolNameHeaderComponent schoolName={school.name} />}
      </div>

      <div className="school-form-secondary-header">
        <Breadcrumb
          crumbs={[
            {
              label: 'Pending',
              onClick: () =>
                history.push(`${PAGES.SIDEBAR_PAGE}${PAGES.REQUEST_LIST}`),
            },
            {
              label: 'Request ID - ' + id,
              onClick: () => history.goBack(),
            },
            {
              label: 'Add School',
            },
          ]}
        />
      </div>
      {school && (
        <div className="school-form-container">
          <FormSection
            title={t('School Details')}
            fields={[
              {
                label: t('School Name'),
                name: 'schoolName',
                value: school.name,
                required: true,
                editable: false,
              },
              {
                label: t('School ID') + ' (UDISE)',
                name: 'udise',
                value: school.udise,
                required: true,
                editable: false,
              },
            ]}
          />

          <FormSection
            title={t('Address & Location')}
            fields={[
              {
                label: t('State'),
                name: 'state',
                value: address.state,
                required: true,
                editable: false,
                onChange: handleAddressChange,
              },
              {
                label: t('District'),
                name: 'district',
                value: address.district,
                required: true,
                editable: false,
                onChange: handleAddressChange,
              },
              {
                label: t('Block'),
                name: 'block',
                value: address.block,
                required: true,
                editable: false,
                onChange: handleAddressChange,
              },
              {
                label: t('Address'),
                name: 'address',
                value: address.address,
                editable: false,
                onChange: handleAddressChange,
              },
            ]}
          />

          <ContactFormSection
            title={t('Key Contacts')}
            fields={contacts}
            onChange={handleContactChange}
          />

          {/* Program + fieldCoordinator Dropdowns inline */}
          <Box className="school-form-dropdown-container">
            <Typography variant="h6" className="school-form-dropdown-title">
              {t('Program Details')}
            </Typography>
            <Grid container spacing={3}>
              {/* Program Dropdown */}
              <Grid size={{ xs: 12, md: 3.5 }}>
                <FormControl
                  fullWidth
                  size="small"
                  className="school-form-dropdown-form-control"
                >
                  <Typography className="school-form-dropdown-label">
                    {t('Program Name')}{' '}
                    <span className="school-form-dropdown-required">*</span>
                  </Typography>
                  <Select
                    value={program?.id || ''}
                    onChange={(e) => {
                      const selectedProgram = programs.find(
                        (p) => p.id === e.target.value,
                      );
                      setProgram(selectedProgram || null);
                    }}
                    displayEmpty
                    renderValue={() =>
                      program?.name ? (
                        program.name
                      ) : (
                        <span className="school-form-dropdown-placeholder">
                          {t('Select Program')}
                        </span>
                      )
                    }
                    MenuProps={dropdownMenuProps as any}
                  >
                    {programs.map((p) => (
                      <MenuItem key={p.id ?? p.name} value={p.id}>
                        {p.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* fieldCoordinator Dropdown */}
              <Grid size={{ xs: 12, md: 3.5 }}>
                <FormControl
                  fullWidth
                  size="small"
                  className="school-form-dropdown-form-control"
                >
                  <Typography className="school-form-dropdown-label">
                    {t('Field Coordinator')}{' '}
                    <span className="school-form-dropdown-required">*</span>
                  </Typography>
                  <Select
                    value={fieldCoordinator || ''}
                    onChange={(e) => {
                      const selectedFc = fieldCoordinators.find(
                        (fc) => fc.id === e.target.value,
                      );
                      setFieldCoordinator(selectedFc || null);
                    }}
                    displayEmpty
                    renderValue={() =>
                      fieldCoordinator?.name ? (
                        fieldCoordinator.name
                      ) : (
                        <span className="school-form-dropdown-placeholder">
                          {t('Select Field Coordinator')}
                        </span>
                      )
                    }
                    MenuProps={dropdownMenuProps as any}
                  >
                    {fieldCoordinators.map((fc) => (
                      <MenuItem key={fc.id ?? fc.name} value={fc.id}>
                        {fc.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Box>

          <div className="user-details-button-row">
            <>
              <button
                className="user-details-cancel-btn"
                onClick={() => history.goBack()}
              >
                {t('Cancel')}
              </button>
              <button
                className="user-details-save-btn"
                onClick={handleApprove}
                disabled={isSaveDisabled()}
              >
                {t('Save')}
              </button>
            </>
          </div>
        </div>
      )}
    </div>
  );
};

export default SchoolFormPage;
