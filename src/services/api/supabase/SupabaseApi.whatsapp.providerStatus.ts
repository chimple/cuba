import type { WhatsappProviderStatusRow } from '../serviceapi/ServiceApi.whatsapp';

const getEnv = (key: keyof ImportMetaEnv): string =>
  import.meta.env[key]?.trim() ?? '';

const getPeriskopeStatus = async (
  checkedAt: string,
): Promise<WhatsappProviderStatusRow> => {
  const apiKey = getEnv('VITE_PERISKOPE_API_KEY');
  const phone = getEnv('VITE_PERISKOPE_PHONE_NUMBER');

  if (!apiKey || !phone) {
    return { checked_at: checkedAt, provider: 'periskope', status: 'ERROR' };
  }

  try {
    const baseUrl =
      getEnv('VITE_PERISKOPE_API_BASE_URL') || 'https://api.periskope.app/v1';
    const response = await fetch(`${baseUrl.replace(/\/$/, '')}/phones`, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'x-phone': phone,
      },
    });
    if (!response.ok) throw new Error('Periskope status request failed.');

    const data = (await response.json()) as { wa_state?: string };
    return {
      checked_at: checkedAt,
      provider: 'periskope',
      status:
        data.wa_state?.toUpperCase() === 'CONNECTED'
          ? 'CONNECTED'
          : 'DISCONNECTED',
    };
  } catch {
    return { checked_at: checkedAt, provider: 'periskope', status: 'ERROR' };
  }
};

const getMaytapiStatus = async (
  checkedAt: string,
): Promise<WhatsappProviderStatusRow> => {
  const apiKey = getEnv('VITE_MAYTAPI_API_KEY');
  const productId = getEnv('VITE_MAYTAPI_PRODUCT_ID');
  const phoneId = getEnv('VITE_MAYTAPI_PHONE_ID');

  if (!apiKey || !productId || !phoneId) {
    return { checked_at: checkedAt, provider: 'maytapi', status: 'ERROR' };
  }

  try {
    const baseUrl =
      getEnv('VITE_MAYTAPI_API_BASE_URL') || 'https://api.maytapi.com/api';
    const response = await fetch(
      `${baseUrl.replace(/\/$/, '')}/${encodeURIComponent(
        productId,
      )}/${encodeURIComponent(phoneId)}/status`,
      { headers: { 'x-maytapi-key': apiKey } },
    );
    if (!response.ok) throw new Error('Maytapi status request failed.');

    const data = (await response.json()) as {
      status?: { loggedIn?: boolean };
    };
    return {
      checked_at: checkedAt,
      provider: 'maytapi',
      status: data.status?.loggedIn ? 'CONNECTED' : 'DISCONNECTED',
    };
  } catch {
    return { checked_at: checkedAt, provider: 'maytapi', status: 'ERROR' };
  }
};

export const checkWhatsappProviderStatus = async (): Promise<
  WhatsappProviderStatusRow[]
> => {
  const checkedAt = new Date().toISOString();
  return Promise.all([
    getPeriskopeStatus(checkedAt),
    getMaytapiStatus(checkedAt),
  ]);
};
