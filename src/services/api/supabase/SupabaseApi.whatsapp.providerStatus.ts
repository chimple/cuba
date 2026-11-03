import type { WhatsappProviderStatusRow } from '../serviceapi/ServiceApi.whatsapp';

type InvokeFunction = (body: { provider_only: true }) => Promise<{
  data: { success?: boolean; statuses?: WhatsappProviderStatusRow[] } | null;
  error: unknown;
}>;

type SupabaseClientLike = {
  functions: {
    invoke: (
      functionName: string,
      options?: { body?: { provider_only: true } },
    ) => Promise<{
      data: {
        success?: boolean;
        statuses?: WhatsappProviderStatusRow[];
      } | null;
      error: unknown;
    }>;
  };
};

export const checkWhatsappProviderStatus = async (
  invoke: InvokeFunction,
): Promise<WhatsappProviderStatusRow[]> => {
  const { data, error } = await invoke({ provider_only: true });
  if (error) throw error;
  if (!data?.success || !Array.isArray(data.statuses)) {
    throw new Error('Failed to fetch WhatsApp provider status.');
  }
  return data.statuses;
};

export const fetchWhatsappProviderStatus = async (
  supabase: SupabaseClientLike | null | undefined,
): Promise<WhatsappProviderStatusRow[]> => {
  if (!supabase) {
    throw new Error('Supabase client is not initialized.');
  }
  return checkWhatsappProviderStatus((body) =>
    supabase.functions.invoke('get-whatsapp-integration-status', { body }),
  );
};
