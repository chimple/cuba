import React from "react";
import { Fab } from "@mui/material";
import { FileUploadOutlined } from "@mui/icons-material";

const UploadButton: React.FC<{ onClick: () => void }> = ({ onClick }) => {
  const fabGreenStyle = {
    color: "white",
    bgcolor: "#7c5db0",
    position: "fixed",
    bottom: "100px",
    right: "25px",
    zIndex: "1000",
    "&:hover": {
      transform: "scale(1.1)",
      bgcolor: "#7c5db0"
    },
  };
  return (
    <Fab className="custom-fab" onClick={onClick} sx={fabGreenStyle}>
      <FileUploadOutlined/>
    </Fab>
  );
};

export default UploadButton;
