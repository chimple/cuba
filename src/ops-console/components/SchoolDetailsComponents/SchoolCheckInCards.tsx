import { t } from 'i18next';
import { Capacitor } from '@capacitor/core';
import { IoLocationOutline, IoTimeOutline } from 'react-icons/io5';
import type { LatLng, TargetLocation } from './SchoolCheckInModal.types';
import { formatCheckInDate, formatCheckInTime } from './schoolCheckInUtils';

type SchoolCheckInCardsProps = {
  currentDate: Date;
  distance: number | null;
  handleRetryLocation: () => void;
  isInsidePremises: boolean;
  isLoadingLocation: boolean;
  isPermissionDenied: boolean;
  locationError: string | null;
  targetLocation: TargetLocation;
  userAddress: string | null;
  userLocation: LatLng | null;
};

export default function SchoolCheckInCards({
  currentDate,
  distance,
  handleRetryLocation,
  isInsidePremises,
  isLoadingLocation,
  isPermissionDenied,
  locationError,
  targetLocation,
  userAddress,
  userLocation,
}: SchoolCheckInCardsProps) {
  return (
    <>
      <div id="check-in-location-card" className="check-in-card">
        <div
          id="check-in-location-icon-wrapper"
          className="check-in-icon-wrapper"
        >
          <IoLocationOutline />
        </div>
        <div id="check-in-location-content" className="check-in-card-content">
          <div id="check-in-school-name" className="location-name">
            {t('Current Location')}
          </div>
          <div id="check-in-address-1" className="location-detail-text">
            {userAddress || targetLocation.address1}
          </div>
          <div id="check-in-address-2" className="location-detail-text">
            {targetLocation.address2}
          </div>
          {userLocation && (
            <div
              id="check-in-user-coords"
              className="location-detail-text location-coords-wrapper"
            >
              <span className="location-coords-label">
                {t('User Coordinates')}:{' '}
              </span>
              {userLocation.lat.toFixed(4)}° N, {userLocation.lng.toFixed(4)}° E
            </div>
          )}
          {distance !== null && !isLoadingLocation && (
            <div
              id="check-in-distance"
              className={`location-detail-text distance-text ${isInsidePremises ? 'inside' : 'outside'}`}
            >
              {t('Distance')}: {Math.round(distance)} {t('meters away')}
            </div>
          )}
          {isLoadingLocation && (
            <div
              id="check-in-loading-location"
              className="location-detail-text fetching-location-text"
            >
              <i>{t('Fetching your location...')}</i>
            </div>
          )}
          {isPermissionDenied || locationError ? (
            <div
              id="check-in-permission-denied-section"
              className="permission-denied-container"
            >
              <div
                id="check-in-permission-error-msg"
                className="permission-error-text"
              >
                {isPermissionDenied
                  ? Capacitor.getPlatform() === 'web'
                    ? t('Please Enable Location Permission')
                    : t('Location permission denied')
                  : t('Unable to fetch location. Please try again.')}
              </div>
              {Capacitor.getPlatform() !== 'web' && (
                <button
                  id="check-in-retry-permission-btn"
                  className="retry-permission-btn"
                  onClick={handleRetryLocation}
                >
                  {isPermissionDenied
                    ? t('Enable Location')
                    : t('Retry Location')}
                </button>
              )}
            </div>
          ) : null}
        </div>
      </div>

      <div id="check-in-time-card" className="check-in-card">
        <div id="check-in-time-icon-wrapper" className="check-in-icon-wrapper">
          <IoTimeOutline />
        </div>
        <div id="check-in-time-content" className="check-in-card-content">
          <div id="check-in-date-text" className="date-text">
            {formatCheckInDate(currentDate)}
          </div>
          <div id="check-in-time-text" className="time-text">
            {formatCheckInTime(currentDate)}
          </div>
        </div>
      </div>
    </>
  );
}
