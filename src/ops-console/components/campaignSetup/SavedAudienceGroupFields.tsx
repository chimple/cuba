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
  saveGroup,
  savingGroup,
  groupNameError,
  onSaveGroupChange,
  onGroupNameChange,
  onSaveGroup,
  onCancelSaveGroup,
}) => (
  <Box className="campaign-setup-save-group">
    <FormControlLabel
      control={
        <Checkbox
          checked={saveGroup}
          onChange={(event) => onSaveGroupChange(event.target.checked)}
        />
      }
      label="Save this group for reuse"
    />
    {saveGroup && (
      <Box className="campaign-setup-save-group-fields">
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
          className="campaign-setup-text-button campaign-setup-save-button"
          disabled={savingGroup}
          onClick={onSaveGroup}
        >
          Save
        </Button>
        <Button
          type="button"
          className="campaign-setup-text-button campaign-setup-cancel-button"
          onClick={onCancelSaveGroup}
        >
          Cancel
        </Button>
      </Box>
    )}
  </Box>
);
