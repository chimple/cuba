import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import DataTableBody, { Column } from '../DataTableBody';
import DataTablePagination from '../DataTablePagination';
import {
  Button as MuiButton,
  Typography,
  Box,
  useMediaQuery,
  CircularProgress,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
} from '@mui/material';
import { Add as AddIcon, MoreHoriz } from '@mui/icons-material';
import { t } from 'i18next';
import SearchAndFilter from '../SearchAndFilter';
import FilterSlider from '../FilterSlider';
import SelectedFilters from '../SelectedFilters';
import './SchoolStudents.css';
import { ServiceConfig } from '../../../services/ServiceConfig';
import {
  AGE_OPTIONS,
  GENDER,
  PerformanceLevel,
  StudentInfo,
  EnumType,
  OpsSupportLevelMap,
  OPS_PERFORMANCE_BANDS,
  STUDENT_PERFORMANCE_BAND_KEYS,
  ContactTarget,
  AVATARS,
  WHATSAPP_GROUP_STATUS_KEYS,
  WHATSAPP_GROUP_STATUS,
  WHATSAPP_GROUP_TICK_ICON,
} from '../../../common/constants';
import CloseIcon from '@mui/icons-material/Close';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import {
  getGradeOptions,
  filterBySearchAndFilters,
} from '../../OpsUtility/SearchFilterUtility';
import FormCard, { FieldConfig, MessageConfig } from './FormCard';
import { normalizePhone10 } from '../../pages/NewUserPageOps';
import { ClassRow, SchoolData } from './SchoolClass';
import ActionMenu from './ActionMenu';
import ChatBubbleOutlineOutlined from '@mui/icons-material/ChatBubbleOutlineOutlined';
import BorderColorIcon from '@mui/icons-material/BorderColor';
import FcInteractPopUp from '../fcInteractComponents/FcInteractPopUp';
import MergeOutlinedIcon from '@mui/icons-material/MergeOutlined';
import CardListModal from './CardListModal';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import OpsGenericPopup from '../../common/OpsGenericPopup';
import verifiedIcon from '../../assets/icons/verifiedicon.svg';
import ErrorIcon from '../../assets/icons/erroricon.svg';
import DeleteIcon from '../../assets/icons/deleteicon.svg';
import logger from '../../../utility/logger';
import {
  filterByProgramGrades,
  getClassDisplayLabel,
  getExactClassName,
  getProgramAllowedGrades,
  isProgramGradeAllowed,
  ProgramGradeScopeData,
} from './ClassDetailsPageUtils';
import { RoleType } from '../../../interface/modelInterfaces';
import { useAppSelector } from '../../../redux/hooks';
import { RootState } from '../../../redux/store';
import { AuthState } from '../../../redux/slices/auth/authSlice';

type ApiStudentData = StudentInfo;
type StudentPerformanceBand =
  (typeof STUDENT_PERFORMANCE_BAND_KEYS)[keyof typeof STUDENT_PERFORMANCE_BAND_KEYS];
type OpsPerformanceLabel =
  (typeof OPS_PERFORMANCE_BANDS)[keyof typeof OPS_PERFORMANCE_BANDS];

// Keys used to select the WhatsApp status label + chip styling.
type WhatsappGroupStatusKey = keyof typeof WHATSAPP_GROUP_STATUS;

interface DisplayStudent {
  id: string;
  original: StudentInfo;
  studentIdDisplay: string;
  name: string;
  schstudents_interact?: string;
  gender: string;
  grade: number;
  classSection: string;
  phoneNumber: string;
  class: string;
  schstudents_performance?: string;
  whatsappGroupStatus?: WhatsappGroupStatusKey;
  schstudents_actions?: string;
}

const getPerformanceChipClass = (schstudents_performance: string): string => {
  switch (schstudents_performance) {
    case OPS_PERFORMANCE_BANDS.HIGH:
      return 'performance-chip-doing-good';
    case OPS_PERFORMANCE_BANDS.NOT_ACTIVE:
      return 'performance-chip-need-help';
    case OPS_PERFORMANCE_BANDS.MEDIUM:
      return 'performance-chip-still-learning';
    case OPS_PERFORMANCE_BANDS.NOT_DOWNLOADED:
    default:
      return 'performance-chip-not-tracked';
  }
};

// Map logical WhatsApp statuses to CSS chip classes.
const getWhatsappChipClass = (status: WhatsappGroupStatusKey): string => {
  switch (status) {
    case WHATSAPP_GROUP_STATUS_KEYS.IN_GROUP:
      return 'schoolstudents-whatsapp-chip-in-group';
    case WHATSAPP_GROUP_STATUS_KEYS.ON_WHATSAPP:
      return 'schoolstudents-whatsapp-chip-in-group';
    case WHATSAPP_GROUP_STATUS_KEYS.NOT_IN_GROUP:
      return 'schoolstudents-whatsapp-chip-not-in-group';
    case WHATSAPP_GROUP_STATUS_KEYS.NOT_AVAILABLE:
      return 'schoolstudents-whatsapp-chip-not-on-whatsapp';
    case WHATSAPP_GROUP_STATUS_KEYS.NOT_ON_WHATSAPP:
      return 'schoolstudents-whatsapp-chip-not-on-whatsapp';
    case WHATSAPP_GROUP_STATUS_KEYS.NOT_CHECKED:
    default:
      return 'schoolstudents-whatsapp-chip-not-checked';
  }
};

// Shared renderer for WhatsApp group pills to keep UI consistent.
const renderWhatsappGroupChip = (statusKey?: WhatsappGroupStatusKey) => {
  const key = statusKey ?? WHATSAPP_GROUP_STATUS_KEYS.NOT_CHECKED;
  return (
    <Chip
      icon={
        key === WHATSAPP_GROUP_STATUS_KEYS.IN_GROUP ? (
          <img
            src={WHATSAPP_GROUP_TICK_ICON}
            alt=""
            aria-hidden="true"
            className="schoolstudents-whatsapp-chip-icon"
          />
        ) : undefined
      }
      label={t(WHATSAPP_GROUP_STATUS[key])}
      size="small"
      className={`schoolstudents-whatsapp-chip ${getWhatsappChipClass(key)}`}
      sx={{
        fontWeight: 500,
        fontSize: '0.75rem',
        height: 24,
        borderRadius: '9999px',
      }}
    />
  );
};

// Normalize mixed "yes"/"no"/boolean/null API flags into a strict union.
const normalizeWhatsappContactFlag = (value: unknown): 'yes' | 'no' | null => {
  if (value == null) return null;
  if (typeof value === 'boolean') return value ? 'yes' : 'no';
  const normalized = String(value).trim().toLowerCase();
  if (normalized === 'yes' || normalized === 'true') return 'yes';
  if (normalized === 'no' || normalized === 'false') return 'no';
  return null;
};

const getWhatsappAvailabilityStatus = (
  waContactRaw: unknown,
): WhatsappGroupStatusKey => {
  const waContact = normalizeWhatsappContactFlag(waContactRaw);
  if (waContact === 'yes') return WHATSAPP_GROUP_STATUS_KEYS.ON_WHATSAPP;
  if (waContact === 'no') return WHATSAPP_GROUP_STATUS_KEYS.NOT_AVAILABLE;
  return WHATSAPP_GROUP_STATUS_KEYS.NOT_CHECKED;
};
const mapBandToOpsLabel = (band?: string | null): OpsPerformanceLabel => {
  switch (band) {
    case STUDENT_PERFORMANCE_BAND_KEYS.GREEN:
      return OPS_PERFORMANCE_BANDS.HIGH;
    case STUDENT_PERFORMANCE_BAND_KEYS.YELLOW:
      return OPS_PERFORMANCE_BANDS.MEDIUM;
    case STUDENT_PERFORMANCE_BAND_KEYS.RED:
      return OPS_PERFORMANCE_BANDS.NOT_ACTIVE;
    case STUDENT_PERFORMANCE_BAND_KEYS.GREY:
    default:
      return OPS_PERFORMANCE_BANDS.NOT_DOWNLOADED;
  }
};

