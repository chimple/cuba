import { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Typography,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { t } from 'i18next';
import InfoCard from '../InfoCard';
import SchoolLocationMap from './SchoolLocationMap';
import {
  formatSchoolCoordinates,
  getSchoolLocationAddress,
  parseSchoolLocation,
} from './schoolLocation';
import './SchoolLocationCard.css';

type Props = {
  id: string;
  className: string;
  schoolName: string;
  locationLink?: string | null;
};

export default function SchoolLocationCard({
  id,
  className,
  schoolName,
  locationLink,
}: Props) {
  const location = useMemo(
    () => parseSchoolLocation(locationLink),
    [locationLink],
  );
  const [open, setOpen] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [lookup, setLookup] = useState<{
    key: string;
    address?: string;
    failed?: boolean;
  }>();
  const key = location ? `${location.lat},${location.lng}` : '';

  useEffect(() => {
    if (!location) return;
    let active = true;
    setLookup({ key });
    getSchoolLocationAddress(location).then(
      (address) => {
        if (active) setLookup({ key, address });
      },
      () => {
        if (active) setLookup({ key, failed: true });
      },
    );
    return () => {
      active = false;
    };
  }, [location, key, attempt]);

  useEffect(() => {
    setOpen(false);
  }, [locationLink]);

  if (!locationLink?.trim()) return null;

  const address = !location
    ? t('Unable to read coordinates from this location link.')
    : lookup?.key === key && lookup.address
      ? lookup.address
      : lookup?.key === key && lookup.failed
        ? t('Address not available. Please try again.')
        : t('Fetching address...');
  const addressContent = (suffix: string) => (
    <>
      <Typography
        variant="body2"
        className="school-location-address"
        aria-live="polite"
      >
        {address}
      </Typography>
      {location &&
        lookup?.key === key &&
        lookup.failed &&
        (suffix === 'card' ? (
          <Button
            id="school-location-retry-card"
            className="school-location-retry-card"
            size="small"
            onClick={() => setAttempt((value) => value + 1)}
          >
            {t('Retry')}
          </Button>
        ) : (
          <Button
            id="school-location-retry-dialog"
            className="school-location-retry-dialog"
            size="small"
            onClick={() => setAttempt((value) => value + 1)}
          >
            {t('Retry')}
          </Button>
        ))}
    </>
  );

  return (
    <Box id={id} className={className}>
      <InfoCard
        id="school-location-card"
        title={t('Address & Location')}
        className="school-location-card"
        hideDivider
        headerAction={
          <IconButton
            id="school-location-open"
            className="school-location-open"
            aria-label={t('Open school location') ?? 'Open school location'}
            title={t('Open Location') ?? 'Open Location'}
            size="small"
            disabled={!location}
            onClick={() => setOpen(true)}
          >
            <OpenInNewIcon fontSize="small" />
          </IconButton>
        }
      >
        <Typography variant="caption" className="school-location-label">
          {t('Full Address')}
        </Typography>
        {addressContent('card')}
      </InfoCard>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        aria-labelledby="school-location-title"
        className="school-location-dialog"
        maxWidth={false}
      >
        <DialogTitle
          id="school-location-title"
          className="school-location-title"
        >
          {t('School Location')}
          <IconButton
            id="school-location-close"
            className="school-location-close"
            aria-label={t('Close school location') ?? 'Close school location'}
            onClick={() => setOpen(false)}
            size="small"
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>
        <DialogContent className="school-location-content">
          <Box className="school-location-details">
            <svg
              className="school-location-pin"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M19 9c0 5-7 11-7 11S5 14 5 9a7 7 0 1 1 14 0Z" />
              <circle cx="12" cy="9" r="2.5" />
              <path d="M5 22h14" />
            </svg>
            <Box className="school-location-description">
              <Typography className="school-location-name">
                {schoolName}
              </Typography>
              {addressContent('dialog')}
              {location && (
                <Typography
                  variant="caption"
                  className="school-location-coordinates"
                >
                  <strong>{t('Coordinates')}:</strong>{' '}
                  {formatSchoolCoordinates(location)}
                </Typography>
              )}
            </Box>
          </Box>
          {open && location && <SchoolLocationMap location={location} />}
        </DialogContent>
      </Dialog>
    </Box>
  );
}
