import React, {useEffect, useState } from "react";
import Card from "@mui/material/Card";
import { Box, CardContent, Typography } from "@mui/material";
import "./WhatsAppInfoCard.css";
import { ServiceConfig } from "../../../services/ServiceConfig";
import { TableTypes } from "../../../common/constants";
import { t } from "i18next";

type WhatsAppInfoCardProps = {
  classData?: TableTypes<"class">;
  schoolData?: TableTypes<"school">;
};

const WhatsAppInfoCard: React.FC<WhatsAppInfoCardProps> = ({
  classData,
  schoolData,
}) => {
  const [groupName, setGroupName] = useState<string | null>(null);
  const [members, setMembers] = useState<number | null>(null);
  const [inviteLink, setInviteLink] = useState<any>(null);
  const api = ServiceConfig.getI().apiHandler;

  useEffect(() => {
    const groupId = classData?.group_id;
    const bot = schoolData?.whatsapp_bot_number;

    if (!groupId || !bot){
      console.error("Class not connected to WhatsApp group");
      return;
    };
      

    const getGroup = async () => {
      try {
        const group = await api.getWhatsappGroup(groupId, bot);
        setGroupName(group.name);
        setMembers(group.members.length);
        setInviteLink(group.inviteLink);
      } catch (error) {
        console.error("Failed to fetch WhatsApp group:", error);
      }
    };

    getGroup();
  }, [classData, schoolData]);

  return (
    <Card variant="outlined" className="wa-info-card">
      <CardContent className="wa-info-card-content">
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Typography
            variant="h6"
            className="wa-info-card-title"
            fontWeight={700}
            gutterBottom
            align="left"
          >
            {t("WhatsApp Information")}
          </Typography>
        </Box>

        <Box className="wa-status">
          <img
            src="/assets/icons/SignCircleIcon.svg"
            alt="Connected"
            className="wa-sign-icon"
          />
          <Typography variant="body2" className="wa-status-text">
            {t("WhatsApp Group Connected")}
          </Typography>
        </Box>

        <Box className="wa-section">
          <Typography
            variant="caption"
            color="text.secondary"
            className="wa-label"
          >
            {t("Group Name")}
          </Typography>

          <Box className="wa-input-row">
            <Box className="wa-input-wrapper">
              <input className="wa-input" value={groupName ?? ""} readOnly />
              <img
                src="/assets/icons/EditIcon2.svg"
                alt="Edit"
                className="wa-input-edit-icon"
              />
            </Box>

            <button className="wa-change-btn">{t("Change")}</button>
          </Box>
        </Box>

        <Box className="wa-section">
          <Typography
            variant="caption"
            color="text.secondary"
            className="wa-label"
          >
            {t("Members Count")}
          </Typography>

          <Typography variant="body1" className="wa-value" fontWeight={700}>
            {members ? members - 1 : 0} {t("Members")}
          </Typography>
        </Box>

        <a
          href={inviteLink}
          target="_blank"
          rel="noopener noreferrer"
          className="wa-open-btn"
        >
          {t("Open WhatsApp Group")}
          <img src="/assets/icons/SendIcon.svg" alt="Open" />
        </a>
      </CardContent>
    </Card>
  );
};

export default WhatsAppInfoCard;
