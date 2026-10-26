import { Directory, Encoding, Filesystem } from '@capacitor/filesystem';
import { Preferences } from '@capacitor/preferences';
import type {
  PrincipalInfo,
  StudentInfo,
  TableTypes,
  TeacherInfo,
} from '../../common/constants';
import type { SchoolNote } from '../../interface/modelInterfaces';
import {
  fetchFcQuestionsForOffline,
  type FcOfflineQuestion,
} from './fcSchoolQuestionCache';
import { cacheLocalSvgAsset } from '../../utility/imageCache';
import type {
  ClassMetricsForClassListingRow,
  OpsStudentPerformanceBandRow,
  ServiceApi,
} from '../api/ServiceApi';
import logger from '../../utility/logger';

const CACHE_INDEX_KEY = 'fc_school_offline_cache_index';
const CACHE_DIR = 'fc-school-cache';
const BUNDLE_FILE = 'bundle.json';
const TWO_DAYS_MS = 2 * 24 * 60 * 60 * 1000;
const PAGE_LIMIT = 200;
const INTERACT_ICON_PATH = '/assets/icons/Interact.svg';

type PagedResponse<T> = {
  data?: T[];
  total?: number;
};

type CacheStatus = 'cached' | 'downloading' | 'failed';

export type FcSchoolOfflineOverview = {
  schoolData?: Record<string, unknown>;
};

export type FcSchoolOfflineCacheEntry = {
  schoolId: string;
  cachedAt: string;
  expiresAt: string;
  overview?: FcSchoolOfflineOverview;
  classes?: TableTypes<'class'>[] | unknown[];
  studentsByClassId?: Record<string, StudentInfo[]>;
  teachers?: TeacherInfo[];
  principals?: PrincipalInfo[];
  notes?: SchoolNote[];
  questionsByKey?: Record<string, FcOfflineQuestion[]>;
  teacherAssignmentCounts?: Record<string, number | null>;
  studentPerformanceBands?: OpsStudentPerformanceBandRow[];
  classMetricsByDateRange?: Record<string, ClassMetricsForClassListingRow[]>;
};

type FcSchoolOfflineCacheIndexEntry = {
  schoolId: string;
  schoolName?: string;
  cachedAt: string;
  expiresAt: string;
  status: CacheStatus;
  lastError?: string | null;
};

const sanitizePathSegment = (value: string) =>
  String(value || 'unknown').replace(/[^a-zA-Z0-9._-]/g, '_');

const cacheDir = (schoolId: string) =>
  `${CACHE_DIR}/${sanitizePathSegment(schoolId)}`;

const cachePath = (schoolId: string) => `${cacheDir(schoolId)}/${BUNDLE_FILE}`;

const isExpired = (entry: Pick<FcSchoolOfflineCacheEntry, 'expiresAt'>) =>
  new Date(entry.expiresAt).getTime() <= Date.now();

const nextCacheWindow = () => {
  const cachedAtMs = Date.now();
  return {
    cachedAt: new Date(cachedAtMs).toISOString(),
    expiresAt: new Date(cachedAtMs + TWO_DAYS_MS).toISOString(),
  };
};

const readJsonPreference = async <T>(key: string, fallback: T): Promise<T> => {
  const { value } = (await Preferences.get({ key })) ?? {};
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
};

const writeJsonPreference = async <T>(key: string, value: T) =>
  Preferences.set({ key, value: JSON.stringify(value) });

const readCacheIndex = async (): Promise<
  Record<string, FcSchoolOfflineCacheIndexEntry>
> =>
  readJsonPreference<Record<string, FcSchoolOfflineCacheIndexEntry>>(
    CACHE_INDEX_KEY,
    {},
  );

const writeCacheIndex = async (
  index: Record<string, FcSchoolOfflineCacheIndexEntry>,
) => writeJsonPreference(CACHE_INDEX_KEY, index);

const ensureCacheDir = async (schoolId: string) => {
  try {
    await Filesystem.mkdir({
      path: cacheDir(schoolId),
      directory: Directory.Data,
      recursive: true,
    });
  } catch {}
};

const readCacheFile = async (
  schoolId: string,
): Promise<FcSchoolOfflineCacheEntry | null> => {
  try {
    const result = await Filesystem.readFile({
      path: cachePath(schoolId),
      directory: Directory.Data,
      encoding: Encoding.UTF8,
    });
    return JSON.parse(String(result.data ?? '')) as FcSchoolOfflineCacheEntry;
  } catch {
    return null;
  }
};

