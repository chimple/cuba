import { Box, IconButton, Tooltip, Typography } from '@mui/material';
import { InfoOutlined } from '@mui/icons-material';
import type { FC } from 'react';
import { useTranslation } from 'react-i18next';

const WhatsappIntegrationStatusInfo: FC = () => {
  const { t } = useTranslation();

  return (
    <Tooltip
      arrow
      placement="bottom-end"
      slotProps={{
        popper: {
          modifiers: [
            { name: 'flip', options: { padding: 16 } },
            { name: 'preventOverflow', options: { padding: 16 } },
          ],
        },
        tooltip: {
          className: 'whatsapp-integration-status-info-tooltip-surface',
          sx: {
            maxWidth: 420,
            padding: 2,
            color: '#121619',
            backgroundColor: '#ffffff',
            border: '1px solid #d1d5db',
            borderRadius: 1,
            boxShadow: '0 8px 24px rgba(18, 22, 25, 0.18)',
            opacity: 1,
          },
        },
        arrow: { sx: { color: '#ffffff' } },
      }}
      title={
        <Box className="whatsapp-integration-status-info-tooltip">
          <Typography
            className="whatsapp-integration-status-info-tooltip-title"
            variant="subtitle2"
          >
            {t('WhatsApp status information')}
          </Typography>
          <Typography variant="body2">
            <strong>{t('School not WhatsApp enabled')}</strong> —{' '}
            {t('WhatsApp is not enabled for this school.')}
          </Typography>
          <Typography variant="body2">
            <strong>{t('Class not linked')}</strong> —{' '}
            {t(
              'WhatsApp is enabled for the school, but no class is linked to Ops Console. The Ops user can paste the WhatsApp group link to connect the class.',
            )}
          </Typography>
          <Typography variant="body2">
            <strong className="whatsapp-integration-status-yes-label">
              {t('Yes – Class linked')}
            </strong>{' '}
            — {t('The class is linked and connected to Periskope or Maytapi.')}
          </Typography>
          <Typography variant="body2">
            <strong>{t('No – Number/Bot not in group')}</strong> —{' '}
            {t(
              'The class is linked, but the Periskope or Maytapi number/bot is not connected to the WhatsApp group.',
            )}
          </Typography>
        </Box>
      }
    >
      <IconButton
        className="whatsapp-integration-status-info-button"
        aria-label={String(t('WhatsApp integration status information'))}
        size="small"
      >
        <InfoOutlined fontSize="small" />
      </IconButton>
    </Tooltip>
  );
};

export default WhatsappIntegrationStatusInfo;
