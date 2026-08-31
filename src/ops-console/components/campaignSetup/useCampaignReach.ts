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
        !api.getCampaignParentsInGroupBySchoolIds
      ) {
        setCampaignReach(emptyReach);
        return;
      }

      setLoadingReach(true);
      try {
        const schoolClasses =
          await api.getParentWhatsappClassesBySchoolId(selectedSchoolIds);

        const groupedClasses = schoolClasses.filter(
          (classRow) =>
            classRow.group_id && String(classRow.group_id).trim() !== '',
        );

        const memberCount =
          await api.getCampaignParentsInGroupBySchoolIds(selectedSchoolIds);

        if (!mounted) return;
        setCampaignReach({
          groupCount: groupedClasses.length,
          memberCount,
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
