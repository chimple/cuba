import { useEffect, useState } from 'react';
import { ServiceConfig } from '../../../services/ServiceConfig';
import logger from '../../../utility/logger';
import { CampaignReachSummary } from './campaignCommunicationTypes';

const emptyReach: CampaignReachSummary = {
  groupCount: 0,
  memberCount: 0,
};

export const useCampaignReach = (selectedSchoolIds: string[]) => {
  const api = ServiceConfig.getI().apiHandler;
  const [campaignReach, setCampaignReach] =
    useState<CampaignReachSummary>(emptyReach);
  const [loadingReach, setLoadingReach] = useState(false);

  useEffect(() => {
    let mounted = true;

    const loadReach = async () => {
      if (
        selectedSchoolIds.length === 0 ||
        !api.getParentWhatsappClassesBySchoolId ||
        !api.getParentWhatsappParentPhonesByClassId
      ) {
        setCampaignReach(emptyReach);
        return;
      }

      setLoadingReach(true);
      try {
        const schoolClasses = await Promise.all(
          selectedSchoolIds.map((schoolId) =>
            api.getParentWhatsappClassesBySchoolId!(schoolId),
          ),
        );

        const groupedClasses = schoolClasses
          .flat()
          .filter(
            (classRow) =>
              classRow.group_id && String(classRow.group_id).trim() !== '',
          );

        const memberLists = await Promise.all(
          groupedClasses.map(async (classRow) => {
            try {
              const phones = await api.getParentWhatsappParentPhonesByClassId!(
                classRow.id,
              );
              return Array.from(new Set(phones));
            } catch {
              return [];
            }
          }),
        );

        if (!mounted) return;
        setCampaignReach({
          groupCount: groupedClasses.length,
          memberCount: memberLists.reduce(
            (total, members) => total + members.length,
            0,
          ),
        });
      } catch (error) {
        logger.error('Failed to load campaign reach:', error);
      } finally {
        if (mounted) setLoadingReach(false);
      }
    };

    void loadReach();
    return () => {
      mounted = false;
    };
  }, [api, selectedSchoolIds]);

  return {
    campaignReach,
    loadingReach,
  };
};