const mapOpsLabelToPerformanceLevel = (
  label?: string | null,
):
  | PerformanceLevel.DOING_GOOD
  | PerformanceLevel.STILL_LEARNING
  | PerformanceLevel.NEED_HELP
  | PerformanceLevel.NOT_TRACKED => {
  switch (label) {
    case OPS_PERFORMANCE_BANDS.HIGH:
      return PerformanceLevel.DOING_GOOD;
    case OPS_PERFORMANCE_BANDS.MEDIUM:
      return PerformanceLevel.STILL_LEARNING;
    case OPS_PERFORMANCE_BANDS.NOT_ACTIVE:
      return PerformanceLevel.NEED_HELP;
    case OPS_PERFORMANCE_BANDS.NOT_DOWNLOADED:
    default:
      return PerformanceLevel.NOT_TRACKED;
  }
};

interface SchoolStudentsProps {
  data: {
    schoolData?: SchoolData;
    programData?: ProgramGradeScopeData;
    students?: ApiStudentData[];
    totalStudentCount?: number;
    classData?: ClassRow[];
    totalCount?: number;
  };
  isMobile: boolean;
  schoolId: string;
  isTotal?: boolean;
  isFilter?: boolean;
  customTitle?: string;
  optionalClassId?: string;
  optionalGrade?: number | string;
  optionalSection?: string;
}

const ROWS_PER_PAGE = 20;

type StudentListCacheEntry = {
  data: ApiStudentData[];
  total: number;
};

// Keeps tab switches silent after the first scoped table load.
const studentListCache = new Map<string, StudentListCacheEntry>();

// Separates cached student lists by school, class detail, and program scope.
const getStudentListCacheKey = (
  schoolId: string,
  optionalClassId: string | undefined,
  classIds: string[] | undefined,
): string => {
  const classScope =
    optionalClassId && optionalClassId.trim() !== ''
      ? `class:${optionalClassId.trim()}`
      : `classes:${classIds?.join(',') ?? 'all'}`;
  return `${schoolId}|${classScope}`;
};

const sameSection = (a?: string, b?: string) =>
  String(a ?? '')
    .trim()
    .toUpperCase() ===
  String(b ?? '')
    .trim()
    .toUpperCase();

