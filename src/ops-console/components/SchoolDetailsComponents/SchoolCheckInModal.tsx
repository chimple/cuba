import React, { useState, useEffect } from 'react';
import './SchoolCheckInModal.css';
import { IoClose } from 'react-icons/io5';
import { HiOutlineLocationMarker, HiOutlineClock } from 'react-icons/hi';
// Fallback if Hi icons not available, use Io5
import { IoLocationOutline, IoTimeOutline } from 'react-icons/io5';

interface SchoolCheckInModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  status: 'check_in' | 'check_out';
  schoolName: string;
  isFirstTime?: boolean;
}

const SchoolCheckInModal: React.FC<SchoolCheckInModalProps> = ({
  open,
  onClose,
  onConfirm,
  status,
  schoolName,
  isFirstTime = false,
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  // Dummy Location Data (Fixed for UI demo)
  const dummyLocation = {
    lat: 28.5244,
    lng: 77.0855,
    address1: "Gautam Buddha Nagar, Uttar Pradesh",
    address2: "Block: Noida, Cluster: Noida-East",
    isInsidePremises: false // Set to false to show the warning as per mockup
  };

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
  const mapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${dummyLocation.lng - 0.01},${dummyLocation.lat - 0.01},${dummyLocation.lng + 0.01},${dummyLocation.lat + 0.01}&layer=mapnik&marker=${dummyLocation.lat},${dummyLocation.lng}`;

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
                  <div className="location-detail-text">{dummyLocation.address1}</div>
                   <div className="location-detail-text">{dummyLocation.address2}</div>
                  <div className="location-detail-text" style={{ marginTop: '8px' }}>
                      <span className="location-coords-label">Coordinates: </span>
                      {dummyLocation.lat.toFixed(4)}° N, {dummyLocation.lng.toFixed(4)}° E
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
          {!dummyLocation.isInsidePremises && isCheckIn && (
            <div className="check-in-warning-banner">
              You're not within the school premises, are sure you want to continue checking in
            </div>
          )}
          
           {/* First Time Confirmation - Just an overlay or part of flow? 
               The mockup shows the warning IS the prompt essentially, 
               but if we need a distinct Y/N for "Are you sure you are in school?" 
               we can add it. For now, sticking to the mockup structure which implies 
               the "Confirm" button IS the confirmation.
            */}

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