const writeCacheFile = async (
  schoolId: string,
  entry: FcSchoolOfflineCacheEntry,
) => {
  await ensureCacheDir(schoolId);
  await Filesystem.writeFile({
    path: cachePath(schoolId),
    directory: Directory.Data,
    encoding: Encoding.UTF8,
    data: JSON.stringify(entry),
    recursive: true,
  });
};

const removeCacheFile = async (schoolId: string) => {
  try {
    await Filesystem.rmdir({
      path: cacheDir(schoolId),
      directory: Directory.Data,
      recursive: true,
    });
  } catch {
    try {
      await Filesystem.deleteFile({
        path: cachePath(schoolId),
        directory: Directory.Data,
      });
    } catch {}
  }
};

const updateCacheIndexEntry = async (
  schoolId: string,
  patch: Partial<FcSchoolOfflineCacheIndexEntry>,
) => {
  const index = await readCacheIndex();
  const current = index[schoolId];
  index[schoolId] = {
    schoolId,
    cachedAt: patch.cachedAt ?? current?.cachedAt ?? new Date().toISOString(),
    expiresAt:
      patch.expiresAt ?? current?.expiresAt ?? new Date().toISOString(),
    status: patch.status ?? current?.status ?? 'cached',
    schoolName: patch.schoolName ?? current?.schoolName,
    lastError: patch.lastError ?? current?.lastError ?? null,
  };
  await writeCacheIndex(index);
};

const createOfflineSchoolSummary = (
  value: unknown,
  schoolId: string,
): Record<string, unknown> => {
  const school =
    typeof value === 'object' && value !== null
      ? (value as Record<string, unknown>)
      : {};

  return {
    id: school.id ?? schoolId,
    name: school.name,
    school_name: school.school_name,
    udise: school.udise,
    udise_code: school.udise_code,
    state: school.state,
    district: school.district,
    block: school.block,
    cluster: school.cluster,
    group1: school.group1,
    group2: school.group2,
    group3: school.group3,
    group4: school.group4,
    model: school.model,
    school_performance: school.school_performance,
    onboarded_students: school.onboarded_students,
    activated_students: school.activated_students,
    active_students: school.active_students,
    avg_time_spent: school.avg_time_spent,
    active_teachers: school.active_teachers,
    activated_teachers: school.activated_teachers,
    total_teachers: school.total_teachers,
    activities_assigned: school.activities_assigned,
    avg_assignments_completed: school.avg_assignments_completed,
    avg_activities_completed: school.avg_activities_completed,
    phone_calls_students_parents: school.phone_calls_students_parents,
    inperson_students_parents: school.inperson_students_parents,
    phone_calls_teachers_hms: school.phone_calls_teachers_hms,
    community_visits: school.community_visits,
    school_visits: school.school_visits,
    parents_on_whatsapp: school.parents_on_whatsapp,
    parents_in_whatsapp_group: school.parents_in_whatsapp_group,
    parents_reached: school.parents_reached,
  };
};

const readAllPages = async <T>(
  fetchPage: (page: number, limit: number) => Promise<PagedResponse<T>>,
): Promise<{ data: T[]; total: number }> => {
  const firstPage = await fetchPage(1, PAGE_LIMIT);
  const allRows = [...(firstPage.data ?? [])];
  const total = Math.max(firstPage.total ?? 0, allRows.length);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_LIMIT));

  for (let page = 2; page <= totalPages; page += 1) {
    const response = await fetchPage(page, PAGE_LIMIT);
    allRows.push(...(response.data ?? []));
  }

  return { data: allRows, total };
};

const readAllNotes = async (
  api: ServiceApi,
  schoolId: string,
): Promise<{ data: SchoolNote[]; total: number }> => {
  if (!api.getNotesBySchoolId) return { data: [], total: 0 };

  const firstPage = await api.getNotesBySchoolId(
    schoolId,
    PAGE_LIMIT,
    0,
    'createdAt',
  );
  const allRows = [...(firstPage.data ?? [])] as SchoolNote[];
  const total = Math.max(firstPage.totalCount ?? 0, allRows.length);

  for (let offset = PAGE_LIMIT; offset < total; offset += PAGE_LIMIT) {
    const response = await api.getNotesBySchoolId(
      schoolId,
      PAGE_LIMIT,
      offset,
      'createdAt',
    );
    allRows.push(...((response.data ?? []) as SchoolNote[]));
  }

  return { data: allRows, total };
};

