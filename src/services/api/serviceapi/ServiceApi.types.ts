import {
  CAMPAIGN_OBJECTIVE,
  CampaignListingStatus,
  TableTypes,
} from '../../../common/constants';
import { Database, Json } from '../../database';

export interface LeaderboardInfo {
  weekly: StudentLeaderboardInfo[];
  monthly: StudentLeaderboardInfo[];
  allTime: StudentLeaderboardInfo[];
}

export interface StudentLeaderboardInfo {
  name: string;
  score: number;
  timeSpent: number;
  lessonsPlayed: number;
  userId: string;
}

export type AssignmentCartData = {
  lessons: string | null;
  created_at: string;
  updated_at: string;
};

export type SchoolProgramAccessFilters = {
  program?: string[];
  programType?: string[];
  state?: string[];
  district?: string[];
  block?: string[];
  cluster?: string[];
};

export type GetSchoolsWithProgramAccessParams = {
  academicYears: string[];
  filters?: SchoolProgramAccessFilters;
  page?: number;
  pageSize?: number;
  orderBy?: string;
  orderDir?: 'asc' | 'desc';
  search?: string;
  includeMigratedCounts?: boolean;
};

export type SchoolProgramAccessRow = {
  [key: string]: any;
  school: Record<string, any>;
  program: Record<string, any>;
  program_users: Record<string, any>[];
};

