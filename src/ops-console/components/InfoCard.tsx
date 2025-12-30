import React from "react";
import Card from "@mui/material/Card";
import DetailItem, { DetailItemProps } from "./DetailItem";
import { Box, CardContent, Divider, Typography } from "@mui/material";
import "./InfoCard.css";

interface InfoCardProps {
  title: string;
  items?: DetailItemProps[];
  children?: React.ReactNode;
  className?: string;
  showEditIcon?: boolean;
  onEditClick?: () => void;
  headerAction?: React.ReactNode;
  hideDivider?: boolean;
}

const InfoCard = ({
  title,
  items,
  children,
  className,
  showEditIcon,
  onEditClick,
  headerAction,
  hideDivider,
}: InfoCardProps) => (
  <Card
    variant="outlined"
    className={`info-card${className ? " " + className : ""}`}
  >
    <CardContent className="info-card-content">
      <Box display="flex" alignItems="center" justifyContent="space-between">
        <Typography
          variant="subtitle1"
          className="info-card-title"
          gutterBottom
          align="left"
          sx={{
            flex: 1,
            minWidth: 0,
            overflow: "hidden",
            textOverflow: "ellipsis",
            fontWeight: 600,
          }}
        >
          {title}
        </Typography>

        <Box className="info-card-header-action">
          {headerAction}
          {showEditIcon && (
            <img
              src="/assets/icons/EditIcon2.svg"
              className="info-card-edit-icon"
              alt="editIcon"
              onClick={onEditClick}
            />
          )}
        </Box>
      </Box>
      {!hideDivider && <Divider className="info-card-divider" />}

      {items && items.length > 0 ? (
        <Box className="info-card-items">
          {items.map((item, idx) => (
            <DetailItem key={idx} {...item} />
          ))}
        </Box>
      ) : (
        <Box className="info-card-children">{children}</Box>
      )}
    </CardContent>
  </Card>
);

export default InfoCard;
