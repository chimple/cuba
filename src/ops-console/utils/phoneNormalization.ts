export const normalizeIndianPhone10 = (
  raw: string | null | undefined,
): string | null => {
  let digits = String(raw ?? '').replace(/\D/g, '');

  if (!digits) return null;
  if (digits.length === 12 && digits.startsWith('91')) digits = digits.slice(2);
  if (digits.length === 11 && digits.startsWith('0')) digits = digits.slice(1);
  if (digits.length !== 10) return null;
  if (!/^[6-9]\d{9}$/.test(digits)) return null;

  return digits;
};

export const normalizePhone10 = (raw: string | null | undefined): string =>
  normalizeIndianPhone10(raw) ?? '';

export const formatSmsReadyIndianPhone = (
  canonicalPhone10: string | null | undefined,
): string | null => {
  const normalized = normalizeIndianPhone10(canonicalPhone10);
  return normalized ? `91${normalized}` : null;
};

export const parseIndianPhoneInput = (
  input: string,
): {
  normalizedPhones: string[];
  duplicates: string[];
  invalid: string[];
} => {
  const tokens = input
    .replace(/,/g, '\n')
    .split(/\r?\n/)
    .map((value) => value.trim())
    .filter(Boolean);

  const normalizedPhones: string[] = [];
  const duplicates: string[] = [];
  const invalid: string[] = [];
  const seen = new Set<string>();

  tokens.forEach((token) => {
    const normalized = normalizeIndianPhone10(token);
    if (!normalized) {
      invalid.push(token);
      return;
    }
    if (seen.has(normalized)) {
      duplicates.push(normalized);
      return;
    }
    seen.add(normalized);
    normalizedPhones.push(normalized);
  });

  return {
    normalizedPhones,
    duplicates,
    invalid,
  };
};
