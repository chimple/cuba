import React from "react";
import { Box, Typography } from "@mui/material";
import "./ContactCard.css"; 

interface Manager {
  name: string;
  role: string;
  phone: string;
}

const ContactCard = ({ name, role, phone }: Manager) => (
  <Box className="contact-card">
    <Box className="contact-card-inner">
      <Box className="contact-info">
        <Typography className="contact-name" variant="body1">
          {name}
        </Typography>
        <Typography className="contact-role" variant="body2" color="textSecondary">
          {role}
        </Typography>
      </Box>
      <Typography className="contact-phone" variant="body2">
        {phone}
      </Typography>
    </Box>
  </Box>
);

export default ContactCard;
