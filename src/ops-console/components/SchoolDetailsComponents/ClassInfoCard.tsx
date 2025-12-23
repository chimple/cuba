import React from "react";
import { Box, Card, CardContent, Typography, Tooltip } from "@mui/material";
import "./ClassInfoCard.css";
import { t } from "i18next";
import { TableTypes } from "../../../common/constants";
import { ClassRow } from "./SchoolClass";

type SubjectsProp = string | TableTypes<"subject">[];
type CurriculumProp = string | TableTypes<"curriculum"> | null;
type ClassProp = ClassRow | null;

type Props = {
  classRow: ClassProp;
  subjects: SubjectsProp;
  curriculum: CurriculumProp;
  totalStudents: string;
  activeStudents: string;
  classCode: string;
};

const Label = ({ children }: { children: React.ReactNode }) => (
  <Typography
    className="classinfocard-cic-label"
    variant="caption"
    color="text.secondary"
  >
    {children}
  </Typography>
);

const Value = ({ children }: { children: React.ReactNode }) => (
  <Typography className="classinfocard-cic-value" variant="body1">
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
  value: React.ReactNode;
  ellipsis?: boolean;
  tooltip?: string;
}) => {
  const content = (
    <Value>
      <span className={ellipsis ? "classinfocard-cic-ellipsis" : undefined}>
        {value}
      </span>
    </Value>
  );

  return (
    <Box className="classinfocard-cic-info">
      <Label>{label}</Label>
      {tooltip ? (
        <Tooltip title={tooltip} placement="top" arrow>
          <span className="classinfocard-cic-tooltip-anchor">{content}</span>
        </Tooltip>
      ) : (
        content
      )}
    </Box>
  );
};

const toSubjectDisplay = (subjects?: SubjectsProp): string => {
  if (!subjects) return "";
  if (typeof subjects === "string") return subjects || "";
  const list = subjects.map((s) => s?.name).filter(Boolean);
  return list.length ? list.join(", ") : "";
};

const toCurriculumDisplay = (curriculum?: CurriculumProp): string => {
  if (!curriculum) return "";
  if (typeof curriculum === "string") return curriculum || "";
  return curriculum?.name ?? "";
};

const ClassInfoCard: React.FC<Props> = ({
  classRow,
  subjects,
  curriculum,
  totalStudents,
  activeStudents,
  classCode,
}) => {
  const subjectList = toSubjectDisplay(subjects);
  const curriculumName = toCurriculumDisplay(curriculum);
  const classLabel = classRow?.name;

  return (
    <Card className="classinfocard-cic-card">
      <CardContent className="classinfocard-cic-card-content">
        <Typography
          className="classinfocard-cic-title"
          variant="h6"
          fontWeight={700}
        >
          {t("Class Information")}
        </Typography>

        <Box className="classinfocard-cic-grid">
          <Info label={t("Class")} value={classLabel} />
          <Info label="" value={""} />

          <Info
            label={t("Subjects")}
            value={subjectList}
            ellipsis
            tooltip={subjectList}
          />

          <Info
            label={t("Curriculum")}
            value={curriculumName}
            ellipsis
            tooltip={curriculumName}
          />
          <Info label={t("Total Students")} value={totalStudents} />
          <Info label={t("Active Students")} value={activeStudents} />

          <Box className="classinfocard-cic-full">
            <Label>{t("Class Code")}</Label>
            <Box className="classinfocard-cic-code">{classCode}</Box>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default ClassInfoCard;
