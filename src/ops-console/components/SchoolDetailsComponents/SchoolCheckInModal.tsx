import React, { useState, useEffect } from 'react';
import './SchoolCheckInModal.css';
import { IoClose } from 'react-icons/io5';
import { IoLocationOutline, IoTimeOutline } from 'react-icons/io5';

interface SchoolCheckInModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  status: 'check_in' | 'check_out';
  schoolName: string;
  isFirstTime?: boolean;
  schoolLocation?: { lat: number; lng: number };
}

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

  // Use provided school location or fallback to dummy
  const targetLocation = {
    lat: schoolLocation?.lat ?? 28.5244,
    lng: schoolLocation?.lng ?? 77.0855,
    address1: "Gautam Buddha Nagar, Uttar Pradesh",
    address2: "Block: Noida, Cluster: Noida-East",
  };

  // Mockup requirement to show warning for outside premises
  // In a real scenario, this would compare user location vs targetLocation
  const isInsidePremises = false; 

  useEffect(() => {
    if (open) {
      const timer = setInterval(() => setCurrentDate(new Date()), 1000);
      return () => clearInterval(timer);
    }
  }, [open]);

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

  // OpenStreetMap Embed URL
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
                      <span className="location-coords-label">Coordinates: </span>
                      {targetLocation.lat.toFixed(4)}° N, {targetLocation.lng.toFixed(4)}° E
                  </div>
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
          {!isInsidePremises && isCheckIn && (
            <div className="check-in-warning-banner">
              You're not within the school premises, are sure you want to continue checking in
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
