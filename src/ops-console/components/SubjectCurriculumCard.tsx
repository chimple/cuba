import React, { useEffect, useState } from "react";
import { Box, Typography, CircularProgress, Divider } from "@mui/material";
import { t } from "i18next";
import { ServiceConfig } from "../../services/ServiceConfig";
import InfoCard from "./InfoCard";

interface SubjectCurriculumCardProps {
  schoolId: string;
}

interface Row {
  curriculumId: string;
  curriculumName: string;
  gradeId: string;
  gradeName: string;
  subjects: string[];
}

const SubjectCurriculumCard: React.FC<SubjectCurriculumCardProps> = ({
  schoolId,
}) => {
  const [loading, setLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<Row[]>([]);

  useEffect(() => {
    if (!schoolId) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        const api = ServiceConfig.getI().apiHandler;

        /*Fetch school → courses */
        const schoolCourses = (await api.getCoursesBySchoolId(schoolId)) ?? [];
        const courseArrays = await Promise.all(
          schoolCourses.map((ln) => api.getCourse(ln.course_id))
        );

        const courses = courseArrays
          .flatMap((c: any) => (Array.isArray(c) ? c : [c]))
          .filter(Boolean);

        /* Collect curriculumIds & gradeIds */
        const curriculumIds = new Set<string>();
        const gradeIds = new Set<string>();

        courses.forEach((c: any) => {
          if (c?.curriculum_id) curriculumIds.add(c.curriculum_id);
          if (c?.grade_id) gradeIds.add(c.grade_id);
        });

        /* Fetch curriculums & grades (bulk) */
        const [curriculums, grades] = await Promise.all([
          curriculumIds.size
            ? api.getCurriculumsByIds(Array.from(curriculumIds))
            : [],
          gradeIds.size ? api.getGradesByIds(Array.from(gradeIds)) : [],
        ]);

        const curriculumMap = new Map<string, string>();
        const gradeMap = new Map<string, string>();

        curriculums.forEach((c: any) => {
          if (c?.id) curriculumMap.set(c.id, c.name);
        });

        grades.forEach((g: any) => {
          if (g?.id) gradeMap.set(g.id, g.name);
        });

        const rowMap = new Map<string, Row>();

        for (const course of courses) {
          const curriculumId = course?.curriculum_id;
          const gradeId = course?.grade_id;
          const subjectName =
            typeof course?.name === "string" ? course.name.trim() : "";

          if (!curriculumId || !gradeId || !subjectName) continue;

          const key = `${curriculumId}_${gradeId}`;

          if (!rowMap.has(key)) {
            rowMap.set(key, {
              curriculumId,
              curriculumName: curriculumMap.get(curriculumId) ?? "-",
              gradeId,
              gradeName: gradeMap.get(gradeId) ?? "-",
              subjects: [],
            });
          }

          rowMap.get(key)!.subjects.push(subjectName);
        }
        /* Sort curriculum, grade, subjects */
        const finalRows = Array.from(rowMap.values())
          .map((r) => ({
            ...r,
            subjects: Array.from(new Set(r.subjects)).sort((a, b) =>
              a.localeCompare(b)
            ),
          }))
          .sort(
            (a, b) =>
              a.curriculumName.localeCompare(b.curriculumName) ||
              a.gradeName.localeCompare(b.gradeName)
          );

        setRows(finalRows);
      } catch (e) {
        console.error("Failed to fetch curriculum/grade/subjects", e);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [schoolId]);

  if (!schoolId || (!loading && rows.length === 0)) return null;

  return (
    <InfoCard
      title={t("Curriculum & Subjects")}
      className="school-detail-infocard school-card"
    >
      {loading ? (
        <Box display="flex" justifyContent="center" py={2}>
          <CircularProgress size={20} />
        </Box>
      ) : (
        <Box display="flex" flexDirection="column">
          {rows.map((row, idx) => (
            <React.Fragment key={`${row.curriculumId}-${row.gradeId}`}>
              <Box
                display="grid"
                gridTemplateColumns="50% 50%"
                gap={2}
                py={1.5}
              >
                <Typography variant="subtitle2" fontWeight={500}>
                  {row.curriculumName} {row.gradeName}
                </Typography>

                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{
                    lineHeight: 1.4,
                    textAlign: "left",
                    justifySelf: "start",
                    whiteSpace: "normal",
                  }}
                >
                  {row.subjects.join(", ")}
                </Typography>
              </Box>

              {idx < rows.length - 1 && (
                <Divider className="info-card-divider" />
              )}
            </React.Fragment>
          ))}
        </Box>
      )}
    </InfoCard>
  );
};

export default SubjectCurriculumCard;
