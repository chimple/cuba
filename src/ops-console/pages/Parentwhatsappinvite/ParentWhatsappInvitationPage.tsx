import {
  AssessmentOutlined,
  ForumOutlined,
} from '@mui/icons-material';
import { Typography } from '@mui/material';
import { t } from 'i18next';
import React from 'react';
import './ParentWhatsappInvitationPage.css';
import { useParentWhatsappInvitationPageLogic } from './ParentWhatsappInvitationPageLogic';
import ParentWhatsappAnalysisSection from './ParentWhatsappAnalysisSection';
import ParentWhatsappManualSection from './ParentWhatsappManualSection';
import ParentWhatsappReportSection from './ParentWhatsappReportSection';
import { InlineToggle } from './ParentWhatsappInvitationShared';

const ParentWhatsappInvitationPage: React.FC = () => {
  const logic = useParentWhatsappInvitationPageLogic();
  const {
    isWhatsappMode,
    setIsWhatsappMode,
    showMsg91Report,
    setShowMsg91Report,
  } = logic;

  return (
    <div id="parent-whatsapp-page" className="parent-whatsapp-page">
      <div
        id="parent-whatsapp-page-title-row"
        className="parent-whatsapp-page-title-row"
      >
        <Typography
          id="parent-whatsapp-page-title"
          className="parent-whatsapp-page-title"
        >
          {t('UDISE WhatsApp Invite Tool (1.0.1)')}
        </Typography>
      </div>

      <div
        id="parent-whatsapp-page-toggle-bar"
        className="parent-whatsapp-page-toggle-bar"
      >
        <InlineToggle
          checked={isWhatsappMode}
          onChange={setIsWhatsappMode}
          icon={
            <ForumOutlined
              id="parent-whatsapp-page-inline-icon"
              className="parent-whatsapp-page-inline-icon"
            />
          }
          label={t('WhatsApp')}
        />
        <InlineToggle
          checked={showMsg91Report}
          onChange={setShowMsg91Report}
          icon={
            <AssessmentOutlined
              id="parent-whatsapp-page-inline-icon"
              className="parent-whatsapp-page-inline-icon"
            />
          }
          label={t('View MSG91 Report')}
        />
      </div>

      {isWhatsappMode ? (
        <ParentWhatsappManualSection logic={logic} />
      ) : showMsg91Report ? (
        <ParentWhatsappReportSection logic={logic} />
      ) : (
        <ParentWhatsappAnalysisSection logic={logic} />
      )}
    </div>
  );
};

export default ParentWhatsappInvitationPage;
