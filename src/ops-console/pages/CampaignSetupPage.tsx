import React, { useEffect } from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  IconButton,
  Typography,
} from '@mui/material';
import { ArrowBack, ChevronRight, Notifications } from '@mui/icons-material';
import { useHistory } from 'react-router-dom';
import {
  CampaignDetailsSection,
  CampaignSetupStepper,
  ObjectiveGoalSection,
  TargetAudienceSection,
} from '../components/CampaignSetupSections';
import { useCampaignSetupForm } from '../hooks/useCampaignSetupForm';
import './CampaignSetupPage.css';

const CampaignSetupPage: React.FC = () => {
  const history = useHistory();
  const campaignSetup = useCampaignSetupForm();

  useEffect(() => {
    document.body.classList.add('campaign-setup-active');
    return () => {
      document.body.classList.remove('campaign-setup-active');
    };
  }, []);

  if (campaignSetup.loadingInitial) {
    return (
      <Box className="campaign-setup-loading">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box className="campaign-setup-page">
      <Box className="campaign-setup-header">
        <IconButton
          className="campaign-setup-back-button"
          onClick={() => history.goBack()}
          aria-label="Back"
        >
          <ArrowBack />
        </IconButton>
        <Box>
          <Typography variant="h4" className="campaign-setup-title">
            New Campaign
          </Typography>
          <Box className="campaign-setup-breadcrumb">
            <span>Campaigns</span>
            <ChevronRight className="campaign-setup-breadcrumb-icon" />
            <strong>New Campaign</strong>
          </Box>
        </Box>
        <Notifications className="campaign-setup-notification" />
      </Box>

      {campaignSetup.message && (
        <Alert
          severity={campaignSetup.message.type}
          className="campaign-setup-alert"
        >
          {campaignSetup.message.text}
        </Alert>
      )}

      <Box
        component="form"
        className="campaign-setup-form"
        onSubmit={campaignSetup.handleSubmit}
      >
        <CampaignSetupStepper activeStep={campaignSetup.activeStep} />

        <ObjectiveGoalSection
          form={campaignSetup.form}
          onObjectiveChange={campaignSetup.handleObjectiveChange}
          onSelectChange={campaignSetup.handleSelectChange}
          onNumericChange={campaignSetup.updateNumericForm}
          fieldError={campaignSetup.fieldError}
        />

        <CampaignDetailsSection
          form={campaignSetup.form}
          managers={campaignSetup.managers}
          onTextChange={campaignSetup.updateForm}
          onSelectChange={campaignSetup.handleSelectChange}
          fieldError={campaignSetup.fieldError}
        />

        <TargetAudienceSection
          form={campaignSetup.form}
          programs={campaignSetup.programs}
          savedGroups={campaignSetup.savedGroups}
          selectedSavedGroupId={campaignSetup.selectedSavedGroupId}
          audienceOptions={campaignSetup.audienceOptions}
          selectedBlocks={campaignSetup.selectedBlocks}
          selectedSchools={campaignSetup.selectedSchools}
          selectedGrades={campaignSetup.selectedGrades}
          schoolsForSelectedBlocks={campaignSetup.schoolsForSelectedBlocks}
          loadingAudience={campaignSetup.loadingAudience}
          selectedProgramName={campaignSetup.selectedProgramName}
          summaryBlockCount={campaignSetup.summaryBlockCount}
          summarySchoolCount={campaignSetup.summarySchoolCount}
          loadingAudienceSummary={campaignSetup.loadingAudienceSummary}
          audienceSummary={campaignSetup.audienceSummary}
          saveGroup={campaignSetup.saveGroup}
          savingGroup={campaignSetup.savingGroup}
          onSavedGroupChange={campaignSetup.handleSavedGroupChange}
          onProgramChange={campaignSetup.handleProgramChange}
          onBlocksChange={campaignSetup.handleBlocksChange}
          onSchoolsChange={campaignSetup.handleSchoolsChange}
          onGradesChange={campaignSetup.handleGradesChange}
          onSaveGroupChange={campaignSetup.setSaveGroup}
          onGroupNameChange={campaignSetup.updateForm('groupName')}
          onSaveGroup={campaignSetup.handleSaveGroup}
          onCancelSaveGroup={() => {
            campaignSetup.setSaveGroup(false);
            campaignSetup.setForm((current) => ({
              ...current,
              groupName: '',
            }));
          }}
          fieldError={campaignSetup.fieldError}
        />

        <Box className="campaign-setup-actions">
          <Button
            type="submit"
            variant="contained"
            endIcon={
              campaignSetup.submitting ? (
                <CircularProgress size={18} />
              ) : undefined
            }
            disabled={
              !campaignSetup.isFormValid ||
              campaignSetup.submitting ||
              !!campaignSetup.createdCampaignId
            }
          >
            Next
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

export default CampaignSetupPage;
