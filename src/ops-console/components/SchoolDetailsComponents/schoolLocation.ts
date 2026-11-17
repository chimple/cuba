export type SchoolCoordinates = { lat: number; lng: number };

// Prefer the place's coordinates to the map camera position in Google Maps URLs.
export function parseSchoolLocation(
  link?: string | null,
): SchoolCoordinates | null {
  if (!link?.trim()) return null;
  try {
    const url = new URL(link.trim());
    if (!['https:', 'http:'].includes(url.protocol)) return null;
    const decoded = decodeURIComponent(url.href);
    const place = decoded.match(
      /!3d([+-]?\d+(?:\.\d+)?)!4d([+-]?\d+(?:\.\d+)?)/,
    );
    const pair = /^\s*([+-]?\d+(?:\.\d+)?)\s*,\s*([+-]?\d+(?:\.\d+)?)\s*$/;
    const query = ['query', 'q', 'll']
      .map((key) => url.searchParams.get(key)?.match(pair))
      .find(Boolean);
    const camera = decoded.match(/@([+-]?\d+(?:\.\d+)?),([+-]?\d+(?:\.\d+)?)/);
    const match = place || query || camera;
    if (!match) return null;
    const lat = Number(match[1]);
    const lng = Number(match[2]);
    return Number.isFinite(lat) &&
      Number.isFinite(lng) &&
      Math.abs(lat) <= 90 &&
      Math.abs(lng) <= 180
      ? { lat, lng }
      : null;
  } catch {
    return null;
  }
}

export function formatSchoolCoordinates({ lat, lng }: SchoolCoordinates) {
  return `${Math.abs(lat).toFixed(4)}° ${lat < 0 ? 'S' : 'N'}, ${Math.abs(lng).toFixed(4)}° ${lng < 0 ? 'W' : 'E'}`;
}

const addresses = new Map<string, Promise<string>>();

// Share lookups between the card and dialog, including React's repeated mounts.
export function getSchoolLocationAddress(
  location: SchoolCoordinates,
): Promise<string> {
  const key = `${location.lat},${location.lng}`;
  const cached = addresses.get(key);
  if (cached) return cached;
  const request = (async () => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    try {
      const params = new URLSearchParams({
        format: 'jsonv2',
        lat: String(location.lat),
        lon: String(location.lng),
      });
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?${params}`,
        {
          signal: controller.signal,
        },
      );
      if (!response.ok) throw new Error('Address lookup failed');
      const result: { display_name?: unknown } = await response.json();
      if (
        typeof result.display_name !== 'string' ||
        !result.display_name.trim()
      ) {
        throw new Error('Address not found');
      }
      return result.display_name.trim();
    } finally {
      clearTimeout(timeout);
    }
  })();
  addresses.set(key, request);
  void request.catch(() => addresses.delete(key));
  return request;
}
