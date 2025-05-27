import React from "react";
import Card from "@mui/material/Card";
import DetailItem, { DetailItemProps } from "./DetailItem";
import { Box, CardContent, Divider, Typography } from "@mui/material";
import "./InfoCard.css";

interface InfoCardProps {
  title: string;
  items?: DetailItemProps[];
  children?: React.ReactNode;
}

const InfoCard = ({ title, items,  children }: InfoCardProps) => (
  <Card variant="outlined" className="info-card">
    <CardContent className="info-card-content">
      <Typography
        variant="subtitle1"
        className="info-card-title"
        gutterBottom
        align="left"
      >
        {title}
      </Typography>
      <Divider className="info-card-divider" />

      {items && items.length > 0 ? (
        <Box className="info-card-items">
          {items.map((item, idx) => (
            <DetailItem key={idx} {...item} />
          ))}
        </Box>
      ) : <Box className= "info-card-children">{children}</Box>}
    </CardContent>
  </Card>
);

export default InfoCard;
