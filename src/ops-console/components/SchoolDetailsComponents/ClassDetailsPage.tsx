// ClassDetailsPage.tsx
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
import AddNoteModal from "../SchoolDetailsComponents/AddNoteModal"; // <<-- imported
import { NOTES_UPDATED_EVENT } from "../../../common/constants";

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
  const match = s.match(/^(\d{1,2})(.*)$/);
  if (match) {
    const gradeNum = parseInt(match[1], 10);
    let sectionRaw = match[2];
    if (gradeNum >= 0 && gradeNum <= 10) {
      let sectionClean = sectionRaw.trim().replace(/^[-]\s*/, "");
      return {
        grade: gradeNum,
        section: sectionClean || fallbackSection,
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

  const [showAddModal, setShowAddModal] = useState(false); // <<-- modal state

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

  // UPDATED: call the API and dispatch NOTES_UPDATED_EVENT so SchoolNotes will update and open preview
  const handleAddNoteSave = async (payload: { text: string }) => {
    try {
      const api = ServiceConfig.getI().apiHandler;
      if (!api || !api.createNoteForSchool) {
        console.error("Notes API not available");
        setShowAddModal(false);
        return;
      }

      // call backend API (this will create fc_user_forms row and return normalized object)
      const created = await api.createNoteForSchool({
        schoolId,
        classId,
        content: payload.text,
      });

      // created should be the structured object returned by your supabase API
      // e.g. { id, visitId, schoolId, classId, className, content, createdAt, createdBy: { userId, name, role } }

      // Inform Notes tab (SchoolNotes listens to this)
      window.dispatchEvent(new CustomEvent(NOTES_UPDATED_EVENT, { detail: created }));

      // close modal
      setShowAddModal(false);

      // Optional: you can show a toast/notification here
      console.log("Note created:", created);
    } catch (err) {
      console.error("Failed to create class note:", err);
      // close modal anyway, or keep open if you want user to retry — here we close
      setShowAddModal(false);
    }
  };

  const handleAddNoteCancel = () => {
    setShowAddModal(false);
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, bgcolor: "grey.50", minHeight: "100vh" }}>
      {/* Header row: Back button (left) and Add Notes (right) */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          mb: 1,
        }}
      >
        <Button
          variant="text"
          startIcon={<ArrowBack />}
          onClick={onBack}
          sx={{
            textTransform: "none",
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

        {/* + Add Notes button on the right */}
        <Button
          variant="outlined"
          onClick={() => setShowAddModal(true)}
          sx={{
            textTransform: "none",
            borderRadius: "10px",
            border: "1.5px solid",
            borderColor: "#2563eb",
            color: "#2563eb",
            background: "#fff",
            fontWeight: 600,
            px: 2,
            py: 0.6,
            minWidth: 140,
            boxShadow: "none",
            "&:hover": {
              background: "rgba(79,70,229,0.06)",
              borderColor: "#2563eb",
              boxShadow: "none",
            },
            "&:focus": {
              outline: "2px solid rgba(79,70,229,0.14)",
              outlineOffset: "2px",
            },
          }}
          aria-label="+ Add Notes"
        >
          + {t("Add Notes")}
        </Button>
      </Box>

      {/* AddNoteModal */}
      <AddNoteModal
        isOpen={showAddModal}
        onClose={handleAddNoteCancel}
        onSave={handleAddNoteSave}
        source="class"
      />

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
          data={{
            schoolData: data?.schoolData,
            students: initialStudents,
            totalStudentCount: initialTotal,
            classData: classRow ? [classRow] : undefined,
          }}
          schoolId={schoolId}
          isMobile={isMobile}
          isTotal={false}
          isFilter={false}
          customTitle={
            classNameSt ? `Students in ${classNameSt}` : "Students in Class"
          }
          optionalGrade={parsedGrade}
          optionalSection={parsedSection}
        />
      </Box>
    </Box>
  );
};

export default ClassDetailsPage;