const SchoolStudents: React.FC<SchoolStudentsProps> = ({
  data,
  schoolId,
  isMobile,
  isTotal,
  isFilter,
  customTitle,
  optionalClassId,
  optionalGrade,
  optionalSection,
}) => {
  const [openPopup, setOpenPopup] = useState(false);
  const history = useHistory();
  const { roles } = useAppSelector(
    (state: RootState) => state.auth as AuthState,
  );
  const userRoles = roles || [];
  const isExternalUser = userRoles.includes(RoleType.EXTERNAL_USER);
  const isSmallScreen = useMediaQuery('(max-width: 768px)');
  // Derives the active program grade scope before loading student rows.
  const allowedGrades = useMemo(
    () => getProgramAllowedGrades(data.programData),
    [data.programData],
  );
  const programScopedClasses = useMemo(
    () => filterByProgramGrades(data.classData, allowedGrades),
    [data.classData, allowedGrades],
  );
  // Converts scoped classes to IDs for server-side student filtering.
  const programScopedClassIds = useMemo(() => {
    if (!allowedGrades) return undefined;
    return programScopedClasses
      .map((classRow) => String(classRow.id ?? '').trim())
      .filter((classId) => classId !== '');
  }, [allowedGrades, programScopedClasses]);
  const hasProgramClassScope = allowedGrades !== null;
  const initialStudentCacheKey = getStudentListCacheKey(
    schoolId,
    optionalClassId,
    programScopedClassIds,
  );
  const cachedInitialStudents = studentListCache.get(initialStudentCacheKey);
  const [students, setStudents] = useState<ApiStudentData[]>(
    cachedInitialStudents?.data ??
      (hasProgramClassScope ? [] : data.students || []),
  );
  const [totalCount, setTotalCount] = useState<number>(
    cachedInitialStudents?.total ??
      (hasProgramClassScope ? 0 : data.totalStudentCount || 0),
  );
  const hasInitialStudents =
    !!cachedInitialStudents ||
    (!hasProgramClassScope &&
      Array.isArray(data?.students) &&
      data.students.length > 0);
  const [isLoading, setIsLoading] = useState<boolean>(!hasInitialStudents);
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filters, setFilters] = useState<Record<string, string[]>>({
    grade: [],
    section: [],
  });
  const [orderBy, setOrderBy] = useState<string | null>('name');
  const [order, setOrder] = useState<'asc' | 'desc'>('asc');
  const [tempFilters, setTempFilters] = useState<Record<string, string[]>>({
    grade: [],
    section: [],
  });
  const [isFilterSliderOpen, setIsFilterSliderOpen] = useState(false);
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState<string>('');
  const [isAddStudentModalOpen, setIsAddStudentModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<MessageConfig | undefined>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [performanceFilter, setPerformanceFilter] = useState<PerformanceLevel>(
    PerformanceLevel.ALL,
  );
  const [isPerformanceLoading, setIsPerformanceLoading] = useState(false);
  const [studentData, setStudentData] = useState<StudentInfo>();
  const [studentStatus, setStudentStatus] =
    useState<EnumType<'fc_support_level'>>();
  const [isEditStudentModalOpen, setIsEditStudentModalOpen] = useState(false);
  const [isMergeStudentModalOpen, setIsMergeStudentModalOpen] = useState(false);
  const [editStudentData, setEditStudentData] = useState<StudentInfo | null>(
    null,
  );
  const [mergePrimaryStudent, setMergePrimaryStudent] =
    useState<DisplayStudent | null>(null);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteTargetStudent, setDeleteTargetStudent] =
    useState<StudentInfo | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isMergingStudent, setIsMergingStudent] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [popup, setPopup] = useState({
    open: false,
    image: '',
    heading: '',
    text: '',
    autoCloseSeconds: 0,
  });

  const api = ServiceConfig.getI().apiHandler;
  const isAtSchool = useMemo(() => {
    const raw = (data?.schoolData?.model ?? '').toString();
    const norm = raw
      .trim()
      .toLowerCase()
      .replace(/[\s-]+/g, '_');
    return norm === 'at_school';
  }, [data?.schoolData?.model]);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);
    return () => {
      clearTimeout(handler);
    };
  }, [searchTerm]);

  const fetchStudents = useCallback(
    async (currentPage: number, search: string, silent = false) => {
      if (!silent) {
        setIsLoading(true);
      }
      const api = ServiceConfig.getI().apiHandler;
      const scopedClassId = String(optionalClassId ?? '').trim() || undefined;
      const scopedClassIds = scopedClassId ? undefined : programScopedClassIds;
      const cacheKey = getStudentListCacheKey(
        schoolId,
        scopedClassId,
        scopedClassIds,
      );
      const shouldCache = currentPage === 1 && search.trim() === '';
      // Empty scoped class IDs mean the program intentionally has no student rows.
      if (scopedClassIds && scopedClassIds.length === 0) {
        setStudents([]);
        setTotalCount(0);
        if (shouldCache) {
          studentListCache.set(cacheKey, { data: [], total: 0 });
        }
        setIsLoading(false);
        return;
      }
      try {
        let response;
        if (search && search.trim() !== '') {
          response = await api.searchStudentsInSchool(
            schoolId,
            search,
            currentPage,
            ROWS_PER_PAGE,
            scopedClassId,
            scopedClassIds,
          );
          setStudents(response.data);
          setTotalCount(response.total);
          if (shouldCache) {
            studentListCache.set(cacheKey, {
              data: response.data,
              total: response.total,
            });
          }
        } else {
          response = await api.getStudentInfoBySchoolId(
            schoolId,
            currentPage,
            ROWS_PER_PAGE,
            scopedClassId,
            scopedClassIds,
          );
          setStudents(response.data);
          setTotalCount(response.total);
          if (shouldCache) {
            studentListCache.set(cacheKey, {
              data: response.data,
              total: response.total,
            });
          }
        }
      } catch (error) {
        logger.error('Failed to fetch students:', error);
      } finally {
        setIsLoading(false);
      }
    },
    [schoolId, optionalClassId, programScopedClassIds],
  );

  const issTotal = isTotal ?? true;
  const issFilter = isFilter ?? true;
  const custoomTitle = customTitle ?? 'Students';

  // Refreshes prefetched unscoped data without replacing scoped program results.
  useEffect(() => {
    if (allowedGrades || !hasInitialStudents) return;
    fetchStudents(1, '', true);
  }, [allowedGrades, schoolId, fetchStudents, hasInitialStudents]);

  useEffect(() => {
    const isInitial =
      page === 1 &&
      !debouncedSearchTerm &&
      filters.grade.length === 0 &&
      filters.section.length === 0;

    // Reuses prefetched school students only when no program scope is active.
    if (isInitial && !allowedGrades && !optionalClassId) {
      const prefetchedStudents = data.students || [];
      const prefetchedTotal =
        data.totalStudentCount ?? prefetchedStudents.length;
      const cacheKey = getStudentListCacheKey(
        schoolId,
        optionalClassId,
        programScopedClassIds,
      );

      setStudents(prefetchedStudents);
      setTotalCount(prefetchedTotal);
      studentListCache.set(cacheKey, {
        data: prefetchedStudents,
        total: prefetchedTotal,
      });

      if (prefetchedStudents.length > 0 || data.totalStudentCount === 0) {
        setIsLoading(false);
      } else {
        fetchStudents(page, debouncedSearchTerm, true);
      }
      return;
    }
    const cacheKey = getStudentListCacheKey(
      schoolId,
      optionalClassId,
      programScopedClassIds,
    );
    fetchStudents(
      page,
      debouncedSearchTerm,
      (isInitial && studentListCache.has(cacheKey)) ||
        (isInitial && !allowedGrades),
    );
  }, [
    page,
    debouncedSearchTerm,
    fetchStudents,
    data.students,
    data.totalStudentCount,
    filters.grade,
    filters.section,
    allowedGrades,
    optionalClassId,
    programScopedClassIds,
    schoolId,
  ]);

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handleSort = (key: string) => {
    const isAsc = orderBy === key && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(key);
    setPage(1);
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
    setPage(1);
  };

  const handleApplyFilters = () => {
    setFilters(tempFilters);
    setIsFilterSliderOpen(false);
    setPage(1);
  };

  const handleDeleteAppliedFilter = (key: string, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [key]: prev[key].filter((v) => v !== value),
    }));
    setPage(1);
  };

  const baseStudents = useMemo(() => {
    const gradeOn =
      optionalGrade !== undefined &&
      optionalGrade !== null &&
      String(optionalGrade).trim() !== '';
    const sectionOn =
      optionalSection !== undefined && String(optionalSection).trim() !== '';

    const classOn =
      optionalClassId !== undefined &&
      optionalClassId !== null &&
      String(optionalClassId).trim() !== '';
    if (classOn) {
      const targetClassId = String(optionalClassId).trim();
      const getRowClassId = (row: ApiStudentData) =>
        String(row.classWithidname?.id ?? '').trim();

      const matchedByClassId = students.filter((row: ApiStudentData) => {
        const rowClassId = getRowClassId(row);
        return rowClassId !== '' && rowClassId === targetClassId;
      });

      if (matchedByClassId.length > 0 || students.length === 0) {
        return matchedByClassId;
      }

      // Fallback by grade/section if class ids are unavailable in row shape.
      if (gradeOn || sectionOn) {
        return students.filter((row: ApiStudentData) => {
          const gradeOk =
            !gradeOn || String(row.grade) === String(optionalGrade);
          const sectionOk =
            !sectionOn || sameSection(row.classSection, optionalSection);
          return gradeOk && sectionOk;
        });
      }

      // In class-scoped view, avoid showing school-wide students when class match fails.
      return [];
    }

    if (!gradeOn && !sectionOn) return students;
    return students.filter((row: any) => {
      const gradeOk = !gradeOn || String(row.grade) === String(optionalGrade);
      const sectionOk =
        !sectionOn || sameSection(row.classSection, optionalSection);
      return gradeOk && sectionOk;
    });
  }, [students, optionalClassId, optionalGrade, optionalSection]);

  // Applies client-side program filtering to prefetched or search result rows.
  const programFilteredStudents = useMemo(() => {
    if (!allowedGrades) return baseStudents;
    return baseStudents.filter((student) => {
      return isProgramGradeAllowed(allowedGrades, {
        name: getExactClassName(student.classWithidname),
        grade: student.grade,
        section: student.classSection,
      });
    });
  }, [baseStudents, allowedGrades]);

  const normalizedStudents = useMemo<ApiStudentData[]>(
    () => programFilteredStudents,
    [programFilteredStudents],
  );

  const filteredStudents = useMemo(() => {
    const searchableStudents = normalizedStudents.map((student, index) => ({
      index,
      user: {
        name: student.user.name ?? undefined,
        email: student.user.email ?? undefined,
        student_id: student.user.student_id ?? undefined,
      },
      grade: student.grade,
      classSection: student.classSection,
    }));

    return filterBySearchAndFilters(
      searchableStudents,
      {
        grade: filters.grade ?? [],
        section: (filters.section ?? []).map((s) => String(s).trim()),
      },
      searchTerm,
      'student',
    ).map((student) => normalizedStudents[student.index]);
  }, [normalizedStudents, filters, searchTerm]);

  const sortedStudents = useMemo(() => {
    // Standard sorting for all columns
    return [...filteredStudents].sort((a, b) => {
      let aValue, bValue;
      switch (orderBy) {
        case 'studentIdDisplay':
          aValue = a.user.student_id || '';
          bValue = b.user.student_id || '';
          return order === 'asc'
            ? aValue.localeCompare(bValue)
            : bValue.localeCompare(aValue);
        case 'name':
          aValue = a.user.name || '';
          bValue = b.user.name || '';

          if (order === 'asc') {
            if (aValue > bValue) return 1;
            if (aValue < bValue) return -1;
            return 0;
          } else {
            if (aValue < bValue) return 1;
            if (aValue > bValue) return -1;
            return 0;
          }
        case 'gender':
          aValue = a.user.gender || '';
          bValue = b.user.gender || '';
          return order === 'asc'
            ? aValue.localeCompare(bValue)
            : bValue.localeCompare(aValue);
        case 'grade':
          aValue = a.grade || 0;
          bValue = b.grade || 0;
          return order === 'asc' ? aValue - bValue : bValue - aValue;
        case 'classSection':
          aValue = a.classSection || '';
          bValue = b.classSection || '';
          return order === 'asc'
            ? aValue.localeCompare(bValue)
            : bValue.localeCompare(aValue);
        case 'phoneNumber':
          aValue = a.parent?.phone || '';
          bValue = b.parent?.phone || '';
          return order === 'asc'
            ? aValue.localeCompare(bValue)
            : bValue.localeCompare(aValue);
        default:
          return 0;
      }
    });
  }, [filteredStudents, orderBy, order]);

  const [studentPerformanceMap, setStudentPerformanceMap] = useState<
    Map<string, string>
  >(new Map());
  // Cache: classId -> normalized WhatsApp member phone numbers.
  const [whatsappMembersByClass, setWhatsappMembersByClass] = useState<
    Map<string, Set<string>>
  >(new Map());

  const studentIdsKey = useMemo(
    () => sortedStudents.map((s) => s.user.id).join(','),
    [sortedStudents],
  );
  const classDataRef = useMemo(() => {
    return Array.isArray(data.classData) ? data.classData[0] : undefined;
  }, [data.classData]);

  // Fold classId + group_id into one key so the fetch effect reruns on link changes.
  const classGroupKey = useMemo(() => {
    if (!issTotal) return '';
    return programScopedClasses
      .map((row) => `${row?.id ?? ''}:${row?.group_id ?? ''}`)
      .join('|');
  }, [issTotal, programScopedClasses]);

  const classGroupIdMap = useMemo(() => {
    const map = new Map<string, string>();
    const classes = issTotal
      ? programScopedClasses
      : Array.isArray(data.classData)
        ? data.classData
        : [];
    classes.forEach((row) => {
      if (row?.id) map.set(row.id, String(row?.group_id ?? '').trim());
    });
    return map;
  }, [data.classData, issTotal, programScopedClasses]);

  useEffect(() => {
    let cancelled = false;
    const bot = data?.schoolData?.whatsapp_bot_number;
    // Uses program-scoped classes for the total view and the current class otherwise.
    const classes = issTotal
      ? programScopedClasses
      : classDataRef
        ? [classDataRef]
        : [];
    const groupTargets = classes.filter(
      (row) => row?.id && row?.group_id && String(row.group_id).trim() !== '',
    );

    // Fetch member lists only for classes that already have linked WhatsApp groups.
    if (!bot || !api?.getWhatsappGroupDetails || groupTargets.length === 0) {
      setWhatsappMembersByClass(new Map());
      return;
    }

    (async () => {
      try {
        // Fetch group members for each class in parallel, keep classId -> group map.
        const results = await Promise.all(
          groupTargets.map(async (row) => {
            try {
              const group = await api.getWhatsappGroupDetails(
                row.group_id as string,
                bot,
              );
              return [row.id as string, group] as const;
            } catch (error) {
              logger.error('Failed to fetch WhatsApp group members:', error);
              return [row.id as string, null] as const;
            }
          }),
        );

        if (cancelled) return;
        const next = new Map<string, Set<string>>();
        results.forEach(([classId, group]) => {
          const parsedGroup =
            typeof group === 'object' && group !== null && !Array.isArray(group)
              ? (group as { members?: string[] })
              : null;
          const members = Array.isArray(parsedGroup?.members)
            ? (parsedGroup?.members ?? [])
            : [];
          // Normalize to 10-digit numbers so comparisons are consistent.
          const normalizedMembers = new Set<string>(
            members
              .map((member: unknown) => normalizePhone10(String(member)))
              .filter((member): member is string => Boolean(member)),
          );
          next.set(classId, normalizedMembers);
        });
        setWhatsappMembersByClass(next);
      } catch (error) {
        logger.error('Failed to fetch WhatsApp group members:', error);
        if (!cancelled) {
          setWhatsappMembersByClass(new Map());
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    api,
    classDataRef?.id,
    classDataRef?.group_id,
    classGroupKey,
    data?.schoolData?.whatsapp_bot_number,
    issTotal,
    programScopedClasses,
  ]);

  const getGroupIdForClass = useCallback(
    (classId?: string) => {
      if (!classId) return '';
      if (!issTotal && classDataRef?.group_id != null) {
        return String(classDataRef.group_id ?? '').trim();
      }
      return String(classGroupIdMap.get(classId) ?? '').trim();
    },
    [classDataRef?.group_id, classGroupIdMap, issTotal],
  );

  // Check the parent's phone against the WhatsApp members set for the class.
  const isStudentInWhatsappGroup = useCallback(
    (student: ApiStudentData) => {
      const classId = issTotal
        ? student.classWithidname?.id
        : (classDataRef?.id ?? student.classWithidname?.id);
      if (!classId) return false;
      const members = whatsappMembersByClass.get(classId);
      if (!members || members.size === 0) return false;
      const parentPhone = normalizePhone10(String(student.parent?.phone ?? ''));
      return !!parentPhone && members.has(parentPhone);
    },
    [classDataRef?.id, issTotal, whatsappMembersByClass],
  );

  // Gate group membership by the parent WhatsApp contact flag.
  const getWhatsappGroupStatus = useCallback(
    (student: ApiStudentData): WhatsappGroupStatusKey => {
      const classId = issTotal
        ? student.classWithidname?.id
        : (classDataRef?.id ?? student.classWithidname?.id);
      if (!classId) return WHATSAPP_GROUP_STATUS_KEYS.NOT_CHECKED;

      const waContactRaw =
        (student.parent as { is_wa_contact?: unknown } | null)?.is_wa_contact ??
        null;
      const groupId = getGroupIdForClass(classId);
      // No class group: show user-level WhatsApp availability from is_wa_contact.
      if (!groupId) return getWhatsappAvailabilityStatus(waContactRaw);

      const waContact = normalizeWhatsappContactFlag(waContactRaw);
      if (waContact === 'yes') {
        return isStudentInWhatsappGroup(student)
          ? WHATSAPP_GROUP_STATUS_KEYS.IN_GROUP
          : WHATSAPP_GROUP_STATUS_KEYS.NOT_IN_GROUP;
      }
      if (waContact === 'no') {
        return WHATSAPP_GROUP_STATUS_KEYS.NOT_ON_WHATSAPP;
      }
      return WHATSAPP_GROUP_STATUS_KEYS.NOT_CHECKED;
    },
    [classDataRef?.id, getGroupIdForClass, isStudentInWhatsappGroup, issTotal],
  );

  useEffect(() => {
    const fetchStudentPerformance = async () => {
      if (sortedStudents.length === 0) {
        setStudentPerformanceMap(new Map());
        return;
      }

      const studentIds = sortedStudents
        .map((student) => student.user.id)
        .filter(Boolean);
      const classIds = Array.from(
        new Set(
          sortedStudents
            .map((student) =>
              issTotal
                ? student.classWithidname?.id
                : (classDataRef?.id ?? student.classWithidname?.id),
            )
            .filter((value): value is string => Boolean(value)),
        ),
      );

      if (studentIds.length === 0 || classIds.length === 0) {
        setStudentPerformanceMap(new Map());
        return;
      }

      setIsPerformanceLoading(true);
      const performanceMap = new Map<string, string>();

      try {
        const mvRows = await api.getOpsStudentPerformanceBands({
          classIds,
          studentIds,
        });

        mvRows.forEach((row) => {
          const rowStudentId = String(row?.student_id ?? '').trim();
          const rowClassId = String(row?.class_id ?? '').trim();
          const rawBand = (row?.performance ??
            null) as StudentPerformanceBand | null;

          if (!rowStudentId || !rowClassId) return;
          performanceMap.set(
            `${rowClassId}:${rowStudentId}`,
            mapBandToOpsLabel(rawBand),
          );
        });

        setStudentPerformanceMap(performanceMap);
      } catch (error) {
        logger.error('Error fetching student performance data:', error);
        setStudentPerformanceMap(performanceMap);
      } finally {
        setIsPerformanceLoading(false);
      }
    };
    fetchStudentPerformance();
  }, [api, classDataRef?.id, issTotal, studentIdsKey]);
  const getStudentInfoById = useCallback(
    (id: string): StudentInfo | null => {
      if (!Array.isArray(students)) return null;
      return students.find((stu) => stu.user?.id === id) || null;
    },
    [students],
  );

  const getDeleteTargetStudent = useCallback(
    (student: DisplayStudent): StudentInfo => {
      const source = student.original as StudentInfo & {
        classId?: string;
        class_id?: string;
        class_name?: string;
      };

      const resolvedClassId =
        source.classWithidname?.id || source.classId || source.class_id || '';
      const resolvedClassName =
        source.classWithidname?.class_name || source.class_name || '';

      return {
        ...source,
        classWithidname: resolvedClassId
          ? {
              id: resolvedClassId,
              class_name: resolvedClassName,
            }
          : source.classWithidname,
      };
    },
    [],
  );

  const studentsForCurrentPage = useMemo((): DisplayStudent[] => {
    let filtered = sortedStudents.map((s_api): DisplayStudent => {
      const classNameFromStudent = getExactClassName(s_api.classWithidname);
      const rowClassId = String(
        issTotal
          ? (s_api.classWithidname?.id ?? '')
          : (classDataRef?.id ?? s_api.classWithidname?.id ?? ''),
      ).trim();
      return {
        id: s_api.user.id,
        original: s_api,
        studentIdDisplay: s_api.user.student_id ?? 'N/A',
        name: s_api.user.name ?? 'N/A',
        gender: s_api.user.gender ?? 'N/A',
        grade: s_api.grade ?? 0,
        classSection: s_api.classSection ?? 'N/A',
        phoneNumber: s_api.parent?.phone || s_api.parent?.email || 'N/A', //here
        class: getClassDisplayLabel(
          s_api.grade,
          s_api.classSection,
          classNameFromStudent,
        ),
        schstudents_performance:
          studentPerformanceMap.get(`${rowClassId}:${s_api.user.id}`) ??
          OPS_PERFORMANCE_BANDS.NOT_DOWNLOADED,
        // Status is derived from parent is_wa_contact + class group membership.
        whatsappGroupStatus: getWhatsappGroupStatus(s_api),
      };
    });
    // Filter by performance if not "all"
    if (performanceFilter !== PerformanceLevel.ALL) {
      filtered = filtered.filter((student) => {
        const perf = mapOpsLabelToPerformanceLevel(
          student.schstudents_performance,
        );
        return perf === performanceFilter;
      });
    }
    return filtered;
  }, [
    classDataRef?.id,
    issTotal,
    sortedStudents,
    performanceFilter,
    studentPerformanceMap,
    getWhatsappGroupStatus,
  ]);

  const pageCount = useMemo(() => {
    return Math.ceil(totalCount / ROWS_PER_PAGE);
  }, [totalCount, filters, searchTerm, filteredStudents.length]);

  const isDataPresent = studentsForCurrentPage.length > 0;
  const isFilteringOrSearching =
    searchTerm.trim() !== '' ||
    Object.values(filters).some((f) => f.length > 0);

  const handleFilterIconClick = useCallback(() => {
    setTempFilters(filters);
    setIsFilterSliderOpen(true);
  }, [filters]);

  const handleClearFilters = useCallback(() => {
    setFilters({ grade: [], section: [] });
    setTempFilters({ grade: [], section: [] });
    setPage(1);
  }, []);

  const handleSliderFilterChange = useCallback((name: string, value: any) => {
    setTempFilters((prev) => ({
      ...prev,
      [name]: Array.isArray(value) ? value : [value],
    }));
  }, []);
  const handleCancelFilters = useCallback(() => {
    setIsFilterSliderOpen(false);
  }, []);

  const hasAnyStudents = (totalCount ?? 0) > 0;
  const isNoStudentsState = !isLoading && !hasAnyStudents;
  const hideHeaderActions = isNoStudentsState;
  const hideFilterUI = isNoStudentsState;

  const handleInteractClick = useCallback(
    (student: DisplayStudent) => {
      const fullStudent = getStudentInfoById(student.id) ?? student.original;
      if (!fullStudent) return;

      const mappedType = student.schstudents_performance
        ? OpsSupportLevelMap[
            student.schstudents_performance as keyof typeof OpsSupportLevelMap
          ]
        : null;

      setStudentData(fullStudent);
      setStudentStatus(
        mappedType ?? OpsSupportLevelMap[OPS_PERFORMANCE_BANDS.NOT_DOWNLOADED],
      );
      setOpenPopup(true);
    },
    [getStudentInfoById],
  );

  const columns: Column<DisplayStudent>[] = useMemo(() => {
    const actionColumn: Column<DisplayStudent>[] = isExternalUser
      ? []
      : [
          {
            key: 'schstudents_actions',
            label: '',
            sortable: false,
            render: (s) => (
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <ActionMenu
                  items={[
                    {
                      name: t('Send Message'),
                      icon: (
                        <ChatBubbleOutlineOutlined
                          fontSize="small"
                          sx={{ color: 'black' }}
                        />
                      ),
                    },
                    {
                      name: t('Edit Details'),
                      icon: (
                        <BorderColorIcon
                          fontSize="small"
                          sx={{ color: 'black' }}
                        />
                      ),
                      onClick: () => {
                        const fullStudent = getStudentInfoById(s.id);
                        if (!fullStudent) return;
                        setEditStudentData(fullStudent);
                        setIsEditStudentModalOpen(true);
                      },
                    },
                    {
                      name: t('Merge'),
                      icon: (
                        <MergeOutlinedIcon
                          fontSize="small"
                          sx={{ color: 'black' }}
                          style={{ transform: 'rotate(90deg)' }}
                        />
                      ),
                      onClick: () => {
                        setMergePrimaryStudent(s);
                        setIsMergeStudentModalOpen(true);
                      },
                    },
                    {
                      name: t('Delete'),
                      icon: (
                        <DeleteOutlineIcon
                          fontSize="small"
                          sx={{ color: 'black' }}
                        />
                      ),
                      onClick: () => {
                        setDeleteTargetStudent(getDeleteTargetStudent(s));
                        setIsDeleteModalOpen(true);
                      },
                    },
                  ]}
                  renderTrigger={(open) => (
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        open(e);
                      }}
                      sx={{
                        color: '#6B7280',
                        '&:hover': { bgcolor: '#F3F4F6' },
                      }}
                    >
                      <MoreHoriz sx={{ fontSize: 20, fontWeight: 800 }} />
                    </IconButton>
                  )}
                />
              </Box>
            ),
          },
        ];
    const commonColumns: Column<DisplayStudent>[] = [
      {
        key: 'studentIdDisplay',
        label: t('Student ID'),
        sortable: !issTotal ? false : undefined,
      },
      {
        key: 'name',
        label: t('Student Name'),
        align: 'left',
        render: (s) => (
          <Typography variant="body2" className="student-name-data">
            {s.name}
          </Typography>
        ),
      },
      ...(!isExternalUser
        ? ([
            {
              key: 'schstudents_interact',
              label: t('Interact'),
              sortable: false,
              render: (s) => (
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'left',
                    alignItems: 'left',
                  }}
                >
                  <IconButton
                    size="small"
                    onClick={() => handleInteractClick(s)}
                  >
                    <img
                      src="/assets/icons/Interact.svg"
                      alt="Interact"
                      style={{ width: 30, height: 30 }}
                    />
                  </IconButton>
                </Box>
              ),
            },
          ] as Column<DisplayStudent>[])
        : []),
    ];
    const genderColumn: Column<DisplayStudent> = {
      key: 'gender',
      label: t('Gender'),
      sortable: !issTotal ? false : undefined,
      render: (s) => (
        <Typography variant="body2" className="student-name-data">
          {s.gender
            ? s.gender.charAt(0).toUpperCase() + s.gender.slice(1).toLowerCase()
            : ''}
        </Typography>
      ),
    };
    const performanceColumn: Column<DisplayStudent> = {
      key: 'schstudents_performance',
      label: t('Performance'),
      sortable: false,
      render: (s) => (
        <Chip
          label={t(
            s.schstudents_performance || OPS_PERFORMANCE_BANDS.NOT_DOWNLOADED,
          )}
          size="small"
          className={getPerformanceChipClass(
            s.schstudents_performance || OPS_PERFORMANCE_BANDS.NOT_DOWNLOADED,
          )}
          sx={{
            fontWeight: 500,
            fontSize: '0.75rem',
            height: 24,
            borderRadius: '4px',
          }}
        />
      ),
    };
    const whatsappGroupColumn: Column<DisplayStudent> = {
      key: 'whatsappGroupStatus',
      label: t('WhatsApp Group'),
      sortable: false,
      render: (s) => renderWhatsappGroupChip(s.whatsappGroupStatus),
    };
    if (!issTotal) {
      return [
        ...commonColumns,
        genderColumn,
        performanceColumn,
        whatsappGroupColumn,
        ...actionColumn,
      ];
    } else {
      return [
        ...commonColumns,
        genderColumn,
        performanceColumn,
        // { key: "phoneNumber", label: t("Phone Number / Email") },
        { key: 'class', label: t('Class') },
        whatsappGroupColumn,
        ...actionColumn,
      ];
    }
  }, [
    getDeleteTargetStudent,
    getStudentInfoById,
    handleInteractClick,
    issTotal,
    isExternalUser,
  ]);

  // Shows only program-visible classes in add/edit student class pickers.
  const classOptions = useMemo(() => {
    if (programScopedClasses.length === 0) return [];
    return programScopedClasses
      .map((classRow) => ({
        value: classRow.id,
        label:
          typeof classRow.name === 'string'
            ? classRow.name
            : String(classRow.name ?? ''),
      }))
      .filter((option) => option.value && option.label)
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [programScopedClasses]);

  const currentClass = useMemo(() => {
    if (!issTotal) {
      const classDataArray = data.classData || [];
      const scopedClassId = String(optionalClassId ?? '').trim();
      if (classDataArray.length > 0) {
        const classFromData =
          (scopedClassId
            ? classDataArray.find(
                (classRow) =>
                  String(classRow?.id ?? '').trim() === scopedClassId,
              )
            : classDataArray[0]) ?? null;
        if (classFromData?.id && classFromData?.name) {
          return { id: classFromData.id, name: classFromData.name };
        }
      }
      const matchingStudent = baseStudents.find((student: any) => {
        const classInfo = student.classWithidname;
        return (
          (!scopedClassId ||
            String(classInfo?.id ?? '').trim() === scopedClassId ||
            (student.grade === optionalGrade &&
              sameSection(student.classSection, optionalSection))) &&
          classInfo?.id &&
          classInfo?.class_name
        );
      });
      if (matchingStudent?.classWithidname) {
        const classInfo = matchingStudent.classWithidname as any;
        return {
          id: classInfo.id,
          name: classInfo.class_name || classInfo.name,
        };
      }
      return null;
    }
    return null;
  }, [
    issTotal,
    optionalClassId,
    optionalGrade,
    optionalSection,
    baseStudents,
    data.classData,
  ]);

  const mergeModalClassId = useMemo(() => {
    const scopedClassId = String(optionalClassId ?? '').trim();
    if (scopedClassId) return scopedClassId;

    const primaryStudentClassId = String(
      mergePrimaryStudent?.original?.classWithidname?.id ?? '',
    ).trim();
    if (primaryStudentClassId) return primaryStudentClassId;

    const currentClassId = String(currentClass?.id ?? '').trim();
    return currentClassId;
  }, [optionalClassId, mergePrimaryStudent, currentClass?.id]);

  const addStudentFields: FieldConfig[] = useMemo(() => {
    if (issTotal) {
      const fields: FieldConfig[] = [
        {
          name: 'studentName',
          label: 'Student Name',
          kind: 'text' as const,
          required: true,
          placeholder: 'Enter Student Name',
          column: 2 as const,
        },
        {
          name: 'studentID',
          label: 'Student ID',
          kind: 'text' as const,
          placeholder: 'Enter Student ID',
          column: 0 as const,
        },
        {
          name: 'gender',
          label: 'Gender',
          kind: 'select' as const,
          required: true,
          column: 1 as const,
          options: [
            { label: t('GIRL'), value: GENDER.GIRL },
            { label: t('BOY'), value: GENDER.BOY },
            {
              label: t('UNSPECIFIED'),
              value: GENDER.OTHER,
            },
          ],
        },
        {
          name: 'class',
          label: 'Class',
          kind: 'select' as const,
          required: true,
          column: 0 as const,
          options: classOptions,
        },
        {
          name: 'ageGroup',
          label: 'Age',
          kind: 'select' as const,
          required: true,
          placeholder: 'Select Age Group',
          column: 1 as const,
          options: [
            {
              value: AGE_OPTIONS.LESS_THAN_EQUAL_4,
              label: `≤${t('4 years')}`,
            },
            { value: AGE_OPTIONS.FIVE, label: t('5 years') },
            { value: AGE_OPTIONS.SIX, label: t('6 years') },
            { value: AGE_OPTIONS.SEVEN, label: t('7 years') },
            { value: AGE_OPTIONS.EIGHT, label: t('8 years') },
            { value: AGE_OPTIONS.NINE, label: t('9 years') },
            {
              value: AGE_OPTIONS.GREATER_THAN_EQUAL_10,
              label: `≥${t('10 years')}`,
            },
          ],
        },
      ];
      if (!isAtSchool) {
        fields.push({
          name: 'phone',
          label: 'Phone Number',
          kind: 'phone' as const,
          required: true,
          placeholder: 'Enter phone number',
          column: 2 as const,
        });
      }
      return fields;
    } else {
      const fields: FieldConfig[] = [
        {
          name: 'studentName',
          label: 'Student Name',
          kind: 'text' as const,
          required: true,
          placeholder: 'Enter Student Name',
          column: 0 as const,
        },
        {
          name: 'studentID',
          label: 'Student ID',
          kind: 'text' as const,
          placeholder: 'Enter Student ID',
          column: 1 as const,
        },
        {
          name: 'gender',
          label: 'Gender',
          kind: 'select' as const,
          required: true,
          column: 0 as const,
          options: [
            { label: t('GIRL'), value: GENDER.GIRL },
            { label: t('BOY'), value: GENDER.BOY },
            {
              label: t('UNSPECIFIED'),
              value: GENDER.OTHER,
            },
          ],
        },
        {
          name: 'ageGroup',
          label: 'Age',
          kind: 'select' as const,
          required: true,
          placeholder: 'Select Age Group',
          column: 1 as const,
          options: [
            {
              value: AGE_OPTIONS.LESS_THAN_EQUAL_4,
              label: `≤${t('4 years')}`,
            },
            { value: AGE_OPTIONS.FIVE, label: t('5 years') },
            { value: AGE_OPTIONS.SIX, label: t('6 years') },
            { value: AGE_OPTIONS.SEVEN, label: t('7 years') },
            { value: AGE_OPTIONS.EIGHT, label: t('8 years') },
            { value: AGE_OPTIONS.NINE, label: t('9 years') },
            {
              value: AGE_OPTIONS.GREATER_THAN_EQUAL_10,
              label: `≥${t('10 years')}`,
            },
          ],
        },
      ];
      if (!isAtSchool) {
        fields.push({
          name: 'phone',
          label: 'Phone Number',
          kind: 'phone' as const,
          required: true,
          placeholder: 'Enter phone number',
          column: 2 as const,
        });
      }
      return fields;
    }
  }, [issTotal, classOptions, isAtSchool, baseStudents]);

  const editStudentFields: FieldConfig[] = [
    {
      name: 'studentName',
      label: 'Student Name',
      kind: 'text',
      required: true,
      column: 2,
    },

    // 2️⃣ Student ID – left
    {
      name: 'studentID',
      label: 'Student ID',
      kind: 'text',
      column: 0,
      disabled: true,
    },

    {
      name: 'gender',
      label: 'Gender',
      kind: 'select',
      required: true,
      column: 1,
      options: [
        { label: t('FEMALE'), value: GENDER.GIRL },
        { label: t('MALE'), value: GENDER.BOY },
        { label: t('UNSPECIFIED'), value: GENDER.OTHER },
      ],
    },
    // 3️⃣ Class & Section – right
    {
      name: 'classAndSection',
      label: 'Class And Section',
      kind: 'text',
      column: 0,
      disabled: true,
    },

    // 5️⃣ Age – right
    {
      name: 'ageGroup',
      label: 'Age',
      kind: 'select',
      required: true,
      column: 1,
      options: Object.values(AGE_OPTIONS).map((v) => ({
        value: v,
        label: v,
      })),
    },

    // 6️⃣ Phone – full width
    {
      name: 'phone',
      label: 'Phone Number',
      kind: 'text',
      column: 2,
      disabled: true,
    },
  ];

  const getRandomAvatar = () => {
    if (AVATARS.length === 0) return '';
    const randomIndex = Math.floor(Math.random() * AVATARS.length);
    return AVATARS[randomIndex];
  };

  const handleAddNewStudent = useCallback(() => {
    setIsAddStudentModalOpen(true);
    setErrorMessage(undefined);
  }, [history]);

  const handleEditSubmit = async (values: Record<string, string>) => {
    if (!editStudentData) return; // ✅ null safety

    const user = editStudentData.user;
    const classId = editStudentData.classWithidname?.id;
    const avatarToSend =
      user.avatar && user.avatar.trim() !== ''
        ? user.avatar
        : getRandomAvatar();

    if (!classId) {
      logger.error('Class ID missing for student');
      return;
    }
    await api.updateStudentFromSchoolMode(
      user,
      values.studentName,
      Number(values.ageGroup),
      values.gender,
      avatarToSend,
      user.image || '',
      user.curriculum_id || user.curriculum_id!,
      user.grade_id || user.grade_id!,
      user.language_id || user.language_id!,
      user.student_id || user.student_id!,
      classId,
    );

    setIsEditStudentModalOpen(false);
    fetchStudents(page, debouncedSearchTerm);
  };

  const handleCloseAddStudentModal = useCallback(() => {
    setIsAddStudentModalOpen(false);
    setErrorMessage(undefined);
    setIsSubmitting(false);
  }, []);

  const handleSubmitAddStudentModal = useCallback(
    async (formValues: Record<string, string>) => {
      setIsSubmitting(true);
      setErrorMessage(undefined);

      const fail = (text: string) => {
        setErrorMessage({ text, type: 'error' });
        setIsSubmitting(false);
      };

      const rawPhone = (formValues.phone ?? '').toString();
      let digits = rawPhone.replace(/\D/g, '');
      if (digits === '' || digits === '91') digits = '';
      if (digits.length === 12 && digits.startsWith('91'))
        digits = digits.slice(2);
      if (digits.length === 11 && digits.startsWith('0'))
        digits = digits.slice(1);
      // Phone validation
      if (!isAtSchool) {
        if (digits.length !== 10)
          return fail('Phone number must be 10 digits.');
      } else {
        if (digits.length !== 0 && digits.length !== 10) {
          return fail('Phone number must be 10 digits when provided.');
        }
      }
      // Class validation (this is needed for BOTH flows)
      const classId = issTotal ? formValues.class : currentClass?.id;
      if (!classId) return fail('Please select a class.');
      const normalizedPhone = digits.length === 10 ? digits : undefined;
      try {
        const payload: any = {
          phone: normalizedPhone,
          name: formValues.studentName || '',
          gender: formValues.gender || '',
          age: formValues.ageGroup || '',
          classId: classId,
          schoolId: schoolId,
          studentID: formValues.studentID || '',
          atSchool: isAtSchool,
        };
        const result = await api.addStudentWithParentValidation(payload);
        if (result.success) {
          setErrorMessage({
            text: 'Student added successfully.',
            type: 'success',
          });
          setTimeout(() => {
            setIsAddStudentModalOpen(false);
            setErrorMessage(undefined);
          }, 2000);
          setPage(1);
          fetchStudents(1, debouncedSearchTerm);
        } else {
          setErrorMessage({ text: result.message, type: 'error' });
        }
      } catch (error) {
        logger.error('Error adding student:', error);
        setErrorMessage({
          text: 'An unexpected error occurred. Please try again.',
          type: 'error',
        });
      } finally {
        setIsSubmitting(false);
      }
    },
    [
      api,
      isAtSchool,
      issTotal,
      currentClass,
      schoolId,
      fetchStudents,
      debouncedSearchTerm,
      setIsAddStudentModalOpen,
    ],
  );

  const handleConfirmDelete = async () => {
    if (!deleteTargetStudent) return;

    try {
      setIsDeleting(true);

      const studentId =
        deleteTargetStudent.user?.id ||
        (deleteTargetStudent as { id?: string }).id ||
        '';
      const classId =
        deleteTargetStudent.classWithidname?.id ||
        (deleteTargetStudent as { classId?: string }).classId ||
        (deleteTargetStudent as { class_id?: string }).class_id ||
        '';

      if (!studentId || !classId) {
        logger.error('Missing studentId or classId');
        return;
      }
      const studentName = deleteTargetStudent?.user?.name;
      const message = t(
        "{{studentName}}'s profile has been deleted and is no longer available.",
        { studentName: studentName ?? '' },
      );
      const res = await api.deleteUserFromClass(studentId, classId);
      if (res) {
        setPopup({
          open: true,
          image: DeleteIcon,
          heading: 'Profile Deleted Successfully',
          text: message, // dynamic
          autoCloseSeconds: 5,
        });
      } else {
      }

      setIsDeleteModalOpen(false);
      setDeleteTargetStudent(null);

      fetchStudents(page, debouncedSearchTerm);
    } catch (error) {
      logger.error('Delete failed:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const filterConfigsForSchool = [{ key: 'grade', label: 'Grade' }];

  const performanceFilters = [
    { key: PerformanceLevel.ALL, label: t('All') },
    { key: PerformanceLevel.NEED_HELP, label: t('Not Active') },
    { key: PerformanceLevel.DOING_GOOD, label: t('High Engagement') },
    { key: PerformanceLevel.STILL_LEARNING, label: t('Medium Engagement') },
    { key: PerformanceLevel.NOT_TRACKED, label: t('Not Downloaded') },
  ];
  async function handleMergeStudents(student: any): Promise<void> {
    try {
      if (!mergePrimaryStudent) return;
      // Selected student is merged into the primary student (kept profile).
      const oldId = student?.user?.id;
      const newId = mergePrimaryStudent.id;
      const fromName = student?.user?.fullName || student?.user?.name;
      const toName = mergePrimaryStudent.name;
      if (!oldId || !newId) {
        logger.error('Invalid student IDs');
        return;
      }
      if (oldId === newId) {
        logger.error('Cannot merge same student');
        return;
      }

      setIsMergingStudent(true);
      const mergeResult = await api.mergeStudentRequest(oldId, newId);
      if (mergeResult.success) {
        const mergeMessage = t(
          "{{fromName}}\nhas been merged into {{toName}}'s profile",
          {
            fromName: fromName ?? '',
            toName: toName ?? '',
          },
        );
        setPopup({
          open: true,
          image: verifiedIcon,
          heading: 'Successfully Merged',
          text: mergeMessage, // dynamic
          autoCloseSeconds: 5,
        });
      } else {
        setPopup({
          open: true,
          image: ErrorIcon,
          heading: 'Something went wrong',
          text: mergeResult.message || t('Failed to merge student profile.'),
          autoCloseSeconds: 5,
        });
      }
      // Keep UI in sync with backend after merge attempts.
      let removed = false;
      setStudents((prev) => {
        const next = prev.filter((row: any) => {
          const rowId = row?.user?.id ?? row?.id;
          const keep = rowId !== oldId;
          if (!keep) removed = true;
          return keep;
        });
        return next;
      });
      if (removed) {
        setTotalCount((prev) => Math.max(0, prev - 1));
      }
      setShowSuccessPopup(true);
      setIsMergeStudentModalOpen(false);
      setMergePrimaryStudent(null);
    } catch (error: any) {
      logger.error('Merge failed:', error);
      setPopup({
        open: true,
        image: ErrorIcon,
        heading: 'Something went wrong',
        text: error?.message || t('Unexpected error while merging.'),
        autoCloseSeconds: 5,
      });
      setShowSuccessPopup(true);
      setIsMergeStudentModalOpen(false);
      setMergePrimaryStudent(null);
    } finally {
      setIsMergingStudent(false);
    }
  }

  return (
    <div className="schoolStudents-pageContainer">
      <OpsGenericPopup
        isOpen={popup.open}
        imageSrc={popup.image}
        heading={popup.heading}
        text={popup.text}
        autoCloseSeconds={5}
        onClose={() =>
          setPopup((prev) => ({
            ...prev,
            open: false,
          }))
        }
      />
      <FormCard
        open={isAddStudentModalOpen}
        title={
          !issTotal && currentClass
            ? `${t('Add New Student')} - ${currentClass.name}`
            : t('Add New Student')
        }
        submitLabel={isSubmitting ? t('Adding...') : t('Add Student')}
        fields={addStudentFields}
        onClose={handleCloseAddStudentModal}
        onSubmit={handleSubmitAddStudentModal}
        message={errorMessage}
      />
      <FormCard
        open={isEditStudentModalOpen}
        title={t('Edit Student Details')}
        submitLabel={t('Save Changes')}
        fields={editStudentFields}
        initialValues={{
          studentName: editStudentData?.user?.name ?? '',
          gender: editStudentData?.user?.gender ?? '',
          ageGroup: String(editStudentData?.user?.age ?? ''),
          studentID: editStudentData?.user?.student_id ?? '',
          classAndSection: `${editStudentData?.grade ?? ''}${
            editStudentData?.classSection ?? ''
          }`,
          phone: editStudentData?.parent?.phone ?? '',
        }}
        onClose={() => {
          setIsEditStudentModalOpen(false);
          setEditStudentData(null);
        }}
        onSubmit={handleEditSubmit}
      />
      <CardListModal
        open={isMergeStudentModalOpen}
        schoolId={schoolId}
        classId={mergeModalClassId}
        primaryStudentId={mergePrimaryStudent?.id}
        onClose={() => setIsMergeStudentModalOpen(false)}
        onSubmit={handleMergeStudents}
        isSubmitting={isMergingStudent}
      />

      <Dialog
        open={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '12px',
            padding: 1,
          },
        }}
      >
        {/* Header */}
        <DialogTitle
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontWeight: 600,
            fontSize: '18px',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ErrorOutlineIcon sx={{ color: '#dc2626', fontSize: 20 }} />
            {t('Delete Student?')}
          </Box>

          <IconButton size="small" onClick={() => setIsDeleteModalOpen(false)}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ pt: 0, textAlign: 'left' }}>
          <Typography
            variant="body2"
            sx={{ mb: 2, color: '#4B5563', textAlign: 'left', width: '100%' }}
          >
            {t(
              "You're about to permanently delete {{name}}'s record. This action cannot be undone.",
              { name: deleteTargetStudent?.user?.name ?? '' },
            )}
          </Typography>
          {deleteTargetStudent && (
            <Box
              sx={{
                background: '#F9FAFB',
                borderRadius: '8px',
                padding: '12px',
                display: 'grid',
                gridTemplateColumns: '1fr 1fr 1fr 1fr',
                gap: 1,
                fontSize: 14,
                border: '1px solid #E5E7EB',
              }}
            >
              <Typography>
                {deleteTargetStudent.user.student_id ?? 'N/A'}
              </Typography>
              <Typography>{deleteTargetStudent.user.name}</Typography>
              <Typography>{deleteTargetStudent.user.gender}</Typography>
              <Typography>
                {deleteTargetStudent.parent?.phone ||
                  deleteTargetStudent.parent?.email ||
                  'N/A'}
              </Typography>
            </Box>
          )}

          {/* Warning Box */}
          <Box
            sx={{
              mt: 2,
              background: '#FEE2E2',
              color: '#B91C1C',
              borderRadius: '6px',
              padding: '10px',
              fontSize: '13px',
              border: '1px solid #FECACA',
            }}
          >
            {t('This cannot be reversed. Please be certain.')}
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            variant="outlined"
            onClick={() => setIsDeleteModalOpen(false)}
            sx={{
              textTransform: 'none',
              borderRadius: '6px',
              color: 'black',
              borderColor: '#807c7b5b',
            }}
          >
            {t('Cancel')}
          </Button>

          <Button
            variant="contained"
            color="error"
            onClick={handleConfirmDelete}
            disabled={isDeleting}
            sx={{
              textTransform: 'none',
              borderRadius: '6px',
              fontWeight: 500,
            }}
          >
            {isDeleting ? t('Deleting...') : t('Delete Student')}
          </Button>
        </DialogActions>
      </Dialog>

      {openPopup && studentData && (
        <FcInteractPopUp
          studentData={studentData}
          schoolId={schoolId}
          status={studentStatus}
          onClose={() => setOpenPopup(false)}
          initialUserType={ContactTarget.STUDENT}
        />
      )}

      <Box className="schoolStudents-headerActionsRow">
        <Box className="schoolStudents-titleArea">
          <Typography variant="h5" className="schoolStudents-titleHeading">
            {t(custoomTitle)}
          </Typography>
          {issTotal && (
            <Typography variant="body2" className="schoolStudents-totalText">
              {t('Total')}: {totalCount} {t('students')}
            </Typography>
          )}
        </Box>

        {/* Always show New Student + Search/Filter, even if no students match search/filter */}
        <Box className="schoolStudents-actionsGroup">
          {!isExternalUser && (
            <MuiButton
              variant="outlined"
              onClick={handleAddNewStudent}
              className="schoolStudents-newStudentButton-outlined"
            >
              <AddIcon className="schoolStudents-newStudentButton-outlined-icon" />
              {!isSmallScreen && t('New Student')}
            </MuiButton>
          )}
          <SearchAndFilter
            searchTerm={searchTerm}
            onSearchChange={handleSearchChange}
            filters={filters}
            onFilterClick={handleFilterIconClick}
            onClearFilters={handleClearFilters}
            isFilter={issFilter}
          />
        </Box>
      </Box>

      {/* Keep as-is, but hide when no students overall */}
      {!issTotal && !isNoStudentsState && (
        <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
          {performanceFilters.map((filter) => {
            const isActive = performanceFilter === filter.key;

            let className = 'performance-filter-pill';
            if (isActive) {
              switch (filter.key) {
                case PerformanceLevel.ALL:
                  className = 'performance-filter-pill-active-all';
                  break;
                case PerformanceLevel.DOING_GOOD:
                  className = 'performance-filter-pill-active-doing-good';
                  break;
                case PerformanceLevel.NEED_HELP:
                  className = 'performance-filter-pill-active-need-help';
                  break;
                case PerformanceLevel.STILL_LEARNING:
                  className = 'performance-filter-pill-active-still-learning';
                  break;
                case PerformanceLevel.NOT_TRACKED:
                  className = 'performance-filter-pill-active-not-tracked';
                  break;
              }
            }

            return (
              <Chip
                key={filter.key}
                label={filter.label}
                onClick={() => setPerformanceFilter(filter.key)}
                className={className}
                sx={{
                  fontWeight: isActive ? 600 : 400,
                  height: '26px',
                  cursor: 'pointer',
                }}
              />
            );
          })}
        </Box>
      )}

      {/* Hide filters UI when no students overall */}
      {!hideFilterUI &&
        Object.values(filters).some((arr) => arr.length > 0) && (
          <SelectedFilters
            filters={filters}
            onDeleteFilter={handleDeleteAppliedFilter}
          />
        )}

      {!hideFilterUI && (
        <FilterSlider
          isOpen={isFilterSliderOpen}
          onClose={() => setIsFilterSliderOpen(false)}
          filters={tempFilters}
          filterOptions={{
            // Keeps grade filter options aligned with the current program scope.
            grade: getGradeOptions(programFilteredStudents),
          }}
          onFilterChange={handleSliderFilterChange}
          onApply={handleApplyFilters}
          onCancel={handleCancelFilters}
          filterConfigs={filterConfigsForSchool}
        />
      )}

      {isLoading || isPerformanceLoading ? (
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          minHeight="300px"
        >
          <CircularProgress />
        </Box>
      ) : isDataPresent ? (
        <>
          <div className="schoolStudents-table-container">
            <DataTableBody
              columns={columns}
              rows={studentsForCurrentPage}
              orderBy={orderBy}
              order={order}
              onSort={handleSort}
              onRowClick={() => {}}
            />
          </div>
          {pageCount > 1 && (
            <div className="schoolStudents-footer">
              <DataTablePagination
                page={page}
                pageCount={pageCount}
                onPageChange={handlePageChange}
              />
            </div>
          )}
        </>
      ) : (
        <Box className="schoolStudents-emptyStateContainer">
          <Typography variant="h6" className="schoolStudents-emptyStateTitle">
            {t(custoomTitle)}
          </Typography>
          <Typography className="schoolStudents-emptyStateMessage">
            {performanceFilter !== PerformanceLevel.ALL
              ? t('No student data found for the selected filter')
              : isFilteringOrSearching
                ? t('No students found matching your criteria.')
                : !issTotal &&
                    optionalGrade != null &&
                    String(optionalSection ?? '').trim() !== ''
                  ? t('No students found for your class.')
                  : t('No students data found for the selected school')}
          </Typography>
          {!isFilteringOrSearching &&
            performanceFilter === PerformanceLevel.ALL &&
            !isExternalUser && (
              <MuiButton
                variant="text"
                onClick={handleAddNewStudent}
                className="schoolStudents-emptyStateAddButton"
                startIcon={
                  <AddIcon className="schoolStudents-emptyStateAddButton-icon" />
                }
              >
                {t('Add Student')}
              </MuiButton>
            )}
        </Box>
      )}
    </div>
  );
};

export default SchoolStudents;
