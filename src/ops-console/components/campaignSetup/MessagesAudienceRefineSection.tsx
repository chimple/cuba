import React from 'react';
import { Box, FormControl, MenuItem, Select, Typography } from '@mui/material';
import { SelectChangeEvent } from '@mui/material';
import { useTranslation } from 'react-i18next';
import type { useMessagesAudienceSelection } from '../../hooks/useMessagesAudienceSelection';

type Audience = ReturnType<typeof useMessagesAudienceSelection>;

type Props = {
  audience: Audience;
  onUserTypeChange: (event: SelectChangeEvent<string>) => void;
  onActivityRecencyChange: (event: SelectChangeEvent<string>) => void;
};

const refineOptions = [
  { label: 'Student', value: 'student' },
  { label: 'Teacher', value: 'teacher' },
  { label: 'Principal', value: 'principal' },
] as const;

const MessagesAudienceRefineSection: React.FC<Props> = ({
  audience,
  onUserTypeChange,
  onActivityRecencyChange,
}) => {
  const { t } = useTranslation();

  return (
    <Box className="messages-page__refine-section">
      <Typography variant="h6" className="messages-page__section-title">
        {t('Refine Audience')}
      </Typography>
      <Typography className="messages-page__section-subtitle">
        {t(
          'Narrow the selected audience using these filters. All selections combine automatically.',
        )}
      </Typography>

      <Box className="messages-page__refine-grid">
        <Box className="messages-page__field">
          <Typography className="messages-page__field-label">
            {t('User Type')}
          </Typography>
          <FormControl fullWidth>
            <Select
              value={audience.userType}
              onChange={onUserTypeChange}
              size="small"
            >
              {refineOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {t(option.label)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        {audience.userType !== 'principal' && (
          <Box className="messages-page__field">
            <Typography className="messages-page__field-label">
              {t('Activity Recency')}
            </Typography>
            <FormControl fullWidth>
              <Select
                value={audience.activityRecency}
                onChange={onActivityRecencyChange}
                size="small"
              >
                <MenuItem value="all">{t('All')}</MenuItem>
                <MenuItem value="active_7d">
                  {t('Active within last 7 days')}
                </MenuItem>
                <MenuItem value="inactive_7d">
                  {t('Inactive within last 7 days')}
                </MenuItem>
              </Select>
            </FormControl>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default MessagesAudienceRefineSection;
