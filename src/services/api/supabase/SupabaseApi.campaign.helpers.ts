import {
  PROGRAM_TAB,
  ProgramType,
  TableTypes,
} from '../../../common/constants';
import {
  asRecord,
  getArray,
  normalizePeriskopeMessage,
  providerResult,
  type CampaignProviderData,
  type ProviderChat,
  type ProviderJsonRecord,
  type ProviderJsonValue,
} from '../../../ops-console/components/campaignsOverview/CampaignReports_Messages/CampaignMessageReport.helpers';
import logger from '../../../utility/logger';
import { Database } from '../../database';
import { CampaignListingParams, ProgramListingProgramRow } from '../ServiceApi';
export const PERISKOPE_BASE_URL =
  import.meta.env.VITE_PERISKOPE_API_BASE_URL ?? 'https://api.periskope.app/v1';
export const PROVIDER_PAGE_SIZE = 1999;
export const PROVIDER_CACHE_TTL_MS = 60_000;
export type CampaignWhatsappGroupTarget = {
  botNumber: string;
  groupId: string;
  name: string;
};
export type CampaignProviderCacheEntry = {
  expiresAt: number;
  request: Promise<CampaignProviderData>;
};
export const campaignProviderCache = new Map<
  string,
  CampaignProviderCacheEntry
>();

export const fetchCampaignProviderData = async (
  campaignId: string,
  groupTargets: CampaignWhatsappGroupTarget[],
): Promise<CampaignProviderData> => {
  const label = `campaign_${campaignId}`;
  const cacheKey = `${campaignId}:${groupTargets
    .map(({ botNumber, groupId }) => `${botNumber}:${groupId}`)
    .sort()
    .join(',')}`;
  const now = Date.now();
  const cached = campaignProviderCache.get(cacheKey);
  if (cached && cached.expiresAt > now) return cached.request;

  const request = fetchPeriskopeCampaignData(label, groupTargets);
  campaignProviderCache.set(cacheKey, {
    expiresAt: now + PROVIDER_CACHE_TTL_MS,
    request,
  });
  try {
    const periskopeData = await request;
    if (periskopeData.labelData.providerErrors > 0) {
      campaignProviderCache.delete(cacheKey);
    }
    logger.info('Campaign WhatsApp report loaded from Periskope.', {
      campaignId,
      chatCount: periskopeData.chats.length,
      providerErrors: periskopeData.labelData.providerErrors,
    });
    return periskopeData;
  } catch (error) {
    campaignProviderCache.delete(cacheKey);
    throw error;
  }
};

export const fetchPeriskopeCampaignData = async (
  label: string,
  groupTargets: CampaignWhatsappGroupTarget[],
): Promise<CampaignProviderData> => {
  if (groupTargets.length === 0) return providerResult(label, [], []);
  const apiKey = import.meta.env.VITE_PERISKOPE_API_KEY?.trim();
  if (!apiKey) {
    throw new Error(
      'Missing client provider configuration: VITE_PERISKOPE_API_KEY',
    );
  }
  let providerErrors = 0;
  const chats: ProviderChat[] = groupTargets.map(
    ({ botNumber, groupId, name }) => ({
      botNumber,
      chatId: groupId,
      memberCount: 0,
      name,
      provider: 'periskope',
      providers: ['periskope'],
    }),
  );
  const messages = (
    await Promise.all(
      chats.map(async (chat) => {
        try {
          const url = new URL(
            `${PERISKOPE_BASE_URL}/chats/${encodeURIComponent(chat.chatId)}/messages`,
          );
          url.searchParams.set('offset', '0');
          url.searchParams.set('limit', String(PROVIDER_PAGE_SIZE));
          const payload = await fetchRecord(url.toString(), {
            Authorization: `Bearer ${apiKey}`,
            'x-phone': chat.botNumber,
          });
          return getArray(payload.messages).flatMap((value) =>
            normalizePeriskopeMessage(value, chat),
          );
        } catch (error) {
          providerErrors += 1;
          logger.error('Failed to fetch messages for a campaign group.', error);
          return [];
        }
      }),
    )
  ).flat();
  return providerResult(label, chats, messages, providerErrors);
};

export const fetchRecord = async (
  url: string,
  headers: Record<string, string>,
): Promise<ProviderJsonRecord> => {
  const response = await fetch(url, { headers });
  const text = await response.text();
  const payload: ProviderJsonValue = text ? JSON.parse(text) : {};
  if (!response.ok)
    throw new Error(`Provider request failed: ${response.status}`);
  return asRecord(payload) ?? {};
};

export type CampaignProgramRow = Pick<TableTypes<'program'>, 'id' | 'name'>;

export type ProgramMetricsTableRow = Omit<
  ProgramListingProgramRow,
  'target_student_count' | 'target_teachers_count'
> & {
  program_managers?: string[] | string | null;
  field_coordinators?: string[] | string | null;
  partners?: string[] | string | null;
  district?: string | null;
  block?: string | null;
  cluster?: string | null;
  target_student_count?: number | string | null;
  target_teachers_count?: number | string | null;
  target_teacher_count?: number | string | null;
  program_type?: ProgramType | null;
  program_model?: PROGRAM_TAB | PROGRAM_TAB[] | string | null;
  updated_at?: string | null;
  created_at?: string | null;
  is_deleted?: boolean | null;
};

