import {
  formatSchoolCoordinates,
  getSchoolLocationAddress,
  parseSchoolLocation,
} from './schoolLocation';

describe('parseSchoolLocation', () => {
  it.each([
    ['https://www.google.com/maps?q=12.9716,77.5946', 12.9716, 77.5946],
    [
      'https://www.google.com/maps/search/?api=1&query=-12.5%2C-77.5',
      -12.5,
      -77.5,
    ],
    ['https://maps.google.com/?ll=0,0', 0, 0],
    ['https://www.google.com/maps/@12,77,15z', 12, 77],
    ['https://www.google.com/maps/@10,20,15z/data=!3d12!4d77', 12, 77],
  ])('extracts the school coordinates from %s', (link, lat, lng) => {
    expect(parseSchoolLocation(link)).toEqual({ lat, lng });
  });

  it.each([
    null,
    '',
    'invalid',
    'javascript:alert(1)',
    'https://maps.app.goo.gl/example',
    'https://maps.google.com/?q=91,20',
    'https://maps.google.com/?q=12,181',
    'https://maps.google.com/?q=School',
  ])('rejects links without valid coordinates: %s', (link) => {
    expect(parseSchoolLocation(link)).toBeNull();
  });

  it('formats negative coordinates with the correct hemispheres', () => {
    expect(formatSchoolCoordinates({ lat: -12.5, lng: -77.5 })).toBe(
      '12.5000° S, 77.5000° W',
    );
  });
});

describe('getSchoolLocationAddress', () => {
  const originalFetch = global.fetch;
  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('fetches an address by coordinates and shares repeated lookups', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ display_name: 'School Road, India' }),
    });
    global.fetch = fetchMock;
    const first = getSchoolLocationAddress({ lat: 11, lng: 72 });
    const second = getSchoolLocationAddress({ lat: 11, lng: 72 });
    expect(second).toBe(first);
    await expect(first).resolves.toBe('School Road, India');
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const url = new URL(fetchMock.mock.calls[0][0]);
    expect(url.searchParams.get('lat')).toBe('11');
    expect(url.searchParams.get('lon')).toBe('72');
  });

  it('allows retry after a failed lookup', async () => {
    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce({ ok: false })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ display_name: 'Recovered address' }),
      });
    global.fetch = fetchMock;
    await expect(
      getSchoolLocationAddress({ lat: 13, lng: 73 }),
    ).rejects.toThrow();
    await expect(getSchoolLocationAddress({ lat: 13, lng: 73 })).resolves.toBe(
      'Recovered address',
    );
  });
});
