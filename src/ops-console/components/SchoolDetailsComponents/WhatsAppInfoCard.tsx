import React from 'react';
import { Box, Card, CardContent, Typography, Modal } from '@mui/material';
import './WhatsAppInfoCard.css';
import { TableTypes } from '../../../common/constants';
import { t } from 'i18next';
import { ErrorOutlineOutlined } from '@mui/icons-material';
import WhatsAppInviteLinkInput from './WhatsAppInviteLinkInput';
import { useWhatsAppInfoCard } from '../../hooks/useWhatsAppInfoCard';

type WhatsAppInfoCardProps = {
  classData?: TableTypes<'class'>;
  schoolData?: TableTypes<'school'>;
  onGroupLinked?: (classId: string, groupId: string) => void;
};

const WhatsAppInfoCard: React.FC<WhatsAppInfoCardProps> = ({
  classData,
  schoolData,
  onGroupLinked,
}) => {
  const card = useWhatsAppInfoCard({
    classData,
    schoolData,
    onGroupLinked,
  });
  const {
    cancelInviteEntry,
    classDoc,
    editedGroupName,
    error,
    groupId,
    groupName,
    handleCancel,
    handleEdit,
    handleInviteSubmit,
    handleSave,
    inviteInput,
    inviteLink,
    isChangingGroup,
    isDisconnectedGroup,
    isEditing,
    isExternalUser,
    isSaving,
    isStatusResolved,
    loading,
    members,
    openChangeGroupPopup,
    openChangePopup,
    resetPopup,
    setEditedGroupName,
    setInviteInput,
    setIsChangingGroup,
    step,
  } = card;

  return (
    <>
      <Card variant="outlined" className="wa-info-card">
        <CardContent className="wa-info-card-content">
          <Typography variant="h6" fontWeight={700} gutterBottom>
            {t('WhatsApp Information')}
          </Typography>

          <Box className="wa-status">
            {!isStatusResolved ? (
              <Typography variant="body2" color="text.secondary">
                {t('Checking WhatsApp status...')}
              </Typography>
            ) : isChangingGroup ? (
              <div
                className="wa-info-not-connected"
                id="wa-info-not-connected-id"
              >
                <ErrorOutlineOutlined></ErrorOutlineOutlined>
                <div id="wa-info-not-connected-text">
                  {isDisconnectedGroup
                    ? t('WhatsApp Group Disconnected')
                    : t('WhatsApp Group Not Connected')}
                </div>
              </div>
            ) : (
              <>
                <img src="/assets/icons/SignCircleIcon.svg" alt="Connected" />
                <Typography variant="body2" color="green">
                  {t('WhatsApp Group Connected')}
                </Typography>
              </>
            )}
          </Box>
          {isStatusResolved && isChangingGroup && isDisconnectedGroup && (
            <Box className="wa-disconnect-alert" role="alert">
              <ErrorOutlineOutlined className="wa-disconnect-alert-icon" />
              <Typography className="wa-disconnect-alert-text" variant="body2">
                {t(
                  "Oops! Looks like our bot isn't in that WhatsApp group or doesn't have admin rights. Please add it as an admin and try again.",
                )}
              </Typography>
            </Box>
          )}
          {isStatusResolved &&
            !(isChangingGroup && isDisconnectedGroup) &&
            !isExternalUser && (
              <Box className="wa-section">
                <Typography variant="caption" color="text.secondary">
                  {isChangingGroup ? t('Add an Invite Link') : t('Group Name')}
                </Typography>

                <Box className="wa-input-row">
                  {isChangingGroup && (
                    <WhatsAppInviteLinkInput
                      inviteInput={inviteInput}
                      setInviteInput={setInviteInput}
                      error={error}
                      loading={loading}
                      groupId={groupId || classDoc?.group_id}
                      onSubmit={handleInviteSubmit}
                      onCancel={cancelInviteEntry}
                    />
                  )}

                  {!isChangingGroup && isEditing && !isExternalUser && (
                    <>
                      <div
                        className="wa-input-row-editing"
                        id="wa-input-row-editing-id"
                      >
                        <Box className="wa-input-wrapper">
                          <input
                            className="wa-input"
                            value={editedGroupName}
                            autoFocus
                            onChange={(e) => setEditedGroupName(e.target.value)}
                          />
                        </Box>

                        <Box display="flex" gap={2}>
                          <button
                            className="wa-info-save-btn"
                            onClick={handleSave}
                            disabled={isSaving || !editedGroupName.trim()}
                          >
                            {isSaving ? t('Saving...') : t('Save')}
                          </button>

                          <button
                            className="wa-info-cancel-btn"
                            onClick={handleCancel}
                            disabled={isSaving}
                          >
                            {t('Cancel')}
                          </button>
                        </Box>
                      </div>

                      {error && (
                        <Typography color="error" variant="caption">
                          {error}
                        </Typography>
                      )}
                    </>
                  )}

                  {!isChangingGroup && !isEditing && !isExternalUser && (
                    <>
                      <Box className="wa-input-wrapper">
                        <input
                          className="wa-input"
                          value={groupName ?? ''}
                          disabled
                        />

                        <img
                          src="/assets/icons/EditIcon2.svg"
                          alt="Edit"
                          className="wa-input-edit-icon"
                          onClick={handleEdit}
                        />
                      </Box>

                      <button
                        className="wa-change-btn"
                        onClick={openChangeGroupPopup}
                      >
                        {t('Change')}
                      </button>
                    </>
                  )}
                </Box>
              </Box>
            )}

          {isStatusResolved && !isChangingGroup && (
            <>
              <Box className="wa-section">
                <Typography variant="caption" color="text.secondary">
                  {t('Members Count')}
                </Typography>
                <Typography
                  variant="body1"
                  className="wa-value"
                  fontWeight={700}
                >
                  {members ?? 0} {t('Members')}
                </Typography>
              </Box>

              {inviteLink && (
                <a
                  href={inviteLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="wa-open-btn"
                >
                  {t('Open WhatsApp Group')}
                  <img src="/assets/icons/SendIcon.svg" alt="Open" />
                </a>
              )}
            </>
          )}
        </CardContent>
      </Card>
      <Modal open={openChangePopup} onClose={resetPopup}>
        <Box className="wa-popup">
          {step === 'confirm' ? (
            <>
              <Typography fontWeight={700}>
                {t('Do you want to change the WhatsApp group for this class?')}
              </Typography>

              <Box display="flex" gap={4} mt={3}>
                <button
                  className="wa-info-save-btn"
                  onClick={() => {
                    resetPopup();
                    setIsChangingGroup(true);
                  }}
                >
                  {t('Yes')}
                </button>

                <button className="wa-info-cancel-btn" onClick={resetPopup}>
                  {t('Cancel')}
                </button>
              </Box>
            </>
          ) : (
            <>
              <Typography variant="caption" color="text.secondary">
                {t('WhatsApp Invite Link')}
              </Typography>

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

              <Box display="flex" gap={1} mt={2}>
                <button
                  className="wa-info-save-btn"
                  onClick={handleInviteSubmit}
                  disabled={loading || !inviteInput.trim()}
                >
                  {loading ? t('Checking...') : t('Submit')}
                </button>
                {!groupId && (
                  <button
                    className="wa-info-cancel-btn"
                    onClick={resetPopup}
                    disabled={!groupId || loading}
                  >
                    {t('Cancel')}
                  </button>
                )}
              </Box>
            </>
          )}
        </Box>
      </Modal>
    </>
  );
};

export default WhatsAppInfoCard;