const fetchStudentsByClass = async (
  api: ServiceApi,
  schoolId: string,
  classes: unknown[],
): Promise<Record<string, StudentInfo[]>> => {
  const entries = await Promise.all(
    classes.map(async (classRow) => {
      const classId = String((classRow as { id?: unknown })?.id ?? '').trim();
      if (!classId) return null;

      const response = await readAllPages<StudentInfo>((page, limit) =>
        api.getStudentInfoBySchoolId(schoolId, page, limit, classId),
      );
      return [classId, response.data] as const;
    }),
  );

  return Object.fromEntries(
    entries.filter(Boolean) as [string, StudentInfo[]][],
  );
};

const fetchTeacherAssignmentCounts = async (
  api: ServiceApi,
  teachers: TeacherInfo[],
): Promise<Record<string, number | null>> => {
  const pairs = teachers.flatMap((teacher) => {
    const teacherId = teacher.user?.id;
    const classId = teacher.classWithidname?.id;
    return teacherId && classId ? [{ teacherId, classId }] : [];
  });

  if (pairs.length === 0) return {};

  try {
    return await api.getRecentAssignmentCountsByTeachers(pairs);
  } catch (error) {
    logger.error('Failed to cache teacher assignment counts', { error });
    return {};
  }
};

export const removeFcSchoolOfflineCache = async (schoolId: string) => {
  await removeCacheFile(schoolId);
  const index = await readCacheIndex();
  delete index[schoolId];
  await writeCacheIndex(index);
};

export const cleanupExpiredFcSchoolOfflineCaches = async () => {
  const index = await readCacheIndex();
  const nextIndex: Record<string, FcSchoolOfflineCacheIndexEntry> = {};

  for (const [schoolId, meta] of Object.entries(index)) {
    if (isExpired(meta)) {
      await removeCacheFile(schoolId);
      continue;
    }
    nextIndex[schoolId] = meta;
  }

  await writeCacheIndex(nextIndex);
};

export const readFcSchoolOfflineCache = async (
  schoolId: string,
): Promise<FcSchoolOfflineCacheEntry | null> => {
  const index = await readCacheIndex();
  const meta = index[schoolId];
  if (meta && isExpired(meta)) {
    await removeFcSchoolOfflineCache(schoolId);
    return null;
  }

  const entry = await readCacheFile(schoolId);
  if (!entry) return null;
  if (isExpired(entry)) {
    await removeFcSchoolOfflineCache(schoolId);
    return null;
  }
  return entry;
};

export const readAllFcSchoolOfflineCaches = async (): Promise<
  FcSchoolOfflineCacheEntry[]
> => {
  const index = await readCacheIndex();
  const entries = await Promise.all(
    Object.values(index)
      .filter((meta) => !isExpired(meta) && meta.status === 'cached')
      .map((meta) => readFcSchoolOfflineCache(meta.schoolId)),
  );

  return entries.filter(
    (entry): entry is FcSchoolOfflineCacheEntry => entry !== null,
  );
};

export const writeFcSchoolOfflineCache = async (
  schoolId: string,
  patch: Partial<FcSchoolOfflineCacheEntry>,
) => {
  const current = await readFcSchoolOfflineCache(schoolId);
  const window = nextCacheWindow();
  const next: FcSchoolOfflineCacheEntry = {
    ...current,
    ...patch,
    schoolId,
    cachedAt: patch.cachedAt ?? current?.cachedAt ?? window.cachedAt,
    expiresAt: patch.expiresAt ?? current?.expiresAt ?? window.expiresAt,
    overview: {
      ...(current?.overview ?? {}),
      ...(patch.overview ?? {}),
    },
    studentsByClassId: {
      ...(current?.studentsByClassId ?? {}),
      ...(patch.studentsByClassId ?? {}),
    },
    questionsByKey: {
      ...(current?.questionsByKey ?? {}),
      ...(patch.questionsByKey ?? {}),
    },
    teacherAssignmentCounts: {
      ...(current?.teacherAssignmentCounts ?? {}),
      ...(patch.teacherAssignmentCounts ?? {}),
    },
    classMetricsByDateRange: {
      ...(current?.classMetricsByDateRange ?? {}),
      ...(patch.classMetricsByDateRange ?? {}),
    },
  };

  await writeCacheFile(schoolId, next);
  await updateCacheIndexEntry(schoolId, {
    schoolId,
    cachedAt: next.cachedAt,
    expiresAt: next.expiresAt,
    status: 'cached',
    schoolName:
      (next.overview?.schoolData as { name?: string } | undefined)?.name ??
      undefined,
    lastError: null,
  });
  return next;
};

