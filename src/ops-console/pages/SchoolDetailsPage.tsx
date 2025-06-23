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
  total_students: number;
  active_students: number;
  total_teachers: number;
  active_teachers: number;
  avg_time_spent: number;
};

const SchoolDetailsPage: React.FC<SchoolDetailComponentProps> = ({ id }) => {
  const [data, setData] = useState<{
    schoolData?: any;
    programData?: any;
    programManagers?: any[];
    principals?: any[];
    coordinators?: any[];
    teachers?: any[];
    students?: any[];
    schoolStats?: SchoolStats;
  }>({});
  const isMobile = useIsMobile();
  const [loading, setLoading] = useState(true);
  const history = useHistory();
  const [schoolStats, setSchoolStats] = useState<SchoolStats>({
  total_students: 0,
  active_students: 0,
  total_teachers: 0,
  active_teachers: 0,
  avg_time_spent: 0,
});

  useEffect(() => {
    async function fetchAll() {
      setLoading(true);
      const api = ServiceConfig.getI().apiHandler;
      const [school, program, programManagers, principals, coordinators, teachers, students] =
        await Promise.all([
          api.getSchoolById(id),
          api.getProgramForSchool(id),
          api.getProgramManagersForSchool(id),
          api.getPrincipalsForSchool(id),
          api.getCoordinatorsForSchool(id),
          api.getTeacherInfoBySchoolId(id),
          api.getStudentInfoBySchoolId(id),

        ]);
        const res = await api.countUsersBySchool(id);
        const result = Array.isArray(res) ? res[0] : res;
        const newSchoolStats = {
          total_students: result.total_students ?? 0,
          active_students: result.active_students ?? 0,
          total_teachers: result.total_teachers ?? 0,
          active_teachers: result.active_teachers ?? 0,
          avg_time_spent: result.avg_time_spent ?? 0,
        };
        setSchoolStats(newSchoolStats);

        setData({
          schoolData: school,
          programData: program,
          programManagers: programManagers,
          principals: principals,
          coordinators: coordinators,
          teachers: teachers,
          students: students,
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
        <SchoolDetailsTabsComponent data={data} isMobile={isMobile} />
      </div>
      <div className="school-detail-columns-gap" />
    </div>
  );
};

export default SchoolDetailsPage;
