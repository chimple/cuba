import React, { useEffect } from 'react';
import { Box, FormControl, MenuItem, Select, Typography } from '@mui/material';
import type { SelectProps } from '@mui/material/Select';
import { useTranslation } from 'react-i18next';
import { CampaignSelectPlaceholder } from './CampaignPlaceholder';
import { requiredLabel } from './constants';
import { MessagesMultiSelect } from './MessagesMultiSelect';
import MessagesAudienceSummary from './MessagesAudienceSummary';
import MessagesAudienceRefineSection from './MessagesAudienceRefineSection';
import MessagesSavedAudienceGroupFields from './MessagesSavedAudienceGroupFields';
import { useMessagesAudienceSelection } from '../../hooks/useMessagesAudienceSelection';
import { useMessagesTargetAudienceDerivedState } from './MessagesTargetAudienceSection.helpers';
import './TargetAudienceSection.css';

type MessagesTargetAudienceSectionProps = {
  onValidityChange?: (isValid: boolean) => void;
  audience?: ReturnType<typeof useMessagesAudienceSelection>;
  dropdownMenuProps?: SelectProps['MenuProps'];
};
export const MessagesTargetAudienceSection: React.FC<
  MessagesTargetAudienceSectionProps
> = ({ onValidityChange, audience: audienceProp, dropdownMenuProps }) => {
  const { t } = useTranslation();
  const fallbackAudience = useMessagesAudienceSelection();
  const audience = audienceProp ?? fallbackAudience;
  const {
    savedGroupNameById,
    programNameById,
    gradeSelectScopeKey,
    scopedSelectedGrades,
  } = useMessagesTargetAudienceDerivedState(
    audience.savedGroups,
    audience.programs,
    audience.availableGrades,
    audience.selectedSchools,
    audience.selectedGrades,
    audience.audienceOptions.schools.length,
  );
  useEffect(() => {
    const hasSelection =
      audience.programId.trim().length > 0 &&
      audience.summarySchoolCount > 0 &&
      audience.summaryBlockCount > 0 &&
      !audience.loadingAudience &&
      !audience.loadingGrades;

    onValidityChange?.(hasSelection);
  }, [
    audience.loadingAudience,
    audience.loadingGrades,
    audience.programId,
    audience.summaryBlockCount,
    audience.summarySchoolCount,
    onValidityChange,
  ]);

  return (
    <Box className="messages-page__messages-audience-shell">
      <Box className="campaign-setup-section">
        <Typography variant="h6" className="campaign-setup-section-title">
          {t('Target Audience')}
        </Typography>
        <Typography className="campaign-setup-section-copy">
          {t('Define your notification audience using hierarchical filters.')}
        </Typography>

        <Box className="target-audience-section-grid">
          <Box className="campaign-setup-field">
            <Typography className="campaign-setup-label messages-page__program-label">
              {t('Saved Target Group')}
            </Typography>
            <FormControl fullWidth>
              <Select
                value={audience.selectedSavedGroupId}
                onChange={audience.handleSavedGroupChange}
                displayEmpty
                renderValue={(value) =>
                  CampaignSelectPlaceholder(
                    value,
                    t('Select a saved group'),
                    savedGroupNameById.get(value),
                  )
                }
                size="small"
                MenuProps={dropdownMenuProps}
              >
                <MenuItem value="">{t('Select a saved group')}</MenuItem>
                {audience.savedGroups.map((group) => (
                  <MenuItem key={group.id} value={group.id}>
                    {group.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          <Box className="campaign-setup-field">
            <Typography className="campaign-setup-label messages-page__program-label">
              <>
                {t('Program')}{' '}
                <span className="messages-page__required">*</span>
              </>
            </Typography>
            <FormControl fullWidth error={!!audience.programError}>
              <Select
                value={audience.programId}
                onChange={audience.handleProgramChange}
                displayEmpty
                renderValue={(value) =>
                  CampaignSelectPlaceholder(
                    value,
                    t('Select Program'),
                    programNameById.get(value),
                  )
                }
                size="small"
                MenuProps={dropdownMenuProps}
              >
                <MenuItem value="" disabled>
                  {t('Select Program')}
                </MenuItem>
                {audience.programs.map((program) => (
                  <MenuItem key={program.id} value={program.id}>
                    {program.name}
                  </MenuItem>
                ))}
              </Select>
              {!!audience.programError && (
                <Typography
                  className="messages-page__program-error"
                  component="p"
                  variant="caption"
                >
                  {audience.programError}
                </Typography>
              )}
            </FormControl>
          </Box>

          <Box className="campaign-setup-field messages-page__program-model-field">
            <Typography className="campaign-setup-label messages-page__program-label">
              {t('Program Model')}
            </Typography>
            <FormControl fullWidth>
              <Select
                value={audience.programModel}
                onChange={(event) => audience.setProgramModel(event.target.value)}
                displayEmpty
                renderValue={(value) =>
                  CampaignSelectPlaceholder(
                    value,
                    t('Select Program Model'),
                    value || undefined,
                  )
                }
                size="small"
                MenuProps={dropdownMenuProps}
              >
                <MenuItem value="">{t('Select Program Model')}</MenuItem>
                <MenuItem value="At School">{t('At School')}</MenuItem>
                <MenuItem value="At Home">{t('At Home')}</MenuItem>
                <MenuItem value="Hybrid">{t('Hybrid')}</MenuItem>
              </Select>
            </FormControl>
          </Box>

          <Box className="campaign-setup-field">
            <Typography className="campaign-setup-label messages-page__program-label">
              {t('Block')}
            </Typography>
            <Box className="messages-page__multi-select-field">
              <MessagesMultiSelect
                options={audience.audienceOptions.blocks}
                value={audience.selectedBlocks}
                loading={audience.loadingAudience}
                placeholder={t('Select Blocks')}
                preventMobileKeyboard
                onChange={audience.handleBlocksChange}
              />
            </Box>
          </Box>

          <Box className="campaign-setup-field">
            <Typography className="campaign-setup-label messages-page__program-label">
              {t('School')}
            </Typography>
            <Box className="messages-page__multi-select-field">
              <MessagesMultiSelect
                options={audience.schoolsForSelectedBlocks}
                value={audience.selectedSchools}
                loading={audience.loadingAudience}
                placeholder={t('Select Schools')}
                preventMobileKeyboard
                getOptionLabel={(option) => option.name}
                isOptionEqualToValue={(option, value) => option.id === value.id}
                onChange={audience.handleSchoolsChange}
              />
            </Box>
            <Typography className="target-audience-section-field-note messages-page__field-note">
              {t('All schools under selected blocks are included.')}
            </Typography>
          </Box>

          <Box className="campaign-setup-field">
            <Typography className="campaign-setup-label messages-page__program-label">
              {t('Grade')}
            </Typography>
            <Box className="messages-page__multi-select-field">
              <MessagesMultiSelect
                key={gradeSelectScopeKey}
                options={audience.availableGrades}
                value={scopedSelectedGrades}
                loading={audience.loadingAudience || audience.loadingGrades}
                placeholder={t('Select Grade')}
                preventMobileKeyboard
                getOptionLabel={(option) => option.name}
                isOptionEqualToValue={(option, value) => option.id === value.id}
                onChange={audience.handleGradesChange}
              />
            </Box>
            <Typography className="target-audience-section-field-note messages-page__field-note">
              {t('All grades under selected schools are included.')}
            </Typography>
          </Box>
        </Box>
      </Box>

      <MessagesAudienceRefineSection
        audience={audience}
        onActivityRecencyChange={(event) =>
          audience.setActivityRecency(
            event.target.value as 'all' | 'active_7days' | 'inactive_7days',
          )
        }
        onUserTypeChange={(event) => {
          const nextUserType = event.target.value as
            | 'student'
            | 'teacher'
            | 'principal';
          audience.setUserType(nextUserType);
          if (nextUserType === 'student') {
            audience.setActivityRecency('all');
          }
        }}
      />
      <MessagesAudienceSummary
        programName={audience.selectedProgramName}
        blockCount={audience.summaryBlockCount}
        schoolCount={audience.summarySchoolCount}
        userType={
          audience.userType.charAt(0).toUpperCase() + audience.userType.slice(1)
        }
        activityRecency={audience.activityRecency}
        summary={audience.audienceSummary}
        recipientCount={audience.displayRecipientCount}
      />
      <MessagesSavedAudienceGroupFields
        form={{ groupName: audience.groupName }}
        selectedSavedGroupId={audience.selectedSavedGroupId}
        saveGroup={audience.saveGroup}
        savingGroup={audience.savingGroup}
        canSaveGroup={audience.canSaveGroup}
        groupNameError={audience.groupNameError}
        onSaveGroupChange={audience.setSaveGroup}
        onGroupNameChange={(event) => audience.setGroupName(event.target.value)}
        onSaveGroup={audience.handleSaveGroup}
        onCancelSaveGroup={audience.handleCancelSaveGroup}
      />
    </Box>
  );
};

export default MessagesTargetAudienceSection;
