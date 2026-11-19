import React from 'react';
import { ArrowBack } from '@mui/icons-material';
import { Box, Button, Typography } from '@mui/material';
import type { CampaignNotificationListItem } from '../../../services/api/ServiceApi';
import {
  formattedDate,
  isScheduled,
  schoolModelLabel,
} from './MessagesListing';

export const MessageOverview: React.FC<{
  message: CampaignNotificationListItem;
  onBack: () => void;
}> = ({ message, onBack }) => (
  <main
    className="messages-listing messages-overview"
    aria-labelledby="message-overview-title"
  >
    <Button
      id="messages-overview__back"
      className="messages-overview__back"
      startIcon={<ArrowBack />}
      onClick={onBack}
    >
      Back to messages
    </Button>
    <Typography id="message-overview-title" component="h1">
      {message.title || message.label || 'Notification'}
    </Typography>
    <Box className="messages-overview__tab">Overview</Box>
    <Box className="messages-overview__card">
      <dl>
        <div>
          <dt>Message type</dt>
          <dd>Notification</dd>
        </div>
        <div>
          <dt>Status</dt>
          <dd>
            {isScheduled(message) ? 'Scheduled' : message.status || 'Sent'}
          </dd>
        </div>
        <div>
          <dt>School model</dt>
          <dd>{schoolModelLabel(message.schoolModel)}</dd>
        </div>
        <div>
          <dt>Program</dt>
          <dd>{message.programName || '—'}</dd>
        </div>
        <div>
          <dt>Delivery date</dt>
          <dd>
            {formattedDate(message.sendDate)} {message.sendTime || ''}
          </dd>
        </div>
        <div>
          <dt>Audience</dt>
          <dd>{message.userType || '—'}</dd>
        </div>
      </dl>
      <Box className="messages-overview__content">
        <Typography variant="overline">Message</Typography>
        <Typography>{message.message || '—'}</Typography>
      </Box>
      {message.imageUrl ? (
        <img
          className="messages-overview__image"
          src={message.imageUrl}
          alt="Notification attachment"
        />
      ) : null}
    </Box>
  </main>
);
