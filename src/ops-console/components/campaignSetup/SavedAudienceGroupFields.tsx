import React from 'react';
import {
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  TextField,
  Typography,
} from '@mui/material';
import {
  CampaignSetupFormState,
  CampaignSetupTextChangeHandler,
} from './types';

type SavedAudienceGroupFieldsProps = {
  form: CampaignSetupFormState;
  selectedSavedGroupId: string;
  saveGroup: boolean;
  savingGroup: boolean;
  groupNameError?: string;
  onSaveGroupChange: (saveGroup: boolean) => void;
  onGroupNameChange: CampaignSetupTextChangeHandler;
  onSaveGroup: () => void;
  onCancelSaveGroup: () => void;
};

export const SavedAudienceGroupFields: React.FC<
  SavedAudienceGroupFieldsProps
> = ({
  form,
  selectedSavedGroupId,
  saveGroup,
  savingGroup,
  groupNameError,
  onSaveGroupChange,
  onGroupNameChange,
  onSaveGroup,
  onCancelSaveGroup,
}) => (
  <Box className="target-audience-section-save-group">
    {!selectedSavedGroupId && (
      <FormControlLabel
        control={
          <Checkbox
            checked={saveGroup}
            onChange={(event) => onSaveGroupChange(event.target.checked)}
          />
        }
        label="Save this group for reuse"
      />
    )}
    {!selectedSavedGroupId && saveGroup && (
      <Box className="target-audience-section-save-group-fields">
        <Box className="campaign-setup-field">
          <Typography className="campaign-setup-label">Group Name</Typography>
          <TextField
            value={form.groupName}
            onChange={onGroupNameChange}
            error={!!groupNameError}
            helperText={groupNameError}
            placeholder="Enter group name"
            inputProps={{ 'aria-label': 'Group Name' }}
            size="small"
          />
        </Box>
        <Button
          type="button"
          className="target-audience-section-text-button target-audience-section-save-button"
          disabled={savingGroup}
          onClick={onSaveGroup}
        >
          Save
        </Button>
        <Button
          type="button"
          className="target-audience-section-text-button target-audience-section-cancel-button"
          onClick={onCancelSaveGroup}
        >
          Cancel
        </Button>
      </Box>
    )}
  </Box>
);
