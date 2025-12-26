// SchoolDetailsPage.tsx
import React, { useEffect, useState } from "react";
import "./SchoolDetailsPage.css";
import { Toast } from '@capacitor/toast';
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
import { SchoolVisitAction, SchoolVisitStatus, SchoolVisitType, SchoolVisitTypeLabels } from "../../common/constants";
import { Button, Menu, MenuItem, Divider } from "@mui/material";
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import AddNoteModal from "../components/SchoolDetailsComponents/AddNoteModal";
import { SchoolTabs } from "../../interface/modelInterfaces";
import { NOTES_UPDATED_EVENT } from "../../common/constants";

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

export type FCSchoolStats = {
  visits: number;
  calls_made: number;
  tech_issues: number;
  parents_interacted: number;
  students_interacted: number;
  teachers_interacted: number;
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
    interactionStats?: FCSchoolStats;
  }>({});
  const isMobile = useIsMobile();
  const [loading, setLoading] = useState(true);
  const history = useHistory();
  const [schoolStats, setSchoolStats] = useState<SchoolStats>({
    active_student_percentage: 0,
    active_teacher_percentage: 0,
    avg_weekly_time_minutes: 0,
  });
  const [interactionStats, setInteractionStats] = useState<FCSchoolStats>({
    visits: 0,
    calls_made: 0,
    tech_issues: 0,
    parents_interacted: 0,
    students_interacted: 0,
    teachers_interacted: 0,
  });
  const [goToClassesTab, setGoToClassesTab] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [activeTab, setActiveTab] = useState<SchoolTabs>(SchoolTabs.Overview);

  // Handler moved INSIDE the component so it has access to id, setShowAddModal, setActiveTab
  const handleAddNoteHeader = async (payload: {
    text: string;
    mediaLinks?: string[] | null;
  }) => {
    try {
      const api = ServiceConfig.getI().apiHandler;
      // call the API you added; classId = null for school-level note
      const created = await api.createNoteForSchool({
        schoolId: id,
        classId: null,
        content: payload.text,
        mediaLinks: payload.mediaLinks ?? null,
      });

      // close modal
      setShowAddModal(false);

      // dispatch event so Notes tab component can update if it listens to this
      window.dispatchEvent(new CustomEvent(NOTES_UPDATED_EVENT, { detail: created }));

      // switch to Notes tab
      setActiveTab(SchoolTabs.Notes);
    } catch (err) {
      console.error("Failed to create note:", err);
      // optional: show UI error (not added to keep changes minimal)
    }
  };

  const [schoolLocation, setSchoolLocation] = useState<{ lat: number; lng: number } | undefined>(undefined);

  useEffect(() => {
    if (data.schoolData?.location_link) {
        const url = data.schoolData.location_link;
        let lat: number | null = null;
        let lng: number | null = null;

        // 1. Try "data=!3d...!4d..." format (Place specific coordinates)
        // Example: ...!3d12.8917379!4d77.5486649...
        const dataRegex = /!3d([+-]?\d+(\.\d+)?)!4d([+-]?\d+(\.\d+)?)/;
        const dataMatch = url.match(dataRegex);
        if (dataMatch) {
            lat = parseFloat(dataMatch[1]);
            lng = parseFloat(dataMatch[3]);
        }

        // 2. Try standard query params (q=lat,lng or ll=lat,lng)
        if (lat === null || lng === null) {
            const queryRegex = /(?:q|query|ll)=([+-]?\d+(\.\d+)?),([+-]?\d+(\.\d+)?)/;
            const queryMatch = url.match(queryRegex);
            if (queryMatch) {
                lat = parseFloat(queryMatch[1]);
                lng = parseFloat(queryMatch[3]);
            }
        }

        // 3. Try "@lat,lng" format (Viewport center - Fallback)
        // Example: .../@12.8917371,77.5311559...
        if (lat === null || lng === null) {
             const atRegex = /@([+-]?\d+(\.\d+)?),([+-]?\d+(\.\d+)?)/;
             const atMatch = url.match(atRegex);
             if (atMatch) {
                 lat = parseFloat(atMatch[1]);
                 lng = parseFloat(atMatch[3]);
             }
        }

        if (lat !== null && lng !== null && !isNaN(lat) && !isNaN(lng)) {
            setSchoolLocation({ lat, lng });
        }
    }
  }, [data.schoolData]);

  // Check-In Logic
  const [checkInStatus, setCheckInStatus] = useState<SchoolVisitStatus>(SchoolVisitStatus.CheckedOut);
  const [isCheckInModalOpen, setIsCheckInModalOpen] = useState(false);
  const [isFirstTimeCheckIn, setIsFirstTimeCheckIn] = useState(false);
  
  // Dropdown state
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedVisitType, setSelectedVisitType] = useState<SchoolVisitType>(SchoolVisitType.Regular);
  const openMenu = Boolean(anchorEl);

  useEffect(() => {
    const fetchVisitStatus = async () => {
      const api = ServiceConfig.getI().apiHandler;
      const lastVisit = await api.getLastSchoolVisit(id);
      if (lastVisit && !lastVisit.check_out_at) {
        setCheckInStatus(SchoolVisitStatus.CheckedIn);
      } else {
        setCheckInStatus(SchoolVisitStatus.CheckedOut);
      }
    };
    fetchVisitStatus();
  }, [id]);

  const handleOpenCheckInMenu = (event: React.MouseEvent<HTMLButtonElement>) => {
      setAnchorEl(event.currentTarget);
  };

  const handleCloseMenu = () => {
      setAnchorEl(null);
  };

  const handleSelectVisitType = (type: SchoolVisitType) => {
      setSelectedVisitType(type);
      handleCloseMenu();
      handleOpenCheckInModal();
  };

  const handleOpenCheckInModal = () => {
    const hasCheckedInBefore = localStorage.getItem(`has_checked_in_before_${id}`);
    setIsFirstTimeCheckIn(!hasCheckedInBefore);
    setIsCheckInModalOpen(true);
  };

  const handleConfirmCheckInAction = async (
    lat?: number,
    lng?: number,
    distance?: number
  ) => {
    setIsCheckInModalOpen(false);
    const api = ServiceConfig.getI().apiHandler;
    try {
      if (checkInStatus === SchoolVisitStatus.CheckedOut) {
        // Perform Check In
        if (lat && lng) {
          const res = await api.recordSchoolVisit(
            id,
            lat,
            lng,
            SchoolVisitAction.CheckIn,
            selectedVisitType,
            distance
          );
          if (res) {
            setCheckInStatus(SchoolVisitStatus.CheckedIn);
            await Toast.show({ text: t("Checked in successfully!") });
          }
        }
      } else {
        // Perform Check Out
        if (lat && lng) {
          const res = await api.recordSchoolVisit(
            id,
            lat,
            lng,
            SchoolVisitAction.CheckOut,
            undefined,
            distance
          );
          if (res) {
            setCheckInStatus(SchoolVisitStatus.CheckedOut);
            await Toast.show({ text: t("Checked out successfully!") });
          }
        }
      }
    } catch (e) {
      console.error("Failed to record visit", e);
      await Toast.show({
        text: t("Failed to record visit. Please try again."),
        duration: "long",
      });
    }
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
    const auth = ServiceConfig.getI().authHandler;
    const currentUser = await auth.getCurrentUser();
    const interactionStat = await api.getSchoolStatsForSchool(id);
    const stats = Array.isArray(interactionStat)
      ? interactionStat[0]
      : interactionStat;
    const interStats: FCSchoolStats = {
      visits: stats.visits ?? 0,
      calls_made: stats.calls_made ?? 0,
      tech_issues: stats.tech_issues ?? stats.tech_issues_reported ?? 0,
      parents_interacted: stats.parents_interacted ?? 0,
      students_interacted: stats.students_interacted ?? 0,
      teachers_interacted: stats.teachers_interacted ?? 0,
    };
    // this must be called for all the class ids
    setSchoolStats(newSchoolStats);
    setInteractionStats(interStats);
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
      interactionStats: interStats,
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
    <div className="schooldetailspage school-detail-container">
      {/* <div className="school-detail-gap" /> */}
      <div className="school-detail-header">
        {schoolName && <SchoolNameHeaderComponent schoolName={schoolName} />}
      </div>
      <SchoolCheckInModal 
        open={isCheckInModalOpen}
        onClose={() => setIsCheckInModalOpen(false)}
        onConfirm={handleConfirmCheckInAction}
        status={checkInStatus === SchoolVisitStatus.CheckedIn ? SchoolVisitAction.CheckOut : SchoolVisitAction.CheckIn}
        schoolName={schoolName || t("Unknown School")}
        isFirstTime={isFirstTimeCheckIn}
        schoolLocation={schoolLocation}
        schoolAddress={data.schoolData?.address}
        schoolId={id}
        onLocationUpdated={fetchAll}
      />
      {!isMobile && schoolName && (
        <div
          className="school-detail-secondary-header"
        >
          {/* Left Side: Breadcrumb */}
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
              <>
                {activeTab == SchoolTabs.Overview && (
                  <Button
                    variant="outlined"
                    onClick={() => setShowAddModal(true)}
                    className="btn-add-notes"
                  >
                    + {t("Add Notes")}
                  </Button>
                )}
                {checkInStatus === SchoolVisitStatus.CheckedOut ? (
                  <>
                    <Button
                      variant="contained"
                      onClick={handleOpenCheckInMenu}
                      endIcon={
                        <ArrowDropDownIcon
                          className={`check-in-icon ${openMenu ? "check-in-icon-rotated" : ""}`}
                        />
                      }
                      className="btn-check-in"
                    >
                      {t("Check In")}
                    </Button>
                    <Menu
                      anchorEl={anchorEl}
                      open={openMenu}
                      onClose={handleCloseMenu}
                      anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                      transformOrigin={{ vertical: "top", horizontal: "right" }}
                      classes={{ paper: "schooldetailspage check-in-menu-paper" }}
                    >
                      <MenuItem
                        onClick={() => handleSelectVisitType(SchoolVisitType.Regular)}
                        className="check-in-menu-item"
                      >
                        {t(SchoolVisitTypeLabels[SchoolVisitType.Regular])}
                      </MenuItem>
                      <Divider className="check-in-menu-divider" />
                      <MenuItem
                        onClick={() =>
                          handleSelectVisitType(SchoolVisitType.ParentsTeacherMeeting)
                        }
                        className="check-in-menu-item"
                      >
                         {t(SchoolVisitTypeLabels[SchoolVisitType.ParentsTeacherMeeting])}
                      </MenuItem>
                      <Divider className="check-in-menu-divider" />
                      <MenuItem
                        onClick={() =>
                          handleSelectVisitType(SchoolVisitType.TeacherTraining)
                        }
                        className="check-in-menu-item"
                      >
                         {t(SchoolVisitTypeLabels[SchoolVisitType.TeacherTraining])}
                      </MenuItem>
                    </Menu>
                  </>
                ) : (
                  <Button
                    variant="contained"
                    onClick={handleOpenCheckInModal}
                    className="btn-check-out"
                  >
                     {t("Check Out")}
                  </Button>
                )}
              </>
            }
          />

        </div>
      )}
      {/* Modal outside the header */}
      <AddNoteModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSave={handleAddNoteHeader}
        source="school"
        schoolId={id}
      />

      <div className="school-detail-tertiary-gap" />
      <div className="school-detail-tertiary-header">
        <SchoolDetailsTabsComponent
          data={data}
          isMobile={isMobile}
          schoolId={id}
          refreshClasses={() => {
            fetchAll();
            setGoToClassesTab(true);
          }}
          goToClassesTab={goToClassesTab}
          onTabChange={(tab) => setActiveTab(tab)} // new prop
        />
      </div>
      <div className="school-detail-columns-gap" />
    </div>
  );
};

export default SchoolDetailsPage;
