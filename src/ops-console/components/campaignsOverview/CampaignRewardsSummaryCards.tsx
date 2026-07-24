import React from 'react';
import { Box, Typography, useMediaQuery } from '@mui/material';
import CampaignsOverviewInfoTooltip from './CampaignsOverviewInfoTooltip';
import type { CampaignRewardSummaryCard } from './CampaignRewardsReport.helpers';

interface CampaignRewardsSummaryCardsProps {
  cards: CampaignRewardSummaryCard[];
}

const CampaignRewardsSummaryCards: React.FC<
  CampaignRewardsSummaryCardsProps
> = ({ cards }) => {
  const isMobile = useMediaQuery('(max-width:600px)', {
    defaultMatches: false,
    noSsr: true,
  });

  return (
    <Box
      display="grid"
      gridTemplateColumns="repeat(auto-fit, minmax(150px, 1fr))"
      gap={1.5}
    >
      {cards.map((card) => (
        <Box
          key={card.key}
          sx={{
            border: '1px solid #DDE1E6',
            borderRadius: '8px',
            background: card.key === 'totalStudents' ? '#F8FAFD' : '#EFF6FF',
            minHeight: 86,
            px: 1.5,
            py: 1.25,
            position: 'relative',
          }}
        >
          <Box position="absolute" top={10} right={10}>
            <CampaignsOverviewInfoTooltip
              alignment="right"
              color="#1a71f6"
              label={card.label}
              message={card.info}
            />
          </Box>

          {!isMobile ? (
            <Typography
              sx={{
                color: '#667085',
                fontSize: 11,
                fontWeight: 500,
                lineHeight: '16px',
                mb: 0.5,
                textAlign: 'left',
              }}
            >
              {card.label}
            </Typography>
          ) : null}

          <Box display="flex" alignItems="baseline" gap={0.75} flexWrap="wrap">
            <Typography
              sx={{
                color: '#121619',
                fontSize: 28,
                fontWeight: 700,
                lineHeight: '30px',
              }}
            >
              {card.count}
            </Typography>
            {card.percent !== null ? (
              <Typography
                sx={{
                  color: '#1A71F6',
                  fontSize: 22,
                  fontWeight: 700,
                  lineHeight: '26px',
                }}
              >
                {card.percent}%
              </Typography>
            ) : null}
          </Box>

          {isMobile ? (
            <Typography
              sx={{
                color: '#667085',
                fontSize: 10,
                fontWeight: 700,
                lineHeight: '16px',
                mt: 0.75,
                textAlign: 'left',
              }}
            >
              {card.label}
            </Typography>
          ) : null}
        </Box>
      ))}
    </Box>
  );
};

export default CampaignRewardsSummaryCards;
