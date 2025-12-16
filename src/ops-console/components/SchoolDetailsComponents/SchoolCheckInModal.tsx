import React, { useState, useEffect } from 'react';
import './SchoolCheckInModal.css';
import { IoClose } from 'react-icons/io5';
import { IoLocationOutline, IoTimeOutline } from 'react-icons/io5';

import { Geolocation } from '@capacitor/geolocation';

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
  const targetLocation = {
    lat: schoolLocation?.lat ?? 28.5244,
    lng: schoolLocation?.lng ?? 77.0855,
    address1: "Gautam Buddha Nagar, Uttar Pradesh",
    address2: "Block: Noida, Cluster: Noida-East",
  };

  useEffect(() => {
    if (open) {
      // 1. Start Clock
      const timer = setInterval(() => setCurrentDate(new Date()), 1000);

      // 2. Fetch User Location using Capacitor Geolocation
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

            const position = await Geolocation.getCurrentPosition({ enableHighAccuracy: true });
            const userLat = position.coords.latitude;
            const userLng = position.coords.longitude;
            setUserLocation({ lat: userLat, lng: userLng });

            // 3. Calculate Distance
            const dist = calculateDistance(userLat, userLng, targetLocation.lat, targetLocation.lng);
            setDistance(dist);
            setIsInsidePremises(dist <= MAX_DISTANCE_METERS);
        } catch (error) {
            console.error("Error getting location", error);
            setLocationError("Unable to retrieve your location.");
            setIsInsidePremises(false);
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

  // OpenStreetMap Embed URL - Standard: Show School Center
  const mapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${targetLocation.lng - 0.01},${targetLocation.lat - 0.01},${targetLocation.lng + 0.01},${targetLocation.lat + 0.01}&layer=mapnik&marker=${targetLocation.lat},${targetLocation.lng}`;

  const isCheckIn = status === 'check_in';

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
                  {distance !== null && (
                      <div className="location-detail-text" style={{ marginTop: '4px', color: isInsidePremises ? 'green' : 'red' }}>
                          Distance: {Math.round(distance)} meters away
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
          <div className="map-container">
               <iframe 
                 title="Map"
                 className="map-iframe"
                 src={mapUrl}
               ></iframe>
          </div>

          {/* Warning State */}
          {(!isInsidePremises && isCheckIn) && (
            <div className="check-in-warning-banner">
              {locationError ? `Warning: ${locationError}` : "You're not within the school premises (300m), are you sure you want to continue checking in?"}
            </div>
          )}
          
        </div>

        {/* Footer Actions */}
        <div className="check-in-modal-actions">
            <button className="check-in-btn btn-cancel" onClick={onClose}>
              Cancel
            </button>
            <button 
              className="check-in-btn btn-confirm"
              onClick={onConfirm}
            >
              {isCheckIn ? 'Confirm Check-In' : 'Confirm Check-Out'}
            </button>
        </div>
      </div>
    </div>
  );
};

export default SchoolCheckInModal;
