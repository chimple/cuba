import React, { useEffect, useState } from "react";
import "./SchoolDetailsPage.css";
import { Box } from "@mui/material";
import { t } from "i18next";
import { CircularProgress } from "@mui/material";
import { useHistory } from "react-router";
import { ServiceConfig } from "../../services/ServiceConfig";
import SchoolNameHeaderComponent from "../components/SchoolDetailsComponents/SchoolNameHeaderComponent";
import Breadcrumb from "../components/Breadcrumb";
import SchoolDetailsTabsComponent from "../components/SchoolDetailsComponents/SchoolDetailsTabsComponent";

interface SchoolDetailComponentProps {
  id: string;
}

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 600);
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= 600);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  return isMobile;
}

type SchoolStats = {
  active_student_percentage: number;
  active_teacher_percentage: number;
  avg_weekly_time_minutes: number;
};

const SchoolDetailsPage: React.FC<SchoolDetailComponentProps> = ({ id }) => {
  const [data, setData] = useState<{
    schoolData?: any;
    programData?: any;
    programManagers?: any[];
    principals?: any[];
    totalPrincipalCount?: number;
    coordinators?: any[];
    totalCoordinatorCount?: number;
    teachers?: any[];
    students?: any[];
    totalTeacherCount?: number;
    totalStudentCount?: number;
    schoolStats?: SchoolStats;
  }>({});
  const isMobile = useIsMobile();
  const [loading, setLoading] = useState(true);
  const history = useHistory();
  const [schoolStats, setSchoolStats] = useState<SchoolStats>({
    active_student_percentage: 0,
    active_teacher_percentage: 0,
    avg_weekly_time_minutes: 0,
  });

  useEffect(() => {
    async function fetchAll() {
      setLoading(true);
      const api = ServiceConfig.getI().apiHandler;
      const [
        school,
        program,
        programManagers,
        principalsResponse,
        coordinatorsResponse,
        teachersResponse,
        studentsResponse,
      ] = await Promise.all([
        api.getSchoolById(id),
        api.getProgramForSchool(id),
        api.getProgramManagersForSchool(id),
        api.getPrincipalsForSchoolPaginated(id, 1, 20),
        api.getCoordinatorsForSchoolPaginated(id, 1, 20),
        api.getTeacherInfoBySchoolId(id, 1, 20),
        api.getStudentInfoBySchoolId(id, 1, 20),
      ]);
      const res = await api.school_activity_stats(id);
      const result = Array.isArray(res) ? res[0] : res;
      const newSchoolStats = {
        active_student_percentage: result.active_student_percentage ?? 0,
        active_teacher_percentage: result.active_teacher_percentage ?? 0,
        avg_weekly_time_minutes: result.avg_weekly_time_minutes ?? 0,
      };
      setSchoolStats(newSchoolStats);
      const studentsData = studentsResponse.data;
      const totalStudentCount = studentsResponse.total;
      const teachersData = teachersResponse.data;
      const totalTeacherCount = teachersResponse.total;
      const principalsData = principalsResponse.data;
      const totalPrincipalCount = principalsResponse.total;
      const coordinatorsData = coordinatorsResponse.data;
      const totalCoordinatorCount = coordinatorsResponse.total;

      console.log(
        "School Stats students:",
        teachersData,
        "Total:",
        totalTeacherCount
      );

      setData({
        schoolData: school,
        programData: program,
        programManagers: programManagers,
        principals: principalsData,
        totalPrincipalCount: totalPrincipalCount,
        coordinators: coordinatorsData,
        totalCoordinatorCount: totalCoordinatorCount,
        teachers: teachersData,
        totalTeacherCount: totalTeacherCount,
        students: studentsData,
        totalStudentCount: totalStudentCount,
        schoolStats: newSchoolStats,
      });
      setLoading(false);
    }
    fetchAll();
  }, [id]);

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        height="100vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  const schoolName = data.schoolData?.name;

  return (
    <div className="school-detail-container">
      {/* <div className="school-detail-gap" /> */}
      <div className="school-detail-header">
        {schoolName && <SchoolNameHeaderComponent schoolName={schoolName} />}
      </div>
      {!isMobile && schoolName && (
        <div className="school-detail-secondary-header">
          <Breadcrumb
            crumbs={[
              {
                label: t("Schools"),
                onClick: () => history.goBack(),
              },
              {
                label: schoolName ?? "",
              },
            ]}
          />
        </div>
      )}
      <div className="school-detail-tertiary-gap" />
      <div className="school-detail-tertiary-header">
        <SchoolDetailsTabsComponent
          data={data}
          isMobile={isMobile}
          schoolId={id}
        />
      </div>
      <div className="school-detail-columns-gap" />
    </div>
  );
};

export default SchoolDetailsPage;
