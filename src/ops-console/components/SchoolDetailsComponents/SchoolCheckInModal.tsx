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
        try {
            const isWeb = Capacitor.getPlatform() === 'web';
            
            if (!isWeb) {
                const permissionStatus = await Geolocation.checkPermissions();
                if (permissionStatus.location !== 'granted') {
                    const requestStatus = await Geolocation.requestPermissions();
                    if (requestStatus.location !== 'granted') {
                        if (isMounted) {
                            setLocationError("Location permission denied.");
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
                    const id = navigator.geolocation.watchPosition(successHandler, (err) => {
                        console.error("Web Geolocation Error", err);
                        if (isLoadingLocation) {
                             setLocationError("Could not retrieve location. Please check browser permissions.");
                             setIsLoadingLocation(false);
                             setIsInsidePremises(false);
                        }
                    }, {
                        enableHighAccuracy: true,
                        timeout: 20000,
                        maximumAge: 0
                    });
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

        } catch (error) {
            console.error("Error starting location watch", error);
            if (isMounted) {
                setLocationError("Could not start location tracking. Please check your GPS settings.");
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
  }, [open, targetLocation.lat, targetLocation.lng]);

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
  
  const isConfirmDisabled = isLoadingLocation || (isSchoolLocationMissing && isConfirmedInSchool === undefined) || isUpdatingLocation;

  return (
    <div className="schoolcheckinmodal check-in-modal-overlay" onClick={onClose}>
      <div className="check-in-modal-container" onClick={(e) => e.stopPropagation()}>
        
        <div className="check-in-modal-header">
          <h2 className="check-in-modal-title">
            {isCheckIn ? t('Confirm Check-In') : t('Confirm Check-Out')}
          </h2>
          <button id="sc-modal-close-btn" className="check-in-modal-close" onClick={onClose}>
            <IoClose />
          </button>
        </div>

        <div className="check-in-modal-content">
          
          <div id="sc-location-card" className="check-in-card">
              <div className="check-in-icon-wrapper">
                 <IoLocationOutline />
              </div>
              <div className="check-in-card-content">
                  <div className="location-name">{schoolName || "XYZ School"}</div>
                  
                  <div className="location-detail-text">{targetLocation.address1}</div>
                   <div className="location-detail-text">{targetLocation.address2}</div>
                  
                  {!isSchoolLocationMissing && (
                    <>
                        {userLocation && (
                             <div className="location-detail-text location-coords-wrapper">
                                <span className="location-coords-label">{t("User Coordinates")}: </span>
                                {userLocation.lat.toFixed(4)}° N, {userLocation.lng.toFixed(4)}° E
                            </div>
                        )}
                        {distance !== null && !isLoadingLocation && (
                            <div className={`location-detail-text distance-text ${isInsidePremises ? 'inside' : 'outside'}`}>
                                {t("Distance")}: {Math.round(distance)} {t("meters away")}
                            </div>
                        )}
                    </>
                  )}
                  
                  {isLoadingLocation && (
                      <div className="location-detail-text fetching-location-text">
                          <i>{t("Fetching your location...")}</i>
                      </div>
                  )}
              </div>
          </div>

          <div id="sc-time-card" className="check-in-card">
              <div className="check-in-icon-wrapper">
                  <IoTimeOutline />
              </div>
              <div className="check-in-card-content">
                  <div className="date-text">{formatDate(currentDate)}</div>
                  <div className="time-text">{formatTime(currentDate)}</div>
              </div>
          </div>

          <div id="sc-map-container" className="map-container">
             <MapContainer
                center={userLocation ? [userLocation.lat, userLocation.lng] : [targetLocation.lat, targetLocation.lng]}
                zoom={15}
                style={{ height: '100%', width: '100%' }}
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
                                shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
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
               <div id="sc-confirmation-section" className="check-in-confirmation-section">
                   <div className="confirmation-question">{t("Are you sure you're in the school?")}</div>
                   <div className="radio-options-container">
                       <label className="radio-option">
                           <input 
                                id="sc-radio-yes"
                                type="radio" 
                                name="school-confirm"
                                checked={isConfirmedInSchool === true} 
                                onChange={() => setIsConfirmedInSchool(true)} 
                           /> 
                           <span>{t("Yes")}</span>
                       </label>
                       <label className="radio-option">
                           <input 
                                id="sc-radio-no"
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

        <div className="check-in-modal-actions">
            <button id="sc-cancel-btn" className="check-in-btn btn-cancel" onClick={onClose}>
              {t("Cancel")}
            </button>
            <button 
              id="sc-confirm-btn"
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
