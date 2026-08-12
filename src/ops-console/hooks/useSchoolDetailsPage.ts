import { Toast } from '@capacitor/toast';
import { t } from 'i18next';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useHistory } from 'react-router';
import {
  NOTES_UPDATED_EVENT,
  SchoolVisitAction,
  SchoolVisitStatus,
  SchoolVisitType,
  TableTypes,
} from '../../common/constants';
import { RoleType, SchoolTabs } from '../../interface/modelInterfaces';
import { AuthState } from '../../redux/slices/auth/authSlice';
import { useAppSelector } from '../../redux/hooks';
import { RootState } from '../../redux/store';
import { ServiceConfig } from '../../services/ServiceConfig';
import logger from '../../utility/logger';

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
  parents_reached: number;
  students_interacted: number;
  teachers_interacted: number;
};

export type ClassWithDetails = TableTypes<'class'> & {
  subjects?: TableTypes<'course'>[];
  subjectsNames?: string;
  curriculumNames?: string;
  course_links?: TableTypes<'class_course'>[];
  courses?: TableTypes<'course'>[];
  curriculum?: TableTypes<'curriculum'>[];
  studentCount?: number;
};

const mapSchoolVisitType = (
  visitType: TableTypes<'fc_school_visit'>['type'],
): SchoolVisitType | undefined => {
  switch (visitType) {
    case SchoolVisitType.Regular:
      return SchoolVisitType.Regular;
    case SchoolVisitType.ParentsTeacherMeeting:
      return SchoolVisitType.ParentsTeacherMeeting;
    case SchoolVisitType.TeacherTraining:
      return SchoolVisitType.TeacherTraining;
    case SchoolVisitType.Community:
      return SchoolVisitType.Community;
    case SchoolVisitType.WorkFromHome:
      return SchoolVisitType.WorkFromHome;
    default:
      return undefined;
  }
};

const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 600);
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= 600);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  return isMobile;
};

const resolveSettled = <T>(
  label: string,
  settled: PromiseSettledResult<T>,
  fallback: T,
): T => {
  if (settled.status === 'fulfilled') return settled.value;
  logger.error(`SchoolDetailsPage fetch failed: ${label}`, settled.reason);
  return fallback;
};

const emptyPaged = { data: [], total: 0 };

const emptySchoolActivityStats: SchoolStats = {
  active_student_percentage: 0,
  active_teacher_percentage: 0,
  avg_weekly_time_minutes: 0,
};

const emptyInteractionStats: FCSchoolStats = {
  visits: 0,
  calls_made: 0,
  tech_issues: 0,
  parents_interacted: 0,
  parents_reached: 0,
  students_interacted: 0,
  teachers_interacted: 0,
};

