import { useEffect, useState } from 'react';
import { ServiceConfig } from '../../../services/ServiceConfig';
import type { WhatsappProviderStatusRow } from '../../../services/api/serviceapi/ServiceApi.whatsapp';

type WhatsappProviderStatusState = {
  loading: boolean;
  statuses: WhatsappProviderStatusRow[];
};

export const useWhatsappProviderStatus = (
  hasModuleAccess: boolean,
): WhatsappProviderStatusState => {
  const [loading, setLoading] = useState(true);
  const [statuses, setStatuses] = useState<WhatsappProviderStatusRow[]>([]);

  useEffect(() => {
    if (!hasModuleAccess) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    const loadProviderStatus = async () => {
      try {
        const response =
          await ServiceConfig.getI().apiHandler.getWhatsappProviderStatus();
        if (!cancelled) setStatuses(response);
      } catch {
        if (!cancelled) setStatuses([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void loadProviderStatus();
    return () => {
      cancelled = true;
    };
  }, [hasModuleAccess]);

  return { loading, statuses };
};
