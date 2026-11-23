import { render, screen } from '@testing-library/react';
import CampaignCertificateArtwork from './CampaignCertificateArtwork';

describe('CampaignCertificateArtwork', () => {
  it('renders the selected rank asset and award date without an awarded-to line', () => {
    render(
      <CampaignCertificateArtwork
        certificate={{
          campaignId: 'campaign-1',
          campaignName: 'Summer League',
          studentName: 'Madhavi',
          rank: 2,
          campaignEndDate: '2026-06-28T00:00:00.000Z',
        }}
      />,
    );

    // The fixed viewBox places the selected rank SVG in the same coordinates
    // on every viewport.
    expect(screen.getByTestId('campaign-certificate-rank')).toHaveAttribute(
      'href',
      '/assets/campaignCompetition/Campaign rank2 t2.svg',
    );
    // Dates are rendered in the certificate's compact reference format.
    expect(screen.getByText('28-06-2026')).toBeInTheDocument();
    // The revised artwork intentionally omits the student's printed name.
    expect(screen.queryByText(/Awarded to/i)).not.toBeInTheDocument();
  });

  it('renders the participation artwork and certificate title', () => {
    render(
      <CampaignCertificateArtwork
        certificate={{
          campaignId: 'campaign-participation',
          campaignName: 'Summer League',
          studentName: 'Madhavi',
          rank: 'progress',
          campaignEndDate: '2026-06-28T00:00:00.000Z',
        }}
      />,
    );

    expect(screen.getByTestId('campaign-certificate-rank')).toHaveAttribute(
      'href',
      '/assets/campaignCompetition/Campaign participation t.svg',
    );
    expect(
      screen.getByText('CERTIFICATE OF PARTICIPATION'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Congratulations on participating!'),
    ).toBeInTheDocument();
  });
});
