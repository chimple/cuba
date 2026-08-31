import React from 'react';
import { Box, Typography } from '@mui/material';
import { t } from 'i18next';
import './WhatsAppInviteLinkInput.css';

type Props = {
  inviteInput: string;
  setInviteInput: (v: string) => void;
  error: string | null;
  loading: boolean;
  groupId: string | null | undefined;
  onSubmit: () => void;
  onCancel: () => void;
};

const WhatsAppInviteLinkInput: React.FC<Props> = ({
  inviteInput,
  setInviteInput,
  error,
  loading,
  groupId,
  onSubmit,
  onCancel,
}) => {
  return (
    <div className="wa-info-invite-link-div" id="wa-info-invite-link-id">
      <input
        className="wa-input"
        autoFocus
        value={inviteInput}
        onChange={(e) => setInviteInput(e.target.value)}
        placeholder="https://chat.whatsapp.com/..."
      />

      {error && (
        <Typography color="error" variant="caption">
          {error}
        </Typography>
      )}

      <Box display="flex" gap={2} mt={1}>
        <button
          className="wa-info-invite-link-save-btn"
          onClick={onSubmit}
          disabled={loading || !inviteInput.trim()}
        >
          {loading ? t('Checking...') : t('Submit')}
        </button>

        {groupId && (
          <button
            className="wa-info-invite-link-cancel-btn"
            id="wa-info-invite-link-cancel-btn-id"
            onClick={onCancel}
            disabled={loading}
          >
            {t('Cancel')}
          </button>
        )}
      </Box>
    </div>
  );
};

export default WhatsAppInviteLinkInput;
