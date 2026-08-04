import React from 'react';
import {
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  TextField,
  Typography,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import {
  CampaignSetupFormState,
  CampaignSetupTextChangeHandler,
} from './types';

type MessagesSavedAudienceGroupFieldsProps = {
  form: Pick<CampaignSetupFormState, 'groupName'>;
  selectedSavedGroupId: string;
  saveGroup: boolean;
  savingGroup: boolean;
  canSaveGroup: boolean;
  groupNameError?: string;
  onSaveGroupChange: (saveGroup: boolean) => void;
  onGroupNameChange: CampaignSetupTextChangeHandler;
  onSaveGroup: () => void;
  onCancelSaveGroup: () => void;
};

export const MessagesSavedAudienceGroupFields: React.FC<
  MessagesSavedAudienceGroupFieldsProps
> = ({
  form,
  selectedSavedGroupId,
  saveGroup,
  savingGroup,
  canSaveGroup,
  groupNameError,
  onSaveGroupChange,
  onGroupNameChange,
  onSaveGroup,
  onCancelSaveGroup,
}) => {
  const { t } = useTranslation();

  return (
    <Box className="messages-page__save-group">
      {!selectedSavedGroupId && (
        <FormControlLabel
          control={
            <Checkbox
              checked={saveGroup}
              onChange={(event) => onSaveGroupChange(event.target.checked)}
            />
          }
          label={t('Save this group for reuse')}
        />
      )}
      {!selectedSavedGroupId && saveGroup && (
        <Box className="messages-page__save-group-fields">
          <Box className="messages-page__save-group-main">
            <Typography className="messages-page__field-label">
              {t('Group Name')}
            </Typography>
            <TextField
              value={form.groupName}
              onChange={onGroupNameChange}
              error={!!groupNameError}
              placeholder={t('Enter group name')}
              inputProps={{ 'aria-label': t('Group Name') }}
              size="small"
            />
            {!!groupNameError && (
              <Typography
                className="messages-page__save-group-error"
                variant="caption"
                component="p"
              >
                {groupNameError}
              </Typography>
            )}
          </Box>
          <Box className="messages-page__save-group-actions">
            <Button
              type="button"
              className="messages-page__save-button messages-page__save-group-text-button"
              disabled={savingGroup}
              onClick={onSaveGroup}
            >
              {t('Save')}
            </Button>
            <Button
              type="button"
              className="messages-page__cancel-button"
              onClick={onCancelSaveGroup}
            >
              {t('Cancel')}
            </Button>
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default MessagesSavedAudienceGroupFields;
