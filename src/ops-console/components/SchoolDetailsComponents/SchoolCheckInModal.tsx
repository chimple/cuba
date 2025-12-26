import React, { useState, useEffect, useMemo } from 'react';
import { t } from 'i18next';
import './SchoolCheckInModal.css';
import { IoClose } from 'react-icons/io5';
import { IoLocationOutline, IoTimeOutline } from 'react-icons/io5';
import { Geolocation } from '@capacitor/geolocation';
import { Capacitor } from '@capacitor/core';
import { ServiceConfig } from '../../../services/ServiceConfig';
import { MapContainer, TileLayer, Marker, Popup, useMap, Circle, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { SchoolVisitAction } from '../../../common/constants';

import L from 'leaflet';

delete (L.Icon.Default.prototype as any)._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

interface SchoolCheckInModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (lat?: number, lng?: number, distance?: number) => void;
  status: SchoolVisitAction;
  schoolName: string;
  isFirstTime?: boolean;
  schoolId?: string; 
  schoolLocation?: { lat: number; lng: number };
  schoolAddress?: string;
  onLocationUpdated?: () => void;
}

const MAX_DISTANCE_METERS = 1000; 

const MapBoundsFitter = ({ schoolLoc, userLoc }: { schoolLoc: { lat: number; lng: number }; userLoc: { lat: number; lng: number } | null }) => {
    const map = useMap();
  
    useEffect(() => {
      if (userLoc) {
        const bounds = L.latLngBounds([
          [schoolLoc.lat, schoolLoc.lng],
          [userLoc.lat, userLoc.lng]
        ]);
        try {
            map.fitBounds(bounds, { padding: [50, 50] });
        } catch(e) { console.warn("Map fitBounds failed", e); }
      } else {
        map.setView([schoolLoc.lat, schoolLoc.lng], 15);
      }
    }, [schoolLoc.lat, schoolLoc.lng, userLoc?.lat, userLoc?.lng, map]);
  
    return null;
  };