export type ProgramMetricsDatabase = Database & {
  public: Database['public'] & {
    Tables: Database['public']['Tables'] & {
      program_metrics: {
        Row: ProgramMetricsTableRow;
        Insert: ProgramMetricsTableRow;
        Update: Partial<ProgramMetricsTableRow>;
        Relationships: [];
      };
    };
  };
};

export type CampaignAudienceSchoolLinkRow = Pick<
  TableTypes<'campaign_target_audience_school'>,
  'school_id'
>;

export type CampaignAudienceGradeLinkRow = Pick<
  TableTypes<'campaign_target_audience_grade'>,
  'grade_id'
>;

export type CampaignSavedAudienceGroupRow = Pick<
  TableTypes<'campaign_target_audience'>,
  'id' | 'name' | 'program_id' | 'is_all_schools' | 'is_all_grades'
> & {
  campaign_target_audience_school?: CampaignAudienceSchoolLinkRow[] | null;
  campaign_target_audience_grade?: CampaignAudienceGradeLinkRow[] | null;
};

export type CampaignListingAudienceRow = Pick<
  TableTypes<'campaign_target_audience'>,
  'id' | 'is_all_schools'
> & {
  campaign_target_audience_school?: CampaignAudienceSchoolLinkRow[] | null;
};

export type CampaignAudienceAccessRow = Pick<
  TableTypes<'campaign_target_audience_school'>,
  'target_audience_id'
>;

export type CampaignListingQueryRow = TableTypes<'campaign'> & {
  manager?: TableTypes<'user'> | TableTypes<'user'>[] | null;
  program?: TableTypes<'program'> | TableTypes<'program'>[] | null;
  target_audience?:
    | CampaignListingAudienceRow
    | CampaignListingAudienceRow[]
    | null;
};

export type CampaignAccessSchoolRow = Pick<
  TableTypes<'school_user'>,
  'school_id'
> & {
  school?:
    | Pick<TableTypes<'school'>, 'program_id'>
    | Pick<TableTypes<'school'>, 'program_id'>[]
    | null;
};

export const getSingleRelationValue = <T>(value: T | T[] | null | undefined) =>
  Array.isArray(value) ? (value[0] ?? null) : (value ?? null);

export const CAMPAIGN_LISTING_NATIVE_SORT_COLUMNS: Partial<
  Record<NonNullable<CampaignListingParams['orderBy']>, string>
> = {
  name: 'name',
  startDate: 'start_date',
  endDate: 'end_date',
};

export const CAMPAIGN_REACH_METRIC_WINDOW = '7d';

export const isCampaignListingRelationSort = (
  orderBy: NonNullable<CampaignListingParams['orderBy']>,
) => orderBy === 'manager' || orderBy === 'programName';

export type CampaignSchoolRow = Pick<
  TableTypes<'school'>,
  'id' | 'name' | 'group3'
>;

export type CampaignGradeRow = Pick<
  TableTypes<'grade'>,
  'id' | 'name' | 'sort_index'
>;

export type CampaignClassGradeRow = Pick<
  TableTypes<'class'>,
  'id' | 'grade_id'
> & {
  grade?: CampaignGradeRow | CampaignGradeRow[] | null;
};

export type CampaignClassUserRow = Pick<
  TableTypes<'class_user'>,
  'class_id' | 'user_id'
>;

export type CampaignSchoolCourseGradeRow = {
  course?:
    | {
        grade?: CampaignGradeRow | CampaignGradeRow[] | null;
      }
    | Array<{
        grade?: CampaignGradeRow | CampaignGradeRow[] | null;
      }>
    | null;
};

export type CampaignAssignmentCourseRow = Pick<
  TableTypes<'course'>,
  'id' | 'name' | 'grade_id' | 'sort_index' | 'subject_id'
>;

export type CampaignAssignmentSchoolCourseRow = {
  course?: CampaignAssignmentCourseRow | CampaignAssignmentCourseRow[] | null;
};

export type CampaignAssignmentChapterRow = Pick<
  TableTypes<'chapter'>,
  'id' | 'name' | 'course_id' | 'sort_index'
>;

export type CampaignAssignmentLessonRow = Pick<
  TableTypes<'lesson'>,
  'id' | 'name'
>;

export type CampaignAssignmentChapterLessonRow = Pick<
  TableTypes<'chapter_lesson'>,
  'chapter_id' | 'lesson_id' | 'sort_index'
> & {
  lesson?: CampaignAssignmentLessonRow | CampaignAssignmentLessonRow[] | null;
};

export const firstOrSelf = <T>(value: T | T[] | null | undefined): T | null =>
  Array.isArray(value) ? (value[0] ?? null) : (value ?? null);

export const chunkArray = <T>(items: T[], chunkSize: number): T[][] => {
  const chunks: T[][] = [];
  for (let index = 0; index < items.length; index += chunkSize) {
    chunks.push(items.slice(index, index + chunkSize));
  }
  return chunks;
};

export const DEFAULT_CAMPAIGN_MESSAGING_PAGE_SIZE = 20;