export const writeFcSchoolClassesCache = async (
  schoolId: string,
  classes: unknown[],
) => writeFcSchoolOfflineCache(schoolId, { classes });

export const readFcClassMetricsCache = async (
  schoolId: string,
  dateRange: string,
): Promise<ClassMetricsForClassListingRow[] | null> => {
  const entry = await readFcSchoolOfflineCache(schoolId);
  return entry?.classMetricsByDateRange?.[dateRange] ?? null;
};

export const writeFcClassMetricsCache = async (
  schoolId: string,
  dateRange: string,
  rows: ClassMetricsForClassListingRow[],
) =>
  writeFcSchoolOfflineCache(schoolId, {
    classMetricsByDateRange: { [dateRange]: rows },
  });

export const cacheFcSchoolForOffline = async ({
  api,
  schoolId,
  isExternalUser,
  dateRange,
  schoolSummary,
}: {
  api: ServiceApi;
  schoolId: string;
  isExternalUser: boolean;
  dateRange: string;
  schoolSummary?: unknown;
}) => {
  const window = nextCacheWindow();
  await updateCacheIndexEntry(schoolId, {
    ...window,
    status: 'downloading',
    lastError: null,
  });

  try {
    await cacheLocalSvgAsset(INTERACT_ICON_PATH);
    const [
      schoolSettled,
      principalsSettled,
      classesSettled,
      classMetricsSettled,
    ] = await Promise.allSettled([
      api.getSchoolById(schoolId),
      isExternalUser
        ? Promise.resolve({ data: [], total: 0 })
        : readAllPages<PrincipalInfo>((page, limit) =>
            api.getPrincipalsForSchoolPaginated(schoolId, page, limit),
          ),
      api.getClassesBySchoolId(schoolId),
      api.getClassMetricsForClassListing({
        schoolId,
        date_range: dateRange,
      }),
    ]);

    const principals =
      principalsSettled.status === 'fulfilled'
        ? (principalsSettled.value as PagedResponse<PrincipalInfo>)
        : { data: [], total: 0 };
    const classes =
      classesSettled.status === 'fulfilled' &&
      Array.isArray(classesSettled.value)
        ? classesSettled.value
        : [];
    const classMetrics =
      classMetricsSettled.status === 'fulfilled' &&
      Array.isArray(classMetricsSettled.value)
        ? classMetricsSettled.value
        : [];

    const [studentsByClassId, teachersResponse, questionsByKey, notesResponse] =
      await Promise.all([
        fetchStudentsByClass(api, schoolId, classes),
        readAllPages<TeacherInfo>((page, limit) =>
          api.getTeacherInfoBySchoolId(schoolId, page, limit),
        ),
        fetchFcQuestionsForOffline(api),
        readAllNotes(api, schoolId),
      ]);
    const teacherAssignmentCounts = await fetchTeacherAssignmentCounts(
      api,
      teachersResponse.data,
    );

    const allStudents = Object.values(studentsByClassId).flat();
    const studentIds = Array.from(
      new Set(
        allStudents
          .map((student) => student.user?.id)
          .filter((id): id is string => Boolean(id)),
      ),
    );
    const classIds = Array.from(
      new Set(
        classes
          .map((classRow) => String((classRow as { id?: unknown })?.id ?? ''))
          .filter(Boolean),
      ),
    );
    const studentPerformanceBands =
      api.getOpsStudentPerformanceBands && studentIds.length > 0
        ? await api.getOpsStudentPerformanceBands({ classIds, studentIds })
        : [];

    const schoolDetails =
      schoolSettled.status === 'fulfilled' &&
      typeof schoolSettled.value === 'object' &&
      schoolSettled.value !== null
        ? schoolSettled.value
        : {};
    const listSummary =
      typeof schoolSummary === 'object' && schoolSummary !== null
        ? schoolSummary
        : {};

    await removeCacheFile(schoolId);
    return writeFcSchoolOfflineCache(schoolId, {
      ...window,
      overview: {
        schoolData: createOfflineSchoolSummary(
          { ...schoolDetails, ...listSummary },
          schoolId,
        ),
      },
      classes,
      studentsByClassId,
      teachers: teachersResponse.data,
      principals: principals.data ?? [],
      notes: notesResponse.data,
      questionsByKey,
      teacherAssignmentCounts,
      studentPerformanceBands,
      classMetricsByDateRange: {
        [dateRange]: classMetrics,
      },
    });
  } catch (error) {
    await updateCacheIndexEntry(schoolId, {
      ...window,
      status: 'failed',
      lastError: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
};