export type SchoolProgramAccessResponse = {
  data: SchoolProgramAccessRow[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
};

export type ClassMetricsForClassListingRow = {
  class_id: string;
  class_name?: string | null;
  class_code?: number | null;
  onboarded_students?: number | null;
  activated_students?: number | null;
  active_students?: number | null;
  avg_time_spent?: number | null;
  active_teachers?: number | null;
  total_teachers?: number | null;
  activities_assigned?: number | null;
  avg_assignments_completed?: number | null;
  avg_activities_completed?: number | null;
};

export type ProgramListingProgramRow = {
  id?: string;
  program_id?: string | null;
  program_name?: string | null;
  state?: string | null;
  metric_window?: string | null;
  total_schools?: number | null;
  performing_well?: number | null;
  needs_attention?: number | null;
  needs_support?: number | null;
  onboarded_students?: number | null;
  target_student_count?: number | null;
  onboarded_students_pct?: number | null;
  activated_students?: number | null;
  activated_students_pct?: number | null;
  active_students?: number | null;
  active_students_pct?: number | null;
  avg_time_spent?: number | null;
  onboarded_teachers?: number | null;
  target_teachers_count?: number | null;
  onboarded_teachers_pct?: number | null;
  activated_teachers?: number | null;
  activated_teachers_pct?: number | null;
  active_teachers?: number | null;
  active_teachers_pct?: number | null;
};

export type OpsStudentPerformanceBandsParams = {
  classIds?: string[];
  studentIds?: string[];
};

export type OpsStudentPerformanceBandRow = {
  student_id: string;
  class_id: string | null;
  performance?: string | null;
};

export type AssignmentBatchGroupRow = {
  batchId: string | null;
  assignmentCount: number;
  latestCreatedAt?: string | null;
};

export type AssignmentDateRangeData = {
  assignments: TableTypes<'assignment'>[];
  batchGroups: AssignmentBatchGroupRow[];
};

export type JoinClassInviteLookupResult = {
  inviteData: any;
  classData?: TableTypes<'class'>;
  schoolData?: TableTypes<'school'>;
};

export type CampaignMessagingRow = TableTypes<'campaign_messaging'>;

export type CampaignMessagingQueryParams = {
  page?: number;
  pageSize?: number;
};

export type CampaignMessagingResponse = {
  data: CampaignMessagingRow[];
  total: number;
  page: number;
  pageSize: number;
};

export type UpdateCampaignMessagingRowPayload = {
  campaignId: string;
  id?: string;
  message: string;
  mediaLink: string;
  messageTime: string | null;
  pollTime: string | null;
  pollQuestion: string;
  pollOptions: string[];
  messageStatus?: string | null;
  pollStatus?: string | null;
};

export type OpsRequestsResponse = {
  data: Array<TableTypes<'ops_requests'> | Record<string, Json>>;
  total: number;
  totalPages: number;
  page: number;
  limit: number;
};

export type RequestFilterSchool = {
  id: string;
  name: string;
};

export type RequestFilterOptions = {
  requestType: Array<string | null>;
  school: RequestFilterSchool[];
};

export type FcUserFormSaveResult = {
  data: TableTypes<'fc_user_forms'> | null;
  error: object | null;
};

export type ActivitiesFilterOptions = {
  contactType: Array<string | null>;
  performance: Array<string | null>;
};

export type CampaignObjective =
  (typeof CAMPAIGN_OBJECTIVE)[keyof typeof CAMPAIGN_OBJECTIVE];

export type CampaignTargetType = 'percentage_completion' | 'number_of_lessons';

export type CampaignRewardType = 'digital_rewards' | 'physical_rewards';

export type CampaignFrequency = 'daily' | 'alternate_days' | 'alternate_week';

export type CampaignOption = {
  id: string;
  name: string;
};

export type CampaignSchoolOption = CampaignOption & {
  block: string;
};

export type CampaignSavedAudienceGroup = {
  id: string;
  name: string;
  programId: string;
  isAllSchools: boolean;
  isAllGrades: boolean;
  schoolIds: string[];
  gradeIds: string[];
};

export type CampaignSetupOptions = {
  programs: CampaignOption[];
  managers: CampaignOption[];
  savedGroups: CampaignSavedAudienceGroup[];
};

export type CampaignAudienceOptions = {
  blocks: string[];
  schools: CampaignSchoolOption[];
  grades: CampaignOption[];
};

export type CampaignAudienceSummaryParams = {
  schoolIds: string[];
  gradeIds: string[];
};

export type CampaignAudienceSummaryGrade = {
  gradeId: string;
  gradeName: string;
  studentCount: number;
};

export type CampaignAudienceSummary = {
  totalStudents: number;
  grades: CampaignAudienceSummaryGrade[];
};

export type CampaignAudiencePayload = {
  programId: string;
  schoolIds: string[];
  gradeIds: string[];
  isAllSchools: boolean;
  isAllGrades: boolean;
  isSaved: boolean;
  name?: string;
};

export type CreateCampaignSetupPayload = CampaignAudiencePayload & {
  campaignName: string;
  frequency: CampaignFrequency;
  objective: CampaignObjective;
  targetType?: CampaignTargetType;
  targetValue?: number;
  managerId: string;
  startDate: string;
  endDate: string;
  rewards?: CampaignRewardsPayload;
  savedAudienceGroupId?: string;
};

export type CreateCampaignSetupResult = {
  campaignId: string;
  targetAudienceId: string;
};

export type CampaignRewardRulePayload = {
  rank: 1 | 2 | 3;
  min: number;
  reward: string;
};

export type CampaignRewardsPayload = {
  type: CampaignRewardType;
  rules: CampaignRewardRulePayload[];
};

export type CampaignLaunchAssignmentPayload = {
  gradeId: string;
  schoolIds: string[];
  courseId: string;
  chapterId: string;
  lessonId: string;
  startsAt: string;
  endsAt: string | null;
  type: 'homework';
  source: 'campaign';
  setNumber: number;
};

export type CampaignMessagingPollPayload = {
  question: string;
  options: string[];
};

export type CampaignLaunchMessagingPayload = {
  messageTime: string | null;
  pollTime: string | null;
  message: string | null;
  mediaLink: string | null;
  poll: CampaignMessagingPollPayload | null;
};

export type CampaignLaunchDetailsPayload = {
  programId: string;
  campaignName: string;
  objective: CampaignObjective;
  targetType?: CampaignTargetType;
  targetValue?: number;
  managerId: string;
  startDate: string;
  endDate: string;
};

export type LaunchCampaignPayload = {
  campaignId: string;
  currentUserId: string;
  objective: CampaignObjective;
  rewards: CampaignRewardsPayload;
  assignments: CampaignLaunchAssignmentPayload[];
  messagingRows: CampaignLaunchMessagingPayload[];
};

export type CampaignAssignmentLessonOption = {
  id: string;
  name: string;
};

export type CampaignAssignmentChapterOption = {
  id: string;
  name: string;
  lessons: CampaignAssignmentLessonOption[];
};

export type CampaignAssignmentSubjectOption = {
  id: string;
  name: string;
  gradeId: string;
  chapters: CampaignAssignmentChapterOption[];
};

export type CampaignAssignmentGradeOption = {
  gradeId: string;
  subjects: CampaignAssignmentSubjectOption[];
};

export type CampaignAssignmentOptionsParams = {
  programId: string;
  schoolIds: string[];
  gradeIds: string[];
};

export type CampaignAssignmentOptions = {
  grades: CampaignAssignmentGradeOption[];
};

export type CampaignListingItem = {
  campaignId: string;
  campaign: TableTypes<'campaign'> & {
    manager?: TableTypes<'user'> | TableTypes<'user'>[] | null;
    program?: TableTypes<'program'> | TableTypes<'program'>[] | null;
  };
  dashboardMetrics:
    | Database['public']['Functions']['get_campaign_dashboard_metrics']['Returns'][number]
    | null;
  avgWeeklyActiveUsers: number | null;
  avgWeeklyEngagementTimeMinutes: number | null;
  status: CampaignListingStatus;
};

export type CampaignDashboardMetric =
  Database['public']['Functions']['get_campaign_dashboard_metrics']['Returns'][number];

export type CampaignCancellationDetails = {
  canceledBy: string | null;
  canceledOn: string | null;
  messageToAdmin: string | null;
};

export type CampaignListingParams = {
  page?: number;
  pageSize?: number;
  searchTerm?: string;
  orderBy?:
    | 'name'
    | 'manager'
    | 'programName'
    | 'avgWeeklyActiveUsers'
    | 'avgWeeklyEngagementTimeMinutes'
    | 'startDate'
    | 'endDate';
  orderDir?: 'asc' | 'desc';
  includeMetrics?: boolean;
};
export type CampaignAssignmentFilters = {
  page: number;
  pageSize: number;
  gradeIds?: string[];
  subjectIds?: string[];
};

export type CampaignAssignmentSummaryRow = {
  assignmentId: string;
  assignmentDate: string;
  gradeId: string;
  gradeName: string;
  subjectId: string;
  subjectName: string;
  lessonId: string;
  lessonName: string;
};

export type CampaignAssignmentUniqueSubject = CampaignOption & {
  gradeIds: string[];
};

export type CampaignAssignmentsResponse = {
  assignments: CampaignAssignmentSummaryRow[];
  uniqueSubjects: CampaignAssignmentUniqueSubject[];
  total: number;
};

export type CampaignAssignmentsReportParams = {
  totalStudents?: number;
};

export type CampaignAssignmentsReportRow = {
  subjectId: string;
  subjectName: string;
  lessonsAssigned: number;
  completionPercent: number;
};

export type CampaignAssignmentsReportResponse = {
  summary: {
    totalAssignments: number;
    assignedStudents: number;
    activeStudents: number;
    averageAssignmentsCompletion: number;
  };
  rows: CampaignAssignmentsReportRow[];
};

export type CampaignStudentPerformanceRow =
  TableTypes<'campaign_student_performance'>;

export type CampaignRewardsReportSortKey =
  | 'studentName'
  | 'school'
  | 'className'
  | 'completionPercent'
  | 'rewardRank'
  | 'rewardLabel';

export type CampaignRewardsReportParams = {
  schoolName?: string;
  className?: string;
  orderBy?: CampaignRewardsReportSortKey;
  order?: 'asc' | 'desc';
};

export type CampaignRewardsReportResponse = {
  rows: CampaignStudentPerformanceRow[];
  total: number;
};

export type CampaignWhatsappLabelChat = {
  chatId: string;
  name: string;
  memberCount: number;
  providers: Array<'periskope' | 'maytapi'>;
};

export type CampaignWhatsappLabelData = {
  chats: CampaignWhatsappLabelChat[];
  total: number;
  label: string;
  providerErrors: number;
};

export type CampaignMessageReportSortKey =
  | 'date'
  | 'messageType'
  | 'messagesSent'
  | 'delivered'
  | 'read'
  | 'deliveryRate'
  | 'readRate'
  | 'pollParticipationRate';

export type CampaignMessageReportParams = {
  exportAll?: boolean;
  fromDate?: string;
  toDate?: string;
  page?: number;
  pageSize?: number;
  sortBy?: CampaignMessageReportSortKey;
  sortOrder?: 'asc' | 'desc';
};

export type CampaignMessageReportSummary = {
  whatsappGroups: number;
  totalMembersReachable: number;
  messagesSent: number;
  deliveredMessages: number;
  readMessages: number;
  deliveredPollMessages: number;
  pollResponses: number;
  deliveryRate: number;
  readRate: number;
  pollParticipationRate: number;
};

export type CampaignMessageReportRow = {
  id: string;
  date: string;
  messageType: 'daily_message' | 'poll';
  messagesSent: number;
  delivered: number;
  read: number;
  pollResponses: number;
  deliveryRate: number;
  readRate: number;
  pollParticipationRate: number | null;
};

export type CampaignMessageReportResponse = {
  summary: CampaignMessageReportSummary;
  rows: CampaignMessageReportRow[];
  pagination: {
    page: number;
    pageSize: number;
    totalRows: number;
    totalPages: number;
  };
  filters: { fromDate: string | null; toDate: string | null };
};
