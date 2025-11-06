import React from "react";
import { Box, Card, CardContent, Typography, Tooltip } from "@mui/material";
import "./ClassInfoCard.css";
import { t } from "i18next";

type Props = {
  classname: string;
  subjects: string;
  curriculum: string;
  totalStudents: string;
  activeStudents: string;
  classCode: string;
};

const Label = ({ children }: { children: React.ReactNode }) => (
  <Typography className="cic-label" variant="caption" color="text.secondary">
    {children}
  </Typography>
);

const Value = ({ children }: { children: React.ReactNode }) => (
  <Typography className="cic-value" variant="body1">
    {children}
  </Typography>
);

const Info = ({
  label,
  value,
  ellipsis = false,
  tooltip = "",
}: {
  label: string;
  value: string;
  ellipsis?: boolean;
  tooltip?: string;
}) => {
  const content = (
    <Value>
      <span className={ellipsis ? "cic-ellipsis" : undefined}>{value}</span>
    </Value>
  );

  return (
    <Box className="cic-info">
      <Label>{label}</Label>
      {tooltip ? (
        <Tooltip title={tooltip} placement="top" arrow>
          <span className="cic-tooltip-anchor">{content}</span>
        </Tooltip>
      ) : (
        content
      )}
    </Box>
  );
};

const ClassInfoCard: React.FC<Props> = ({
  classname,
  subjects,
  curriculum,
  totalStudents,
  activeStudents,
  classCode,
}) => {
  return (
    <Card className="cic-card">
      <CardContent className="cic-card-content">
        <Typography className="cic-title" variant="h6" fontWeight={700}>
          {t("Class Information")}
        </Typography>

        <Box className="cic-grid">
          <Info label={t("Class")} value={classname} />
          <Info label="" value={""} />

          <Info label={t("Subjects")} value={subjects} ellipsis tooltip={subjects} />

          <Info label={t("Curriculum")} value={curriculum} />
          <Info label={t("Total Students")} value={totalStudents} />
          <Info label={t("Active Students")} value={activeStudents} />

          <Box className="cic-full">
            <Label>{t("Class Code")}</Label>
            <Box className="cic-code">{classCode}</Box>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default ClassInfoCard;
