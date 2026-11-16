import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import SchoolLocationCard from './SchoolLocationCard';

jest.mock('i18next', () => ({ t: (value: string) => value }));
jest.mock('./SchoolLocationMap', () => ({
  __esModule: true,
  default: () => <div data-testid="school-map" />,
}));

describe('SchoolLocationCard', () => {
  const originalFetch = global.fetch;
  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('does not render or fetch without a location link', () => {
    const fetchMock = jest.fn();
    global.fetch = fetchMock;
    render(
      <SchoolLocationCard
        id="school-overview-location"
        className="school-overview-location"
        schoolName="School"
      />,
    );
    expect(screen.queryByText('Address & Location')).not.toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('shows the fetched address and opens a dialog with saved coordinates', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ display_name: 'Fetched School Road' }),
    });
    render(
      <SchoolLocationCard
        id="school-overview-location"
        className="school-overview-location"
        schoolName="Example School"
        locationLink="https://www.google.com/maps?q=14,74"
      />,
    );
    expect(await screen.findByText('Fetched School Road')).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole('button', { name: 'Open school location' }),
    );
    expect(
      screen.getByRole('dialog', { name: 'School Location' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Example School')).toBeInTheDocument();
    expect(screen.getByRole('dialog')).toHaveTextContent(
      'Coordinates: 14.0000° N, 74.0000° E',
    );
    expect(screen.getByTestId('school-map')).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole('button', { name: 'Close school location' }),
    );
    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
    );
  });

  it('keeps the map available after an address failure and allows retry', async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce({ ok: false })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ display_name: 'Retried address' }),
      });
    render(
      <SchoolLocationCard
        id="school-overview-location"
        className="school-overview-location"
        schoolName="School"
        locationLink="https://www.google.com/maps?q=15,75"
      />,
    );
    expect(
      await screen.findByText('Address not available. Please try again.'),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Open school location' }),
    ).toBeEnabled();
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(await screen.findByText('Retried address')).toBeInTheDocument();
  });

  it('does not fetch or open an incorrect map for a shortened link', () => {
    global.fetch = jest.fn();
    render(
      <SchoolLocationCard
        id="school-overview-location"
        className="school-overview-location"
        schoolName="School"
        locationLink="https://maps.app.goo.gl/example"
      />,
    );
    expect(
      screen.getByText('Unable to read coordinates from this location link.'),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Open school location' }),
    ).toBeDisabled();
    expect(global.fetch).not.toHaveBeenCalled();
  });
});
