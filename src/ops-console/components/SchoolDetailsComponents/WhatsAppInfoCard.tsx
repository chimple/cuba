import React, { useEffect, useState } from "react";
import { Box, Card, CardContent, Typography, Modal } from "@mui/material";
import "./WhatsAppInfoCard.css";
import { ServiceConfig } from "../../../services/ServiceConfig";
import { TableTypes } from "../../../common/constants";
import { t } from "i18next";
import { ErrorOutlineOutlined } from "@mui/icons-material";

type WhatsAppInfoCardProps = {
  classData?: TableTypes<"class">;
  schoolData?: TableTypes<"school">;
};

const WhatsAppInfoCard: React.FC<WhatsAppInfoCardProps> = ({
  classData,
  schoolData,
}) => {
  const api = ServiceConfig.getI().apiHandler;
  const groupId = classData?.group_id;
  const bot = schoolData?.whatsapp_bot_number;
  const [groupName, setGroupName] = useState<string | null>(null);
  const [editedGroupName, setEditedGroupName] = useState("");
  const [members, setMembers] = useState<number | null>(null);
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [openChangePopup, setOpenChangePopup] = useState(false);
  const [step, setStep] = useState<"confirm" | "input">("confirm");
  const [inviteInput, setInviteInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [classDoc, setClassDoc] = useState<TableTypes<"class">>();
  const [isChangingGroup, setIsChangingGroup] = useState(false);

  useEffect(() => {
    if (!groupId || !bot) {
                    resetPopup();

      setIsChangingGroup(true)
    };
    const getGroup = async () => {
      try {
        const updatedClass = await api.getClassById(classData?.id!);
        if (updatedClass) setClassDoc(updatedClass);
        const group = await api.getWhatsappGroupDetails(
          updatedClass?.group_id!,
          bot!
        );
        setGroupName(group.name);
        setEditedGroupName(group.name);
        setMembers(group.members.length);
        setInviteLink(group.inviteLink);
      } catch (err) {
        console.error("Failed to fetch WhatsApp group:", err);
      }
    };

    getGroup();
  }, [groupId, bot, api]);

  const handleEdit = () => {
    setEditedGroupName(groupName ?? "");
    setIsEditing(true);
  };

  const handleCancel = () => {
    setEditedGroupName(groupName ?? "");
    setIsEditing(false);
  };

  const handleSave = async () => {
    if (!groupId || !bot) return;

    setIsSaving(true);

    const success = await api.updateWhatsAppGroupSettings(
      groupId,
      bot,
      editedGroupName
    );
    setIsSaving(false);

    if (success) {
      setGroupName(editedGroupName);
      setIsEditing(false);
    }
  };

  const normalizeInviteLink = (input: string): string | null => {
    const trimmed = input.trim();
    const regex =
      /^https:\/\/chat\.whatsapp\.com\/(invite\/)?([A-Za-z0-9]{10,})$/;

    const match = trimmed.match(regex);
    if (!match) return null;

    return `https://chat.whatsapp.com/invite/${match[2]}`;
  };

  const resetPopup = () => {
    console.log("llllllllllll",groupId);
    
    setOpenChangePopup(false);
    setStep("confirm");
    setInviteInput("");
    setError(null);
    setLoading(false);
  };

  const handleInviteSubmit = async () => {
    const normalized = normalizeInviteLink(inviteInput);
    if (!normalized) {
      setError(t("Please enter a valid WhatsApp invite link"));
      return;
    }
    if (!bot) return;
    setLoading(true);
    setError(null);

    try {
      const result = await api.getWhatsAppGroupByInviteLink(
        normalized,
        bot,
        classDoc?.id!
      );
      if (!result) {
        setError(t("No WhatsApp group found for this invite link"));
        return;
      }
      setGroupName(result.group_name);
      setMembers(result.members);
      setInviteLink(normalized);
      setIsChangingGroup(false);
    } catch (err) {
      console.error(err);
      setError(t("Something went wrong. Please try again."));
    } finally {
      setLoading(false);
    }
  };
  const openChangeGroupPopup = () => {
    setStep("confirm");
    setInviteInput("");
    setError(null);
    setOpenChangePopup(true);
  };

  return (
    <>
      <Card variant="outlined" className="wa-info-card">
        <CardContent className="wa-info-card-content">
          <Typography variant="h6" fontWeight={700} gutterBottom>
            {t("WhatsApp Information")}
          </Typography>

          <Box className="wa-status">
            {isChangingGroup ? (
              <div className="wa-info-not-connected">
                <ErrorOutlineOutlined></ErrorOutlineOutlined>
                <div>{t("WhatsApp Group Not Connected")}</div>
              </div>
            ) : (
              <>
                <img src="/assets/icons/SignCircleIcon.svg" alt="Connected" />
                <Typography variant="body2" color="green">
                  {t("WhatsApp Group Connected")}
                </Typography>
              </>
            )}
          </Box>
          <Box className="wa-section">
            <Typography variant="caption" color="text.secondary">
              {isChangingGroup ? t("Add an Invite Link") : t("Group Name")}
            </Typography>

            <Box className="wa-input-row">
              {isChangingGroup && (
                <div className="wa-info-invite-link-div">
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
                      className="wa-info-save-btn"
                      onClick={handleInviteSubmit}
                      disabled={loading || !inviteInput.trim()}
                    >
                      {loading ? t("Checking...") : t("Submit")}
                    </button>

                    <button
                      className="wa-info-cancel-btn"
                      onClick={() => {
                        setIsChangingGroup(false);
                        setInviteInput("");
                        setError(null);
                      }}
                      disabled={loading}
                    >
                      {t("Cancel")}
                    </button>
                  </Box>
                </div>
              )}

              {!isChangingGroup && isEditing && (
                <div className="wa-input-row-editing">
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
                      {isSaving ? t("Saving...") : t("Save")}
                    </button>

                    <button
                      className="wa-info-cancel-btn"
                      onClick={handleCancel}
                      disabled={isSaving}
                    >
                      {t("Cancel")}
                    </button>
                  </Box>
                </div>
              )}

              {!isChangingGroup && !isEditing && (
                <>
                  <Box className="wa-input-wrapper">
                    <input
                      className="wa-input"
                      value={groupName ?? ""}
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
                    {t("Change")}
                  </button>
                </>
              )}
            </Box>
          </Box>

          {!isChangingGroup && (
            <>
              <Box className="wa-section">
                <Typography variant="caption" color="text.secondary">
                  {t("Members Count")}
                </Typography>
                <Typography variant="body1" fontWeight={700}>
                  {members ? members - 1 : 0} {t("Members")}
                </Typography>
              </Box>

              {inviteLink && (
                <a
                  href={inviteLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="wa-open-btn"
                >
                  {t("Open WhatsApp Group")}
                  <img src="/assets/icons/SendIcon.svg" alt="Open" />
                </a>
              )}
            </>
          )}
        </CardContent>
      </Card>
      <Modal open={openChangePopup} onClose={resetPopup}>
        <Box className="wa-popup">
          {step === "confirm" ? (
            <>
              <Typography fontWeight={700}>
                {t("Do you want to change the WhatsApp group for this class?")}
              </Typography>

              <Box display="flex" gap={4} mt={3}>
                <button
                  className="wa-info-save-btn"
                  onClick={() => {
                    resetPopup();
                    setIsChangingGroup(true);
                  }}
                >
                  {t("Yes")}
                </button>

                <button className="wa-info-cancel-btn" onClick={resetPopup}>
                  {t("Cancel")}
                </button>
              </Box>
            </>
          ) : (
            <>
              <Typography variant="caption" color="text.secondary">
                {t("WhatsApp Invite Link")}
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
                  {loading ? t("Checking...") : t("Submit")}
                </button>
               {!groupId && <button
                  className="wa-info-cancel-btn"
                  onClick={resetPopup}
                  disabled={!groupId || loading}
                >
                  {t("Cancel")}
                </button>}
              </Box>
            </>
          )}
        </Box>
      </Modal>
    </>
  );
};

export default WhatsAppInfoCard;
