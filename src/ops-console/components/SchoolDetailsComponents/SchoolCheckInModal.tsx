import React, { useState, useEffect } from 'react';
import './SchoolCheckInModal.css';
import { IoClose } from 'react-icons/io5';
import { IoLocationOutline, IoTimeOutline } from 'react-icons/io5';

import { Geolocation } from '@capacitor/geolocation';

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
  schoolLocation?: { lat: number; lng: number };
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
  schoolLocation,
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [userLocation, setUserLocation] = useState<{ lat: number, lng: number } | null>(null);
  const [distance, setDistance] = useState<number | null>(null);
  const [isInsidePremises, setIsInsidePremises] = useState<boolean>(true); // Default true to avoid flash of warning
  const [locationError, setLocationError] = useState<string | null>(null);

  // Use provided school location or fallback to dummy
  const targetLocation = useMemo(() => ({
    lat: schoolLocation?.lat ?? 28.5244,
    lng: schoolLocation?.lng ?? 77.0855,
    address1: "Gautam Buddha Nagar, Uttar Pradesh",
    address2: "Block: Noida, Cluster: Noida-East",
  }), [schoolLocation]);




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
                // Try High Accuracy first with 10s timeout (increased from 5s)
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
                    throw fallbackErr; // Throw to outer catch to handle UI state
                }
            }

            if (position) {
                const userLat = position.coords.latitude;
                const userLng = position.coords.longitude;

                setUserLocation({ lat: userLat, lng: userLng });

                const dist = calculateDistance(userLat, userLng, targetLocation.lat, targetLocation.lng);
                setDistance(dist);
                setIsInsidePremises(dist <= MAX_DISTANCE_METERS);
            }
        } catch (error) {
            console.error("Error getting location", error);
            setLocationError("Could not retrieve location. Please check your GPS settings.");
            // Even if location fails, we allow check-in but mark as outside premises
            setIsInsidePremises(false);
        } finally {
            setIsLoadingLocation(false);
        }
      };

      fetchLocation();

      return () => clearInterval(timer);
    }
  }, [open, targetLocation.lat, targetLocation.lng]);

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
  // User removed UI for confirmation, so we only block on loading now
  const isConfirmDisabled = isLoadingLocation;

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
                  <div className="location-detail-text">{targetLocation.address1}</div>
                   <div className="location-detail-text">{targetLocation.address2}</div>
                  <div className="location-detail-text" style={{ marginTop: '8px' }}>
                      <span className="location-coords-label">School Coords: </span>
                      {targetLocation.lat.toFixed(4)}° N, {targetLocation.lng.toFixed(4)}° E
                  </div>
                  {distance !== null && !isLoadingLocation && (
                      <div className="location-detail-text" style={{ marginTop: '4px', color: isInsidePremises ? 'green' : 'red' }}>
                          Distance: {Math.round(distance)} meters away
                      </div>
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
                center={[targetLocation.lat, targetLocation.lng]}
                zoom={15}
                style={{ height: '100%', width: '100%' }}
             >
                <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                
                <MapBoundsFitter schoolLoc={targetLocation} userLoc={userLocation} />

                {/* 300m Radius Circle */}
                <Circle 
                    center={[targetLocation.lat, targetLocation.lng]}
                    radius={MAX_DISTANCE_METERS}
                    pathOptions={{ color: 'green', fillColor: 'green', fillOpacity: 0.1 }}
                />

                {/* Connection Line */}
                {userLocation && (
                    <Polyline 
                        positions={[
                            [targetLocation.lat, targetLocation.lng],
                            [userLocation.lat, userLocation.lng]
                        ]}
                        pathOptions={{ color: 'red', dashArray: '5, 10', weight: 2 }}
                    />
                )}

                {/* School Marker */}
                <Marker position={[targetLocation.lat, targetLocation.lng]}>
                    <Popup>
                        School Location
                    </Popup>
                </Marker>

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
          
        </div>

        {/* Footer Actions */}
        <div className="check-in-modal-actions">
            <button className="check-in-btn btn-cancel" onClick={onClose}>
              Cancel
            </button>
            <button 
              className={`check-in-btn btn-confirm ${isConfirmDisabled ? 'disabled' : ''}`}
              onClick={isConfirmDisabled ? undefined : onConfirm}
              disabled={isConfirmDisabled}
            >
              {isLoadingLocation ? 'Locating...' : (isCheckIn ? 'Confirm Check-In' : 'Confirm Check-Out')}
            </button>
        </div>
      </div>
    </div>
  );
};

export default SchoolCheckInModal;
