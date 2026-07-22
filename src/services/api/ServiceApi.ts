import type { ServiceApiUserProfiles } from './serviceapi/ServiceApi.profiles';
import type { ServiceApiUserSettings } from './serviceapi/ServiceApi.settings';
import type { ServiceApiSchoolManagement } from './serviceapi/ServiceApi.schoolManagement';
import type { ServiceApiContentCatalog } from './serviceapi/ServiceApi.contentCatalog';
import type { ServiceApiStudentProgress } from './serviceapi/ServiceApi.studentProgress';
import type { ServiceApiClassroom } from './serviceapi/ServiceApi.classroom';
import type { ServiceApiLiveQuiz } from './serviceapi/ServiceApi.liveQuiz';
import type { ServiceApiRewards } from './serviceapi/ServiceApi.rewards';
import type { ServiceApiAssignments } from './serviceapi/ServiceApi.assignments';
import type { ServiceApiSchoolOperations } from './serviceapi/ServiceApi.schoolOperations';
import type { ServiceApiPrograms } from './serviceapi/ServiceApi.programs';
import type { ServiceApiCampaigns } from './serviceapi/ServiceApi.campaigns';
import type { ServiceApiOpsUsers } from './serviceapi/ServiceApi.opsUsers';
import type { ServiceApiFieldActivities } from './serviceapi/ServiceApi.fieldActivities';
import type { ServiceApiWhatsApp } from './serviceapi/ServiceApi.whatsapp';
import type { ServiceApiStickerBooks } from './serviceapi/ServiceApi.stickerBooks';

export * from './serviceapi/ServiceApi.types';

export interface ServiceApi
  extends
    ServiceApiUserProfiles,
    ServiceApiUserSettings,
    ServiceApiSchoolManagement,
    ServiceApiContentCatalog,
    ServiceApiStudentProgress,
    ServiceApiClassroom,
    ServiceApiLiveQuiz,
    ServiceApiRewards,
    ServiceApiAssignments,
    ServiceApiSchoolOperations,
    ServiceApiPrograms,
    ServiceApiCampaigns,
    ServiceApiOpsUsers,
    ServiceApiFieldActivities,
    ServiceApiWhatsApp,
    ServiceApiStickerBooks {}
