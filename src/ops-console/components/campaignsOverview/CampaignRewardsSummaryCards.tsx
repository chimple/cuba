import React from 'react';
import { Box, Typography } from '@mui/material';
import CampaignsOverviewInfoTooltip from './CampaignsOverviewInfoTooltip';
import type { CampaignRewardSummaryCard } from './CampaignRewardsReport.helpers';

interface CampaignRewardsSummaryCardsProps {
  cards: CampaignRewardSummaryCard[];
}

const CampaignRewardsSummaryCards: React.FC<
  CampaignRewardsSummaryCardsProps
> = ({ cards }) => (
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
        }}
      >
        <Box display="flex" alignItems="center" gap={0.75} mb={0.5}>
          <Typography
            sx={{
              color: '#667085',
              fontSize: 11,
              lineHeight: '16px',
            }}
          >
            {card.label}
          </Typography>
          <CampaignsOverviewInfoTooltip
            alignment="left"
            color="#1a71f6"
            label={card.label}
            message={card.info}
          />
        </Box>

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
      </Box>
    ))}
  </Box>
);

export default CampaignRewardsSummaryCards;
