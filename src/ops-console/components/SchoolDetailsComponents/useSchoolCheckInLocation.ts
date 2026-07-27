import { useEffect, useMemo, useState } from 'react';
import { t } from 'i18next';
import { Geolocation } from '@capacitor/geolocation';
import { Capacitor } from '@capacitor/core';
import { ServiceConfig } from '../../../services/ServiceConfig';
import { SchoolVisitAction } from '../../../common/constants';
import {
  parseCommunityVisitParentsCount,
  shouldShowCommunityVisitParentsField,
  validateCommunityVisitParentsCount,
} from './communityVisitParentsField';
import logger from '../../../utility/logger';
import type { LatLng, SchoolCheckInModalProps, TargetLocation } from './SchoolCheckInModal.types';
import {
  calculateDistance,
  LOCATION_TIMEOUT_MS,
  MAX_DISTANCE_METERS,
} from './schoolCheckInUtils';

export function useSchoolCheckInLocation({
  open,
  onConfirm,
  status,
  visitType,
  schoolId,
  schoolLocation,
  schoolAddress,
  onLocationUpdated,
}: Pick<
  SchoolCheckInModalProps,
  | 'open'
  | 'onConfirm'
  | 'status'
  | 'visitType'
  | 'schoolId'
  | 'schoolLocation'
  | 'schoolAddress'
  | 'onLocationUpdated'
>) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [userLocation, setUserLocation] = useState<LatLng | null>(null);
  const [distance, setDistance] = useState<number | null>(null);
  const [isInsidePremises, setIsInsidePremises] = useState<boolean>(true);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isSchoolLocationMissing, setIsSchoolLocationMissing] =
    useState<boolean>(false);
  const [isUpdatingLocation, setIsUpdatingLocation] = useState<boolean>(false);
  const [isPermissionDenied, setIsPermissionDenied] = useState<boolean>(false);
  const [retryTrigger, setRetryTrigger] = useState<number>(0);
  const [isSubmittingAction, setIsSubmittingAction] = useState<boolean>(false);
  const [isConfirmedInSchool, setIsConfirmedInSchool] = useState<
    boolean | null
  >(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState<boolean>(true);
  const [isLocationLoadTimeoutReached, setIsLocationLoadTimeoutReached] =
    useState<boolean>(false);
  const [locationLoadCycle, setLocationLoadCycle] = useState<number>(0);
  const [userAddress, setUserAddress] = useState<string | null>(null);
  const [communityVisitParentsValue, setCommunityVisitParentsValue] =
    useState<string>('');
  const [communityVisitParentsError, setCommunityVisitParentsError] = useState<
    string | null
  >(null);
  const showCommunityVisitParentsField = shouldShowCommunityVisitParentsField(
    status,
    visitType,
  );

  useEffect(() => {
    if (!open) {
      setCommunityVisitParentsValue('');
      setCommunityVisitParentsError(null);
      return;
    }
    if (!showCommunityVisitParentsField) {
      setCommunityVisitParentsValue('');
      setCommunityVisitParentsError(null);
    }
  }, [open, showCommunityVisitParentsField]);

  useEffect(() => {
    const fetchAddress = async () => {
      if (userLocation) {
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${userLocation.lat}&lon=${userLocation.lng}`,
          );
          const data = await response.json();
          if (data && data.display_name) {
            setUserAddress(data.display_name);
          }
        } catch (error) {
          logger.error('Failed to fetch address', error);
        }
      }
    };
    fetchAddress();
  }, [userLocation]);

  const targetLocation = useMemo<TargetLocation>(() => {
    if (
      schoolLocation &&
      (schoolLocation.lat || schoolLocation.lat === 0) &&
      (schoolLocation.lng || schoolLocation.lng === 0)
    ) {
      return {
        lat: schoolLocation.lat,
        lng: schoolLocation.lng,
        address1: schoolAddress || t('Please set the school address.'),
      };
    }
    return {
      lat: 0,
      lng: 0,
      address1: userAddress || t('Fetching User Address...'),
      address2: t('Please set school location'),
      isMissing: true,
    };
  }, [schoolAddress, schoolLocation, userAddress]);
  const isTargetLocationMissing = Boolean(targetLocation.isMissing);

  useEffect(() => {
    setIsSchoolLocationMissing(isTargetLocationMissing);
  }, [isTargetLocationMissing]);

  useEffect(() => {
    if (!open) return;
    setIsLoadingLocation(true);
    setIsLocationLoadTimeoutReached(false);
    setLocationLoadCycle((prev) => prev + 1);
    const timer = setInterval(() => setCurrentDate(new Date()), 1000);
    let watcherId: string | number | null = null;
    let isMounted = true;
    let hasReceivedLocation = false;

    const startWatching = async () => {
      if (!open) return;
      setIsLoadingLocation(true);
      setLocationError(null);
      setIsPermissionDenied(false);
      setUserLocation(null);
      setDistance(null);

      try {
        const isWeb = Capacitor.getPlatform() === 'web';
        if (!isWeb) {
          const permissionStatus = await Geolocation.checkPermissions();
          if (permissionStatus.location !== 'granted') {
            const requestStatus = await Geolocation.requestPermissions();
            if (requestStatus.location !== 'granted') {
              if (isMounted) {
                setLocationError('Location permission denied.');
                setIsPermissionDenied(true);
                setIsInsidePremises(false);
                setIsLoadingLocation(false);
              }
              return;
            }
          }
        }

        const successHandler = (position: any) => {
          if (!isMounted) return;
          hasReceivedLocation = true;
          setIsLoadingLocation(false);
          setLocationError(null);
          const userLat = position.coords.latitude;
          const userLng = position.coords.longitude;
          setUserLocation({ lat: userLat, lng: userLng });
          if (isTargetLocationMissing) {
            setDistance(0);
            setIsInsidePremises(true);
          } else {
            const dist = calculateDistance(
              userLat,
              userLng,
              targetLocation.lat,
              targetLocation.lng,
            );
            setDistance(dist);
            setIsInsidePremises(dist <= MAX_DISTANCE_METERS);
          }
        };

        if (isWeb) {
          if ('geolocation' in navigator) {
            const handleWebError = (err: GeolocationPositionError) => {
              logger.warn('Web Geolocation High Accuracy Error', err);
              if (err.code === 1 || err.message?.includes('denied')) {
                setIsPermissionDenied(true);
                setLocationError('Location permission denied.');
                setIsLoadingLocation(false);
                setIsInsidePremises(false);
                return;
              }
              if (watcherId !== null)
                navigator.geolocation.clearWatch(watcherId as number);
              logger.info('Web: Falling back to low accuracy...');
              const fallbackId = navigator.geolocation.watchPosition(
                successHandler,
                (fallbackErr) => {
                  logger.error('Web Fallback Error', fallbackErr);
                  if (
                    fallbackErr.code === 1 ||
                    fallbackErr.message?.includes('denied')
                  ) {
                    setIsPermissionDenied(true);
                    setLocationError('Location permission denied.');
                  } else if (!hasReceivedLocation) {
                    setLocationError(
                      'Could not retrieve location. Please check browser permissions or network.',
                    );
                  }
                  setIsLoadingLocation(false);
                  setIsInsidePremises(false);
                },
                { enableHighAccuracy: false, timeout: 30000, maximumAge: 0 },
              );
              watcherId = fallbackId;
            };
            watcherId = navigator.geolocation.watchPosition(
              successHandler,
              handleWebError,
              { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
            );
          } else {
            setLocationError('Geolocation is not supported by this browser.');
            setIsLoadingLocation(false);
            setIsInsidePremises(false);
          }
        } else {
          const id = await Geolocation.watchPosition(
            { enableHighAccuracy: true, timeout: 20000, maximumAge: 3000 },
            (position, err) => {
              if (!isMounted) return;
              if (err) {
                logger.warn('High accuracy watch error', err);
                if (err.code === 1 || err.message?.includes('denied')) {
                  setIsPermissionDenied(true);
                  setLocationError('Location permission denied.');
                  setIsLoadingLocation(false);
                  return;
                }
                if (watcherId !== null)
                  Geolocation.clearWatch({ id: watcherId as string });
                logger.info('Falling back to low accuracy...');
                Geolocation.watchPosition(
                  { enableHighAccuracy: false, timeout: 20000, maximumAge: 3000 },
                  (fallbackPos, fallbackErr) => {
                    if (!isMounted) return;
                    if (fallbackErr) {
                      logger.error('Fallback watch error', fallbackErr);
                      if (
                        fallbackErr.code === 1 ||
                        fallbackErr.message?.includes('denied')
                      ) {
                        setIsPermissionDenied(true);
                        setLocationError('Location permission denied.');
                        setIsLoadingLocation(false);
                        return;
                      }
                      if (!hasReceivedLocation) {
                        setLocationError(
                          'Could not retrieve location. Please check GPS settings.',
                        );
                        setIsLoadingLocation(false);
                      }
                      return;
                    }
                    successHandler(fallbackPos);
                  },
                ).then((fallbackId) => {
                  if (isMounted) watcherId = fallbackId;
                });
                return;
              }
              successHandler(position);
            },
          );
          if (isMounted) watcherId = id;
          else Geolocation.clearWatch({ id });
        }
      } catch (error: any) {
        logger.error('Error starting location watch', error);
        if (isMounted) {
          if (error?.code === 1 || error?.message?.includes('denied')) {
            setIsPermissionDenied(true);
            setLocationError('Location permission denied.');
          } else {
            setLocationError(
              'Could not start location tracking. Please check your GPS settings.',
            );
          }
          setIsLoadingLocation(false);
          setIsInsidePremises(false);
        }
      }
    };

    startWatching();
    return () => {
      isMounted = false;
      clearInterval(timer);
      if (watcherId !== null) {
        if (Capacitor.getPlatform() === 'web') {
          navigator.geolocation.clearWatch(watcherId as number);
        } else {
          Geolocation.clearWatch({ id: watcherId as string });
        }
      }
    };
  }, [
    open,
    targetLocation.lat,
    targetLocation.lng,
    isTargetLocationMissing,
    retryTrigger,
  ]);

  useEffect(() => {
    if (!open) {
      setIsLocationLoadTimeoutReached(false);
      return;
    }
    const timeoutId = setTimeout(() => {
      setIsLocationLoadTimeoutReached(true);
    }, LOCATION_TIMEOUT_MS);
    return () => clearTimeout(timeoutId);
  }, [open, locationLoadCycle]);

  const handleRetryLocation = async () => {
    setIsLoadingLocation(true);
    setIsLocationLoadTimeoutReached(false);
    setLocationLoadCycle((prev) => prev + 1);
    setLocationError(null);
    setIsPermissionDenied(false);
    setUserLocation(null);
    setDistance(null);
    try {
      const isWeb = Capacitor.getPlatform() === 'web';
      if (!isWeb) {
        const requestStatus = await Geolocation.requestPermissions();
        if (requestStatus.location !== 'granted') {
          setIsPermissionDenied(true);
          setLocationError('Location permission denied.');
          setIsLoadingLocation(false);
          return;
        }
      }
      setRetryTrigger((prev) => prev + 1);
    } catch (e: any) {
      logger.error('Retry failed', e);
      if (e?.code === 1 || e?.message?.includes('denied')) {
        setIsPermissionDenied(true);
        setLocationError('Location permission denied.');
      } else {
        setLocationError('Unable to fetch location. Please try again.');
      }
      setIsLoadingLocation(false);
    }
  };

  const handleUpdateSchoolLocation = async () => {
    if (!userLocation || !schoolId) return;
    setIsUpdatingLocation(true);
    try {
      const api = ServiceConfig.getI().apiHandler;
      await api.updateSchoolLocation(
        schoolId,
        userLocation.lat,
        userLocation.lng,
      );
      setIsSchoolLocationMissing(false);
      if (onLocationUpdated) onLocationUpdated();
      return true;
    } catch (error) {
      logger.error('Failed to update school location', error);
      setLocationError('Failed to update school location.');
      return false;
    } finally {
      setIsUpdatingLocation(false);
    }
  };

  const onConfirmAction = async () => {
    const validationError = validateCommunityVisitParentsCount(
      visitType,
      communityVisitParentsValue,
    );
    if (showCommunityVisitParentsField && validationError) {
      setCommunityVisitParentsError(validationError);
      return;
    }
    const numberOfParents = showCommunityVisitParentsField
      ? (parseCommunityVisitParentsCount(communityVisitParentsValue) ??
        undefined)
      : undefined;
    setIsSubmittingAction(true);
    try {
      if (isSchoolLocationMissing) {
        if (isConfirmedInSchool === true) {
          const success = await handleUpdateSchoolLocation();
          if (success) {
            await onConfirm(
              userLocation?.lat,
              userLocation?.lng,
              0,
              numberOfParents,
            );
          }
        } else {
          await onConfirm(
            userLocation?.lat,
            userLocation?.lng,
            undefined,
            numberOfParents,
          );
        }
      } else {
        await onConfirm(
          userLocation?.lat,
          userLocation?.lng,
          distance ?? undefined,
          numberOfParents,
        );
      }
    } finally {
      setIsSubmittingAction(false);
    }
  };

  const isCheckIn = status === SchoolVisitAction.CheckIn;
  const hasValidCoordinates =
    userLocation !== null &&
    Number.isFinite(userLocation.lat) &&
    Number.isFinite(userLocation.lng);
  const hasAddressLine1Data =
    Boolean(userAddress?.trim()) || Boolean(schoolAddress?.trim());
  const hasAddressLine2Data =
    isSchoolLocationMissing ||
    targetLocation.address2 === undefined ||
    Boolean(targetLocation.address2);
  const isAddressInfoReady = hasAddressLine1Data && hasAddressLine2Data;
  const isLocationPending = isLoadingLocation && !isLocationLoadTimeoutReached;
  const isAddressPending =
    hasValidCoordinates && !isLocationLoadTimeoutReached && !isAddressInfoReady;
  const communityVisitParentsValidationError =
    showCommunityVisitParentsField &&
    validateCommunityVisitParentsCount(visitType, communityVisitParentsValue);
  const isConfirmDisabled =
    isLocationPending ||
    isAddressPending ||
    isUpdatingLocation ||
    isSubmittingAction ||
    Boolean(communityVisitParentsValidationError) ||
    (isSchoolLocationMissing && isConfirmedInSchool === undefined) ||
    isPermissionDenied ||
    !hasValidCoordinates;

  return {
    communityVisitParentsError,
    communityVisitParentsValue,
    currentDate,
    distance,
    handleRetryLocation,
    isCheckIn,
    isConfirmDisabled,
    isConfirmedInSchool,
    isInsidePremises,
    isLoadingLocation,
    isPermissionDenied,
    isSchoolLocationMissing,
    isSubmittingAction,
    isUpdatingLocation,
    locationError,
    onConfirmAction,
    setCommunityVisitParentsError,
    setCommunityVisitParentsValue,
    setIsConfirmedInSchool,
    showCommunityVisitParentsField,
    targetLocation,
    userAddress,
    userLocation,
  };
}
