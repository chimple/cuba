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
import { SupabaseApi } from "../../services/api/SupabaseApi";
import { TableTypes } from "../../common/constants";
import SchoolCheckInModal from "../components/SchoolDetailsComponents/SchoolCheckInModal";
import { Button } from "@mui/material";

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

export type SchoolStats = {
  active_student_percentage: number;
  active_teacher_percentage: number;
  avg_weekly_time_minutes: number;
};

export type ClassWithDetails = TableTypes<"class"> & {
  subjects?: TableTypes<"course">[];
  subjectsNames?: string;
  curriculumNames?: string;
  course_links?: TableTypes<"class_course">[];
  courses?: TableTypes<"course">[];
  curriculum?: TableTypes<"curriculum">[];
  studentCount?: number;
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
    classData?: ClassWithDetails[];
    totalClassCount?: number;
  }>({});
  const isMobile = useIsMobile();
  const [loading, setLoading] = useState(true);
  const history = useHistory();
  const [schoolStats, setSchoolStats] = useState<SchoolStats>({
    active_student_percentage: 0,
    active_teacher_percentage: 0,
    avg_weekly_time_minutes: 0,
  });

  // Calculate coordinates
  const [schoolLocation, setSchoolLocation] = useState<{ lat: number; lng: number } | undefined>(undefined);

  useEffect(() => {
    if (data.schoolData?.location_link) {
        // Try to parse basic lat,lng string
        // Example: "28.5244, 77.0855" or Google Maps URL
        // Simple regex for "lat, lng"
        const regex = /(-?\d+(\.\d+)?)\s*,\s*(-?\d+(\.\d+)?)/;
        const match = data.schoolData.location_link.match(regex);
        if (match) {
            setSchoolLocation({
                lat: parseFloat(match[1]),
                lng: parseFloat(match[3])
            });
        }
    }
  }, [data.schoolData]);

  // Check-In Logic
  const [checkInStatus, setCheckInStatus] = useState<'checked_in' | 'checked_out'>('checked_out');
  const [isCheckInModalOpen, setIsCheckInModalOpen] = useState(false);
  const [isFirstTimeCheckIn, setIsFirstTimeCheckIn] = useState(false);

  useEffect(() => {
    // Load persisted status
    const storedStatus = localStorage.getItem(`school_visit_status_${id}`);
    if (storedStatus) {
      setCheckInStatus(storedStatus as 'checked_in' | 'checked_out');
    }
  }, [id]);

  const handleOpenCheckInModal = () => {
    // Determine if it's first time (mock logic: if never checked in before for this school)
    // For simplicity in this dummy impl, let's say if localStorage is empty, it's first time
    const hasCheckedInBefore = localStorage.getItem(`has_checked_in_before_${id}`);
    setIsFirstTimeCheckIn(!hasCheckedInBefore);
    setIsCheckInModalOpen(true);
  };

  const handleConfirmCheckInAction = () => {
    if (checkInStatus === 'checked_out') {
      // Perform Check In
      setCheckInStatus('checked_in');
      localStorage.setItem(`school_visit_status_${id}`, 'checked_in');
      localStorage.setItem(`has_checked_in_before_${id}`, 'true');
    } else {
      // Perform Check Out
      setCheckInStatus('checked_out');
      localStorage.setItem(`school_visit_status_${id}`, 'checked_out');
    }
    setIsCheckInModalOpen(false);
  };

  useEffect(() => {
    fetchAll();
  }, [id]);
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
        classResponse,
      ] = await Promise.all([
        api.getSchoolById(id),
        api.getProgramForSchool(id),
        api.getProgramManagersForSchool(id),
        api.getPrincipalsForSchoolPaginated(id, 1, 20),
        api.getCoordinatorsForSchoolPaginated(id, 1, 20),
        api.getTeacherInfoBySchoolId(id, 1, 20),
        api.getStudentInfoBySchoolId(id, 1, 20),
        api.getClassesBySchoolId(id),
      ]);
      const res = await api.school_activity_stats(id);
      const result = Array.isArray(res) ? res[0] : res;
      const newSchoolStats = {
        active_student_percentage: result.active_student_percentage ?? 0,
        active_teacher_percentage: result.active_teacher_percentage ?? 0,
        avg_weekly_time_minutes: result.avg_weekly_time_minutes ?? 0,
      };
      // this must be called for all the class ids
      setSchoolStats(newSchoolStats);
      const studentsData = studentsResponse.data;
      const totalStudentCount = studentsResponse.total;
      const teachersData = teachersResponse.data;
      const totalTeacherCount = teachersResponse.total;
      const principalsData = principalsResponse.data;
      const totalPrincipalCount = principalsResponse.total;
      const coordinatorsData = coordinatorsResponse.data;
      const totalCoordinatorCount = coordinatorsResponse.total;

      const classData = classResponse;
      const totalClassCount = classData.length;
      const classDataWithDetails = await Promise.all(
        (classData as any[]).map(async (clasS: any) => {
          try {
            let classwiseTotal = 0;
            try {
              const raw = await api.getStudentsForClass(clasS.id);
              const n = Number(raw.length);
              classwiseTotal = Number.isFinite(n) ? n : 0;
            } catch {
              classwiseTotal = 0;
            }
            const links = (await api.getCoursesByClassId(clasS.id)) ?? [];
            const detailArrays = await Promise.all(
              links.map((ln: any) => api.getCourse(ln.course_id))
            );
            const courses = detailArrays
              .flatMap((arr: any) => (Array.isArray(arr) ? arr : [arr]))
              .filter(Boolean);
            const curIds = [
              ...new Set(
                courses
                  .map((cd: any) => cd?.curriculum_id)
                  .filter((id: any) => typeof id === "string" && id)
              ),
            ];
            let curriculum: any[] = [];
            if (curIds.length > 0) {
              const fetched = await api.getCurriculumsByIds(curIds);
              const seen = new Set<string>();
              for (const row of Array.isArray(fetched) ? fetched : []) {
                const id = row?.id;
                if (typeof id === "string" && !seen.has(id)) {
                  seen.add(id);
                  curriculum.push(row);
                }
              }
            }
            const subjects = courses;
            const subjectsNames = [
              ...new Set(
                courses
                  .map((cd: any) =>
                    typeof cd?.name === "string" ? cd.name.trim() : ""
                  )
                  .filter((s: string) => s.length > 0)
              ),
            ].join(", ");
            const curriculumNames = [
              ...new Set(
                curriculum
                  .map((x: any) =>
                    typeof x?.name === "string" ? x.name.trim() : ""
                  )
                  .filter((n: string) => n.length > 0)
              ),
            ].join(", ");
            return {
              ...clasS,
              subjects,
              subjectsNames,
              curriculumNames: curriculumNames,
              course_links: links,
              courses,
              curriculum,
              studentCount: classwiseTotal,
            };
          } catch {
            return { ...clasS };
          }
        })
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
        classData: classDataWithDetails,
        totalClassCount: totalClassCount,
      });
      setLoading(false);
    }

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
      <SchoolCheckInModal 
        open={isCheckInModalOpen}
        onClose={() => setIsCheckInModalOpen(false)}
        onConfirm={handleConfirmCheckInAction}
        status={checkInStatus === 'checked_in' ? 'check_out' : 'check_in'}
        schoolName={schoolName || "Unknown School"}
        isFirstTime={isFirstTimeCheckIn}
        schoolLocation={schoolLocation}
        schoolId={id}
        onLocationUpdated={fetchAll}
      />
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
            endActions={
               <div style={{ display: 'flex', gap: '10px' }}>
                    <Button 
                        variant="outlined" 
                        color="primary"
                        sx={{ textTransform: 'none', fontWeight: 600 }}
                    >
                        + Add Notes
                    </Button>
                    <Button 
                        variant="contained" 
                        onClick={handleOpenCheckInModal}
                        sx={{ 
                            textTransform: 'none', 
                            fontWeight: 600,
                            backgroundColor: checkInStatus === 'checked_in' ? '#d32f2f' : '#2e7d32', // Red for Check-Out, Green for Check-In
                            '&:hover': {
                                backgroundColor: checkInStatus === 'checked_in' ? '#b71c1c' : '#1b5e20',
                            }
                        }}
                    >
                        {checkInStatus === 'checked_in' ? "Check Out" : "Check In"}
                    </Button>
               </div>
            }
          />
        </div>
      )}
      <div className="school-detail-tertiary-gap" />
      <div className="school-detail-tertiary-header">
        <SchoolDetailsTabsComponent
          data={data}
          isMobile={isMobile}
          schoolId={id}
          refreshClasses= {fetchAll}
        />
      </div>
      <div className="school-detail-columns-gap" />
    </div>
  );
};

export default SchoolDetailsPage;
