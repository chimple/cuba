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

const SchoolDetailsPage: React.FC<SchoolDetailComponentProps> = ({ id }) => {
  const [data, setData] = useState<{
    schoolData?: any;
    programData?: any;
    programManagers?: any[];
    principals?: any[];
    coordinators?: any[];
    teachers?: any[];
    students?: any[];
  }>({});
  const isMobile = useIsMobile();
  const [loading, setLoading] = useState(true);
  const history = useHistory();

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
      setData({
        schoolData: school,
        programData: program,
        programManagers: programManagers,
        principals: principals,
        coordinators: coordinators,
        teachers: teachers,
        students: students,
      });
      setLoading(false);
      console.log("checking data log",  students);
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