export const useSchoolDetailsPage = (id: string) => {
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
  const { roles } = useAppSelector(
    (state: RootState) => state.auth as AuthState,
  );
  const userRoles = roles || [];
  const isExternalUser = userRoles.includes(RoleType.EXTERNAL_USER);
  const [goToClassesTab, setGoToClassesTab] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [activeTab, setActiveTab] = useState<SchoolTabs>(SchoolTabs.Overview);
  const [schoolLocation, setSchoolLocation] = useState<
    { lat: number; lng: number } | undefined
  >(undefined);
  const [checkInStatus, setCheckInStatus] = useState<SchoolVisitStatus>(
    SchoolVisitStatus.CheckedOut,
  );
  const [isCheckInModalOpen, setIsCheckInModalOpen] = useState(false);
  const [isFirstTimeCheckIn, setIsFirstTimeCheckIn] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedVisitType, setSelectedVisitType] = useState<SchoolVisitType>(
    SchoolVisitType.Regular,
  );
  const [activeVisitType, setActiveVisitType] = useState<
    SchoolVisitType | undefined
  >(undefined);
  const loadedTabsRef = useRef<Set<SchoolTabs>>(new Set());
  const loadingTabsRef = useRef<Set<SchoolTabs>>(new Set());
  const openMenu = Boolean(anchorEl);

  const handleAddNoteHeader = async (payload: {
    text: string;
    mediaLinks?: string[] | null;
  }) => {
    if (isExternalUser) {
      setShowAddModal(false);
      return;
    }

    try {
      const api = ServiceConfig.getI().apiHandler;
      const created = await api.createNoteForSchool({
        schoolId: id,
        classId: null,
        content: payload.text,
        mediaLinks: payload.mediaLinks ?? null,
      });

      setShowAddModal(false);
      window.dispatchEvent(
        new CustomEvent(NOTES_UPDATED_EVENT, { detail: created }),
      );
      setActiveTab(SchoolTabs.Notes);
    } catch (err) {
      logger.error('Failed to create note:', err);
    }
  };

  useEffect(() => {
    if (data.schoolData?.location_link) {
      const url = data.schoolData.location_link;
      let lat: number | null = null;
      let lng: number | null = null;
      const dataMatch = url.match(/!3d([+-]?\d+(\.\d+)?)!4d([+-]?\d+(\.\d+)?)/);
      if (dataMatch) {
        lat = parseFloat(dataMatch[1]);
        lng = parseFloat(dataMatch[3]);
      }
      if (lat === null || lng === null) {
        const queryMatch = url.match(
          /(?:q|query|ll)=([+-]?\d+(\.\d+)?),([+-]?\d+(\.\d+)?)/,
        );
        if (queryMatch) {
          lat = parseFloat(queryMatch[1]);
          lng = parseFloat(queryMatch[3]);
        }
      }
      if (lat === null || lng === null) {
        const atMatch = url.match(/@([+-]?\d+(\.\d+)?),([+-]?\d+(\.\d+)?)/);
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

  useEffect(() => {
    if (isExternalUser) return;
    const fetchVisitStatus = async () => {
      const api = ServiceConfig.getI().apiHandler;
      const lastVisit = await api.getLastSchoolVisit(id);
      if (lastVisit && !lastVisit.check_out_at) {
        setCheckInStatus(SchoolVisitStatus.CheckedIn);
        setActiveVisitType(mapSchoolVisitType(lastVisit.type));
      } else {
        setCheckInStatus(SchoolVisitStatus.CheckedOut);
        setActiveVisitType(undefined);
      }
    };
    fetchVisitStatus();
  }, [id, isExternalUser]);

  const handleOpenCheckInMenu = (
    event: React.MouseEvent<HTMLButtonElement>,
  ) => {
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
    const hasCheckedInBefore = localStorage.getItem(
      `has_checked_in_before_${id}`,
    );
    setIsFirstTimeCheckIn(!hasCheckedInBefore);
    setIsCheckInModalOpen(true);
  };

  const handleConfirmCheckInAction = async (
    lat?: number,
    lng?: number,
    distance?: number,
    numberOfParents?: number,
  ) => {
    const api = ServiceConfig.getI().apiHandler;
    try {
      if (checkInStatus === SchoolVisitStatus.CheckedOut) {
        if (lat && lng) {
          const res = await api.recordSchoolVisit(
            id,
            lat,
            lng,
            SchoolVisitAction.CheckIn,
            selectedVisitType,
            distance,
          );
          if (res) {
            setCheckInStatus(SchoolVisitStatus.CheckedIn);
            setActiveVisitType(selectedVisitType);
            setIsCheckInModalOpen(false);
            await Toast.show({ text: t('Checked in successfully!') });
          }
        }
      } else if (lat && lng) {
        const res = await api.recordSchoolVisit(
          id,
          lat,
          lng,
          SchoolVisitAction.CheckOut,
          undefined,
          distance,
          numberOfParents,
        );
        if (res) {
          setCheckInStatus(SchoolVisitStatus.CheckedOut);
          setActiveVisitType(undefined);
          setIsCheckInModalOpen(false);
          await Toast.show({ text: t('Checked out successfully!') });
        }
      }
    } catch (e) {
      logger.error('Failed to record visit', e);
      await Toast.show({
        text: t('Failed to record visit. Please try again.'),
        duration: 'long',
      });
    }
  };

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const api = ServiceConfig.getI().apiHandler;

    try {
      const [
        schoolSettled,
        programSettled,
        programManagersSettled,
        principalsResponseSettled,
        coordinatorsResponseSettled,
      ] = await Promise.allSettled([
        api.getSchoolById(id),
        api.getProgramForSchool(id),
        api.getProgramManagersForSchool(id),
        isExternalUser
          ? Promise.resolve(emptyPaged)
          : api.getPrincipalsForSchoolPaginated(id, 1, 20),
        api.getCoordinatorsForSchoolPaginated(id, 1, 20),
      ]);

      const school = resolveSettled('getSchoolById', schoolSettled, undefined);
      const program = resolveSettled(
        'getProgramForSchool',
        programSettled,
        undefined,
      );
      const programManagers = resolveSettled(
        'getProgramManagersForSchool',
        programManagersSettled,
        [],
      );
      const principalsResponse = resolveSettled(
        'getPrincipalsForSchoolPaginated',
        principalsResponseSettled,
        emptyPaged,
      );
      const coordinatorsResponse = resolveSettled(
        'getCoordinatorsForSchoolPaginated',
        coordinatorsResponseSettled,
        emptyPaged,
      );
      const [schoolActivityStatsSettled, interactionStatsSettled] =
        await Promise.allSettled([
          api.school_activity_stats(id),
          api.getSchoolStatsForSchool(id),
        ]);

      const result = resolveSettled(
        'school_activity_stats',
        schoolActivityStatsSettled,
        emptySchoolActivityStats,
      );
      const schoolStatsResult = Array.isArray(result) ? result[0] : result;
      const interactionStat = resolveSettled(
        'getSchoolStatsForSchool',
        interactionStatsSettled,
        emptyInteractionStats,
      );
      const stats = Array.isArray(interactionStat)
        ? interactionStat[0]
        : interactionStat;

      setData((prev) => ({
        ...prev,
        schoolData: school,
        programData: program,
        programManagers,
        principals: principalsResponse?.data ?? [],
        totalPrincipalCount: principalsResponse?.total ?? 0,
        coordinators: coordinatorsResponse?.data ?? [],
        totalCoordinatorCount: coordinatorsResponse?.total ?? 0,
        schoolStats: {
          active_student_percentage:
            schoolStatsResult?.active_student_percentage ?? 0,
          active_teacher_percentage:
            schoolStatsResult?.active_teacher_percentage ?? 0,
          avg_weekly_time_minutes:
            schoolStatsResult?.avg_weekly_time_minutes ?? 0,
        },
        interactionStats: {
          visits: stats?.visits ?? 0,
          calls_made: stats?.calls_made ?? 0,
          tech_issues: stats?.tech_issues ?? stats?.tech_issues_reported ?? 0,
          parents_interacted: stats?.parents_interacted ?? 0,
          parents_reached: stats?.parents_reached ?? 0,
          students_interacted: stats?.students_interacted ?? 0,
          teachers_interacted: stats?.teachers_interacted ?? 0,
        },
      }));
    } finally {
      setLoading(false);
    }
  }, [id, isExternalUser]);

  const fetchClassesData = useCallback(
    async (force = false) => {
      if (!force && loadedTabsRef.current.has(SchoolTabs.Classes)) return;
      if (loadingTabsRef.current.has(SchoolTabs.Classes)) return;

      loadingTabsRef.current.add(SchoolTabs.Classes);
      const api = ServiceConfig.getI().apiHandler;

      try {
        const classResponse = await api.getClassesBySchoolId(id);
        const classData = Array.isArray(classResponse) ? classResponse : [];

        loadedTabsRef.current.add(SchoolTabs.Classes);
        setData((prev) => ({
          ...prev,
          classData,
          totalClassCount: classData.length,
        }));
      } catch (error) {
        logger.error(
          'SchoolDetailsPage fetch failed: getClassesBySchoolId',
          error,
        );
      } finally {
        loadingTabsRef.current.delete(SchoolTabs.Classes);
      }
    },
    [id],
  );

  const loadSchoolDetailsTabData = useCallback(
    async (tab: SchoolTabs, options?: { force?: boolean }) => {
      if (
        tab === SchoolTabs.Classes ||
        tab === SchoolTabs.Students ||
        tab === SchoolTabs.Teachers
      ) {
        await fetchClassesData(options?.force ?? false);
      }
    },
    [fetchClassesData],
  );

  useEffect(() => {
    loadedTabsRef.current.clear();
    loadingTabsRef.current.clear();
    setData({});
  }, [id]);

  useEffect(() => {
    void fetchAll();
  }, [fetchAll]);

  return {
    activeTab,
    activeVisitType,
    anchorEl,
    checkInStatus,
    data,
    fetchAll,
    goToClassesTab,
    handleAddNoteHeader,
    handleCloseMenu,
    handleConfirmCheckInAction,
    handleOpenCheckInMenu,
    handleOpenCheckInModal,
    handleSelectVisitType,
    history,
    isCheckInModalOpen,
    isExternalUser,
    isFirstTimeCheckIn,
    isMobile,
    loading,
    loadSchoolDetailsTabData,
    openMenu,
    schoolLocation,
    selectedVisitType,
    setActiveTab,
    setGoToClassesTab,
    setIsCheckInModalOpen,
    setShowAddModal,
    showAddModal,
  };
};
