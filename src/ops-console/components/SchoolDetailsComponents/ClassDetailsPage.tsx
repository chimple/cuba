import React, { useEffect, useMemo, useState } from "react";
import { Box, Button, useMediaQuery } from "@mui/material";
import { ArrowBack } from "@mui/icons-material";
import ClassInfoCard from "./ClassInfoCard";
import SchoolStudents from "./SchoolStudents";
import { ServiceConfig } from "../../../services/ServiceConfig";
import "./ClassDetailsPage.css";
import { t } from "i18next";
import { StudentInfo, TableTypes } from "../../../common/constants";
import { ClassRow, SchoolDetailsData } from "./SchoolClass";

type ApiStudent = StudentInfo;
const ROWS_PER_PAGE = 20;

type Props = {
  data?: SchoolDetailsData;
  schoolId: TableTypes<"school">["id"];
  classId: TableTypes<"class">["id"];
  classRow: ClassRow | null;
  classCodeOverride?: string;
  totalStudentsOverride?: number;
  onBack?: () => void;
};

function toCommaString(x: unknown): string {
  if (!x) return "";
  if (Array.isArray(x)) return x.filter(Boolean).join(", ") || "";
  if (typeof x === "string") return x.trim() || "";
  return String(x);
}

function parseGradeSection(
  name?: string,
  fallbackGrade?: number | string,
  fallbackSection?: string
): { grade?: number | string; section?: string } {
  if (!name) return { grade: fallbackGrade, section: fallbackSection };
  const s = name.trim();
  const patterns = [
    /^(\d+)\s*[- ]?\s*([A-Za-z])?$/, // "1" or "1 A"
    /^(\d+)([A-Za-z])$/, // "1A"
  ];
  for (const re of patterns) {
    const m = s.match(re);
    if (m) {
      const g = m[1];
      const sec = (m[2] || "").toUpperCase();
      return {
        grade: g ? Number(g) || g : fallbackGrade,
        section: sec || fallbackSection,
      };
    }
  }
  return { grade: fallbackGrade, section: fallbackSection };
}

const ClassDetailsPage: React.FC<Props> = ({
  data,
  schoolId,
  classId,
  classRow,
  classCodeOverride,
  totalStudentsOverride,
  onBack,
}) => {
  const isMobile = useMediaQuery("(max-width: 768px)");
  const classDataArray = (data?.classData ?? []) as ClassRow[];
  const onlyClassRow =
    classDataArray.find((r) => r?.id === classId) ?? classRow ?? null;

  const [initialStudents, setInitialStudents] = useState<ApiStudent[]>([]);
  const [initialTotal, setInitialTotal] = useState<number>(0);
  const [activeStudentCount, setActiveStudentCount] = useState<number>(0);

  const classNameSt = (classRow?.name ?? "").toString().trim() || "";
  const subjectsSt = useMemo(
    () => toCommaString(classRow?.subjectsNames),
    [classRow]
  );
  const curriculumSt = useMemo(
    () => toCommaString(classRow?.curriculumNames),
    [classRow]
  );

  const { grade: parsedGrade, section: parsedSection } = useMemo(
    () =>
      parseGradeSection(
        classRow?.name,
        classRow?.grade,
        classRow?.section ?? ""
      ),
    [classRow]
  );

  useEffect(() => {
    (async () => {
      try {
        const api = ServiceConfig.getI().apiHandler;
        const res = await api.getStudentInfoBySchoolId(
          schoolId,
          1,
          ROWS_PER_PAGE
        );
        setInitialStudents(res?.data || []);
        setInitialTotal(res?.total || 0);
        const active = await api.getActiveStudentsCountByClass(classId);
        setActiveStudentCount(Number(active) || 0);
      } catch (e) {
        console.error("Failed to load class details:", e);
        setActiveStudentCount(0);
      }
    })();
  }, [schoolId, classId]);

  const finalClassCode =
    (classCodeOverride ?? "").toString().trim() || t("Not Generated");
  const finalTotalStudentsSt = String(totalStudentsOverride);
  const finalActiveStudentsSt = String(activeStudentCount);

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, bgcolor: "grey.50", minHeight: "100vh" }}>
      <Button
        variant="text"
        startIcon={<ArrowBack />}
        onClick={onBack}
        sx={{
          textTransform: "none",
          mb: 1,
          background: "#fff",
          color: "#111",
          border: "1px solid #e5e7eb",
          borderRadius: "5px",
          boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
          px: 1.5,
          py: 0.5,
          fontSize: "14px",
          fontWeight: 600,
        }}
      >
        {t("Back to Classes")}
      </Button>

      <Box
        sx={{
          display: "grid",
          gap: 3,
          gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
          alignItems: "start",
          mb: 3,
        }}
      >
        <ClassInfoCard
          classRow={onlyClassRow}
          subjects={subjectsSt}
          curriculum={curriculumSt}
          totalStudents={finalTotalStudentsSt}
          activeStudents={finalActiveStudentsSt}
          classCode={finalClassCode}
        />
      </Box>

      <Box
        className="classdetailspage-students-sticky"
        sx={{
          boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
          border: "1px solid #e5e7eb",
          borderRadius: "5px",
        }}
      >
        <SchoolStudents
          data={{ students: initialStudents, totalStudentCount: initialTotal }}
          schoolId={schoolId}
          isMobile={isMobile}
          isTotal={false}
          isFilter={false}
          customTitle="Students in Class"
          optionalGrade={parsedGrade}
          optionalSection={parsedSection}
        />
      </Box>
    </Box>
  );
};

export default ClassDetailsPage;
