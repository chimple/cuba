import React from "react";
import { Box, TextField } from "@mui/material";
import { t } from "i18next";
import "./EditSchoolSection.css";

interface EditSchoolSectionProps {
  name: string;
  state: string;
  district: string;
  city: string;
  UDISE_ID?: string;
  onNameChange: (value: string) => void;
  onStateChange: (value: string) => void;
  onDistrictChange: (value: string) => void;
  onCityChange: (value: string) => void;
  onUDISE_IDChange?: (value: string) => void;
}

const EditSchoolSection: React.FC<EditSchoolSectionProps> = ({
  name,
  state,
  district,
  city,
  UDISE_ID,
  onNameChange,
  onStateChange,
  onDistrictChange,
  onCityChange,
  onUDISE_IDChange
}) => {
  return (
    <div className="profile-card-div">
      <div className={"edit-profile-card"}>
        <div className="school-div-3">{t("School Address")}</div>
        <TextField
          label="Name"
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          fullWidth
          margin="normal"
          variant="standard"
        />
        <TextField
          label="State"
          value={state}
          onChange={(e) => onStateChange(e.target.value)}
          fullWidth
          margin="normal"
          variant="standard"
        />
        <TextField
          label="District"
          value={district}
          onChange={(e) => onDistrictChange(e.target.value)}
          fullWidth
          margin="normal"
          variant="standard"
        />
        <TextField
          label="City"
          value={city}
          onChange={(e) => onCityChange(e.target.value)}
          fullWidth
          margin="normal"
          variant="standard"
        />
        <TextField
          label="UDISE ID (optional)"
          value={UDISE_ID||""}
          onChange={(e) =>{ if (onUDISE_IDChange) onUDISE_IDChange(e.target.value); }}
          fullWidth
          margin="normal"
          variant="standard"
        />
      </div>
    </div>
  );
};

export default EditSchoolSection;
