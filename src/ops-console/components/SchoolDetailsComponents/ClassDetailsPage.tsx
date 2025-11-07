import React, { useEffect, useState } from "react";
import { Box, Button, useMediaQuery } from "@mui/material";
import { ArrowBack } from "@mui/icons-material";
import ClassInfoCard from "./ClassInfoCard";
import SchoolStudents from "./SchoolStudents";
import { ServiceConfig } from "../../../services/ServiceConfig";
import "./ClassDetailsPage.css";
import { useHistory } from "react-router-dom";
import { t } from "i18next";
import { TableTypes } from "../../../common/constants";

type ApiStudent = any;
const ROWS_PER_PAGE = 20;

const ClassDetailsPage: React.FC = () => {
  const isMobile = useMediaQuery("(max-width: 768px)");
  const history = useHistory();
  const handleBack = () => {
    history.goBack();
  };
  const schoolId =
    "" as TableTypes<"school">["id"];
  const classId =
    "" as TableTypes<"class">["id"];
  const [initialStudents, setInitialStudents] = useState<ApiStudent[]>([]);
  const [initialTotal, setInitialTotal] = useState<number>(0);
  const [activeStudentCount, setActiveStudentCount] = useState<string | null>(
    null
  );
  const [classRow, setClassRow] = useState<TableTypes<"class"> | null>(null);
  const subjectsStr =
    "Mathematics, English, Hindi, Digital Skills, Kannada, Uttar Pradesh, Harayana";
  const curriculumStr = "Chimple";

  useEffect(() => {
    (async () => {
      try {
        const api = ServiceConfig.getI().apiHandler;
        const res = await api.getStudentInfoBySchoolId(
          schoolId,
          1,
          ROWS_PER_PAGE
        );
        setInitialStudents(res.data || []);
        setInitialTotal(res.total || 0);
        const count = await api.getActiveStudentsCountByClass(classId);
        const cls: TableTypes<"class"> | null =
          (await api.getClassById(classId)) ?? null;
        setClassRow(cls);
        setActiveStudentCount(count);
      } catch (e) {
        console.error("Failed to load initial students:", e);
      }
    })();
  }, [schoolId]);

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, bgcolor: "grey.50", minHeight: "100vh" }}>
      <Button
        variant="text"
        startIcon={<ArrowBack />}
        onClick={handleBack}
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
          classRow={classRow}
          subjects={subjectsStr}
          curriculum={curriculumStr}
          totalStudents="25"
          activeStudents={activeStudentCount ?? ""}
          classCode="MATH1A2024"
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
          optionalGrade={2}
          optionalSection="B"
        />
      </Box>
    </Box>
  );
};

export default ClassDetailsPage;
