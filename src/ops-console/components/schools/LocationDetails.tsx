import React, { useEffect, useState } from "react";
import "./LocationDetails.css";
import { t } from "i18next";
import { ServiceConfig } from "../../../services/ServiceConfig";

interface LocationDetailsProps {
  fullAddress: string;
}

const LocationDetails: React.FC<LocationDetailsProps> = ({ fullAddress }) => {
  return (
    <div className="location-details-container">
      <div className="location-details-header">
        <h2 className="location-details-title">{t("Address & Location")}</h2>
      </div>
      <hr className="location-details-divider" />
      <div className="location-details-content">
        <p className="location-details-label">{t("Full Address")}</p>
        <p className="location-details-value">{fullAddress}</p>
      </div>
    </div>
  );
};

interface LocationDetailsSectionProps {
  id: string;
}

const LocationDetailsSection: React.FC<LocationDetailsSectionProps> = ({
  id,
}) => {
  const [fullAddress, setFullAddress] = useState<string>("");

  useEffect(() => {
    async function fetchAddress() {
      const api = ServiceConfig.getI().apiHandler;
      const data = await api.getSchoolById(id);
      if (data?.address) {
        setFullAddress(data.address);
      }
    }
    fetchAddress();
  }, [id]);

  if (!fullAddress) return <div>Loading address...</div>;

  return <LocationDetails fullAddress={fullAddress} />;
};

export default LocationDetailsSection;
