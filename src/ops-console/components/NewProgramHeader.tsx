import { Box, Link, Typography } from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import NotificationsIcon from '@mui/icons-material/Notifications';
import { Link as RouterLink } from 'react-router-dom';
import { t } from 'i18next';
import { PAGES } from '../../common/constants';

export default function NewProgramHeader() {
  return (
    <Box mb={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center">
        <Typography color="text.primary" variant="h4" fontWeight="bold">
          {t('New Program')}
        </Typography>
        <NotificationsIcon sx={{ color: 'text.secondary', cursor: 'pointer' }} />
      </Box>

      <Box display="flex" alignItems="center" mt={1}>
        <Link
          component={RouterLink}
          to={PAGES.SIDEBAR_PAGE + PAGES.PROGRAM_PAGE}
          variant="body2"
          color="primary"
          underline="none"
        >
          <Typography variant="body2" color="text.secondary">
            {t('Programs')}
          </Typography>
        </Link>
        <PlayArrowIcon
          fontSize="small"
          sx={{ mx: 0.5, color: 'text.secondary' }}
        />
        <Typography variant="body2" color="text.secondary" fontWeight="bold">
          {t('New Program')}
        </Typography>
      </Box>
    </Box>
  );
}
