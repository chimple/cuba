import React, { useState, useEffect } from 'react';
import './SchoolCheckInModal.css';
import { IoClose } from 'react-icons/io5';
import { IoLocationOutline, IoTimeOutline } from 'react-icons/io5';

import { Geolocation } from '@capacitor/geolocation';
import { ServiceConfig } from '../../../services/ServiceConfig';


// Leaflet Imports
import { MapContainer, TileLayer, Marker, Popup, useMap, Circle, Polyline } from 'react-leaflet';
import L from 'leaflet';
import { useMemo } from 'react';

// Fix for default marker icon issues in Leaflet with React
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

interface SchoolCheckInModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  status: 'check_in' | 'check_out';
  schoolName: string;
  isFirstTime?: boolean;
  schoolId?: string; // Add schoolId
  schoolLocation?: { lat: number; lng: number };
  onLocationUpdated?: () => void;
}

const MAX_DISTANCE_METERS = 300; // Allowed radius in meters

// Component to handle auto-fitting bounds
const MapBoundsFitter = ({ schoolLoc, userLoc }: { schoolLoc: { lat: number; lng: number }; userLoc: { lat: number; lng: number } | null }) => {
    const map = useMap();
  
    useEffect(() => {
      if (userLoc) {
        // Deconstruct to ensure effective dependency change only on value change
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
  isFirstTime = false,
  schoolId, // Add schoolId prop
  schoolLocation,
  onLocationUpdated,
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [userLocation, setUserLocation] = useState<{ lat: number, lng: number } | null>(null);
  const [distance, setDistance] = useState<number | null>(null);
  const [isInsidePremises, setIsInsidePremises] = useState<boolean>(true); // Default true to avoid flash of warning
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isSchoolLocationMissing, setIsSchoolLocationMissing] = useState<boolean>(false);
  const [isUpdatingLocation, setIsUpdatingLocation] = useState<boolean>(false);

  // Use provided school location or fallback to dummy
  // Use provided school location or fallback to dummy
  const targetLocation = useMemo(() => {
    // If we have valid coordinates, use them.
    // NOTE: This check depends on how schoolLocation is passed when missing.
    // If it's undefined or lat/lng are 0 or null, we treat as missing.
    if (schoolLocation && (schoolLocation.lat || schoolLocation.lat === 0) && (schoolLocation.lng || schoolLocation.lng === 0)) {
      console.log("School Location001", schoolLocation);
        return {
            lat: schoolLocation.lat,
            lng: schoolLocation.lng,
            address1: "School Location",
            address2: "",
        };
    }
    // Fallback/Missing State
    return {
        lat: 28.5244, // Default (Noida)
        lng: 77.0855,
        address1: "Location not set", // Indicating missing location
        address2: "Please set location",
        isMissing: true // Flag to trigger update UI
    };
  }, [schoolLocation]);

  useEffect(() => {
      // Check if location is effectively missing (flagged in memo)
      if ((targetLocation as any).isMissing) {
          setIsSchoolLocationMissing(true);
      } else {
          setIsSchoolLocationMissing(false);
      }
  }, [targetLocation]);

  // UI State for "Are you sure?" toggle
  const [isConfirmedInSchool, setIsConfirmedInSchool] = useState<boolean | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState<boolean>(true);

  useEffect(() => {
    if (open) {
      setIsLoadingLocation(true);
      const timer = setInterval(() => setCurrentDate(new Date()), 1000);

      const fetchLocation = async () => {
        try {
            const permissionStatus = await Geolocation.checkPermissions();
            if (permissionStatus.location !== 'granted') {
                const requestStatus = await Geolocation.requestPermissions();
                if (requestStatus.location !== 'granted') {
                    setLocationError("Location permission denied.");
                    setIsInsidePremises(false);
                    return;
                }
            }

            let position;
            try {
                // Try High Accuracy first with 10s timeout
                position = await Geolocation.getCurrentPosition({ 
                    enableHighAccuracy: true, 
                    timeout: 10000, 
                    maximumAge: 0 
                });
            } catch (err) {
                console.warn("High accuracy location failed, falling back to cached/low accuracy", err);
                try {
                    // Fallback: Accept any cached location (Infinity) or low accuracy
                    position = await Geolocation.getCurrentPosition({ 
                        enableHighAccuracy: false, 
                        timeout: 10000,
                        maximumAge: Infinity 
                    });
                } catch (fallbackErr) {
                    console.error("Fallback location also failed", fallbackErr);
                    throw fallbackErr;
                }
            }

            if (position) {
                const userLat = position.coords.latitude;
                const userLng = position.coords.longitude;

                setUserLocation({ lat: userLat, lng: userLng });
                console.log("User Location0001", userLat, userLng);

                const dist = calculateDistance(userLat, userLng, targetLocation.lat, targetLocation.lng);
                setDistance(dist);
                setIsInsidePremises(dist <= MAX_DISTANCE_METERS);
            }
        } catch (error) {
            console.error("Error getting location", error);
            setLocationError("Could not retrieve location. Please check your GPS settings.");
            setIsInsidePremises(false);
        } finally {
            setIsLoadingLocation(false);
        }
      };

      fetchLocation();

      return () => clearInterval(timer);
    }
  }, [open, targetLocation.lat, targetLocation.lng]);

  const handleUpdateSchoolLocation = async () => {
    if (!userLocation || !schoolId) return;
    setIsUpdatingLocation(true);
    try {
        const api = ServiceConfig.getI().apiHandler; // Access apiHandler
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
          const success = await handleUpdateSchoolLocation();
          if (success) {
            onConfirm();
          }
      } else {
          onConfirm();
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

  const isCheckIn = status === 'check_in';
  
  // Disable if loading location, OR if missing location and NOT confirmed YES
  const isConfirmDisabled = isLoadingLocation || (isSchoolLocationMissing && isConfirmedInSchool !== true) || isUpdatingLocation;

  return (
    <div className="check-in-modal-overlay" onClick={onClose}>
      <div className="check-in-modal-container" onClick={(e) => e.stopPropagation()}>
        
        {/* Header */}
        <div className="check-in-modal-header">
          <h2 className="check-in-modal-title">
            {isCheckIn ? 'Confirm Check-In' : 'Confirm Check-Out'}
          </h2>
          <button className="check-in-modal-close" onClick={onClose}>
            <IoClose />
          </button>
        </div>

        {/* Content */}
        <div className="check-in-modal-content">
          
          {/* Location Card */}
          <div className="check-in-card">
              <div className="check-in-icon-wrapper">
                 <IoLocationOutline />
              </div>
              <div className="check-in-card-content">
                  <div className="location-name">{schoolName || "XYZ School"}</div>
                  
                  {/* Hide address addresses if school location missing? Or keep name/address but hide coords/distance */}
                  <div className="location-detail-text">{targetLocation.address1}</div>
                   <div className="location-detail-text">{targetLocation.address2}</div>
                  
                  {!isSchoolLocationMissing && (
                    <>
                        <div className="location-detail-text" style={{ marginTop: '8px' }}>
                            <span className="location-coords-label">School Coords: </span>
                            {targetLocation.lat.toFixed(4)}° N, {targetLocation.lng.toFixed(4)}° E
                        </div>
                        {distance !== null && !isLoadingLocation && (
                            <div className="location-detail-text" style={{ marginTop: '4px', color: isInsidePremises ? 'green' : 'red' }}>
                                Distance: {Math.round(distance)} meters away
                            </div>
                        )}
                    </>
                  )}
                  
                  {isLoadingLocation && (
                      <div className="location-detail-text" style={{ marginTop: '4px', color: '#666' }}>
                          <i>Fetching your location...</i>
                      </div>
                  )}
              </div>
          </div>

          {/* Time Card */}
          <div className="check-in-card">
              <div className="check-in-icon-wrapper">
                  <IoTimeOutline />
              </div>
              <div className="check-in-card-content">
                  <div className="date-text">{formatDate(currentDate)}</div>
                  <div className="time-text">{formatTime(currentDate)}</div>
              </div>
          </div>

          {/* Map Widget */}
          <div className="map-container" style={{ height: '200px', width: '100%', borderRadius: '12px', overflow: 'hidden' }}>
             <MapContainer
                center={userLocation ? [userLocation.lat, userLocation.lng] : [targetLocation.lat, targetLocation.lng]}
                zoom={15}
                style={{ height: '100%', width: '100%' }}
             >
                <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                
                {/* Only fit bounds if we have school location. If missing, just follow user? */}
                {!isSchoolLocationMissing && (
                     <MapBoundsFitter schoolLoc={targetLocation} userLoc={userLocation} />
                )}
                {isSchoolLocationMissing && userLocation && (
                     <MapBoundsFitter schoolLoc={{ lat: userLocation.lat, lng: userLocation.lng }} userLoc={null} /> 
                )}


                {/* School Radius & Connection Line - Only if School Location VALID */}
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
                        <Marker position={[targetLocation.lat, targetLocation.lng]}>
                            <Popup>School Location</Popup>
                        </Marker>
                    </>
                )}

                {/* User Location Marker */}
                {userLocation && (
                    <Marker position={[userLocation.lat, userLocation.lng]}>
                         <Popup>
                            Your Location
                        </Popup>
                    </Marker>
                )}
             </MapContainer>
          </div>
          
           {/* Confirmation Prompt - Only if School Location Missing */}
           {isSchoolLocationMissing && (
               <div className="check-in-confirmation-section">
                   <div className="confirmation-question">Are you sure you're in the school?</div>
                   <div className="radio-options-container">
                       <label className="radio-option">
                           <input 
                                type="radio" 
                                name="school-confirm"
                                checked={isConfirmedInSchool === true} 
                                onChange={() => setIsConfirmedInSchool(true)} 
                           /> 
                           <span>Yes</span>
                       </label>
                       <label className="radio-option">
                           <input 
                                type="radio" 
                                name="school-confirm"
                                checked={isConfirmedInSchool === false} 
                                onChange={() => setIsConfirmedInSchool(false)} 
                           /> 
                           <span>No</span>
                       </label>
                   </div>
               </div>
           )}

        </div>

        {/* Footer Actions */}
        <div className="check-in-modal-actions">
            <button className="check-in-btn btn-cancel" onClick={onClose}>
              Cancel
            </button>
            <button 
              className={`check-in-btn btn-confirm ${isConfirmDisabled ? 'disabled' : ''}`}
              onClick={isConfirmDisabled ? undefined : onConfirmAction}
              disabled={isConfirmDisabled}
            >
              {isLoadingLocation || isUpdatingLocation ? 'Locating...' : (isCheckIn ? 'Confirm Check-In' : 'Confirm Check-Out')}
            </button>
        </div>
      </div>
    </div>
  );
};

export default SchoolCheckInModal;
