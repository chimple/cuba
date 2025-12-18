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
import { Button, Menu, MenuItem, Divider } from "@mui/material";
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';

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

  const [schoolLocation, setSchoolLocation] = useState<{ lat: number; lng: number } | undefined>(undefined);

  useEffect(() => {
    if (data.schoolData?.location_link) {
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
  
  // Dropdown state
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedVisitType, setSelectedVisitType] = useState<string>('Regular Visit');
  const openMenu = Boolean(anchorEl);

  useEffect(() => {
    const storedStatus = localStorage.getItem(`school_visit_status_${id}`);
    if (storedStatus) {
      setCheckInStatus(storedStatus as 'checked_in' | 'checked_out');
    }
  }, [id]);

  const handleOpenCheckInMenu = (event: React.MouseEvent<HTMLButtonElement>) => {
      setAnchorEl(event.currentTarget);
  };

  const handleCloseMenu = () => {
      setAnchorEl(null);
  };

  const handleSelectVisitType = (type: string) => {
      setSelectedVisitType(type);
      handleCloseMenu();
      handleOpenCheckInModal();
  };

  const handleOpenCheckInModal = () => {
    const hasCheckedInBefore = localStorage.getItem(`has_checked_in_before_${id}`);
    setIsFirstTimeCheckIn(!hasCheckedInBefore);
    setIsCheckInModalOpen(true);
  };

  const handleConfirmCheckInAction = async (lat?: number, lng?: number, distance?: number) => { 
    const api = ServiceConfig.getI().apiHandler;
    if (checkInStatus === 'checked_out') {
      // Perform Check In
      if (lat && lng) {
         try {
             await api.recordSchoolVisit(id, lat, lng, 'check_in', selectedVisitType, distance);
         } catch (e) {
             console.error("Failed to record check-in", e);
         }
      }
      setCheckInStatus('checked_in');
      localStorage.setItem(`school_visit_status_${id}`, 'checked_in');
      localStorage.setItem(`has_checked_in_before_${id}`, 'true');
    } else {
      // Perform Check Out
      if (lat && lng) {
          try {
             await api.recordSchoolVisit(id, lat, lng, 'check_out', undefined, distance);
          } catch (e) {
              console.error("Failed to record check-out", e);
          }
      }
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
        schoolAddress={data.schoolData?.address}
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
                     checkInStatus === 'checked_out' ? (
                        <>
                            <Button 
                                variant="contained" 
                                onClick={handleOpenCheckInMenu}
                                endIcon={<ArrowDropDownIcon />}
                                sx={{ 
                                    textTransform: 'none', 
                                    fontWeight: 600,
                                    backgroundColor: '#2e7d32', 
                                    '&:hover': { backgroundColor: '#1b5e20' }
                                }}
                            >
                                Check In
                            </Button>
                            <Menu
                                anchorEl={anchorEl}
                                open={openMenu}
                                onClose={handleCloseMenu}
                                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                                transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                                classes={{ paper: 'check-in-menu-paper' }}
                            >
                                <MenuItem onClick={() => handleSelectVisitType('Regular Visit')} className="check-in-menu-item">Regular Visit</MenuItem>
                                <Divider className="check-in-menu-divider" />
                                <MenuItem onClick={() => handleSelectVisitType('Parents Teacher Meeting')} className="check-in-menu-item">Parents Teacher Meeting</MenuItem>
                                <Divider className="check-in-menu-divider" />
                                <MenuItem onClick={() => handleSelectVisitType('Teacher Training Meeting')} className="check-in-menu-item">Teacher Training Meeting</MenuItem>
                            </Menu>
                        </>
                     ) : (
                        <Button 
                            variant="contained" 
                            onClick={handleOpenCheckInModal}
                            sx={{ 
                                textTransform: 'none', 
                                fontWeight: 600,
                                backgroundColor: '#d32f2f',
                                '&:hover': { backgroundColor: '#b71c1c' }
                            }}
                        >
                            Check Out
                        </Button>
                     )
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