const SchoolCheckInModal: React.FC<SchoolCheckInModalProps> = ({
  open,
  onClose,
  onConfirm,
  status,
  schoolName,
  schoolId,
  schoolLocation,
  schoolAddress,
  onLocationUpdated,
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [distance, setDistance] = useState<number | null>(null);
  const [isInsidePremises, setIsInsidePremises] = useState<boolean>(true); 
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isSchoolLocationMissing, setIsSchoolLocationMissing] = useState<boolean>(false);
  const [isUpdatingLocation, setIsUpdatingLocation] = useState<boolean>(false);
  const [isPermissionDenied, setIsPermissionDenied] = useState<boolean>(false);
  const [retryTrigger, setRetryTrigger] = useState<number>(0);

  const targetLocation = useMemo(() => {
    if (schoolLocation && (schoolLocation.lat || schoolLocation.lat === 0) && (schoolLocation.lng || schoolLocation.lng === 0)) {
        return {
            lat: schoolLocation.lat,
            lng: schoolLocation.lng,
            address1: schoolAddress || t("Please set the school address."),
        };
    }
    // Fallback/Missing State
    return {
        lat: 0,
        lng: 0,
        address1: t("Location not set"),
        address2: t("Please set location"),
        isMissing: true 
    };
  }, [schoolLocation]);

  useEffect(() => {
      if ((targetLocation as any).isMissing) {
          setIsSchoolLocationMissing(true);
      } else {
          setIsSchoolLocationMissing(false);
      }
  }, [targetLocation]);

  const [isConfirmedInSchool, setIsConfirmedInSchool] = useState<boolean | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState<boolean>(true);

  useEffect(() => {
    if (open) {
      setIsLoadingLocation(true);
      const timer = setInterval(() => setCurrentDate(new Date()), 1000);
      let watcherId: string | number | null = null;
      let isMounted = true;

      const startWatching = async () => {
        if (!open) return;
        setIsLoadingLocation(true);
        setLocationError(null);
        setIsPermissionDenied(false); // Reset permission state
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
                            setLocationError("Location permission denied.");
                            setIsPermissionDenied(true);
                            setIsInsidePremises(false);
                            setIsLoadingLocation(false);
                        }
                        return;
                    }
                }
            } else {
            }

            const successHandler = (position: any) => {
                 if (!isMounted) return;
                 setIsLoadingLocation(false);
                 setLocationError(null);
                 
                 const userLat = position.coords.latitude;
                 const userLng = position.coords.longitude;

                 setUserLocation({ lat: userLat, lng: userLng });

                 const dist = calculateDistance(userLat, userLng, targetLocation.lat, targetLocation.lng);
                 setDistance(dist);
                 setIsInsidePremises(dist <= MAX_DISTANCE_METERS);
            };

            if (isWeb) {
                if ('geolocation' in navigator) {
                    const webWatchConfig = {
                        enableHighAccuracy: true,
                        timeout: 10000,
                        maximumAge: 0
                    };

                    const handleWebError = (err: GeolocationPositionError) => {
                         console.warn("Web Geolocation High Accuracy Error", err);
                         
                         // Permission check
                         if (err.code === 1 || err.message?.includes("denied")) {
                             setIsPermissionDenied(true);
                             setLocationError("Location permission denied.");
                             setIsLoadingLocation(false);
                             setIsInsidePremises(false);
                             return;
                         }

                         // Fallback to low accuracy
                         if (watcherId !== null) navigator.geolocation.clearWatch(watcherId as number);
                         
                         console.log("Web: Falling back to low accuracy...");
                         const fallbackId = navigator.geolocation.watchPosition(successHandler, (fallbackErr) => {
                             console.error("Web Fallback Error", fallbackErr);
                             if (fallbackErr.code === 1 || fallbackErr.message?.includes("denied")) {
                                 setIsPermissionDenied(true);
                                 setLocationError("Location permission denied.");
                             } else {
                                if (isLoadingLocation) {
                                     setLocationError("Could not retrieve location. Please check browser permissions or network.");
                                }
                             }
                             setIsLoadingLocation(false);
                             setIsInsidePremises(false);
                         }, {
                             enableHighAccuracy: false,
                             timeout: 30000,
                             maximumAge: 0
                         });
                         watcherId = fallbackId;
                    };

                    const id = navigator.geolocation.watchPosition(successHandler, handleWebError, webWatchConfig);
                    watcherId = id;
                } else {
                    setLocationError("Geolocation is not supported by this browser.");
                    setIsLoadingLocation(false);
                    setIsInsidePremises(false);
                }
            } else {
                const watchConfig = {
                    enableHighAccuracy: true,
                    timeout: 20000,
                    maximumAge: 3000
                };

                // Start watching location continuously (High Accuracy)
                const id = await Geolocation.watchPosition(watchConfig, (position, err) => {
                    if (!isMounted) return;

                    if (err) {
                        console.warn("High accuracy watch error", err);
                        
                        // Check if error is permission denied (code 1)
                        if (err.code === 1 || err.message?.includes("denied")) {
                             if (isMounted) {
                                  setIsPermissionDenied(true);
                                  setLocationError("Location permission denied.");
                                  setIsLoadingLocation(false);
                             }
                             return;
                        }

                        // Fallback to low accuracy
                        if (watcherId !== null) Geolocation.clearWatch({ id: watcherId as string });
                        
                        console.log("Falling back to low accuracy...");
                        Geolocation.watchPosition({
                            enableHighAccuracy: false,
                            timeout: 20000,
                            maximumAge: 3000
                        }, (fallbackPos, fallbackErr) => {
                            if (!isMounted) return;
                            if (fallbackErr) {
                                console.error("Fallback watch error", fallbackErr);
                                // Check permission on fallback too
                                if (fallbackErr.code === 1 || fallbackErr.message?.includes("denied")) {
                                     setIsPermissionDenied(true);
                                     setLocationError("Location permission denied.");
                                     setIsLoadingLocation(false);
                                     return;
                                }

                                if (isLoadingLocation) {
                                    setLocationError("Could not retrieve location. Please check GPS settings.");
                                    setIsLoadingLocation(false);
                                }
                                return;
                            }
                            successHandler(fallbackPos);
                        }).then(fallbackId => {
                            if (isMounted) watcherId = fallbackId;
                        });
                        return;
                    }
                    successHandler(position);
                });

                if (isMounted) {
                    watcherId = id;
                } else {
                    Geolocation.clearWatch({ id });
                }
            }

        } catch (error: any) {
            console.error("Error starting location watch", error);
            if (isMounted) {
                // Check if error is permission denied (code 1)
                if (error?.code === 1 || error?.message?.includes("denied")) {
                     setIsPermissionDenied(true);
                     setLocationError("Location permission denied.");
                } else {
                     setLocationError("Could not start location tracking. Please check your GPS settings.");
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
    }
  }, [open, targetLocation.lat, targetLocation.lng, retryTrigger]);

  const handleRetryLocation = async () => {
    setIsLoadingLocation(true);
    setLocationError(null);
    setIsPermissionDenied(false);
    setUserLocation(null);
    setDistance(null);

    try {
        const isWeb = Capacitor.getPlatform() === 'web';
        if (!isWeb) {
            // Explicitly request permission again if it was denied
            const requestStatus = await Geolocation.requestPermissions();
             if (requestStatus.location !== 'granted') {
                setIsPermissionDenied(true);
                setLocationError("Location permission denied.");
                setIsLoadingLocation(false);
                return;
            }
        }
        // Force re-run of the watcher effect
        setRetryTrigger(prev => prev + 1);
        
    } catch (e: any) {
        console.error("Retry failed", e);
        if (e?.code === 1 || e?.message?.includes("denied")) {
             setIsPermissionDenied(true);
             setLocationError("Location permission denied.");
        } else {
             setLocationError("Unable to fetch location. Please try again."); 
        }
        setIsLoadingLocation(false);
    }
  };

  const handleUpdateSchoolLocation = async () => {
    if (!userLocation || !schoolId) return;
    setIsUpdatingLocation(true);
    try {
        const api = ServiceConfig.getI().apiHandler;
        await api.updateSchoolLocation(schoolId, userLocation.lat, userLocation.lng);
        setIsSchoolLocationMissing(false);
        if (onLocationUpdated) {
            onLocationUpdated();
        }
        return true;
    } catch (error) {
        console.error("Failed to update school location", error);
        setLocationError("Failed to update school location.");
        return false;
    } finally {
        setIsUpdatingLocation(false);
    }
  };

  const onConfirmAction = async () => {
      if (isSchoolLocationMissing) {
        if (isConfirmedInSchool === true) {
            const success = await handleUpdateSchoolLocation();
            if (success) {
              onConfirm(userLocation?.lat, userLocation?.lng, distance ?? undefined);
            }
        } else {
             onConfirm(userLocation?.lat, userLocation?.lng, undefined);
        }
      } else {
          onConfirm(userLocation?.lat, userLocation?.lng, distance ?? undefined);
      }
  };

  // Haversine Formula to calculate distance in meters
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371e3; // metres
    const φ1 = lat1 * Math.PI/180; // φ, λ in radians
    const φ2 = lat2 * Math.PI/180;
    const Δφ = (lat2-lat1) * Math.PI/180;
    const Δλ = (lon2-lon1) * Math.PI/180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    const d = R * c; // in metres
    return d;
  }

  if (!open) return null;

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const isCheckIn = status === SchoolVisitAction.CheckIn;
  
  // Disable confirm check-in if:
  // 1. Location is currently loading/updating
  // 2. School location is missing AND user hasn't confirmed (Yes/No)
  // 3. Permission is explicitly denied
  // 4. User location failed to fetch (userLocation is null) AND not currently loading
  const isConfirmDisabled = isLoadingLocation 
                            || isUpdatingLocation
                            || (isSchoolLocationMissing && isConfirmedInSchool === undefined)
                            || isPermissionDenied
                            || (userLocation === null && !isLoadingLocation);

  return (
    <div id="check-in-modal-overlay" className="schoolcheckinmodal check-in-modal-overlay" onClick={onClose}>
      <div id="check-in-modal-container" className="check-in-modal-container" onClick={(e) => e.stopPropagation()}>
        
        <div id="check-in-modal-header" className="check-in-modal-header">
          <h2 id="check-in-modal-title" className="check-in-modal-title">
            {isCheckIn ? t('Confirm Check-In') : t('Confirm Check-Out')}
          </h2>
          <button id="check-in-modal-close-btn" className="check-in-modal-close" onClick={onClose}>
            <IoClose />
          </button>
        </div>

        <div id="check-in-modal-content" className="check-in-modal-content">
          
          <div id="check-in-location-card" className="check-in-card">
              <div id="check-in-location-icon-wrapper" className="check-in-icon-wrapper">
                 <IoLocationOutline />
              </div>
              <div id="check-in-location-content" className="check-in-card-content">
                  <div id="check-in-school-name" className="location-name">{schoolName || "XYZ School"}</div>
                  
                  <div id="check-in-address-1" className="location-detail-text">{targetLocation.address1}</div>
                   <div id="check-in-address-2" className="location-detail-text">{targetLocation.address2}</div>
                  
                  {!isSchoolLocationMissing && !isPermissionDenied && (
                    <>
                        {userLocation && (
                             <div id="check-in-user-coords" className="location-detail-text location-coords-wrapper">
                                <span className="location-coords-label">{t("User Coordinates")}: </span>
                                {userLocation.lat.toFixed(4)}° N, {userLocation.lng.toFixed(4)}° E
                            </div>
                        )}
                        {distance !== null && !isLoadingLocation && (
                            <div id="check-in-distance" className={`location-detail-text distance-text ${isInsidePremises ? 'inside' : 'outside'}`}>
                                {t("Distance")}: {Math.round(distance)} {t("meters away")}
                            </div>
                        )}
                    </>
                  )}
                  
                  {isLoadingLocation && (
                      <div id="check-in-loading-location" className="location-detail-text fetching-location-text">
                          <i>{t("Fetching your location...")}</i>
                      </div>
                  )}

                  {isPermissionDenied || locationError ? (
                    <div id="check-in-permission-denied-section" className="permission-denied-container">
                        <div id="check-in-permission-error-msg" className="permission-error-text">
                            {isPermissionDenied ? t("Location permission denied") : t("Unable to fetch location. Please try again.")}
                        </div>
                        <button 
                            id="check-in-retry-permission-btn"
                            className="retry-permission-btn" 
                            onClick={handleRetryLocation}
                        >
                            {isPermissionDenied ? t("Enable Location") : t("Retry Location")}
                        </button>
                    </div>
                  ) : null}
              </div>
          </div>

          <div id="check-in-time-card" className="check-in-card">
              <div id="check-in-time-icon-wrapper" className="check-in-icon-wrapper">
                  <IoTimeOutline />
              </div>
              <div id="check-in-time-content" className="check-in-card-content">
                  <div id="check-in-date-text" className="date-text">{formatDate(currentDate)}</div>
                  <div id="check-in-time-text" className="time-text">{formatTime(currentDate)}</div>
              </div>
          </div>

          <div id="check-in-map-container" className="map-container">
             <MapContainer
                center={userLocation ? [userLocation.lat, userLocation.lng] : [targetLocation.lat, targetLocation.lng]}
                zoom={15}
                className="map-leaf-container"
                dragging={false}
                zoomControl={false}
                scrollWheelZoom={false}
                touchZoom={false}
                doubleClickZoom={false}
                keyboard={false}
                boxZoom={false}
             >
                <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                
                {!isSchoolLocationMissing && (
                     <MapBoundsFitter schoolLoc={targetLocation} userLoc={userLocation} />
                )}
                {isSchoolLocationMissing && userLocation && (
                     <MapBoundsFitter schoolLoc={{ lat: userLocation.lat, lng: userLocation.lng }} userLoc={null} /> 
                )}


                {!isSchoolLocationMissing && (
                    <>
                        <Circle 
                            center={[targetLocation.lat, targetLocation.lng]}
                            radius={MAX_DISTANCE_METERS}
                            pathOptions={{ color: 'green', fillColor: 'green', fillOpacity: 0.1 }}
                        />
                        {userLocation && (
                            <Polyline 
                                positions={[
                                    [targetLocation.lat, targetLocation.lng],
                                    [userLocation.lat, userLocation.lng]
                                ]}
                                pathOptions={{ color: 'red', dashArray: '5, 10', weight: 2 }}
                            />
                        )}
                        <Marker 
                            position={[targetLocation.lat, targetLocation.lng]}
                            icon={new L.Icon({
                                iconUrl: require('../../../assets/images/marker-icon-2x-green.png'),
                                shadowUrl: require('../../../assets/images/marker-shadow.png'),
                                iconSize: [30, 41],
                                iconAnchor: [12, 41],
                                popupAnchor: [1, -34],
                                shadowSize: [41, 41]
                            })}
                        >
                            <Popup>{t("School Location")}</Popup>
                        </Marker>
                    </>
                )}

                {userLocation && (
                    <Marker position={[userLocation.lat, userLocation.lng]}>
                         <Popup>
                            {t("Your Location")}
                        </Popup>
                    </Marker>
                )}
             </MapContainer>
          </div>
          
           {isSchoolLocationMissing && (
               <div id="check-in-confirmation-section" className="check-in-confirmation-section">
                   <div id="check-in-confirmation-question" className="confirmation-question">{t("Are you sure you're in the school?")}</div>
                   <div id="check-in-radio-container" className="radio-options-container">
                       <label id="check-in-radio-label-yes" className="radio-option" htmlFor="check-in-radio-yes">
                           <input 
                                id="check-in-radio-yes"
                                type="radio" 
                                name="school-confirm"
                                checked={isConfirmedInSchool === true} 
                                onChange={() => setIsConfirmedInSchool(true)} 
                           /> 
                           <span>{t("Yes")}</span>
                       </label>
                       <label id="check-in-radio-label-no" className="radio-option" htmlFor="check-in-radio-no">
                           <input 
                                id="check-in-radio-no"
                                type="radio" 
                                name="school-confirm"
                                checked={isConfirmedInSchool === false} 
                                onChange={() => setIsConfirmedInSchool(false)} 
                           /> 
                           <span>{t("No")}</span>
                       </label>
                   </div>
               </div>
           )}

        </div>

        <div id="check-in-modal-actions" className="check-in-modal-actions">
            <button id="check-in-cancel-btn" className="check-in-btn btn-cancel" onClick={onClose}>
              {t("Cancel")}
            </button>
            <button 
              id="check-in-confirm-btn"
              className={`check-in-btn btn-confirm ${!isCheckIn ? 'btn-checkout' : ''} ${isConfirmDisabled ? 'disabled' : ''}`}
              onClick={isConfirmDisabled ? undefined : onConfirmAction}
              disabled={isConfirmDisabled}
            >
              {isLoadingLocation || isUpdatingLocation ? t('Locating...') : (isCheckIn ? t('Confirm Check-In') : t('Confirm Check-Out'))}
            </button>
        </div>
      </div>
    </div>
  );


};

export default SchoolCheckInModal;
