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
          awardedAt: '2026-06-28T00:00:00.000Z',
        }}
      />,
    );

    // The artwork chooses the rank-specific SVG supplied by campaignCompetition.
    expect(screen.getByAltText('Campaign reward: 2')).toHaveAttribute(
      'src',
      '/assets/campaignCompetition/Campaign rank2 t2.svg',
    );
    // Dates are rendered in the certificate's compact reference format.
    expect(screen.getByText('28-06-2026')).toBeInTheDocument();
    // The revised artwork intentionally omits the student's printed name.
    expect(screen.queryByText(/Awarded to/i)).not.toBeInTheDocument();
  });
});
